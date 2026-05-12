/**
 * SECURITY TESTS — MEDIA 7: Aritmética flotante en cálculos monetarios
 *
 * Vulnerabilidad original:
 *   computeBalance acumulaba sumando floats directamente:
 *     transactions.reduce((acc, tx) => acc + tx.amount, 0)
 *   La suma de muchas comisiones con céntimos podía producir errores de precisión
 *   (e.g. 0.1 + 0.2 = 0.30000000000000004), lo que podía hacer que un balance
 *   "real" de 50.00 € apareciera como 49.99 € y bloqueara un retiro válido.
 *
 * Fix aplicado:
 *   Acumulación en céntimos enteros:
 *     const cents = Math.round(tx.amount * 100);   // convierte una vez
 *     acc + cents                                   // suma entera exacta
 *   El total de céntimos se divide por 100 al final (una sola operación float).
 *
 * Estos tests verifican que:
 *   1. Diez comisiones de 0.10 € suman exactamente 1.00 €.
 *   2. El famoso 0.1 + 0.2 da exactamente 0.30 €.
 *   3. Muchos créditos y débitos con céntimos netan sin drift.
 *   4. Un balance que sin el fix sería 49.99 € aparece correctamente como 50.00 €.
 */

import { describe, it, expect } from "vitest";
import { WalletService } from "@/core/services/wallet.service";
import type { Transaction } from "@/core/domain/wallet";

const svc = new WalletService();

function tx(amount: number, type: "credit" | "debit"): Transaction {
  return {
    id: crypto.randomUUID(),
    userId: "00000000-0000-4000-8000-000000000001",
    amount,
    type,
    description: "test",
    referenceId: undefined,
    checksum: "a".repeat(64),
    createdAt: new Date(),
  };
}

describe("WalletService.computeBalance — precisión con céntimos", () => {
  it("diez créditos de 0.10 € suman exactamente 1.00 €", () => {
    const txs = Array.from({ length: 10 }, () => tx(0.1, "credit"));
    expect(svc.computeBalance(txs)).toBe(1.0);
  });

  it("0.10 € + 0.20 € da exactamente 0.30 € (clásico bug flotante)", () => {
    const txs = [tx(0.1, "credit"), tx(0.2, "credit")];
    // Raw JS: 0.1 + 0.2 = 0.30000000000000004
    expect(svc.computeBalance(txs)).toBe(0.3);
  });

  it("mezcla de créditos y débitos con céntimos sin drift", () => {
    const txs = [
      tx(33.33, "credit"),
      tx(33.33, "credit"),
      tx(33.34, "credit"),
      tx(10.0,  "debit"),
    ];
    // 33.33 + 33.33 + 33.34 - 10.00 = 90.00
    expect(svc.computeBalance(txs)).toBe(90.0);
  });

  it("cien comisiones de 0.50 € suman exactamente 50.00 €", () => {
    const txs = Array.from({ length: 100 }, () => tx(0.5, "credit"));
    expect(svc.computeBalance(txs)).toBe(50.0);
  });

  it("balance que sin el fix daría 49.99 € aparece como 50.00 € (caso límite de retiro)", () => {
    // 49 × 1 € + 1 × 0.10 × 10 = 49 + 1 = 50 exactly
    const txs = [
      ...Array.from({ length: 49 }, () => tx(1.0, "credit")),
      ...Array.from({ length: 10 }, () => tx(0.1, "credit")),
    ];
    expect(svc.computeBalance(txs)).toBe(50.0);
  });

  it("retorna 0 para ledger vacío", () => {
    expect(svc.computeBalance([])).toBe(0);
  });

  it("saldo negativo con céntimos es exacto", () => {
    const txs = [tx(0.1, "credit"), tx(0.3, "debit")];
    expect(svc.computeBalance(txs)).toBe(-0.2);
  });
});