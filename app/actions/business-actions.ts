"use server";

import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/infra/db";
import { transactions, users } from "@/infra/db/schema";
import { getActiveUpline } from "@/infra/db/queries/upline";
import { CommissionService } from "@/core/services/commission.service";
import { WalletService } from "@/core/services/wallet.service";
import { purchaseSchema, withdrawalSchema } from "@/lib/validations/actions";

const commissionService = new CommissionService();
const walletService = new WalletService();

// Spec 02: default percentages per ascending level
const LEVEL_PERCENTAGES = [0.1, 0.05, 0.03, 0.02, 0.01] as const;

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

function auditLog(message: string): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[WALLET] ${message}`);
  }
}

async function getLastChecksum(userId: string): Promise<string | null> {
  const rows = await db
    .select({ checksum: transactions.checksum })
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(1);
  return rows[0]?.checksum ?? null;
}

export async function processSaleAction(
  input: unknown
): Promise<ActionResult<{ transactionIds: string[] }>> {
  const parsed = purchaseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { memberId, productId, totalAmount, marginFactor } = parsed.data;

  try {
    // Read-only: resolve active upline before opening the write transaction
    const activeUpline = await getActiveUpline(db, memberId);

    if (activeUpline.length === 0) {
      auditLog(
        `Sale by ${memberId}: no active upline — full commission goes to reserve fund`
      );
      return { success: true, data: { transactionIds: [] } };
    }

    const levelPercentages = LEVEL_PERCENTAGES.slice(0, activeUpline.length);

    // Pure calculation — no DB calls
    const distribution = commissionService.calculate({
      saleAmountNet: totalAmount,
      marginFactor,
      levelPercentages: [...levelPercentages],
    });

    const transactionIds: string[] = [];

    // Spec 02: all ledger inserts must be atomic — a single level failure rolls back everything
    await db.transaction(async (tx) => {
      for (const commission of distribution.commissions) {
        const recipient = activeUpline[commission.level - 1];
        if (!recipient) continue;

        const txId = randomUUID();
        // Checksum is read outside the transaction (read-only, no contention risk for MVP)
        const previousChecksum = await getLastChecksum(recipient.memberId);
        const description = `Comisión nivel ${commission.level} — venta ${productId}`;
        const checksum = walletService.generateChecksum(
          {
            id: txId,
            userId: recipient.memberId,
            amount: commission.amount,
            type: "credit",
            description,
            referenceId: productId,
          },
          previousChecksum
        );

        await tx.insert(transactions).values({
          id: txId,
          userId: recipient.memberId,
          amount: commission.amount.toString(),
          type: "credit",
          description: `Comisión nivel ${commission.level} — venta ${productId}`,
          referenceId: productId,
          checksum,
        });

        transactionIds.push(txId);
        auditLog(
          `Credit: User ${recipient.memberId}, Amount ${commission.amount}, Reason: Commission Level ${commission.level}`
        );
      }
    });

    return { success: true, data: { transactionIds } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error processing sale",
    };
  }
}

export async function requestWithdrawalAction(
  input: unknown
): Promise<ActionResult<{ transactionId: string }>> {
  const parsed = withdrawalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { memberId, amount } = parsed.data;

  try {
    const userRows = await db
      .select({ kycStatus: users.kycStatus })
      .from(users)
      .where(eq(users.id, memberId))
      .limit(1);

    if (!userRows[0]) {
      return { success: false, error: "User not found" };
    }

    const txRows = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        amount: transactions.amount,
        type: transactions.type,
        description: transactions.description,
        referenceId: transactions.referenceId,
        checksum: transactions.checksum,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(eq(transactions.userId, memberId))
      .orderBy(desc(transactions.createdAt));

    // Map DB rows to domain Transaction type (decimal → number, null → undefined)
    const domainTxs = txRows.map((row) => ({
      ...row,
      amount: parseFloat(row.amount),
      referenceId: row.referenceId ?? undefined,
    }));

    const balance = walletService.computeBalance(domainTxs);

    const validation = walletService.validateWithdrawal(
      { userId: memberId, amount, requestedAt: new Date() },
      userRows[0].kycStatus,
      balance
    );

    if (!validation.ok) {
      return { success: false, error: validation.reason };
    }

    const txId = randomUUID();
    // Most recent row is first (orderBy desc) — use its checksum as the previous link
    const previousChecksum = txRows[0]?.checksum ?? null;
    const checksum = walletService.generateChecksum(
      {
        id: txId,
        userId: memberId,
        amount,
        type: "debit",
        description: "Solicitud de retiro",
        referenceId: undefined,
      },
      previousChecksum
    );

    await db.insert(transactions).values({
      id: txId,
      userId: memberId,
      amount: amount.toString(),
      type: "debit",
      description: "Solicitud de retiro",
      checksum,
    });

    auditLog(
      `Debit: User ${memberId}, Amount ${amount}, Reason: Withdrawal request`
    );

    return { success: true, data: { transactionId: txId } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error processing withdrawal",
    };
  }
}
