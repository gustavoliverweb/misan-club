"use server";

import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/infra/db";
import { transactions, users } from "@/infra/db/schema";
import { WalletService } from "@/core/services/wallet.service";

const walletService = new WalletService();

// Human-readable messages for each validation failure code (Spec 03)
const VALIDATION_MESSAGES: Record<string, string> = {
  KYC_NOT_VERIFIED:
    "Debes verificar tu identidad (KYC) antes de retirar fondos.",
  OUTSIDE_WITHDRAWAL_WINDOW:
    "Los retiros solo se procesan del día 1 al 5 de cada mes.",
  INSUFFICIENT_BALANCE:
    "Saldo insuficiente para cubrir el importe solicitado.",
};

type WithdrawalState = { error?: string; success?: boolean } | undefined;

export async function requestWithdrawalFormAction(
  _prev: WithdrawalState,
  formData: FormData,
): Promise<WithdrawalState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado." };

  const amount = parseFloat((formData.get("amount") as string) ?? "");
  if (isNaN(amount) || amount < 50) {
    return { error: "El importe mínimo de retiro es 50,00 €." };
  }

  const userId = session.user.id;

  const userRows = await db
    .select({ kycStatus: users.kycStatus })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRows[0]) return { error: "Usuario no encontrado." };

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
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt));

  const domainTxs = txRows.map((row) => ({
    ...row,
    amount: parseFloat(row.amount),
    referenceId: row.referenceId ?? undefined,
  }));

  const balance = walletService.computeBalance(domainTxs);

  const validation = walletService.validateWithdrawal(
    { userId, amount, requestedAt: new Date() },
    userRows[0].kycStatus,
    balance,
  );

  if (!validation.ok) {
    return { error: VALIDATION_MESSAGES[validation.reason] ?? validation.reason };
  }

  const txId = randomUUID();
  const previousChecksum = txRows[0]?.checksum ?? null;
  const checksum = walletService.generateChecksum(
    {
      id: txId,
      userId,
      amount,
      type: "debit",
      description: "Solicitud de retiro",
      referenceId: undefined,
    },
    previousChecksum,
  );

  await db.insert(transactions).values({
    id: txId,
    userId,
    amount: amount.toString(),
    type: "debit",
    description: "Solicitud de retiro",
    checksum,
  });

  return { success: true };
}
