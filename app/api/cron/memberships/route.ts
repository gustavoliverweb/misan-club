"use server";

import { randomUUID } from "crypto";
import { and, eq, gt, lte } from "drizzle-orm";
import { db } from "@/infra/db";
import { memberships, processedExternalOrders, transactions } from "@/infra/db/schema";
import { MembershipRenewalService } from "@/core/services/membership-renewal.service";
import { WalletService } from "@/core/services/wallet.service";
import type { Transaction } from "@/core/domain/wallet";

const renewalService = new MembershipRenewalService();
const walletService = new WalletService();
const RENEWAL_COST_EUR = 30;

// "cron-2026-05-12T10-{membershipId}" — unique per (UTC-hour-slot, membership)
function cronSlot(now: Date, membershipId: string): string {
  const yyyy = now.getUTCFullYear();
  const mm   = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd   = String(now.getUTCDate()).padStart(2, "0");
  const hh   = String(now.getUTCHours()).padStart(2, "0");
  return `cron-${yyyy}-${mm}-${dd}T${hh}-${membershipId}`;
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const window48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // 1. Expire memberships that passed their expiresAt.
  //    UPDATE … SET status='expired' WHERE status='active' is idempotent — a second run
  //    finds nothing matching 'active' that already expired, so it's a no-op.
  const justExpired = await db
    .update(memberships)
    .set({ status: "expired" })
    .where(and(eq(memberships.status, "active"), lte(memberships.expiresAt, now)))
    .returning({ id: memberships.id, userId: memberships.userId });

  // 2. Find active memberships expiring in the next 48h.
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

  const renewed: string[] = [];
  const skipped: { id: string; reason: string }[] = [];

  // 3. Process each membership in an isolated transaction.
  //
  //    Fix A — Race condition: SELECT … FOR UPDATE on the membership row serializes
  //    concurrent cron executions. A second run blocks here until the first commits,
  //    then re-reads the (now-updated) status and skips if the membership is no longer
  //    active. Balance is also read inside the lock so it's consistent.
  //
  //    Fix B — Idempotency: INSERT … ON CONFLICT DO NOTHING into processedExternalOrders
  //    with key "cron-{YYYY-MM-DDTHH}-{membershipId}". The UNIQUE constraint on
  //    externalOrderId means a duplicate run within the same hour-slot returns 0 rows
  //    and the membership is skipped.
  //
  //    A per-membership try/catch ensures one failing membership does not abort the
  //    rest of the batch.
  for (const m of expiringSoon) {
    try {
      const result = await db.transaction(async (tx) => {
        // Lock the membership row — serializes concurrent cron executions.
        const [locked] = await tx
          .select({ id: memberships.id, status: memberships.status })
          .from(memberships)
          .where(eq(memberships.id, m.id))
          .for("update");

        if (!locked || locked.status !== "active") {
          return { action: "skip" as const, reason: "already_inactive" };
        }

        // Idempotency guard: claim the (hour-slot, membership) pair atomically.
        // ON CONFLICT DO NOTHING returns an empty array if the key already exists.
        const claimed = await tx
          .insert(processedExternalOrders)
          .values({
            id: randomUUID(),
            externalOrderId: cronSlot(now, m.id),
            memberId: m.userId,
          })
          .onConflictDoNothing()
          .returning({ id: processedExternalOrders.id });

        if (claimed.length === 0) {
          return { action: "skip" as const, reason: "already_processed" };
        }

        // Read balance inside the transaction — consistent with the acquired lock.
        const txRows = await tx
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

        const currentBalance = walletService.computeBalance(txDomain);

        const [decision] = renewalService.evaluateRenewals([
          {
            membership: {
              id: m.id,
              userId: m.userId,
              status: m.status,
              expiresAt: m.expiresAt,
              autoRenew: m.autoRenew,
            },
            currentBalance,
            renewalCostEur: RENEWAL_COST_EUR,
          },
        ]);

        if (decision.action !== "renew") {
          return { action: "skip" as const, reason: decision.reason };
        }

        const newExpiresAt = renewalService.calculateNewExpiry(m.expiresAt);

        // Derive the last checksum from the already-fetched txRows (avoids a second query).
        const lastChecksum =
          [...txRows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
            ?.checksum ?? null;

        const txId = randomUUID();
        const checksum = walletService.generateChecksum(
          {
            id: txId,
            userId: m.userId,
            amount: decision.cost,
            type: "debit",
            description: "Renovación automática de membresía",
            referenceId: undefined,
          },
          lastChecksum,
        );

        await tx.insert(transactions).values({
          id: txId,
          userId: m.userId,
          amount: decision.cost.toFixed(2),
          type: "debit",
          description: "Renovación automática de membresía",
          checksum,
        });

        await tx
          .update(memberships)
          .set({ status: "active", expiresAt: newExpiresAt })
          .where(eq(memberships.id, m.id));

        return { action: "renew" as const };
      });

      if (result.action === "renew") {
        renewed.push(m.id);
      } else {
        skipped.push({ id: m.id, reason: result.reason });
      }
    } catch {
      // A transaction failure for one membership must not abort the entire batch.
      skipped.push({ id: m.id, reason: "transaction_error" });
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