"use server";

import { randomUUID } from "crypto";
import { and, desc, eq, gt, lte } from "drizzle-orm";
import { db } from "@/infra/db";
import { memberships, transactions } from "@/infra/db/schema";
import { MembershipRenewalService } from "@/core/services/membership-renewal.service";
import { WalletService } from "@/core/services/wallet.service";
import type { RenewalCandidate } from "@/core/domain/membership";
import type { Transaction } from "@/core/domain/wallet";

const renewalService = new MembershipRenewalService();
const walletService = new WalletService();
const RENEWAL_COST_EUR = 30;

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const window48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // 1. Expire memberships that passed their expiresAt
  const justExpired = await db
    .update(memberships)
    .set({ status: "expired" })
    .where(and(eq(memberships.status, "active"), lte(memberships.expiresAt, now)))
    .returning({ id: memberships.id, userId: memberships.userId });

  // 2. Find active memberships expiring in the next 48h
  const expiringSoon = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.status, "active"),
        gt(memberships.expiresAt, now),
        lte(memberships.expiresAt, window48h),
      ),
    );

  // 3. Build candidates with current wallet balance
  const candidates: RenewalCandidate[] = await Promise.all(
    expiringSoon.map(async (m) => {
      const txRows = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, m.userId));

      const txDomain: Transaction[] = txRows.map((t) => ({
        id: t.id,
        userId: t.userId,
        amount: parseFloat(t.amount),
        type: t.type,
        description: t.description,
        referenceId: t.referenceId ?? undefined,
        checksum: t.checksum,
        createdAt: t.createdAt,
      }));

      return {
        membership: {
          id: m.id,
          userId: m.userId,
          status: m.status,
          expiresAt: m.expiresAt,
          autoRenew: m.autoRenew,
        },
        currentBalance: walletService.computeBalance(txDomain),
        renewalCostEur: RENEWAL_COST_EUR,
      };
    }),
  );

  // 4. Evaluate what to do with each candidate
  const decisions = renewalService.evaluateRenewals(candidates);

  // 5. Execute renewals
  const renewed: string[] = [];
  const skipped: { id: string; reason: string }[] = [];

  for (const decision of decisions) {
    if (decision.action === "renew") {
      const membershipRow = expiringSoon.find((m) => m.id === decision.membershipId)!;
      const newExpiresAt = renewalService.calculateNewExpiry(membershipRow.expiresAt);

      const lastTx = await db
        .select({ checksum: transactions.checksum })
        .from(transactions)
        .where(eq(transactions.userId, decision.userId))
        .orderBy(desc(transactions.createdAt))
        .limit(1);

      const txId = randomUUID();
      const checksum = walletService.generateChecksum(
        {
          id: txId,
          userId: decision.userId,
          amount: decision.cost,
          type: "debit",
          description: "Renovación automática de membresía",
          referenceId: undefined,
        },
        lastTx[0]?.checksum ?? null,
      );

      await db.transaction(async (tx) => {
        await tx.insert(transactions).values({
          id: txId,
          userId: decision.userId,
          amount: decision.cost.toFixed(2),
          type: "debit",
          description: "Renovación automática de membresía",
          checksum,
        });

        await tx
          .update(memberships)
          .set({ status: "active", expiresAt: newExpiresAt })
          .where(eq(memberships.id, decision.membershipId));
      });

      renewed.push(decision.membershipId);
    } else {
      skipped.push({ id: decision.membershipId, reason: decision.reason });
    }
  }

  return Response.json({
    ok: true,
    expired: justExpired.length,
    renewed: renewed.length,
    skipped: skipped.length,
    details: { justExpired, renewed, skipped },
  });
}
