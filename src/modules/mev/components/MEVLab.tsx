"use client";

import { useMemo, useState } from "react";
import { useSimulation } from "@/platform/simulation/useSimulation";
import { SimulationTimeline } from "@/platform/simulation/SimulationTimeline";
import { createMEVState, mevSpec, quoteSwap } from "../core/engine";
import type { MEVOrderKind, MEVScenario, MEVState } from "../core/types";

export type MEVFocus = "core" | "sandwich" | "backrun" | "private";

const formatNumber = (value: number, locale = "zh") => value.toLocaleString(locale === "en" ? "en-US" : "zh-CN");
const phaseOrder = ["idle", "pending", "scanned", "built", "executed"] as const;

function formatPrice(scaled: number) { return (scaled / 1_000).toFixed(2); }

function formatEvent(message: string, locale: string) {
  if (locale !== "en") return message;
  return message
    .replaceAll("公开池创建：", "Public pool created: ")
    .replaceAll("任何公开交易都可能改变下一笔报价。", "any public transaction can change the next quote.")
    .replaceAll("用户把", "The user submitted")
    .replaceAll("积分换 TOKEN 的交易提交到公开交易池，预估得到", "credits → TOKEN trade to the public mempool; estimated output")
    .replaceAll("积分换 TOKEN 的交易提交到私有交易池，预估得到", "credits → TOKEN trade to a private flow; estimated output")
    .replaceAll("TOKEN。", "TOKEN.")
    .replaceAll("搜索者看见公开交易，插入前置买入和后置卖出两笔交易。", "The searcher saw the public trade and inserted a front-run and back-run.")
    .replaceAll("搜索者看见公开交易，准备在用户成交后执行回跑。", "The searcher saw the public trade and prepared a back-run after the user.")
    .replaceAll("交易进入私有订单流，公开搜索者看不见这笔用户意图。", "The trade entered private order flow; public searchers cannot see the user's intent.")
    .replaceAll("公开交易池里没有额外策略，用户交易等待进入区块。", "No extra strategy entered the public mempool; the user trade waits for a block.")
    .replaceAll("区块提议者选择排序：", "The proposer chose this order: ")
    .replaceAll("用户", "user")
    .replaceAll("前置", "front-run")
    .replaceAll("后置", "back-run")
    .replaceAll("用户的保护线是至少", "The user's protection line is at least")
    .replaceAll("但当前排序只能得到", "but this ordering only returns")
    .replaceAll("交易回滚。", "so the trade reverts.")
    .replaceAll("用户用", "The user used")
    .replaceAll("搜索者用", "The searcher used")
    .replaceAll("换得", "to receive")
    .replaceAll("积分", "credits")
    .replaceAll("手续费", "fee")
    .replaceAll("搜索者向区块提议者支付", "The searcher paid the proposer")
    .replaceAll("积分排序小费。", "credits as an ordering tip.")
    .replaceAll("区块执行完成：用户交易因保护线回滚。", "Block executed: the user trade reverted at the protection line.")
    .replaceAll("区块执行完成：交易池排序已经成为共享状态。", "Block executed: mempool ordering became shared state.")
    .replaceAll("，", ", ")
    .replaceAll("。", ".");
}

function orderLabel(order: MEVOrderKind, english: boolean) {
  if (order === "VICTIM") return english ? "User swap" : "用户交换";
  if (order === "SEARCHER_FRONT") return english ? "Searcher front-run" : "搜索者前置";
  return english ? "Searcher back-run" : "搜索者后置";
}

function MEVEventLog({ state, locale }: { state: MEVState; locale: string }) {
  const english = locale === "en";
  return <div className="mev-event-log" aria-live="polite"><header><strong>{english ? "Ordering events" : "排序事件"}</strong><span>{state.events.length} EVENTS</span></header><ol>{state.events.slice(-9).reverse().map((event) => <li key={event.id}><span>{String(event.index).padStart(2, "0")}</span><p>{formatEvent(event.message, locale)}</p></li>)}</ol></div>;
}

