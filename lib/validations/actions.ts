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
    // Per-product overrides — when omitted, CATEGORY_CONFIG defaults apply
    customLevelPercentages: z
      .tuple([z.number(), z.number(), z.number(), z.number(), z.number()])
      .optional(),
    customPoolRate: z.number().min(0).max(1).optional(),
    // Human-readable label shown in wallet descriptions instead of the raw productId
    eventLabel: z.string().max(100).optional(),
  })
  .refine(
    (d) => d.category !== "service" || d.commercialMargin !== undefined,
    { message: "commercialMargin is required for service category", path: ["commercialMargin"] },
  );

export const withdrawalSchema = z.object({
  memberId: z.string().uuid("memberId must be a valid UUID"),
  amount: z.number().min(50, "Minimum withdrawal amount is 50 EUR"),
});

export const createProductSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(255),
  descripcion: z.string().optional(),
  categoria: z.string().min(1, "Categoría requerida").max(100),
  subcategoria: z.string().max(100).optional(),
  marca: z.string().max(100).optional(),
  imagen: z.string().max(500).optional(),
  precioPublico: z.number().positive("Precio público debe ser positivo"),
  precioSocio: z.number().positive("Precio socio debe ser positivo"),
  commissionCategory: z.enum(productCategoryValues),
  porcentajeN1: z.number().min(0).max(1),
  porcentajeN2: z.number().min(0).max(1),
  porcentajeN3: z.number().min(0).max(1),
  porcentajeN4: z.number().min(0).max(1),
  porcentajeN5: z.number().min(0).max(1),
  porcentajePool: z.number().min(0).max(1),
  participaEnPool: z.boolean().default(true),
  generaAutofactura: z.boolean().default(true),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
