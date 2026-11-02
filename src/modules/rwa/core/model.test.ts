import { describe, expect, it } from "vitest";
import { rwaMetrics, rwaScenarios } from "./model";

describe("RWA teaching scenario", () => {
  it("distinguishes total portfolio value from cash available for requests", () => {
    expect(rwaMetrics(100_000, 1_000, 20_000, 400)).toEqual({
      unitValue: 100,
      estimatedRequestValue: 40_000,
      liquidCash: 20_000,
      liquidityGap: 20_000,
    });
  });

  it("caps cash at portfolio value and requests at outstanding supply", () => {
    expect(rwaMetrics(1_000, 10, 2_000, 20)).toEqual({
      unitValue: 100,
      estimatedRequestValue: 1_000,
      liquidCash: 1_000,
      liquidityGap: 0,
    });
  });

  it("handles no supply without division by zero", () => {
    expect(rwaMetrics(1_000, 0, 500, 2)).toEqual({
      unitValue: 0,
      estimatedRequestValue: 0,
      liquidCash: 500,
      liquidityGap: 0,
    });
  });
});

describe("RWA scenario comparisons", () => {
  it("shows that more requests can increase the cash gap without changing portfolio value", () => {
    const a = rwaScenarios.baseline;
    const b = rwaScenarios.redemptionPressure;
    expect(b.assets).toBe(a.assets);
    expect(rwaMetrics(a.assets, a.supply, a.cash, a.requested).liquidityGap).toBe(20_000);
    expect(rwaMetrics(b.assets, b.supply, b.cash, b.requested).liquidityGap).toBe(60_000);
  });

  it("treats the higher-cash case as a composition change, not additional assets", () => {
    const stress = rwaScenarios.redemptionPressure;
    const cash = rwaScenarios.moreCash;
    expect(cash.assets).toBe(stress.assets);
    expect(cash.cash - stress.cash).toBe(60_000);
    expect(rwaMetrics(cash.assets, cash.supply, cash.cash, cash.requested).liquidityGap).toBe(0);
  });

  it("retains the old report when the assumed portfolio value falls", () => {
    const shock = rwaScenarios.priceShock;
    expect(shock.report.value).toBe(100_000);
    expect(shock.assets).toBe(80_000);
    expect(shock.report.age).toBe(1);
    expect(rwaMetrics(shock.assets, shock.supply, shock.cash, shock.requested).estimatedRequestValue).toBe(32_000);
  });
});
