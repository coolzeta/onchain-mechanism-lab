import type { SimulationEvent } from "@/platform/simulation/types";

export type Outcome = "YES" | "NO";
export type MarketPhase = "OPEN" | "RESOLVED";
export type ScenarioId = "normal" | "thin" | "whale" | "bad-oracle";

export interface Trader {
  id: string;
  name: string;
  avatar: string;
  belief: number;
  credits: number;
  reservedCredits: number;
  yesShares: number;
  noShares: number;
  redeemed: boolean;
}

export interface Order {
  id: string;
  traderId: string;
  outcome: Outcome;
  outcomePrice: number;
  yesPrice: number;
  quantity: number;
  remaining: number;
  sequence: number;
}

export interface Trade {
  id: string;
  yesBuyerId: string;
  noBuyerId: string;
  yesPrice: number;
  noPrice: number;
  quantity: number;
  sequence: number;
}

export interface PredictionMarketState {
  seed: number;
  scenario: ScenarioId;
  question: string;
  phase: MarketPhase;
  resolution: Outcome | null;
  oracleReliable: boolean;
  traders: Trader[];
  orders: Order[];
  trades: Trade[];
  events: SimulationEvent[];
  collateral: number;
  initialCredits: number;
  nextSequence: number;
  lastPrice: number | null;
}

export type PredictionMarketAction =
  | { type: "PLACE_ORDER"; traderId: string; outcome: Outcome; price: number; quantity: number }
  | { type: "CANCEL_ORDER"; orderId: string }
  | { type: "SET_BELIEF"; traderId: string; belief: number }
  | { type: "RESOLVE"; outcome: Outcome }
  | { type: "REDEEM"; traderId: string };

export interface PredictionMarketMetrics {
  bestBid: number | null;
  bestAsk: number | null;
  impliedPrice: number;
  spread: number | null;
  openInterest: number;
  totalVolume: number;
}
