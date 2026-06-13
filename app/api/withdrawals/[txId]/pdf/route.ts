import { and, eq } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/infra/db";
import { transactions, users } from "@/infra/db/schema";
import { renderWithdrawalReceiptPdf } from "@/infra/storage/withdrawal-receipt-pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ txId: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { txId } = await params;

  const [row] = await db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      amount: transactions.amount,
      description: transactions.description,
      type: transactions.type,
      createdAt: transactions.createdAt,
      memberName: users.fullName,
    })
    .from(transactions)
    .innerJoin(users, eq(users.id, transactions.userId))
    .where(
      and(
        eq(transactions.id, txId),
        eq(transactions.description, "Solicitud de retiro"),
      ),
    )
    .limit(1);

  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = row.userId === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await renderWithdrawalReceiptPdf({
    txId: row.id,
    memberName: row.memberName,
    amount: parseFloat(row.amount),
    requestedAt: row.createdAt,
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="retiro-${row.id}.pdf"`,
    },
  });
}
