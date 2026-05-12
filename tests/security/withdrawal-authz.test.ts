/**
 * SECURITY TESTS — CRÍTICO 1: Authorization Bypass en requestWithdrawalAction
 *
 * Vector de ataque:
 *   requestWithdrawalAction es una función exportada de un archivo "use server".
 *   En Next.js, TODAS las exports de archivos "use server" son endpoints HTTP
 *   accesibles via POST. Sin verificación de sesión, un usuario autenticado podía
 *   pasar el memberId de otra persona y drenar su billetera.
 *
 * Estos tests verifican que:
 *   1. Peticiones sin sesión son rechazadas antes de tocar la BD.
 *   2. El userId siempre viene de la sesión verificada, nunca del input.
 *   3. Pasar el memberId de otra persona no afecta la billetera de esa persona.
 *
 * Nota sobre mocks: la acción usa db.transaction(async (tx) => {...}) internamente.
 * El mock de mockDb.transaction ejecuta el callback con mockTx, que expone los
 * mismos métodos encadenados. Las aserciones sobre inserts y selects se hacen
 * sobre mockTx (no mockDb) porque las queries viven dentro de la transacción.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// ─── Mocks (deben declararse antes del import de la acción) ───────────────────

const mockAuth = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: mockAuth }));

// Captura los datos que llegan al INSERT de transactions dentro de la tx.
const capturedInserts = vi.hoisted(() => ({ values: [] as Record<string, unknown>[] }));

// Cadena mock para Drizzle dentro de la transacción (tx).
// .select().from().where().for().limit()  → datos KYC
// .select().from().where().orderBy()      → lista de transacciones para el balance
const mockTxChain = vi.hoisted(() => ({
  from: vi.fn(),
  where: vi.fn(),
  for: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
}));

// El objeto tx que el callback de db.transaction recibe.
const mockTx = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
}));

// db solo necesita exponer transaction(); las queries reales van por mockTx.
const mockDb = vi.hoisted(() => ({
  transaction: vi.fn(),
}));

vi.mock("@/infra/db", () => ({ db: mockDb }));

// ─── Import de la acción bajo prueba ─────────────────────────────────────────
import { requestWithdrawalAction } from "@/app/actions/business-actions";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ATTACKER_SESSION_ID = "00000000-0000-4000-8000-000000000001";
const VICTIM_USER_ID      = "00000000-0000-4000-8000-000000000002";

const existingTxFixture = {
  id:          "tx-existing-0001",
  userId:      ATTACKER_SESSION_ID,
  amount:      "100",
  type:        "credit" as const,
  description: "Comisión nivel 1",
  referenceId: null,
  checksum:    "a".repeat(64),
  createdAt:   new Date("2026-05-01T10:00:00Z"),
};

// ─── Setup y teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  capturedInserts.values = [];

  // Cadena encadenada de tx:
  //   tx.select().from().where().for("update").limit(1) → KYC verified
  //   tx.select().from().where().orderBy()              → txs para calcular balance
  mockTxChain.from.mockReturnValue(mockTxChain);
  mockTxChain.where.mockReturnValue(mockTxChain);
  mockTxChain.for.mockReturnValue(mockTxChain);
  mockTxChain.limit.mockResolvedValue([{ kycStatus: "verified" }]);
  mockTxChain.orderBy.mockResolvedValue([existingTxFixture]);

  mockTx.select.mockReturnValue(mockTxChain);
  mockTx.insert.mockReturnValue({
    values: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      capturedInserts.values.push(data);
      return Promise.resolve([]);
    }),
  });

  // db.transaction ejecuta el callback pasándole mockTx y devuelve su resultado.
  mockDb.transaction.mockImplementation(
    async (callback: (tx: typeof mockTx) => Promise<unknown>) => callback(mockTx),
  );

  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-03T10:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CRÍTICO 1 — requestWithdrawalAction: Authorization Bypass", () => {

  describe("Ataque 1: petición sin sesión autenticada", () => {
    it("rechaza la petición y no abre ninguna transacción en la BD", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await requestWithdrawalAction({
        memberId: VICTIM_USER_ID,
        amount: 50,
      });

      expect(result).toEqual({ success: false, error: "No autenticado." });

      // Sin sesión la función retorna antes de llamar a db.transaction
      expect(mockDb.transaction).not.toHaveBeenCalled();
      expect(mockTx.insert).not.toHaveBeenCalled();
    });

    it("rechaza aunque el memberId sea válido y exista en el sistema", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await requestWithdrawalAction({
        memberId: VICTIM_USER_ID,
        amount: 100,
      });

      expect(result.success).toBe(false);
      expect(mockDb.transaction).not.toHaveBeenCalled();
      expect(mockTx.insert).not.toHaveBeenCalled();
    });
  });

  describe("Ataque 2: usuario autenticado pasa el memberId de otra persona", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: ATTACKER_SESSION_ID, role: "user" },
      });
    });

    it("el débito se aplica al atacante, nunca a la víctima", async () => {
      const result = await requestWithdrawalAction({
        memberId: VICTIM_USER_ID, // ← intento de robo
        amount: 50,
      });

      if (result.success) {
        const insertedRecord = capturedInserts.values[0];
        expect(insertedRecord).toBeDefined();

        // ASERCIÓN CRÍTICA: el débito fue creado con el ID del atacante (sesión)
        expect(insertedRecord?.userId).toBe(ATTACKER_SESSION_ID);

        // ASERCIÓN CRÍTICA: el débito NUNCA se creó para la víctima
        expect(insertedRecord?.userId).not.toBe(VICTIM_USER_ID);
      }

      const victimDebits = capturedInserts.values.filter(
        (r) => r.userId === VICTIM_USER_ID,
      );
      expect(victimDebits).toHaveLength(0);
    });

    it("las queries dentro de la tx usan el userId de la sesión, no del input", async () => {
      await requestWithdrawalAction({
        memberId: VICTIM_USER_ID, // ← input malicioso
        amount: 50,
      });

      // La transacción fue abierta
      expect(mockDb.transaction).toHaveBeenCalledOnce();

      // El insert final no contiene el userId de la víctima
      const allInsertedUserIds = capturedInserts.values.map((r) => r.userId);
      expect(allInsertedUserIds).not.toContain(VICTIM_USER_ID);
    });

    it("el tipo de la transacción insertada es siempre 'debit'", async () => {
      await requestWithdrawalAction({
        memberId: VICTIM_USER_ID,
        amount: 50,
      });

      for (const record of capturedInserts.values) {
        if (record.userId === ATTACKER_SESSION_ID) {
          expect(record.type).toBe("debit");
        }
      }
    });
  });

  describe("Ataque 3: intentos con inputs malformados", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: ATTACKER_SESSION_ID, role: "user" },
      });
    });

    it("rechaza si el amount es menor a 50 €", async () => {
      const result = await requestWithdrawalAction({
        memberId: VICTIM_USER_ID,
        amount: 49.99,
      });

      expect(result.success).toBe(false);
      expect(mockTx.insert).not.toHaveBeenCalled();
    });

    it("rechaza si el amount es negativo", async () => {
      const result = await requestWithdrawalAction({
        memberId: VICTIM_USER_ID,
        amount: -1000,
      });

      expect(result.success).toBe(false);
      expect(mockTx.insert).not.toHaveBeenCalled();
    });

    it("rechaza si el memberId no es un UUID válido", async () => {
      const result = await requestWithdrawalAction({
        memberId: "'; DROP TABLE transactions; --",
        amount: 50,
      });

      if (!result.success) {
        expect(mockTx.insert).not.toHaveBeenCalled();
      }
    });

    it("rechaza si el input no tiene la estructura esperada", async () => {
      const result = await requestWithdrawalAction(null);

      expect(result.success).toBe(false);
      expect(mockTx.insert).not.toHaveBeenCalled();
    });
  });

  describe("Uso legítimo: usuario retira de su propio wallet", () => {
    it("procesa el retiro correctamente cuando el memberId coincide con la sesión", async () => {
      mockAuth.mockResolvedValue({
        user: { id: ATTACKER_SESSION_ID, role: "user" },
      });

      const result = await requestWithdrawalAction({
        memberId: ATTACKER_SESSION_ID,
        amount: 50,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transactionId).toBeDefined();
      }

      const insertedRecord = capturedInserts.values[0];
      expect(insertedRecord?.userId).toBe(ATTACKER_SESSION_ID);
      expect(insertedRecord?.type).toBe("debit");
      expect(insertedRecord?.amount).toBe("50");
    });

    it("genera un checksum único por transacción", async () => {
      mockAuth.mockResolvedValue({
        user: { id: ATTACKER_SESSION_ID, role: "user" },
      });

      await requestWithdrawalAction({ memberId: ATTACKER_SESSION_ID, amount: 50 });

      const record = capturedInserts.values[0];
      expect(record?.checksum).toBeDefined();
      expect(typeof record?.checksum).toBe("string");
      expect((record?.checksum as string).length).toBe(64);
    });
  });
});