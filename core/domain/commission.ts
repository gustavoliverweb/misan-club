import { z } from "zod";

export const CommissionInputSchema = z.object({
  saleAmountNet: z.number().positive("Sale amount must be positive"),
  marginFactor: z.number().min(0).max(1),
  levelPercentages: z
    .array(z.number().min(0).max(1))
    .min(1)
    .max(5, "Maximum 5 upline levels"),
});

export type CommissionInput = z.infer<typeof CommissionInputSchema>;

export type CommissionResult = {
  level: number;
  percentage: number;
  amount: number;
};

export type CommissionDistribution = {
  baseCalculo: number;
  commissions: CommissionResult[];
  totalDistributed: number;
};
