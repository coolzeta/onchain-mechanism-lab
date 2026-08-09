import type { SimulationSpec } from "@/platform/simulation/types";
import type {
  OracleAction,
  OracleOutcome,
  OracleParticipantId,
  OracleScenario,
  OracleState,
} from "./types";

const INITIAL_PARTICIPANT_CREDITS = 1_000;
const MIN_STAKE = 100;
const MAX_STAKE = 500;
const CHALLENGE_WINDOW = 2;
const QUESTION = "2028 年前，人类会再次踏上月球吗？";

function cloneState(state: OracleState): OracleState {
  return {
    ...state,
    source: { ...state.source },
    challenge: state.challenge ? { ...state.challenge } : null,
    settlementAcknowledged: state.settlementAcknowledged,
    participants: state.participants.map((participant) => ({ ...participant })),
    events: state.events.map((event) => ({ ...event })),
  };
}

function appendEvent(state: OracleState, kind: string, message: string) {
  const index = state.events.length + 1;
  state.events.push({ id: `event-${index}`, index, kind, message });
}

function findParticipant(state: OracleState, participantId: OracleParticipantId) {
  const participant = state.participants.find((candidate) => candidate.id === participantId);
  if (!participant) throw new Error(`未知预言机参与者：${participantId}`);
  return participant;
}

function validateStake(stake: number) {
  if (!Number.isInteger(stake) || stake < MIN_STAKE || stake > MAX_STAKE) {
    throw new Error(`担保金必须是 ${MIN_STAKE} 到 ${MAX_STAKE} 积分之间的整数。`);
  }
}

function outcomeLabel(outcome: OracleOutcome | null) {
  return outcome === "YES" ? "YES" : outcome === "NO" ? "NO" : "未报告";
}

function scenarioSource(scenario: OracleScenario) {
  if (scenario === "wrong-report") {
    return { name: "未经核验的社交媒体账户", outcome: "YES" as const, status: "CONFLICTING" as const, note: "初报与官方记录相反，必须依靠挑战期纠错。" };
  }
  if (scenario === "ambiguous-source") {
    return { name: "赛事结果 API", outcome: "YES" as const, status: "AMBIGUOUS" as const, note: "时间戳落后，单一来源不足以直接结算。" };
  }
  return { name: "多个官方记录交叉验证", outcome: "YES" as const, status: "CLEAR" as const, note: "来源一致，但协议仍然需要明确报告和结算步骤。" };
}

function baseState(seed: number, scenario: OracleScenario): OracleState {
  const source = scenarioSource(scenario);
  const participants = [
    { id: "reporter" as const, name: "Primary Reporter", credits: INITIAL_PARTICIPANT_CREDITS, lockedStake: 0, correctReports: 0, incorrectReports: 0 },
    { id: "challenger" as const, name: "Challenger", credits: INITIAL_PARTICIPANT_CREDITS, lockedStake: 0, correctReports: 0, incorrectReports: 0 },
  ];
  const state: OracleState = {
    seed,
    scenario,
    question: QUESTION,
    source,
    phase: "READY",
    proposedOutcome: null,
    finalOutcome: null,
    challenge: null,
    challengeWindow: CHALLENGE_WINDOW,
    maxChallengeWindow: CHALLENGE_WINDOW,
    settlementAcknowledged: false,
    participants,
    initialCredits: participants.reduce((sum, participant) => sum + participant.credits, 0),
    events: [],
    nextSequence: 1,
  };
  appendEvent(state, "ORACLE_READY", `等待报告：${QUESTION}`);
  appendEvent(state, "SOURCE_ATTACHED", `数据源为「${source.name}」，状态 ${source.status}。`);
  return state;
}

export function createOracleState(seed = 67, scenario: OracleScenario = "wrong-report") {
  return baseState(seed, scenario);
}

export function submitReport(state: OracleState, outcome: OracleOutcome, stake: number) {
  validateStake(stake);
  if (state.phase !== "READY") throw new Error("报告已经提交，不能重复开启一轮报告。 ");
  const next = cloneState(state);
  const reporter = findParticipant(next, "reporter");
  if (reporter.credits < stake) throw new Error("报告者的可用积分不足以锁定担保金。 ");
  reporter.credits -= stake;
  reporter.lockedStake += stake;
  next.proposedOutcome = outcome;
  next.phase = "CHALLENGE";
  next.challengeWindow = CHALLENGE_WINDOW;
  appendEvent(next, "REPORT_SUBMITTED", `Primary Reporter 报告 ${outcomeLabel(outcome)}，锁定 ${stake} 积分担保金。`);
  appendEvent(next, "CHALLENGE_OPENED", `挑战期开始：还剩 ${CHALLENGE_WINDOW} 个窗口。`);
  return next;
}

