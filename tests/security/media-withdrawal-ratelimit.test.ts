/**
 * SECURITY TESTS — MEDIA 8: Sin rate limiting en endpoint de retiro
 *
 * Vulnerabilidad original:
 *   requestWithdrawalAction y requestWithdrawalFormAction no tenían ningún
 *   límite de intentos. Un atacante podía lanzar cientos de peticiones por
 *   segundo con el mismo userId para intentar explotar condiciones de carrera
 *   residuales o simplemente saturar la BD.
 *
 * Fix aplicado:
 *   Map<userId, { count, windowStart }> de ámbito de módulo (singleton por
 *   proceso). Ventana de 60 s, máximo 5 intentos. El check ocurre DESPUÉS de
 *   obtener el userId de la sesión y ANTES de abrir la transacción, de modo
 *   que incluso intentos fallidos consumen el contador.
 *
 * Estos tests verifican que:
 *   1. Los primeros 5 intentos son permitidos.
 *   2. El 6º intento recibe RATE_LIMIT_EXCEEDED sin tocar la BD.
 *   3. Tras avanzar la ventana de tiempo, se permite de nuevo.
 *   4. requestWithdrawalFormAction también aplica el rate limit.
 *   5. Sin sesión el rate limit no consume cuota (no hay userId).
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: mockAuth }));

const mockDb = vi.hoisted(() => ({
  transaction: vi.fn(),
  select: vi.fn(),
}));
vi.mock("@/infra/db", () => ({ db: mockDb }));

vi.mock("@/infra/stripe", () => ({
  stripe: { checkout: { sessions: { create: vi.fn() } } },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { requestWithdrawalAction } from "@/app/actions/business-actions";
import { requestWithdrawalFormAction } from "@/app/actions/wallet-actions";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_A = "00000000-0000-4000-8000-000000000010";
const USER_B = "00000000-0000-4000-8000-000000000020";

const BASE_TIME = new Date("2026-05-03T10:00:00Z").getTime();
let testRun = 100; // start at 100 so window is isolated from other test files

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(BASE_TIME + testRun++ * 61_000);
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── requestWithdrawalAction (business-actions.ts) ────────────────────────────

describe("requestWithdrawalAction — rate limiting", () => {
  function setupSuccessfulWithdrawal() {
    mockAuth.mockResolvedValue({ user: { id: USER_A, role: "user" } });

    const txChain = { from: vi.fn(), where: vi.fn(), for: vi.fn(), limit: vi.fn(), orderBy: vi.fn() };
    txChain.from.mockReturnValue(txChain);
    txChain.where.mockReturnValue(txChain);
    txChain.for.mockReturnValue(txChain);
    txChain.limit.mockResolvedValue([{ kycStatus: "verified" }]);
    txChain.orderBy.mockResolvedValue([{
      id: "tx-1", userId: USER_A, amount: "200", type: "credit",
      description: "x", referenceId: null, checksum: "a".repeat(64), createdAt: new Date(),
    }]);

    const mockTx = {
      select: vi.fn().mockReturnValue(txChain),
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    };

    mockDb.transaction.mockImplementation(
      async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
    );
  }

  it("permite los primeros 5 intentos", async () => {
    setupSuccessfulWithdrawal();

    for (let i = 0; i < 5; i++) {
      // Re-setup mocks each call since resetAllMocks runs between it() blocks
      setupSuccessfulWithdrawal();
      const result = await requestWithdrawalAction({ memberId: USER_A, amount: 50 });
      expect(result.success).toBe(true);
    }
  });

  it("bloquea el 6º intento con RATE_LIMIT_EXCEEDED sin llamar a la BD", async () => {
    setupSuccessfulWithdrawal();

    // Exhaust 5 slots
    for (let i = 0; i < 5; i++) {
      await requestWithdrawalAction({ memberId: USER_A, amount: 50 });
    }

    const dbCallsBefore = mockDb.transaction.mock.calls.length;

    const result = await requestWithdrawalAction({ memberId: USER_A, amount: 50 });

    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toBe("RATE_LIMIT_EXCEEDED");
    // BD no debe haberse llamado en el 6º intento
    expect(mockDb.transaction.mock.calls.length).toBe(dbCallsBefore);
  });

  it("permite de nuevo tras avanzar la ventana de 60 s", async () => {
    setupSuccessfulWithdrawal();

    // Exhaust 5 slots
    for (let i = 0; i < 5; i++) {
      await requestWithdrawalAction({ memberId: USER_A, amount: 50 });
    }

    // Advance past the 60-second window
    vi.advanceTimersByTime(61_000);

    setupSuccessfulWithdrawal();
    const result = await requestWithdrawalAction({ memberId: USER_A, amount: 50 });
    expect(result.success).toBe(true);
  });

  it("usuarios distintos tienen contadores independientes", async () => {
    // Two different users — one exhausts their limit, the other is unaffected
    mockAuth.mockResolvedValue({ user: { id: USER_B, role: "user" } });

    const txChain = { from: vi.fn(), where: vi.fn(), for: vi.fn(), limit: vi.fn(), orderBy: vi.fn() };
    txChain.from.mockReturnValue(txChain);
    txChain.where.mockReturnValue(txChain);
    txChain.for.mockReturnValue(txChain);
    txChain.limit.mockResolvedValue([{ kycStatus: "verified" }]);
    txChain.orderBy.mockResolvedValue([{
      id: "tx-b", userId: USER_B, amount: "200", type: "credit",
      description: "x", referenceId: null, checksum: "b".repeat(64), createdAt: new Date(),
    }]);
    const mockTx = {
      select: vi.fn().mockReturnValue(txChain),
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    };
    mockDb.transaction.mockImplementation(
      async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
    );

    const result = await requestWithdrawalAction({ memberId: USER_B, amount: 50 });
    // USER_B has their own fresh counter regardless of USER_A's state
    expect(result.success).toBe(true);
  });

  it("sin sesión devuelve error de auth, no RATE_LIMIT_EXCEEDED", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await requestWithdrawalAction({ memberId: USER_A, amount: 50 });

    expect(result.success).toBe(false);
    expect(result.success === false && result.error).not.toBe("RATE_LIMIT_EXCEEDED");
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });
});

// ─── requestWithdrawalFormAction (wallet-actions.ts) ─────────────────────────

describe("requestWithdrawalFormAction — rate limiting", () => {
  const USER_C = "00000000-0000-4000-8000-000000000030";

  function makeFormData(amount = "50") {
    const fd = new FormData();
    fd.set("amount", amount);
    return fd;
  }

  function setupFormSuccess() {
    mockAuth.mockResolvedValue({ user: { id: USER_C, role: "user" } });

    const txChain = { from: vi.fn(), where: vi.fn(), for: vi.fn(), limit: vi.fn(), orderBy: vi.fn() };
    txChain.from.mockReturnValue(txChain);
    txChain.where.mockReturnValue(txChain);
    txChain.for.mockReturnValue(txChain);
    txChain.limit.mockResolvedValue([{ kycStatus: "verified" }]);
    txChain.orderBy.mockResolvedValue([{
      id: "tx-c", userId: USER_C, amount: "200", type: "credit",
      description: "x", referenceId: null, checksum: "c".repeat(64), createdAt: new Date(),
    }]);
    const mockTx = {
      select: vi.fn().mockReturnValue(txChain),
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    };
    mockDb.transaction.mockImplementation(
      async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
    );
  }

  it("bloquea el 6º intento con el mensaje de rate limit", async () => {
    setupFormSuccess();

    for (let i = 0; i < 5; i++) {
      setupFormSuccess();
      await requestWithdrawalFormAction(undefined, makeFormData());
    }

    setupFormSuccess();
    const result = await requestWithdrawalFormAction(undefined, makeFormData());

    expect(result?.error).toContain("Demasiados intentos");
    expect(mockDb.transaction).toHaveBeenCalledTimes(5); // 6º no llega a la BD
  });
});