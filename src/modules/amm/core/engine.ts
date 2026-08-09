import type { SimulationSpec } from "@/platform/simulation/types";
import type { AMMAction, AMMMetrics, AMMState, AMMTrade, SwapDirection } from "./types";

export const PRICE_SCALE = 1_000;
const INITIAL_RESERVE_X = 120_000;
const INITIAL_RESERVE_Y = 1_000;
const INITIAL_TRADER_X = 30_000;
const INITIAL_TRADER_Y = 200;
const INITIAL_LP_SHARES = 100_000;

function cloneState(state: AMMState): AMMState {
  return {
    ...state,
    pair: { ...state.pair },
    trader: { ...state.trader },
    arbitrageur: { ...state.arbitrageur },
    trades: state.trades.map((trade) => ({ ...trade })),
    events: state.events.map((event) => ({ ...event })),
  };
}

function appendEvent(state: AMMState, kind: string, message: string) {
  const index = state.events.length + 1;
  state.events.push({ id: `event-${index}`, index, kind, message });
}

function directionSymbols(direction: SwapDirection) {
  return direction === "X_TO_Y" ? { input: "积分", output: "TOKEN" } : { input: "TOKEN", output: "积分" };
}

export function spotPriceXPerYScaled(state: Pick<AMMState, "reserveX" | "reserveY">) {
  return Math.floor((state.reserveX * PRICE_SCALE) / state.reserveY);
}

export function quoteSwap(
  state: Pick<AMMState, "reserveX" | "reserveY" | "feeBps">,
  direction: SwapDirection,
  amountIn: number,
) {
  if (!Number.isInteger(amountIn) || amountIn <= 0) throw new Error("交换数量必须是正整数。");
  const reserveIn = direction === "X_TO_Y" ? state.reserveX : state.reserveY;
  const reserveOut = direction === "X_TO_Y" ? state.reserveY : state.reserveX;
  const fee = Math.floor((amountIn * state.feeBps) / 10_000);
  const amountAfterFee = amountIn - fee;
  if (amountAfterFee <= 0) throw new Error("数量太小，扣除手续费后没有可交换的数量。");
  const amountOut = Math.floor((reserveOut * amountAfterFee) / (reserveIn + amountAfterFee));
  if (amountOut <= 0 || amountOut >= reserveOut) throw new Error("这笔交易无法得到正数报价，请减少数量。");

  const spotPrice = direction === "X_TO_Y"
    ? (state.reserveX * PRICE_SCALE) / state.reserveY
    : (state.reserveY * PRICE_SCALE) / state.reserveX;
  const executionPrice = (amountIn * PRICE_SCALE) / amountOut;
  const priceImpactBps = Math.max(0, Math.round(((executionPrice / spotPrice) - 1) * 10_000));
  return { fee, amountOut, priceImpactBps, spotPriceScaled: Math.floor(spotPrice), executionPriceScaled: Math.floor(executionPrice) };
}

function applyPoolTrade(state: AMMState, direction: SwapDirection, amountIn: number, actor: "trader" | "arbitrageur") {
  const next = cloneState(state);
  const quote = quoteSwap(next, direction, amountIn);
  const symbols = directionSymbols(direction);
  const balanceKey = direction === "X_TO_Y" ? "xBalance" : "yBalance";
  const outputKey = direction === "X_TO_Y" ? "yBalance" : "xBalance";
  const participant = actor === "trader" ? next.trader : next.arbitrageur;
  if (participant[balanceKey] < amountIn) throw new Error(`${actor === "trader" ? "你的" : "套利者的"} ${symbols.input} 余额不足。`);

  participant[balanceKey] -= amountIn;
  participant[outputKey] += quote.amountOut;
  if (direction === "X_TO_Y") {
    next.reserveX += amountIn;
    next.reserveY -= quote.amountOut;
    next.totalFeesX += quote.fee;
  } else {
    next.reserveY += amountIn;
    next.reserveX -= quote.amountOut;
    next.totalFeesY += quote.fee;
  }

  const sequence = next.nextSequence++;
  const trade: AMMTrade = {
    id: `trade-${sequence}`,
    direction,
    amountIn,
    fee: quote.fee,
    amountOut: quote.amountOut,
    executionPriceScaled: quote.executionPriceScaled,
    spotPriceBeforeScaled: quote.spotPriceScaled,
    priceImpactBps: quote.priceImpactBps,
    sequence,
  };
  next.trades.push(trade);
  const actorLabel = actor === "trader" ? "你" : "套利者";
  appendEvent(next, "SWAP", `${actorLabel}用 ${amountIn} ${symbols.input} 换得 ${quote.amountOut} ${symbols.output}，手续费 ${quote.fee}。`);
  if (quote.priceImpactBps > 100) appendEvent(next, "SLIPPAGE", `这笔交易的价格冲击约为 ${(quote.priceImpactBps / 100).toFixed(2)}%。`);
  return next;
}

