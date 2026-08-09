"use client";

import { useMemo, useState } from "react";
import { useSimulation } from "@/platform/simulation/useSimulation";
import { SimulationTimeline } from "@/platform/simulation/SimulationTimeline";
import { createLedgerState, ledgerSpec } from "../core/engine";
import type { LedgerState } from "../core/types";

export type LedgerFocus = "core" | "pool" | "replay" | "finality";

const formatNumber = (value: number) => value.toLocaleString("zh-CN");
const accountLabel = (id: string) => id === "you" ? "你" : id === "alice" ? "Alice" : "Bob";
const shortHash = (hash: string) => hash.length > 12 ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : hash;

function LedgerEventLog({ state }: { state: LedgerState }) {
  return <div className="ledger-event-log" aria-live="polite"><header><strong>节点事件</strong><span>{state.events.length} EVENTS</span></header><ol>{state.events.slice(-9).reverse().map((event) => <li key={event.id}><span>{String(event.index).padStart(2, "0")}</span><p>{event.message}</p></li>)}</ol></div>;
}

function LedgerBlocks({ state }: { state: LedgerState }) {
  return <section className="ledger-blocks"><header><strong>链上区块</strong><span>{state.blocks.length} BLOCKS</span></header>{state.blocks.length ? <ol>{state.blocks.slice(-3).reverse().map((block) => <li key={block.hash}><div><b>#{block.height}</b><small>{shortHash(block.hash)}</small></div><span>{block.acceptedTransactionIds.length} 成功 · {block.rejectedTransactionIds.length} 拒绝</span></li>)}</ol> : <p>还没有区块。交易先在本地 Pending，等节点打包。</p>}</section>;
}

export function LedgerLab({ focus = "core" }: { focus?: LedgerFocus }) {
  const simulation = useSimulation(ledgerSpec, createLedgerState(83));
  const [amount, setAmount] = useState(120);
  const [replacementAmount, setReplacementAmount] = useState(260);
  const [nonceMode, setNonceMode] = useState<"correct" | "wrong">("correct");
  const state = simulation.state;
  const you = state.accounts.find((account) => account.id === "you");
  const currentNonce = you?.nonce ?? 0;
  const transactionNonce = nonceMode === "correct" ? currentNonce : currentNonce + 1;
  const pendingUserTransaction = state.transactions.find((transaction) => transaction.status === "PENDING" && transaction.from === "you");
  const latestBlock = state.blocks.at(-1);
  const coachMessage = useMemo(() => {
    const latest = state.events.at(-1);
    if (!latest || latest.kind === "GENESIS_CREATED") return "先看三张账户余额和 Nonce。签名只授权一组具体字段，节点还要在打包时检查 Nonce、余额和状态规则。";
    if (latest.kind === "TRANSACTION_BROADCAST") return "广播不等于确认：交易现在只是 Pending。你可以在打包前篡改它，观察为什么原签名会失效。";
    if (latest.kind === "TRANSACTION_TAMPERED") return "签名覆盖了金额和 Nonce。只改一个数字就足以让节点拒绝整笔交易，不能把签名当成一张永久通行证。";
    if (latest.kind === "TRANSACTION_REPLACED") return "替换交易沿用了同一个 Nonce，但重新签名了新的金额。Pending 队列可以有版本，状态机只会让一个版本成功。";
    if (latest.kind === "BLOCK_MINED" && latestBlock?.rejectedTransactionIds.length) return "区块可以记录失败尝试，但失败交易不会改变余额。Nonce 只在成功状态转换时递增。";
    if (latest.kind === "BLOCK_MINED") return "区块固定了交易顺序和状态根。任何节点都可以从上一个状态重放这些交易，得到相同余额。";
    if (latest.kind === "BLOCK_FINALIZED") return "最终性高度正在追上链高。被最终确定的区块，才是上层金融应用愿意长期依赖的状态。";
    if (latest.kind === "CHAIN_VERIFIED") return "整条链从创世状态重放成功：顺序、哈希和状态根彼此一致。";
    return "节点会逐字段验证交易。签名正确也不代表余额足够，Nonce 正确也不代表收款人或金额合法。";
  }, [latestBlock, state.events]);

  function submitTransaction() {
    simulation.dispatch({ type: "SUBMIT_TRANSACTION", from: "you", to: "bob", amount, nonce: transactionNonce });
  }

  function replaceTransaction() {
    if (pendingUserTransaction) simulation.dispatch({ type: "REPLACE_PENDING_TRANSACTION", transactionId: pendingUserTransaction.id, amount: replacementAmount });
  }

  function mine() {
    simulation.dispatch({ type: "MINE_BLOCK" });
  }

  return <section className="ledger-lab" aria-label="最小账本实验室">
    <div className="ledger-lab__toolbar"><span><i />LEDGER SIMULATION</span><span>虚拟积分 · 无真实密钥</span><button onClick={() => simulation.reset(createLedgerState(83))} type="button">重置实验</button></div>
    <header className="ledger-lab__header"><div><small>LEDGER 001 · SIGN / VERIFY / APPLY</small><h3>一笔交易如何变成状态？</h3><p>交易先被签名和广播，再由节点验证并打包进区块。任何一步不满足规则，余额都不会改变。</p></div><div className="ledger-tip"><span>当前链高</span><strong>#{simulation.metrics.chainHeight}</strong><small>TIP {shortHash(simulation.metrics.tipHash)}</small></div></header>
    <div className="ledger-lab__metrics"><div><span>待打包交易</span><strong>{simulation.metrics.pendingCount}</strong><small>Pending</small></div><div><span>你的 Nonce</span><strong>{simulation.metrics.nextNonce}</strong><small>下一个可用序号</small></div><div><span>已确认</span><strong>{simulation.metrics.includedCount}</strong><small>Included</small></div><div><span>被拒绝</span><strong>{simulation.metrics.rejectedCount}</strong><small>Rejected</small></div><div><span>最终性高度</span><strong>#{simulation.metrics.finalizedHeight}</strong><small>{simulation.metrics.pendingFinality} 个区块等待</small></div></div>

    <div className="ledger-lab__accounts"><header><strong>账户状态</strong><span>余额 + Nonce 是可验证状态</span></header><div>{state.accounts.map((account) => <article key={account.id}><div className="ledger-account-heading"><span>{accountLabel(account.id)}</span><strong>{formatNumber(account.balance)} 积分</strong></div><dl><div><dt>Nonce</dt><dd>{account.nonce}</dd></div><div><dt>公钥</dt><dd>{account.publicKey}</dd></div></dl></article>)}</div></div>

    <div className="ledger-lab__main"><aside className="ledger-transaction-console"><header><strong>创建一笔转账</strong><span>你 → Bob</span></header><p>签名会覆盖收款方、金额和 Nonce。先选一个 Nonce，再签名广播。</p><div className="ledger-nonce-tabs"><button className={nonceMode === "correct" ? "active" : ""} onClick={() => setNonceMode("correct")} type="button">使用正确 Nonce {currentNonce}</button><button className={nonceMode === "wrong" ? "active is-wrong" : ""} onClick={() => setNonceMode("wrong")} type="button">故意使用错误 Nonce {currentNonce + 1}</button></div><label><span>转账金额 <b>{amount} 积分</b></span><input aria-label="转账金额" max="500" min="1" onChange={(event) => setAmount(Number(event.target.value))} type="range" value={amount} /></label><div className="ledger-signature-preview"><span>签名摘要</span><strong>SIG_••••••••</strong><small>from · to · amount · nonce</small></div><button className="ledger-submit" disabled={Boolean(pendingUserTransaction)} onClick={submitTransaction} type="button">签名并广播 →</button>{pendingUserTransaction && <button className="ledger-tamper" onClick={() => simulation.dispatch({ type: "TAMPER_TRANSACTION", transactionId: pendingUserTransaction.id, amount: Math.min(500, pendingUserTransaction.amount + 100) })} type="button">篡改金额后再挖矿</button>}<button className="ledger-mine" onClick={mine} type="button">打包下一个区块 ⛏</button>{simulation.error && <p className="form-error" role="alert">{simulation.error}</p>}</aside><section className="ledger-transaction-history"><header><strong>交易队列</strong><span>{state.transactions.length} TXS</span></header>{state.transactions.length ? <ol>{state.transactions.slice().reverse().map((transaction) => <li className={`is-${transaction.status.toLowerCase()}`} key={transaction.id}><div><strong>{transaction.id} · {accountLabel(transaction.from)} → {accountLabel(transaction.to)}</strong><small>{transaction.amount} 积分 · Nonce {transaction.nonce}</small></div><span>{transaction.status === "PENDING" ? "待打包" : transaction.status === "INCLUDED" ? "已确认" : "已拒绝"}</span>{transaction.reason && <p>{transaction.reason}</p>}</li>)}</ol> : <p className="ledger-empty">还没有交易。先用正确 Nonce 广播一笔转账。</p>}</section></div>

    {focus !== "core" && <section className="ledger-focus-panel" aria-label="章节焦点实验"><header><span>FOCUS EXPERIMENT · {focus.toUpperCase()}</span><strong>{focus === "pool" ? "交易池与替换" : focus === "replay" ? "区块重放与状态根" : "确认数与最终性"}</strong></header>{focus === "pool" && <div className="ledger-focus-grid"><p>先广播一笔交易，再用相同 Nonce 替换它。比较替换前后的签名摘要和 Pending 状态。</p><div className="ledger-focus-actions"><button className="ledger-focus-button" onClick={submitTransaction} disabled={Boolean(pendingUserTransaction)} type="button">广播一笔 Pending 交易</button><label><span>替换金额 <b>{replacementAmount}</b></span><input aria-label="替换金额" max="500" min="1" onChange={(event) => setReplacementAmount(Number(event.target.value))} type="range" value={replacementAmount} /></label><button className="ledger-focus-button is-secondary" onClick={replaceTransaction} disabled={!pendingUserTransaction} type="button">同 Nonce 重新签名替换</button></div></div>}{focus === "replay" && <div className="ledger-focus-grid"><p>把交易打进区块，再让节点从创世状态重放。验证会检查交易顺序、前序哈希、状态根和最终余额。</p><div className="ledger-focus-actions"><button className="ledger-focus-button" onClick={mine} type="button">打包并固定顺序 ⛏</button><button className="ledger-focus-button is-secondary" disabled={!state.blocks.length} onClick={() => simulation.dispatch({ type: "VERIFY_CHAIN" })} type="button">验证整条链 ✓</button><dl><div><dt>TIP 哈希</dt><dd>{shortHash(simulation.metrics.tipHash)}</dd></div><div><dt>状态检查</dt><dd>{simulation.metrics.chainValid ? "重放一致" : "存在分歧"}</dd></div></dl></div></div>}{focus === "finality" && <div className="ledger-focus-grid"><p>第一笔交易需要一个区块，后面的空区块用来制造确认缓冲。最终性高度不会自动追上链高。</p><div className="ledger-focus-actions"><button className="ledger-focus-button" onClick={mine} type="button">生成下一个区块 ⛏</button><button className="ledger-focus-button is-secondary" disabled={simulation.metrics.finalizedHeight >= simulation.metrics.chainHeight} onClick={() => simulation.dispatch({ type: "ADVANCE_FINALITY" })} type="button">推进最终性 → #{simulation.metrics.finalizedHeight + 1}</button><dl><div><dt>链高 / 最终性</dt><dd>#{simulation.metrics.chainHeight} / #{simulation.metrics.finalizedHeight}</dd></div><div><dt>确认缓冲</dt><dd>{simulation.metrics.pendingFinality} 个区块</dd></div></dl></div></div>}</section>}

    <div className="ledger-lab__coach" role="status"><span>观察提示</span><p>{coachMessage}</p></div>
    <div className="ledger-lab__lower"><LedgerBlocks state={state} /><LedgerEventLog state={state} /><aside className="ledger-invariant-panel"><header><strong>节点检查</strong><span>STATE VALIDATION</span></header><div className="ledger-invariant-status"><span>{simulation.validation.valid ? "✓" : "!"}</span><p><strong>余额守恒 · Nonce 连续</strong>{simulation.validation.valid ? "状态可以被其他节点确定性重放" : simulation.validation.violations.join("；")}</p></div>{simulation.actions.length > 0 && <button className="undo-button" onClick={() => simulation.replayTo(simulation.actions.length - 1)} type="button">撤回上一步</button>}</aside></div>
    <SimulationTimeline snapshots={simulation.snapshots} actionCount={simulation.actions.length} onRewind={simulation.replayTo} journal={{ moduleId: "ledger", title: "最小账本自由实验", scenario: "签名 / Nonce / 最终性", note: "记录交易池、区块重放和最终性高度的状态。", labPath: "/labs/ledger", stateSnapshot: ledgerSpec.serialize(state), actions: simulation.actions.map((action) => JSON.stringify(action) ?? "{}"), events: state.events.slice(-8).map(({ kind, message }) => ({ kind, message })), metrics: [{ label: "链高", value: `#${simulation.metrics.chainHeight}` }, { label: "待打包交易", value: `${simulation.metrics.pendingCount}` }, { label: "最终性高度", value: `#${simulation.metrics.finalizedHeight}` }, { label: "状态检查", value: simulation.metrics.chainValid ? "重放一致" : "存在分歧" }], insight: "确认数只是缓冲；最终性决定上层金融系统何时可以安全依赖状态。" }} />
  </section>;
}
