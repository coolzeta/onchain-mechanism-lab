import { describe, expect, it } from "vitest";
import {
  activeAsks,
  cancelOrder,
  createEmptyState,
  createScenarioState,
  placeOrder,
  predictionMarketSpec,
  redeemTrader,
  resolveMarket,
  toYesPrice,
  validatePredictionMarket,
} from "./engine";

describe("binary prediction market engine", () => {
  it("converts a BUY NO quote into the complementary YES ask", () => {
    expect(toYesPrice("YES", 68)).toBe(68);
    expect(toYesPrice("NO", 35)).toBe(65);
  });

  it("matches at the resting order price", () => {
    let state = createEmptyState();
    state = placeOrder(state, { traderId: "bob", outcome: "NO", price: 35, quantity: 2 });
    state = placeOrder(state, { traderId: "alice", outcome: "YES", price: 70, quantity: 1 });

    expect(state.trades).toHaveLength(1);
    expect(state.trades[0]).toMatchObject({ yesPrice: 65, noPrice: 35, quantity: 1 });
    expect(state.collateral).toBe(100);
  });

  it("keeps a partially filled order in the book", () => {
    let state = createEmptyState();
    state = placeOrder(state, { traderId: "bob", outcome: "NO", price: 35, quantity: 3 });
    state = placeOrder(state, { traderId: "alice", outcome: "YES", price: 70, quantity: 1 });

    expect(activeAsks(state)[0].remaining).toBe(2);
    expect(state.traders.find((trader) => trader.id === "bob")?.reservedCredits).toBe(70);
  });

  it("releases reserved credits when an order is cancelled", () => {
    let state = createEmptyState();
    state = placeOrder(state, { traderId: "alice", outcome: "YES", price: 60, quantity: 2 });
    const orderId = state.orders[0].id;
    expect(state.traders[0].reservedCredits).toBe(120);
    state = cancelOrder(state, orderId);
    expect(state.traders[0].reservedCredits).toBe(0);
  });

  it("uses price priority before time priority", () => {
    let state = createEmptyState();
    state = placeOrder(state, { traderId: "alice", outcome: "YES", price: 60, quantity: 1 });
    state = placeOrder(state, { traderId: "carol", outcome: "YES", price: 68, quantity: 1 });
    state = placeOrder(state, { traderId: "bob", outcome: "NO", price: 35, quantity: 1 });
    expect(state.trades[0].yesBuyerId).toBe("carol");
  });

  it("conserves credits through matching and settlement", () => {
    let state = createEmptyState();
    state = placeOrder(state, { traderId: "bob", outcome: "NO", price: 35, quantity: 2 });
    state = placeOrder(state, { traderId: "alice", outcome: "YES", price: 70, quantity: 2 });
    state = resolveMarket(state, "YES");
    for (const trader of state.traders) state = redeemTrader(state, trader.id);

    expect(state.collateral).toBe(0);
    expect(state.traders.reduce((sum, trader) => sum + trader.credits, 0)).toBe(state.initialCredits);
    expect(validatePredictionMarket(state)).toEqual({ valid: true, violations: [] });
  });

  it("rejects duplicate redemptions", () => {
    let state = createScenarioState(7, "normal");
    state = resolveMarket(state, "YES");
    state = redeemTrader(state, "alice");
    expect(() => redeemTrader(state, "alice")).toThrow("已经领取");
  });

  it("replays deterministically from the same seed and actions", () => {
    const action = { type: "PLACE_ORDER" as const, traderId: "you", outcome: "YES" as const, price: 75, quantity: 2 };
    const first = predictionMarketSpec.reduce(predictionMarketSpec.createInitialState(19), action);
    const second = predictionMarketSpec.reduce(predictionMarketSpec.createInitialState(19), action);
    expect(predictionMarketSpec.serialize(first)).toBe(predictionMarketSpec.serialize(second));
  });
});
