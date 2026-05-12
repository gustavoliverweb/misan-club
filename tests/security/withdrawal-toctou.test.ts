/**
 * SECURITY TESTS — CRÍTICO 2: TOCTOU Race Condition / Double-Spend en retiros
 *
 * Vulnerabilidad original:
 *   requestWithdrawalAction leía el balance y luego insertaba el débito en dos
 *   operaciones separadas fuera de una transacción. Dos requests concurrentes
 *   podían leer el mismo balance, pasar la validación ambos y debitar dos veces,
 *   dejando la wallet en negativo (double-spend).
 *
 *   Timeline del ataque:
 *     T1: req-A lee txs → balance = 100 €
 *     T2: req-B lee txs → balance = 100 €  (antes de que req-A inserte)
 *     T3: req-A valida  → OK (100 >= 100)
 *     T4: req-B valida  → OK (100 >= 100)  ← ambos pasan
 *     T5: req-A inserta debit 100 €
 *     T6: req-B inserta debit 100 €         ← double-spend! balance = -100 €
 *
 * Fix aplicado:
 *   Todo el ciclo read→validate→insert está envuelto en db.transaction().
 *   El SELECT del usuario usa .for("update"), que acquiere un row-level lock.
 *   req-B bloquea en T2 hasta que req-A confirma la transacción. Cuando req-B
 *   se desbloquea, re-lee el balance ya actualizado → INSUFFICIENT_BALANCE.
 *
 * Estos tests verifican:
 *   1. db.transaction() se llama en cada retiro (la cobertura del lock existe).
 *   2. .for("update") se usa en la query del usuario (el lock se adquiere).
 *   3. El balance se calcula con las queries de tx, no con db (dentro del lock).
 *   4. Cuando el balance exactamente cubre el retiro, tiene éxito (boundary).
 *   5. Cuando el balance es insuficiente, falla con INSUFFICIENT_BALANCE.
 *   6. Escenario de race simulado: segunda petición ve balance ya debitado → falla.
 *   7. Dos retiros del mismo importe con saldo suficiente para ambos → ambos OK.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: mockAuth }));

const capturedInserts = vi.hoisted(() => ({ values: [] as Record<string, unknown>[] }));

// Cadena Drizzle dentro de la transacción
const mockTxChain = vi.hoisted(() => ({
  from: vi.fn(),
  where: vi.fn(),
  for: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
}));

const mockTx = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
}));

const mockDb = vi.hoisted(() => ({
  transaction: vi.fn(),
}));

vi.mock("@/infra/db", () => ({ db: mockDb }));

import { requestWithdrawalAction } from "@/app/actions/business-actions";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = "00000000-0000-4000-8000-000000000001";

const creditTx100 = {
  id:          "tx-credit-100",
  userId:      USER_ID,
  amount:      "100",
  type:        "credit" as const,
  description: "Comisión nivel 1",
  referenceId: null,
  checksum:    "a".repeat(64),
  createdAt:   new Date("2026-05-01T10:00:00Z"),
};

const creditTx200 = {
  id:          "tx-credit-200",
  userId:      USER_ID,
  amount:      "200",
  type:        "credit" as const,
  description: "Comisión nivel 1",
  referenceId: null,
  checksum:    "c".repeat(64),
  createdAt:   new Date("2026-05-01T09:00:00Z"),
};

// Debit que simula el retiro ya confirmado por una primera transacción concurrente.
const debitTx100 = {
  id:          "tx-debit-race",
  userId:      USER_ID,
  amount:      "100",
  type:        "debit" as const,
  description: "Solicitud de retiro",
  referenceId: null,
  checksum:    "b".repeat(64),
  createdAt:   new Date("2026-05-03T10:00:01Z"),
};

// ─── Helper: configura el mock para devolver una lista de txs específica ──────

function setupBalanceMock(txList: typeof creditTx100[]) {
  mockTxChain.from.mockReturnValue(mockTxChain);
  mockTxChain.where.mockReturnValue(mockTxChain);
  mockTxChain.for.mockReturnValue(mockTxChain);
  mockTxChain.limit.mockResolvedValue([{ kycStatus: "verified" }]);
  mockTxChain.orderBy.mockResolvedValue(txList);

  mockTx.select.mockReturnValue(mockTxChain);
  mockTx.insert.mockReturnValue({
    values: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      capturedInserts.values.push(data);
      return Promise.resolve([]);
    }),
  });

  mockDb.transaction.mockImplementation(
    async (callback: (tx: typeof mockTx) => Promise<unknown>) => callback(mockTx),
  );
}

// ─── Setup ────────────────────────────────────────────────────────────────────

// Advance 61 s per test so the rate-limit window (60 s) always resets between tests.
const BASE_TIME = new Date("2026-05-03T10:00:00Z").getTime();
let testRun = 0;

beforeEach(() => {
  vi.clearAllMocks();
  capturedInserts.values = [];

  mockAuth.mockResolvedValue({ user: { id: USER_ID, role: "user" } });

  setupBalanceMock([creditTx100]); // default: 100 € disponibles

  vi.useFakeTimers();
  vi.setSystemTime(BASE_TIME + testRun++ * 61_000);
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CRÍTICO 2 — TOCTOU Race Condition: estructura del fix", () => {

  describe("La transacción se usa en cada retiro", () => {
    it("abre db.transaction() en cada llamada a requestWithdrawalAction", async () => {
      await requestWithdrawalAction({ memberId: USER_ID, amount: 50 });

      expect(mockDb.transaction).toHaveBeenCalledOnce();
    });

    it("abre una transacción independiente por cada llamada", async () => {
      await requestWithdrawalAction({ memberId: USER_ID, amount: 50 });
      await requestWithdrawalAction({ memberId: USER_ID, amount: 50 });

      expect(mockDb.transaction).toHaveBeenCalledTimes(2);
    });

    it("no llama a db.transaction si la sesión no existe", async () => {
      mockAuth.mockResolvedValue(null);

      await requestWithdrawalAction({ memberId: USER_ID, amount: 50 });

      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it("no llama a db.transaction si el input es inválido", async () => {
      await requestWithdrawalAction({ memberId: USER_ID, amount: 10 }); // < 50 mínimo

      expect(mockDb.transaction).not.toHaveBeenCalled();
    });
  });

  describe("El row-level lock se adquiere con SELECT … FOR UPDATE", () => {
    it("llama a .for('update') en la query del usuario dentro de la transacción", async () => {
      await requestWithdrawalAction({ memberId: USER_ID, amount: 50 });

      // El lock se adquiere sobre el row del usuario para serializar concurrencia
      expect(mockTxChain.for).toHaveBeenCalledWith("update");
    });

    it(".for('update') se llama antes del INSERT del débito", async () => {
      const callOrder: string[] = [];

      mockTxChain.for.mockImplementation((mode: string) => {
        callOrder.push(`for:${mode}`);
        return mockTxChain;
      });
      mockTx.insert.mockImplementation(() => ({
        values: vi.fn().mockImplementation((data: Record<string, unknown>) => {
          callOrder.push("insert");
          capturedInserts.values.push(data);
          return Promise.resolve([]);
        }),
      }));

      await requestWithdrawalAction({ memberId: USER_ID, amount: 50 });

      const forIndex    = callOrder.indexOf("for:update");
      const insertIndex = callOrder.indexOf("insert");

      expect(forIndex).toBeGreaterThanOrEqual(0);
      expect(insertIndex).toBeGreaterThan(forIndex);
    });
  });

  describe("El balance se calcula dentro de la transacción", () => {
    it("usa tx.select (no db.select) para leer las transacciones del usuario", async () => {
      await requestWithdrawalAction({ memberId: USER_ID, amount: 50 });

      // Las queries se hacen a través de tx (mockTx), no directamente a db (mockDb)
      expect(mockTx.select).toHaveBeenCalled();
    });

    it("el INSERT del débito va por tx, no por db", async () => {
      await requestWithdrawalAction({ memberId: USER_ID, amount: 50 });

      expect(mockTx.insert).toHaveBeenCalled();
    });
  });
});

describe("CRÍTICO 2 — TOCTOU Race Condition: semántica de balance", () => {

  describe("Casos límite del balance", () => {
    it("aprueba el retiro cuando el balance es exactamente igual al importe solicitado", async () => {
      // balance = 100 €, retiro = 100 € → OK (boundary exacto)
      setupBalanceMock([creditTx100]);

      const result = await requestWithdrawalAction({ memberId: USER_ID, amount: 100 });

      expect(result.success).toBe(true);
      expect(capturedInserts.values[0]?.amount).toBe("100");
    });

    it("rechaza si el balance es cero", async () => {
      setupBalanceMock([]); // sin transacciones → balance = 0 €

      const result = await requestWithdrawalAction({ memberId: USER_ID, amount: 50 });

      expect(result.success).toBe(false);
      expect(result.success === false && result.error).toBe("INSUFFICIENT_BALANCE");
      expect(capturedInserts.values).toHaveLength(0);
    });

    it("rechaza si el balance es menor al importe solicitado", async () => {
      // balance = 100 €, retiro = 150 € → insuficiente
      setupBalanceMock([creditTx100]);

      const result = await requestWithdrawalAction({ memberId: USER_ID, amount: 150 });

      expect(result.success).toBe(false);
      expect(result.success === false && result.error).toBe("INSUFFICIENT_BALANCE");
      expect(capturedInserts.values).toHaveLength(0);
    });
  });

  describe("Escenario de race simulado: segunda petición ve el balance ya debitado", () => {
    /**
     * Simula el comportamiento correcto del fix:
     *
     * - req-A llega, adquiere el lock, lee balance=100, valida OK, inserta debit 100, confirma.
     * - req-B llega, adquiere el lock (req-A ya confirmó), re-lee balance=0 → INSUFFICIENT_BALANCE.
     *
     * En el test, simulamos esto cambiando lo que devuelve mockTxChain.orderBy entre las dos
     * llamadas: primera → solo crédito (100€), segunda → crédito + el débito ya confirmado (0€).
     */
    it("la segunda petición falla con INSUFFICIENT_BALANCE cuando la primera ya debitó el saldo completo", async () => {
      // Primera petición ve balance = 100 €
      mockTxChain.orderBy.mockResolvedValueOnce([creditTx100]);
      // Segunda petición ve balance = 0 € (crédito 100 - débito 100 ya confirmado)
      mockTxChain.orderBy.mockResolvedValueOnce([debitTx100, creditTx100]);

      const result1 = await requestWithdrawalAction({ memberId: USER_ID, amount: 100 });
      const result2 = await requestWithdrawalAction({ memberId: USER_ID, amount: 100 });

      // Primera petición: éxito
      expect(result1.success).toBe(true);

      // Segunda petición: falla — sin el fix ambas habrían tenido éxito (double-spend)
      expect(result2.success).toBe(false);
      expect(result2.success === false && result2.error).toBe("INSUFFICIENT_BALANCE");

      // Solo se insertó un débito, no dos
      const debits = capturedInserts.values.filter((r) => r.type === "debit");
      expect(debits).toHaveLength(1);
    });

    it("dos retiros parciales son válidos si el saldo alcanza para ambos", async () => {
      // balance = 200 €; dos retiros de 50 € cada uno → ambos deben pasar
      mockTxChain.orderBy.mockResolvedValueOnce([creditTx200]);
      mockTxChain.orderBy.mockResolvedValueOnce([creditTx200]);

      const result1 = await requestWithdrawalAction({ memberId: USER_ID, amount: 50 });
      const result2 = await requestWithdrawalAction({ memberId: USER_ID, amount: 50 });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      const debits = capturedInserts.values.filter((r) => r.type === "debit");
      expect(debits).toHaveLength(2);
    });

    it("la segunda petición usa siempre las queries de tx para re-leer el balance", async () => {
      mockTxChain.orderBy.mockResolvedValueOnce([creditTx100]);
      mockTxChain.orderBy.mockResolvedValueOnce([debitTx100, creditTx100]);

      await requestWithdrawalAction({ memberId: USER_ID, amount: 100 });
      await requestWithdrawalAction({ memberId: USER_ID, amount: 100 });

      // En ambas llamadas, las queries se hicieron a través de tx (no db directo)
      expect(mockTx.select).toHaveBeenCalledTimes(4); // 2 queries por llamada (user + txs)
      expect(mockDb.transaction).toHaveBeenCalledTimes(2);
    });
  });

  describe("Integridad del débito insertado", () => {
    it("el débito tiene userId, type='debit', amount y checksum correctos", async () => {
      const result = await requestWithdrawalAction({ memberId: USER_ID, amount: 75 });

      expect(result.success).toBe(true);
      const record = capturedInserts.values[0];
      expect(record?.userId).toBe(USER_ID);
      expect(record?.type).toBe("debit");
      expect(record?.amount).toBe("75");
      expect(typeof record?.checksum).toBe("string");
      expect((record?.checksum as string).length).toBe(64);
    });

    it("cada retiro genera un transactionId único", async () => {
      mockTxChain.orderBy.mockResolvedValueOnce([creditTx200]);
      mockTxChain.orderBy.mockResolvedValueOnce([creditTx200]);

      const result1 = await requestWithdrawalAction({ memberId: USER_ID, amount: 50 });
      const result2 = await requestWithdrawalAction({ memberId: USER_ID, amount: 50 });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      if (result1.success && result2.success) {
        expect(result1.data.transactionId).not.toBe(result2.data.transactionId);
      }
    });

    it("si el usuario no existe la transacción se revierte y no queda débito huérfano", async () => {
      // Simulamos que el SELECT FOR UPDATE no encuentra el usuario
      mockTxChain.limit.mockResolvedValueOnce([]);

      // db.transaction debe propagar el error (en producción PostgreSQL hace rollback)
      mockDb.transaction.mockImplementationOnce(
        async (callback: (tx: typeof mockTx) => Promise<unknown>) => {
          try {
            return await callback(mockTx);
          } catch {
            // Simula el rollback implícito de PostgreSQL al recibir el throw
            throw new Error("User not found");
          }
        },
      );

      const result = await requestWithdrawalAction({ memberId: USER_ID, amount: 50 });

      expect(result.success).toBe(false);
      expect(result.success === false && result.error).toBe("User not found");
      expect(capturedInserts.values).toHaveLength(0);
    });
  });
});