/**
 * TESTS — Comisiones por membresía
 *
 * Verifica que el webhook checkout.session.completed:
 *   1. Llama a processSaleAction con category "membership" en primera activación.
 *   2. Llama a processSaleAction con category "membership" en renovación.
 *   3. Pasa saleAmountNet = 81.82 (€99 bruto − 21% IVA).
 *   4. No llama a processSaleAction si el webhook es duplicado (idempotencia).
 *   5. Devuelve 200 aunque processSaleAction falle (best-effort).
 *   6. Las tasas de membresía son N1=3%, N2=3%, N3=3%, N4=4%, N5=5%.
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
  delete: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/infra/db", () => ({ db: mockDb }));

const mockCalculateNewExpiry = vi.hoisted(() => vi.fn());
vi.mock("@/core/services/membership-renewal.service", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MembershipRenewalService: vi.fn(function (this: any) {
    this.calculateNewExpiry = mockCalculateNewExpiry;
  }),
}));

const mockProcessSale = vi.hoisted(() => vi.fn());
vi.mock("@/app/actions/business-actions", () => ({
  processSaleAction: mockProcessSale,
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { POST } from "@/app/api/webhooks/stripe/route";
import { CATEGORY_CONFIG } from "@/core/domain/product-category";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID       = "00000000-0000-4000-8000-000000000003";
const MEMBERSHIP_ID = "00000000-0000-4000-8000-000000000010";
const SESSION_ID    = "cs_test_membership_abc";

function makeFirstActivationEvent() {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        id: SESSION_ID,
        metadata: { userId: USER_ID },
      },
    },
  };
}

function makeRenewalEvent() {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        id: SESSION_ID,
        metadata: { userId: USER_ID, membershipId: MEMBERSHIP_ID },
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

function makeSelectChain(result: unknown[]) {
  const chain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() };
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.limit.mockResolvedValue(result);
  return chain;
}

function mockTransactionWithInsert() {
  mockDb.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
    const tx = {
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
      }),
    };
    await cb(tx);
  });
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  mockProcessSale.mockResolvedValue({ success: true, data: { transactionIds: ["tx-m1"] } });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Membership commission rates (CATEGORY_CONFIG)", () => {
  it("N1=3%, N2=3%, N3=3%, N4=4%, N5=5%", () => {
    expect(CATEGORY_CONFIG.membership.levelPercentages).toEqual([0.03, 0.03, 0.03, 0.04, 0.05]);
  });

  it("pool rate = 5%", () => {
    expect(CATEGORY_CONFIG.membership.poolRate).toBe(0.05);
  });
});

describe("Stripe webhook — membership commission flow", () => {
  it("first activation triggers processSaleAction with category membership", async () => {
    mockConstructEvent.mockReturnValue(makeFirstActivationEvent());

    mockDb.select
      .mockReturnValueOnce(makeSelectChain([]))             // idempotency → no duplicate
      .mockReturnValueOnce(makeSelectChain([{ id: USER_ID }])); // user lookup → found

    mockTransactionWithInsert();

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockProcessSale).toHaveBeenCalledOnce();

    const call = mockProcessSale.mock.calls[0][0];
    expect(call.memberId).toBe(USER_ID);
    expect(call.category).toBe("membership");
    expect(call.saleAmountNet).toBe(81.82);
    expect(call.isPublicSale).toBe(false);
    expect(call.eventLabel).toBe("activación de membresía");
  });

  it("renewal triggers processSaleAction with category membership", async () => {
    mockConstructEvent.mockReturnValue(makeRenewalEvent());

    const futureDate = new Date("2027-06-05T00:00:00Z");
    mockCalculateNewExpiry.mockReturnValue(futureDate);

    mockDb.select
      .mockReturnValueOnce(makeSelectChain([]))                                   // idempotency → no duplicate
      .mockReturnValueOnce(makeSelectChain([{ id: USER_ID }]))                    // user lookup → found
      .mockReturnValueOnce(makeSelectChain([{ expiresAt: new Date("2026-06-05") }])); // membership lookup

    mockTransactionWithInsert();

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockProcessSale).toHaveBeenCalledOnce();

    const call = mockProcessSale.mock.calls[0][0];
    expect(call.memberId).toBe(USER_ID);
    expect(call.category).toBe("membership");
    expect(call.saleAmountNet).toBe(81.82);
    expect(call.eventLabel).toBe("renovación de membresía");
  });

  it("duplicate webhook does not trigger processSaleAction (idempotency)", async () => {
    mockConstructEvent.mockReturnValue(makeFirstActivationEvent());

    // Idempotency check → duplicate found → early return
    mockDb.select.mockReturnValueOnce(makeSelectChain([{ id: "existing-row" }]));

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockProcessSale).not.toHaveBeenCalled();
  });

  it("returns 200 even if processSaleAction throws (best-effort)", async () => {
    mockConstructEvent.mockReturnValue(makeFirstActivationEvent());

    mockDb.select
      .mockReturnValueOnce(makeSelectChain([]))
      .mockReturnValueOnce(makeSelectChain([{ id: USER_ID }]));

    mockTransactionWithInsert();
    mockProcessSale.mockRejectedValue(new Error("DB failure"));

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });

  it("returns 200 even if processSaleAction returns failure (best-effort)", async () => {
    mockConstructEvent.mockReturnValue(makeFirstActivationEvent());

    mockDb.select
      .mockReturnValueOnce(makeSelectChain([]))
      .mockReturnValueOnce(makeSelectChain([{ id: USER_ID }]));

    mockTransactionWithInsert();
    mockProcessSale.mockResolvedValue({ success: false, error: "No upline found" });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
  });
});
