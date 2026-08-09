"use client";

import { useMemo, useState } from "react";
import { useSimulation } from "@/platform/simulation/useSimulation";
import { SimulationTimeline } from "@/platform/simulation/SimulationTimeline";
import { createLendingState, lendingSpec } from "../core/engine";
import type { LendingScenario, LendingState } from "../core/types";

const formatNumber = (value: number, locale = "zh") => value.toLocaleString(locale === "en" ? "en-US" : "zh-CN");
const formatHealth = (value: number | null) => value === null ? "—" : (value / 10_000).toFixed(2);
const formatPercent = (bps: number) => `${(bps / 100).toFixed(2)}%`;

export type LendingFocus = "core" | "collateral" | "health" | "liquidation" | "oracle";

function formatEvent(message: string, locale: string) {
  if (locale !== "en") return message;
  return message
    .replaceAll("市场创建", "Market created")
    .replaceAll("你存入", "You deposited")
    .replaceAll("你借出", "You borrowed")
    .replaceAll("你偿还", "You repaid")
    .replaceAll("你取出", "You withdrew")
    .replaceAll("清算人偿还", "Liquidator repaid")
    .replaceAll("清算人接收", "Liquidator received")
    .replaceAll("预言机更新", "Oracle updated")
    .replaceAll("市场价格移动", "Market price moved")
    .replaceAll("推进利息", "Interest accrued")
    .replaceAll("抵押品", "collateral")
    .replaceAll("债务", "debt")
    .replaceAll("积分", "credits")
    .replaceAll("TOKEN", "TOKEN")
    .replaceAll("健康度", "health factor")
    .replaceAll("坏账", "bad debt")
    .replaceAll("清算", "liquidation")
    .replaceAll("，", ", ")
    .replaceAll("。", ".");
}

function LendingEventLog({ state, locale = "zh" }: { state: LendingState; locale?: string }) {
  const english = locale === "en";
  return <div className="lending-event-log" aria-live="polite"><header><strong>{english ? "Lending events" : "借贷事件"}</strong><span>{state.events.length} EVENTS</span></header><ol>{state.events.slice(-9).reverse().map((event) => <li key={event.id}><span>{String(event.index).padStart(2, "0")}</span><p>{formatEvent(event.message, locale)}</p></li>)}</ol></div>;
}

function RiskTimeline({ state, health, locale = "zh" }: { state: LendingState; health: number | null; locale?: string }) {
  const english = locale === "en";
  const stages = [
    { label: english ? "Collateral" : "抵押品", done: state.collateralDeposited > 0 },
    { label: english ? "Debt" : "债务", done: state.debt > 0 },
    { label: english ? "Risk moves" : "风险变化", done: state.totalInterestAccrued > 0 || state.marketPrice !== state.oraclePrice },
    { label: english ? "Liquidation" : "清算", done: state.liquidatorCollateral > 0 },
  ];
  return <div className="lending-risk-timeline" aria-label={english ? "Lending risk lifecycle" : "借贷风险流程"}>{stages.map((stage, index) => <div className={stage.done ? "is-done" : ""} key={stage.label}><span>{stage.done ? "✓" : String(index + 1).padStart(2, "0")}</span><strong>{stage.label}</strong>{index < stages.length - 1 && <i aria-hidden="true" />}</div>)}<small>{english ? "Health " : "健康度 "}{formatHealth(health)}</small></div>;
}

