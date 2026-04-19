import { z } from "zod";

export const MembershipSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(["active", "expired"]),
  expiresAt: z.date(),
  autoRenew: z.boolean(),
});

export type Membership = z.infer<typeof MembershipSchema>;

export type RenewalCandidate = {
  membership: Membership;
  currentBalance: number;
  renewalCostEur: number;
};

export type RenewalDecision =
  | { action: "renew"; membershipId: string; userId: string; cost: number }
  | { action: "notify"; membershipId: string; userId: string; reason: "auto_renew_off" | "insufficient_balance" };