export function challengeReport(state: OracleState, outcome: OracleOutcome, stake: number) {
  validateStake(stake);
  if (state.phase !== "CHALLENGE" || !state.proposedOutcome) throw new Error("当前没有可挑战的报告。 ");
  if (state.challenge) throw new Error("这一轮已经有人发起挑战。 ");
  if (state.challengeWindow <= 0) throw new Error("挑战期已经结束。 ");
  if (outcome === state.proposedOutcome) throw new Error("挑战必须报告与初报相反的结果。 ");
  const next = cloneState(state);
  const challenger = findParticipant(next, "challenger");
  if (challenger.credits < stake) throw new Error("挑战者的可用积分不足以锁定担保金。 ");
  challenger.credits -= stake;
  challenger.lockedStake += stake;
  next.challenge = { participantId: "challenger", outcome, stake, sequence: next.nextSequence++ };
  appendEvent(next, "REPORT_CHALLENGED", `Challenger 提交相反结果 ${outcomeLabel(outcome)}，锁定 ${stake} 积分。`);
  appendEvent(next, "ARBITRATION_REQUIRED", "报告与挑战发生冲突，窗口结束后需要外部仲裁或可信证据。 ");
  return next;
}

export function advanceChallengeWindow(state: OracleState) {
  if (state.phase !== "CHALLENGE") throw new Error("当前没有进行中的挑战期。 ");
  if (state.challengeWindow <= 0) throw new Error("挑战期已经走完。 ");
  const next = cloneState(state);
  next.challengeWindow -= 1;
  appendEvent(next, "WINDOW_ADVANCED", `区块时间推进：挑战期还剩 ${next.challengeWindow} 个窗口。`);
  return next;
}

function markReportAccuracy(state: OracleState, participantId: OracleParticipantId, outcome: OracleOutcome) {
  const participant = findParticipant(state, participantId);
  if (outcome === state.source.outcome) participant.correctReports += 1;
  else participant.incorrectReports += 1;
}

export function finalizeReport(state: OracleState) {
  if (state.phase !== "CHALLENGE" || !state.proposedOutcome) throw new Error("当前没有可以最终化的报告。 ");
  if (state.challengeWindow > 0) throw new Error("挑战期尚未结束，不能最终化。 ");
  if (state.challenge) throw new Error("存在挑战，需要仲裁而不是直接最终化。 ");
  const next = cloneState(state);
  const proposedOutcome = next.proposedOutcome;
  if (!proposedOutcome) throw new Error("缺少初始报告结果。 ");
  const reporter = findParticipant(next, "reporter");
  reporter.credits += reporter.lockedStake;
  reporter.lockedStake = 0;
  markReportAccuracy(next, "reporter", proposedOutcome);
  next.finalOutcome = proposedOutcome;
  next.phase = "FINALIZED";
  appendEvent(next, "REPORT_FINALIZED", `挑战期结束，${outcomeLabel(next.finalOutcome)} 被写入预测市场结算。没有挑战意味着协议接受了初报。`);
  if (next.finalOutcome !== next.source.outcome) appendEvent(next, "SOURCE_MISMATCH", "最终报告与现实数据源不一致：价格和市场共识不会自动修复错误事实。 ");
  return next;
}

export function adjudicateDispute(state: OracleState) {
  if (state.phase !== "CHALLENGE" || !state.proposedOutcome || !state.challenge) throw new Error("当前没有可以仲裁的争议。 ");
  if (state.challengeWindow > 0) throw new Error("挑战期尚未结束，仲裁者还不能读取最终证据。 ");
  const next = cloneState(state);
  const proposedOutcome = next.proposedOutcome;
  const challenge = next.challenge;
  if (!proposedOutcome || !challenge) throw new Error("争议缺少完整的报告和挑战。 ");
  const reporter = findParticipant(next, "reporter");
  const challenger = findParticipant(next, "challenger");
  const reporterWins = proposedOutcome === next.source.outcome;
  const winner = reporterWins ? reporter : challenger;
  const loser = reporterWins ? challenger : reporter;
  const totalStake = reporter.lockedStake + challenger.lockedStake;
  winner.credits += totalStake;
  reporter.lockedStake = 0;
  challenger.lockedStake = 0;
  markReportAccuracy(next, "reporter", proposedOutcome);
  markReportAccuracy(next, "challenger", challenge.outcome);
  next.finalOutcome = next.source.outcome;
  next.phase = "FINALIZED";
  appendEvent(next, "DISPUTE_ADJUDICATED", `仲裁读取现实证据：${outcomeLabel(next.source.outcome)}。${winner.name} 赢得 ${totalStake} 积分，${loser.name} 的担保金被罚没。`);
  appendEvent(next, "ORACLE_FINALIZED", `最终结果 ${outcomeLabel(next.finalOutcome)} 已发送给预测市场结算。`);
  return next;
}

