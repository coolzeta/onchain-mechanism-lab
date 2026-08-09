import type { SimulationEvent } from "@/platform/simulation/types";

export type LedgerAccountId = "alice" | "bob" | "you";
export type LedgerTransactionStatus = "PENDING" | "INCLUDED" | "REJECTED";

export interface LedgerAccount {
  id: LedgerAccountId;
  name: string;
  publicKey: string;
  balance: number;
  nonce: number;
}

export interface LedgerTransaction {
  id: string;
  from: LedgerAccountId;
  to: LedgerAccountId;
  amount: number;
  nonce: number;
  signature: string;
  status: LedgerTransactionStatus;
  reason: string | null;
  sequence: number;
}

export interface LedgerBlock {
  height: number;
  previousHash: string;
  hash: string;
  stateRoot: string;
  transactionIds: string[];
  acceptedTransactionIds: string[];
  rejectedTransactionIds: string[];
}

export interface LedgerState {
  seed: number;
  accounts: LedgerAccount[];
  transactions: LedgerTransaction[];
  pendingTransactionIds: string[];
  blocks: LedgerBlock[];
  finalizedHeight: number;
  events: SimulationEvent[];
  initialTotalBalance: number;
  nextSequence: number;
}

export type LedgerAction =
  | { type: "SUBMIT_TRANSACTION"; from: LedgerAccountId; to: LedgerAccountId; amount: number; nonce: number }
  | { type: "REPLACE_PENDING_TRANSACTION"; transactionId: string; amount: number }
  | { type: "TAMPER_TRANSACTION"; transactionId: string; amount: number }
  | { type: "MINE_BLOCK" }
  | { type: "ADVANCE_FINALITY" }
  | { type: "VERIFY_CHAIN" };

export interface LedgerMetrics {
  chainHeight: number;
  finalizedHeight: number;
  pendingFinality: number;
  confirmations: number;
  pendingCount: number;
  nextNonce: number;
  totalBalance: number;
  includedCount: number;
  rejectedCount: number;
  tipHash: string;
  lastBlockAccepted: number;
  chainValid: boolean;
}
