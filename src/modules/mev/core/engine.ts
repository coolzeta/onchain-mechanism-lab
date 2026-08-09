import type { SimulationSpec } from "@/platform/simulation/types";
import type { MEVAction, MEVLeg, MEVMetrics, MEVOrderKind, MEVScenario, MEVState } from "./types";

export const PRICE_SCALE = 1_000;
export const INITIAL_POOL_CREDITS = 120_000;
export const INITIAL_POOL_TOKEN = 1_000;
export const INITIAL_VICTIM_CREDITS = 30_000;
export const INITIAL_VICTIM_TOKEN = 200;
export const INITIAL_SEARCHER_CREDITS = 20_000;
export const INITIAL_SEARCHER_TOKEN = 200;
export const SEARCHER_FRONT_AMOUNT = 3_000;
export const SEARCHER_BACK_AMOUNT = 20;
export const BUNDLE_TIP = 12;

function cloneState(state: MEVState): MEVState {
  return {
    ...state,
    initialVictim: { ...state.initialVictim },
    initialSearcher: { ...state.initialSearcher },
    initialProposer: { ...state.initialProposer },
    victim: { ...state.victim },
    searcher: { ...state.searcher },
    proposer: { ...state.proposer },
    mempool: [...state.mempool],
    blockOrder: [...state.blockOrder],
    legs: state.legs.map((leg) => ({ ...leg })),
    events: state.events.map((event) => ({ ...event })),
  };
}

function appendEvent(state: MEVState, kind: string, message: string) {
  const index = state.events.length + 1;
  state.events.push({ id: `event-${index}`, index, kind, message });
}

export function spotPriceScaled(state: Pick<MEVState, "poolCredits" | "poolToken">) {
  return Math.floor((state.poolCredits * PRICE_SCALE) / state.poolToken);
}

export function quoteSwap(
  state: Pick<MEVState, "poolCredits" | "poolToken" | "feeBps">,
  direction: "X_TO_Y" | "Y_TO_X",
  amountIn: number,
) {
  if (!Number.isInteger(amountIn) || amountIn <= 0) throw new Error("交易数量必须是正整数。 ");
  const reserveIn = direction === "X_TO_Y" ? state.poolCredits : state.poolToken;
  const reserveOut = direction === "X_TO_Y" ? state.poolToken : state.poolCredits;
  const fee = Math.floor((amountIn * state.feeBps) / 10_000);
  const amountAfterFee = amountIn - fee;
  const amountOut = Math.floor((reserveOut * amountAfterFee) / (reserveIn + amountAfterFee));
  if (amountAfterFee <= 0 || amountOut <= 0 || amountOut >= reserveOut) throw new Error("这笔交易无法得到正数报价。 ");
  const spot = direction === "X_TO_Y"
    ? (state.poolCredits * PRICE_SCALE) / state.poolToken
    : (state.poolToken * PRICE_SCALE) / state.poolCredits;
  const execution = (amountIn * PRICE_SCALE) / amountOut;
  return {
    fee,
    amountOut,
    spotPriceScaled: Math.floor(spot),
    executionPriceScaled: Math.floor(execution),
    priceImpactBps: Math.max(0, Math.round(((execution / spot) - 1) * 10_000)),
  };
}

function participantFor(state: MEVState, kind: MEVOrderKind) {
  return kind === "VICTIM" ? state.victim : state.searcher;
}

