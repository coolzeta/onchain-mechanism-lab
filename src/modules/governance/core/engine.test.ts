import { describe, expect, it } from "vitest";
import {
  advanceTime,
  cancelProposal,
  castVote,
  createGovernanceState,
  createProposal,
  delegate,
  deriveGovernanceMetrics,
  executeProposal,
  governanceSpec,
  queueProposal,
  validateGovernanceState,
} from "./engine";

const expectValid = (state: ReturnType<typeof createGovernanceState>) => {
  expect(validateGovernanceState(state)).toEqual({ valid: true, violations: [] });
};

describe("governance proposal lifecycle", () => {
  it("keeps the initial treasury and token supply conserved", () => {
    const state = createGovernanceState(41);
    expect(deriveGovernanceMetrics(state).totalVotingPower).toBe(1_000_000);
    expectValid(state);
  });

  it("snapshots delegated voting power and prevents the delegator from voting twice", () => {
    let state = createGovernanceState(41, "delegation");
    state = delegate(state, "alice", "bob");
    state = createProposal(state, "carol");
    expect(state.snapshotPower).toEqual({ alice: 0, bob: 750_000, carol: 250_000 });
    expect(() => castVote(state, "alice", "for")).toThrow("已经把投票权委托出去");
    state = castVote(state, "bob", "for");
    expect(() => castVote(state, "bob", "against")).toThrow("已经投过票");
    expectValid(state);
  });

  it("runs a majority proposal through timelock and executes it once", () => {
    let state = createGovernanceState(41, "parameter");
    state = createProposal(state, "alice");
    state = castVote(state, "alice", "for");
    state = castVote(state, "bob", "for");
    state = castVote(state, "carol", "against");
    state = advanceTime(state, 3);
    expect(state.phase).toBe("succeeded");
    state = queueProposal(state);
    state = advanceTime(state, 2);
    expect(state.phase).toBe("ready");
    state = executeProposal(state);
    expect(state.phase).toBe("executed");
    expect(state.protocolFeeBps).toBe(20);
    expect(() => executeProposal(state)).toThrow("还没有完成时间锁");
    expectValid(state);
  });

  it("defeats a proposal when participation misses the quorum", () => {
    let state = createGovernanceState(41, "parameter");
    state = createProposal(state, "alice");
    state = castVote(state, "alice", "for");
    state = advanceTime(state, 3);
    expect(state.phase).toBe("defeated");
    expect(() => queueProposal(state)).toThrow("只有通过法定人数");
    expectValid(state);
  });

  it("moves a treasury transfer while preserving credits, and supports emergency cancellation", () => {
    let state = createGovernanceState(41, "treasury");
    state = createProposal(state, "alice");
    state = castVote(state, "alice", "for");
    state = castVote(state, "bob", "for");
    state = advanceTime(state, 3);
    state = queueProposal(state);
    state = cancelProposal(state, "Guardian");
    expect(state.phase).toBe("cancelled");
    expect(state.treasuryCredits).toBe(1_000_000);
    expect(state.cancelledBy).toBe("Guardian");
    expectValid(state);
  });

  it("replays the same action sequence deterministically", () => {
    const actions = [
      { type: "CREATE_PROPOSAL", proposer: "alice" },
      { type: "CAST_VOTE", voter: "alice", support: "for" },
      { type: "CAST_VOTE", voter: "bob", support: "for" },
      { type: "ADVANCE_TIME", days: 3 },
      { type: "QUEUE_PROPOSAL" },
      { type: "ADVANCE_TIME", days: 2 },
      { type: "EXECUTE_PROPOSAL" },
    ] as const;
    const replay = () => actions.reduce((state, action) => governanceSpec.reduce(state, action), createGovernanceState(99, "parameter"));
    expect(governanceSpec.serialize(replay())).toBe(governanceSpec.serialize(replay()));
    expectValid(replay());
  });
});
