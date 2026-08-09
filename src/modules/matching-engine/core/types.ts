import type { SimulationEvent } from "@/platform/simulation/types";

export type OrderSide = "BUY" | "SELL";
export type EngineOrderType = "LIMIT" | "MARKET";
export type EngineTraderId = "maker-a" | "maker-b" | "you";

export interface EngineTrader {
  id: EngineTraderId;
  name: string;
  cash: number;
  asset: number;
  reservedCash: number;
  reservedAsset: number;
}

export interface EngineOrder {
  id: string;
  traderId: EngineTraderId;
  side: OrderSide;
  orderType: EngineOrderType;
  price: number;
  reservePrice: number;
  quantity: number;
  remaining: number;
  sequence: number;
}

export interface EngineTrade {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  makerOrderId: string;
  takerOrderId: string;
  buyerId: EngineTraderId;
  sellerId: EngineTraderId;
  price: number;
  quantity: number;
  sequence: number;
}

export interface EngineExecutionSummary {
  orderId: string;
  orderType: EngineOrderType;
  requestedQuantity: number;
  executedQuantity: number;
  remainingQuantity: number;
  notional: number;
  averagePrice: number | null;
}

export interface MatchingEngineState {
  seed: number;
  pair: { baseSymbol: string; quoteSymbol: string };
  traders: EngineTrader[];
  orders: EngineOrder[];
  trades: EngineTrade[];
  events: SimulationEvent[];
  initialCash: number;
  initialAsset: number;
  nextSequence: number;
  lastPrice: number | null;
  lastExecution: EngineExecutionSummary | null;
}

export type MatchingEngineAction =
  | { type: "PLACE_LIMIT"; traderId: EngineTraderId; side: OrderSide; price: number; quantity: number }
  | { type: "PLACE_MARKET"; traderId: EngineTraderId; side: OrderSide; quantity: number }
  | { type: "REPLACE_ORDER"; orderId: string; price: number; quantity: number }
  | { type: "CANCEL_ORDER"; orderId: string };

export interface MatchingEngineMetrics {
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  midPrice: number | null;
  lastPrice: number | null;
  activeOrderCount: number;
  queuedQuantity: number;
  tradedQuantity: number;
  priceLevels: number;
  bestBidDepth: number;
  bestAskDepth: number;
  probeQuantity: number;
  probeAveragePrice: number | null;
  probeImpactBps: number | null;
  lastExecution: EngineExecutionSummary | null;
}