function applySwap(state: MEVState, kind: MEVOrderKind, direction: "X_TO_Y" | "Y_TO_X", amountIn: number) {
  const participant = participantFor(state, kind);
  const quote = quoteSwap(state, direction, amountIn);
  if (direction === "X_TO_Y") {
    if (participant.credits < amountIn) throw new Error("交易者的积分余额不足。 ");
    participant.credits -= amountIn;
    participant.token += quote.amountOut;
    state.poolCredits += amountIn;
    state.poolToken -= quote.amountOut;
  } else {
    if (participant.token < amountIn) throw new Error("交易者的 TOKEN 余额不足。 ");
    participant.token -= amountIn;
    participant.credits += quote.amountOut;
    state.poolToken += amountIn;
    state.poolCredits -= quote.amountOut;
  }
  const leg: MEVLeg = {
    id: `leg-${state.nextSequence++}`,
    kind,
    direction,
    amountIn,
    amountOut: quote.amountOut,
    fee: quote.fee,
    reverted: false,
  };
  state.legs.push(leg);
  const actor = kind === "VICTIM" ? "用户" : "搜索者";
  const inputSymbol = direction === "X_TO_Y" ? "积分" : "TOKEN";
  const outputSymbol = direction === "X_TO_Y" ? "TOKEN" : "积分";
  appendEvent(state, kind === "VICTIM" ? "VICTIM_EXECUTED" : "SEARCHER_EXECUTED", `${actor}用 ${amountIn} ${inputSymbol} 换得 ${quote.amountOut} ${outputSymbol}，手续费 ${quote.fee}。`);
  return quote;
}

function executeVictim(state: MEVState) {
  const quote = quoteSwap(state, "X_TO_Y", state.victimAmountIn);
  if (quote.amountOut < state.victimMinOut) {
    state.victimReverted = true;
    state.legs.push({ id: `leg-${state.nextSequence++}`, kind: "VICTIM", direction: "X_TO_Y", amountIn: state.victimAmountIn, amountOut: 0, fee: 0, reverted: true });
    appendEvent(state, "VICTIM_REVERTED", `用户的保护线是至少 ${state.victimMinOut} TOKEN，但当前排序只能得到 ${quote.amountOut}，交易回滚。`);
    return null;
  }
  const applied = applySwap(state, "VICTIM", "X_TO_Y", state.victimAmountIn);
  state.victimAmountOut = applied.amountOut;
  return applied;
}

function baseState(seed: number, scenario: MEVScenario): MEVState {
  const victim = { credits: INITIAL_VICTIM_CREDITS, token: INITIAL_VICTIM_TOKEN };
  const searcher = { credits: INITIAL_SEARCHER_CREDITS, token: INITIAL_SEARCHER_TOKEN };
  const proposer = { credits: 0, token: 0 };
  const state: MEVState = {
    seed,
    scenario,
    phase: "idle",
    feeBps: 30,
    poolCredits: INITIAL_POOL_CREDITS,
    poolToken: INITIAL_POOL_TOKEN,
    initialPoolCredits: INITIAL_POOL_CREDITS,
    initialPoolToken: INITIAL_POOL_TOKEN,
    initialVictim: { ...victim },
    initialSearcher: { ...searcher },
    initialProposer: { ...proposer },
    victim,
    searcher,
    proposer,
    victimAmountIn: 12_000,
    victimMinOut: 84,
    victimQuoteOut: null,
    victimAmountOut: 0,
    victimReverted: false,
    searcherFrontAmount: SEARCHER_FRONT_AMOUNT,
    searcherBackAmount: SEARCHER_BACK_AMOUNT,
    referencePriceScaled: 135_000,
    mempool: [],
    blockOrder: [],
    legs: [],
    events: [],
    nextSequence: 1,
    executedAt: null,
  };
  appendEvent(state, "POOL_CREATED", "公开池创建：120,000 积分 + 1,000 TOKEN，任何公开交易都可能改变下一笔报价。");
  return state;
}

export function createMEVState(seed = 73, scenario: MEVScenario = "public") {
  return baseState(seed, scenario);
}

function resetWithScenario(state: MEVState, scenario: MEVScenario) {
  return baseState(state.seed, scenario);
}

export function setVictimAmount(state: MEVState, amount: number) {
  if (state.phase !== "idle") throw new Error("提交交易后不能修改用户订单，请先重置场景。 ");
  if (!Number.isInteger(amount) || amount < 1 || amount > state.victim.credits) throw new Error("用户交易数量必须是正整数。 ");
  const next = cloneState(state);
  next.victimAmountIn = amount;
  return next;
}

export function setVictimMinOut(state: MEVState, amount: number) {
  if (state.phase !== "idle") throw new Error("提交交易后不能修改保护线，请先重置场景。 ");
  if (!Number.isInteger(amount) || amount < 1 || amount > 999) throw new Error("最小得到数量必须是正整数。 ");
  const next = cloneState(state);
  next.victimMinOut = amount;
  return next;
}

