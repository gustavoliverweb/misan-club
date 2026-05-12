import { createHmac, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/infra/db";
import { users, processedExternalOrders } from "@/infra/db/schema";
import { processSaleAction } from "@/app/actions/business-actions";

const servicesPayloadSchema = z.object({
  external_order_id: z.string().min(1),
  member_email: z.string().email(),
  commercial_margin: z.number().positive(),
});

function verifyHmac(rawBody: string, header: string, secret: string): boolean {
  try {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(header);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function webhookLog(orderId: string, status: "Processed" | "Duplicate" | "Failed", detail?: string): void {
  const line = `[WEBHOOK] Received from Services - Order: ${orderId}, Status: ${status}${detail ? ` — ${detail}` : ""}`;
  console.log(line);
}

export async function POST(request: NextRequest): Promise<Response> {
  // ── 1. Read raw body (must happen before signature verification) ──────────
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  // ── 2. Signature check (HMAC-SHA256 of raw body) ──────────────────────────
  const signature = request.headers.get("x-misan-signature") ?? "";
  const secret = process.env.SERVICES_WEBHOOK_SECRET ?? process.env.MDS_WEBHOOK_SECRET ?? "";

  if (!secret) {
    console.error("[WEBHOOK] SERVICES_WEBHOOK_SECRET is not configured");
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  if (!verifyHmac(rawBody, signature, secret)) {
    console.warn("[WEBHOOK] Invalid signature — request rejected");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 3. Parse payload ──────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = servicesPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { external_order_id, member_email, commercial_margin } = parsed.data;

  // ── 3. Idempotency check ──────────────────────────────────────────────────
  const existing = await db
    .select({ id: processedExternalOrders.id })
    .from(processedExternalOrders)
    .where(eq(processedExternalOrders.externalOrderId, external_order_id))
    .limit(1);

  if (existing.length > 0) {
    webhookLog(external_order_id, "Duplicate");
    return Response.json({ ok: true, duplicate: true });
  }

  // ── 4. Resolve member ─────────────────────────────────────────────────────
  const memberRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, member_email))
    .limit(1);

  if (!memberRows[0]) {
    webhookLog(external_order_id, "Failed", `member not found: ${member_email}`);
    return Response.json({ error: "Member not found" }, { status: 404 });
  }

  const memberId = memberRows[0].id;

  // ── 5. Record idempotency key before processing ───────────────────────────
  await db.insert(processedExternalOrders).values({
    externalOrderId: external_order_id,
    memberId,
  });

  // ── 6. Process sale ───────────────────────────────────────────────────────
  // §3.1: saleAmountNet = 30% of commercialMargin (network commission base)
  const result = await processSaleAction({
    memberId,
    productId: crypto.randomUUID(),
    category: "service",
    saleAmountNet: Math.round(commercial_margin * 0.3 * 100) / 100,
    commercialMargin: commercial_margin,
  });

  if (!result.success) {
    webhookLog(external_order_id, "Failed", result.error);
    return Response.json({ error: result.error }, { status: 500 });
  }

  webhookLog(external_order_id, "Processed");
  return Response.json({ ok: true, transactionIds: result.data.transactionIds });
}
