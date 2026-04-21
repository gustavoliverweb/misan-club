import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/infra/db";
import { autofacturas, users } from "@/infra/db/schema";
import { renderAutofacturaPdf } from "@/infra/storage/autofactura-pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const rows = await db
    .select({
      id: autofacturas.id,
      commissionId: autofacturas.commissionId,
      emisorId: autofacturas.emisorId,
      amount: autofacturas.amount,
      currency: autofacturas.currency,
      concepto: autofacturas.concepto,
      receptorName: autofacturas.receptorName,
      issuedAt: autofacturas.issuedAt,
      emisorName: users.fullName,
    })
    .from(autofacturas)
    .innerJoin(users, eq(users.id, autofacturas.emisorId))
    .where(eq(autofacturas.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Only the emisor or an admin can download their own autofactura
  const isOwner = row.emisorId === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await renderAutofacturaPdf({
    id: row.id,
    commissionId: row.commissionId,
    emisorId: row.emisorId,
    emisorName: row.emisorName,
    receptorName: "MisanClub",
    concepto: "Servicios de intermediación comercial",
    amount: parseFloat(row.amount),
    currency: "EUR",
    issuedAt: row.issuedAt,
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="autofactura-${row.id}.pdf"`,
    },
  });
}