export function submitVictim(state: MEVState) {
  if (state.phase !== "idle") throw new Error("这笔交易已经进入流程，请按当前顺序继续。 ");
  const next = cloneState(state);
  const quote = quoteSwap(next, "X_TO_Y", next.victimAmountIn);
  next.victimQuoteOut = quote.amountOut;
  next.mempool = ["VICTIM"];
  next.phase = "pending";
  appendEvent(next, "VICTIM_SUBMITTED", `用户把 ${next.victimAmountIn} 积分换 TOKEN 的交易提交到${next.scenario === "private" ? "私有" : "公开"}交易池，预估得到 ${quote.amountOut} TOKEN。`);
  return next;
}

export function scanMempool(state: MEVState) {
  if (state.phase !== "pending") throw new Error("请先提交用户交易。 ");
  const next = cloneState(state);
  if (next.scenario === "sandwich") {
    next.mempool = ["SEARCHER_FRONT", "VICTIM", "SEARCHER_BACK"];
    appendEvent(next, "MEMPOOL_SCANNED", "搜索者看见公开交易，插入前置买入和后置卖出两笔交易。 ");
  } else if (next.scenario === "backrun") {
    next.mempool = ["VICTIM", "SEARCHER_BACK"];
    appendEvent(next, "MEMPOOL_SCANNED", "搜索者看见公开交易，准备在用户成交后执行回跑。 ");
  } else if (next.scenario === "private") {
    next.mempool = ["VICTIM"];
    appendEvent(next, "PRIVATE_FLOW", "交易进入私有订单流，公开搜索者看不见这笔用户意图。 ");
  } else {
    next.mempool = ["VICTIM"];
    appendEvent(next, "MEMPOOL_SCANNED", "公开交易池里没有额外策略，用户交易等待进入区块。 ");
  }
  next.phase = "scanned";
  return next;
}

export function buildBlock(state: MEVState) {
  if (state.phase !== "scanned") throw new Error("请先观察交易池，再构建区块排序。 ");
  const next = cloneState(state);
  next.blockOrder = [...next.mempool];
  next.phase = "built";
  appendEvent(next, "BLOCK_BUILT", `区块提议者选择排序：${next.blockOrder.map((order) => order === "VICTIM" ? "用户" : order === "SEARCHER_FRONT" ? "前置" : "后置").join(" → ")}。`);
  return next;
}

export function executeBlock(state: MEVState) {
  if (state.phase !== "built") throw new Error("请先构建区块排序。 ");
  const next = cloneState(state);
  let frontOutput = 0;
  for (const order of next.blockOrder) {
    if (order === "SEARCHER_FRONT") {
      const quote = applySwap(next, order, "X_TO_Y", next.searcherFrontAmount);
      frontOutput = quote.amountOut;
    } else if (order === "VICTIM") {
      executeVictim(next);
    } else if (order === "SEARCHER_BACK") {
      const amount = next.scenario === "sandwich" ? frontOutput : next.searcherBackAmount;
      if (amount <= 0) continue;
      if (next.searcher.token < amount) throw new Error("搜索者没有足够 TOKEN 执行后置交易。 ");
      applySwap(next, order, "Y_TO_X", amount);
    }
  }
  if (next.scenario === "sandwich" || next.scenario === "backrun") {
    if (next.searcher.credits < BUNDLE_TIP) throw new Error("搜索者没有足够积分支付区块排序小费。 ");
    next.searcher.credits -= BUNDLE_TIP;
    next.proposer.credits += BUNDLE_TIP;
    appendEvent(next, "ORDERING_TIP", `搜索者向区块提议者支付 ${BUNDLE_TIP} 积分排序小费。`);
  }
  next.phase = "executed";
  next.executedAt = next.events.length;
  appendEvent(next, "BLOCK_EXECUTED", next.victimReverted ? "区块执行完成：用户交易因保护线回滚。" : "区块执行完成：交易池排序已经成为共享状态。 ");
  return next;
}

