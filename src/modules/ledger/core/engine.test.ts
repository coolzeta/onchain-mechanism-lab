import { describe, expect, it } from "vitest";
import { createLedgerState, ledgerSpec, signTransaction, validateLedgerState } from "./engine";

describe("minimal ledger simulation", () => {
  it("signs, includes and applies a valid transaction", () => {
    const submitted = ledgerSpec.reduce(createLedgerState(91), { type: "SUBMIT_TRANSACTION", from: "you", to: "bob", amount: 120, nonce: 0 });
    const mined = ledgerSpec.reduce(submitted, { type: "MINE_BLOCK" });
    expect(mined.accounts.find((account) => account.id === "you")?.balance).toBe(880);
    expect(mined.accounts.find((account) => account.id === "you")?.nonce).toBe(1);
    expect(mined.transactions[0].status).toBe("INCLUDED");
    expect(mined.blocks[0].acceptedTransactionIds).toEqual(["tx-1"]);
    expect(validateLedgerState(mined).valid).toBe(true);
  });

  it("rejects a stale nonce without mutating balances", () => {
    const submitted = ledgerSpec.reduce(createLedgerState(92), { type: "SUBMIT_TRANSACTION", from: "you", to: "bob", amount: 120, nonce: 1 });
    const mined = ledgerSpec.reduce(submitted, { type: "MINE_BLOCK" });
    expect(mined.transactions[0].status).toBe("REJECTED");
    expect(mined.transactions[0].reason).toMatch(/Nonce/);
    expect(mined.accounts.find((account) => account.id === "you")?.balance).toBe(1_000);
  });

  it("detects tampering because the signature covers amount and nonce", () => {
    const submitted = ledgerSpec.reduce(createLedgerState(93), { type: "SUBMIT_TRANSACTION", from: "you", to: "bob", amount: 120, nonce: 0 });
    const tampered = ledgerSpec.reduce(submitted, { type: "TAMPER_TRANSACTION", transactionId: "tx-1", amount: 400 });
    expect(tampered.transactions[0].signature).toBe(signTransaction({ from: "you", to: "bob", amount: 120, nonce: 0 }));
    const mined = ledgerSpec.reduce(tampered, { type: "MINE_BLOCK" });
    expect(mined.transactions[0].status).toBe("REJECTED");
    expect(mined.transactions[0].reason).toMatch(/签名/);
  });

  it("applies transactions in order and replays the same chain deterministically", () => {
    const actions = [
      { type: "SUBMIT_TRANSACTION", from: "you", to: "alice", amount: 100, nonce: 0 } as const,
      { type: "SUBMIT_TRANSACTION", from: "you", to: "bob", amount: 50, nonce: 1 } as const,
      { type: "MINE_BLOCK" } as const,
    ];
    const first = actions.reduce((state, action) => ledgerSpec.reduce(state, action), createLedgerState(94));
    const second = actions.reduce((state, action) => ledgerSpec.reduce(state, action), createLedgerState(94));
    expect(first.blocks[0].acceptedTransactionIds).toHaveLength(2);
    expect(validateLedgerState(first).valid).toBe(true);
    expect(ledgerSpec.serialize(first)).toBe(ledgerSpec.serialize(second));
  });

  it("replaces a pending transaction with the same nonce and re-signs it", () => {
    const submitted = ledgerSpec.reduce(createLedgerState(95), { type: "SUBMIT_TRANSACTION", from: "you", to: "bob", amount: 120, nonce: 0 });
    const replaced = ledgerSpec.reduce(submitted, { type: "REPLACE_PENDING_TRANSACTION", transactionId: "tx-1", amount: 260 });
    expect(replaced.transactions[0].amount).toBe(260);
    expect(replaced.transactions[0].signature).toBe(signTransaction({ from: "you", to: "bob", amount: 260, nonce: 0 }));
    const mined = ledgerSpec.reduce(replaced, { type: "MINE_BLOCK" });
    expect(mined.accounts.find((account) => account.id === "you")?.balance).toBe(740);
    expect(validateLedgerState(mined).valid).toBe(true);
  });

  it("creates empty blocks and advances finality separately from chain height", () => {
    const first = ledgerSpec.reduce(createLedgerState(96), { type: "MINE_BLOCK" });
    expect(first.blocks[0].transactionIds).toEqual([]);
    expect(first.finalizedHeight).toBe(0);
    const finalized = ledgerSpec.reduce(first, { type: "ADVANCE_FINALITY" });
    expect(finalized.finalizedHeight).toBe(1);
    expect(ledgerSpec.deriveMetrics(finalized).pendingFinality).toBe(0);
    expect(validateLedgerState(finalized).valid).toBe(true);
  });

  it("detects a broken block commitment during full-chain verification", () => {
    const mined = ledgerSpec.reduce(ledgerSpec.reduce(createLedgerState(97), { type: "SUBMIT_TRANSACTION", from: "you", to: "bob", amount: 120, nonce: 0 }), { type: "MINE_BLOCK" });
    const tampered = { ...mined, blocks: mined.blocks.map((block) => ({ ...block, stateRoot: "deadbeef" })) };
    expect(validateLedgerState(tampered).valid).toBe(false);
    expect(ledgerSpec.deriveMetrics(tampered).chainValid).toBe(false);
  });
});