export function swap(state: AMMState, direction: SwapDirection, amountIn: number) {
  return applyPoolTrade(state, direction, amountIn, "trader");
}

export function addLiquidity(state: AMMState, amountX: number, amountY: number) {
  if (!Number.isInteger(amountX) || !Number.isInteger(amountY) || amountX <= 0 || amountY <= 0) {
    throw new Error("存入的两种资产都必须是正整数。");
  }
  const next = cloneState(state);
  if (next.trader.xBalance < amountX || next.trader.yBalance < amountY) throw new Error("你的资产余额不足，无法成为 LP。");
  const shares = Math.min(
    Math.floor((amountX * next.lpSharesTotal) / next.reserveX),
    Math.floor((amountY * next.lpSharesTotal) / next.reserveY),
  );
  if (shares <= 0) throw new Error("存入数量太小，无法铸造 LP 份额。");

  next.trader.xBalance -= amountX;
  next.trader.yBalance -= amountY;
  next.reserveX += amountX;
  next.reserveY += amountY;
  next.lpSharesTotal += shares;
  next.trader.lpShares += shares;
  next.lpDepositedX += amountX;
  next.lpDepositedY += amountY;
  appendEvent(next, "LIQUIDITY_ADDED", `你存入 ${amountX} 积分和 ${amountY} TOKEN，获得 ${shares} LP 份额。`);
  return next;
}

export function removeLiquidity(state: AMMState, shares: number) {
  if (!Number.isInteger(shares) || shares <= 0) throw new Error("移除的 LP 份额必须是正整数。");
  const next = cloneState(state);
  if (shares > next.trader.lpShares) throw new Error("你没有这么多 LP 份额。");
  if (shares >= next.lpSharesTotal) throw new Error("池中需要保留至少一份 LP 份额。");
  const depositedShares = next.trader.lpShares;
  const releasedDepositX = Math.floor((next.lpDepositedX * shares) / depositedShares);
  const releasedDepositY = Math.floor((next.lpDepositedY * shares) / depositedShares);
  const amountX = Math.floor((next.reserveX * shares) / next.lpSharesTotal);
  const amountY = Math.floor((next.reserveY * shares) / next.lpSharesTotal);
  next.trader.lpShares -= shares;
  next.trader.xBalance += amountX;
  next.trader.yBalance += amountY;
  next.reserveX -= amountX;
  next.reserveY -= amountY;
  next.lpSharesTotal -= shares;
  next.lpDepositedX -= releasedDepositX;
  next.lpDepositedY -= releasedDepositY;
  appendEvent(next, "LIQUIDITY_REMOVED", `你移除 ${shares} LP 份额，取回 ${amountX} 积分和 ${amountY} TOKEN。`);
  return next;
}

function spotAfterSwap(state: AMMState, direction: SwapDirection, amountIn: number) {
  const quote = quoteSwap(state, direction, amountIn);
  const reserveX = direction === "X_TO_Y" ? state.reserveX + amountIn : state.reserveX - quote.amountOut;
  const reserveY = direction === "X_TO_Y" ? state.reserveY - quote.amountOut : state.reserveY + amountIn;
  return Math.floor((reserveX * PRICE_SCALE) / reserveY);
}

