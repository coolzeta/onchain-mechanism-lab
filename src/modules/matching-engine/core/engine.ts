import type { SimulationSpec } from "@/platform/simulation/types";
import type {
  EngineOrder,
  EngineOrderType,
  EngineTrader,
  EngineTraderId,
  MatchingEngineAction,
  MatchingEngineMetrics,
  MatchingEngineState,
  OrderSide,
} from "./types";

const INITIAL_CASH = 20_000;
const INITIAL_ASSET = 100;
const TICK_MIN = 1;
const TICK_MAX = 999;

function cloneState(state: MatchingEngineState): MatchingEngineState {
  return {
    ...state,
    traders: state.traders.map((trader) => ({ ...trader })),
    orders: state.orders.map((order) => ({ ...order })),
    trades: state.trades.map((trade) => ({ ...trade })),
    events: state.events.map((event) => ({ ...event })),
    lastExecution: state.lastExecution ? { ...state.lastExecution } : null,
  };
}

function appendEvent(state: MatchingEngineState, kind: string, message: string) {
  const index = state.events.length + 1;
  state.events.push({ id: `event-${index}`, index, kind, message });
}

function findTrader(state: MatchingEngineState, traderId: EngineTraderId) {
  const trader = state.traders.find((candidate) => candidate.id === traderId);
  if (!trader) throw new Error(`未知交易者：${traderId}`);
  return trader;
}

function traderName(state: MatchingEngineState, traderId: EngineTraderId) {
  return findTrader(state, traderId).name;
}

function validateOrderInput(price: number, quantity: number) {
  if (!Number.isInteger(price) || price < TICK_MIN || price > TICK_MAX) throw new Error("价格必须是 1 到 999 的整数分。");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new Error("数量必须是 1 到 20 的整数。");
}

export function activeBids(state: MatchingEngineState) {
  return state.orders
    .filter((order) => order.side === "BUY" && order.remaining > 0)
    .sort((a, b) => b.price - a.price || a.sequence - b.sequence);
}

export function activeAsks(state: MatchingEngineState) {
  return state.orders
    .filter((order) => order.side === "SELL" && order.remaining > 0)
    .sort((a, b) => a.price - b.price || a.sequence - b.sequence);
}

function orderSideLabel(side: OrderSide) {
  return side === "BUY" ? "买入" : "卖出";
}

function releaseReservation(state: MatchingEngineState, order: EngineOrder) {
  const trader = findTrader(state, order.traderId);
  if (order.side === "BUY") trader.reservedCash -= order.reservePrice * order.remaining;
  else trader.reservedAsset -= order.remaining;
}

function matchOrders(state: MatchingEngineState) {
  while (true) {
    const bid = activeBids(state)[0];
    const ask = activeAsks(state)[0];
    if (!bid || !ask || bid.price < ask.price) return;

    const quantity = Math.min(bid.remaining, ask.remaining);
    const maker = bid.sequence < ask.sequence ? bid : ask;
    const taker = maker.id === bid.id ? ask : bid;
    if (bid.traderId === ask.traderId) {
      releaseReservation(state, taker);
      const cancelledQuantity = taker.remaining;
      taker.remaining = 0;
      appendEvent(state, "SELF_TRADE_PREVENTED", `${traderName(state, taker.traderId)} 的新订单会与自己的订单成交，已取消新订单剩余 ${cancelledQuantity} LAB。`);
      continue;
    }
    const tradePrice = maker.price;
    const buyer = findTrader(state, bid.traderId);
    const seller = findTrader(state, ask.traderId);

    bid.remaining -= quantity;
    ask.remaining -= quantity;
    buyer.reservedCash -= bid.reservePrice * quantity;
    seller.reservedAsset -= quantity;
    buyer.cash -= tradePrice * quantity;
    buyer.asset += quantity;
    seller.cash += tradePrice * quantity;
    seller.asset -= quantity;

    const sequence = state.nextSequence++;
    state.trades.push({
      id: `trade-${sequence}`,
      buyOrderId: bid.id,
      sellOrderId: ask.id,
      makerOrderId: maker.id,
      takerOrderId: taker.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      price: tradePrice,
      quantity,
      sequence,
    });
    state.lastPrice = tradePrice;
    appendEvent(state, "ORDER_MATCHED", `${traderName(state, buyer.id)} 与 ${traderName(state, seller.id)} 成交 ${quantity} LAB @ ${tradePrice} 分。`);
    appendEvent(state, "MAKER_PRICE", `成交采用静止订单价格：${traderName(state, maker.traderId)} 的 ${tradePrice} 分，而不是新订单的限价。`);
  }
}

