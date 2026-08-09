import { describe, expect, it } from "vitest";
import { activeAsks, activeBids, createMatchingEngineState, matchingEngineSpec, validateMatchingEngineState } from "./engine";

describe("matching engine simulation", () => {
  it("uses price priority and then time priority", () => {
    const state = matchingEngineSpec.reduce(createMatchingEngineState(51), { type: "PLACE_LIMIT", traderId: "you", side: "BUY", price: 104, quantity: 6 });
    expect(state.trades.map((trade) => [trade.price, trade.quantity])).toEqual([[102, 2], [102, 3]]);
    expect(state.trades[0].sellerId).toBe("maker-a");
    expect(state.trades[1].sellerId).toBe("maker-b");
    expect(activeBids(state).filter((order) => order.traderId === "you").map((order) => [order.price, order.remaining])).toEqual([[104, 1]]);
    expect(activeAsks(state).map((order) => [order.price, order.remaining])).toEqual([[105, 5]]);
  });

  it("charges the resting order price and supports partial fills", () => {
    const state = matchingEngineSpec.reduce(createMatchingEngineState(52), { type: "PLACE_LIMIT", traderId: "you", side: "BUY", price: 104, quantity: 6 });
    expect(state.lastPrice).toBe(102);
    expect(state.trades.reduce((sum, trade) => sum + trade.price * trade.quantity, 0)).toBe(510);
    const user = state.traders.find((trader) => trader.id === "you");
    expect(user?.asset).toBe(105);
    expect(user?.reservedCash).toBe(104);
  });

  it("cancels remaining orders and releases reservations", () => {
    const placed = matchingEngineSpec.reduce(createMatchingEngineState(53), { type: "PLACE_LIMIT", traderId: "you", side: "BUY", price: 104, quantity: 6 });
    const remaining = activeBids(placed).find((order) => order.traderId === "you");
    expect(remaining?.remaining).toBe(1);
    const cancelled = matchingEngineSpec.reduce(placed, { type: "CANCEL_ORDER", orderId: remaining!.id });
    expect(activeBids(cancelled).some((order) => order.traderId === "you")).toBe(false);
    expect(cancelled.traders.find((trader) => trader.id === "you")?.reservedCash).toBe(0);
    expect(validateMatchingEngineState(cancelled).valid).toBe(true);
  });

  it("keeps cash and asset balances conserved and replays deterministically", () => {
    const actions = [
      { type: "PLACE_LIMIT", traderId: "you", side: "BUY", price: 104, quantity: 6 } as const,
      { type: "PLACE_LIMIT", traderId: "maker-b", side: "SELL", price: 99, quantity: 2 } as const,
    ];
    const first = actions.reduce((state, action) => matchingEngineSpec.reduce(state, action), createMatchingEngineState(54));
    const second = actions.reduce((state, action) => matchingEngineSpec.reduce(state, action), createMatchingEngineState(54));
    expect(validateMatchingEngineState(first).valid).toBe(true);
    expect(matchingEngineSpec.serialize(first)).toBe(matchingEngineSpec.serialize(second));
  });

  it("prevents a trader from matching against its own resting order", () => {
    const first = matchingEngineSpec.reduce(createMatchingEngineState(55), { type: "PLACE_LIMIT", traderId: "you", side: "BUY", price: 100, quantity: 1 });
    const next = matchingEngineSpec.reduce(first, { type: "PLACE_LIMIT", traderId: "you", side: "SELL", price: 99, quantity: 1 });
    expect(next.trades).toHaveLength(0);
    expect(next.events.at(-1)?.kind).toBe("SELF_TRADE_PREVENTED");
    expect(validateMatchingEngineState(next).valid).toBe(true);
  });

  it("sweeps multiple ask levels with a market order and reports execution quality", () => {
    const state = matchingEngineSpec.reduce(createMatchingEngineState(56), { type: "PLACE_MARKET", traderId: "you", side: "BUY", quantity: 8 });
    expect(state.trades.map((trade) => [trade.price, trade.quantity])).toEqual([[102, 2], [102, 3], [105, 3]]);
    expect(state.lastExecution).toMatchObject({ orderType: "MARKET", requestedQuantity: 8, executedQuantity: 8, remainingQuantity: 0, notional: 825, averagePrice: 103.125 });
    expect(activeAsks(state).map((order) => [order.price, order.remaining])).toEqual([[105, 2]]);
    expect(validateMatchingEngineState(state).valid).toBe(true);
  });

  it("cancels the unfilled remainder of a market order instead of leaving it in the book", () => {
    const state = matchingEngineSpec.reduce(createMatchingEngineState(57), { type: "PLACE_MARKET", traderId: "you", side: "SELL", quantity: 20 });
    expect(state.trades.reduce((sum, trade) => sum + trade.quantity, 0)).toBe(8);
    expect(state.lastExecution?.remainingQuantity).toBe(12);
    expect(activeBids(state).some((order) => order.traderId === "you")).toBe(false);
    expect(state.events.at(-1)?.kind).toBe("MARKET_ORDER_EXPIRED");
    expect(validateMatchingEngineState(state).valid).toBe(true);
  });

  it("gives a replaced order a new sequence and lets it cross the book", () => {
    const queued = matchingEngineSpec.reduce(createMatchingEngineState(58), { type: "PLACE_LIMIT", traderId: "you", side: "BUY", price: 100, quantity: 2 });
    const queuedOrder = activeBids(queued).find((order) => order.traderId === "you");
    const replaced = matchingEngineSpec.reduce(queued, { type: "REPLACE_ORDER", orderId: queuedOrder!.id, price: 102, quantity: 2 });
    expect(replaced.events.some((event) => event.kind === "ORDER_REPLACED")).toBe(true);
    expect(replaced.trades).toHaveLength(1);
    expect(replaced.trades[0]).toMatchObject({ price: 102, quantity: 2, sellerId: "maker-a" });
    expect(validateMatchingEngineState(replaced).valid).toBe(true);
  });
});
