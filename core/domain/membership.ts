import { z } from "zod";

export const MembershipSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(["active", "grace", "expired"]),
  expiresAt: z.date(),
  graceEndsAt: z.date().nullable().optional(),
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

/** Returns true when the membership grants full access (active or within grace window). */
export function isMembershipAccessible(status: Membership["status"]): boolean {
  return status === "active" || status === "grace";
}