export function placeLimitOrder(
  state: MatchingEngineState,
  input: { traderId: EngineTraderId; side: OrderSide; price: number; quantity: number },
) {
  validateOrderInput(input.price, input.quantity);
  const next = cloneState(state);
  const trader = findTrader(next, input.traderId);
  if (input.side === "BUY") {
    const requiredCash = input.price * input.quantity;
    if (trader.cash - trader.reservedCash < requiredCash) throw new Error(`${trader.name} 没有足够的可用现金。`);
    trader.reservedCash += requiredCash;
  } else if (trader.asset - trader.reservedAsset < input.quantity) {
    throw new Error(`${trader.name} 没有足够的可用 LAB。`);
  } else {
    trader.reservedAsset += input.quantity;
  }

  const sequence = next.nextSequence++;
  next.orders.push({
    id: `order-${sequence}`,
    traderId: input.traderId,
    side: input.side,
    orderType: "LIMIT",
    price: input.price,
    reservePrice: input.price,
    quantity: input.quantity,
    remaining: input.quantity,
    sequence,
  });
  appendEvent(next, "ORDER_ACCEPTED", `${trader.name} 提交${orderSideLabel(input.side)}限价单：${input.quantity} LAB @ ${input.price} 分。`);
  matchOrders(next);
  recordLastExecution(next, `order-${sequence}`, "LIMIT", input.quantity);
  return next;
}

function validateQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new Error("数量必须是 1 到 20 的整数。 ");
}

function recordLastExecution(state: MatchingEngineState, orderId: string, orderType: EngineOrderType, requestedQuantity: number) {
  const order = state.orders.find((candidate) => candidate.id === orderId);
  if (!order) return;
  const trades = state.trades.filter((trade) => trade.buyOrderId === orderId || trade.sellOrderId === orderId);
  const executedQuantity = trades.reduce((sum, trade) => sum + trade.quantity, 0);
  const notional = trades.reduce((sum, trade) => sum + trade.price * trade.quantity, 0);
  state.lastExecution = {
    orderId,
    orderType,
    requestedQuantity,
    executedQuantity,
    remainingQuantity: requestedQuantity - executedQuantity,
    notional,
    averagePrice: executedQuantity > 0 ? notional / executedQuantity : null,
  };
}

