"use server";

import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/infra/db";
import { memberships, transactions, users } from "@/infra/db/schema";
import { WalletService } from "@/core/services/wallet.service";
import { stripe } from "@/infra/stripe";

const walletService = new WalletService();

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

  const { randomUUID } = await import("crypto");
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

type RenewalState = { error?: string; checkoutUrl?: string } | undefined;

export async function renewMembershipAction(
  _prev: RenewalState,
): Promise<RenewalState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado." };

  const userId = session.user.id;

  const membershipRows = await db
    .select({ id: memberships.id, status: memberships.status })
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .orderBy(desc(memberships.createdAt))
    .limit(1);

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const isFirstActivation = !membershipRows[0];

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: 3000,
          product_data: {
            name: isFirstActivation
              ? "Activación de Membresía MisanClub"
              : "Renovación de Membresía MisanClub",
            description: "+30 días de membresía activa",
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      membershipId: membershipRows[0]?.id ?? "",
    },
    success_url: `${baseUrl}/dashboard?renewal=success`,
    cancel_url: `${baseUrl}/dashboard?renewal=canceled`,
  });

  if (!checkoutSession.url) return { error: "No se pudo crear la sesión de pago." };

  return { checkoutUrl: checkoutSession.url };
}
