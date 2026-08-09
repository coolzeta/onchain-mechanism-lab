import type { SimulationSpec } from "@/platform/simulation/types";
import type { GovernanceAction, GovernanceMemberId, GovernanceMetrics, GovernanceProposal, GovernanceScenario, GovernanceState, GovernanceVote } from "./types";

const MEMBER_IDS: GovernanceMemberId[] = ["alice", "bob", "carol"];
const MEMBER_LABELS: Record<GovernanceMemberId, string> = { alice: "Alice", bob: "Bob", carol: "Carol" };
const TOTAL_GOVERNANCE_TOKENS = 1_000_000;
const INITIAL_TREASURY_CREDITS = 1_000_000;
const VOTING_WINDOW = 3;

function cloneState(state: GovernanceState): GovernanceState {
  return {
    ...state,
    members: Object.fromEntries(Object.entries(state.members).map(([id, member]) => [id, { ...member }])) as GovernanceState["members"],
    initialMemberTokens: { ...state.initialMemberTokens },
    initialMemberCredits: { ...state.initialMemberCredits },
    snapshotPower: { ...state.snapshotPower },
    votes: { ...state.votes },
    proposal: state.proposal ? { ...state.proposal } : null,
    events: state.events.map((event) => ({ ...event })),
  };
}

function appendEvent(state: GovernanceState, kind: string, message: string) {
  const index = state.events.length + 1;
  state.events.push({ id: `event-${index}`, index, kind, message });
}

function scenarioProposal(scenario: GovernanceScenario): Omit<GovernanceProposal, "id" | "proposer"> {
  if (scenario === "treasury") return { kind: "TRANSFER_TREASURY", description: "从金库拨款 180,000 积分给 Alice 做公共物品预算", value: 180_000, target: "alice" };
  if (scenario === "low-quorum") return { kind: "TRANSFER_TREASURY", description: "从金库拨款 600,000 积分给 Bob", value: 600_000, target: "bob" };
  if (scenario === "delegation") return { kind: "SET_FEE", description: "把协议手续费从 0.30% 调整到 0.20%", value: 20, target: null };
  return { kind: "SET_FEE", description: "把协议手续费从 0.30% 调整到 0.20%", value: 20, target: null };
}

function baseState(seed: number, scenario: GovernanceScenario): GovernanceState {
  const members = {
    alice: { id: "alice" as const, label: MEMBER_LABELS.alice, tokens: 420_000, credits: 10_000, delegatedTo: null },
    bob: { id: "bob" as const, label: MEMBER_LABELS.bob, tokens: 330_000, credits: 10_000, delegatedTo: null },
    carol: { id: "carol" as const, label: MEMBER_LABELS.carol, tokens: 250_000, credits: 10_000, delegatedTo: null },
  };
  const initialMemberTokens = Object.fromEntries(MEMBER_IDS.map((id) => [id, members[id].tokens])) as Record<GovernanceMemberId, number>;
  const initialMemberCredits = Object.fromEntries(MEMBER_IDS.map((id) => [id, members[id].credits])) as Record<GovernanceMemberId, number>;
  const state: GovernanceState = {
    seed,
    scenario,
    phase: "draft",
    blockTime: 0,
    votingStart: null,
    votingEnd: null,
    timelockDelay: 2,
    queuedAt: null,
    executedAt: null,
    cancelledBy: null,
    quorumBps: scenario === "low-quorum" ? 2_000 : 6_000,
    proposal: null,
    members,
    initialMemberTokens,
    initialMemberCredits,
    snapshotPower: Object.fromEntries(MEMBER_IDS.map((id) => [id, 0])) as Record<GovernanceMemberId, number>,
    votes: Object.fromEntries(MEMBER_IDS.map((id) => [id, null])) as Record<GovernanceMemberId, GovernanceVote | null>,
    forVotes: 0,
    againstVotes: 0,
    abstainVotes: 0,
    treasuryCredits: INITIAL_TREASURY_CREDITS,
    initialTreasuryCredits: INITIAL_TREASURY_CREDITS,
    protocolFeeBps: 30,
    protocolPaused: false,
    events: [],
    nextSequence: 1,
  };
  appendEvent(state, "GOVERNANCE_CREATED", "治理模块创建：1,000,000 治理代币、1,000,000 积分金库，提案需要投票和时间锁。 ");
  appendEvent(state, "RULES_PUBLISHED", `投票窗口 ${VOTING_WINDOW} 天，法定人数 ${(state.quorumBps / 100).toFixed(0)}%，时间锁 ${state.timelockDelay} 天。`);
  return state;
}