export function placeMarketOrder(
  state: MatchingEngineState,
  input: { traderId: EngineTraderId; side: OrderSide; quantity: number },
) {
  validateQuantity(input.quantity);
  const next = cloneState(state);
  const trader = findTrader(next, input.traderId);
  const opposite = input.side === "BUY" ? activeAsks(next) : activeBids(next);
  if (!opposite.length) throw new Error("当前没有可立即成交的对手方，市价单不会留在订单簿里。 ");

  const reservePrice = input.side === "BUY" ? Math.max(...opposite.map((order) => order.price)) : 0;
  if (input.side === "BUY") {
    const requiredCash = reservePrice * input.quantity;
    if (trader.cash - trader.reservedCash < requiredCash) throw new Error(`${trader.name} 没有足够的可用现金完成这笔市价单。`);
    trader.reservedCash += requiredCash;
  } else if (trader.asset - trader.reservedAsset < input.quantity) {
    throw new Error(`${trader.name} 没有足够的可用 LAB 完成这笔市价单。`);
  } else {
    trader.reservedAsset += input.quantity;
  }

  const sequence = next.nextSequence++;
  const orderId = `order-${sequence}`;
  next.orders.push({
    id: orderId,
    traderId: input.traderId,
    side: input.side,
    orderType: "MARKET",
    price: input.side === "BUY" ? TICK_MAX : TICK_MIN,
    reservePrice,
    quantity: input.quantity,
    remaining: input.quantity,
    sequence,
  });
  appendEvent(next, "MARKET_ORDER_ACCEPTED", `${trader.name} 提交${orderSideLabel(input.side)}市价单：${input.quantity} LAB，立即吃掉可用深度。`);
  matchOrders(next);
  const order = next.orders.find((candidate) => candidate.id === orderId)!;
  if (order.remaining > 0) {
    const expired = order.remaining;
    releaseReservation(next, order);
    order.remaining = 0;
    appendEvent(next, "MARKET_ORDER_EXPIRED", `市价单剩余 ${expired} LAB 没有对手方，按 IOC 规则取消，冻结资产已释放。`);
  }
  recordLastExecution(next, orderId, "MARKET", input.quantity);
  return next;
}

export function replaceOrder(state: MatchingEngineState, input: { orderId: string; price: number; quantity: number }) {
  validateOrderInput(input.price, input.quantity);
  const next = cloneState(state);
  const oldOrder = next.orders.find((candidate) => candidate.id === input.orderId);
  if (!oldOrder || oldOrder.remaining <= 0) throw new Error("只有仍在等待中的限价单可以撤改单。 ");
  if (oldOrder.orderType !== "LIMIT") throw new Error("市价单不会留在订单簿里，不能撤改单。 ");

  const trader = findTrader(next, oldOrder.traderId);
  const oldRemaining = oldOrder.remaining;
  releaseReservation(next, oldOrder);
  oldOrder.remaining = 0;
  appendEvent(next, "ORDER_REPLACED", `${trader.name} 撤掉 ${oldRemaining} LAB @ ${oldOrder.price}，以新价格重新排队。`);

  if (oldOrder.side === "BUY") {
    const requiredCash = input.price * input.quantity;
    if (trader.cash - trader.reservedCash < requiredCash) throw new Error(`${trader.name} 没有足够的可用现金挂出新价格。`);
    trader.reservedCash += requiredCash;
  } else if (trader.asset - trader.reservedAsset < input.quantity) {
    throw new Error(`${trader.name} 没有足够的可用 LAB 挂出新价格。`);
  } else {
    trader.reservedAsset += input.quantity;
  }

  const sequence = next.nextSequence++;
  const newOrderId = `order-${sequence}`;
  next.orders.push({
    id: newOrderId,
    traderId: oldOrder.traderId,
    side: oldOrder.side,
    orderType: "LIMIT",
    price: input.price,
    reservePrice: input.price,
    quantity: input.quantity,
    remaining: input.quantity,
    sequence,
  });
  appendEvent(next, "ORDER_ACCEPTED", `${trader.name} 以 ${input.price} 分重新提交${orderSideLabel(oldOrder.side)}单，时间优先级重新开始。`);
  matchOrders(next);
  recordLastExecution(next, newOrderId, "LIMIT", input.quantity);
  return next;
}

export function cancelOrder(state: MatchingEngineState, orderId: string) {
  const next = cloneState(state);
  const order = next.orders.find((candidate) => candidate.id === orderId);
  if (!order || order.remaining <= 0) throw new Error("订单不存在或已经完全成交。");
  const trader = findTrader(next, order.traderId);
  releaseReservation(next, order);
  appendEvent(next, "ORDER_CANCELLED", `${trader.name} 撤销 ${order.remaining} LAB @ ${order.price} 分的剩余订单。`);
  order.remaining = 0;
  return next;
}

