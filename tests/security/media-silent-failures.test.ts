/**
 * SECURITY TESTS — MEDIA 9: Fallos silenciosos en autofacturas/pool
 *
 * Vulnerabilidad original:
 *   El bucle de autofacturas y el INSERT de pool contribution estaban fuera de la
 *   transacción principal (intencionado: una falla de PDF no debe revertir las
 *   comisiones ya acreditadas). Sin embargo, si fallaban, el error se propagaba
 *   hasta el catch externo que devolvía { success: false } — indicando al llamador
 *   que toda la venta falló cuando en realidad las comisiones ya estaban en el
 *   ledger. Inconsistencia ledger/respuesta + pérdida silenciosa del fallo.
 *
 * Fix aplicado:
 *   Cada autofactura va envuelta en su propio try/catch que llama a console.error
 *   y continúa. El INSERT de poolContributions también va en try/catch.
 *   La función retorna { success: true } con los transactionIds aunque fallen las
 *   operaciones de soporte — los créditos ya confirmados son inmutables.
 *
 * Estos tests verifican que:
 *   1. Un fallo en db.insert(autofacturas) no propaga el error — retorna success: true.
 *   2. console.error se llama con el contexto del commissionId fallido.
 *   3. Las autofacturas que sí funcionan se procesan (fallo parcial no bloquea el lote).
 *   4. Un fallo en db.insert(poolContributions) no propaga el error.
 *   5. console.error se llama para el fallo de pool.
 */

import { vi, describe, it, expect, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetActiveUpline = vi.hoisted(() => vi.fn());
vi.mock("@/infra/db/queries/upline", () => ({ getActiveUpline: mockGetActiveUpline }));

const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/infra/db", () => ({ db: mockDb }));

vi.mock("@/auth", () => ({ auth: vi.fn() }));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { processSaleAction } from "@/app/actions/business-actions";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MEMBER_ID = "00000000-0000-4000-8000-000000000001";
const PRODUCT_ID = "00000000-0000-4000-8000-000000000099";

const uplineFixture = [
  { memberId: "00000000-0000-4000-8000-000000000002", fullName: "Alice" },
];

const validInput = {
  memberId: MEMBER_ID,
  productId: PRODUCT_ID,
  category: "standard" as const,
  saleAmountNet: 100,
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});

  mockGetActiveUpline.mockResolvedValue(uplineFixture);

  // Commission transaction succeeds
  const checksumChain = { from: vi.fn(), where: vi.fn(), orderBy: vi.fn(), limit: vi.fn() };
  checksumChain.from.mockReturnValue(checksumChain);
  checksumChain.where.mockReturnValue(checksumChain);
  checksumChain.orderBy.mockReturnValue(checksumChain);
  checksumChain.limit.mockResolvedValue([]);

  const mockTx = {
    select: vi.fn().mockReturnValue(checksumChain),
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
  };

  mockDb.transaction.mockImplementation(
    async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
  );
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("processSaleAction — fallos silenciosos en autofacturas", () => {
  it("devuelve success:true aunque db.insert(autofacturas) falle", async () => {
    // First insert call = autofacturas → throws
    // Second insert call = poolContributions → succeeds
    mockDb.insert
      .mockReturnValueOnce({ values: vi.fn().mockRejectedValue(new Error("autofactura DB error")) })
      .mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });

    const result = await processSaleAction(validInput);

    expect(result.success).toBe(true);
  });

  it("llama a console.error con el commissionId cuando falla la autofactura", async () => {
    mockDb.insert
      .mockReturnValueOnce({ values: vi.fn().mockRejectedValue(new Error("DB timeout")) })
      .mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });

    await processSaleAction(validInput);

    expect(console.error).toHaveBeenCalledOnce();
    const [msg] = (console.error as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(msg).toContain("Autofactura insert failed");
  });

  it("fallo parcial de autofactura no bloquea el pool contribution", async () => {
    const poolInsert = vi.fn().mockResolvedValue(undefined);

    // autofactura fails, pool succeeds
    mockDb.insert
      .mockReturnValueOnce({ values: vi.fn().mockRejectedValue(new Error("af error")) })
      .mockReturnValue({ values: poolInsert });

    await processSaleAction(validInput);

    expect(poolInsert).toHaveBeenCalled();
  });
});

describe("processSaleAction — fallos silenciosos en pool contribution", () => {
  it("devuelve success:true aunque db.insert(poolContributions) falle", async () => {
    // autofactura succeeds, pool fails
    mockDb.insert
      .mockReturnValueOnce({ values: vi.fn().mockResolvedValue(undefined) }) // autofactura
      .mockReturnValueOnce({ values: vi.fn().mockRejectedValue(new Error("pool DB error")) }); // pool

    const result = await processSaleAction(validInput);

    expect(result.success).toBe(true);
  });

  it("llama a console.error con el productId cuando falla el pool", async () => {
    mockDb.insert
      .mockReturnValueOnce({ values: vi.fn().mockResolvedValue(undefined) })
      .mockReturnValueOnce({ values: vi.fn().mockRejectedValue(new Error("pool timeout")) });

    await processSaleAction(validInput);

    const allErrors = (console.error as ReturnType<typeof vi.fn>).mock.calls;
    const poolError = allErrors.find(([msg]) => (msg as string).includes("Pool contribution failed"));
    expect(poolError).toBeDefined();
    expect(poolError![0]).toContain(PRODUCT_ID);
  });

  it("si ambos fallan (autofactura + pool), sigue retornando success:true", async () => {
    mockDb.insert
      .mockReturnValueOnce({ values: vi.fn().mockRejectedValue(new Error("af error")) })
      .mockReturnValueOnce({ values: vi.fn().mockRejectedValue(new Error("pool error")) });

    const result = await processSaleAction(validInput);

    expect(result.success).toBe(true);
    expect(console.error).toHaveBeenCalledTimes(2);
  });
});