import type { Stripe } from "stripe";
import { eq } from "drizzle-orm";
import { stripe } from "@/infra/stripe";
import { db } from "@/infra/db";
import {
  carts,
  cartItems,
  memberships,
  orderItems,
  orders,
  processedExternalOrders,
  users,
} from "@/infra/db/schema";
import { MembershipRenewalService } from "@/core/services/membership-renewal.service";
import { processSaleAction } from "@/app/actions/business-actions";

const renewalService = new MembershipRenewalService();

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    return new Response(`Webhook error: ${message}`, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response("ok", { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const { userId, type } = session.metadata ?? {};

  if (!userId) {
    return new Response("Missing metadata", { status: 400 });
  }

  // Idempotency guard — discard duplicate webhook deliveries
  const existing = await db
    .select({ id: processedExternalOrders.id })
    .from(processedExternalOrders)
    .where(eq(processedExternalOrders.externalOrderId, session.id))
    .limit(1);

  if (existing[0]) {
    return new Response("ok", { status: 200 });
  }

  // Verify userId exists in our DB
  const userRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRows[0]) {
    return new Response("User not found", { status: 400 });
  }

  // ── Cart order ────────────────────────────────────────────────────────────
  if (type === "cart_order") {
    const { orderId, cartId } = session.metadata ?? {};

    if (!orderId) {
      return new Response("Missing orderId in metadata", { status: 400 });
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Mark order paid + write idempotency guard atomically
    await db.transaction(async (tx) => {
      await tx.insert(processedExternalOrders).values({
        externalOrderId: session.id,
        memberId: userId,
      });
      await tx
        .update(orders)
        .set({ status: "paid" })
        .where(eq(orders.id, orderId));
    });

    // Process commissions per item — best effort, failures are logged and don't block the response
    for (const item of items) {
      try {
        const saleAmountNet = parseFloat(item.commissionBase) * item.quantity;
        await processSaleAction({
          memberId: userId,
          productId: item.productId,
          category: item.commissionCategory,
          saleAmountNet,
          isPublicSale: false,
          customLevelPercentages: [
            parseFloat(item.porcentajeN1),
            parseFloat(item.porcentajeN2),
            parseFloat(item.porcentajeN3),
            parseFloat(item.porcentajeN4),
            parseFloat(item.porcentajeN5),
          ],
          customPoolRate: parseFloat(item.porcentajePool),
        });
      } catch (err) {
        console.error(
          `[WEBHOOK] Commission processing failed for orderItem ${item.id}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    // Clear cart
    if (cartId) {
      await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
    } else {
      const [cart] = await db
        .select({ id: carts.id })
        .from(carts)
        .where(eq(carts.userId, userId))
        .limit(1);
      if (cart) {
        await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      }
    }

    return new Response("ok", { status: 200 });
  }

  // ── Membership renewal / first activation ────────────────────────────────
  const { membershipId } = session.metadata ?? {};
  const isFirstActivation = !membershipId;

  let newExpiresAt: Date;

  if (isFirstActivation) {
    newExpiresAt = new Date();
    newExpiresAt.setUTCDate(newExpiresAt.getUTCDate() + 30);
  } else {
    const membershipRows = await db
      .select({ expiresAt: memberships.expiresAt })
      .from(memberships)
      .where(eq(memberships.id, membershipId))
      .limit(1);

    if (!membershipRows[0]) {
      return new Response("Membership not found", { status: 404 });
    }

    newExpiresAt = renewalService.calculateNewExpiry(membershipRows[0].expiresAt);
  }

  await db.transaction(async (tx) => {
    await tx.insert(processedExternalOrders).values({
      externalOrderId: session.id,
      memberId: userId,
    });

    if (isFirstActivation) {
      await tx.insert(memberships).values({
        userId,
        status: "active",
        expiresAt: newExpiresAt,
      });
    } else {
      await tx
        .update(memberships)
        .set({ status: "active", expiresAt: newExpiresAt })
        .where(eq(memberships.id, membershipId));
    }
  });

  return new Response("ok", { status: 200 });
}
