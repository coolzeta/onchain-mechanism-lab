import type { SimulationEvent } from "@/platform/simulation/types";

export type OracleOutcome = "YES" | "NO";
export type OraclePhase = "READY" | "CHALLENGE" | "FINALIZED";
export type OracleScenario = "reliable" | "wrong-report" | "ambiguous-source";
export type OracleParticipantId = "reporter" | "challenger";

export interface OracleSource {
  name: string;
  outcome: OracleOutcome;
  status: "CLEAR" | "CONFLICTING" | "AMBIGUOUS";
  note: string;
}

export interface OracleParticipant {
  id: OracleParticipantId;
  name: string;
  credits: number;
  lockedStake: number;
  correctReports: number;
  incorrectReports: number;
}

export interface OracleChallenge {
  participantId: OracleParticipantId;
  outcome: OracleOutcome;
  stake: number;
  sequence: number;
}

export interface OracleState {
  seed: number;
  scenario: OracleScenario;
  question: string;
  source: OracleSource;
  phase: OraclePhase;
  proposedOutcome: OracleOutcome | null;
  finalOutcome: OracleOutcome | null;
  challenge: OracleChallenge | null;
  challengeWindow: number;
  maxChallengeWindow: number;
  settlementAcknowledged: boolean;
  participants: OracleParticipant[];
  initialCredits: number;
  events: SimulationEvent[];
  nextSequence: number;
}

export type OracleAction =
  | { type: "SUBMIT_REPORT"; outcome: OracleOutcome; stake: number }
  | { type: "CHALLENGE_REPORT"; outcome: OracleOutcome; stake: number }
  | { type: "ADVANCE_WINDOW" }
  | { type: "FINALIZE_REPORT" }
  | { type: "ADJUDICATE_DISPUTE" }
  | { type: "HANDOFF_TO_MARKET" };

export interface OracleMetrics {
  stakeAtRisk: number;
  reportMatchesSource: boolean | null;
  challengeMatchesSource: boolean | null;
  hasChallenge: boolean;
  canFinalize: boolean;
  settlementReady: boolean;
  settlementAcknowledged: boolean;
  sourceReliabilityLabel: string;
  statusLabel: string;
}
