"use server";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/infra/db";
import { kycSubmissions, users } from "@/infra/db/schema";
import { uploadFile } from "@/infra/storage/s3";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const documentTypeSchema = z.enum([
  "dni_front",
  "dni_back",
  "passport",
  "selfie",
]);

type KycActionState = { error?: string; success?: boolean } | undefined;

export async function submitKycDocumentAction(
  _prev: KycActionState,
  formData: FormData,
): Promise<KycActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado." };

  const docTypeParsed = documentTypeSchema.safeParse(
    formData.get("documentType"),
  );
  if (!docTypeParsed.success) return { error: "Tipo de documento inválido." };

  const file = formData.get("document") as File | null;
  if (!file || file.size === 0) return { error: "Selecciona un archivo." };
  if (!ALLOWED_TYPES.includes(file.type))
    return { error: "Formato no permitido. Usa JPG, PNG, WEBP o PDF." };
  if (file.size > MAX_SIZE_BYTES)
    return { error: "El archivo no puede superar 10 MB." };

  const userId = session.user.id;
  const ext = file.name.split(".").pop() ?? "bin";
  const s3Key = `kyc/${userId}/${docTypeParsed.data}/${randomUUID()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadFile(s3Key, buffer, file.type);

  await db.insert(kycSubmissions).values({
    userId,
    documentType: docTypeParsed.data,
    s3Key,
  });

  // Re-submission after rejection moves user back to pending review
  await db
    .update(users)
    .set({ kycStatus: "pending" })
    .where(eq(users.id, userId));

  return { success: true };
}

const reviewSchema = z.object({
  submissionId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().optional(),
});

export async function reviewKycSubmissionAction(
  input: unknown,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado." };

  const adminRow = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (adminRow[0]?.role !== "admin")
    return { success: false, error: "Sin permisos." };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };

  const { submissionId, decision, rejectionReason } = parsed.data;

  const submission = await db
    .select({ userId: kycSubmissions.userId })
    .from(kycSubmissions)
    .where(eq(kycSubmissions.id, submissionId))
    .limit(1);

  if (!submission[0])
    return { success: false, error: "Solicitud no encontrada." };

  await db.transaction(async (tx) => {
    await tx
      .update(kycSubmissions)
      .set({
        status: decision,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        rejectionReason:
          decision === "rejected" ? (rejectionReason ?? null) : null,
      })
      .where(eq(kycSubmissions.id, submissionId));

    await tx
      .update(users)
      .set({ kycStatus: decision === "approved" ? "verified" : "rejected" })
      .where(eq(users.id, submission[0].userId));
  });

  return { success: true };
}
