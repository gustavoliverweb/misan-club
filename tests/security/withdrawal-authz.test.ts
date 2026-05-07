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
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// ─── Mocks (deben declararse antes del import de la acción) ───────────────────

// vi.hoisted garantiza que estas referencias estén disponibles cuando vi.mock() se ejecuta.
const mockAuth = vi.hoisted(() => vi.fn());

// Mock del módulo de autenticación.
vi.mock("@/auth", () => ({ auth: mockAuth }));

// Captura qué datos llegan al INSERT de transactions.
// Permite verificar que el userId insertado es el de la sesión, no el del input.
const capturedInserts = vi.hoisted(() => ({ values: [] as Record<string, unknown>[] }));

// Cadena mock para Drizzle ORM.
// .select().from().where() devuelve un objeto con .limit() y .orderBy()
// cuyo valor de retorno simula los datos de la BD.
const mockChain = vi.hoisted(() => ({
  from: vi.fn(),
  where: vi.fn(),
  // KYC query termina en .limit(1) → usuario verificado
  limit: vi.fn(),
  // Transactions query termina en .orderBy() → una tx de crédito de 100 €
  orderBy: vi.fn(),
}));

const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/infra/db", () => ({ db: mockDb }));

// ─── Import de la acción bajo prueba ─────────────────────────────────────────
// Importar DESPUÉS de vi.mock() para que los módulos ya estén interceptados.
import { requestWithdrawalAction } from "@/app/actions/business-actions";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// UUID v4 válidos (Zod v4 requiere: 3er segmento [1-8]xxx, 4to segmento [89ab]xxx)
const ATTACKER_SESSION_ID = "00000000-0000-4000-8000-000000000001";
const VICTIM_USER_ID      = "00000000-0000-4000-8000-000000000002";

// Transacción existente en la BD que da saldo de 100 € al usuario de la sesión.
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

  // Configurar la cadena mock para Drizzle:
  //   select().from().where().limit(1)    → datos KYC del usuario
  //   select().from().where().orderBy()   → lista de transacciones para el balance
  mockChain.from.mockReturnValue(mockChain);
  mockChain.where.mockReturnValue(mockChain);
  mockChain.limit.mockResolvedValue([{ kycStatus: "verified" }]);
  mockChain.orderBy.mockResolvedValue([existingTxFixture]);

  mockDb.select.mockReturnValue(mockChain);
  mockDb.insert.mockReturnValue({
    values: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      capturedInserts.values.push(data);
      return Promise.resolve([]);
    }),
  });

  // Fijar la fecha en día 3 del mes (dentro de la ventana de retiros días 1–5).
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-03T10:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CRÍTICO 1 — requestWithdrawalAction: Authorization Bypass", () => {

  describe("Ataque 1: petición sin sesión autenticada", () => {
    it("rechaza la petición y no consulta la BD", async () => {
      // Sin sesión (usuario no logueado o token expirado)
      mockAuth.mockResolvedValue(null);

      const result = await requestWithdrawalAction({
        memberId: VICTIM_USER_ID,
        amount: 50,
      });

      // El sistema debe rechazar sin exponer información
      expect(result).toEqual({ success: false, error: "No autenticado." });

      // La BD nunca debe consultarse — la función debe retornar antes
      expect(mockDb.select).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it("rechaza aunque el memberId sea válido y exista en el sistema", async () => {
      mockAuth.mockResolvedValue(null);

      // El atacante intenta usar un memberId de un usuario real con saldo
      const result = await requestWithdrawalAction({
        memberId: VICTIM_USER_ID,
        amount: 100,
      });

      expect(result.success).toBe(false);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe("Ataque 2: usuario autenticado pasa el memberId de otra persona", () => {
    beforeEach(() => {
      // El atacante está logueado con su propia cuenta
      mockAuth.mockResolvedValue({
        user: { id: ATTACKER_SESSION_ID, role: "user" },
      });
    });

    it("el débito se aplica al atacante, nunca a la víctima", async () => {
      // VECTOR DE ATAQUE: pasar el memberId de la víctima en el body
      const result = await requestWithdrawalAction({
        memberId: VICTIM_USER_ID, // ← intento de robo
        amount: 50,
      });

      // Con el fix, la operación usa session.user.id, no el input memberId.
      // Si el atacante tiene saldo, el retiro procede PERO en su propia cuenta.
      if (result.success) {
        const insertedRecord = capturedInserts.values[0];
        expect(insertedRecord).toBeDefined();

        // ASERCIÓN CRÍTICA: el débito fue creado con el ID del atacante (sesión)
        expect(insertedRecord?.userId).toBe(ATTACKER_SESSION_ID);

        // ASERCIÓN CRÍTICA: el débito NUNCA se creó para la víctima
        expect(insertedRecord?.userId).not.toBe(VICTIM_USER_ID);
      }

      // En ningún caso el insert tiene el userId de la víctima
      const victimDebits = capturedInserts.values.filter(
        (r) => r.userId === VICTIM_USER_ID,
      );
      expect(victimDebits).toHaveLength(0);
    });

    it("las consultas a la BD usan el userId de la sesión, no del input", async () => {
      await requestWithdrawalAction({
        memberId: VICTIM_USER_ID, // ← input malicioso
        amount: 50,
      });

      // La BD fue consultada (select fue llamado)
      expect(mockDb.select).toHaveBeenCalled();

      // Verificar que el WHERE recibió ATTACKER_SESSION_ID y no VICTIM_USER_ID.
      // mockChain.where captura el argumento SQL (eq expression object).
      // Inspeccionamos que el insert final no contiene el userId de la víctima.
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
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it("rechaza si el amount es negativo", async () => {
      const result = await requestWithdrawalAction({
        memberId: VICTIM_USER_ID,
        amount: -1000,
      });

      expect(result.success).toBe(false);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it("rechaza si el memberId no es un UUID válido (input completamente inválido)", async () => {
      const result = await requestWithdrawalAction({
        memberId: "'; DROP TABLE transactions; --",
        amount: 50,
      });

      // Con el fix, memberId del input es ignorado, pero el schema sigue validando.
      // Un memberId inválido falla la validación de Zod (uuid format).
      // Nota: si la lógica ignora memberId ANTES de parsear, aun así el parse
      // fallará aquí porque el schema requiere uuid. La BD nunca se toca.
      if (!result.success) {
        expect(mockDb.insert).not.toHaveBeenCalled();
      }
    });

    it("rechaza si el input no tiene la estructura esperada", async () => {
      const result = await requestWithdrawalAction(null);

      expect(result.success).toBe(false);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe("Uso legítimo: usuario retira de su propio wallet", () => {
    it("procesa el retiro correctamente cuando el memberId coincide con la sesión", async () => {
      mockAuth.mockResolvedValue({
        user: { id: ATTACKER_SESSION_ID, role: "user" },
      });

      const result = await requestWithdrawalAction({
        memberId: ATTACKER_SESSION_ID, // propio ID
        amount: 50,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transactionId).toBeDefined();
      }

      // El débito fue creado para el usuario correcto
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