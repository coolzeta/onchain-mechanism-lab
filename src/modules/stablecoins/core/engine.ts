import type { SimulationSpec } from "@/platform/simulation/types";
import type { StablecoinAction, StablecoinMetrics, StablecoinPhase, StablecoinScenario, StablecoinState } from "./types";

const INITIAL_COLLATERAL = 1_000;
const TARGET_PRICE_CENTS = 100;
const INITIAL_MARKET_PRICE_CENTS = 100;

function cloneState(state: StablecoinState): StablecoinState {
  return { ...state, events: state.events.map((event) => ({ ...event })) };
}

function appendEvent(state: StablecoinState, kind: string, message: string) {
  const index = state.events.length + 1;
  state.events.push({ id: `event-${index}`, index, kind, message });
}

function positiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${label}必须是正整数。`);
}

function positivePrice(value: number) {
  if (!Number.isInteger(value) || value <= 0) throw new Error("价格必须是正整数美分。");
}

export function collateralValueCents(state: Pick<StablecoinState, "reserveCollateral" | "oraclePriceCents">) {
  return state.reserveCollateral * state.oraclePriceCents;
}

export function liabilityValueCents(state: Pick<StablecoinState, "supply" | "targetPriceCents">) {
  return state.supply * state.targetPriceCents;
}

export function maxMint(state: Pick<StablecoinState, "reserveCollateral" | "oraclePriceCents" | "minCollateralRatioBps" | "targetPriceCents">) {
  const value = collateralValueCents(state);
  return Math.floor((value * 10_000) / (state.minCollateralRatioBps * state.targetPriceCents));
}

export function collateralRatioBps(state: Pick<StablecoinState, "reserveCollateral" | "oraclePriceCents" | "supply" | "targetPriceCents">) {
  const liabilities = liabilityValueCents(state);
  return liabilities <= 0 ? null : Math.floor((collateralValueCents(state) * 10_000) / liabilities);
}

export function redeemableCollateral(state: Pick<StablecoinState, "supply" | "userStable" | "reserveCollateral" | "oraclePriceCents" | "targetPriceCents" | "redemptionFeeBps">, amount: number) {
  if (amount <= 0) return 0;
  const gross = Math.floor((amount * state.targetPriceCents * 10_000) / (state.oraclePriceCents * 10_000));
  const afterFee = Math.floor((gross * (10_000 - state.redemptionFeeBps)) / 10_000);
  return Math.min(state.reserveCollateral, afterFee);
}

export function stablecoinPhase(state: Pick<StablecoinState, "reserveCollateral" | "supply" | "oraclePriceCents" | "marketPriceCents" | "targetPriceCents" | "liquidationRatioBps">): StablecoinPhase {
  if (state.supply <= 0) return "EMPTY";
  const gap = Math.abs(state.marketPriceCents - state.targetPriceCents);
  const ratio = collateralRatioBps(state);
  if (ratio !== null && ratio < state.liquidationRatioBps) return "UNDERCOLLATERALIZED";
  if (gap >= 3 && state.marketPriceCents !== state.oraclePriceCents) return "ORACLE_STALE";
  if (gap >= 1) return "DEPEGGED";
  if (ratio !== null && ratio < 12_000) return "AT_RISK";
  return "HEALTHY";
}

function phaseLabel(phase: StablecoinPhase) {
  return {
    EMPTY: "尚未发行",
    HEALTHY: "锚定稳定",
    AT_RISK: "抵押缓冲变薄",
    UNDERCOLLATERALIZED: "抵押不足",
    DEPEGGED: "市场脱锚",
    ORACLE_STALE: "预言机滞后",
  }[phase];
}

function baseState(seed: number, scenario: StablecoinScenario): StablecoinState {
  const marketPriceCents = scenario === "depeg" ? 94 : scenario === "stale-oracle" ? 82 : INITIAL_MARKET_PRICE_CENTS;
  const oraclePriceCents = scenario === "stale-oracle" ? INITIAL_MARKET_PRICE_CENTS : INITIAL_MARKET_PRICE_CENTS;
  const state: StablecoinState = {
    seed,
    scenario,
    collateralSymbol: "COLLATERAL",
    stableSymbol: "USD-LAB",
    walletCollateral: INITIAL_COLLATERAL,
    reserveCollateral: 0,
    lostCollateral: 0,
    userStable: 0,
    supply: 0,
    marketPriceCents,
    oraclePriceCents,
    targetPriceCents: TARGET_PRICE_CENTS,
    initialCollateral: INITIAL_COLLATERAL,
    minCollateralRatioBps: 15_000,
    liquidationRatioBps: 11_000,
    redemptionFeeBps: 30,
    totalRedemptions: 0,
    totalFeesCollateral: 0,
    events: [],
    nextSequence: 1,
  };
  appendEvent(state, "STABLECOIN_CREATED", "USD-LAB 创建：目标价格 1.00 美元，发行必须由抵押品支持。");
  if (scenario !== "healthy") {
    state.walletCollateral -= 100;
    state.reserveCollateral = 100;
    state.userStable = 60;
    state.supply = 60;
    appendEvent(state, "PRESET_POSITION", "实验预设：100 COLLATERAL 支持 60 USD-LAB，先从一笔已有发行开始观察边界。");
  }
  if (scenario === "depeg") appendEvent(state, "DEPEG_SCENARIO", "实验预设：市场上的 USD-LAB 交易价格跌到 0.94 美元，但协议仍允许按规则赎回。");
  if (scenario === "stale-oracle") appendEvent(state, "STALE_ORACLE", "实验预设：抵押品外部价格已经变化，但协议仍读取旧的预言机价格。");
  if (scenario === "reserve-run") appendEvent(state, "RESERVE_RUN_SCENARIO", "实验预设：先观察足额抵押，再连续赎回，追踪储备和供应如何一起收缩。");
  return state;
}

export function createStablecoinState(seed = 303, scenario: StablecoinScenario = "healthy") {
  return baseState(seed, scenario);
}

export function depositCollateral(state: StablecoinState, amount: number) {
  positiveInteger(amount, "存入数量");
  if (amount > state.walletCollateral) throw new Error("钱包里的抵押品不足。");
  const next = cloneState(state);
  next.walletCollateral -= amount;
  next.reserveCollateral += amount;
  appendEvent(next, "COLLATERAL_DEPOSITED", `你存入 ${amount} ${state.collateralSymbol}，储备可以支持更多 USD-LAB。`);
  return next;
}

export function mintStable(state: StablecoinState, amount: number) {
  positiveInteger(amount, "发行数量");
  const available = Math.max(0, maxMint(state) - state.supply);
  if (amount > available) throw new Error(`这笔发行超过抵押率上限，还可以发行 ${available} USD-LAB。`);
  const next = cloneState(state);
  next.supply += amount;
  next.userStable += amount;
  appendEvent(next, "STABLECOIN_MINTED", `协议发行 ${amount} USD-LAB；抵押率为 ${((collateralRatioBps(next) ?? 0) / 100).toFixed(2)}%。`);
  return next;
}

export function redeemStable(state: StablecoinState, amount: number) {
  positiveInteger(amount, "赎回数量");
  if (amount > state.userStable || amount > state.supply) throw new Error("你的 USD-LAB 余额不足，不能赎回这么多。");
  const collateralOut = redeemableCollateral(state, amount);
  if (collateralOut <= 0) throw new Error("当前价格和最小单位下，赎回数量太小。");
  const grossCollateral = Math.floor((amount * state.targetPriceCents * 10_000) / (state.oraclePriceCents * 10_000));
  const next = cloneState(state);
  next.userStable -= amount;
  next.supply -= amount;
  next.reserveCollateral -= collateralOut;
  next.walletCollateral += collateralOut;
  next.totalRedemptions += amount;
  next.totalFeesCollateral += Math.max(0, grossCollateral - collateralOut);
  appendEvent(next, "STABLECOIN_REDEEMED", `你销毁 ${amount} USD-LAB，取回 ${collateralOut} ${state.collateralSymbol}；供应量减少，储备同步收缩。`);
  return next;
}

export function setMarketPrice(state: StablecoinState, priceCents: number) {
  positivePrice(priceCents);
  const next = cloneState(state);
  next.marketPriceCents = priceCents;
  appendEvent(next, "MARKET_PRICE_MOVED", `市场交易价格变为 ${(priceCents / 100).toFixed(2)} 美元；协议目标仍是 1.00。`);
  return next;
}

export function updateOracle(state: StablecoinState, priceCents: number) {
  positivePrice(priceCents);
  const next = cloneState(state);
  next.oraclePriceCents = priceCents;
  appendEvent(next, "ORACLE_UPDATED", `预言机更新为 ${(priceCents / 100).toFixed(2)} 美元；抵押率重新计算。`);
  return next;
}

export function applyReserveLoss(state: StablecoinState, amount: number) {
  positiveInteger(amount, "损失数量");
  if (amount > state.reserveCollateral) throw new Error("储备中没有这么多抵押品可以损失。");
  const next = cloneState(state);
  next.reserveCollateral -= amount;
  next.lostCollateral += amount;
  appendEvent(next, "RESERVE_LOSS", `储备损失 ${amount} ${state.collateralSymbol}；供应未自动减少，抵押率暴露真实风险。`);
  return next;
}

export function deriveStablecoinMetrics(state: StablecoinState): StablecoinMetrics {
  const collateralValue = collateralValueCents(state);
  const liabilities = liabilityValueCents(state);
  const ratio = collateralRatioBps(state);
  const max = maxMint(state);
  const phase = stablecoinPhase(state);
  return {
    collateralValueCents: collateralValue,
    liabilityValueCents: liabilities,
    maxMint: max,
    availableToMint: Math.max(0, max - state.supply),
    redeemableCollateral: state.userStable > 0 ? redeemableCollateral(state, state.userStable) : 0,
    collateralRatioBps: ratio,
    pegGapBps: Math.round(((state.marketPriceCents - state.targetPriceCents) * 10_000) / state.targetPriceCents),
    reserveCoverageBps: liabilities > 0 ? Math.floor((collateralValue * 10_000) / liabilities) : null,
    redemptionPressureBps: state.initialCollateral > 0 ? Math.min(10_000, Math.floor((state.totalRedemptions * 10_000) / Math.max(1, state.supply + state.totalRedemptions))) : 0,
    phase,
    phaseLabel: phaseLabel(phase),
    canRedeem: state.userStable > 0 && state.reserveCollateral > 0,
  };
}

export function validateStablecoinState(state: StablecoinState) {
  const violations: string[] = [];
  if (state.walletCollateral + state.reserveCollateral + state.lostCollateral !== state.initialCollateral) violations.push("抵押品没有守恒。");
  if (state.supply !== state.userStable) violations.push("流通供应与持有人余额不一致。");
  if (state.walletCollateral < 0 || state.reserveCollateral < 0 || state.lostCollateral < 0) violations.push("抵押品余额不能为负数。");
  if (state.userStable < 0 || state.supply < 0) violations.push("稳定币余额和供应不能为负数。");
  if (state.marketPriceCents <= 0 || state.oraclePriceCents <= 0 || state.targetPriceCents <= 0) violations.push("价格必须保持为正数。");
  if (state.minCollateralRatioBps <= state.liquidationRatioBps || state.liquidationRatioBps <= 10_000 || state.redemptionFeeBps < 0 || state.redemptionFeeBps >= 10_000) violations.push("抵押率和费用参数不合法。");
  return { valid: violations.length === 0, violations };
}

export const stablecoinSpec: SimulationSpec<StablecoinState, StablecoinAction, StablecoinMetrics> = {
  id: "collateral-stablecoin-v1",
  createInitialState: createStablecoinState,
  reduce: (state, action) => {
    switch (action.type) {
      case "DEPOSIT_COLLATERAL": return depositCollateral(state, action.amount);
      case "MINT_STABLE": return mintStable(state, action.amount);
      case "REDEEM_STABLE": return redeemStable(state, action.amount);
      case "SET_MARKET_PRICE": return setMarketPrice(state, action.priceCents);
      case "UPDATE_ORACLE": return updateOracle(state, action.priceCents);
      case "APPLY_RESERVE_LOSS": return applyReserveLoss(state, action.amount);
    }
  },
  deriveMetrics: deriveStablecoinMetrics,
  validateInvariants: validateStablecoinState,
  serialize: (state) => JSON.stringify(state),
  deserialize: (serialized) => JSON.parse(serialized) as StablecoinState,
};
