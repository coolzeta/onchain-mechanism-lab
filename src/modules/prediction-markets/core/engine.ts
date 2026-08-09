import type { SimulationSpec } from "@/platform/simulation/types";
import type {
  Order,
  Outcome,
  PredictionMarketAction,
  PredictionMarketMetrics,
  PredictionMarketState,
  ScenarioId,
  Trader,
} from "./types";

const MARKET_QUESTION = "2028 年前，人类会再次踏上月球吗？";

const BASE_TRADERS: Trader[] = [
  { id: "alice", name: "Alice", avatar: "A", belief: 72, credits: 2_000, reservedCredits: 0, yesShares: 0, noShares: 0, redeemed: false },
  { id: "bob", name: "Bob", avatar: "B", belief: 38, credits: 2_000, reservedCredits: 0, yesShares: 0, noShares: 0, redeemed: false },
  { id: "carol", name: "Carol", avatar: "C", belief: 55, credits: 2_000, reservedCredits: 0, yesShares: 0, noShares: 0, redeemed: false },
  { id: "you", name: "你", avatar: "你", belief: 60, credits: 2_000, reservedCredits: 0, yesShares: 0, noShares: 0, redeemed: false },
];

function cloneState(state: PredictionMarketState): PredictionMarketState {
  return {
    ...state,
    traders: state.traders.map((trader) => ({ ...trader })),
    orders: state.orders.map((order) => ({ ...order })),
    trades: state.trades.map((trade) => ({ ...trade })),
    events: state.events.map((event) => ({ ...event })),
  };
}

function appendEvent(state: PredictionMarketState, kind: string, message: string) {
  const index = state.events.length + 1;
  state.events.push({ id: `event-${index}`, index, kind, message });
}

function findTrader(state: PredictionMarketState, traderId: string) {
  const trader = state.traders.find((candidate) => candidate.id === traderId);
  if (!trader) throw new Error(`未知参与者：${traderId}`);
  return trader;
}

export function toYesPrice(outcome: Outcome, outcomePrice: number) {
  return outcome === "YES" ? outcomePrice : 100 - outcomePrice;
}

function orderSide(order: Order) {
  return order.outcome === "YES" ? "bid" : "ask";
}

export function activeBids(state: PredictionMarketState) {
  return state.orders
    .filter((order) => order.remaining > 0 && orderSide(order) === "bid")
    .sort((a, b) => b.yesPrice - a.yesPrice || a.sequence - b.sequence);
}

export function activeAsks(state: PredictionMarketState) {
  return state.orders
    .filter((order) => order.remaining > 0 && orderSide(order) === "ask")
    .sort((a, b) => a.yesPrice - b.yesPrice || a.sequence - b.sequence);
}

function matchOrders(state: PredictionMarketState) {
  while (true) {
    const bid = activeBids(state)[0];
    const ask = activeAsks(state)[0];
    if (!bid || !ask || bid.yesPrice < ask.yesPrice) return;

    const quantity = Math.min(bid.remaining, ask.remaining);
    const restingOrder = bid.sequence < ask.sequence ? bid : ask;
    const yesPrice = restingOrder.yesPrice;
    const noPrice = 100 - yesPrice;
    const yesBuyer = findTrader(state, bid.traderId);
    const noBuyer = findTrader(state, ask.traderId);

    bid.remaining -= quantity;
    ask.remaining -= quantity;
    yesBuyer.reservedCredits -= bid.outcomePrice * quantity;
    noBuyer.reservedCredits -= ask.outcomePrice * quantity;
    yesBuyer.credits -= yesPrice * quantity;
    noBuyer.credits -= noPrice * quantity;
    yesBuyer.yesShares += quantity;
    noBuyer.noShares += quantity;
    state.collateral += 100 * quantity;
    state.lastPrice = yesPrice;

    const sequence = state.nextSequence++;
    state.trades.push({
      id: `trade-${sequence}`,
      yesBuyerId: yesBuyer.id,
      noBuyerId: noBuyer.id,
      yesPrice,
      noPrice,
      quantity,
      sequence,
    });
    appendEvent(
      state,
      "ORDER_MATCHED",
      `${yesBuyer.name} 与 ${noBuyer.name} 成交 ${quantity} 份：YES ${yesPrice}，NO ${noPrice}。`,
    );
    appendEvent(state, "COLLATERAL_LOCKED", `${quantity * 100} 积分被锁进结算合约。`);
  }
}