export function arbitrageToPrice(state: AMMState, targetPriceScaled: number) {
  if (!Number.isInteger(targetPriceScaled) || targetPriceScaled <= 0) throw new Error("外部价格必须是正整数。请先选择一个有效价格。");
  const next = cloneState(state);
  next.externalPriceScaled = targetPriceScaled;
  const currentPrice = spotPriceXPerYScaled(state);
  if (Math.abs(currentPrice - targetPriceScaled) <= 1) {
    appendEvent(next, "ARBITRAGE_IDLE", `池内价格已经接近外部价格 ${(targetPriceScaled / PRICE_SCALE).toFixed(2)}。`);
    return next;
  }

  // If TOKEN is cheaper in the pool than outside, the arbitrageur buys TOKEN with X.
  const direction: SwapDirection = currentPrice < targetPriceScaled ? "X_TO_Y" : "Y_TO_X";
  const balance = direction === "X_TO_Y" ? state.arbitrageur.xBalance : state.arbitrageur.yBalance;
  const reserve = direction === "X_TO_Y" ? state.reserveX : state.reserveY;
  let low = 1;
  let high = Math.max(1, Math.min(balance, reserve * 4));
  const candidates = [0, high];

  for (let index = 0; index < 44 && low <= high; index += 1) {
    const middle = Math.floor((low + high) / 2);
    try {
      const price = spotAfterSwap(state, direction, middle);
      candidates.push(middle);
      if (direction === "X_TO_Y") {
        if (price > targetPriceScaled) high = middle - 1;
        else low = middle + 1;
      } else if (price < targetPriceScaled) {
        high = middle - 1;
      } else {
        low = middle + 1;
      }
    } catch {
      high = middle - 1;
    }
  }

  const bestAmount = candidates.reduce((best, amount) => {
    if (amount <= 0 || amount > balance) return best;
    try {
      const bestDistance = best > 0 ? Math.abs(spotAfterSwap(state, direction, best) - targetPriceScaled) : Number.POSITIVE_INFINITY;
      const distance = Math.abs(spotAfterSwap(state, direction, amount) - targetPriceScaled);
      return distance < bestDistance ? amount : best;
    } catch {
      return best;
    }
  }, 0);
  if (bestAmount <= 0) throw new Error("套利者余额不足，无法把池内价格拉回外部价格。");
  const traded = applyPoolTrade(next, direction, bestAmount, "arbitrageur");
  appendEvent(traded, "ARBITRAGE", `套利者把池内价格从 ${(currentPrice / PRICE_SCALE).toFixed(2)} 拉向 ${(targetPriceScaled / PRICE_SCALE).toFixed(2)}。`);
  return traded;
}

function baseState(seed: number): AMMState {
  const state: AMMState = {
    seed,
    pair: { xSymbol: "积分", ySymbol: "TOKEN" },
    reserveX: INITIAL_RESERVE_X,
    reserveY: INITIAL_RESERVE_Y,
    initialReserveX: INITIAL_RESERVE_X,
    initialReserveY: INITIAL_RESERVE_Y,
    initialTraderX: INITIAL_TRADER_X,
    initialTraderY: INITIAL_TRADER_Y,
    initialArbitrageurX: 100_000,
    initialArbitrageurY: 1_000,
    feeBps: 30,
    lpSharesTotal: INITIAL_LP_SHARES,
    trader: { id: "you", xBalance: INITIAL_TRADER_X, yBalance: INITIAL_TRADER_Y, lpShares: 0 },
    arbitrageur: { xBalance: 100_000, yBalance: 1_000 },
    lpDepositedX: 0,
    lpDepositedY: 0,
    externalPriceScaled: 120_000,
    trades: [],
    events: [],
    totalFeesX: 0,
    totalFeesY: 0,
    nextSequence: 1,
  };
  appendEvent(state, "POOL_CREATED", "资金池创建：120,000 积分 + 1,000 TOKEN，初始价格为 120 积分 / TOKEN。");
  return state;
}

export function createAMMState(seed = 11) {
  return baseState(seed);
}

