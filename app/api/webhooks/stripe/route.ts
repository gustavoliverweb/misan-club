import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";
import type { Stripe } from "stripe";
import { stripe } from "@/infra/stripe";
import { db } from "@/infra/db";
import {
  memberships,
  processedExternalOrders,
  transactions,
} from "@/infra/db/schema";
import { MembershipRenewalService } from "@/core/services/membership-renewal.service";

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
  const { userId, membershipId } = session.metadata ?? {};

  if (!userId) {
    return new Response("Missing metadata", { status: 400 });
  }

  const isFirstActivation = !membershipId;

  // Idempotency guard — discard duplicate webhook deliveries
  const existing = await db
    .select({ id: processedExternalOrders.id })
    .from(processedExternalOrders)
    .where(eq(processedExternalOrders.externalOrderId, session.id))
    .limit(1);

  if (existing[0]) {
    return new Response("ok", { status: 200 });
  }

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

  // Fetch last checksum for ledger chaining
  const lastTx = await db
    .select({ checksum: transactions.checksum })
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(1);

  const txId = randomUUID();
  const amount = (session.amount_total ?? 3000) / 100;

  // Minimal checksum — no WalletService import to avoid server-bundle cycle
  const { createHash } = await import("crypto");
  const checksumPayload = JSON.stringify({
    id: txId,
    userId,
    amount,
    type: "debit",
    referenceId: null,
    previousChecksum: lastTx[0]?.checksum ?? null,
  });
  const checksum = createHash("sha256").update(checksumPayload).digest("hex");

  await db.transaction(async (tx) => {
    await tx.insert(processedExternalOrders).values({
      externalOrderId: session.id,
      memberId: userId,
    });

    await tx.insert(transactions).values({
      id: txId,
      userId,
      amount: amount.toFixed(2),
      type: "debit",
      description: isFirstActivation
        ? "Activación de membresía vía Stripe"
        : "Renovación de membresía vía Stripe",
      checksum,
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
