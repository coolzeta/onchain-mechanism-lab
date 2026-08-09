import type { SimulationEvent } from "@/platform/simulation/types";

export type LendingScenario = "healthy" | "price-shock" | "stale-oracle";

export interface LendingState {
  seed: number;
  scenario: LendingScenario;
  collateralSymbol: string;
  debtSymbol: string;
  walletCollateral: number;
  collateralDeposited: number;
  liquidatorCollateral: number;
  marketPrice: number;
  oraclePrice: number;
  debt: number;
  userCash: number;
  protocolLiquidity: number;
  liquidatorCash: number;
  initialCollateral: number;
  initialCashTotal: number;
  maxLtvBps: number;
  liquidationThresholdBps: number;
  liquidationBonusBps: number;
  interestRateBps: number;
  totalInterestAccrued: number;
  events: SimulationEvent[];
  nextSequence: number;
}

export type LendingAction =
  | { type: "DEPOSIT_COLLATERAL"; amount: number }
  | { type: "WITHDRAW_COLLATERAL"; amount: number }
  | { type: "BORROW"; amount: number }
  | { type: "REPAY"; amount: number }
  | { type: "ACCRUE_INTEREST" }
  | { type: "SET_MARKET_PRICE"; price: number }
  | { type: "UPDATE_ORACLE"; price: number }
  | { type: "LIQUIDATE" };

export type LendingPhase = "NO_DEBT" | "HEALTHY" | "AT_RISK" | "LIQUIDATABLE" | "BAD_DEBT";

export interface LendingMetrics {
  collateralValue: number;
  borrowCapacity: number;
  availableToBorrow: number;
  loanToValueBps: number;
  healthFactorBps: number | null;
  liquidationPrice: number | null;
  priceGapBps: number;
  badDebt: number;
  phase: LendingPhase;
  phaseLabel: string;
  canLiquidate: boolean;
  interestRateBps: number;
}