export function deriveAMMMetrics(state: AMMState): AMMMetrics {
  const invariant = state.reserveX * state.reserveY;
  const initialInvariant = state.initialReserveX * state.initialReserveY;
  const spotPrice = spotPriceXPerYScaled(state);
  const lpRatioNumerator = state.trader.lpShares;
  const lpPositionX = Math.floor((state.reserveX * lpRatioNumerator) / state.lpSharesTotal);
  const lpPositionY = Math.floor((state.reserveY * lpRatioNumerator) / state.lpSharesTotal);
  const lpPositionValueX = lpPositionX + Math.floor((lpPositionY * spotPrice) / PRICE_SCALE);
  const lpHoldValueX = state.lpDepositedX + Math.floor((state.lpDepositedY * spotPrice) / PRICE_SCALE);
  return {
    spotPriceXPerYScaled: spotPrice,
    spotPriceYPerXScaled: Math.floor((state.reserveY * PRICE_SCALE) / state.reserveX),
    invariant,
    invariantGrowthBps: Math.max(0, Math.floor(((invariant - initialInvariant) * 10_000) / initialInvariant)),
    totalFeesX: state.totalFeesX,
    totalFeesY: state.totalFeesY,
    externalPriceScaled: state.externalPriceScaled,
    priceGapBps: Math.round(((spotPrice / state.externalPriceScaled) - 1) * 10_000),
    lpPositionX,
    lpPositionY,
    lpPositionValueX,
    lpHoldValueX,
    lpValueDeltaBps: lpHoldValueX > 0 ? Math.floor(((lpPositionValueX - lpHoldValueX) * 10_000) / lpHoldValueX) : 0,
    lastTrade: state.trades.at(-1) ?? null,
  };
}

export function validateAMMState(state: AMMState) {
  const violations: string[] = [];
  if (state.reserveX <= 0 || state.reserveY <= 0) violations.push("资金池储备必须保持为正数。");
  if (state.lpSharesTotal <= 0 || state.trader.lpShares < 0 || state.trader.lpShares > state.lpSharesTotal) violations.push("LP 份额数量不合法。");
  if (state.trader.xBalance < 0 || state.trader.yBalance < 0) violations.push("交易者余额出现负数。");
  if (state.arbitrageur.xBalance < 0 || state.arbitrageur.yBalance < 0) violations.push("套利者余额出现负数。");
  if (state.reserveX + state.trader.xBalance + state.arbitrageur.xBalance !== state.initialReserveX + state.initialTraderX + state.initialArbitrageurX) violations.push("积分没有守恒。");
  if (state.reserveY + state.trader.yBalance + state.arbitrageur.yBalance !== state.initialReserveY + state.initialTraderY + state.initialArbitrageurY) violations.push("TOKEN 没有守恒。");
  if (state.lpDepositedX < 0 || state.lpDepositedY < 0 || state.lpDepositedX > state.initialTraderX || state.lpDepositedY > state.initialTraderY) violations.push("LP 存入记录不合法。");
  if (state.externalPriceScaled <= 0) violations.push("外部价格必须保持为正数。");
  if (state.totalFeesX < 0 || state.totalFeesY < 0) violations.push("手续费不能为负数。");
  return { valid: violations.length === 0, violations };
}

export const ammSpec: SimulationSpec<AMMState, AMMAction, AMMMetrics> = {
  id: "constant-product-amm-v2",
  createInitialState: createAMMState,
  reduce: (state, action) => {
    switch (action.type) {
      case "SWAP": return swap(state, action.direction, action.amountIn);
      case "ADD_LIQUIDITY": return addLiquidity(state, action.amountX, action.amountY);
      case "REMOVE_LIQUIDITY": return removeLiquidity(state, action.shares);
      case "ARBITRAGE_TO_PRICE": return arbitrageToPrice(state, action.targetPriceScaled);
    }
  },
  deriveMetrics: deriveAMMMetrics,
  validateInvariants: validateAMMState,
  serialize: (state) => JSON.stringify(state),
  deserialize: (serialized) => JSON.parse(serialized) as AMMState,
};
