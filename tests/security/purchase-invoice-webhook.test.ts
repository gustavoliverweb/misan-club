/**
 * SECURITY TESTS — Purchase invoices created by Stripe webhook
 *
 * Verifica que el webhook crea purchase_invoices correctamente:
 *   1. cart_order → crea purchase_invoice para el comprador (userId).
 *   2. store_sale con buyerId → crea purchase_invoice para el comprador.
 *   3. store_sale sin buyerId → NO crea purchase_invoice.
 *   4. store_sale con buyerId === sellerId (auto-compra) → crea purchase_invoice.
 *   5. Fallo al insertar purchase_invoice no bloquea respuesta 200 (best-effort).
 */

import { vi, describe, it, expect, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockConstructEvent = vi.hoisted(() => vi.fn());
vi.mock("@/infra/stripe", () => ({
  stripe: { webhooks: { constructEvent: mockConstructEvent } },
}));

const mockInsertValues = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockInsert = vi.hoisted(() => vi.fn(() => ({ values: mockInsertValues })));

const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  transaction: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
  insert: mockInsert,
}));
vi.mock("@/infra/db", () => ({ db: mockDb }));

vi.mock("@/core/services/membership-renewal.service", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MembershipRenewalService: vi.fn(function (this: any) {
    this.calculateNewExpiry = vi.fn();
  }),
}));

const mockProcessSale = vi.hoisted(() => vi.fn());
vi.mock("@/app/actions/business-actions", () => ({
  processSaleAction: mockProcessSale,
}));

import { POST } from "@/app/api/webhooks/stripe/route";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SELLER_ID      = "00000000-0000-4000-8000-000000000001";
const BUYER_ID       = "00000000-0000-4000-8000-000000000010";
const STORE_ORDER_ID = "00000000-0000-4000-8000-000000000002";
const USER_ID        = "00000000-0000-4000-8000-000000000003";
const ORDER_ID       = "00000000-0000-4000-8000-000000000005";
const CART_ID        = "00000000-0000-4000-8000-000000000006";
const SESSION_ID     = "cs_test_purchase_abc";

