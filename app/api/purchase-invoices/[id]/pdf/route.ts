import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/infra/db";
import {
  purchaseInvoices,
  orderItems,
  storeOrderItems,
  products,
  users,
} from "@/infra/db/schema";
import { renderPurchaseInvoicePdf } from "@/infra/storage/purchase-invoice-pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [pi] = await db
    .select({
      id: purchaseInvoices.id,
      userId: purchaseInvoices.userId,
      orderId: purchaseInvoices.orderId,
      storeOrderId: purchaseInvoices.storeOrderId,
      concepto: purchaseInvoices.concepto,
      totalAmount: purchaseInvoices.totalAmount,
      issuedAt: purchaseInvoices.issuedAt,
      buyerName: users.fullName,
    })
    .from(purchaseInvoices)
    .innerJoin(users, eq(users.id, purchaseInvoices.userId))
    .where(eq(purchaseInvoices.id, id))
    .limit(1);

  if (!pi) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = pi.userId === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  type ItemRow = { nombre: string; quantity: number; unitPrice: number };
  let items: ItemRow[] = [];

  if (pi.orderId) {
    const rows = await db
      .select({
        nombre: products.nombre,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, pi.orderId));

    items = rows.map((r) => ({
      nombre: r.nombre,
      quantity: r.quantity,
      unitPrice: parseFloat(r.unitPrice),
    }));
  } else if (pi.storeOrderId) {
    const rows = await db
      .select({
        nombre: products.nombre,
        quantity: storeOrderItems.quantity,
        unitPrice: storeOrderItems.unitPrice,
      })
      .from(storeOrderItems)
      .innerJoin(products, eq(storeOrderItems.productId, products.id))
      .where(eq(storeOrderItems.orderId, pi.storeOrderId));

    items = rows.map((r) => ({
      nombre: r.nombre,
      quantity: r.quantity,
      unitPrice: parseFloat(r.unitPrice),
    }));
  }

  const buffer = await renderPurchaseInvoicePdf({
    id: pi.id,
    buyerName: pi.buyerName,
    concepto: pi.concepto,
    items,
    totalAmount: parseFloat(pi.totalAmount),
    issuedAt: pi.issuedAt,
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="factura-compra-${pi.id}.pdf"`,
    },
  });
}
