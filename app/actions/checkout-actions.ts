"use server";

import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/infra/db";
import { carts, cartItems, orders, orderItems, products } from "@/infra/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { stripe } from "@/infra/stripe";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createCartCheckoutSessionAction(): Promise<
  ActionResult<{ url: string }>
> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado." };

  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Usuario no encontrado." };

  const isSocioActivo = user.membership?.status === "active" || user.membership?.status === "grace";

  const [cart] = await db
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.userId, session.user.id))
    .limit(1);

  if (!cart) return { success: false, error: "Tu carrito está vacío." };

  const items = await db
    .select({
      cartItemId: cartItems.id,
      quantity: cartItems.quantity,
      productId: products.id,
      nombre: products.nombre,
      precioPublico: products.precioPublico,
      precioSocio: products.precioSocio,
      commissionCategory: products.commissionCategory,
      porcentajeN1: products.porcentajeN1,
      porcentajeN2: products.porcentajeN2,
      porcentajeN3: products.porcentajeN3,
      porcentajeN4: products.porcentajeN4,
      porcentajeN5: products.porcentajeN5,
      porcentajePool: products.porcentajePool,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(and(eq(cartItems.cartId, cart.id), eq(products.active, true)));

  if (items.length === 0) return { success: false, error: "Tu carrito está vacío." };

  const enriched = items.map((item) => {
    const unitPrice = isSocioActivo
      ? parseFloat(item.precioSocio)
      : parseFloat(item.precioPublico);
    const commissionBase = parseFloat(item.precioSocio);
    return { ...item, unitPrice, commissionBase, isSocioPrice: isSocioActivo };
  });

  const totalAmount = enriched.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  // Create order snapshot before opening Stripe session
  const [order] = await db
    .insert(orders)
    .values({
      userId: session.user.id,
      status: "pending",
      totalAmount: totalAmount.toFixed(2),
    })
    .returning({ id: orders.id });

  await db.insert(orderItems).values(
    enriched.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      commissionBase: item.commissionBase.toFixed(2),
      isSocioPrice: item.isSocioPrice,
      commissionCategory: item.commissionCategory,
      porcentajeN1: item.porcentajeN1,
      porcentajeN2: item.porcentajeN2,
      porcentajeN3: item.porcentajeN3,
      porcentajeN4: item.porcentajeN4,
      porcentajeN5: item.porcentajeN5,
      porcentajePool: item.porcentajePool,
    })),
  );

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: enriched.map((item) => ({
      price_data: {
        currency: "eur",
        unit_amount: Math.round(item.unitPrice * 100),
        product_data: { name: item.nombre },
      },
      quantity: item.quantity,
    })),
    metadata: {
      type: "cart_order",
      userId: session.user.id,
      orderId: order.id,
      cartId: cart.id,
    },
    success_url: `${baseUrl}/pedido/${order.id}?success=true`,
    cancel_url: `${baseUrl}/cart?canceled=true`,
  });

  await db
    .update(orders)
    .set({ stripeSessionId: stripeSession.id })
    .where(eq(orders.id, order.id));

  return { success: true, data: { url: stripeSession.url! } };
}