export function createGovernanceState(seed = 41, scenario: GovernanceScenario = "parameter") {
  return baseState(seed, scenario);
}

function resetWithScenario(state: GovernanceState, scenario: GovernanceScenario) {
  return baseState(state.seed, scenario);
}

function snapshotPower(state: GovernanceState) {
  const power = Object.fromEntries(MEMBER_IDS.map((id) => [id, 0])) as Record<GovernanceMemberId, number>;
  for (const id of MEMBER_IDS) {
    if (state.members[id].delegatedTo) continue;
    power[id] = state.members[id].tokens + MEMBER_IDS.filter((candidate) => state.members[candidate].delegatedTo === id).reduce((sum, candidate) => sum + state.members[candidate].tokens, 0);
  }
  return power;
}

export function delegate(state: GovernanceState, from: GovernanceMemberId, to: GovernanceMemberId | null) {
  if (state.phase !== "draft") throw new Error("提案创建后不能修改委托，请先重置实验。 ");
  if (to === from) throw new Error("不能把投票权委托给自己。 ");
  if (to && state.members[to].delegatedTo) throw new Error("当前实验只允许一层委托，目标成员已经把票委托给别人。 ");
  const next = cloneState(state);
  next.members[from].delegatedTo = to;
  appendEvent(next, "DELEGATION_SET", to ? `${MEMBER_LABELS[from]}把 ${next.members[from].tokens.toLocaleString("zh-CN")} 票委托给${MEMBER_LABELS[to]}。` : `${MEMBER_LABELS[from]}撤回了投票委托。`);
  return next;
}

export function createProposal(state: GovernanceState, proposer: GovernanceMemberId) {
  if (state.phase !== "draft") throw new Error("当前已经有一项提案在流程中，请先重置实验。 ");
  if (state.members[proposer].delegatedTo) throw new Error("被委托的成员不能在本实验中直接创建提案，请选择未委托成员。 ");
  const next = cloneState(state);
  const action = scenarioProposal(next.scenario);
  next.proposal = { ...action, id: `proposal-${next.nextSequence++}`, proposer };
  next.snapshotPower = snapshotPower(next);
  next.votes = Object.fromEntries(MEMBER_IDS.map((id) => [id, null])) as Record<GovernanceMemberId, GovernanceVote | null>;
  next.forVotes = 0;
  next.againstVotes = 0;
  next.abstainVotes = 0;
  next.votingStart = next.blockTime;
  next.votingEnd = next.blockTime + VOTING_WINDOW;
  next.phase = "voting";
  appendEvent(next, "PROPOSAL_CREATED", `${MEMBER_LABELS[proposer]}创建提案「${action.description}」，投票从第 ${next.blockTime} 天开始。`);
  return next;
}

export function castVote(state: GovernanceState, voter: GovernanceMemberId, support: GovernanceVote) {
  if (state.phase !== "voting") throw new Error("当前不在投票窗口内。 ");
  if (!state.proposal) throw new Error("没有可以投票的提案。 ");
  if (state.members[voter].delegatedTo) throw new Error(`${MEMBER_LABELS[voter]}已经把投票权委托出去，不能重复投票。`);
  if (state.votes[voter]) throw new Error(`${MEMBER_LABELS[voter]}已经投过票，不能重复修改。`);
  const power = state.snapshotPower[voter];
  if (power <= 0) throw new Error(`${MEMBER_LABELS[voter]}在快照中没有可用投票权。`);
  const next = cloneState(state);
  next.votes[voter] = support;
  if (support === "for") next.forVotes += power;
  if (support === "against") next.againstVotes += power;
  if (support === "abstain") next.abstainVotes += power;
  const labels: Record<GovernanceVote, string> = { for: "赞成", against: "反对", abstain: "弃权" };
  appendEvent(next, "VOTE_CAST", `${MEMBER_LABELS[voter]}用 ${power.toLocaleString("zh-CN")} 票投了${labels[support]}。`);
  return next;
}