function initialTraders(): EngineTrader[] {
  return [
    { id: "maker-a", name: "Maker A", cash: INITIAL_CASH, asset: INITIAL_ASSET, reservedCash: 0, reservedAsset: 0 },
    { id: "maker-b", name: "Maker B", cash: INITIAL_CASH, asset: INITIAL_ASSET, reservedCash: 0, reservedAsset: 0 },
    { id: "you", name: "你", cash: INITIAL_CASH, asset: INITIAL_ASSET, reservedCash: 0, reservedAsset: 0 },
  ];
}

function baseState(seed: number): MatchingEngineState {
  const traders = initialTraders();
  const state: MatchingEngineState = {
    seed,
    pair: { baseSymbol: "LAB", quoteSymbol: "积分" },
    traders,
    orders: [
      { id: "order-1", traderId: "maker-a", side: "SELL", orderType: "LIMIT", price: 102, reservePrice: 0, quantity: 2, remaining: 2, sequence: 1 },
      { id: "order-2", traderId: "maker-b", side: "SELL", orderType: "LIMIT", price: 102, reservePrice: 0, quantity: 3, remaining: 3, sequence: 2 },
      { id: "order-3", traderId: "maker-a", side: "SELL", orderType: "LIMIT", price: 105, reservePrice: 0, quantity: 5, remaining: 5, sequence: 3 },
      { id: "order-4", traderId: "maker-b", side: "BUY", orderType: "LIMIT", price: 98, reservePrice: 98, quantity: 3, remaining: 3, sequence: 4 },
      { id: "order-5", traderId: "maker-a", side: "BUY", orderType: "LIMIT", price: 96, reservePrice: 96, quantity: 5, remaining: 5, sequence: 5 },
    ],
    trades: [],
    events: [],
    initialCash: traders.length * INITIAL_CASH,
    initialAsset: traders.length * INITIAL_ASSET,
    nextSequence: 6,
    lastPrice: null,
    lastExecution: null,
  };
  findTrader(state, "maker-a").reservedAsset = 7;
  findTrader(state, "maker-b").reservedAsset = 3;
  findTrader(state, "maker-b").reservedCash = 98 * 3;
  findTrader(state, "maker-a").reservedCash = 96 * 5;
  appendEvent(state, "BOOK_CREATED", "盘口创建：卖一 102 分（两个价位相同的订单），买一 98 分。价格和时间都需要被保留。 ");
  return state;
}

export function createMatchingEngineState(seed = 41) {
  return baseState(seed);
}

export function deriveMatchingEngineMetrics(state: MatchingEngineState): MatchingEngineMetrics {
  const bids = activeBids(state);
  const asks = activeAsks(state);
  const bestBid = bids[0]?.price ?? null;
  const bestAsk = asks[0]?.price ?? null;
  const prices = new Set([...bids, ...asks].map((order) => order.price));
  const bestBidDepth = bestBid === null ? 0 : bids.filter((order) => order.price === bestBid).reduce((sum, order) => sum + order.remaining, 0);
  const bestAskDepth = bestAsk === null ? 0 : asks.filter((order) => order.price === bestAsk).reduce((sum, order) => sum + order.remaining, 0);
  const probeQuantity = 5;
  let probeRemaining = probeQuantity;
  let probeNotional = 0;
  for (const order of asks) {
    if (probeRemaining <= 0) break;
    const quantity = Math.min(probeRemaining, order.remaining);
    probeNotional += quantity * order.price;
    probeRemaining -= quantity;
  }
  const probeAveragePrice = probeRemaining === 0 ? probeNotional / probeQuantity : null;
  return {
    bestBid,
    bestAsk,
    spread: bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null,
    midPrice: bestBid !== null && bestAsk !== null ? (bestBid + bestAsk) / 2 : bestBid ?? bestAsk,
    lastPrice: state.lastPrice,
    activeOrderCount: bids.length + asks.length,
    queuedQuantity: [...bids, ...asks].reduce((sum, order) => sum + order.remaining, 0),
    tradedQuantity: state.trades.reduce((sum, trade) => sum + trade.quantity, 0),
    priceLevels: prices.size,
    bestBidDepth,
    bestAskDepth,
    probeQuantity,
    probeAveragePrice,
    probeImpactBps: bestAsk !== null && probeAveragePrice !== null ? Math.round(((probeAveragePrice - bestAsk) / bestAsk) * 10_000) : null,
    lastExecution: state.lastExecution,
  };
}

