import type { SimulationEvent } from "@/platform/simulation/types";

export type TokenHolderId = "creator" | "community" | "treasury" | "user";
export type MintAuthority = "creator" | "multisig" | "revoked";

export interface TokenHolder {
  id: TokenHolderId;
  label: string;
  liquid: number;
}

export interface VestingSchedule {
  id: string;
  holder: TokenHolderId;
  label: string;
  total: number;
  claimed: number;
  unlockBps: number;
}

export interface TokenLaunchState {
  seed: number;
  tokenSymbol: string;
  maxSupply: number;
  totalSupply: number;
  mintAuthority: MintAuthority;
  vestingPhase: 0 | 1 | 2;
  holders: Record<TokenHolderId, TokenHolder>;
  vesting: VestingSchedule[];
  events: SimulationEvent[];
  nextSequence: number;
}

export type TokenLaunchAction =
  | { type: "MINT"; to: TokenHolderId; amount: number; actor?: "creator" | "multisig" }
  | { type: "REVOKE_MINT_AUTHORITY" }
  | { type: "TRANSFER_MINT_AUTHORITY"; to: Exclude<MintAuthority, "creator"> }
  | { type: "BURN"; from: TokenHolderId; amount: number }
  | { type: "ADVANCE_VESTING" }
  | { type: "CLAIM_VESTING"; holder: TokenHolderId }
  | { type: "TRANSFER"; from: TokenHolderId; to: TokenHolderId; amount: number };

export interface TokenLaunchMetrics {
  liquidSupply: number;
  lockedSupply: number;
  circulatingBps: number;
  mintableSupply: number;
  claimableSupply: number;
  treasuryShareBps: number;
  creatorShareBps: number;
  communityShareBps: number;
  userShareBps: number;
  topHolder: TokenHolderId;
  topHolderShareBps: number;
  unlockOverhangBps: number;
  authorityActive: boolean;
  authorityLabel: string;
  vestingLabel: string;
}