export function advanceTime(state: GovernanceState, days = 1) {
  if (!Number.isInteger(days) || days <= 0 || days > 30) throw new Error("时间推进必须是 1 到 30 天的整数。 ");
  if (state.phase !== "voting" && state.phase !== "queued") throw new Error("只有投票窗口或时间锁阶段可以推进时间。 ");
  const next = cloneState(state);
  next.blockTime += days;
  if (next.phase === "voting" && next.votingEnd !== null && next.blockTime >= next.votingEnd) {
    const participation = next.forVotes + next.againstVotes + next.abstainVotes;
    const quorum = Math.floor(TOTAL_GOVERNANCE_TOKENS * next.quorumBps / 10_000);
    next.phase = participation >= quorum && next.forVotes > next.againstVotes ? "succeeded" : "defeated";
    appendEvent(next, "VOTING_CLOSED", `投票窗口结束：参与 ${participation.toLocaleString("zh-CN")} 票，法定人数 ${quorum.toLocaleString("zh-CN")} 票，提案${next.phase === "succeeded" ? "通过" : "未通过"}。`);
  } else if (next.phase === "queued" && next.queuedAt !== null && next.blockTime - next.queuedAt >= next.timelockDelay) {
    next.phase = "ready";
    appendEvent(next, "TIMELOCK_READY", `时间锁等待完成：提案可以在第 ${next.blockTime} 天执行。`);
  } else {
    appendEvent(next, "TIME_ADVANCED", `时间推进 ${days} 天，当前是第 ${next.blockTime} 天。`);
  }
  return next;
}

export function queueProposal(state: GovernanceState) {
  if (state.phase !== "succeeded" || !state.proposal) throw new Error("只有通过法定人数和多数票的提案才能进入时间锁。 ");
  const description = state.proposal.description;
  const next = cloneState(state);
  next.phase = "queued";
  next.queuedAt = next.blockTime;
  appendEvent(next, "PROPOSAL_QUEUED", `提案「${description}」进入 ${next.timelockDelay} 天时间锁。`);
  return next;
}

export function executeProposal(state: GovernanceState) {
  if (state.phase !== "ready" || !state.proposal) throw new Error("提案还没有完成时间锁，不能执行。 ");
  const proposal = state.proposal;
  const next = cloneState(state);
  if (proposal.kind === "SET_FEE") {
    if (proposal.value < 1 || proposal.value > 100) throw new Error("协议手续费必须在 0.01% 到 1.00% 之间。 ");
    next.protocolFeeBps = proposal.value;
  } else if (proposal.kind === "TRANSFER_TREASURY") {
    if (!proposal.target || next.treasuryCredits < proposal.value) throw new Error("金库余额不足或提案没有接收者。 ");
    next.treasuryCredits -= proposal.value;
    next.members[proposal.target].credits += proposal.value;
  } else {
    next.protocolPaused = true;
  }
  next.phase = "executed";
  next.executedAt = next.blockTime;
  appendEvent(next, "PROPOSAL_EXECUTED", `提案执行完成：${proposal.description}。执行发生在第 ${next.blockTime} 天，之前经过投票和时间锁。`);
  return next;
}

export function cancelProposal(state: GovernanceState, actor = "Guardian") {
  if (state.phase !== "queued" && state.phase !== "ready") throw new Error("只有时间锁中的提案可以被紧急取消。 ");
  const next = cloneState(state);
  next.phase = "cancelled";
  next.cancelledBy = actor;
  appendEvent(next, "PROPOSAL_CANCELLED", `${actor}在执行前取消了提案：治理流程停止，但已经发生的投票不会被抹掉。`);
  return next;
}

