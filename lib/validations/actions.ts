import { z } from "zod";
import type { ProductCategory } from "@/core/domain/product-category";

const productCategoryValues = [
  "standard",
  "proprietary",
  "reduced",
  "membership",
  "service",
] as const satisfies readonly ProductCategory[];

export const purchaseSchema = z
  .object({
    memberId: z.string().uuid("memberId must be a valid UUID"),
    productId: z.string().uuid("productId must be a valid UUID"),
    category: z.enum(productCategoryValues),
    saleAmountNet: z.number().positive("saleAmountNet must be positive"),
    // Required when category === 'service'
    commercialMargin: z.number().positive().optional(),
    isPublicSale: z.boolean().default(false),
    // PrecioPublico - PrecioSocio; passed when isPublicSale is true
    directMarginAmount: z.number().positive().optional(),
  })
  .refine(
    (d) => d.category !== "service" || d.commercialMargin !== undefined,
    { message: "commercialMargin is required for service category", path: ["commercialMargin"] },
  );

export const withdrawalSchema = z.object({
  memberId: z.string().uuid("memberId must be a valid UUID"),
  amount: z.number().min(50, "Minimum withdrawal amount is 50 EUR"),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
