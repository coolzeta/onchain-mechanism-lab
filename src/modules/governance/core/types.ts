import type { SimulationEvent } from "@/platform/simulation/types";

export type GovernanceScenario = "parameter" | "treasury" | "delegation" | "low-quorum";
export type GovernancePhase = "draft" | "voting" | "succeeded" | "defeated" | "queued" | "ready" | "executed" | "cancelled";
export type GovernanceVote = "for" | "against" | "abstain";
export type GovernanceMemberId = "alice" | "bob" | "carol";
export type GovernanceActionKind = "SET_FEE" | "TRANSFER_TREASURY" | "PAUSE_PROTOCOL";

export interface GovernanceMember {
  id: GovernanceMemberId;
  label: string;
  tokens: number;
  credits: number;
  delegatedTo: GovernanceMemberId | null;
}

export interface GovernanceProposal {
  id: string;
  kind: GovernanceActionKind;
  description: string;
  value: number;
  target: GovernanceMemberId | null;
  proposer: GovernanceMemberId;
}

export interface GovernanceState {
  seed: number;
  scenario: GovernanceScenario;
  phase: GovernancePhase;
  blockTime: number;
  votingStart: number | null;
  votingEnd: number | null;
  timelockDelay: number;
  queuedAt: number | null;
  executedAt: number | null;
  cancelledBy: string | null;
  quorumBps: number;
  proposal: GovernanceProposal | null;
  members: Record<GovernanceMemberId, GovernanceMember>;
  initialMemberTokens: Record<GovernanceMemberId, number>;
  initialMemberCredits: Record<GovernanceMemberId, number>;
  snapshotPower: Record<GovernanceMemberId, number>;
  votes: Record<GovernanceMemberId, GovernanceVote | null>;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  treasuryCredits: number;
  initialTreasuryCredits: number;
  protocolFeeBps: number;
  protocolPaused: boolean;
  events: SimulationEvent[];
  nextSequence: number;
}

export type GovernanceAction =
  | { type: "SET_SCENARIO"; scenario: GovernanceScenario }
  | { type: "DELEGATE"; from: GovernanceMemberId; to: GovernanceMemberId | null }
  | { type: "CREATE_PROPOSAL"; proposer: GovernanceMemberId }
  | { type: "CAST_VOTE"; voter: GovernanceMemberId; support: GovernanceVote }
  | { type: "ADVANCE_TIME"; days?: number }
  | { type: "QUEUE_PROPOSAL" }
  | { type: "EXECUTE_PROPOSAL" }
  | { type: "CANCEL_PROPOSAL"; actor?: string };

export interface GovernanceMetrics {
  totalVotingPower: number;
  delegatedPower: number;
  quorumRequired: number;
  participation: number;
  quorumReached: boolean;
  supportBps: number;
  againstBps: number;
  treasuryCredits: number;
  protocolFeeBps: number;
  protocolPaused: boolean;
  canQueue: boolean;
  canExecute: boolean;
  timeToVoteEnd: number;
  timeToUnlock: number;
}
