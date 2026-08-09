import type { SimulationSpec } from "@/platform/simulation/types";
import type {
  LedgerAccount,
  LedgerAccountId,
  LedgerAction,
  LedgerBlock,
  LedgerMetrics,
  LedgerState,
  LedgerTransaction,
} from "./types";

const INITIAL_BALANCE = 1_000;
const ACCOUNT_NAMES: Record<LedgerAccountId, string> = { alice: "Alice", bob: "Bob", you: "你" };
const ACCOUNT_KEYS: Record<LedgerAccountId, string> = { alice: "alice-demo-key", bob: "bob-demo-key", you: "you-demo-key" };
const GENESIS_HASH = "GENESIS";

function hashString(input: string) {
  let hash = 2_166_136_261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function signaturePayload(transaction: Pick<LedgerTransaction, "from" | "to" | "amount" | "nonce">) {
  return `${transaction.from}|${transaction.to}|${transaction.amount}|${transaction.nonce}`;
}

export function signTransaction(transaction: Pick<LedgerTransaction, "from" | "to" | "amount" | "nonce">) {
  return `SIG_${hashString(`${ACCOUNT_KEYS[transaction.from]}|${signaturePayload(transaction)}`)}`;
}

function cloneState(state: LedgerState): LedgerState {
  return {
    ...state,
    accounts: state.accounts.map((account) => ({ ...account })),
    transactions: state.transactions.map((transaction) => ({ ...transaction })),
    pendingTransactionIds: [...state.pendingTransactionIds],
    finalizedHeight: state.finalizedHeight,
    blocks: state.blocks.map((block) => ({ ...block, transactionIds: [...block.transactionIds], acceptedTransactionIds: [...block.acceptedTransactionIds], rejectedTransactionIds: [...block.rejectedTransactionIds] })),
    events: state.events.map((event) => ({ ...event })),
  };
}

function appendEvent(state: LedgerState, kind: string, message: string) {
  const index = state.events.length + 1;
  state.events.push({ id: `event-${index}`, index, kind, message });
}

function findAccount(state: LedgerState, accountId: LedgerAccountId) {
  const account = state.accounts.find((candidate) => candidate.id === accountId);
  if (!account) throw new Error(`未知账户：${accountId}`);
  return account;
}

function findTransaction(state: LedgerState, transactionId: string) {
  const transaction = state.transactions.find((candidate) => candidate.id === transactionId);
  if (!transaction) throw new Error("找不到这笔交易。 ");
  return transaction;
}

function verifySignature(transaction: LedgerTransaction) {
  return signTransaction(transaction) === transaction.signature;
}

function rejectReason(state: LedgerState, transaction: LedgerTransaction) {
  if (!verifySignature(transaction)) return "签名与交易内容不匹配：交易在广播后被篡改或伪造。";
  if (transaction.from === transaction.to) return "发送方和接收方不能是同一个账户。";
  if (!Number.isInteger(transaction.amount) || transaction.amount <= 0) return "转账金额必须是正整数。";
  const sender = findAccount(state, transaction.from);
  if (transaction.nonce !== sender.nonce) return `Nonce 不匹配：账户现在期待 ${sender.nonce}，交易使用了 ${transaction.nonce}。`;
  if (sender.balance < transaction.amount) return `余额不足：${sender.name} 只有 ${sender.balance} 积分。`;
  return null;
}

export function submitTransaction(state: LedgerState, input: { from: LedgerAccountId; to: LedgerAccountId; amount: number; nonce: number }) {
  if (!Number.isInteger(input.amount) || input.amount <= 0 || input.amount > 500) throw new Error("转账金额必须是 1 到 500 的整数。 ");
  if (!Number.isInteger(input.nonce) || input.nonce < 0) throw new Error("Nonce 必须是非负整数。 ");
  if (input.from === input.to) throw new Error("发送方和接收方不能是同一个账户。 ");
  const next = cloneState(state);
  const sequence = next.nextSequence++;
  const transaction: LedgerTransaction = {
    id: `tx-${sequence}`,
    from: input.from,
    to: input.to,
    amount: input.amount,
    nonce: input.nonce,
    signature: signTransaction(input),
    status: "PENDING",
    reason: null,
    sequence,
  };
  next.transactions.push(transaction);
  next.pendingTransactionIds.push(transaction.id);
  appendEvent(next, "TRANSACTION_BROADCAST", `${ACCOUNT_NAMES[input.from]} 签名并广播 ${input.amount} 积分给${ACCOUNT_NAMES[input.to]}，Nonce ${input.nonce}。`);
  return next;
}

export function tamperTransaction(state: LedgerState, transactionId: string, amount: number) {
  if (!Number.isInteger(amount) || amount <= 0 || amount > 500) throw new Error("篡改后的金额必须是 1 到 500 的整数。 ");
  const next = cloneState(state);
  const transaction = findTransaction(next, transactionId);
  if (transaction.status !== "PENDING") throw new Error("只有等待打包的交易可以被篡改。 ");
  transaction.amount = amount;
  appendEvent(next, "TRANSACTION_TAMPERED", `${transaction.id} 的金额被改成 ${amount}，但原签名没有改变。`);
  return next;
}

export function replacePendingTransaction(state: LedgerState, transactionId: string, amount: number) {
  if (!Number.isInteger(amount) || amount <= 0 || amount > 500) throw new Error("替换后的金额必须是 1 到 500 的整数。 ");
  const next = cloneState(state);
  const transaction = findTransaction(next, transactionId);
  if (transaction.status !== "PENDING") throw new Error("只有 Pending 交易可以被同 Nonce 替换。 ");
  const previousAmount = transaction.amount;
  transaction.amount = amount;
  transaction.signature = signTransaction(transaction);
  transaction.reason = null;
  appendEvent(next, "TRANSACTION_REPLACED", `${transaction.id} 使用相同 Nonce ${transaction.nonce} 替换金额：${previousAmount} → ${amount}。`);
  return next;
}

export function calculateStateRoot(accounts: LedgerAccount[]) {
  return hashString(accounts.map((account) => `${account.id}:${account.balance}:${account.nonce}`).join("|"));
}

function transactionFingerprint(transaction: LedgerTransaction) {
  return `${transaction.id}:${transaction.signature}:${transaction.amount}:${transaction.nonce}:${transaction.status}`;
}

export function calculateBlockHash(input: Pick<LedgerBlock, "height" | "previousHash" | "transactionIds" | "stateRoot"> & { transactions: LedgerTransaction[] }) {
  const fingerprints = input.transactionIds.map((id) => input.transactions.find((transaction) => transaction.id === id)).filter((transaction): transaction is LedgerTransaction => Boolean(transaction)).map(transactionFingerprint).join("|");
  return hashString(`${input.height}|${input.previousHash}|${fingerprints}|${input.stateRoot}`);
}

function createBlock(state: LedgerState, transactionIds: string[], acceptedTransactionIds: string[], rejectedTransactionIds: string[], previousHash: string, height: number): LedgerBlock {
  const stateRoot = calculateStateRoot(state.accounts);
  const hash = calculateBlockHash({ height, previousHash, transactionIds, stateRoot, transactions: state.transactions });
  return { height, previousHash, hash, stateRoot, transactionIds, acceptedTransactionIds, rejectedTransactionIds };
}

export function mineBlock(state: LedgerState) {
  const next = cloneState(state);
  const transactionIds = [...next.pendingTransactionIds];
  const acceptedTransactionIds: string[] = [];
  const rejectedTransactionIds: string[] = [];
  for (const transactionId of transactionIds) {
    const transaction = findTransaction(next, transactionId);
    const reason = rejectReason(next, transaction);
    if (reason) {
      transaction.status = "REJECTED";
      transaction.reason = reason;
      rejectedTransactionIds.push(transaction.id);
      appendEvent(next, "TRANSACTION_REJECTED", `${transaction.id} 被拒绝：${reason}`);
      continue;
    }
    const sender = findAccount(next, transaction.from);
    const receiver = findAccount(next, transaction.to);
    sender.balance -= transaction.amount;
    sender.nonce += 1;
    receiver.balance += transaction.amount;
    transaction.status = "INCLUDED";
    acceptedTransactionIds.push(transaction.id);
    appendEvent(next, "TRANSACTION_INCLUDED", `${transaction.id} 写入状态：${sender.name} → ${receiver.name}，${transaction.amount} 积分。`);
  }
  const previousHash = next.blocks.at(-1)?.hash ?? GENESIS_HASH;
  const block = createBlock(next, transactionIds, acceptedTransactionIds, rejectedTransactionIds, previousHash, next.blocks.length + 1);
  next.blocks.push(block);
  next.pendingTransactionIds = [];
  appendEvent(next, "BLOCK_MINED", transactionIds.length > 0 ? `区块 #${block.height} 生成：${acceptedTransactionIds.length} 笔成功，${rejectedTransactionIds.length} 笔失败，哈希 ${block.hash}。` : `区块 #${block.height} 生成：这是一个空区块，链头继续向前。哈希 ${block.hash}。`);
  return next;
}

export function advanceFinality(state: LedgerState) {
  if (state.finalizedHeight >= state.blocks.length) throw new Error("没有新的区块可以推进最终性。 ");
  const next = cloneState(state);
  next.finalizedHeight += 1;
  appendEvent(next, "BLOCK_FINALIZED", `区块 #${next.finalizedHeight} 达到教学模拟中的最终性：后续状态可以安全依赖它。`);
  return next;
}

export function verifyChain(state: LedgerState) {
  const violations: string[] = [];
  const replayAccounts = baseAccounts();
  const replayState: LedgerState = {
    ...state,
    accounts: replayAccounts,
    transactions: state.transactions.map((transaction) => ({ ...transaction })),
    pendingTransactionIds: [],
    blocks: [],
    finalizedHeight: 0,
    events: [],
  };
  const seenTransactions = new Set<string>();
  for (let index = 0; index < state.blocks.length; index += 1) {
    const block = state.blocks[index];
    const expectedHeight = index + 1;
    const expectedPrevious = index === 0 ? GENESIS_HASH : state.blocks[index - 1].hash;
    if (block.height !== expectedHeight) violations.push(`区块高度应为 #${expectedHeight}。`);
    if (block.previousHash !== expectedPrevious) violations.push(`区块 #${block.height} 的 previousHash 不连续。`);
    const ids = new Set(block.transactionIds);
    if (ids.size !== block.transactionIds.length) violations.push(`区块 #${block.height} 的交易不能重复。`);
    const accepted = new Set(block.acceptedTransactionIds);
    const rejected = new Set(block.rejectedTransactionIds);
    if ([...accepted].some((id) => !ids.has(id)) || [...rejected].some((id) => !ids.has(id)) || [...accepted].some((id) => rejected.has(id)) || ids.size !== accepted.size + rejected.size) {
      violations.push(`区块 #${block.height} 的成功/拒绝索引不完整。`);
    }
    for (const id of block.transactionIds) {
      const transaction = state.transactions.find((candidate) => candidate.id === id);
      if (!transaction) {
        violations.push(`区块 #${block.height} 引用了不存在的交易 ${id}。`);
        continue;
      }
      if (seenTransactions.has(id)) violations.push(`交易 ${id} 被重复写入多个区块。`);
      seenTransactions.add(id);
      const replayTransaction = replayState.transactions.find((candidate) => candidate.id === id);
      if (!replayTransaction) continue;
      const reason = rejectReason(replayState, replayTransaction);
      if (reason) {
        if (!rejected.has(id) || transaction.status !== "REJECTED") violations.push(`交易 ${id} 的拒绝结果与重放不一致。`);
        replayTransaction.status = "REJECTED";
        replayTransaction.reason = reason;
      } else {
        if (!accepted.has(id) || transaction.status !== "INCLUDED") violations.push(`交易 ${id} 的成功结果与重放不一致。`);
        const sender = findAccount(replayState, replayTransaction.from);
        const receiver = findAccount(replayState, replayTransaction.to);
        sender.balance -= replayTransaction.amount;
        sender.nonce += 1;
        receiver.balance += replayTransaction.amount;
        replayTransaction.status = "INCLUDED";
      }
    }
    const expectedRoot = calculateStateRoot(replayState.accounts);
    const expectedHash = calculateBlockHash({ height: block.height, previousHash: block.previousHash, transactionIds: block.transactionIds, stateRoot: expectedRoot, transactions: state.transactions });
    if (block.stateRoot !== expectedRoot) violations.push(`区块 #${block.height} 的状态根与重放结果不一致。`);
    if (block.hash !== expectedHash) violations.push(`区块 #${block.height} 的哈希承诺已失效。`);
    replayState.blocks.push(block);
  }
  for (const account of state.accounts) {
    const replayAccount = replayAccounts.find((candidate) => candidate.id === account.id);
    if (!replayAccount || replayAccount.balance !== account.balance || replayAccount.nonce !== account.nonce) violations.push(`${account.name} 的最终状态无法由区块重放得到。`);
  }
  if (state.finalizedHeight < 0 || state.finalizedHeight > state.blocks.length) violations.push("最终性高度不能超过链高。 ");
  return { valid: violations.length === 0, violations };
}

function baseAccounts(): LedgerAccount[] {
  return (Object.keys(ACCOUNT_NAMES) as LedgerAccountId[]).map((id) => ({ id, name: ACCOUNT_NAMES[id], publicKey: `pk_${id}_demo`, balance: INITIAL_BALANCE, nonce: 0 }));
}

function baseState(seed: number): LedgerState {
  const accounts = baseAccounts();
  const state: LedgerState = {
    seed,
    accounts,
    transactions: [],
    pendingTransactionIds: [],
    blocks: [],
    finalizedHeight: 0,
    events: [],
    initialTotalBalance: accounts.reduce((sum, account) => sum + account.balance, 0),
    nextSequence: 1,
  };
  appendEvent(state, "GENESIS_CREATED", "创世状态：三个账户各有 1,000 积分，Nonce 从 0 开始。 ");
  return state;
}

export function createLedgerState(seed = 83) {
  return baseState(seed);
}

export function deriveLedgerMetrics(state: LedgerState): LedgerMetrics {
  const lastBlock = state.blocks.at(-1);
  const chainValidation = verifyChain(state);
  return {
    chainHeight: state.blocks.length,
    finalizedHeight: state.finalizedHeight,
    pendingFinality: Math.max(0, state.blocks.length - state.finalizedHeight),
    confirmations: state.finalizedHeight,
    pendingCount: state.pendingTransactionIds.length,
    nextNonce: findAccount(state, "you").nonce,
    totalBalance: state.accounts.reduce((sum, account) => sum + account.balance, 0),
    includedCount: state.transactions.filter((transaction) => transaction.status === "INCLUDED").length,
    rejectedCount: state.transactions.filter((transaction) => transaction.status === "REJECTED").length,
    tipHash: lastBlock?.hash ?? GENESIS_HASH,
    lastBlockAccepted: lastBlock?.acceptedTransactionIds.length ?? 0,
    chainValid: chainValidation.valid,
  };
}

export function validateLedgerState(state: LedgerState) {
  const violations: string[] = [];
  const totalBalance = state.accounts.reduce((sum, account) => sum + account.balance, 0);
  if (totalBalance !== state.initialTotalBalance) violations.push("账本余额没有守恒。 ");
  if (state.accounts.some((account) => account.balance < 0 || account.nonce < 0)) violations.push("账户余额或 Nonce 不能为负数。 ");
  if (!Number.isInteger(state.finalizedHeight) || state.finalizedHeight < 0 || state.finalizedHeight > state.blocks.length) violations.push("最终性高度不能超过链高。 ");
  const pending = new Set(state.pendingTransactionIds);
  if (pending.size !== state.pendingTransactionIds.length) violations.push("待处理交易 ID 不能重复。 ");
  if (state.pendingTransactionIds.some((id) => !state.transactions.some((transaction) => transaction.id === id && transaction.status === "PENDING"))) violations.push("待处理队列包含非 Pending 交易。 ");
  for (const account of state.accounts) {
    const acceptedCount = state.transactions.filter((transaction) => transaction.from === account.id && transaction.status === "INCLUDED").length;
    if (acceptedCount !== account.nonce) violations.push(`${account.name} 的 Nonce 与成功交易数量不一致。`);
  }
  for (let index = 0; index < state.blocks.length; index += 1) {
    const block = state.blocks[index];
    const expectedPrevious = index === 0 ? GENESIS_HASH : state.blocks[index - 1].hash;
    if (block.height !== index + 1) violations.push(`区块高度应为 #${index + 1}。`);
    if (block.previousHash !== expectedPrevious) violations.push(`区块 #${block.height} 的 previousHash 不连续。`);
    if (block.acceptedTransactionIds.some((id) => !block.transactionIds.includes(id)) || block.rejectedTransactionIds.some((id) => !block.transactionIds.includes(id))) violations.push(`区块 #${block.height} 的交易索引不一致。`);
  }
  const chain = verifyChain(state);
  for (const violation of chain.violations) if (!violations.includes(violation)) violations.push(violation);
  return { valid: violations.length === 0, violations };
}

export const ledgerSpec: SimulationSpec<LedgerState, LedgerAction, LedgerMetrics> = {
  id: "minimal-ledger-v2",
  createInitialState: createLedgerState,
  reduce: (state, action) => {
    switch (action.type) {
      case "SUBMIT_TRANSACTION": return submitTransaction(state, action);
      case "REPLACE_PENDING_TRANSACTION": return replacePendingTransaction(state, action.transactionId, action.amount);
      case "TAMPER_TRANSACTION": return tamperTransaction(state, action.transactionId, action.amount);
      case "MINE_BLOCK": return mineBlock(state);
      case "ADVANCE_FINALITY": return advanceFinality(state);
      case "VERIFY_CHAIN": {
        const next = cloneState(state);
        const validation = verifyChain(next);
        appendEvent(next, validation.valid ? "CHAIN_VERIFIED" : "CHAIN_INVALID", validation.valid ? "从创世状态重放整条链：状态根、交易顺序和区块哈希一致。" : `整条链验证失败：${validation.violations.join("；")}`);
        return next;
      }
    }
  },
  deriveMetrics: deriveLedgerMetrics,
  validateInvariants: validateLedgerState,
  serialize: (state) => JSON.stringify(state),
  deserialize: (serialized) => JSON.parse(serialized) as LedgerState,
};