export function MEVLab({ focus = "core", locale = "zh" }: { focus?: MEVFocus; locale?: string }) {
  const english = locale === "en";
  const [scenario, setScenario] = useState<MEVScenario>(focus === "core" ? "public" : focus);
  const simulation = useSimulation(mevSpec, createMEVState(73, scenario));
  const state = simulation.state;
  const metrics = simulation.metrics;
  const [victimAmount, setVictimAmount] = useState(state.victimAmountIn);
  const [minOut, setMinOut] = useState(state.victimMinOut);
  const preview = useMemo(() => {
    try { return quoteSwap(state, "X_TO_Y", Math.min(victimAmount, Math.max(1, state.victim.credits))); } catch { return null; }
  }, [state, victimAmount]);
  const safeAmount = Math.min(victimAmount, Math.max(1, state.victim.credits));
  const safeMinOut = Math.min(minOut, 999);
  const currentPhase = phaseOrder.indexOf(state.phase);
  const scenarioLabel = english ? ({ public: "Public mempool", sandwich: "Sandwich", backrun: "Back-run", private: "Private flow" } as Record<MEVScenario, string>)[scenario] : ({ public: "公开排序", sandwich: "夹子交易", backrun: "回跑套利", private: "私有订单流" } as Record<MEVScenario, string>)[scenario];
  const coachMessage = useMemo(() => {
    if (state.phase === "idle") return english ? "Submit one user swap first. The key question is not whether the transaction is valid, but who can see and order it before it becomes shared state." : "先提交一笔用户交换。关键问题不是交易是否合法，而是谁能在它成为共享状态前看见并排序它。";
    if (state.phase === "pending") return english ? "Pending is not executed. In a public mempool, a searcher can read the intent and prepare a competing sequence." : "Pending 不等于已经执行。公开交易池里，搜索者可以读到意图并准备另一条排序。";
    if (state.phase === "scanned") return english ? "The mempool now shows the information boundary. Build a block to turn this proposed order into a state transition." : "现在可以看见交易池的信息边界。构建区块，把这条候选排序变成状态转换。";
    if (state.phase === "built") return english ? "A builder or proposer chooses a sequence. Execute it, then compare the user's output with the baseline quote." : "构建者或提议者选择一条顺序。执行后，把用户实际得到的数量和原始报价放在一起比较。";
    if (metrics.victimReverted) return english ? "The minimum-output guard worked: the ordering was attempted, but the user's state was rolled back." : "最小得到数量保护生效了：排序被尝试，但用户状态被回滚。";
    if (scenario === "private") return english ? "Private flow removes one public visibility path; it does not remove the builder, proposer, or censorship trust boundary." : "私有订单流减少了一条公开可见路径，但没有消除构建者、提议者和审查之间的信任边界。";
    if (scenario === "sandwich") return english ? "The searcher changed the pool before and after the user. Compare extraction, fees, and the user's slippage guard instead of calling every price move a hack." : "搜索者在用户前后改变了池子。不要把每次价格移动都叫作攻击，分别比较提取差额、手续费和用户保护线。";
    return english ? "The user's trade moved the pool state; a back-run can take the other side of that new price. Profit is an asset transfer, not free value." : "用户交易改变了池子状态；回跑者可以对这条新价格取另一边。利润是资产转移，不是凭空创造的价值。";
  }, [english, metrics.victimReverted, scenario, state.phase]);

  function reset(nextScenario = scenario) {
    setScenario(nextScenario);
    const next = createMEVState(73, nextScenario);
    setVictimAmount(next.victimAmountIn);
    setMinOut(next.victimMinOut);
    simulation.reset(next);
  }

  function chooseScenario(nextScenario: MEVScenario) { reset(nextScenario); }
  function submitAndContinue() {
    simulation.dispatchMany([{ type: "SET_VICTIM_AMOUNT", amount: safeAmount }, { type: "SET_VICTIM_MIN_OUT", amount: safeMinOut }, { type: "SUBMIT_VICTIM" }]);
  }
  function runFullFlow() {
    simulation.dispatchMany([{ type: "SET_VICTIM_AMOUNT", amount: safeAmount }, { type: "SET_VICTIM_MIN_OUT", amount: safeMinOut }, { type: "SUBMIT_VICTIM" }, { type: "SCAN_MEMPOOL" }, { type: "BUILD_BLOCK" }, { type: "EXECUTE_BLOCK" }]);
  }

  return <section className="mev-lab" aria-label={english ? "MEV and transaction ordering lab" : "MEV 与交易排序实验室"}>
    <div className="mev-lab__toolbar"><span><i />ORDERING SIMULATION</span><span>{english ? "Virtual pool · no real MEV" : "虚拟池 · 不连接真实网络"}</span><button onClick={() => reset()} type="button">{english ? "Reset lab" : "重置实验"}</button></div>
    <div className="mev-scenario-switcher" role="group" aria-label={english ? "Choose ordering scenario" : "选择排序场景"}><button className={scenario === "public" ? "active" : ""} onClick={() => chooseScenario("public")} type="button">{english ? "Plain public" : "普通公开排序"}</button><button className={scenario === "sandwich" ? "active is-alert" : ""} onClick={() => chooseScenario("sandwich")} type="button">{english ? "Sandwich" : "夹子交易"}</button><button className={scenario === "backrun" ? "active" : ""} onClick={() => chooseScenario("backrun")} type="button">{english ? "Back-run" : "回跑套利"}</button><button className={scenario === "private" ? "active is-private" : ""} onClick={() => chooseScenario("private")} type="button">{english ? "Private flow" : "私有订单流"}</button></div>
    <header className="mev-lab__header"><div><small>SECURITY 001 · MEMPOOL / ORDERING / MEV</small><h3>{english ? "Who gets to choose the order?" : "谁决定交易的顺序？"}</h3><p>{english ? "Put one swap into a deterministic pool, then watch visibility, ordering, slippage protection, and extraction change the result." : "把一笔交换放进确定性池子，再观察可见性、排序、滑点保护和价值提取如何改变结果。"}</p></div><div className={`mev-status-badge is-${state.phase}`}><span>{english ? "Scenario" : "当前场景"}</span><strong>{scenarioLabel}</strong><small>{english ? `Phase: ${state.phase}` : `阶段：${state.phase === "idle" ? "待提交" : state.phase === "pending" ? "交易池" : state.phase === "scanned" ? "已观察" : state.phase === "built" ? "已排序" : "已执行"}`}</small></div></header>

    <div className="mev-lab__metrics"><div><span>{english ? "Pool spot price" : "池内现货价"}</span><strong>{formatPrice(metrics.spotPriceScaled)}</strong><small>{english ? "credits / TOKEN" : "积分 / TOKEN"}</small></div><div><span>{english ? "User quote" : "用户预估输出"}</span><strong>{formatNumber(metrics.victimQuoteOut ?? preview?.amountOut ?? 0, locale)}</strong><small>TOKEN</small></div><div><span>{english ? "User actual output" : "用户实际输出"}</span><strong>{formatNumber(metrics.victimActualOut, locale)}</strong><small>{metrics.victimReverted ? (english ? "reverted" : "已回滚") : "TOKEN"}</small></div><div><span>{english ? "Searcher P/L" : "搜索者盈亏"}</span><strong className={metrics.searcherProfitCredits > 0 ? "is-positive" : metrics.searcherProfitCredits < 0 ? "is-negative" : ""}>{metrics.searcherProfitCredits > 0 ? "+" : ""}{formatNumber(metrics.searcherProfitCredits, locale)}</strong><small>{english ? "credits, after tip" : "积分，已计排序小费"}</small></div><div><span>{english ? "Visible to searcher" : "搜索者可见"}</span><strong>{metrics.visibleToSearcher ? (english ? "YES" : "是") : (english ? "NO" : "否")}</strong><small>{english ? `${metrics.mempoolCount} mempool item(s)` : `${metrics.mempoolCount} 条交易池记录`}</small></div></div>

    {focus !== "core" && <section className="mev-focus-panel" aria-label={english ? "MEV focus experiment" : "MEV 焦点实验"}><header><div><span className="eyebrow">FOCUS EXPERIMENT · {focus.toUpperCase()}</span><strong>{english ? (focus === "sandwich" ? "Does the guard stop the sandwich?" : focus === "backrun" ? "Who captures the post-trade gap?" : "What changes when the flow is private?") : (focus === "sandwich" ? "保护线能挡住夹子交易吗？" : focus === "backrun" ? "成交后的价格差由谁捕获？" : "交易流变私有后改变了什么？")}</strong></div><p>{english ? (focus === "sandwich" ? "Run the same public sequence with a loose and a tight minimum-output guard." : focus === "backrun" ? "Compare the pool state before and after a user trade, then inspect the back-run inventory ledger." : "Repeat the user trade with public and private visibility, and name the trust boundary that remains.") : (focus === "sandwich" ? "用宽松和严格两条最小得到数量保护线，执行同一条公开排序。" : focus === "backrun" ? "比较用户交易前后的池子状态，再检查回跑者的库存账。" : "用公开和私有两种可见性重复用户交易，并指出仍然存在的信任边界。")}</p></header><div className="mev-focus-panel__actions"><button onClick={() => setMinOut(90)} type="button">{english ? "Tight guard · 90 TOKEN" : "严格保护 · 90 TOKEN"}</button><button onClick={() => setMinOut(80)} type="button">{english ? "Loose guard · 80 TOKEN" : "宽松保护 · 80 TOKEN"}</button><button onClick={runFullFlow} type="button">{english ? "Run the full sequence →" : "运行完整排序 →"}</button></div><div className="mev-focus-panel__stats"><span>{english ? "Baseline quote" : "初始预估"} <b>{formatNumber(preview?.amountOut ?? metrics.victimQuoteOut ?? 0, locale)} TOKEN</b></span><span>{english ? "Min output" : "最小得到"} <b>{formatNumber(safeMinOut, locale)} TOKEN</b></span><span>{english ? "Extraction" : "夹子提取"} <b>{formatNumber(metrics.sandwichExtraction, locale)} TOKEN</b></span></div></section>}

    <div className="mev-lab__main"><section className="mev-pipeline"><header><strong>{english ? "From intent to shared state" : "从意图到共享状态"}</strong><span>{scenarioLabel}</span></header><ol className="mev-pipeline__steps">{([{ id: "pending", label: english ? "Mempool" : "交易池", note: english ? "intent is visible" : "意图是否可见" }, { id: "built", label: english ? "Block order" : "区块排序", note: english ? "who goes first" : "谁先执行" }, { id: "executed", label: english ? "State" : "共享状态", note: english ? "replayed by nodes" : "节点共同重放" }] as const).map((stage, index) => { const done = currentPhase >= phaseOrder.indexOf(stage.id); const active = state.phase === stage.id || (stage.id === "pending" && state.phase === "idle"); return <li className={`${done ? "is-done" : ""} ${active ? "is-active" : ""}`} key={stage.id}><span>{done ? "✓" : String(index + 1).padStart(2, "0")}</span><div><strong>{stage.label}</strong><small>{stage.note}</small></div>{index < 2 && <i aria-hidden="true">→</i>}</li>; })}</ol><div className="mev-order-view"><div><span>{english ? "Mempool" : "交易池"}</span><div className="mev-order-view__list">{state.mempool.length ? state.mempool.map((order, index) => <b key={`${order}-${index}`}>{orderLabel(order, english)}</b>) : <em>{english ? "Nothing submitted yet" : "还没有提交交易"}</em>}</div></div><div><span>{english ? "Selected block order" : "区块最终排序"}</span><div className="mev-order-view__list is-block">{state.blockOrder.length ? state.blockOrder.map((order, index) => <b key={`${order}-${index}`}>{String(index + 1).padStart(2, "0")} · {orderLabel(order, english)}</b>) : <em>{english ? "Build a block after scanning" : "观察交易池后构建区块"}</em>}</div></div></div><p>{english ? "A mempool record is not a fill. The block order is not a payout. Only execution moves balances and pool reserves." : "交易池记录不是成交，区块排序也不是赔付。只有执行才会真正移动余额和池子储备。"}</p></section>
      <aside className="mev-action-console"><header><strong>{english ? "Control the transaction" : "控制这笔交易"}</strong><span>{state.phase === "idle" ? (english ? "ready" : "待提交") : state.phase}</span></header><label><span>{english ? "User input" : "用户输入"} <b>{formatNumber(safeAmount, locale)} {english ? "credits" : "积分"}</b></span><input aria-label={english ? "User swap amount" : "用户交换数量"} disabled={state.phase !== "idle"} max={Math.max(1, Math.min(20_000, state.victim.credits))} min="1" onChange={(event) => setVictimAmount(Number(event.target.value))} type="range" value={safeAmount} /></label><label><span>{english ? "Minimum output" : "最小得到数量"} <b>{formatNumber(safeMinOut, locale)} TOKEN</b></span><input aria-label={english ? "Minimum output" : "最小得到数量"} disabled={state.phase !== "idle"} max="100" min="60" onChange={(event) => setMinOut(Number(event.target.value))} type="range" value={safeMinOut} /></label><div className="mev-preview"><span>{english ? "Quote before ordering" : "排序前报价"}</span><strong>{formatNumber(preview?.amountOut ?? 0, locale)} TOKEN</strong><small>{english ? "The quote can change before execution." : "报价可能在执行前被排序改变。"}</small></div><button className="mev-primary-action" disabled={state.phase !== "idle"} onClick={submitAndContinue} type="button">{english ? "Submit to mempool →" : "提交到交易池 →"}</button><button disabled={state.phase !== "pending"} onClick={() => simulation.dispatch({ type: "SCAN_MEMPOOL" })} type="button">{english ? "Scan the mempool" : "观察交易池"}</button><button disabled={state.phase !== "scanned"} onClick={() => simulation.dispatch({ type: "BUILD_BLOCK" })} type="button">{english ? "Build block order" : "构建区块排序"}</button><button className="mev-primary-action" disabled={state.phase !== "built"} onClick={() => simulation.dispatch({ type: "EXECUTE_BLOCK" })} type="button">{english ? "Execute block →" : "执行区块 →"}</button></aside></div>

    <section className="mev-ledger-panel"><header><div><span className="eyebrow">BALANCE LEDGER · NO VALUE FROM NOWHERE</span><strong>{english ? "Who gained, who paid, and what moved?" : "谁获利、谁支付，哪些资产真的移动了？"}</strong></div><p>{english ? "Searcher profit, proposer tip, pool fees, and user output live on the same ledger." : "搜索者利润、提议者小费、池子手续费和用户输出都放在同一张账上。"}</p></header><div className="mev-ledger-grid"><div><span>{english ? "Pool" : "池子"}</span><b>{formatNumber(state.poolCredits, locale)} {english ? "credits" : "积分"} · {formatNumber(state.poolToken, locale)} TOKEN</b></div><div><span>{english ? "User" : "用户"}</span><b>{formatNumber(state.victim.credits, locale)} {english ? "credits" : "积分"} · {formatNumber(state.victim.token, locale)} TOKEN</b></div><div><span>{english ? "Searcher" : "搜索者"}</span><b>{formatNumber(state.searcher.credits, locale)} {english ? "credits" : "积分"} · {formatNumber(state.searcher.token, locale)} TOKEN</b></div><div><span>{english ? "Proposer" : "提议者"}</span><b>{formatNumber(state.proposer.credits, locale)} {english ? "credits" : "积分"} · {formatNumber(state.proposer.token, locale)} TOKEN</b></div></div></section>

    <div className="mev-lab__coach" role="status"><span>{english ? "Coach" : "观察提示"}</span><p>{coachMessage}</p></div><div className="mev-lab__lower"><MEVEventLog state={state} locale={locale} /><aside className="mev-invariant-panel"><header><strong>{english ? "System checks" : "系统检查"}</strong><span>STATE INVARIANTS</span></header><div className="mev-health-summary"><span className={simulation.validation.valid ? "is-valid" : "is-invalid"} /><p><strong>{simulation.validation.valid ? (english ? "Conserved & replayable" : "守恒且可重放") : (english ? "Review the ledger" : "需要检查")}</strong>{simulation.validation.valid ? (english ? "Credits and TOKEN remain conserved." : "积分与 TOKEN 保持守恒。") : simulation.validation.violations.join(english ? "; " : "；")}</p></div><dl><div><dt>{english ? "Price impact" : "价格冲击"}</dt><dd>{(metrics.priceImpactBps / 100).toFixed(2)}%</dd></div><div><dt>{english ? "Fees in pool" : "池内手续费"}</dt><dd>{formatNumber(metrics.totalFees, locale)}</dd></div><div><dt>{english ? "Proposer tip" : "提议者小费"}</dt><dd>{formatNumber(metrics.proposerRevenue, locale)}</dd></div></dl>{simulation.error && <p className="form-error" role="alert">{simulation.error}</p>}{simulation.actions.length > 0 && <button className="undo-button" onClick={() => simulation.replayTo(simulation.actions.length - 1)} type="button">{english ? "Undo previous step" : "撤回上一步"}</button>}</aside></div>
    <SimulationTimeline snapshots={simulation.snapshots} actionCount={simulation.actions.length} onRewind={simulation.replayTo} journal={{ moduleId: "mev", title: english ? "MEV and ordering free lab" : "MEV 与排序自由实验", scenario: scenarioLabel, note: english ? "Follow visibility, block order, output protection, and asset transfer." : "记录可见性、区块排序、输出保护和资产转移。", labPath: "/labs/mev", stateSnapshot: mevSpec.serialize(state), actions: simulation.actions.map((action) => JSON.stringify(action) ?? "{}"), events: state.events.slice(-8).map(({ kind, message }) => ({ kind, message: formatEvent(message, locale) })), metrics: [{ label: english ? "Scenario" : "场景", value: scenarioLabel }, { label: english ? "Victim output" : "用户输出", value: `${metrics.victimActualOut} TOKEN` }, { label: english ? "Searcher P/L" : "搜索者盈亏", value: formatNumber(metrics.searcherProfitCredits, locale) }, { label: english ? "Proposer tip" : "提议者小费", value: formatNumber(metrics.proposerRevenue, locale) }], insight: english ? "Ordering is a state transition with distributional consequences: visibility changes options, and execution moves the assets." : "排序是一种会改变分配结果的状态转换：可见性改变可选动作，执行才真正移动资产。" }} />
  </section>;
}
