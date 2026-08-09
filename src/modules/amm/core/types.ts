import type { SimulationEvent } from "@/platform/simulation/types";

export type SwapDirection = "X_TO_Y" | "Y_TO_X";

export interface AMMTrader {
  id: "you";
  xBalance: number;
  yBalance: number;
  lpShares: number;
}

export interface AMMArbitrageur {
  xBalance: number;
  yBalance: number;
}

export interface AMMTrade {
  id: string;
  direction: SwapDirection;
  amountIn: number;
  fee: number;
  amountOut: number;
  executionPriceScaled: number;
  spotPriceBeforeScaled: number;
  priceImpactBps: number;
  sequence: number;
}

export interface AMMState {
  seed: number;
  pair: { xSymbol: string; ySymbol: string };
  reserveX: number;
  reserveY: number;
  initialReserveX: number;
  initialReserveY: number;
  initialTraderX: number;
  initialTraderY: number;
  initialArbitrageurX: number;
  initialArbitrageurY: number;
  feeBps: number;
  lpSharesTotal: number;
  trader: AMMTrader;
  arbitrageur: AMMArbitrageur;
  lpDepositedX: number;
  lpDepositedY: number;
  externalPriceScaled: number;
  trades: AMMTrade[];
  events: SimulationEvent[];
  totalFeesX: number;
  totalFeesY: number;
  nextSequence: number;
}

export type AMMAction =
  | { type: "SWAP"; direction: SwapDirection; amountIn: number }
  | { type: "ADD_LIQUIDITY"; amountX: number; amountY: number }
  | { type: "REMOVE_LIQUIDITY"; shares: number }
  | { type: "ARBITRAGE_TO_PRICE"; targetPriceScaled: number };

export interface AMMMetrics {
  spotPriceXPerYScaled: number;
  spotPriceYPerXScaled: number;
  invariant: number;
  invariantGrowthBps: number;
  totalFeesX: number;
  totalFeesY: number;
  externalPriceScaled: number;
  priceGapBps: number;
  lpPositionX: number;
  lpPositionY: number;
  lpPositionValueX: number;
  lpHoldValueX: number;
  lpValueDeltaBps: number;
  lastTrade: AMMTrade | null;
}