export function LendingLab({ focus = "core", locale = "zh" }: { focus?: LendingFocus; locale?: string }) {
  const english = locale === "en";
  const [scenario, setScenario] = useState<LendingScenario>("healthy");
  const [depositAmount, setDepositAmount] = useState(100);
  const [borrowAmount, setBorrowAmount] = useState(6_000);
  const repayAmount = 1_000;
  const [withdrawAmount, setWithdrawAmount] = useState(10);
  const [marketPrice, setMarketPrice] = useState(120);
  const simulation = useSimulation(lendingSpec, createLendingState(91, scenario));
  const state = simulation.state;
  const metrics = simulation.metrics;
  const safeBorrow = Math.min(Math.max(1, borrowAmount), metrics.availableToBorrow, state.protocolLiquidity);
  const safeRepay = Math.min(Math.max(1, repayAmount), state.debt, state.userCash);
  const safeWithdraw = Math.min(Math.max(1, withdrawAmount), state.collateralDeposited);
  const collateralWidth = Math.min(100, Math.max(4, (state.collateralDeposited / state.initialCollateral) * 100));
  const debtWidth = Math.min(100, Math.max(4, metrics.collateralValue > 0 ? (state.debt / Math.max(1, metrics.collateralValue)) * 100 : 0));
  const phaseLabel = english ? ({ NO_DEBT: "No debt", HEALTHY: "Healthy", AT_RISK: "At risk", LIQUIDATABLE: "Liquidatable", BAD_DEBT: "Bad debt" } as Record<string, string>)[metrics.phase] : metrics.phaseLabel;
  const coachMessage = useMemo(() => {
    const latest = state.events.at(-1);
    if (!latest || latest.kind === "MARKET_CREATED") return english ? "Deposit collateral, then borrow near the capacity. Capacity, health, and pool liquidity are three different boundaries." : "先存入抵押品，再借一笔接近额度的积分。注意：额度、健康度和协议流动性是三个不同的边界。";
    if (latest.kind === "COLLATERAL_DEPOSITED") return english ? "Collateral is locked in the protocol. You can borrow next, but LTV leaves a buffer for price movement." : "抵押品已经锁进协议。下一步可以借款，但协议会用 LTV 留出价格波动缓冲。";
    if (latest.kind === "BORROWED") return english ? "Borrowing increases your cash and the protocol's claim on you. Accrue interest next and watch risk change over time." : "借款增加了你的现金，也增加了协议对你的债权。接下来推进利息，观察风险如何随时间变化。";
    if (latest.kind === "INTEREST_ACCRUED") return english ? "Price did not move, but debt grew, so health fell. Risk is not just the original loan amount." : "价格没有变化，但债务增加了，所以健康度下降。风险指标不是一次性借款金额。";
    if (latest.kind === "MARKET_PRICE_MOVED") return english ? "The outside price moved first. Whether the protocol sees it depends on the oracle; separate market price from oracle price." : "市场价格先动了，但协议是否看见它取决于预言机。把市场价格和预言机价格分开，是理解借贷风险的关键。";
    if (latest.kind === "ORACLE_UPDATED") return english ? "Only after the oracle update do collateral value and liquidation boundary recalculate. Deterministic execution does not make outside data timely or correct." : "预言机更新后，抵押价值和清算边界才重新计算。链上执行一致，不等于外部价格一定及时或正确。";
    if (latest.kind === "LIQUIDATED") return english ? "The liquidator repaid debt with its own credits and received collateral plus the incentive. Assets moved along the risk rule; nothing appeared from nowhere." : "清算人用自己的积分偿还债务并接收抵押品奖励。资产没有凭空消失，而是沿着风险规则转移。";
    if (latest.kind === "BAD_DEBT") return english ? "Collateral no longer covers the remaining debt. Ask which reserve, insurance fund, or participant absorbs the gap." : "抵押品已经不足以覆盖剩余债务，坏账出现了。现在要问：储备、保险或谁来承担这个缺口？";
    return english ? "After each state change, check health and conservation. Do not read risk from one price or one balance." : "每次状态变化后都检查健康度和资产守恒；不要只看一个价格或一个余额。";
  }, [english, state.events]);

  function resetScenario(nextScenario: LendingScenario) {
    setScenario(nextScenario);
    const nextState = createLendingState(91, nextScenario);
    simulation.reset(nextState);
    setMarketPrice(nextState.marketPrice);
  }

  return <section className="lending-lab" aria-label={english ? "Lending and liquidation lab" : "借贷与清算机制实验室"}>
    <div className="lending-lab__toolbar"><span><i />LENDING SIMULATION</span><span>{english ? "Virtual collateral · no advice" : "虚拟抵押 · 非投资建议"}</span><button onClick={() => resetScenario("healthy")} type="button">{english ? "Reset lab" : "重置实验"}</button></div>
    <div className="lending-scenario-switcher" role="group" aria-label={english ? "Choose lending scenario" : "选择借贷场景"}><button className={scenario === "healthy" ? "active" : ""} onClick={() => resetScenario("healthy")} type="button">{english ? "Healthy account" : "健康账户"}</button><button className={scenario === "price-shock" ? "active is-alert" : ""} onClick={() => resetScenario("price-shock")} type="button">{english ? "Price shock" : "价格冲击"}</button><button className={scenario === "stale-oracle" ? "active is-alert" : ""} onClick={() => resetScenario("stale-oracle")} type="button">{english ? "Stale oracle" : "预言机滞后"}</button></div>
    <header className="lending-lab__header"><div><small>LENDING 001 · COLLATERAL / HEALTH / LIQUIDATION</small><h3>TOKEN {english ? "collateral → credits" : "抵押借积分"}</h3><p>{english ? "Put one loan into the state machine and watch price, interest, oracle, and keeper actions reshape the account." : "把一笔借款放进状态机，观察价格、利息、预言机和清算人怎样改变同一个账户。"}</p></div><div className={`lending-health-badge is-${metrics.phase.toLowerCase()}`}><span>{english ? "Current state" : "当前状态"}</span><strong>{english ? ({ NO_DEBT: "No debt", HEALTHY: "Healthy", AT_RISK: "At risk", LIQUIDATABLE: "Liquidatable", BAD_DEBT: "Bad debt" } as Record<string, string>)[metrics.phase] : metrics.phaseLabel}</strong><small>{english ? "Health " : "健康度 "}{formatHealth(metrics.healthFactorBps)}</small></div></header>
    <RiskTimeline state={state} health={metrics.healthFactorBps} locale={locale} />
    <div className="lending-lab__metrics"><div><span>{english ? "Oracle price" : "预言机价格"}</span><strong>{formatNumber(state.oraclePrice, locale)}</strong><small>{english ? "credits / TOKEN" : "积分 / TOKEN"}</small></div><div><span>{english ? "Collateral value" : "抵押品价值"}</span><strong>{formatNumber(metrics.collateralValue, locale)}</strong><small>{state.collateralDeposited} TOKEN</small></div><div><span>{english ? "Current debt" : "当前债务"}</span><strong>{formatNumber(state.debt, locale)}</strong><small>{english ? "Available " : "可借 "}{formatNumber(metrics.availableToBorrow, locale)}</small></div><div><span>{english ? "Health" : "健康度"}</span><strong>{formatHealth(metrics.healthFactorBps)}</strong><small>{english ? "liquidation line 1.00" : "清算线 1.00"}</small></div><div><span>{english ? "Liquidation price" : "清算价格"}</span><strong>{metrics.liquidationPrice ?? "—"}</strong><small>{english ? "oracle reading" : "预言机读数"}</small></div></div>

    {focus !== "core" && <section className="lending-focus-panel" aria-label={english ? "Lesson focus experiment" : "借贷章节焦点实验"}><header><div><span>FOCUS EXPERIMENT · {focus.toUpperCase()}</span><strong>{english ? (focus === "collateral" ? "Capacity and collateral" : focus === "health" ? "Interest and health" : focus === "liquidation" ? "Liquidation boundary" : "Oracle and bad debt") : (focus === "collateral" ? "额度与抵押" : focus === "health" ? "利息与健康度" : focus === "liquidation" ? "清算边界" : "预言机与坏账")}</strong></div><p>{english ? (focus === "collateral" ? "Deposit collateral gradually and confirm that borrowing capacity is not the collateral value itself." : focus === "health" ? "Borrow, accrue interest, then use repayment to compare debt with health." : focus === "liquidation" ? "Lower the oracle price until a liquidator can take over the collateral." : "Drop the market price without updating the oracle, then compare the risk readings.") : (focus === "collateral" ? "先存入抵押品，逐步借款，确认可借额度不是抵押品价值本身。" : focus === "health" ? "借款后推进计息，再用还款比较债务和健康度。" : focus === "liquidation" ? "降低预言机价格，直到清算人可以接管抵押品。" : "先让市场价格下跌但不更新预言机，再比较风险读数。")}</p></header><div className="lending-focus-panel__actions"><button onClick={() => simulation.dispatch({ type: "DEPOSIT_COLLATERAL", amount: Math.min(100, state.walletCollateral) })} disabled={state.walletCollateral <= 0} type="button">{english ? "Deposit 100 TOKEN" : "存入 100 TOKEN"}</button><button onClick={() => simulation.dispatch({ type: "BORROW", amount: Math.min(6_000, metrics.availableToBorrow) })} disabled={metrics.availableToBorrow <= 0} type="button">{english ? "Borrow 6,000 credits" : "借 6,000 积分"}</button><button onClick={() => simulation.dispatch({ type: "ACCRUE_INTEREST" })} disabled={state.debt <= 0} type="button">{english ? "Advance one interest period" : "推进一个计息周期"}</button><button onClick={() => simulation.dispatch({ type: "LIQUIDATE" })} disabled={!metrics.canLiquidate} type="button">{english ? "Run liquidator →" : "运行清算人 →"}</button></div></section>}

    <div className="lending-lab__main"><section className="lending-position-panel"><header><strong>{english ? "Account & collateral pool" : "账户与抵押池"}</strong><span>{phaseLabel}</span></header><div className="lending-position-bars"><div><span>{english ? "Locked TOKEN" : "锁定 TOKEN"}</span><div><i style={{ width: `${collateralWidth}%` }} /></div><b>{formatNumber(state.collateralDeposited, locale)}</b></div><div><span>{english ? "Debt / value" : "债务 / 价值"}</span><div><i style={{ width: `${debtWidth}%` }} /></div><b>{formatNumber(state.debt, locale)}</b></div></div><dl className="lending-balance-grid"><div><dt>{english ? "Wallet TOKEN" : "钱包 TOKEN"}</dt><dd>{formatNumber(state.walletCollateral, locale)}</dd></div><div><dt>{english ? "Account cash" : "账户现金"}</dt><dd>{formatNumber(state.userCash, locale)}</dd></div><div><dt>{english ? "Protocol liquidity" : "协议流动性"}</dt><dd>{formatNumber(state.protocolLiquidity, locale)}</dd></div><div><dt>{english ? "Liquidator TOKEN" : "清算人 TOKEN"}</dt><dd>{formatNumber(state.liquidatorCollateral, locale)}</dd></div></dl><p>{english ? "Collateral is locked once deposited; a withdrawal first simulates the resulting health factor." : "抵押品被锁定后不能任意取出；取出动作会先模拟取出后的健康度。"}</p></section>
      <aside className="lending-action-console"><header><strong>{english ? "Operate account" : "操作账户"}</strong><span>{state.debt ? (english ? `Debt ${formatNumber(state.debt, locale)}` : `债务 ${formatNumber(state.debt)}`) : (english ? "No debt yet" : "尚未借款")}</span></header><label><span>{english ? "Deposit amount" : "存入数量"} <b>{Math.min(depositAmount, state.walletCollateral)} TOKEN</b></span><input aria-label={english ? "Collateral deposit amount" : "存入抵押品数量"} max={Math.max(1, state.walletCollateral)} min="1" onChange={(event) => setDepositAmount(Number(event.target.value))} type="range" value={Math.min(depositAmount, Math.max(1, state.walletCollateral))} /></label><button className="lending-primary-action" disabled={state.walletCollateral <= 0} onClick={() => simulation.dispatch({ type: "DEPOSIT_COLLATERAL", amount: Math.min(depositAmount, state.walletCollateral) })} type="button">{english ? "Deposit collateral →" : "存入抵押品 →"}</button><label><span>{english ? "Borrow amount" : "借款数量"} <b>{safeBorrow ? formatNumber(safeBorrow, locale) : "—"} {english ? "credits" : "积分"}</b></span><input aria-label={english ? "Borrow amount" : "借款数量"} max={Math.max(1, metrics.availableToBorrow)} min="1" onChange={(event) => setBorrowAmount(Number(event.target.value))} type="range" value={Math.min(borrowAmount, Math.max(1, metrics.availableToBorrow))} /></label><button className="lending-primary-action" disabled={safeBorrow <= 0} onClick={() => simulation.dispatch({ type: "BORROW", amount: safeBorrow })} type="button">{english ? "Borrow credits →" : "借出积分 →"}</button><div className="lending-action-row"><button disabled={state.debt <= 0 || safeRepay <= 0} onClick={() => simulation.dispatch({ type: "REPAY", amount: safeRepay })} type="button">{english ? `Repay ${safeRepay || "—"}` : `偿还 ${safeRepay || "—"}`}</button><button disabled={state.debt <= 0} onClick={() => simulation.dispatch({ type: "ACCRUE_INTEREST" })} type="button">{english ? "Accrue interest" : "推进利息"}</button></div><label><span>{english ? "Withdraw amount" : "取出数量"} <b>{safeWithdraw} TOKEN</b></span><input aria-label={english ? "Collateral withdrawal amount" : "取出抵押品数量"} max={Math.max(1, state.collateralDeposited)} min="1" onChange={(event) => setWithdrawAmount(Number(event.target.value))} type="range" value={Math.min(withdrawAmount, Math.max(1, state.collateralDeposited))} /></label><button className="lending-secondary-action" disabled={state.collateralDeposited <= 0} onClick={() => simulation.dispatch({ type: "WITHDRAW_COLLATERAL", amount: safeWithdraw })} type="button">{english ? "Try to withdraw collateral" : "尝试取出抵押品"}</button><div className="lending-invariant-status"><span>{simulation.validation.valid ? "✓" : "!"}</span><p><strong>{english ? "System check" : "系统检查"}</strong>{simulation.validation.valid ? (english ? "Credits and TOKEN conserve; state can be replayed" : "积分与 TOKEN 守恒，风险状态可重放") : simulation.validation.violations.join(english ? "; " : "；")}</p></div>{simulation.error && <p className="form-error" role="alert">{simulation.error}</p>}</aside></div>

    <section className="lending-price-panel"><header><div><span>PRICE INPUTS · ORACLE BOUNDARY</span><strong>{english ? "Market price is not protocol price" : "市场价格不等于协议价格"}</strong></div><p>{english ? `Move the outside market, then choose when the oracle updates. Current gap ${formatPercent(metrics.priceGapBps)}.` : `先移动外部市场，再决定何时让预言机更新。当前价差 ${formatPercent(metrics.priceGapBps)}。`}</p></header><div className="lending-price-controls"><label><span>{english ? "Outside market price" : "外部市场价格"} <b>{marketPrice} {english ? "credits / TOKEN" : "积分 / TOKEN"}</b></span><input aria-label={english ? "Outside market price" : "外部市场价格"} max="180" min="40" onChange={(event) => setMarketPrice(Number(event.target.value))} type="range" value={marketPrice} /></label><button onClick={() => simulation.dispatch({ type: "SET_MARKET_PRICE", price: marketPrice })} type="button">{english ? "Move market price" : "移动市场价格"}</button><button onClick={() => simulation.dispatch({ type: "UPDATE_ORACLE", price: state.marketPrice })} type="button">{english ? `Update oracle to ${state.marketPrice}` : `更新预言机为 ${state.marketPrice}`}</button></div></section>

    <section className="lending-liquidation-panel"><header><div><span>LIQUIDATION KEEPER</span><strong>{english ? "Can a liquidator take over?" : "清算人是否可以接管？"}</strong></div><p>{english ? `Line 1.00; bonus ${formatPercent(state.liquidationBonusBps)}. The button unlocks only after health crosses the boundary.` : `清算线 1.00；奖励 ${formatPercent(state.liquidationBonusBps)}。只有健康度跌破边界后，清算按钮才会变为可用。`}</p></header><div className="lending-liquidation-readout"><div><span>{english ? "Liquidator credits" : "清算人积分"}</span><strong>{formatNumber(state.liquidatorCash, locale)}</strong></div><div><span>{english ? "Liquidatable" : "可清算"}</span><strong className={metrics.canLiquidate ? "is-alert" : ""}>{metrics.canLiquidate ? "YES" : "NO"}</strong></div><div><span>{english ? "Bad debt" : "坏账"}</span><strong>{formatNumber(metrics.badDebt, locale)}</strong></div><button disabled={!metrics.canLiquidate} onClick={() => simulation.dispatch({ type: "LIQUIDATE" })} type="button">{english ? "Run liquidator →" : "运行清算人 →"}</button></div></section>

    <div className="lending-lab__coach" role="status"><span>{english ? "Observation prompt" : "观察提示"}</span><p>{coachMessage}</p></div><div className="lending-lab__lower"><LendingEventLog state={state} locale={locale} /><aside className="lending-invariant-panel"><header><strong>{english ? "Risk checks" : "风险检查"}</strong><span>STATE INVARIANTS</span></header><div className="lending-health-summary"><span className={`is-${metrics.phase.toLowerCase()}`} /> <p><strong>{phaseLabel}</strong>{metrics.healthFactorBps === null ? (english ? "No debt, so liquidation is not calculated yet." : "没有债务，尚未进入清算计算。") : (english ? `Health ${formatHealth(metrics.healthFactorBps)}; LTV ${formatPercent(metrics.loanToValueBps)}.` : `健康度 ${formatHealth(metrics.healthFactorBps)}；LTV ${formatPercent(metrics.loanToValueBps)}。`)}</p></div><dl><div><dt>{english ? "Interest accrued" : "累计利息"}</dt><dd>{formatNumber(state.totalInterestAccrued, locale)}</dd></div><div><dt>{english ? "Oracle gap" : "预言机价差"}</dt><dd>{formatPercent(metrics.priceGapBps)}</dd></div></dl>{simulation.actions.length > 0 && <button className="undo-button" onClick={() => simulation.replayTo(simulation.actions.length - 1)} type="button">{english ? "Undo last action" : "撤回上一步"}</button>}</aside></div>
    <SimulationTimeline snapshots={simulation.snapshots} actionCount={simulation.actions.length} onRewind={simulation.replayTo} journal={{ moduleId: "lending", title: english ? "Lending & liquidation free lab" : "借贷与清算自由实验", scenario: phaseLabel, note: english ? `Collateral ${state.collateralDeposited} TOKEN, debt ${state.debt} credits; oracle and liquidation boundaries recorded.` : `抵押 ${state.collateralDeposited} TOKEN，债务 ${state.debt} 积分，记录预言机与清算边界。`, labPath: "/labs/lending", stateSnapshot: lendingSpec.serialize(state), actions: simulation.actions.map((action) => JSON.stringify(action) ?? "{}"), events: state.events.slice(-8).map(({ kind, message }) => ({ kind, message: formatEvent(message, locale) })), metrics: [{ label: english ? "Health" : "健康度", value: formatHealth(metrics.healthFactorBps) }, { label: "LTV", value: formatPercent(metrics.loanToValueBps) }, { label: english ? "Oracle price" : "预言机价格", value: `${state.oraclePrice} ${english ? "credits" : "积分"}` }, { label: english ? "Current debt" : "当前债务", value: `${state.debt} ${english ? "credits" : "积分"}` }, { label: english ? "Bad debt" : "坏账", value: `${metrics.badDebt} ${english ? "credits" : "积分"}` }], insight: english ? "Lending risk is the intersection of collateral, growing debt, and price inputs; liquidation and bad debt are traceable state transitions." : "借贷风险来自抵押品、债务增长和价格输入的交叉；清算与坏账是可追踪的状态转换。" }} />
  </section>;
}
