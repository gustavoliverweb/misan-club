"use server";

import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { db } from "@/infra/db";
import { autofacturas, transactions, users, poolContributions } from "@/infra/db/schema";
import { getActiveUpline } from "@/infra/db/queries/upline";
import { CommissionService } from "@/core/services/commission.service";
import { WalletService } from "@/core/services/wallet.service";
import { AutofacturaService } from "@/core/services/autofactura.service";
import { purchaseSchema, withdrawalSchema } from "@/lib/validations/actions";
import { CATEGORY_CONFIG, getQuarter } from "@/core/domain/product-category";

const commissionService = new CommissionService();
const walletService = new WalletService();
const autofacturaService = new AutofacturaService();

const withdrawalAttempts = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

function checkWithdrawalRateLimit(userId: string): boolean {
  const now = Date.now();
  const existing = withdrawalAttempts.get(userId);
  if (!existing || now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
    withdrawalAttempts.set(userId, { count: 1, windowStart: now });
    return true;
  }
  if (existing.count >= RATE_LIMIT_MAX) return false;
  existing.count++;
  return true;
}

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

function auditLog(message: string): void {
  console.log(`[WALLET] ${message}`);
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

async function insertDirectCredit(
  userId: string,
  amount: number,
  description: string,
  referenceId: string,
): Promise<string> {
  const txId = randomUUID();
  const previousChecksum = await getLastChecksum(userId);
  const checksum = walletService.generateChecksum(
    { id: txId, userId, amount, type: "credit", description, referenceId },
    previousChecksum,
  );
  await db.insert(transactions).values({
    id: txId,
    userId,
    amount: amount.toString(),
    type: "credit",
    description,
    referenceId,
    checksum,
  });
  auditLog(`Credit: User ${userId}, Amount ${amount}, Reason: ${description}`);
  return txId;
}

export async function processSaleAction(
  input: unknown,
): Promise<ActionResult<{ transactionIds: string[] }>> {
  const parsed = purchaseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const {
    memberId,
    productId,
    category,
    saleAmountNet,
    commercialMargin,
    isPublicSale,
    directMarginAmount,
    eventLabel,
  } = parsed.data;

  const config = CATEGORY_CONFIG[category];
  const levelPercentages = parsed.data.customLevelPercentages ?? config.levelPercentages;
  const poolRate = parsed.data.customPoolRate ?? config.poolRate;

  // Spec 05 §3.1 — for service, 70% goes directly to the seller; 30% is the network base
  const baseForCommissions =
    category === "service"
      ? Math.round((commercialMargin! * 0.3) * 100) / 100
      : saleAmountNet;

  try {
    const transactionIds: string[] = [];

    // ── Direct credit: service seller (70% of commercial margin) ─────────────
    if (category === "service" && commercialMargin) {
      const directAmount = Math.round(commercialMargin * 0.7 * 100) / 100;
      const txId = await insertDirectCredit(
        memberId,
        directAmount,
        `Margen directo — venta servicio ${productId}`,
        productId,
      );
      transactionIds.push(txId);
    }

    // ── Direct credit: public sale margin (PrecioPublico - PrecioSocio) ──────
    if (isPublicSale && directMarginAmount) {
      const txId = await insertDirectCredit(
        memberId,
        directMarginAmount,
        `Margen venta pública — producto ${productId}`,
        productId,
      );
      transactionIds.push(txId);
    }

    // ── Resolve upline ────────────────────────────────────────────────────────
    const activeUpline = await getActiveUpline(db, memberId);

    if (activeUpline.length === 0) {
      auditLog(
        `Sale by ${memberId}: no active upline — full commission goes to reserve fund`,
      );
    } else {
      // Pure calculation — no DB calls (marginFactor always 1; category rates are in levelPercentages)
      const distribution = commissionService.calculate({
        saleAmountNet: baseForCommissions,
        marginFactor: 1,
        levelPercentages: [...levelPercentages.slice(0, activeUpline.length)],
      });

      type AfInput = { txId: string; emisorId: string; emisorName: string; amount: number };
      const afInputs: AfInput[] = [];

      // Spec 02: all ledger inserts must be atomic — a single level failure rolls back everything
      await db.transaction(async (tx) => {
        // Pre-load the latest checksum per recipient using tx so reads are within
        // the same transaction isolation. We track the running checksum manually
        // to correctly chain multiple inserts for the same user in one sale.
        const latestChecksums = new Map<string, string | null>();
        for (const commission of distribution.commissions) {
          const recipient = activeUpline[commission.level - 1];
          if (!recipient || latestChecksums.has(recipient.memberId)) continue;
          const rows = await tx
            .select({ checksum: transactions.checksum })
            .from(transactions)
            .where(eq(transactions.userId, recipient.memberId))
            .orderBy(desc(transactions.createdAt))
            .limit(1);
          latestChecksums.set(recipient.memberId, rows[0]?.checksum ?? null);
        }

        for (const commission of distribution.commissions) {
          const recipient = activeUpline[commission.level - 1];
          if (!recipient) continue;

          const txId = randomUUID();
          const previousChecksum = latestChecksums.get(recipient.memberId) ?? null;
          const description = `Comisión nivel ${commission.level} — ${eventLabel ?? `venta ${productId}`}`;
          const checksum = walletService.generateChecksum(
            {
              id: txId,
              userId: recipient.memberId,
              amount: commission.amount,
              type: "credit",
              description,
              referenceId: productId,
            },
            previousChecksum,
          );

          await tx.insert(transactions).values({
            id: txId,
            userId: recipient.memberId,
            amount: commission.amount.toString(),
            type: "credit",
            description,
            referenceId: productId,
            productCategory: category,
            checksum,
          });

          // Update running checksum so the next insert for this user chains correctly
          latestChecksums.set(recipient.memberId, checksum);

          transactionIds.push(txId);
          afInputs.push({
            txId,
            emisorId: recipient.memberId,
            emisorName: recipient.fullName ?? recipient.memberId,
            amount: commission.amount,
          });
          auditLog(
            `Credit: User ${recipient.memberId}, Amount ${commission.amount}, Reason: Commission Level ${commission.level}`,
          );
        }
      });

      // Spec 04 §4.2: autofacturas outside the SQL transaction so a DB failure never rolls back the ledger.
      // Each insert is isolated so one failure doesn't block the rest.
      for (const af of afInputs) {
        try {
          const built = autofacturaService.build({
            commissionId: af.txId,
            emisorId: af.emisorId,
            emisorName: af.emisorName,
            amount: af.amount,
          });
          await db.insert(autofacturas).values({
            id: built.id,
            commissionId: built.commissionId,
            emisorId: built.emisorId,
            amount: built.amount.toString(),
            issuedAt: built.issuedAt,
          });
          auditLog(`Autofactura created: ${built.id} for commission ${af.txId}`);
        } catch (err) {
          console.error(`[WALLET] Autofactura insert failed for commission ${af.txId}:`, err instanceof Error ? err.message : err);
        }
      }
    }

    // ── Pool contribution — outside the SQL transaction (same isolation pattern as autofacturas) ──
    const poolAmount = Math.round(baseForCommissions * poolRate * 100) / 100;
    if (poolAmount > 0) {
      try {
        await db.insert(poolContributions).values({
          productId,
          category,
          amount: poolAmount.toString(),
          quarter: getQuarter(new Date()),
        });
        auditLog(`Pool contribution: ${poolAmount} for product ${productId} (${category}, ${getQuarter(new Date())})`);
      } catch (err) {
        console.error(`[WALLET] Pool contribution failed for product ${productId}:`, err instanceof Error ? err.message : err);
      }
    }

    return { success: true, data: { transactionIds } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error processing sale",
    };
  }
}

export async function requestWithdrawalAction(
  input: unknown,
): Promise<ActionResult<{ transactionId: string }>> {
  // Security: always derive identity from the verified session, never from user input.
  // An exported "use server" function is a public HTTP endpoint — any authenticated
  // user could POST with an arbitrary memberId and drain another user's wallet.
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autenticado." };
  }

  const parsed = withdrawalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // memberId from input is intentionally ignored — session.user.id is authoritative.
  const memberId = session.user.id;
  const { amount } = parsed.data;

  if (!checkWithdrawalRateLimit(memberId)) {
    return { success: false, error: "RATE_LIMIT_EXCEEDED" };
  }

  try {
    // CRÍTICO 2 fix: wrap the entire read→validate→insert sequence in a single
    // transaction. The SELECT … FOR UPDATE on the user row acquires a row-level
    // lock so a second concurrent withdrawal for this user blocks here until the
    // first transaction commits. When it unblocks it re-reads the updated balance,
    // preventing double-spend (TOCTOU race).
    const transactionId = await db.transaction(async (tx) => {
      const userRows = await tx
        .select({ kycStatus: users.kycStatus })
        .from(users)
        .where(eq(users.id, memberId))
        .for("update")
        .limit(1);

      if (!userRows[0]) throw new Error("User not found");

      const txRows = await tx
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

      const domainTxs = txRows.map((row) => ({
        ...row,
        amount: parseFloat(row.amount),
        referenceId: row.referenceId ?? undefined,
      }));

      const balance = walletService.computeBalance(domainTxs);

      const validation = walletService.validateWithdrawal(
        { userId: memberId, amount, requestedAt: new Date() },
        userRows[0].kycStatus,
        balance,
      );

      if (!validation.ok) throw new Error(validation.reason);

      const txId = randomUUID();
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
        previousChecksum,
      );

      await tx.insert(transactions).values({
        id: txId,
        userId: memberId,
        amount: amount.toString(),
        type: "debit",
        description: "Solicitud de retiro",
        checksum,
      });

      auditLog(`Debit: User ${memberId}, Amount ${amount}, Reason: Withdrawal request`);

      return txId;
    });

    return { success: true, data: { transactionId } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error processing withdrawal",
    };
  }
}
