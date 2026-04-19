import { describe, it, expect } from "vitest";
import { CommissionService } from "../../core/services/commission.service";

const service = new CommissionService();

describe("CommissionService.calculate", () => {
  it("Spec case: 100€ net × 0.5 margin × 10% L1 = 5€", () => {
    const result = service.calculate({
      saleAmountNet: 100,
      marginFactor: 0.5,
      levelPercentages: [0.1],
    });

    expect(result.baseCalculo).toBe(50);
    expect(result.commissions[0].amount).toBe(5);
    expect(result.totalDistributed).toBe(5);
  });

  it("calculates base as saleAmountNet × marginFactor", () => {
    const result = service.calculate({
      saleAmountNet: 200,
      marginFactor: 0.8,
      levelPercentages: [0.1],
    });
    expect(result.baseCalculo).toBe(160);
  });

  it("distributes across all 5 levels independently", () => {
    const result = service.calculate({
      saleAmountNet: 100,
      marginFactor: 0.5,
      levelPercentages: [0.1, 0.05, 0.05, 0.03, 0.02],
    });

    expect(result.commissions).toHaveLength(5);
    expect(result.commissions[0]).toEqual({ level: 1, percentage: 0.1, amount: 5 });
    expect(result.commissions[1]).toEqual({ level: 2, percentage: 0.05, amount: 2.5 });
    expect(result.commissions[2]).toEqual({ level: 3, percentage: 0.05, amount: 2.5 });
    expect(result.commissions[3]).toEqual({ level: 4, percentage: 0.03, amount: 1.5 });
    expect(result.commissions[4]).toEqual({ level: 5, percentage: 0.02, amount: 1 });
    expect(result.totalDistributed).toBe(12.5);
  });

  it("rounds to 2 decimal places", () => {
    const result = service.calculate({
      saleAmountNet: 100,
      marginFactor: 0.3,
      levelPercentages: [0.1],
    });
    // 100 × 0.3 = 30; 30 × 0.1 = 3.00
    expect(result.baseCalculo).toBe(30);
    expect(result.commissions[0].amount).toBe(3);
  });

  it("throws on negative saleAmountNet", () => {
    expect(() =>
      service.calculate({
        saleAmountNet: -10,
        marginFactor: 0.5,
        levelPercentages: [0.1],
      })
    ).toThrow();
  });

  it("throws on zero saleAmountNet", () => {
    expect(() =>
      service.calculate({
        saleAmountNet: 0,
        marginFactor: 0.5,
        levelPercentages: [0.1],
      })
    ).toThrow();
  });

  it("throws when more than 5 levels provided", () => {
    expect(() =>
      service.calculate({
        saleAmountNet: 100,
        marginFactor: 0.5,
        levelPercentages: [0.1, 0.05, 0.05, 0.03, 0.02, 0.01],
      })
    ).toThrow();
  });

  it("handles a single level with full margin", () => {
    const result = service.calculate({
      saleAmountNet: 50,
      marginFactor: 1,
      levelPercentages: [0.2],
    });
    expect(result.baseCalculo).toBe(50);
    expect(result.commissions[0].amount).toBe(10);
  });
});
