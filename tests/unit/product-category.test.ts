import { describe, it, expect } from "vitest";
import { CATEGORY_CONFIG, getQuarter } from "../../core/domain/product-category";

describe("CATEGORY_CONFIG level percentages", () => {
  it("standard: [5%, 3%, 2%, 1%, 1%]", () => {
    expect(CATEGORY_CONFIG.standard.levelPercentages).toEqual([0.05, 0.03, 0.02, 0.01, 0.01]);
  });

  it("proprietary: [10%, 6%, 4%, 2%, 2%]", () => {
    expect(CATEGORY_CONFIG.proprietary.levelPercentages).toEqual([0.1, 0.06, 0.04, 0.02, 0.02]);
  });

  it("reduced: [2.5%, 1.5%, 1%, 0.5%, 0.5%]", () => {
    expect(CATEGORY_CONFIG.reduced.levelPercentages).toEqual([0.025, 0.015, 0.01, 0.005, 0.005]);
  });

  it("membership: same rates as standard", () => {
    expect(CATEGORY_CONFIG.membership.levelPercentages).toEqual([0.05, 0.03, 0.02, 0.01, 0.01]);
  });

  it("service: standard rates (applied to 30% of commercial margin)", () => {
    expect(CATEGORY_CONFIG.service.levelPercentages).toEqual([0.05, 0.03, 0.02, 0.01, 0.01]);
  });

  it("all categories have exactly 5 levels", () => {
    for (const config of Object.values(CATEGORY_CONFIG)) {
      expect(config.levelPercentages).toHaveLength(5);
    }
  });
});

describe("CATEGORY_CONFIG pool rates", () => {
  it("standard pool: 5%", () => {
    expect(CATEGORY_CONFIG.standard.poolRate).toBe(0.05);
  });

  it("proprietary pool: 10%", () => {
    expect(CATEGORY_CONFIG.proprietary.poolRate).toBe(0.1);
  });

  it("reduced pool: 2.5%", () => {
    expect(CATEGORY_CONFIG.reduced.poolRate).toBe(0.025);
  });

  it("membership pool: 5%", () => {
    expect(CATEGORY_CONFIG.membership.poolRate).toBe(0.05);
  });

  it("service pool: 5%", () => {
    expect(CATEGORY_CONFIG.service.poolRate).toBe(0.05);
  });
});

describe("getQuarter", () => {
  it("returns YYYY-QN format", () => {
    expect(getQuarter(new Date(2026, 3, 24))).toMatch(/^\d{4}-Q[1-4]$/);
  });

  it("Q1: January–March", () => {
    expect(getQuarter(new Date(2026, 0, 1))).toBe("2026-Q1");
    expect(getQuarter(new Date(2026, 2, 31))).toBe("2026-Q1");
  });

  it("Q2: April–June", () => {
    expect(getQuarter(new Date(2026, 3, 1))).toBe("2026-Q2");
    expect(getQuarter(new Date(2026, 5, 30))).toBe("2026-Q2");
  });

  it("Q3: July–September", () => {
    expect(getQuarter(new Date(2026, 6, 1))).toBe("2026-Q3");
    expect(getQuarter(new Date(2026, 8, 30))).toBe("2026-Q3");
  });

  it("Q4: October–December", () => {
    expect(getQuarter(new Date(2026, 9, 1))).toBe("2026-Q4");
    expect(getQuarter(new Date(2026, 11, 31))).toBe("2026-Q4");
  });

  it("year boundary: Dec → Q4, Jan → Q1", () => {
    expect(getQuarter(new Date(2025, 11, 31))).toBe("2025-Q4");
    expect(getQuarter(new Date(2026, 0, 1))).toBe("2026-Q1");
  });
});
