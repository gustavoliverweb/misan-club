/**
 * SECURITY TESTS — ALTA 1: Webhooks MDS/Services usan HMAC en lugar de secreto en plano
 *
 * Vulnerabilidad original:
 *   verifySignature(header, secret) comparaba el header directamente contra el
 *   secreto crudo. El emisor tenía que enviar el secreto en claro en cada request,
 *   exponiéndolo a cualquier intermediario que inspeccionara los headers.
 *
 * Fix aplicado:
 *   verifyHmac(rawBody, header, secret) calcula HMAC-SHA256 del body crudo con el
 *   secreto y compara el digest hex resultante contra el header usando timingSafeEqual.
 *   El secreto nunca viaja por la red; la firma está ligada al payload concreto.
 *
 * Estos tests verifican que:
 *   1. Una firma HMAC válida del body es aceptada.
 *   2. Un header vacío o ausente es rechazado (401).
 *   3. El secreto crudo enviado como header es rechazado (401) — regresión del bug.
 *   4. Una firma válida para un body diferente es rechazada (payload tampering).
 *   5. Un secreto no configurado devuelve 500, no 401.
 *   6. Body JSON inválido devuelve 400 tras pasar la firma.
 *   7. Payload que no cumple el schema devuelve 400.
 *   8. Idempotencia: un order_id duplicado devuelve 200 con duplicate: true.
 *   9. Miembro no encontrado devuelve 404.
 */

import { createHmac } from "crypto";
import { vi, describe, it, expect, beforeEach } from "vitest";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

function makeRequest(body: string, signature: string): Request {
  return new Request("http://localhost/api/webhooks/mds", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-misan-signature": signature,
    },
    body,
  });
}

function makeServicesRequest(body: string, signature: string): Request {
  return new Request("http://localhost/api/webhooks/services", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-misan-signature": signature,
    },
    body,
  });
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SECRET = "test-webhook-secret-abc123";
const MEMBER_ID = "00000000-0000-4000-8000-000000000001";

const MDS_PAYLOAD = JSON.stringify({
  external_order_id: "ext-order-001",
  member_email: "member@example.com",
  net_amount: 100,
  category: "standard",
});

const SERVICES_PAYLOAD = JSON.stringify({
  external_order_id: "ext-order-002",
  member_email: "member@example.com",
  commercial_margin: 200,
});

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/infra/db", () => ({ db: mockDb }));

const mockProcessSale = vi.hoisted(() => vi.fn());
vi.mock("@/app/actions/business-actions", () => ({
  processSaleAction: mockProcessSale,
}));

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
  process.env.MDS_WEBHOOK_SECRET = SECRET;
  process.env.SERVICES_WEBHOOK_SECRET = SECRET;
});

// ─── MDS webhook ─────────────────────────────────────────────────────────────

describe("MDS webhook — HMAC signature verification", () => {
  it("accepts a valid HMAC signature", async () => {
    const sig = sign(MDS_PAYLOAD, SECRET);

    // idempotency check → no duplicate
    const selectChain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() };
    selectChain.from.mockReturnValue(selectChain);
    selectChain.where.mockReturnValue(selectChain);
    selectChain.limit.mockResolvedValue([]);

    // member lookup
    const memberChain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() };
    memberChain.from.mockReturnValue(memberChain);
    memberChain.where.mockReturnValue(memberChain);
    memberChain.limit.mockResolvedValue([{ id: MEMBER_ID }]);

    mockDb.select
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(memberChain);

    const insertChain = { values: vi.fn().mockResolvedValue(undefined) };
    mockDb.insert.mockReturnValue(insertChain);

    mockProcessSale.mockResolvedValue({
      success: true,
      data: { transactionIds: ["tx-1"] },
    });

    const { POST } = await import("@/app/api/webhooks/mds/route");
    const res = await POST(makeRequest(MDS_PAYLOAD, sig) as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("rejects an empty signature with 401", async () => {
    const { POST } = await import("@/app/api/webhooks/mds/route");
    const res = await POST(makeRequest(MDS_PAYLOAD, "") as never);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("rejects the raw secret sent as header (regression test for original bug)", async () => {
    const { POST } = await import("@/app/api/webhooks/mds/route");
    // Old vulnerable behavior: header === secret would have passed
    const res = await POST(makeRequest(MDS_PAYLOAD, SECRET) as never);

    expect(res.status).toBe(401);
  });

  it("rejects a valid signature computed over a different body (payload tampering)", async () => {
    const tampered = JSON.stringify({ ...JSON.parse(MDS_PAYLOAD), net_amount: 9999 });
    const sigForOriginal = sign(MDS_PAYLOAD, SECRET);

    const { POST } = await import("@/app/api/webhooks/mds/route");
    // Send tampered body but signature of original body
    const res = await POST(makeRequest(tampered, sigForOriginal) as never);

    expect(res.status).toBe(401);
  });

  it("rejects a signature computed with a different secret", async () => {
    const sig = sign(MDS_PAYLOAD, "wrong-secret");

    const { POST } = await import("@/app/api/webhooks/mds/route");
    const res = await POST(makeRequest(MDS_PAYLOAD, sig) as never);

    expect(res.status).toBe(401);
  });

  it("returns 500 when MDS_WEBHOOK_SECRET is not set", async () => {
    delete process.env.MDS_WEBHOOK_SECRET;
    const sig = sign(MDS_PAYLOAD, SECRET);

    const { POST } = await import("@/app/api/webhooks/mds/route");
    const res = await POST(makeRequest(MDS_PAYLOAD, sig) as never);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Server misconfiguration");
  });

  it("returns 400 for invalid JSON after valid signature", async () => {
    const invalidBody = "not-json{{{";
    const sig = sign(invalidBody, SECRET);

    const { POST } = await import("@/app/api/webhooks/mds/route");
    const res = await POST(makeRequest(invalidBody, sig) as never);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid JSON");
  });

  it("returns 400 when payload schema is invalid after valid signature", async () => {
    const badPayload = JSON.stringify({ external_order_id: "x", member_email: "not-an-email", net_amount: 50, category: "standard" });
    const sig = sign(badPayload, SECRET);

    const { POST } = await import("@/app/api/webhooks/mds/route");
    const res = await POST(makeRequest(badPayload, sig) as never);

    expect(res.status).toBe(400);
  });

  it("returns 200 duplicate:true for an already-processed order_id", async () => {
    const sig = sign(MDS_PAYLOAD, SECRET);

    const selectChain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() };
    selectChain.from.mockReturnValue(selectChain);
    selectChain.where.mockReturnValue(selectChain);
    selectChain.limit.mockResolvedValue([{ id: "existing-row" }]);

    mockDb.select.mockReturnValue(selectChain);

    const { POST } = await import("@/app/api/webhooks/mds/route");
    const res = await POST(makeRequest(MDS_PAYLOAD, sig) as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.duplicate).toBe(true);
    expect(mockProcessSale).not.toHaveBeenCalled();
  });

  it("returns 404 when member email is not found", async () => {
    const sig = sign(MDS_PAYLOAD, SECRET);

    // idempotency → not duplicate
    const dupChain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() };
    dupChain.from.mockReturnValue(dupChain);
    dupChain.where.mockReturnValue(dupChain);
    dupChain.limit.mockResolvedValue([]);

    // member lookup → not found
    const memberChain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() };
    memberChain.from.mockReturnValue(memberChain);
    memberChain.where.mockReturnValue(memberChain);
    memberChain.limit.mockResolvedValue([]);

    mockDb.select.mockReturnValueOnce(dupChain).mockReturnValueOnce(memberChain);

    const { POST } = await import("@/app/api/webhooks/mds/route");
    const res = await POST(makeRequest(MDS_PAYLOAD, sig) as never);

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Member not found");
  });
});