export function validateMatchingEngineState(state: MatchingEngineState) {
  const violations: string[] = [];
  const bid = activeBids(state)[0];
  const ask = activeAsks(state)[0];
  if (bid && ask && bid.price >= ask.price) violations.push("撮合结束后订单簿不能交叉。 ");

  const reservedCash = new Map<EngineTraderId, number>();
  const reservedAsset = new Map<EngineTraderId, number>();
  for (const order of state.orders.filter((candidate) => candidate.remaining > 0)) {
    if (order.remaining > order.quantity || order.remaining < 0) violations.push("订单剩余数量不合法。 ");
    if (order.orderType === "MARKET") violations.push("市价单不应该停留在订单簿里。 ");
    if (order.price < TICK_MIN || order.price > TICK_MAX || order.reservePrice < 0) violations.push("订单价格或冻结价格不合法。 ");
    if (order.side === "BUY") reservedCash.set(order.traderId, (reservedCash.get(order.traderId) ?? 0) + order.reservePrice * order.remaining);
    else reservedAsset.set(order.traderId, (reservedAsset.get(order.traderId) ?? 0) + order.remaining);
  }
  for (const trader of state.traders) {
    if (trader.cash < 0 || trader.asset < 0 || trader.reservedCash < 0 || trader.reservedAsset < 0) violations.push(`${trader.name} 的资产出现负数。`);
    if (trader.reservedCash !== (reservedCash.get(trader.id) ?? 0)) violations.push(`${trader.name} 的冻结现金与订单不一致。`);
    if (trader.reservedAsset !== (reservedAsset.get(trader.id) ?? 0)) violations.push(`${trader.name} 的冻结 LAB 与订单不一致。`);
  }

  const cash = state.traders.reduce((sum, trader) => sum + trader.cash, 0);
  const asset = state.traders.reduce((sum, trader) => sum + trader.asset, 0);
  if (cash !== state.initialCash) violations.push("现金没有守恒。 ");
  if (asset !== state.initialAsset) violations.push("LAB 没有守恒。 ");
  if (state.trades.some((trade) => trade.price < 1 || trade.quantity <= 0)) violations.push("成交记录不合法。 ");
  if (state.lastExecution && state.lastExecution.executedQuantity + state.lastExecution.remainingQuantity !== state.lastExecution.requestedQuantity) violations.push("最近执行摘要与订单数量不一致。 ");
  return { valid: violations.length === 0, violations };
}

export const matchingEngineSpec: SimulationSpec<MatchingEngineState, MatchingEngineAction, MatchingEngineMetrics> = {
  id: "price-time-orderbook-v2",
  createInitialState: createMatchingEngineState,
  reduce: (state, action) => {
    switch (action.type) {
      case "PLACE_LIMIT": return placeLimitOrder(state, action);
      case "PLACE_MARKET": return placeMarketOrder(state, action);
      case "REPLACE_ORDER": return replaceOrder(state, action);
      case "CANCEL_ORDER": return cancelOrder(state, action.orderId);
    }
  },
  deriveMetrics: deriveMatchingEngineMetrics,
  validateInvariants: validateMatchingEngineState,
  serialize: (state) => JSON.stringify(state),
  deserialize: (serialized) => JSON.parse(serialized) as MatchingEngineState,
};
