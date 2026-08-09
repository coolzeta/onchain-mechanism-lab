import { describe, expect, it } from "vitest";
import { buildBlock, createMEVState, executeBlock, mevSpec, scanMempool, spotPriceScaled, submitVictim, validateMEVState } from "./engine";

describe("mempool ordering and MEV engine", () => {
  it("keeps a public victim transaction visible but does not add a searcher in the plain scenario", () => {
    let state = submitVictim(createMEVState(73, "public"));
    state = scanMempool(state);
    expect(state.mempool).toEqual(["VICTIM"]);
    expect(state.victimQuoteOut).toBe(90);
    expect(validateMEVState(state)).toEqual({ valid: true, violations: [] });
  });

  it("builds a sandwich around a public transaction and preserves conservation", () => {
    let state = submitVictim(createMEVState(73, "sandwich"));
    state = scanMempool(state);
    expect(state.mempool).toEqual(["SEARCHER_FRONT", "VICTIM", "SEARCHER_BACK"]);
    state = buildBlock(state);
    state = executeBlock(state);
    expect(state.phase).toBe("executed");
    expect(state.legs.map((leg) => leg.kind)).toEqual(["SEARCHER_FRONT", "VICTIM", "SEARCHER_BACK"]);
    expect(state.searcher.credits).toBeGreaterThan(state.initialSearcher.credits);
    expect(validateMEVState(state)).toEqual({ valid: true, violations: [] });
  });

  it("lets a tight minimum-output rule revert the victim without changing victim balances", () => {
    let state = createMEVState(73, "sandwich");
    state = mevSpec.reduce(state, { type: "SET_VICTIM_MIN_OUT", amount: 90 });
    state = submitVictim(state);
    state = scanMempool(state);
    state = buildBlock(state);
    state = executeBlock(state);
    expect(state.victimReverted).toBe(true);
    expect(state.victim).toEqual(state.initialVictim);
    expect(validateMEVState(state)).toEqual({ valid: true, violations: [] });
  });

  it("keeps private order flow invisible to the searcher", () => {
    let state = submitVictim(createMEVState(73, "private"));
    state = scanMempool(state);
    state = buildBlock(state);
    state = executeBlock(state);
    expect(state.mempool).toEqual(["VICTIM"]);
    expect(state.proposer.credits).toBe(0);
    expect(validateMEVState(state)).toEqual({ valid: true, violations: [] });
  });

  it("supports a backrun after the victim and produces deterministic replay", () => {
    let state = createMEVState(73, "backrun");
    state = submitVictim(state);
    state = scanMempool(state);
    state = buildBlock(state);
    const first = executeBlock(state);
    let second = createMEVState(73, "backrun");
    second = submitVictim(second);
    second = scanMempool(second);
    second = buildBlock(second);
    second = executeBlock(second);
    expect(first.legs.some((leg) => leg.kind === "SEARCHER_BACK")).toBe(true);
    expect(spotPriceScaled(first)).toBeGreaterThan(spotPriceScaled(createMEVState(73)));
    expect(mevSpec.serialize(first)).toContain("executed");
    expect(mevSpec.serialize(first)).toBe(mevSpec.serialize(second));
    expect(validateMEVState(first)).toEqual({ valid: true, violations: [] });
  });
});
