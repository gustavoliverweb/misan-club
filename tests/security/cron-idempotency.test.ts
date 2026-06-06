/**
 * SECURITY TESTS — CRÍTICO 3: Race Condition + Falta de Idempotencia en el Cron Job
 *
 * Vulnerabilidades originales:
 *
 *   A) Race condition:
 *      El balance se leía FUERA de cualquier transacción y luego se ejecutaba el débito
 *      en una tx separada. Dos ejecuciones concurrentes del cron podían leer el mismo
 *      balance, ambas decidir "renew" y ambas insertar el débito → doble cobro.
 *
 *   B) Sin idempotencia:
 *      Si el cron corría dos veces en la misma hora-slot (Render retry, bug de red)
 *      procesaba las mismas membresías dos veces sin ninguna guardia.
 *
 * Fixes aplicados:
 *
 *   A) SELECT … FOR UPDATE en el row de membresía dentro de db.transaction → serializa
 *      ejecuciones concurrentes. La segunda run bloquea hasta que la primera confirma
 *      y luego re-lee el status actualizado.
 *
 *   B) INSERT INTO processedExternalOrders … ON CONFLICT DO NOTHING dentro de la misma
 *      transacción con clave "cron-{YYYY-MM-DDTHH}-{membershipId}". Si el slot ya fue
 *      reclamado devuelve 0 filas → skip inmediato.
 *
 * Arquitectura de mocks:
 *   makeTxContext() crea una instancia de tx auto-contenida con contadores internos
 *   que aseguran que la primera llamada a tx.select devuelve el lockChain y la segunda
 *   el txsChain, independientemente del estado global. vi.resetAllMocks() garantiza
 *   que la cola de mockReturnValueOnce se limpia entre tests.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// ─── Mocks (hoisted para que vi.mock() pueda referenciarlos) ─────────────────

const mockDb = vi.hoisted(() => ({
  update: vi.fn(),
  select: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/infra/db", () => ({ db: mockDb }));

// ─── Import ───────────────────────────────────────────────────────────────────
import { POST } from "@/app/api/cron/memberships/route";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MEMBERSHIP_ID = "00000000-0000-4000-8000-000000000010";
const USER_ID       = "00000000-0000-4000-8000-000000000001";
const CRON_SECRET   = "test-cron-secret-xyz";

const membershipFixture = {
  id:        MEMBERSHIP_ID,
  userId:    USER_ID,
  status:    "active" as const,
  expiresAt: new Date("2026-05-13T10:00:00Z"), // 24 h from frozen "now"
  autoRenew: true,
  createdAt: new Date("2026-04-12T10:00:00Z"),
};

// 150 € credit → balance sufficient for the 99 € renewal
const creditTxFixture = {
  id:             "tx-credit-001",
  userId:         USER_ID,
  amount:         "150",
  type:           "credit" as const,
  description:    "Comisión nivel 1",
  referenceId:    null,
  productCategory: null,
  checksum:       "a".repeat(64),
  createdAt:      new Date("2026-05-01T10:00:00Z"),
};

function makeRequest(options?: { authOverride?: string }): Request {
  return new Request("https://example.com/api/cron/memberships", {
    method: "POST",
    headers: {
      authorization: options?.authOverride ?? `Bearer ${CRON_SECRET}`,
    },
  });
}

// ─── Chain factories ──────────────────────────────────────────────────────────

function makeLockChain(status: "active" | "expired" | "empty" = "active") {
  const result =
    status === "empty" ? [] : [{ id: MEMBERSHIP_ID, status }];
  const chain = {
    from:  vi.fn(),
    where: vi.fn(),
    for:   vi.fn().mockResolvedValue(result),
  };
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  return chain;
}

function makeTxsChain(rows = [creditTxFixture]) {
  const chain = {
    from:  vi.fn(),
    where: vi.fn().mockResolvedValue(rows),
  };
  chain.from.mockReturnValue(chain);
  return chain;
}

function makeIdempChain(claimed = true) {
  const chain = {
    values:              vi.fn(),
    onConflictDoNothing: vi.fn(),
    returning:           vi.fn().mockResolvedValue(
      claimed ? [{ id: "claimed-uuid" }] : [],
    ),
  };
  chain.values.mockReturnValue(chain);
  chain.onConflictDoNothing.mockReturnValue(chain);
  return chain;
}

function makeUpdateChain() {
  const chain = { set: vi.fn(), where: vi.fn().mockResolvedValue([]) };
  chain.set.mockReturnValue(chain);
  return chain;
}

// ─── Transaction context factory ─────────────────────────────────────────────
// Each call creates a self-contained tx mock. Internal counters ensure the
// first call to tx.select returns the lock chain and the second the txs chain,
// without relying on the fragile mockReturnValueOnce queue.

type TxContextOptions = {
  lockedStatus?:  "active" | "expired" | "empty";
  txRows?:        typeof creditTxFixture[];
  claimed?:       boolean;
  onDebit?:       (data: Record<string, unknown>) => void;
  onIdempInsert?: (data: Record<string, unknown>) => void;
};

function makeTxContext(opts: TxContextOptions = {}) {
  const lockChain   = makeLockChain(opts.lockedStatus ?? "active");
  const txsChain    = makeTxsChain(opts.txRows ?? [creditTxFixture]);
  const idempChain  = makeIdempChain(opts.claimed ?? true);
  const updateChain = makeUpdateChain();

  // Wrap idempotency values to capture inserted data
  const origIdempValues = idempChain.values;
  idempChain.values = vi.fn().mockImplementation((data: Record<string, unknown>) => {
    opts.onIdempInsert?.(data);
    return origIdempValues(data);
  });

  const debitChain = {
    values: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      opts.onDebit?.(data);
      return Promise.resolve([]);
    }),
  };

  let selectIdx = 0;
  let insertIdx = 0;

  const tx = {
    select: vi.fn().mockImplementation(() =>
      selectIdx++ === 0 ? lockChain : txsChain,
    ),
    insert: vi.fn().mockImplementation(() =>
      insertIdx++ === 0 ? idempChain : debitChain,
    ),
    update: vi.fn().mockReturnValue(updateChain),
  };

  return { tx, lockChain, txsChain, idempChain, debitChain, updateChain };
}

// ─── Module-level state written in beforeEach ────────────────────────────────

let capturedDebits:     Record<string, unknown>[];
let capturedIdempInserts: Record<string, unknown>[];
let ctx: ReturnType<typeof makeTxContext>;

// ─── beforeEach: happy path ───────────────────────────────────────────────────

beforeEach(() => {
  // Full reset: clears calls AND the mockReturnValueOnce queue
  vi.resetAllMocks();

  capturedDebits      = [];
  capturedIdempInserts = [];

  ctx = makeTxContext({
    onDebit:       (d) => capturedDebits.push(d),
    onIdempInsert: (d) => capturedIdempInserts.push(d),
  });

  // db.update chain (expiry step)
  const dbUpdateChain = {
    set:       vi.fn(),
    where:     vi.fn(),
    returning: vi.fn().mockResolvedValue([]),
  };
  dbUpdateChain.set.mockReturnValue(dbUpdateChain);
  dbUpdateChain.where.mockReturnValue(dbUpdateChain);

  // db.select chain (expiringSoon step)
  const dbSelectChain = {
    from:  vi.fn(),
    where: vi.fn().mockResolvedValue([membershipFixture]),
  };
  dbSelectChain.from.mockReturnValue(dbSelectChain);

  mockDb.update.mockReturnValue(dbUpdateChain);
  mockDb.select.mockReturnValue(dbSelectChain);
  mockDb.transaction.mockImplementation(
    async (callback: (tx: typeof ctx.tx) => Promise<unknown>) => callback(ctx.tx),
  );

  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-12T10:00:00Z"));
  process.env.CRON_SECRET = CRON_SECRET;
});

afterEach(() => {
  vi.useRealTimers();
  delete process.env.CRON_SECRET;
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CRÍTICO 3 — Cron Job: autenticación", () => {
  it("devuelve 401 si el token no coincide con CRON_SECRET", async () => {
    const res = await POST(makeRequest({ authOverride: "Bearer wrong-secret" }));

    expect(res.status).toBe(401);
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it("devuelve 401 si falta el header Authorization", async () => {
    const req = new Request("https://example.com/api/cron/memberships", { method: "POST" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it("procesa el request cuando el Bearer token es correcto", async () => {
    const res  = await POST(makeRequest());
    const body = await res.json() as { ok: boolean };

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});

describe("CRÍTICO 3 — Cron Job: estructura del fix (transacción + lock)", () => {
  it("abre db.transaction() por cada membresía a procesar", async () => {
    await POST(makeRequest());

    expect(mockDb.transaction).toHaveBeenCalledOnce();
  });

  it("abre una transacción independiente por cada membresía del batch", async () => {
    const m2 = { ...membershipFixture, id: "00000000-0000-4000-8000-000000000011", userId: "00000000-0000-4000-8000-000000000002" };

    const dbSelectChain2 = {
      from:  vi.fn(),
      where: vi.fn().mockResolvedValue([membershipFixture, m2]),
    };
    dbSelectChain2.from.mockReturnValue(dbSelectChain2);
    mockDb.select.mockReturnValue(dbSelectChain2);

    const ctx2 = makeTxContext({ onDebit: (d) => capturedDebits.push(d) });
    ctx2.lockChain.for.mockResolvedValue([{ id: m2.id, status: "active" }]);

    let callIdx = 0;
    mockDb.transaction.mockImplementation(
      async (callback: (tx: typeof ctx.tx) => Promise<unknown>) => {
        return callback(callIdx++ === 0 ? ctx.tx : ctx2.tx);
      },
    );

    await POST(makeRequest());

    expect(mockDb.transaction).toHaveBeenCalledTimes(2);
  });

  it("usa SELECT … FOR UPDATE en el row de membresía dentro de la transacción", async () => {
    await POST(makeRequest());

    expect(ctx.lockChain.for).toHaveBeenCalledWith("update");
  });

  it(".for('update') se invoca antes del INSERT del débito", async () => {
    const callOrder: string[] = [];

    ctx.lockChain.for = vi.fn().mockImplementation((mode: string) => {
      callOrder.push(`for:${mode}`);
      return Promise.resolve([{ id: MEMBERSHIP_ID, status: "active" }]);
    });

    const origDebitValues = ctx.debitChain.values;
    ctx.debitChain.values = vi.fn().mockImplementation((data: Record<string, unknown>) => {
      callOrder.push("debit:insert");
      capturedDebits.push(data);
      return origDebitValues(data);
    });

    await POST(makeRequest());

    const forIdx   = callOrder.indexOf("for:update");
    const debitIdx = callOrder.indexOf("debit:insert");
    expect(forIdx).toBeGreaterThanOrEqual(0);
    expect(debitIdx).toBeGreaterThan(forIdx);
  });

  it("el balance se calcula con tx.select (dentro del lock), no con db.select", async () => {
    await POST(makeRequest());

    // tx.select called twice: once for lock, once for transaction rows
    expect(ctx.tx.select).toHaveBeenCalledTimes(2);
  });
});

describe("CRÍTICO 3 — Cron Job: idempotencia", () => {
  it("inserta la clave de idempotencia en processedExternalOrders", async () => {
    await POST(makeRequest());

    expect(capturedIdempInserts).toHaveLength(1);
    expect(capturedIdempInserts[0]?.memberId).toBe(USER_ID);
  });

  it("la clave tiene formato 'cron-YYYY-MM-DDTHH-{membershipId}'", async () => {
    await POST(makeRequest());

    const key = capturedIdempInserts[0]?.externalOrderId as string;
    // Frozen time: 2026-05-12T10:00:00Z → slot = "cron-2026-05-12T10"
    expect(key).toBe(`cron-2026-05-12T10-${MEMBERSHIP_ID}`);
  });

  it("usa ON CONFLICT DO NOTHING para el insert de idempotencia", async () => {
    await POST(makeRequest());

    expect(ctx.idempChain.onConflictDoNothing).toHaveBeenCalledOnce();
  });

  it("salta la membresía cuando ON CONFLICT DO NOTHING devuelve 0 filas (slot ya reclamado)", async () => {
    ctx = makeTxContext({
      claimed:       false,            // ← slot already taken
      onDebit:       (d) => capturedDebits.push(d),
      onIdempInsert: (d) => capturedIdempInserts.push(d),
    });
    mockDb.transaction.mockImplementation(
      async (callback: (tx: typeof ctx.tx) => Promise<unknown>) => callback(ctx.tx),
    );

    const res  = await POST(makeRequest());
    const body = await res.json() as { skipped: number; renewed: number };

    expect(body.skipped).toBe(1);
    expect(body.renewed).toBe(0);
    expect(capturedDebits).toHaveLength(0);
  });

  it("dos ejecuciones en la misma hora-slot producen exactamente un solo débito", async () => {
    // ── Primera ejecución ──
    await POST(makeRequest());
    const debitsAfterRun1 = capturedDebits.length;

    // ── Segunda ejecución: idempotency slot ya reclamado ──
    vi.resetAllMocks();
    capturedDebits      = [];
    capturedIdempInserts = [];

    const ctx2 = makeTxContext({
      claimed:       false,           // ON CONFLICT DO NOTHING → 0 rows
      onDebit:       (d) => capturedDebits.push(d),
      onIdempInsert: (d) => capturedIdempInserts.push(d),
    });

    const dbSelectChain2 = {
      from:  vi.fn(),
      where: vi.fn().mockResolvedValue([membershipFixture]),
    };
    dbSelectChain2.from.mockReturnValue(dbSelectChain2);

    const dbUpdateChain2 = { set: vi.fn(), where: vi.fn(), returning: vi.fn().mockResolvedValue([]) };
    dbUpdateChain2.set.mockReturnValue(dbUpdateChain2);
    dbUpdateChain2.where.mockReturnValue(dbUpdateChain2);

    mockDb.update.mockReturnValue(dbUpdateChain2);
    mockDb.select.mockReturnValue(dbSelectChain2);
    mockDb.transaction.mockImplementation(
      async (callback: (tx: typeof ctx2.tx) => Promise<unknown>) => callback(ctx2.tx),
    );

    const res2  = await POST(makeRequest());
    const body2 = await res2.json() as { renewed: number; skipped: number };

    expect(debitsAfterRun1).toBe(1);           // primera run: 1 débito
    expect(capturedDebits).toHaveLength(0);    // segunda run: 0 débitos
    expect(body2.skipped).toBe(1);
    expect(body2.renewed).toBe(0);
  });
});

describe("CRÍTICO 3 — Cron Job: race condition", () => {
  it("salta si el FOR UPDATE devuelve membresía inactiva (otra run la expiró antes)", async () => {
    ctx = makeTxContext({
      lockedStatus:  "empty",           // lock returns [] → already gone
      onDebit:       (d) => capturedDebits.push(d),
      onIdempInsert: (d) => capturedIdempInserts.push(d),
    });
    mockDb.transaction.mockImplementation(
      async (callback: (tx: typeof ctx.tx) => Promise<unknown>) => callback(ctx.tx),
    );

    const res  = await POST(makeRequest());
    const body = await res.json() as { skipped: number; renewed: number };

    expect(body.skipped).toBe(1);
    expect(body.renewed).toBe(0);
    expect(capturedDebits).toHaveLength(0);
  });

  it("la segunda ejecución concurrente no inserta débito cuando el saldo se agota", async () => {
    // Simulate: first run consumed all balance. Second run sees 0€.
    ctx = makeTxContext({
      txRows:        [],               // empty → balance = 0€
      onDebit:       (d) => capturedDebits.push(d),
      onIdempInsert: (d) => capturedIdempInserts.push(d),
    });
    mockDb.transaction.mockImplementation(
      async (callback: (tx: typeof ctx.tx) => Promise<unknown>) => callback(ctx.tx),
    );

    const res  = await POST(makeRequest());
    const body = await res.json() as { skipped: number };

    expect(body.skipped).toBe(1);
    expect(capturedDebits).toHaveLength(0);
  });
});

describe("CRÍTICO 3 — Cron Job: lógica de negocio", () => {
  it("renueva la membresía cuando autoRenew=true y balance >= 99€", async () => {
    const res  = await POST(makeRequest());
    const body = await res.json() as { renewed: number; skipped: number };

    expect(body.renewed).toBe(1);
    expect(body.skipped).toBe(0);
  });

  it("inserta un débito de 99.00€ al renovar", async () => {
    await POST(makeRequest());

    expect(capturedDebits).toHaveLength(1);
    expect(capturedDebits[0]?.amount).toBe("99.00");
    expect(capturedDebits[0]?.type).toBe("debit");
    expect(capturedDebits[0]?.userId).toBe(USER_ID);
  });

  it("el débito tiene descripción de renovación automática", async () => {
    await POST(makeRequest());

    expect(capturedDebits[0]?.description).toBe("Renovación automática de membresía");
  });

  it("el débito tiene un checksum de 64 caracteres", async () => {
    await POST(makeRequest());

    const checksum = capturedDebits[0]?.checksum as string;
    expect(typeof checksum).toBe("string");
    expect(checksum.length).toBe(64);
  });

  it("salta con 'auto_renew_off' cuando autoRenew=false", async () => {
    const dbSelectChainNoAutoRenew = {
      from:  vi.fn(),
      where: vi.fn().mockResolvedValue([{ ...membershipFixture, autoRenew: false }]),
    };
    dbSelectChainNoAutoRenew.from.mockReturnValue(dbSelectChainNoAutoRenew);
    mockDb.select.mockReturnValue(dbSelectChainNoAutoRenew);

    const res  = await POST(makeRequest());
    const body = await res.json() as {
      skipped: number; renewed: number;
      details: { skipped: Array<{ reason: string }> };
    };

    expect(body.skipped).toBe(1);
    expect(body.renewed).toBe(0);
    expect(body.details.skipped[0]?.reason).toBe("auto_renew_off");
    expect(capturedDebits).toHaveLength(0);
  });

  it("salta con 'insufficient_balance' cuando el balance es menor a 99€", async () => {
    ctx = makeTxContext({
      txRows:        [{ ...creditTxFixture, amount: "50" }], // 50€ < 99€
      onDebit:       (d) => capturedDebits.push(d),
      onIdempInsert: (d) => capturedIdempInserts.push(d),
    });
    mockDb.transaction.mockImplementation(
      async (callback: (tx: typeof ctx.tx) => Promise<unknown>) => callback(ctx.tx),
    );

    const res  = await POST(makeRequest());
    const body = await res.json() as {
      skipped: number; renewed: number;
      details: { skipped: Array<{ reason: string }> };
    };

    expect(body.skipped).toBe(1);
    expect(body.renewed).toBe(0);
    expect(body.details.skipped[0]?.reason).toBe("insufficient_balance");
    expect(capturedDebits).toHaveLength(0);
  });

  it("incluye en la respuesta el número de membresías expiradas en el paso de expiry", async () => {
    const dbUpdateChainExpired = {
      set:       vi.fn(),
      where:     vi.fn(),
      returning: vi.fn().mockResolvedValue([{ id: "exp-id", userId: USER_ID }]),
    };
    dbUpdateChainExpired.set.mockReturnValue(dbUpdateChainExpired);
    dbUpdateChainExpired.where.mockReturnValue(dbUpdateChainExpired);
    mockDb.update.mockReturnValue(dbUpdateChainExpired);

    const res  = await POST(makeRequest());
    const body = await res.json() as { enteredGrace: number };

    expect(body.enteredGrace).toBe(1);
  });
});

describe("CRÍTICO 3 — Cron Job: resiliencia ante fallos", () => {
  it("una membresía con error de transacción no aborta el procesamiento de las demás", async () => {
    const m2 = {
      ...membershipFixture,
      id:     "00000000-0000-4000-8000-000000000011",
      userId: "00000000-0000-4000-8000-000000000002",
    };

    const dbSelectChain2 = {
      from:  vi.fn(),
      where: vi.fn().mockResolvedValue([membershipFixture, m2]),
    };
    dbSelectChain2.from.mockReturnValue(dbSelectChain2);
    mockDb.select.mockReturnValue(dbSelectChain2);

    const ctx2 = makeTxContext({
      onDebit: (d) => capturedDebits.push(d),
    });
    ctx2.lockChain.for.mockResolvedValue([{ id: m2.id, status: "active" }]);

    let txCallCount = 0;
    mockDb.transaction.mockImplementation(
      async (callback: (tx: typeof ctx.tx) => Promise<unknown>) => {
        txCallCount++;
        if (txCallCount === 1) throw new Error("DB connection lost"); // first membership fails
        return callback(ctx2.tx);
      },
    );

    const res  = await POST(makeRequest());
    const body = await res.json() as { renewed: number; skipped: number };

    // First membership: transaction_error → skipped
    // Second membership: success → renewed
    expect(body.skipped).toBe(1);
    expect(body.renewed).toBe(1);
    expect(capturedDebits).toHaveLength(1);
    expect(capturedDebits[0]?.userId).toBe(m2.userId);
  });

  it("responde ok:true incluso si todos los candidatos son skipped", async () => {
    ctx = makeTxContext({ claimed: false }); // idempotency slot taken → all skip
    mockDb.transaction.mockImplementation(
      async (callback: (tx: typeof ctx.tx) => Promise<unknown>) => callback(ctx.tx),
    );

    const res  = await POST(makeRequest());
    const body = await res.json() as { ok: boolean };

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});