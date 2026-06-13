import { and, eq, or, sql } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/infra/db";
import { transactions, users, products } from "@/infra/db/schema";
import { renderSaleCommissionPdf } from "@/infra/storage/sale-commission-pdf";

// Matches credit descriptions created for seller earnings in personal store sales
const SELLER_CREDIT_DESCRIPTIONS = [
  "Margen venta pública",
  "Margen directo",
  "Comisión venta en tienda",
];

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
      referenceId: transactions.referenceId,
      createdAt: transactions.createdAt,
      sellerName: users.fullName,
    })
    .from(transactions)
    .innerJoin(users, eq(users.id, transactions.userId))
    .where(
      and(
        eq(transactions.id, txId),
        eq(transactions.type, "credit"),
        or(
          ...SELLER_CREDIT_DESCRIPTIONS.map((prefix) =>
            sql`${transactions.description} LIKE ${prefix + "%"}`,
          ),
        ),
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

  // Resolve product name via referenceId (productId stored in the transaction)
  let productName = "Producto";
  if (row.referenceId) {
    const [prod] = await db
      .select({ nombre: products.nombre })
      .from(products)
      .where(eq(products.id, row.referenceId))
      .limit(1);
    if (prod) productName = prod.nombre;
  }

  const buffer = await renderSaleCommissionPdf({
    txId: row.id,
    sellerName: row.sellerName,
    productName,
    commissionAmount: parseFloat(row.amount),
    issuedAt: row.createdAt,
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="venta-${row.id}.pdf"`,
    },
  });
}
