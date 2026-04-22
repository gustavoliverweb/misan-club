import { eq } from "drizzle-orm";
import { db } from "@/infra/db";
import { kycSubmissions, users } from "@/infra/db/schema";

export type PendingKycSubmission = {
  id: string;
  documentType: "dni_front" | "dni_back" | "passport" | "selfie";
  s3Key: string;
  submittedAt: Date;
  userId: string;
  userFullName: string;
  userEmail: string;
};

export async function getPendingKycSubmissions(): Promise<PendingKycSubmission[]> {
  return db
    .select({
      id: kycSubmissions.id,
      documentType: kycSubmissions.documentType,
      s3Key: kycSubmissions.s3Key,
      submittedAt: kycSubmissions.submittedAt,
      userId: users.id,
      userFullName: users.fullName,
      userEmail: users.email,
    })
    .from(kycSubmissions)
    .innerJoin(users, eq(kycSubmissions.userId, users.id))
    .where(eq(kycSubmissions.status, "pending"))
    .orderBy(kycSubmissions.submittedAt);
}
