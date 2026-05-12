import { createHash } from "crypto";
import {
  WithdrawalRequestSchema,
  type Transaction,
  type WithdrawalRequest,
  type WithdrawalValidationResult,
} from "../domain/wallet";

const MIN_WITHDRAWAL_AMOUNT = 50;
// Spec 03: withdrawals only accepted on days 1–5 of each month
const WITHDRAWAL_WINDOW_START = 1;
const WITHDRAWAL_WINDOW_END = 5;

export class WalletService {
  // Balance is always computed — never stored.
  // Spec 03: balance = SUM(credits) - SUM(debits)
  // Accumulate in integer cents to avoid floating-point drift across many transactions.
  computeBalance(transactions: Transaction[]): number {
    const totalCents = transactions.reduce((acc, tx) => {
      const cents = Math.round(tx.amount * 100);
      return tx.type === "credit" ? acc + cents : acc - cents;
    }, 0);
    return totalCents / 100;
  }

  validateWithdrawal(
    request: WithdrawalRequest,
    kycStatus: string,
    currentBalance: number
  ): WithdrawalValidationResult {
    WithdrawalRequestSchema.parse(request);

    if (kycStatus !== "verified") {
      return { ok: false, reason: "KYC_NOT_VERIFIED" };
    }

    const day = request.requestedAt.getUTCDate();
    if (day < WITHDRAWAL_WINDOW_START || day > WITHDRAWAL_WINDOW_END) {
      return { ok: false, reason: "OUTSIDE_WITHDRAWAL_WINDOW" };
    }

    if (currentBalance < MIN_WITHDRAWAL_AMOUNT || currentBalance < request.amount) {
      return { ok: false, reason: "INSUFFICIENT_BALANCE" };
    }

    return { ok: true };
  }

  // Generates a sha256 checksum chaining the new entry to the previous one.
  // Spec 03: each ledger entry must have an integrity hash linking to the prior entry.
  generateChecksum(
    entry: Omit<Transaction, "checksum" | "createdAt">,
    previousChecksum: string | null
  ): string {
    const payload = JSON.stringify({
      id: entry.id,
      userId: entry.userId,
      amount: entry.amount,
      type: entry.type,
      referenceId: entry.referenceId ?? null,
      previousChecksum,
    });
    return createHash("sha256").update(payload).digest("hex");
  }
}
