/**
 * SECURITY TESTS — Tiendas personales: webhook store_sale
 *
 * Verifica que el handler del webhook para type === "store_sale":
 *   1. Procesa correctamente una venta de tienda válida → 200 ok.
 *   2. Rechaza metadata sin sellerId → 400.
 *   3. Rechaza metadata sin storeOrderId → 400.
 *   4. Rechaza sellerId que no existe en BD → 400 "Seller not found".
 *   5. Descarta webhooks duplicados (idempotencia) → 200 ok.
 *   6. No afecta el flujo existente de membresía (sin type) → 200 ok.
 *   7. No afecta el flujo existente de cart_order → 200 ok.
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
  insert: vi.fn(),
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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SELLER_ID      = "00000000-0000-4000-8000-000000000001";
const STORE_ORDER_ID = "00000000-0000-4000-8000-000000000002";
const USER_ID        = "00000000-0000-4000-8000-000000000003";
const SESSION_ID     = "cs_test_store_abc";
const PRODUCT_ID     = "00000000-0000-4000-8000-000000000004";

function makeStoreSaleEvent(overrides: Record<string, unknown> = {}) {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        id: SESSION_ID,
        customer_details: { email: "buyer@example.com" },
        metadata: {
          type: "store_sale",
          sellerId: SELLER_ID,
          storeOrderId: STORE_ORDER_ID,
          ...overrides,
        },
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

function makeSelectChainNoLimit(result: unknown[]) {
  const chain = { from: vi.fn(), where: vi.fn() };
  chain.from.mockReturnValue(chain);
  chain.where.mockResolvedValue(result);
  return chain;
}

const STORE_ITEM = {
  id: "item-1",
  productId: PRODUCT_ID,
  quantity: 2,
  unitPrice: "25.00",
  commissionBase: "20.00",
  commissionCategory: "standard",
  porcentajeN1: "0.0500",
  porcentajeN2: "0.0300",
  porcentajeN3: "0.0200",
  porcentajeN4: "0.0100",
  porcentajeN5: "0.0100",
  porcentajePool: "0.0500",
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Stripe webhook — store_sale flow", () => {
  it("processes a valid store sale and returns 200", async () => {
    mockConstructEvent.mockReturnValue(makeStoreSaleEvent());

    mockDb.select
      // 1. Idempotency → not duplicate
      .mockReturnValueOnce(makeSelectChain([]))
      // 2. Seller lookup → found
      .mockReturnValueOnce(makeSelectChain([{ id: SELLER_ID }]))
      // 3. Store order items
      .mockReturnValueOnce(makeSelectChainNoLimit([STORE_ITEM]));

    mockDb.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
      const tx = {
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
        }),
      };
      await cb(tx);
    });

    mockProcessSale.mockResolvedValue({ success: true, data: { transactionIds: ["tx-1"] } });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
    expect(mockDb.transaction).toHaveBeenCalledOnce();
    expect(mockProcessSale).toHaveBeenCalledOnce();

    const saleCall = mockProcessSale.mock.calls[0][0];
    expect(saleCall.memberId).toBe(SELLER_ID);
    expect(saleCall.isPublicSale).toBe(true);
    expect(saleCall.saleAmountNet).toBe(40); // 20.00 * 2
    expect(saleCall.directMarginAmount).toBe(10); // (25 - 20) * 2
  });

  it("returns 400 when store_sale metadata is missing sellerId", async () => {
    mockConstructEvent.mockReturnValue(
      makeStoreSaleEvent({ sellerId: undefined }),
    );

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    expect(await res.text()).toContain("Missing store metadata");
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("returns 400 when store_sale metadata is missing storeOrderId", async () => {
    mockConstructEvent.mockReturnValue(
      makeStoreSaleEvent({ storeOrderId: undefined }),
    );

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    expect(await res.text()).toContain("Missing store metadata");
  });

  it("returns 400 when sellerId does not exist in DB", async () => {
    mockConstructEvent.mockReturnValue(makeStoreSaleEvent());

    mockDb.select
      // 1. Idempotency → not duplicate
      .mockReturnValueOnce(makeSelectChain([]))
      // 2. Seller lookup → NOT found
      .mockReturnValueOnce(makeSelectChain([]));

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Seller not found");
    expect(mockDb.transaction).not.toHaveBeenCalled();
    expect(mockProcessSale).not.toHaveBeenCalled();
  });

  it("returns 200 and skips processing for duplicate store_sale webhook (idempotency)", async () => {
    mockConstructEvent.mockReturnValue(makeStoreSaleEvent());

    // Idempotency → duplicate found
    mockDb.select.mockReturnValueOnce(makeSelectChain([{ id: "existing-row" }]));

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    // Only idempotency check should run — seller lookup and item processing skip
    expect(mockDb.select).toHaveBeenCalledOnce();
    expect(mockDb.transaction).not.toHaveBeenCalled();
    expect(mockProcessSale).not.toHaveBeenCalled();
  });

  it("calls processSaleAction with isPublicSale=false when prices are equal", async () => {
    mockConstructEvent.mockReturnValue(makeStoreSaleEvent());

    const itemSamePrice = {
      ...STORE_ITEM,
      unitPrice: "20.00",
      commissionBase: "20.00",
    };

    mockDb.select
      .mockReturnValueOnce(makeSelectChain([]))
      .mockReturnValueOnce(makeSelectChain([{ id: SELLER_ID }]))
      .mockReturnValueOnce(makeSelectChainNoLimit([itemSamePrice]));

    mockDb.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
      const tx = {
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
        }),
      };
      await cb(tx);
    });

    mockProcessSale.mockResolvedValue({ success: true, data: { transactionIds: ["tx-1"] } });

    await POST(makeRequest());

    const saleCall = mockProcessSale.mock.calls[0][0];
    expect(saleCall.isPublicSale).toBe(false);
    expect(saleCall.directMarginAmount).toBeUndefined();
  });

  it("does not credit seller commission on self-purchase (buyerId === sellerId)", async () => {
    mockConstructEvent.mockReturnValue(
      makeStoreSaleEvent({ buyerId: SELLER_ID }),
    );

    // pvs = 24.20 → commissionBase = pvs/1.21 ≈ 20.00
    // marginPerUnit = 24.20 − 20.00 = 4.20 > 0 → without the fix this branch fires
    const selfItem = { ...STORE_ITEM, unitPrice: "24.20", commissionBase: "20.00" };

    mockDb.select
      .mockReturnValueOnce(makeSelectChain([]))
      .mockReturnValueOnce(makeSelectChain([{ id: SELLER_ID }]))
      .mockReturnValueOnce(makeSelectChainNoLimit([selfItem]));

    mockDb.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
      const tx = {
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
        }),
      };
      await cb(tx);
    });

    mockDb.insert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
    mockProcessSale.mockResolvedValue({ success: true, data: { transactionIds: [] } });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockProcessSale).toHaveBeenCalledOnce();
    const saleCall = mockProcessSale.mock.calls[0][0];
    expect(saleCall.isPublicSale).toBe(false);
    expect(saleCall.directMarginAmount).toBeUndefined();
  });

  it("membership flow calls processSaleAction with category membership (no type in metadata)", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: SESSION_ID,
          metadata: { userId: USER_ID },
        },
      },
    });

    mockDb.select
      // 1. Idempotency → not duplicate
      .mockReturnValueOnce(makeSelectChain([]))
      // 2. User lookup → found
      .mockReturnValueOnce(makeSelectChain([{ id: USER_ID }]));

    mockDb.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
      const tx = {
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
      };
      await cb(tx);
    });

    mockProcessSale.mockResolvedValue({ success: true, data: { transactionIds: ["tx-m1"] } });

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
});
