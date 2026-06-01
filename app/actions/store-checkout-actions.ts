"use server";

import { cookies } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/infra/db";
import { products, storeOrders, storeOrderItems } from "@/infra/db/schema";
import { stripe } from "@/infra/stripe";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

type CartItem = { productId: string; qty: number };
type StoreCookie = { sellerId: string; items: CartItem[] };

async function readCart(): Promise<StoreCookie | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("store_cart")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoreCookie;
  } catch {
    return null;
  }
}

export async function createStoreCheckoutSessionAction(
  sellerId: string,
): Promise<ActionResult<{ url: string }>> {
  const cart = await readCart();

  if (!cart || cart.sellerId !== sellerId || cart.items.length === 0) {
    return { success: false, error: "Tu carrito está vacío." };
  }

  const productIds = cart.items.map((i) => i.productId);

  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.active, true), inArray(products.id, productIds)));

  if (rows.length === 0) {
    return { success: false, error: "Tu carrito está vacío." };
  }

  const enriched = cart.items.flatMap((ci) => {
    const product = rows.find((r) => r.id === ci.productId);
    if (!product) return [];
    return [
      {
        ...ci,
        product,
        unitPrice: parseFloat(product.precioPublico),
        commissionBase: parseFloat(product.precioSocio),
      },
    ];
  });

  if (enriched.length === 0) {
    return { success: false, error: "Tu carrito está vacío." };
  }

  const totalAmount = enriched.reduce(
    (sum, item) => sum + item.unitPrice * item.qty,
    0,
  );

  const [order] = await db
    .insert(storeOrders)
    .values({
      sellerId,
      buyerEmail: "",
      status: "pending",
      totalAmount: totalAmount.toFixed(2),
    })
    .returning({ id: storeOrders.id });

  await db.insert(storeOrderItems).values(
    enriched.map((item) => ({
      orderId: order.id,
      productId: item.product.id,
      quantity: item.qty,
      unitPrice: item.unitPrice.toFixed(2),
      commissionBase: item.commissionBase.toFixed(2),
      commissionCategory: item.product.commissionCategory,
      porcentajeN1: item.product.porcentajeN1,
      porcentajeN2: item.product.porcentajeN2,
      porcentajeN3: item.product.porcentajeN3,
      porcentajeN4: item.product.porcentajeN4,
      porcentajeN5: item.product.porcentajeN5,
      porcentajePool: item.product.porcentajePool,
    })),
  );

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: enriched.map((item) => ({
      price_data: {
        currency: "eur",
        unit_amount: Math.round(item.unitPrice * 100),
        product_data: { name: item.product.nombre },
      },
      quantity: item.qty,
    })),
    metadata: {
      type: "store_sale",
      sellerId,
      storeOrderId: order.id,
    },
    success_url: `${baseUrl}/tienda/confirmacion/${order.id}?success=true`,
    cancel_url: `${baseUrl}/tienda/${sellerId}/cart?canceled=true`,
  });

  await db
    .update(storeOrders)
    .set({ stripeSessionId: stripeSession.id })
    .where(eq(storeOrders.id, order.id));

  return { success: true, data: { url: stripeSession.url! } };
}
