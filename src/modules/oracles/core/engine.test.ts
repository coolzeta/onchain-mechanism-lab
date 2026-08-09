import { describe, expect, it } from "vitest";
import { createOracleState, oracleSpec, validateOracleState } from "./engine";

describe("oracle challenge simulation", () => {
  it("requires a challenge window before finalizing an unchallenged report", () => {
    const submitted = oracleSpec.reduce(createOracleState(71, "reliable"), { type: "SUBMIT_REPORT", outcome: "YES", stake: 100 });
    expect(() => oracleSpec.reduce(submitted, { type: "FINALIZE_REPORT" })).toThrow(/挑战期尚未结束/);
    const windowOne = oracleSpec.reduce(submitted, { type: "ADVANCE_WINDOW" });
    const windowDone = oracleSpec.reduce(windowOne, { type: "ADVANCE_WINDOW" });
    const finalized = oracleSpec.reduce(windowDone, { type: "FINALIZE_REPORT" });
    expect(finalized.finalOutcome).toBe("YES");
    expect(finalized.participants[0].lockedStake).toBe(0);
    expect(validateOracleState(finalized).valid).toBe(true);
  });

  it("lets a challenger overturn a wrong report and transfers both stakes to the winner", () => {
    const reported = oracleSpec.reduce(createOracleState(72, "wrong-report"), { type: "SUBMIT_REPORT", outcome: "NO", stake: 200 });
    const challenged = oracleSpec.reduce(reported, { type: "CHALLENGE_REPORT", outcome: "YES", stake: 300 });
    const advanced = oracleSpec.reduce(oracleSpec.reduce(challenged, { type: "ADVANCE_WINDOW" }), { type: "ADVANCE_WINDOW" });
    const settled = oracleSpec.reduce(advanced, { type: "ADJUDICATE_DISPUTE" });
    expect(settled.finalOutcome).toBe("YES");
    expect(settled.participants.find((participant) => participant.id === "challenger")?.credits).toBe(1_200);
    expect(settled.participants.every((participant) => participant.lockedStake === 0)).toBe(true);
    expect(settled.events.at(-1)?.kind).toBe("ORACLE_FINALIZED");
    expect(validateOracleState(settled).valid).toBe(true);
  });

  it("does not allow same-side challenges or duplicate reports", () => {
    const reported = oracleSpec.reduce(createOracleState(73), { type: "SUBMIT_REPORT", outcome: "YES", stake: 100 });
    expect(() => oracleSpec.reduce(reported, { type: "SUBMIT_REPORT", outcome: "NO", stake: 100 })).toThrow(/不能重复/);
    expect(() => oracleSpec.reduce(reported, { type: "CHALLENGE_REPORT", outcome: "YES", stake: 100 })).toThrow(/相反/);
  });

  it("keeps the participant stake ledger conserved through deterministic replay", () => {
    const actions = [
      { type: "SUBMIT_REPORT", outcome: "NO", stake: 150 } as const,
      { type: "CHALLENGE_REPORT", outcome: "YES", stake: 250 } as const,
      { type: "ADVANCE_WINDOW" } as const,
      { type: "ADVANCE_WINDOW" } as const,
      { type: "ADJUDICATE_DISPUTE" } as const,
    ];
    const first = actions.reduce((state, action) => oracleSpec.reduce(state, action), createOracleState(74, "ambiguous-source"));
    const second = actions.reduce((state, action) => oracleSpec.reduce(state, action), createOracleState(74, "ambiguous-source"));
    expect(validateOracleState(first).valid).toBe(true);
    expect(oracleSpec.serialize(first)).toBe(oracleSpec.serialize(second));
  });

  it("requires an explicit, single settlement handoff after finalization", () => {
    const submitted = oracleSpec.reduce(createOracleState(75, "reliable"), { type: "SUBMIT_REPORT", outcome: "YES", stake: 100 });
    const windowOne = oracleSpec.reduce(submitted, { type: "ADVANCE_WINDOW" });
    const finalized = oracleSpec.reduce(oracleSpec.reduce(windowOne, { type: "ADVANCE_WINDOW" }), { type: "FINALIZE_REPORT" });
    expect(finalized.settlementAcknowledged).toBe(false);
    const handedOff = oracleSpec.reduce(finalized, { type: "HANDOFF_TO_MARKET" });
    expect(handedOff.settlementAcknowledged).toBe(true);
    expect(handedOff.events.at(-1)?.kind).toBe("SETTLEMENT_HANDOFF");
    expect(() => oracleSpec.reduce(handedOff, { type: "HANDOFF_TO_MARKET" })).toThrow(/不能重复/);
    expect(validateOracleState(handedOff).valid).toBe(true);
  });
});