export function placeOrder(
  state: PredictionMarketState,
  input: { traderId: string; outcome: Outcome; price: number; quantity: number },
) {
  if (state.phase !== "OPEN") throw new Error("市场已经结算，不能继续下单。");
  if (!Number.isInteger(input.price) || input.price < 1 || input.price > 99) {
    throw new Error("价格必须是 1 到 99 的整数。");
  }
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 20) {
    throw new Error("数量必须是 1 到 20 的整数。");
  }

  const next = cloneState(state);
  const trader = findTrader(next, input.traderId);
  const reserve = input.price * input.quantity;
  if (trader.credits - trader.reservedCredits < reserve) {
    throw new Error(`${trader.name} 没有足够的可用积分。`);
  }

  const sequence = next.nextSequence++;
  const order: Order = {
    id: `order-${sequence}`,
    traderId: trader.id,
    outcome: input.outcome,
    outcomePrice: input.price,
    yesPrice: toYesPrice(input.outcome, input.price),
    quantity: input.quantity,
    remaining: input.quantity,
    sequence,
  };
  trader.reservedCredits += reserve;
  next.orders.push(order);
  appendEvent(
    next,
    "ORDER_SUBMITTED",
    `${trader.name} 提交：买 ${input.outcome} ${input.quantity} 份，最高 ${input.price} 积分。`,
  );
  matchOrders(next);
  return next;
}

export function cancelOrder(state: PredictionMarketState, orderId: string) {
  const next = cloneState(state);
  const order = next.orders.find((candidate) => candidate.id === orderId);
  if (!order || order.remaining === 0) throw new Error("这张订单已经不存在或完全成交。");
  const trader = findTrader(next, order.traderId);
  trader.reservedCredits -= order.outcomePrice * order.remaining;
  appendEvent(next, "ORDER_CANCELLED", `${trader.name} 撤销了剩余 ${order.remaining} 份订单。`);
  order.remaining = 0;
  return next;
}

export function resolveMarket(state: PredictionMarketState, outcome: Outcome) {
  if (state.phase === "RESOLVED") throw new Error("市场不能重复结算。");
  const next = cloneState(state);
  next.phase = "RESOLVED";
  next.resolution = outcome;
  for (const order of next.orders.filter((candidate) => candidate.remaining > 0)) {
    const trader = findTrader(next, order.traderId);
    trader.reservedCredits -= order.outcomePrice * order.remaining;
    order.remaining = 0;
  }
  appendEvent(next, "MARKET_RESOLVED", `预言机报告最终结果为 ${outcome}，未成交订单全部撤销。`);
  return next;
}

export function redeemTrader(state: PredictionMarketState, traderId: string) {
  if (state.phase !== "RESOLVED" || !state.resolution) throw new Error("市场尚未结算。");
  const next = cloneState(state);
  const trader = findTrader(next, traderId);
  if (trader.redeemed) throw new Error("这个账户已经领取过结算款。");
  const winningShares = state.resolution === "YES" ? trader.yesShares : trader.noShares;
  const payout = winningShares * 100;
  trader.credits += payout;
  trader.redeemed = true;
  next.collateral -= payout;
  appendEvent(next, "PAYOUT_REDEEMED", `${trader.name} 用 ${winningShares} 份获胜头寸领取 ${payout} 积分。`);
  return next;
}

function baseState(seed: number, scenario: ScenarioId): PredictionMarketState {
  const traders = BASE_TRADERS.map((trader) => ({ ...trader }));
  const state: PredictionMarketState = {
    seed,
    scenario,
    question: MARKET_QUESTION,
    phase: "OPEN",
    resolution: null,
    oracleReliable: scenario !== "bad-oracle",
    traders,
    orders: [],
    trades: [],
    events: [],
    collateral: 0,
    initialCredits: traders.reduce((sum, trader) => sum + trader.credits, 0),
    nextSequence: 1,
    lastPrice: null,
  };
  appendEvent(state, "MARKET_CREATED", `市场创建：${MARKET_QUESTION}`);
  return state;
}

export function createEmptyState(seed = 7, scenario: ScenarioId = "normal") {
  return baseState(seed, scenario);
}

