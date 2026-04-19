import { z } from "zod";

export const AutofacturaSchema = z.object({
  id: z.string().uuid(),
  commissionId: z.string().uuid(),
  emisorId: z.string().uuid(),
  emisorName: z.string().min(1),
  receptorName: z.literal("MisanClub"),
  concepto: z.literal("Servicios de intermediación comercial"),
  amount: z.number().positive(),
  currency: z.literal("EUR"),
  issuedAt: z.date(),
  s3Key: z.string().optional(),
  presignedUrl: z.string().url().optional(),
});

export type Autofactura = z.infer<typeof AutofacturaSchema>;

export const CreateAutofacturaInputSchema = z.object({
  commissionId: z.string().uuid(),
  emisorId: z.string().uuid(),
  emisorName: z.string().min(1),
  amount: z.number().positive(),
  issuedAt: z.date().optional(),
});

export type CreateAutofacturaInput = z.infer<typeof CreateAutofacturaInputSchema>;
