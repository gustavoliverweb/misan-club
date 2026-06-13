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
  purchaseInvoices,
  storeOrderItems,
  storeOrders,
  users,
} from "@/infra/db/schema";
import { MembershipRenewalService } from "@/core/services/membership-renewal.service";
import { processSaleAction } from "@/app/actions/business-actions";

const renewalService = new MembershipRenewalService();

// Virtual product ID used as referenceId for all membership commission transactions
const MEMBERSHIP_PRODUCT_ID = "00000000-0000-4000-8000-000000000099";
const MEMBERSHIP_GROSS_EUR = 99;
const MEMBERSHIP_AMOUNT_EUR = Math.round((MEMBERSHIP_GROSS_EUR / 1.21) * 100) / 100; // net of 21% VAT → 81.82

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
  const { userId, type, sellerId, storeOrderId, buyerId } = session.metadata ?? {};

  // ── Store sale (guest buyer, no userId) ───────────────────────────────────
  if (type === "store_sale") {
    if (!sellerId || !storeOrderId) {
      return new Response("Missing store metadata", { status: 400 });
    }

    const existingStore = await db
      .select({ id: processedExternalOrders.id })
      .from(processedExternalOrders)
      .where(eq(processedExternalOrders.externalOrderId, session.id))
      .limit(1);

    if (existingStore[0]) {
      return new Response("ok", { status: 200 });
    }

    const sellerRows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, sellerId))
      .limit(1);

    if (!sellerRows[0]) {
      return new Response("Seller not found", { status: 400 });
    }

    const storeItems = await db
      .select()
      .from(storeOrderItems)
      .where(eq(storeOrderItems.orderId, storeOrderId));

    const buyerEmail = session.customer_details?.email ?? "";

    await db.transaction(async (tx) => {
      await tx.insert(processedExternalOrders).values({
        externalOrderId: session.id,
        memberId: sellerId,
      });
      await tx
        .update(storeOrders)
        .set({ status: "paid", buyerEmail })
        .where(eq(storeOrders.id, storeOrderId));
    });

    // Create purchase invoice for authenticated buyer (best-effort)
    if (buyerId) {
      try {
        const purchaseTotal = storeItems.reduce(
          (sum, item) => sum + parseFloat(item.unitPrice) * item.quantity,
          0,
        );
        const itemCount = storeItems.length;
        await db.insert(purchaseInvoices).values({
          userId: buyerId,
          storeOrderId,
          concepto: `Compra en tienda de socio · ${itemCount} ${itemCount === 1 ? "artículo" : "artículos"}`,
          totalAmount: purchaseTotal.toFixed(2),
        });
      } catch (err) {
        console.error(
          "[WEBHOOK] Purchase invoice creation failed for store_sale buyer:",
          err instanceof Error ? err.message : err,
        );
      }
    }

    for (const item of storeItems) {
      try {
        const saleAmountNet = parseFloat(item.commissionBase) * item.quantity;
        const marginPerUnit = parseFloat(item.unitPrice) - parseFloat(item.commissionBase);

        // Seller commission logic:
        // - Guest buyer: seller keeps the price spread (PVP - PVS)
        // - Authenticated non-self buyer: seller gets N1 rate on commissionBase
        // - Self-purchase (buyerId === sellerId): seller gets nothing
        const isSelf = buyerId && buyerId === sellerId;
        const isSocioNonSelf = buyerId && buyerId !== sellerId;
        const sellerCommission = isSelf
          ? 0
          : marginPerUnit > 0
            ? marginPerUnit * item.quantity
            : isSocioNonSelf
              ? Math.round(parseFloat(item.porcentajeN1) * saleAmountNet * 100) / 100
              : 0;

        const result = await processSaleAction({
          memberId: sellerId,
          productId: item.productId,
          category: item.commissionCategory,
          saleAmountNet,
          isPublicSale: sellerCommission > 0,
          directMarginAmount: sellerCommission > 0 ? sellerCommission : undefined,
          directMarginDescription:
            marginPerUnit > 0
              ? `Margen venta pública — producto ${item.productId}`
              : `Comisión venta en tienda — producto ${item.productId}`,
          customLevelPercentages: [
            parseFloat(item.porcentajeN1),
            parseFloat(item.porcentajeN2),
            parseFloat(item.porcentajeN3),
            parseFloat(item.porcentajeN4),
            parseFloat(item.porcentajeN5),
          ],
          customPoolRate: parseFloat(item.porcentajePool),
        });
        if (!result.success) {
          console.error(
            `[WEBHOOK] processSaleAction failed for storeOrderItem ${item.id}:`,
            result.error,
          );
        }
      } catch (err) {
        console.error(
          `[WEBHOOK] Commission processing failed for storeOrderItem ${item.id}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    return new Response("ok", { status: 200 });
  }

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
        const result = await processSaleAction({
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
        if (!result.success) {
          console.error(
            `[WEBHOOK] processSaleAction failed for orderItem ${item.id}:`,
            result.error,
          );
        }
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

    // Create purchase invoice for the buyer (best-effort)
    try {
      const purchaseTotal = items.reduce(
        (sum, item) => sum + parseFloat(item.unitPrice) * item.quantity,
        0,
      );
      const itemCount = items.length;
      await db.insert(purchaseInvoices).values({
        userId,
        orderId,
        concepto: `Compra de productos · ${itemCount} ${itemCount === 1 ? "artículo" : "artículos"}`,
        totalAmount: purchaseTotal.toFixed(2),
      });
    } catch (err) {
      console.error(
        `[WEBHOOK] Purchase invoice creation failed for order ${orderId}:`,
        err instanceof Error ? err.message : err,
      );
    }

    return new Response("ok", { status: 200 });
  }

  // ── Membership renewal / first activation ────────────────────────────────
  const { membershipId } = session.metadata ?? {};
  const isFirstActivation = !membershipId;

  let newExpiresAt: Date;

  if (isFirstActivation) {
    newExpiresAt = new Date();
    newExpiresAt.setUTCFullYear(newExpiresAt.getUTCFullYear() + 1);
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

  // Distribute membership commissions to the 5-level upline — best effort,
  // failures are logged and don't block the response
  try {
    await processSaleAction({
      memberId: userId,
      productId: MEMBERSHIP_PRODUCT_ID,
      category: "membership",
      saleAmountNet: MEMBERSHIP_AMOUNT_EUR,
      isPublicSale: false,
      eventLabel: isFirstActivation ? "activación de membresía" : "renovación de membresía",
    });
  } catch (err) {
    console.error(
      `[WEBHOOK] Membership commission failed for user ${userId}:`,
      err instanceof Error ? err.message : err,
    );
  }

  return new Response("ok", { status: 200 });
}
