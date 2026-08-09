import { describe, expect, it } from "vitest";
import { addLiquidity, ammSpec, arbitrageToPrice, createAMMState, deriveAMMMetrics, quoteSwap, removeLiquidity, swap, validateAMMState } from "./engine";

describe("constant product AMM engine", () => {
  it("quotes a swap with a fee and positive price impact", () => {
    const state = createAMMState();
    const quote = quoteSwap(state, "X_TO_Y", 12_000);
    expect(quote.fee).toBe(36);
    expect(quote.amountOut).toBe(90);
    expect(quote.priceImpactBps).toBeGreaterThan(0);
  });

  it("updates reserves, trader balances and fees while conserving assets", () => {
    const state = swap(createAMMState(), "X_TO_Y", 12_000);
    expect(state.reserveX).toBe(132_000);
    expect(state.reserveY).toBe(910);
    expect(state.trader.xBalance).toBe(18_000);
    expect(state.trader.yBalance).toBe(290);
    expect(state.totalFeesX).toBe(36);
    expect(validateAMMState(state)).toEqual({ valid: true, violations: [] });
  });

  it("lets a trader become an LP and withdraw a proportional share", () => {
    let state = addLiquidity(createAMMState(), 12_000, 100);
    expect(state.trader.lpShares).toBe(10_000);
    const shares = state.trader.lpShares / 2;
    state = removeLiquidity(state, shares);
    expect(state.trader.xBalance).toBe(24_000);
    expect(state.trader.yBalance).toBe(150);
    expect(state.trader.lpShares).toBe(5_000);
    expect(validateAMMState(state)).toEqual({ valid: true, violations: [] });
  });

  it("keeps deterministic serialized state for the same action sequence", () => {
    const action = { type: "SWAP" as const, direction: "Y_TO_X" as const, amountIn: 40 };
    const first = ammSpec.reduce(ammSpec.createInitialState(17), action);
    const second = ammSpec.reduce(ammSpec.createInitialState(17), action);
    expect(ammSpec.serialize(first)).toBe(ammSpec.serialize(second));
    expect(deriveAMMMetrics(first).lastTrade?.amountOut).toBeGreaterThan(0);
  });

  it("rejects a swap that would empty the pool or exceed the trader balance", () => {
    expect(() => swap(createAMMState(), "X_TO_Y", 40_000)).toThrow("余额不足");
    expect(() => quoteSwap(createAMMState(), "X_TO_Y", 200)).not.toThrow();
  });

  it("lets an external arbitrageur pull the pool toward an outside price", () => {
    const initial = createAMMState();
    const next = arbitrageToPrice(initial, 150_000);
    expect(next.externalPriceScaled).toBe(150_000);
    expect(Math.abs(deriveAMMMetrics(next).spotPriceXPerYScaled - 150_000)).toBeLessThan(Math.abs(120_000 - 150_000));
    expect(next.arbitrageur.xBalance).toBeLessThan(initial.arbitrageur.xBalance);
    expect(validateAMMState(next)).toEqual({ valid: true, violations: [] });
  });

  it("reports LP inventory value against the hold baseline", () => {
    let state = addLiquidity(createAMMState(), 12_000, 100);
    expect(deriveAMMMetrics(state).lpPositionValueX).toBeGreaterThan(0);
    state = swap(state, "X_TO_Y", 12_000);
    const metrics = deriveAMMMetrics(state);
    expect(metrics.lpPositionX).toBeGreaterThan(0);
    expect(metrics.lpPositionY).toBeGreaterThan(0);
    expect(metrics.lpHoldValueX).toBeGreaterThan(0);
    expect(metrics.lpValueDeltaBps).not.toBe(0);
  });
});
