import { describe, expect, it } from "vitest";
import { createStablecoinState, deriveStablecoinMetrics, mintStable, redeemStable, stablecoinSpec, validateStablecoinState } from "./engine";

describe("stablecoin engine", () => {
  it("caps issuance by the minimum collateral ratio", () => {
    const deposited = stablecoinSpec.reduce(createStablecoinState(), { type: "DEPOSIT_COLLATERAL", amount: 100 });
    const minted = mintStable(deposited, 66);
    const metrics = deriveStablecoinMetrics(minted);

    expect(metrics.maxMint).toBe(66);
    expect(metrics.availableToMint).toBe(0);
    expect(metrics.collateralRatioBps).toBe(15_151);
    expect(() => mintStable(minted, 1)).toThrow("超过抵押率上限");
  });

  it("burns redeemed units and keeps redemption fees in reserve", () => {
    const state = mintStable(stablecoinSpec.reduce(createStablecoinState(), { type: "DEPOSIT_COLLATERAL", amount: 100 }), 66);
    const redeemed = redeemStable(state, 10);

    expect(redeemed.supply).toBe(56);
    expect(redeemed.userStable).toBe(56);
    expect(redeemed.walletCollateral).toBe(909);
    expect(redeemed.reserveCollateral).toBe(91);
    expect(redeemed.totalFeesCollateral).toBe(1);
    expect(validateStablecoinState(redeemed).valid).toBe(true);
  });

  it("makes stale oracle and reserve loss observable without violating conservation", () => {
    const deposited = stablecoinSpec.reduce(createStablecoinState(303, "stale-oracle"), { type: "DEPOSIT_COLLATERAL", amount: 100 });
    const minted = mintStable(deposited, 50);
    const marketMoved = stablecoinSpec.reduce(minted, { type: "SET_MARKET_PRICE", priceCents: 80 });
    const impaired = stablecoinSpec.reduce(marketMoved, { type: "APPLY_RESERVE_LOSS", amount: 100 });
    const metrics = deriveStablecoinMetrics(impaired);

    expect(metrics.phase).toBe("UNDERCOLLATERALIZED");
    expect(impaired.lostCollateral).toBe(100);
    expect(validateStablecoinState(impaired).valid).toBe(true);
  });

  it("replays the same action sequence deterministically", () => {
    const origin = createStablecoinState(17);
    const actions = [
      { type: "DEPOSIT_COLLATERAL", amount: 200 } as const,
      { type: "MINT_STABLE", amount: 100 } as const,
      { type: "SET_MARKET_PRICE", priceCents: 96 } as const,
      { type: "REDEEM_STABLE", amount: 20 } as const,
    ];
    const first = actions.reduce((state, action) => stablecoinSpec.reduce(state, action), origin);
    const replayed = actions.reduce((state, action) => stablecoinSpec.reduce(state, action), stablecoinSpec.deserialize(stablecoinSpec.serialize(origin)));

    expect(stablecoinSpec.serialize(first)).toBe(stablecoinSpec.serialize(replayed));
    expect(deriveStablecoinMetrics(first).pegGapBps).toBe(-400);
  });
});