export function deriveGovernanceMetrics(state: GovernanceState): GovernanceMetrics {
  const totalVotingPower = state.proposal ? Object.values(state.snapshotPower).reduce((sum, power) => sum + power, 0) : TOTAL_GOVERNANCE_TOKENS;
  const participation = state.forVotes + state.againstVotes + state.abstainVotes;
  const quorumRequired = Math.floor(totalVotingPower * state.quorumBps / 10_000);
  const delegatedPower = MEMBER_IDS.filter((id) => state.members[id].delegatedTo).reduce((sum, id) => sum + state.members[id].tokens, 0);
  return {
    totalVotingPower,
    delegatedPower,
    quorumRequired,
    participation,
    quorumReached: participation >= quorumRequired,
    supportBps: totalVotingPower === 0 ? 0 : Math.floor((state.forVotes * 10_000) / totalVotingPower),
    againstBps: totalVotingPower === 0 ? 0 : Math.floor((state.againstVotes * 10_000) / totalVotingPower),
    treasuryCredits: state.treasuryCredits,
    protocolFeeBps: state.protocolFeeBps,
    protocolPaused: state.protocolPaused,
    canQueue: state.phase === "succeeded",
    canExecute: state.phase === "ready",
    timeToVoteEnd: state.phase === "voting" && state.votingEnd !== null ? Math.max(0, state.votingEnd - state.blockTime) : 0,
    timeToUnlock: state.phase === "queued" && state.queuedAt !== null ? Math.max(0, state.timelockDelay - (state.blockTime - state.queuedAt)) : 0,
  };
}

export function validateGovernanceState(state: GovernanceState) {
  const violations: string[] = [];
  const memberTokens = Object.values(state.members).reduce((sum, member) => sum + member.tokens, 0);
  const memberCredits = Object.values(state.members).reduce((sum, member) => sum + member.credits, 0);
  const initialCredits = state.initialTreasuryCredits + Object.values(state.initialMemberCredits).reduce((sum, value) => sum + value, 0);
  if (memberTokens !== TOTAL_GOVERNANCE_TOKENS) violations.push("治理代币总量没有守恒。 ");
  if (state.treasuryCredits + memberCredits !== initialCredits) violations.push("金库与成员积分没有守恒。 ");
  if (Object.values(state.members).some((member) => member.tokens < 0 || member.credits < 0 || !Number.isInteger(member.tokens) || !Number.isInteger(member.credits))) violations.push("成员余额必须是非负整数。 ");
  if (state.protocolFeeBps < 1 || state.protocolFeeBps > 100 || !Number.isInteger(state.protocolFeeBps)) violations.push("协议手续费超出允许范围。 ");
  if (state.phase === "draft" && (state.proposal || state.forVotes || state.againstVotes || state.abstainVotes)) violations.push("草稿阶段不能有活跃提案或投票。 ");
  if (state.proposal) {
    const votedPower = MEMBER_IDS.reduce((sum, id) => sum + (state.votes[id] ? state.snapshotPower[id] : 0), 0);
    if (votedPower !== state.forVotes + state.againstVotes + state.abstainVotes) violations.push("投票记录与投票权快照不一致。 ");
    if (Object.values(state.snapshotPower).reduce((sum, power) => sum + power, 0) !== TOTAL_GOVERNANCE_TOKENS) violations.push("快照投票权没有守恒。 ");
    if (state.phase === "voting" && (state.votingStart === null || state.votingEnd === null || state.votingEnd <= state.votingStart)) violations.push("投票窗口边界不合法。 ");
  }
  if ((state.phase === "queued" || state.phase === "ready") && state.queuedAt === null) violations.push("时间锁阶段必须记录进入时间。 ");
  if (state.phase === "executed" && state.executedAt === null) violations.push("已执行提案必须记录执行时间。 ");
  if (state.phase === "cancelled" && !state.cancelledBy) violations.push("取消的提案必须记录取消者。 ");
  return { valid: violations.length === 0, violations };
}

export const governanceSpec: SimulationSpec<GovernanceState, GovernanceAction, GovernanceMetrics> = {
  id: "governance-timelock-v1",
  createInitialState: createGovernanceState,
  reduce: (state, action) => {
    switch (action.type) {
      case "SET_SCENARIO": return resetWithScenario(state, action.scenario);
      case "DELEGATE": return delegate(state, action.from, action.to);
      case "CREATE_PROPOSAL": return createProposal(state, action.proposer);
      case "CAST_VOTE": return castVote(state, action.voter, action.support);
      case "ADVANCE_TIME": return advanceTime(state, action.days);
      case "QUEUE_PROPOSAL": return queueProposal(state);
      case "EXECUTE_PROPOSAL": return executeProposal(state);
      case "CANCEL_PROPOSAL": return cancelProposal(state, action.actor);
    }
  },
  deriveMetrics: deriveGovernanceMetrics,
  validateInvariants: validateGovernanceState,
  serialize: (state) => JSON.stringify(state),
  deserialize: (serialized) => JSON.parse(serialized) as GovernanceState,
};