// ─── Services webhook ─────────────────────────────────────────────────────────

describe("Services webhook — HMAC signature verification", () => {
  it("accepts a valid HMAC signature", async () => {
    const sig = sign(SERVICES_PAYLOAD, SECRET);

    const dupChain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() };
    dupChain.from.mockReturnValue(dupChain);
    dupChain.where.mockReturnValue(dupChain);
    dupChain.limit.mockResolvedValue([]);

    const memberChain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() };
    memberChain.from.mockReturnValue(memberChain);
    memberChain.where.mockReturnValue(memberChain);
    memberChain.limit.mockResolvedValue([{ id: MEMBER_ID }]);

    mockDb.select.mockReturnValueOnce(dupChain).mockReturnValueOnce(memberChain);

    const insertChain = { values: vi.fn().mockResolvedValue(undefined) };
    mockDb.insert.mockReturnValue(insertChain);

    mockProcessSale.mockResolvedValue({
      success: true,
      data: { transactionIds: ["tx-2"] },
    });

    const { POST } = await import("@/app/api/webhooks/services/route");
    const res = await POST(makeServicesRequest(SERVICES_PAYLOAD, sig) as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("rejects an empty signature with 401", async () => {
    const { POST } = await import("@/app/api/webhooks/services/route");
    const res = await POST(makeServicesRequest(SERVICES_PAYLOAD, "") as never);

    expect(res.status).toBe(401);
  });

  it("rejects the raw secret sent as header (regression for original bug)", async () => {
    const { POST } = await import("@/app/api/webhooks/services/route");
    const res = await POST(makeServicesRequest(SERVICES_PAYLOAD, SECRET) as never);

    expect(res.status).toBe(401);
  });

  it("rejects a valid signature over a different body (payload tampering)", async () => {
    const tampered = JSON.stringify({ ...JSON.parse(SERVICES_PAYLOAD), commercial_margin: 9999 });
    const sigForOriginal = sign(SERVICES_PAYLOAD, SECRET);

    const { POST } = await import("@/app/api/webhooks/services/route");
    const res = await POST(makeServicesRequest(tampered, sigForOriginal) as never);

    expect(res.status).toBe(401);
  });

  it("returns 500 when SERVICES_WEBHOOK_SECRET and MDS_WEBHOOK_SECRET are both unset", async () => {
    delete process.env.SERVICES_WEBHOOK_SECRET;
    delete process.env.MDS_WEBHOOK_SECRET;
    const sig = sign(SERVICES_PAYLOAD, SECRET);

    const { POST } = await import("@/app/api/webhooks/services/route");
    const res = await POST(makeServicesRequest(SERVICES_PAYLOAD, sig) as never);

    expect(res.status).toBe(500);
  });

  it("returns 400 for invalid JSON after valid signature", async () => {
    const invalidBody = "{{bad-json";
    const sig = sign(invalidBody, SECRET);

    const { POST } = await import("@/app/api/webhooks/services/route");
    const res = await POST(makeServicesRequest(invalidBody, sig) as never);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid JSON");
  });
});