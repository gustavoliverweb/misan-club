export type ProductCategory =
  | "standard"
  | "proprietary"
  | "reduced"
  | "membership"
  | "service";

export type CategoryConfig = {
  levelPercentages: [number, number, number, number, number];
  poolRate: number;
};

export const CATEGORY_CONFIG: Record<ProductCategory, CategoryConfig> = {
  standard: {
    levelPercentages: [0.05, 0.03, 0.02, 0.01, 0.01],
    poolRate: 0.05,
  },
  proprietary: {
    levelPercentages: [0.1, 0.06, 0.04, 0.02, 0.02],
    poolRate: 0.1,
  },
  reduced: {
    levelPercentages: [0.025, 0.015, 0.01, 0.005, 0.005],
    poolRate: 0.025,
  },
  membership: {
    levelPercentages: [0.03, 0.03, 0.03, 0.04, 0.05],
    poolRate: 0.05,
  },
  // Service/Travel: rates apply to 30% of commercial margin (base = margin * 0.30)
  service: {
    levelPercentages: [0.05, 0.03, 0.02, 0.01, 0.01],
    poolRate: 0.05,
  },
};

export function getQuarter(date: Date): string {
  const q = Math.ceil((date.getMonth() + 1) / 3);
  return `${date.getFullYear()}-Q${q}`;
}
