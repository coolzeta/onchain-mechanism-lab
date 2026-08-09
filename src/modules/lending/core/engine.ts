import type { SimulationSpec } from "@/platform/simulation/types";
import type { LendingAction, LendingMetrics, LendingPhase, LendingScenario, LendingState } from "./types";

const INITIAL_COLLATERAL = 100;
const INITIAL_USER_CASH = 5_000;
const INITIAL_PROTOCOL_LIQUIDITY = 100_000;
const INITIAL_LIQUIDATOR_CASH = 50_000;
const INITIAL_PRICE = 120;

function cloneState(state: LendingState): LendingState {
  return { ...state, events: state.events.map((event) => ({ ...event })) };
}

function appendEvent(state: LendingState, kind: string, message: string) {
  const index = state.events.length + 1;
  state.events.push({ id: `event-${index}`, index, kind, message });
}

function positiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${label}必须是正整数。`);
}

function positivePrice(value: number) {
  if (!Number.isInteger(value) || value <= 0) throw new Error("价格必须是正整数。 ");
}

export function collateralValue(state: Pick<LendingState, "collateralDeposited" | "oraclePrice">) {
  return state.collateralDeposited * state.oraclePrice;
}

export function borrowCapacity(state: Pick<LendingState, "collateralDeposited" | "oraclePrice" | "maxLtvBps">) {
  return Math.floor((collateralValue(state) * state.maxLtvBps) / 10_000);
}

export function healthFactorBps(state: Pick<LendingState, "collateralDeposited" | "oraclePrice" | "debt" | "liquidationThresholdBps">) {
  if (state.debt <= 0) return null;
  return Math.floor((collateralValue(state) * state.liquidationThresholdBps) / state.debt);
}

export function liquidationPrice(state: Pick<LendingState, "collateralDeposited" | "debt" | "liquidationThresholdBps">) {
  if (state.debt <= 0 || state.collateralDeposited <= 0) return null;
  return Math.ceil((state.debt * 10_000) / (state.collateralDeposited * state.liquidationThresholdBps));
}

export function lendingPhase(state: Pick<LendingState, "collateralDeposited" | "debt" | "oraclePrice" | "liquidationThresholdBps">): LendingPhase {
  if (state.debt <= 0) return "NO_DEBT";
  if (state.collateralDeposited <= 0) return "BAD_DEBT";
  const health = healthFactorBps(state);
  if (health !== null && health < 10_000) return "LIQUIDATABLE";
  if (health !== null && health < 12_000) return "AT_RISK";
  return "HEALTHY";
}

function phaseLabel(phase: LendingPhase) {
  return {
    NO_DEBT: "没有债务",
    HEALTHY: "健康",
    AT_RISK: "接近边界",
    LIQUIDATABLE: "可被清算",
    BAD_DEBT: "出现坏账",
  }[phase];
}

function baseState(seed: number, scenario: LendingScenario): LendingState {
  const marketPrice = scenario === "price-shock" || scenario === "stale-oracle" ? 72 : INITIAL_PRICE;
  const oraclePrice = scenario === "stale-oracle" ? INITIAL_PRICE : marketPrice;
  const state: LendingState = {
    seed,
    scenario,
    collateralSymbol: "TOKEN",
    debtSymbol: "积分",
    walletCollateral: INITIAL_COLLATERAL,
    collateralDeposited: 0,
    liquidatorCollateral: 0,
    marketPrice,
    oraclePrice,
    debt: 0,
    userCash: INITIAL_USER_CASH,
    protocolLiquidity: INITIAL_PROTOCOL_LIQUIDITY,
    liquidatorCash: INITIAL_LIQUIDATOR_CASH,
    initialCollateral: INITIAL_COLLATERAL,
    initialCashTotal: INITIAL_USER_CASH + INITIAL_PROTOCOL_LIQUIDITY + INITIAL_LIQUIDATOR_CASH,
    maxLtvBps: 7_500,
    liquidationThresholdBps: 8_000,
    liquidationBonusBps: 500,
    interestRateBps: 100,
    totalInterestAccrued: 0,
    events: [],
    nextSequence: 1,
  };
  appendEvent(state, "MARKET_CREATED", `抵押池创建：${INITIAL_COLLATERAL} TOKEN，初始价格 ${INITIAL_PRICE} 积分。`);
  if (scenario === "price-shock") appendEvent(state, "PRICE_SCENARIO", "实验预设：TOKEN 价格已经下跌到 72，观察抵押品如何接近清算边界。");
  if (scenario === "stale-oracle") appendEvent(state, "STALE_ORACLE", "实验预设：市场价格跌到 72，但协议仍读取旧的 120 价格。 ");
  return state;
}

export function createLendingState(seed = 91, scenario: LendingScenario = "healthy") {
  return baseState(seed, scenario);
}

export function depositCollateral(state: LendingState, amount: number) {
  positiveInteger(amount, "存入数量");
  if (amount > state.walletCollateral) throw new Error("钱包里的 TOKEN 不足。 ");
  const next = cloneState(state);
  next.walletCollateral -= amount;
  next.collateralDeposited += amount;
  appendEvent(next, "COLLATERAL_DEPOSITED", `你存入 ${amount} TOKEN，抵押品价值按预言机价格重新计算。`);
  return next;
}

export function withdrawCollateral(state: LendingState, amount: number) {
  positiveInteger(amount, "取出数量");
  if (amount > state.collateralDeposited) throw new Error("抵押池里没有这么多 TOKEN。 ");
  const next = cloneState(state);
  next.collateralDeposited -= amount;
  if (next.debt > 0 && (healthFactorBps(next) ?? 0) < 10_000) throw new Error("取出后健康度会跌破清算线，不能释放这部分抵押品。 ");
  next.walletCollateral += amount;
  appendEvent(next, "COLLATERAL_WITHDRAWN", `你取出 ${amount} TOKEN；系统先检查取出后的健康度。`);
  return next;
}

export function borrow(state: LendingState, amount: number) {
  positiveInteger(amount, "借款数量");
  if (state.collateralDeposited <= 0) throw new Error("先存入抵押品，协议才有借款额度。 ");
  if (state.protocolLiquidity < amount) throw new Error("协议流动性不足。 ");
  const available = Math.max(0, borrowCapacity(state) - state.debt);
  if (amount > available) throw new Error(`这笔借款超过额度，还可以借 ${available} 积分。`);
  const next = cloneState(state);
  next.protocolLiquidity -= amount;
  next.userCash += amount;
  next.debt += amount;
  appendEvent(next, "BORROWED", `你借出 ${amount} 积分；债务 ${next.debt}，健康度 ${(healthFactorBps(next)! / 100).toFixed(2)}。`);
  return next;
}

export function repay(state: LendingState, amount: number) {
  positiveInteger(amount, "还款数量");
  if (amount > state.debt) throw new Error("还款不能超过当前债务。 ");
  if (amount > state.userCash) throw new Error("你的可用积分不足以完成还款。 ");
  const next = cloneState(state);
  next.userCash -= amount;
  next.protocolLiquidity += amount;
  next.debt -= amount;
  appendEvent(next, "REPAID", `你偿还 ${amount} 积分；剩余债务 ${next.debt}。`);
  return next;
}

export function accrueInterest(state: LendingState) {
  if (state.debt <= 0) throw new Error("当前没有债务，不需要计息。 ");
  const interest = Math.max(1, Math.floor((state.debt * state.interestRateBps) / 10_000));
  const next = cloneState(state);
  next.debt += interest;
  next.totalInterestAccrued += interest;
  appendEvent(next, "INTEREST_ACCRUED", `一个计息周期过去，债务增加 ${interest} 积分；健康度也随之下降。`);
  return next;
}

export function setMarketPrice(state: LendingState, price: number) {
  positivePrice(price);
  const next = cloneState(state);
  next.marketPrice = price;
  appendEvent(next, "MARKET_PRICE_MOVED", `外部市场价格变为 ${price} 积分；协议暂时仍读取 ${next.oraclePrice}。`);
  return next;
}

export function updateOracle(state: LendingState, price: number) {
  positivePrice(price);
  const next = cloneState(state);
  next.oraclePrice = price;
  appendEvent(next, "ORACLE_UPDATED", `预言机更新为 ${price} 积分；借款额度和清算边界重新计算。`);
  return next;
}

export function liquidate(state: LendingState) {
  if (state.debt <= 0) throw new Error("没有债务可以清算。 ");
  if ((healthFactorBps(state) ?? 10_000) >= 10_000) throw new Error("健康度还没有跌破 1.00，清算人不能接管抵押品。 ");
  const maximumRepay = Math.floor((state.collateralDeposited * state.oraclePrice * 10_000) / (10_000 + state.liquidationBonusBps));
  const repayAmount = Math.min(state.debt, maximumRepay);
  if (repayAmount <= 0) throw new Error("抵押品价值不足以偿还任何债务，协议需要处理坏账。 ");
  if (state.liquidatorCash < repayAmount) throw new Error("清算人的可用积分不足。 ");
  const seized = Math.min(state.collateralDeposited, Math.ceil((repayAmount * (10_000 + state.liquidationBonusBps)) / state.oraclePrice));
  const next = cloneState(state);
  next.liquidatorCash -= repayAmount;
  next.protocolLiquidity += repayAmount;
  next.liquidatorCollateral += seized;
  next.collateralDeposited -= seized;
  next.debt -= repayAmount;
  appendEvent(next, "LIQUIDATED", `清算人偿还 ${repayAmount} 积分，接收 ${seized} TOKEN（含 ${state.liquidationBonusBps / 100}% 奖励）。`);
  if (next.debt > 0) appendEvent(next, "BAD_DEBT", `抵押品已经耗尽，仍有 ${next.debt} 积分债务成为坏账。`);
  return next;
}

export function deriveLendingMetrics(state: LendingState): LendingMetrics {
  const value = collateralValue(state);
  const capacity = borrowCapacity(state);
  const health = healthFactorBps(state);
  const phase = lendingPhase(state);
  return {
    collateralValue: value,
    borrowCapacity: capacity,
    availableToBorrow: Math.min(Math.max(0, capacity - state.debt), state.protocolLiquidity),
    loanToValueBps: value > 0 ? Math.floor((state.debt * 10_000) / value) : 0,
    healthFactorBps: health,
    liquidationPrice: liquidationPrice(state),
    priceGapBps: state.oraclePrice > 0 ? Math.round(((state.marketPrice - state.oraclePrice) * 10_000) / state.oraclePrice) : 0,
    badDebt: state.collateralDeposited === 0 ? state.debt : 0,
    phase,
    phaseLabel: phaseLabel(phase),
    canLiquidate: phase === "LIQUIDATABLE",
    interestRateBps: state.interestRateBps,
  };
}

export function validateLendingState(state: LendingState) {
  const violations: string[] = [];
  const cashTotal = state.userCash + state.protocolLiquidity + state.liquidatorCash;
  const collateralTotal = state.walletCollateral + state.collateralDeposited + state.liquidatorCollateral;
  if (cashTotal !== state.initialCashTotal) violations.push("积分没有守恒。 ");
  if (collateralTotal !== state.initialCollateral) violations.push("抵押品没有守恒。 ");
  if (state.walletCollateral < 0 || state.collateralDeposited < 0 || state.liquidatorCollateral < 0) violations.push("TOKEN 余额不能为负数。 ");
  if (state.userCash < 0 || state.protocolLiquidity < 0 || state.liquidatorCash < 0) violations.push("积分余额不能为负数。 ");
  if (state.debt < 0 || state.totalInterestAccrued < 0) violations.push("债务和累计利息不能为负数。 ");
  if (state.marketPrice <= 0 || state.oraclePrice <= 0) violations.push("市场价格和预言机价格必须为正数。 ");
  if (state.maxLtvBps <= 0 || state.maxLtvBps >= state.liquidationThresholdBps || state.liquidationThresholdBps > 10_000) violations.push("借款率和清算阈值关系不合法。 ");
  return { valid: violations.length === 0, violations };
}

export const lendingSpec: SimulationSpec<LendingState, LendingAction, LendingMetrics> = {
  id: "collateral-lending-v1",
  createInitialState: createLendingState,
  reduce: (state, action) => {
    switch (action.type) {
      case "DEPOSIT_COLLATERAL": return depositCollateral(state, action.amount);
      case "WITHDRAW_COLLATERAL": return withdrawCollateral(state, action.amount);
      case "BORROW": return borrow(state, action.amount);
      case "REPAY": return repay(state, action.amount);
      case "ACCRUE_INTEREST": return accrueInterest(state);
      case "SET_MARKET_PRICE": return setMarketPrice(state, action.price);
      case "UPDATE_ORACLE": return updateOracle(state, action.price);
      case "LIQUIDATE": return liquidate(state);
    }
  },
  deriveMetrics: deriveLendingMetrics,
  validateInvariants: validateLendingState,
  serialize: (state) => JSON.stringify(state),
  deserialize: (serialized) => JSON.parse(serialized) as LendingState,
};
