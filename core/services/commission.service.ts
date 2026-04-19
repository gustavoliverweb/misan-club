import {
  CommissionInputSchema,
  type CommissionDistribution,
  type CommissionInput,
} from "../domain/commission";

export class CommissionService {
  // Cn = (saleAmountNet × marginFactor) × Pn
  // Inactive levels are skipped — their commission goes to the reserve fund (caller's responsibility).
  calculate(input: CommissionInput): CommissionDistribution {
    const parsed = CommissionInputSchema.parse(input);

    const baseCalculo =
      Math.round(parsed.saleAmountNet * parsed.marginFactor * 100) / 100;

    const commissions = parsed.levelPercentages.map((percentage, index) => ({
      level: index + 1,
      percentage,
      amount: Math.round(baseCalculo * percentage * 100) / 100,
    }));

    const totalDistributed =
      Math.round(commissions.reduce((sum, c) => sum + c.amount, 0) * 100) /
      100;

    return { baseCalculo, commissions, totalDistributed };
  }
}
