import { describe, it, expect } from "vitest";
import { MembershipRenewalService } from "../../core/services/membership-renewal.service";
import type { Membership, RenewalCandidate } from "../../core/domain/membership";

const service = new MembershipRenewalService();

const NOW = new Date("2026-04-18T00:00:00Z");

const makeMembership = (overrides: Partial<Membership> = {}): Membership => ({
  id: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  status: "active",
  expiresAt: new Date("2026-04-19T12:00:00Z"), // 36 h from NOW — inside 48h window
  autoRenew: true,
  ...overrides,
});

// --- getExpiringSoon ---
describe("MembershipRenewalService.getExpiringSoon", () => {
  it("returns memberships expiring within 48 hours", () => {
    const m = makeMembership();
    expect(service.getExpiringSoon([m], NOW)).toContain(m);
  });

  it("excludes memberships expiring after 48 hours", () => {
    const m = makeMembership({
      expiresAt: new Date("2026-04-20T01:00:00Z"), // 49 h from NOW
    });
    expect(service.getExpiringSoon([m], NOW)).toHaveLength(0);
  });

  it("excludes already-expired memberships", () => {
    const m = makeMembership({
      expiresAt: new Date("2026-04-17T00:00:00Z"),
    });
    expect(service.getExpiringSoon([m], NOW)).toHaveLength(0);
  });

  it("excludes memberships with status expired", () => {
    const m = makeMembership({ status: "expired" });
    expect(service.getExpiringSoon([m], NOW)).toHaveLength(0);
  });

  it("returns empty array when no memberships provided", () => {
    expect(service.getExpiringSoon([], NOW)).toHaveLength(0);
  });
});

// --- evaluateRenewals ---
describe("MembershipRenewalService.evaluateRenewals", () => {
  const makeCandidate = (overrides: Partial<RenewalCandidate> = {}): RenewalCandidate => ({
    membership: makeMembership(),
    currentBalance: 100,
    renewalCostEur: 30,
    ...overrides,
  });

  it("returns renew when auto_renew is true and balance is sufficient", () => {
    const result = service.evaluateRenewals([makeCandidate()]);
    expect(result[0].action).toBe("renew");
  });

  it("returns notify with auto_renew_off when auto_renew is false", () => {
    const candidate = makeCandidate({
      membership: makeMembership({ autoRenew: false }),
    });
    const result = service.evaluateRenewals([candidate]);
    expect(result[0]).toEqual({
      action: "notify",
      membershipId: candidate.membership.id,
      userId: candidate.membership.userId,
      reason: "auto_renew_off",
    });
  });

  it("returns notify with insufficient_balance when balance is too low", () => {
    const candidate = makeCandidate({ currentBalance: 10, renewalCostEur: 30 });
    const result = service.evaluateRenewals([candidate]);
    expect(result[0]).toEqual({
      action: "notify",
      membershipId: candidate.membership.id,
      userId: candidate.membership.userId,
      reason: "insufficient_balance",
    });
  });

  it("renew decision includes the exact cost", () => {
    const candidate = makeCandidate({ renewalCostEur: 49.99 });
    const [decision] = service.evaluateRenewals([candidate]);
    expect(decision.action).toBe("renew");
    if (decision.action === "renew") {
      expect(decision.cost).toBe(49.99);
    }
  });

  it("processes multiple candidates independently", () => {
    const renew = makeCandidate();
    const notify = makeCandidate({ currentBalance: 0 });
    const results = service.evaluateRenewals([renew, notify]);
    expect(results[0].action).toBe("renew");
    expect(results[1].action).toBe("notify");
  });

  it("returns empty array for no candidates", () => {
    expect(service.evaluateRenewals([])).toHaveLength(0);
  });
});

// --- calculateNewExpiry ---
describe("MembershipRenewalService.calculateNewExpiry", () => {
  it("adds 30 days to the current expiry", () => {
    const current = new Date("2026-04-20T00:00:00Z");
    const next = service.calculateNewExpiry(current);
    expect(next.toISOString()).toBe("2026-05-20T00:00:00.000Z");
  });

  it("does not mutate the original date", () => {
    const current = new Date("2026-04-20T00:00:00Z");
    const original = current.getTime();
    service.calculateNewExpiry(current);
    expect(current.getTime()).toBe(original);
  });
});
