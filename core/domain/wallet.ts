import { z } from "zod";

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().positive(),
  type: z.enum(["credit", "debit"]),
  description: z.string().min(1),
  referenceId: z.string().uuid().optional(),
  checksum: z.string().length(64),
  createdAt: z.date(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export const WithdrawalRequestSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive(),
  requestedAt: z.date(),
});

export type WithdrawalRequest = z.infer<typeof WithdrawalRequestSchema>;

export type WithdrawalValidationResult =
  | { ok: true }
  | { ok: false; reason: "KYC_NOT_VERIFIED" | "INSUFFICIENT_BALANCE" | "OUTSIDE_WITHDRAWAL_WINDOW" };
