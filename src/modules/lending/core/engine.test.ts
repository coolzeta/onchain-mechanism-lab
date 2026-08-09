import { describe, expect, it } from "vitest";
import { accrueInterest, borrow, createLendingState, deriveLendingMetrics, depositCollateral, liquidate, repay, setMarketPrice, updateOracle, validateLendingState, withdrawCollateral } from "./engine";

describe("lending engine", () => {
  it("caps borrowing by the maximum loan-to-value ratio", () => {
    const deposited = depositCollateral(createLendingState(), 100);
    const borrowed = borrow(deposited, 9_000);
    expect(borrowed.debt).toBe(9_000);
    expect(() => borrow(borrowed, 1)).toThrow(/超过额度/);
    expect(deriveLendingMetrics(borrowed).healthFactorBps).toBe(10_666);
  });

  it("separates a market price shock from the stale oracle price", () => {
    const state = depositCollateral(createLendingState(), 100);
    const shocked = setMarketPrice(state, 72);
    expect(shocked.oraclePrice).toBe(120);
    const refreshed = updateOracle(shocked, 72);
    expect(deriveLendingMetrics(refreshed).collateralValue).toBe(7_200);
  });

  it("liquidates an unsafe position and preserves balances", () => {
    const opened = borrow(depositCollateral(createLendingState(), 100), 7_000);
    const unsafe = setMarketPrice(updateOracle(opened, 80), 80);
    const liquidated = liquidate(unsafe);
    expect(liquidated.debt).toBe(0);
    expect(liquidated.liquidatorCollateral).toBeGreaterThan(0);
    expect(validateLendingState(liquidated).valid).toBe(true);
  });

  it("makes interest visible in health without breaking cash conservation", () => {
    const opened = borrow(depositCollateral(createLendingState(), 100), 8_000);
    const before = deriveLendingMetrics(opened).healthFactorBps;
    const after = accrueInterest(opened);
    expect(after.debt).toBe(8_080);
    expect(deriveLendingMetrics(after).healthFactorBps).toBeLessThan(before!);
    expect(validateLendingState(after).valid).toBe(true);
    expect(repay(after, 80).debt).toBe(8_000);
  });

  it("does not treat a stale oracle as an immediate liquidation", () => {
    const opened = borrow(depositCollateral(createLendingState(), 100), 8_000);
    const stale = setMarketPrice(opened, 60);
    expect(deriveLendingMetrics(stale).canLiquidate).toBe(false);
    const updated = updateOracle(stale, 60);
    expect(deriveLendingMetrics(updated).canLiquidate).toBe(true);
  });

  it("rejects a withdrawal that would cross the liquidation line", () => {
    const opened = borrow(depositCollateral(createLendingState(), 100), 8_000);
    expect(() => withdrawCollateral(opened, 30)).toThrow(/跌破清算线/);
  });

  it("leaves explicit bad debt when collateral cannot cover the full position", () => {
    const opened = borrow(depositCollateral(createLendingState(), 100), 9_000);
    const unsafe = updateOracle(setMarketPrice(opened, 50), 50);
    const liquidated = liquidate(unsafe);
    expect(liquidated.debt).toBeGreaterThan(0);
    expect(deriveLendingMetrics(liquidated).badDebt).toBe(liquidated.debt);
    expect(validateLendingState(liquidated).valid).toBe(true);
  });
});
