import { describe, it, expect } from "vitest";
import { WalletService } from "../../core/services/wallet.service";
import type { Transaction } from "../../core/domain/wallet";

const service = new WalletService();

const makeTransaction = (
  overrides: Partial<Transaction> & Pick<Transaction, "type" | "amount">
): Transaction => ({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  description: "test",
  checksum: "a".repeat(64),
  createdAt: new Date(),
  ...overrides,
});

// --- computeBalance ---
describe("WalletService.computeBalance", () => {
  it("returns 0 for empty ledger", () => {
    expect(service.computeBalance([])).toBe(0);
  });

  it("sums credits minus debits", () => {
    const txs: Transaction[] = [
      makeTransaction({ type: "credit", amount: 100 }),
      makeTransaction({ type: "credit", amount: 50 }),
      makeTransaction({ type: "debit", amount: 30 }),
    ];
    expect(service.computeBalance(txs)).toBe(120);
  });

  it("can result in negative balance", () => {
    const txs: Transaction[] = [
      makeTransaction({ type: "credit", amount: 10 }),
      makeTransaction({ type: "debit", amount: 40 }),
    ];
    expect(service.computeBalance(txs)).toBe(-30);
  });
});

// --- validateWithdrawal ---
describe("WalletService.validateWithdrawal", () => {
  const validRequest = {
    userId: crypto.randomUUID(),
    amount: 50,
    // Day 3 — inside the window
    requestedAt: new Date("2026-04-03T10:00:00Z"),
  };

  it("approves a valid withdrawal request", () => {
    const result = service.validateWithdrawal(validRequest, "verified", 100);
    expect(result).toEqual({ ok: true });
  });

  it("rejects if KYC is not verified", () => {
    const result = service.validateWithdrawal(validRequest, "pending", 100);
    expect(result).toEqual({ ok: false, reason: "KYC_NOT_VERIFIED" });
  });

  it("rejects if KYC is rejected", () => {
    const result = service.validateWithdrawal(validRequest, "rejected", 100);
    expect(result).toEqual({ ok: false, reason: "KYC_NOT_VERIFIED" });
  });

  it("rejects outside withdrawal window — day 6", () => {
    const result = service.validateWithdrawal(
      { ...validRequest, requestedAt: new Date("2026-04-06T00:00:00Z") },
      "verified",
      100
    );
    expect(result).toEqual({ ok: false, reason: "OUTSIDE_WITHDRAWAL_WINDOW" });
  });

  it("rejects outside withdrawal window — day 31", () => {
    const result = service.validateWithdrawal(
      { ...validRequest, requestedAt: new Date("2026-03-31T00:00:00Z") },
      "verified",
      100
    );
    expect(result).toEqual({ ok: false, reason: "OUTSIDE_WITHDRAWAL_WINDOW" });
  });

  it("accepts on day 1 (start of window)", () => {
    const result = service.validateWithdrawal(
      { ...validRequest, requestedAt: new Date("2026-04-01T00:00:00Z") },
      "verified",
      100
    );
    expect(result).toEqual({ ok: true });
  });

  it("accepts on day 5 (end of window)", () => {
    const result = service.validateWithdrawal(
      { ...validRequest, requestedAt: new Date("2026-04-05T23:59:59Z") },
      "verified",
      100
    );
    expect(result).toEqual({ ok: true });
  });

  it("rejects if balance is below 50€ minimum", () => {
    const result = service.validateWithdrawal(
      { ...validRequest, amount: 30 },
      "verified",
      30
    );
    expect(result).toEqual({ ok: false, reason: "INSUFFICIENT_BALANCE" });
  });

  it("rejects if amount exceeds current balance", () => {
    const result = service.validateWithdrawal(
      { ...validRequest, amount: 200 },
      "verified",
      100
    );
    expect(result).toEqual({ ok: false, reason: "INSUFFICIENT_BALANCE" });
  });
});

// --- generateChecksum ---
describe("WalletService.generateChecksum", () => {
  const entry = {
    id: "00000000-0000-0000-0000-000000000001",
    userId: "00000000-0000-0000-0000-000000000002",
    amount: 100,
    type: "credit" as const,
    description: "commission",
  };

  it("returns a 64-character hex string", () => {
    const checksum = service.generateChecksum(entry, null);
    expect(checksum).toHaveLength(64);
    expect(checksum).toMatch(/^[a-f0-9]+$/);
  });

  it("produces different checksums for different previous checksums (chaining)", () => {
    const c1 = service.generateChecksum(entry, null);
    const c2 = service.generateChecksum(entry, c1);
    expect(c1).not.toBe(c2);
  });

  it("is deterministic — same input produces same output", () => {
    const c1 = service.generateChecksum(entry, "abc123");
    const c2 = service.generateChecksum(entry, "abc123");
    expect(c1).toBe(c2);
  });
});
