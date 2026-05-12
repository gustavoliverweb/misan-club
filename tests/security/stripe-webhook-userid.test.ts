/**
 * SECURITY TESTS — ALTA 3: Stripe webhook no verifica userId en BD
 *
 * Vulnerabilidad original:
 *   El handler extraía userId de session.metadata (controlado por Stripe) y lo
 *   usaba directamente en INSERT INTO memberships y processedExternalOrders sin
 *   verificar que el usuario exista en nuestra BD. Un userId forjado o huérfano
 *   (usuario eliminado tras crear el checkout) generaba registros inconsistentes.
 *
 * Fix aplicado:
 *   Tras el idempotency check, se hace SELECT users WHERE id = userId. Si no
 *   devuelve filas → 400 "User not found". La transacción de escritura solo
 *   ocurre si el usuario existe.
 *
 * Estos tests verifican que:
 *   1. userId que existe en BD → 200 ok, membresía creada (first activation).
 *   2. userId que NO existe en BD → 400 "User not found" (core ALTA 3).
 *   3. Petición sin stripe-signature → 400.
 *   4. Firma Stripe inválida → 400.
 *   5. Evento que no es checkout.session.completed → 200 ok (ignorado).
 *   6. Metadata sin userId → 400 "Missing metadata".
 *   7. Webhook duplicado (idempotencia) → 200 ok, sin tocar membresías.
 *   8. Renovación: membership encontrada → 200 ok.
 *   9. Renovación: membership no encontrada → 404.
 */

import { vi, describe, it, expect, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockConstructEvent = vi.hoisted(() => vi.fn());
vi.mock("@/infra/stripe", () => ({
  stripe: { webhooks: { constructEvent: mockConstructEvent } },
}));

const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/infra/db", () => ({ db: mockDb }));

const mockCalculateNewExpiry = vi.hoisted(() => vi.fn());
vi.mock("@/core/services/membership-renewal.service", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MembershipRenewalService: vi.fn(function(this: any) {
    this.calculateNewExpiry = mockCalculateNewExpiry;
  }),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { POST } from "@/app/api/webhooks/stripe/route";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID       = "00000000-0000-4000-8000-000000000001";
const MEMBERSHIP_ID = "00000000-0000-4000-8000-000000000010";
const SESSION_ID    = "cs_test_abc123";

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        id: SESSION_ID,
        metadata: { userId: USER_ID, ...overrides },
      },
    },
  };
}

function makeRequest(body = "{}", sig = "valid-sig"): Request {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": sig },
    body,
  });
}

// ─── Chain helpers ────────────────────────────────────────────────────────────

function makeSelectChain(resolvedValue: unknown[]) {
  const chain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() };
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.limit.mockResolvedValue(resolvedValue);
  return chain;
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Stripe webhook — userId verification in DB", () => {
  it("accepts a valid checkout when userId exists in DB (first activation)", async () => {
    mockConstructEvent.mockReturnValue(makeEvent());

    // 1. Idempotency → not duplicate
    mockDb.select
      .mockReturnValueOnce(makeSelectChain([]))
      // 2. User lookup → found
      .mockReturnValueOnce(makeSelectChain([{ id: USER_ID }]));

    mockDb.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
      const tx = {
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
      };
      await cb(tx);
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
    expect(mockDb.transaction).toHaveBeenCalledOnce();
  });

  it("rejects a userId that does not exist in DB with 400 (ALTA 3 core)", async () => {
    mockConstructEvent.mockReturnValue(makeEvent());

    // 1. Idempotency → not duplicate
    mockDb.select
      .mockReturnValueOnce(makeSelectChain([]))
      // 2. User lookup → NOT found
      .mockReturnValueOnce(makeSelectChain([]));

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    expect(await res.text()).toBe("User not found");
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const req = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: "{}",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await res.text()).toContain("Missing stripe-signature");
  });

  it("returns 400 when stripe signature verification fails", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching");
    });

    const res = await POST(makeRequest("{}", "bad-sig"));

    expect(res.status).toBe(400);
    expect(await res.text()).toContain("No signatures found matching");
  });

  it("returns 200 ok and ignores non-checkout events", async () => {
    mockConstructEvent.mockReturnValue({ type: "payment_intent.created", data: { object: {} } });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("returns 400 when metadata is missing userId", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: SESSION_ID, metadata: {} } },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    expect(await res.text()).toContain("Missing metadata");
  });

  it("returns 200 ok and skips processing for duplicate webhook", async () => {
    mockConstructEvent.mockReturnValue(makeEvent());

    // Idempotency → duplicate found
    mockDb.select.mockReturnValueOnce(makeSelectChain([{ id: "existing-row" }]));

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    // User lookup should NOT be called after duplicate detected
    expect(mockDb.select).toHaveBeenCalledOnce();
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it("returns 200 ok for renewal when userId and membership both exist", async () => {
    const renewalExpiry = new Date("2026-06-12T00:00:00Z");
    mockConstructEvent.mockReturnValue(makeEvent({ membershipId: MEMBERSHIP_ID }));
    mockCalculateNewExpiry.mockReturnValue(renewalExpiry);

    mockDb.select
      // 1. Idempotency → not duplicate
      .mockReturnValueOnce(makeSelectChain([]))
      // 2. User lookup → found
      .mockReturnValueOnce(makeSelectChain([{ id: USER_ID }]))
      // 3. Membership lookup → found
      .mockReturnValueOnce(makeSelectChain([{ expiresAt: new Date("2026-05-12T00:00:00Z") }]));

    mockDb.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
      const tx = {
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }),
      };
      await cb(tx);
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockDb.transaction).toHaveBeenCalledOnce();
  });

  it("returns 404 when renewal membership is not found", async () => {
    mockConstructEvent.mockReturnValue(makeEvent({ membershipId: MEMBERSHIP_ID }));

    mockDb.select
      // 1. Idempotency → not duplicate
      .mockReturnValueOnce(makeSelectChain([]))
      // 2. User lookup → found
      .mockReturnValueOnce(makeSelectChain([{ id: USER_ID }]))
      // 3. Membership lookup → NOT found
      .mockReturnValueOnce(makeSelectChain([]));

    const res = await POST(makeRequest());

    expect(res.status).toBe(404);
    expect(await res.text()).toContain("Membership not found");
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });
});