export function createScenarioState(seed = 7, scenario: ScenarioId = "normal") {
  let state = baseState(seed, scenario);
  if (scenario === "thin") {
    state = placeOrder(state, { traderId: "alice", outcome: "YES", price: 45, quantity: 1 });
    state = placeOrder(state, { traderId: "bob", outcome: "NO", price: 35, quantity: 1 });
    return state;
  }

  state = placeOrder(state, { traderId: "alice", outcome: "YES", price: scenario === "whale" ? 82 : 68, quantity: scenario === "whale" ? 12 : 3 });
  state = placeOrder(state, { traderId: "bob", outcome: "NO", price: 35, quantity: scenario === "whale" ? 8 : 2 });
  state = placeOrder(state, { traderId: "carol", outcome: "NO", price: 28, quantity: 4 });
  return state;
}

export function deriveMetrics(state: PredictionMarketState): PredictionMarketMetrics {
  const bid = activeBids(state)[0]?.yesPrice ?? null;
  const ask = activeAsks(state)[0]?.yesPrice ?? null;
  const impliedPrice = state.lastPrice ?? (bid !== null && ask !== null ? Math.round((bid + ask) / 2) : bid ?? ask ?? 50);
  return {
    bestBid: bid,
    bestAsk: ask,
    impliedPrice,
    spread: bid !== null && ask !== null ? ask - bid : null,
    openInterest: state.trades.reduce((sum, trade) => sum + trade.quantity, 0),
    totalVolume: state.trades.reduce((sum, trade) => sum + trade.quantity * trade.yesPrice, 0),
  };
}

export function validatePredictionMarket(state: PredictionMarketState) {
  const violations: string[] = [];
  const bid = activeBids(state)[0];
  const ask = activeAsks(state)[0];
  if (bid && ask && bid.yesPrice >= ask.yesPrice) violations.push("撮合结束后仍有交叉订单。");

  const reservedByTrader = new Map<string, number>();
  for (const order of state.orders.filter((candidate) => candidate.remaining > 0)) {
    reservedByTrader.set(
      order.traderId,
      (reservedByTrader.get(order.traderId) ?? 0) + order.outcomePrice * order.remaining,
    );
  }
  for (const trader of state.traders) {
    if (trader.reservedCredits !== (reservedByTrader.get(trader.id) ?? 0)) {
      violations.push(`${trader.name} 的订单冻结积分不一致。`);
    }
    if (trader.credits < 0 || trader.reservedCredits < 0) violations.push(`${trader.name} 的余额出现负数。`);
  }

  const totalCredits = state.traders.reduce((sum, trader) => sum + trader.credits, 0) + state.collateral;
  if (totalCredits !== state.initialCredits) violations.push("系统积分没有守恒。");
  if (state.collateral < 0) violations.push("结算合约支付超过了抵押资产。");

  const issuedPairs = state.trades.reduce((sum, trade) => sum + trade.quantity, 0);
  const paidWinningShares = state.phase === "RESOLVED" && state.resolution
    ? state.traders.reduce((sum, trader) => sum + (trader.redeemed ? 0 : state.resolution === "YES" ? trader.yesShares : trader.noShares), 0)
    : issuedPairs;
  if (state.collateral < paidWinningShares * 100) violations.push("剩余抵押不足以覆盖未领取的获胜份额。");

  return { valid: violations.length === 0, violations };
}

export const predictionMarketSpec: SimulationSpec<
  PredictionMarketState,
  PredictionMarketAction,
  PredictionMarketMetrics
> = {
  id: "binary-orderbook-v1",
  createInitialState: (seed) => createScenarioState(seed, "normal"),
  reduce: (state, action) => {
    switch (action.type) {
      case "PLACE_ORDER":
        return placeOrder(state, action);
      case "CANCEL_ORDER":
        return cancelOrder(state, action.orderId);
      case "SET_BELIEF": {
        const next = cloneState(state);
        findTrader(next, action.traderId).belief = Math.max(1, Math.min(99, Math.round(action.belief)));
        return next;
      }
      case "RESOLVE":
        return resolveMarket(state, action.outcome);
      case "REDEEM":
        return redeemTrader(state, action.traderId);
    }
  },
  deriveMetrics,
  validateInvariants: validatePredictionMarket,
  serialize: (state) => JSON.stringify(state),
  deserialize: (serialized) => JSON.parse(serialized) as PredictionMarketState,
};
