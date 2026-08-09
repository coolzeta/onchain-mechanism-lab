import { describe, expect, it } from "vitest";
import { createTokenLaunchState, deriveTokenLaunchMetrics, tokenLaunchSpec, validateTokenLaunchState } from "./engine";

describe("token launch simulation", () => {
  it("keeps liquid plus locked supply equal to total supply", () => {
    const initial = createTokenLaunchState(31);
    expect(validateTokenLaunchState(initial).valid).toBe(true);
    const minted = tokenLaunchSpec.reduce(initial, { type: "MINT", to: "treasury", amount: 100_000 });
    const advanced = tokenLaunchSpec.reduce(minted, { type: "ADVANCE_VESTING" });
    const claimed = tokenLaunchSpec.reduce(advanced, { type: "CLAIM_VESTING", holder: "creator" });
    const transferred = tokenLaunchSpec.reduce(claimed, { type: "TRANSFER", from: "treasury", to: "user", amount: 50_000 });
    expect(validateTokenLaunchState(transferred).valid).toBe(true);
    expect(deriveTokenLaunchMetrics(transferred).liquidSupply + deriveTokenLaunchMetrics(transferred).lockedSupply).toBe(transferred.totalSupply);
  });

  it("caps minting and prevents minting after authority is revoked", () => {
    const initial = createTokenLaunchState(32);
    expect(() => tokenLaunchSpec.reduce(initial, { type: "MINT", to: "treasury", amount: 200_001 })).toThrow(/供应上限/);
    const revoked = tokenLaunchSpec.reduce(initial, { type: "REVOKE_MINT_AUTHORITY" });
    expect(() => tokenLaunchSpec.reduce(revoked, { type: "MINT", to: "treasury", amount: 1 })).toThrow(/撤销/);
  });

  it("only unlocks and claims each vesting tranche once", () => {
    const initial = createTokenLaunchState(33);
    expect(() => tokenLaunchSpec.reduce(initial, { type: "CLAIM_VESTING", holder: "creator" })).toThrow(/没有新的/);
    const phaseOne = tokenLaunchSpec.reduce(initial, { type: "ADVANCE_VESTING" });
    const claimed = tokenLaunchSpec.reduce(phaseOne, { type: "CLAIM_VESTING", holder: "creator" });
    expect(claimed.holders.creator.liquid).toBe(250_000);
    expect(() => tokenLaunchSpec.reduce(claimed, { type: "CLAIM_VESTING", holder: "creator" })).toThrow(/没有新的/);
  });

  it("replays deterministically from the same seed", () => {
    const actions = [
      { type: "MINT", to: "treasury", amount: 100_000 } as const,
      { type: "ADVANCE_VESTING" } as const,
      { type: "CLAIM_VESTING", holder: "community" } as const,
      { type: "TRANSFER", from: "treasury", to: "user", amount: 20_000 } as const,
      { type: "REVOKE_MINT_AUTHORITY" } as const,
    ];
    const first = actions.reduce((state, action) => tokenLaunchSpec.reduce(state, action), createTokenLaunchState(34));
    const second = actions.reduce((state, action) => tokenLaunchSpec.reduce(state, action), createTokenLaunchState(34));
    expect(tokenLaunchSpec.serialize(first)).toBe(tokenLaunchSpec.serialize(second));
  });

  it("models burning as a supply decrease rather than a transfer", () => {
    const initial = createTokenLaunchState(35);
    const burned = tokenLaunchSpec.reduce(initial, { type: "BURN", from: "community", amount: 25_000 });
    expect(burned.totalSupply).toBe(975_000);
    expect(burned.holders.community.liquid).toBe(275_000);
    expect(burned.events.at(-1)?.kind).toBe("BURN");
    expect(validateTokenLaunchState(burned).valid).toBe(true);
  });

  it("requires the current authority to mint after a multisig handoff", () => {
    const initial = createTokenLaunchState(36);
    const handedOff = tokenLaunchSpec.reduce(initial, { type: "TRANSFER_MINT_AUTHORITY", to: "multisig" });
    expect(handedOff.mintAuthority).toBe("multisig");
    expect(() => tokenLaunchSpec.reduce(handedOff, { type: "MINT", to: "treasury", amount: 1 })).toThrow(/多签/);
    const minted = tokenLaunchSpec.reduce(handedOff, { type: "MINT", to: "treasury", amount: 10_000, actor: "multisig" });
    expect(minted.totalSupply).toBe(1_010_000);
    expect(deriveTokenLaunchMetrics(minted).authorityLabel).toBe("2/3 多签");
    expect(validateTokenLaunchState(minted).valid).toBe(true);
  });

  it("exposes allocation concentration and locked overhang as metrics", () => {
    const initial = createTokenLaunchState(37);
    const metrics = deriveTokenLaunchMetrics(initial);
    expect(metrics.unlockOverhangBps).toBe(4_000);
    expect(metrics.topHolder).toBe("creator");
    expect(metrics.topHolderShareBps).toBe(4_000);
    expect(metrics.creatorShareBps).toBe(1_000);
    expect(metrics.communityShareBps).toBe(3_000);
  });
});