export function deriveMEVMetrics(state: MEVState): MEVMetrics {
  const quote = state.victimQuoteOut;
  const actual = state.victimAmountOut;
  const spot = spotPriceScaled(state);
  const initialSpot = Math.floor((state.initialPoolCredits * PRICE_SCALE) / state.initialPoolToken);
  return {
    spotPriceScaled: spot,
    victimQuoteOut: quote,
    victimActualOut: actual,
    victimSlippageBps: quote && actual > 0 ? Math.max(0, Math.round(((quote - actual) / quote) * 10_000)) : null,
    victimProtected: state.phase === "executed" && !state.victimReverted,
    victimReverted: state.victimReverted,
    searcherProfitCredits: state.searcher.credits - state.initialSearcher.credits,
    proposerRevenue: state.proposer.credits - state.initialProposer.credits,
    sandwichExtraction: state.scenario === "sandwich" && actual > 0 && quote ? Math.max(0, quote - actual) : 0,
    visibleToSearcher: state.scenario !== "private" && state.phase !== "idle",
    mempoolCount: state.mempool.length,
    blockCount: state.blockOrder.length,
    totalFees: state.legs.reduce((sum, leg) => sum + leg.fee, 0),
    priceImpactBps: Math.max(0, Math.round(((spot / initialSpot) - 1) * 10_000)),
  };
}

export function validateMEVState(state: MEVState) {
  const violations: string[] = [];
  if (state.poolCredits <= 0 || state.poolToken <= 0) violations.push("池子储备必须保持为正数。 ");
  for (const [label, participant] of [["用户", state.victim], ["搜索者", state.searcher], ["提议者", state.proposer]] as const) {
    if (participant.credits < 0 || participant.token < 0) violations.push(`${label}余额不能为负数。`);
  }
  const credits = state.poolCredits + state.victim.credits + state.searcher.credits + state.proposer.credits;
  const tokens = state.poolToken + state.victim.token + state.searcher.token + state.proposer.token;
  const initialCredits = state.initialPoolCredits + state.initialVictim.credits + state.initialSearcher.credits + state.initialProposer.credits;
  const initialTokens = state.initialPoolToken + state.initialVictim.token + state.initialSearcher.token + state.initialProposer.token;
  if (credits !== initialCredits) violations.push("积分没有守恒。 ");
  if (tokens !== initialTokens) violations.push("TOKEN 没有守恒。 ");
  if (state.phase === "idle" && (state.mempool.length > 0 || state.blockOrder.length > 0 || state.legs.length > 0)) violations.push("空闲场景不应该包含待处理交易。 ");
  if (state.phase === "executed" && state.executedAt === null) violations.push("已执行区块必须记录执行位置。 ");
  if (state.scenario === "private" && state.mempool.some((order) => order !== "VICTIM")) violations.push("私有订单流不应暴露搜索者交易。 ");
  if (state.victimReverted && state.victimAmountOut !== 0) violations.push("回滚的用户交易不能留下输出。 ");
  if (state.legs.filter((leg) => leg.kind === "VICTIM" && !leg.reverted).length > 1) violations.push("用户交易只能执行一次。 ");
  if (state.blockOrder.filter((order) => order === "VICTIM").length > 1) violations.push("一个区块不能重复包含用户交易。 ");
  return { valid: violations.length === 0, violations };
}

export const mevSpec: SimulationSpec<MEVState, MEVAction, MEVMetrics> = {
  id: "mempool-ordering-mev-v1",
  createInitialState: createMEVState,
  reduce: (state, action) => {
    switch (action.type) {
      case "SET_SCENARIO": return resetWithScenario(state, action.scenario);
      case "SET_VICTIM_AMOUNT": return setVictimAmount(state, action.amount);
      case "SET_VICTIM_MIN_OUT": return setVictimMinOut(state, action.amount);
      case "SUBMIT_VICTIM": return submitVictim(state);
      case "SCAN_MEMPOOL": return scanMempool(state);
      case "BUILD_BLOCK": return buildBlock(state);
      case "EXECUTE_BLOCK": return executeBlock(state);
    }
  },
  deriveMetrics: deriveMEVMetrics,
  validateInvariants: validateMEVState,
  serialize: (state) => JSON.stringify(state),
  deserialize: (serialized) => JSON.parse(serialized) as MEVState,
};
