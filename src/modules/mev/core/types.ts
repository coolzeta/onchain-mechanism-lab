import type { SimulationEvent } from "@/platform/simulation/types";

export type MEVScenario = "public" | "sandwich" | "backrun" | "private";
export type MEVPhase = "idle" | "pending" | "scanned" | "built" | "executed";
export type MEVOrderKind = "VICTIM" | "SEARCHER_FRONT" | "SEARCHER_BACK";

export interface MEVParticipant {
  credits: number;
  token: number;
}

export interface MEVLeg {
  id: string;
  kind: MEVOrderKind;
  direction: "X_TO_Y" | "Y_TO_X";
  amountIn: number;
  amountOut: number;
  fee: number;
  reverted: boolean;
}

export interface MEVState {
  seed: number;
  scenario: MEVScenario;
  phase: MEVPhase;
  feeBps: number;
  poolCredits: number;
  poolToken: number;
  initialPoolCredits: number;
  initialPoolToken: number;
  initialVictim: MEVParticipant;
  initialSearcher: MEVParticipant;
  initialProposer: MEVParticipant;
  victim: MEVParticipant;
  searcher: MEVParticipant;
  proposer: MEVParticipant;
  victimAmountIn: number;
  victimMinOut: number;
  victimQuoteOut: number | null;
  victimAmountOut: number;
  victimReverted: boolean;
  searcherFrontAmount: number;
  searcherBackAmount: number;
  referencePriceScaled: number;
  mempool: MEVOrderKind[];
  blockOrder: MEVOrderKind[];
  legs: MEVLeg[];
  events: SimulationEvent[];
  nextSequence: number;
  executedAt: number | null;
}

export type MEVAction =
  | { type: "SET_SCENARIO"; scenario: MEVScenario }
  | { type: "SET_VICTIM_AMOUNT"; amount: number }
  | { type: "SET_VICTIM_MIN_OUT"; amount: number }
  | { type: "SUBMIT_VICTIM" }
  | { type: "SCAN_MEMPOOL" }
  | { type: "BUILD_BLOCK" }
  | { type: "EXECUTE_BLOCK" };

export interface MEVMetrics {
  spotPriceScaled: number;
  victimQuoteOut: number | null;
  victimActualOut: number;
  victimSlippageBps: number | null;
  victimProtected: boolean;
  victimReverted: boolean;
  searcherProfitCredits: number;
  proposerRevenue: number;
  sandwichExtraction: number;
  visibleToSearcher: boolean;
  mempoolCount: number;
  blockCount: number;
  totalFees: number;
  priceImpactBps: number;
}