export function handoffToMarket(state: OracleState) {
  if (state.phase !== "FINALIZED" || !state.finalOutcome) throw new Error("只有最终化结果才能交给预测市场结算。 ");
  if (state.settlementAcknowledged) throw new Error("这个结果已经交给市场，不能重复交接。 ");
  const next = cloneState(state);
  next.settlementAcknowledged = true;
  appendEvent(next, "SETTLEMENT_HANDOFF", `预测市场读取最终结果 ${outcomeLabel(next.finalOutcome)}：现在可以开始结算获胜头寸。`);
  return next;
}

export function deriveOracleMetrics(state: OracleState) {
  const reporter = findParticipant(state, "reporter");
  const challenger = findParticipant(state, "challenger");
  const stakeAtRisk = reporter.lockedStake + challenger.lockedStake;
  const canFinalize = state.phase === "CHALLENGE" && state.challengeWindow === 0;
  return {
    stakeAtRisk,
    reportMatchesSource: state.proposedOutcome ? state.proposedOutcome === state.source.outcome : null,
    challengeMatchesSource: state.challenge ? state.challenge.outcome === state.source.outcome : null,
    hasChallenge: Boolean(state.challenge),
    canFinalize,
    settlementReady: state.phase === "FINALIZED" && Boolean(state.finalOutcome),
    settlementAcknowledged: state.settlementAcknowledged,
    sourceReliabilityLabel: state.source.status === "CLEAR" ? "多源一致" : state.source.status === "CONFLICTING" ? "来源冲突" : "来源模糊",
    statusLabel: state.phase === "READY" ? "等待报告" : state.phase === "CHALLENGE" ? "挑战期" : "已最终化",
  };
}

export function validateOracleState(state: OracleState) {
  const violations: string[] = [];
  const participantsCredits = state.participants.reduce((sum, participant) => sum + participant.credits + participant.lockedStake, 0);
  if (participantsCredits !== state.initialCredits) violations.push("预言机参与者的积分没有守恒。 ");
  if (state.participants.some((participant) => participant.credits < 0 || participant.lockedStake < 0)) violations.push("参与者余额或担保金不能为负数。 ");
  if (state.challengeWindow < 0 || state.challengeWindow > state.maxChallengeWindow) violations.push("挑战窗口不在合法范围内。 ");
  if (state.phase === "READY" && (state.proposedOutcome || state.finalOutcome || state.challenge)) violations.push("等待报告阶段不应有结果或挑战。 ");
  if (state.phase === "FINALIZED" && !state.finalOutcome) violations.push("已最终化阶段必须有最终结果。 ");
  const reporter = findParticipant(state, "reporter");
  const challenger = findParticipant(state, "challenger");
  if (state.proposedOutcome && state.phase !== "READY" && reporter.lockedStake <= 0 && state.phase !== "FINALIZED") violations.push("已经提交报告时，报告者必须锁定担保金。 ");
  if (state.phase === "FINALIZED" && (reporter.lockedStake !== 0 || challenger.lockedStake !== 0)) violations.push("最终化后不应残留锁定担保金。 ");
  if (state.settlementAcknowledged && (state.phase !== "FINALIZED" || !state.finalOutcome)) violations.push("只有最终结果才能交给市场结算。 ");
  if (state.challenge && state.proposedOutcome && state.challenge.outcome === state.proposedOutcome) violations.push("挑战结果必须与初报相反。 ");
  if (state.challenge && state.challenge.stake !== findParticipant(state, "challenger").lockedStake && state.phase !== "FINALIZED") violations.push("挑战担保金与锁定余额不一致。 ");
  return { valid: violations.length === 0, violations };
}

export const oracleSpec: SimulationSpec<OracleState, OracleAction, ReturnType<typeof deriveOracleMetrics>> = {
  id: "challenge-oracle-v2",
  createInitialState: createOracleState,
  reduce: (state, action) => {
    switch (action.type) {
      case "SUBMIT_REPORT": return submitReport(state, action.outcome, action.stake);
      case "CHALLENGE_REPORT": return challengeReport(state, action.outcome, action.stake);
      case "ADVANCE_WINDOW": return advanceChallengeWindow(state);
      case "FINALIZE_REPORT": return finalizeReport(state);
      case "ADJUDICATE_DISPUTE": return adjudicateDispute(state);
      case "HANDOFF_TO_MARKET": return handoffToMarket(state);
    }
  },
  deriveMetrics: deriveOracleMetrics,
  validateInvariants: validateOracleState,
  serialize: (state) => JSON.stringify(state),
  deserialize: (serialized) => {
    const state = JSON.parse(serialized) as Partial<OracleState>;
    return { ...state, settlementAcknowledged: state.settlementAcknowledged ?? false } as OracleState;
  },
};
