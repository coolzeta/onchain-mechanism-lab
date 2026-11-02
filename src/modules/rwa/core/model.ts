/** A teaching scenario, not a valuation or a statement of investor rights. */
export function rwaMetrics(assetValue: number, tokenSupply: number, cash: number, requestedTokens: number) {
  const safeAsset = Math.max(0, assetValue);
  const safeSupply = Math.max(0, tokenSupply);
  const safeCash = Math.min(safeAsset, Math.max(0, cash));
  const safeRequested = Math.min(safeSupply, Math.max(0, requestedTokens));
  const unitValue = safeSupply > 0 ? safeAsset / safeSupply : 0;
  const estimatedRequestValue = safeRequested * unitValue;
  return {
    unitValue,
    estimatedRequestValue,
    liquidCash: safeCash,
    liquidityGap: Math.max(0, estimatedRequestValue - safeCash),
  };
}

/** Presets are independent hypothetical snapshots. They do not execute trades or redemptions. */
export const rwaScenarios = {
  baseline: { assets: 100_000, supply: 1_000, cash: 20_000, requested: 400, report: { value: 100_000, age: 0 } },
  priceShock: { assets: 80_000, supply: 1_000, cash: 20_000, requested: 400, report: { value: 100_000, age: 1 } },
  redemptionPressure: { assets: 100_000, supply: 1_000, cash: 20_000, requested: 800, report: { value: 100_000, age: 0 } },
  moreCash: { assets: 100_000, supply: 1_000, cash: 80_000, requested: 800, report: { value: 100_000, age: 0 } },
} as const;

export type RwaScenarioId = keyof typeof rwaScenarios;
