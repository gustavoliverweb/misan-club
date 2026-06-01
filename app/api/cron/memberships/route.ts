"use server";

import { randomUUID } from "crypto";
import { and, eq, gt, lte, or } from "drizzle-orm";
import { db } from "@/infra/db";
import { memberships, processedExternalOrders, transactions } from "@/infra/db/schema";
import { MembershipRenewalService } from "@/core/services/membership-renewal.service";
import { WalletService } from "@/core/services/wallet.service";
import type { Transaction } from "@/core/domain/wallet";

const renewalService = new MembershipRenewalService();
const walletService = new WalletService();
const RENEWAL_COST_EUR = 30;
const GRACE_DAYS = 10;

// "cron-2026-05-12T10-{membershipId}" — unique per (UTC-hour-slot, membership)
function cronSlot(now: Date, membershipId: string): string {
  const yyyy = now.getUTCFullYear();
  const mm   = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd   = String(now.getUTCDate()).padStart(2, "0");
  const hh   = String(now.getUTCHours()).padStart(2, "0");
  return `cron-${yyyy}-${mm}-${dd}T${hh}-${membershipId}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const window48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // 1. Move expired active memberships into the grace period (10 days).
  //    Previously this set status='expired' directly — now members get a grace window first.
  const enteredGrace = await db
    .update(memberships)
    .set({
      status: "grace",
      graceEndsAt: addDays(now, GRACE_DAYS),
    })
    .where(and(eq(memberships.status, "active"), lte(memberships.expiresAt, now)))
    .returning({ id: memberships.id, userId: memberships.userId });

  // 2. Permanently expire grace memberships whose grace window has closed.
  const finallyExpired = await db
    .update(memberships)
    .set({ status: "expired", graceEndsAt: null })
    .where(and(eq(memberships.status, "grace"), lte(memberships.graceEndsAt, now)))
    .returning({ id: memberships.id, userId: memberships.userId });

  // 3. Find candidates for auto-renewal:
  //    a) Active memberships expiring in the next 48h (pre-expiry renewal window).
  //    b) Grace memberships still within their window (daily retry while balance is insufficient).
  const renewalCandidates = await db
    .select()
    .from(memberships)
    .where(
      or(
        // a) Active, expiring soon
        and(
          eq(memberships.status, "active"),
          gt(memberships.expiresAt, now),
          lte(memberships.expiresAt, window48h),
        ),
        // b) In grace period, still open
        and(
          eq(memberships.status, "grace"),
          gt(memberships.graceEndsAt, now),
        ),
      ),
    );

  const renewed: string[] = [];
  const skipped: { id: string; reason: string }[] = [];

  // 4. Process each candidate in an isolated transaction.
  //
  //    Fix A — Race condition: SELECT … FOR UPDATE on the membership row serializes
  //    concurrent cron executions. A second run blocks here until the first commits,
  //    then re-reads the (now-updated) status and skips if no longer eligible.
  //
  //    Fix B — Idempotency: INSERT … ON CONFLICT DO NOTHING into processedExternalOrders
  //    with key "cron-{YYYY-MM-DDTHH}-{membershipId}". A duplicate run within the same
  //    hour-slot returns 0 rows and the membership is skipped.
  //
  //    A per-membership try/catch ensures one failing membership does not abort the batch.
  for (const m of renewalCandidates) {
    try {
      const result = await db.transaction(async (tx) => {
        // Lock the membership row — serializes concurrent cron executions.
        const [locked] = await tx
          .select({ id: memberships.id, status: memberships.status })
          .from(memberships)
          .where(eq(memberships.id, m.id))
          .for("update");

        if (!locked || (locked.status !== "active" && locked.status !== "grace")) {
          return { action: "skip" as const, reason: "already_inactive" };
        }

        // Idempotency guard: claim the (hour-slot, membership) pair atomically.
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
              status: m.status as "active" | "grace" | "expired",
              expiresAt: m.expiresAt,
              graceEndsAt: m.graceEndsAt ?? undefined,
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

        // On renewal: always return to active and clear graceEndsAt.
        await tx
          .update(memberships)
          .set({ status: "active", expiresAt: newExpiresAt, graceEndsAt: null })
          .where(eq(memberships.id, m.id));

        return { action: "renew" as const };
      });

      if (result.action === "renew") {
        renewed.push(m.id);
      } else {
        skipped.push({ id: m.id, reason: result.reason });
      }
    } catch {
      skipped.push({ id: m.id, reason: "transaction_error" });
    }
  }

  return Response.json({
    ok: true,
    enteredGrace: enteredGrace.length,
    finallyExpired: finallyExpired.length,
    renewed: renewed.length,
    skipped: skipped.length,
    details: { enteredGrace, finallyExpired, renewed, skipped },
  });
}