const STORE_ITEM = {
  id: "item-1",
  orderId: STORE_ORDER_ID,
  productId: "00000000-0000-4000-8000-000000000004",
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

const ORDER_ITEM = {
  id: "oi-1",
  orderId: ORDER_ID,
  productId: "00000000-0000-4000-8000-000000000004",
  quantity: 1,
  unitPrice: "30.00",
  commissionBase: "25.00",
  isSocioPrice: true,
  commissionCategory: "standard",
  porcentajeN1: "0.0500",
  porcentajeN2: "0.0300",
  porcentajeN3: "0.0200",
  porcentajeN4: "0.0100",
  porcentajeN5: "0.0100",
  porcentajePool: "0.0500",
};

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

function makeTransactionMock() {
  return mockDb.transaction.mockImplementation(
    async (cb: (tx: unknown) => Promise<void>) => {
      const tx = {
        insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
        })),
        delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
      };
      await cb(tx);
    },
  );
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  mockInsert.mockReturnValue({ values: mockInsertValues });
  mockInsertValues.mockResolvedValue(undefined);
  mockProcessSale.mockResolvedValue({ success: true, data: { transactionIds: [] } });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Stripe webhook — purchase invoice creation", () => {
  describe("cart_order flow", () => {
    it("creates a purchase_invoice for the buyer after marking order paid", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            id: SESSION_ID,
            metadata: {
              type: "cart_order",
              userId: USER_ID,
              orderId: ORDER_ID,
              cartId: CART_ID,
            },
          },
        },
      });

      mockDb.select
        // 1. Idempotency → not duplicate
        .mockReturnValueOnce(makeSelectChain([]))
        // 2. User lookup → found
        .mockReturnValueOnce(makeSelectChain([{ id: USER_ID }]))
        // 3. Order items
        .mockReturnValueOnce(makeSelectChainNoLimit([ORDER_ITEM]))
        // 4. Cart lookup for clear
        .mockReturnValueOnce(makeSelectChain([{ id: CART_ID }]));

      makeTransactionMock();
      mockDb.delete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);

      // insert should be called for purchase_invoice (best-effort, outside transaction)
      const insertCalls = mockInsert.mock.calls;
      expect(insertCalls.length).toBeGreaterThanOrEqual(1);
    });

    it("returns 200 even if purchase_invoice insert fails (best-effort)", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            id: SESSION_ID,
            metadata: {
              type: "cart_order",
              userId: USER_ID,
              orderId: ORDER_ID,
              cartId: CART_ID,
            },
          },
        },
      });

      mockDb.select
        .mockReturnValueOnce(makeSelectChain([]))
        .mockReturnValueOnce(makeSelectChain([{ id: USER_ID }]))
        .mockReturnValueOnce(makeSelectChainNoLimit([ORDER_ITEM]))
        .mockReturnValueOnce(makeSelectChain([{ id: CART_ID }]));

      makeTransactionMock();
      mockDb.delete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });

      // Simulate insert failure
      mockInsertValues.mockRejectedValueOnce(new Error("DB error"));

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
    });
  });

  describe("store_sale flow", () => {
    it("creates a purchase_invoice when buyerId is present in metadata", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            id: SESSION_ID,
            customer_details: { email: "buyer@example.com" },
            metadata: {
              type: "store_sale",
              sellerId: SELLER_ID,
              storeOrderId: STORE_ORDER_ID,
              buyerId: BUYER_ID,
            },
          },
        },
      });

      mockDb.select
        .mockReturnValueOnce(makeSelectChain([]))
        .mockReturnValueOnce(makeSelectChain([{ id: SELLER_ID }]))
        .mockReturnValueOnce(makeSelectChainNoLimit([STORE_ITEM]));

      makeTransactionMock();

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);

      // Verify insert was called (for purchase_invoice)
      expect(mockInsert).toHaveBeenCalled();
      const insertedValues = mockInsertValues.mock.calls[0]?.[0];
      expect(insertedValues).toMatchObject({
        userId: BUYER_ID,
        storeOrderId: STORE_ORDER_ID,
      });
    });

    it("does NOT create a purchase_invoice when buyerId is absent", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            id: SESSION_ID,
            customer_details: { email: "guest@example.com" },
            metadata: {
              type: "store_sale",
              sellerId: SELLER_ID,
              storeOrderId: STORE_ORDER_ID,
              // no buyerId
            },
          },
        },
      });

      mockDb.select
        .mockReturnValueOnce(makeSelectChain([]))
        .mockReturnValueOnce(makeSelectChain([{ id: SELLER_ID }]))
        .mockReturnValueOnce(makeSelectChainNoLimit([STORE_ITEM]));

      makeTransactionMock();

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      // No insert should happen for purchase_invoice
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("does NOT create a purchase_invoice when buyerId is empty string", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            id: SESSION_ID,
            customer_details: { email: "guest@example.com" },
            metadata: {
              type: "store_sale",
              sellerId: SELLER_ID,
              storeOrderId: STORE_ORDER_ID,
              buyerId: "",
            },
          },
        },
      });

      mockDb.select
        .mockReturnValueOnce(makeSelectChain([]))
        .mockReturnValueOnce(makeSelectChain([{ id: SELLER_ID }]))
        .mockReturnValueOnce(makeSelectChainNoLimit([STORE_ITEM]));

      makeTransactionMock();

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("creates purchase_invoice when buyer is the seller (self-purchase)", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            id: SESSION_ID,
            customer_details: { email: "seller@example.com" },
            metadata: {
              type: "store_sale",
              sellerId: SELLER_ID,
              storeOrderId: STORE_ORDER_ID,
              buyerId: SELLER_ID, // self-purchase
            },
          },
        },
      });

      mockDb.select
        .mockReturnValueOnce(makeSelectChain([]))
        .mockReturnValueOnce(makeSelectChain([{ id: SELLER_ID }]))
        .mockReturnValueOnce(makeSelectChainNoLimit([STORE_ITEM]));

      makeTransactionMock();

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(mockInsert).toHaveBeenCalled();
      const insertedValues = mockInsertValues.mock.calls[0]?.[0];
      expect(insertedValues.userId).toBe(SELLER_ID);
    });

    it("returns 200 even if purchase_invoice insert fails for store_sale (best-effort)", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            id: SESSION_ID,
            customer_details: { email: "buyer@example.com" },
            metadata: {
              type: "store_sale",
              sellerId: SELLER_ID,
              storeOrderId: STORE_ORDER_ID,
              buyerId: BUYER_ID,
            },
          },
        },
      });

      mockDb.select
        .mockReturnValueOnce(makeSelectChain([]))
        .mockReturnValueOnce(makeSelectChain([{ id: SELLER_ID }]))
        .mockReturnValueOnce(makeSelectChainNoLimit([STORE_ITEM]));

      makeTransactionMock();
      mockInsertValues.mockRejectedValueOnce(new Error("DB error"));

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
    });
  });
});
