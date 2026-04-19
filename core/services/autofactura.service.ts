import {
  CreateAutofacturaInputSchema,
  type Autofactura,
  type CreateAutofacturaInput,
} from "../domain/autofactura";

export class AutofacturaService {
  // Builds the autofactura record from a commission event.
  // PDF generation and S3 upload are handled by the infra layer and injected via s3Key/presignedUrl.
  build(input: CreateAutofacturaInput): Omit<Autofactura, "s3Key" | "presignedUrl"> {
    const parsed = CreateAutofacturaInputSchema.parse(input);

    return {
      id: crypto.randomUUID(),
      commissionId: parsed.commissionId,
      emisorId: parsed.emisorId,
      emisorName: parsed.emisorName,
      receptorName: "MisanClub",
      concepto: "Servicios de intermediación comercial",
      amount: parsed.amount,
      currency: "EUR",
      issuedAt: parsed.issuedAt ?? new Date(),
    };
  }

  // Generates the canonical S3 key for a given autofactura.
  buildS3Key(autofacturaId: string, emisorId: string): string {
    const date = new Date();
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `autofacturas/${year}/${month}/${emisorId}/${autofacturaId}.pdf`;
  }
}
