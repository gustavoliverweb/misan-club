import type { RenewalCandidate, RenewalDecision, Membership } from "../domain/membership";

// Window in hours before expiry that triggers the daily notification check (Spec 04 §4.3).
const EXPIRY_NOTICE_HOURS = 48;

export class MembershipRenewalService {
  // Returns memberships expiring within the next 48 hours from `now`.
  getExpiringSoon(memberships: Membership[], now: Date): Membership[] {
    const windowMs = EXPIRY_NOTICE_HOURS * 60 * 60 * 1000;
    const cutoff = new Date(now.getTime() + windowMs);
    return memberships.filter(
      (m) => m.status === "active" && m.expiresAt <= cutoff && m.expiresAt > now
    );
  }

  // Evaluates each expiring membership and returns a decision per member.
  // Pure logic — actual DB writes and wallet debits happen in the use-case layer.
  evaluateRenewals(candidates: RenewalCandidate[]): RenewalDecision[] {
    return candidates.map(({ membership, currentBalance, renewalCostEur }) => {
      if (!membership.autoRenew) {
        return {
          action: "notify",
          membershipId: membership.id,
          userId: membership.userId,
          reason: "auto_renew_off",
        };
      }

      if (currentBalance < renewalCostEur) {
        return {
          action: "notify",
          membershipId: membership.id,
          userId: membership.userId,
          reason: "insufficient_balance",
        };
      }

      return {
        action: "renew",
        membershipId: membership.id,
        userId: membership.userId,
        cost: renewalCostEur,
      };
    });
  }

  // Calculates the new expiry date: current expiry + 30 days.
  calculateNewExpiry(currentExpiry: Date): Date {
    const next = new Date(currentExpiry);
    next.setUTCDate(next.getUTCDate() + 30);
    return next;
  }
}
