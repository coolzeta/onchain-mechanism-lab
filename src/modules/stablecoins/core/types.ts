import type { SimulationEvent } from "@/platform/simulation/types";

export type StablecoinScenario = "healthy" | "depeg" | "stale-oracle" | "reserve-run";

export interface StablecoinState {
  seed: number;
  scenario: StablecoinScenario;
  collateralSymbol: string;
  stableSymbol: string;
  walletCollateral: number;
  reserveCollateral: number;
  lostCollateral: number;
  userStable: number;
  supply: number;
  marketPriceCents: number;
  oraclePriceCents: number;
  targetPriceCents: number;
  initialCollateral: number;
  minCollateralRatioBps: number;
  liquidationRatioBps: number;
  redemptionFeeBps: number;
  totalRedemptions: number;
  totalFeesCollateral: number;
  events: SimulationEvent[];
  nextSequence: number;
}

export type StablecoinAction =
  | { type: "DEPOSIT_COLLATERAL"; amount: number }
  | { type: "MINT_STABLE"; amount: number }
  | { type: "REDEEM_STABLE"; amount: number }
  | { type: "SET_MARKET_PRICE"; priceCents: number }
  | { type: "UPDATE_ORACLE"; priceCents: number }
  | { type: "APPLY_RESERVE_LOSS"; amount: number };

export type StablecoinPhase = "EMPTY" | "HEALTHY" | "AT_RISK" | "UNDERCOLLATERALIZED" | "DEPEGGED" | "ORACLE_STALE";

export interface StablecoinMetrics {
  collateralValueCents: number;
  liabilityValueCents: number;
  maxMint: number;
  availableToMint: number;
  redeemableCollateral: number;
  collateralRatioBps: number | null;
  pegGapBps: number;
  reserveCoverageBps: number | null;
  redemptionPressureBps: number;
  phase: StablecoinPhase;
  phaseLabel: string;
  canRedeem: boolean;
}
