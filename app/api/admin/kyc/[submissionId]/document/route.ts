import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/infra/db";
import { kycSubmissions, users } from "@/infra/db/schema";
import { getPresignedUrl } from "@/infra/storage/s3";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminRow = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (adminRow[0]?.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { submissionId } = await params;

  const rows = await db
    .select({ s3Key: kycSubmissions.s3Key })
    .from(kycSubmissions)
    .where(eq(kycSubmissions.id, submissionId))
    .limit(1);

  if (!rows[0]) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const url = await getPresignedUrl(rows[0].s3Key);
  return NextResponse.redirect(url);
}
