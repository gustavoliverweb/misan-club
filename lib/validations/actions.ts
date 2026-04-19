import { z } from "zod";

export const purchaseSchema = z.object({
  memberId: z.string().uuid("memberId must be a valid UUID"),
  productId: z.string().uuid("productId must be a valid UUID"),
  totalAmount: z.number().positive("totalAmount must be positive"),
  marginFactor: z
    .number()
    .min(0, "marginFactor must be between 0 and 1")
    .max(1, "marginFactor must be between 0 and 1"),
});

export const withdrawalSchema = z.object({
  memberId: z.string().uuid("memberId must be a valid UUID"),
  amount: z.number().min(50, "Minimum withdrawal amount is 50 EUR"),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
