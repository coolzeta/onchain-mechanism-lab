"use client";

import { useMemo, useState } from "react";
import { useSimulation } from "@/platform/simulation/useSimulation";
import { SimulationTimeline } from "@/platform/simulation/SimulationTimeline";
import { createStablecoinState, stablecoinSpec } from "../core/engine";
import type { StablecoinScenario, StablecoinState } from "../core/types";

const formatNumber = (value: number, locale = "zh") => value.toLocaleString(locale === "en" ? "en-US" : "zh-CN");
const formatDollar = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const formatPercent = (bps: number) => `${(bps / 100).toFixed(2)}%`;
const formatRatio = (bps: number | null) => bps === null ? "—" : `${(bps / 100).toFixed(2)}%`;

export type StablecoinFocus = "core" | "peg" | "collateral" | "depeg" | "reserve";

function formatEvent(message: string, locale: string) {
  if (locale !== "en") return message;
  return message
    .replaceAll("USD-LAB 创建", "USD-LAB created")
    .replaceAll("实验预设", "Preset")
    .replaceAll("目标价格", "target price")
    .replaceAll("发行必须由抵押品支持", "minting must be backed by collateral")
    .replaceAll("支持", "supports")
    .replaceAll("先从一笔已有发行开始观察边界", "start from an existing position")
    .replaceAll("市场上的 USD-LAB 交易价格跌到", "USD-LAB market price fell to")
    .replaceAll("美元，但协议仍允许按规则赎回", " USD, while protocol redemption remains available")
    .replaceAll("抵押品外部价格已经变化，但协议仍读取旧的预言机价格", "outside collateral price moved while the protocol still reads the old oracle")
    .replaceAll("先观察足额抵押，再连续赎回，追踪储备和供应如何一起收缩", "watch full collateral, then redeem repeatedly to track reserves and supply shrinking")
    .replaceAll("你存入", "You deposited")
    .replaceAll("储备可以支持更多", "Reserves can support more")
    .replaceAll("协议发行", "Protocol minted")
    .replaceAll("抵押率为", "collateral ratio")
    .replaceAll("你销毁", "You burned")
    .replaceAll("取回", "and received")
    .replaceAll("供应量减少，储备同步收缩", "supply fell and reserves contracted")
    .replaceAll("市场交易价格变为", "Market price moved to")
    .replaceAll("协议目标仍是", "protocol target remains")
    .replaceAll("预言机更新为", "Oracle updated to")
    .replaceAll("抵押率重新计算", "collateral ratio recalculated")
    .replaceAll("储备损失", "Reserve loss")
    .replaceAll("供应未自动减少，抵押率暴露真实风险", "supply did not shrink automatically; the ratio exposes the real risk")
    .replaceAll("美元", "USD")
    .replaceAll("抵押品", "collateral")
    .replaceAll("储备", "reserve")
    .replaceAll("发行", "minting")
    .replaceAll("供应", "supply")
    .replaceAll("，", ", ")
    .replaceAll("。", ".");
}

function StablecoinEventLog({ state, locale = "zh" }: { state: StablecoinState; locale?: string }) {
  const english = locale === "en";
  return <div className="stablecoin-event-log" aria-live="polite"><header><strong>{english ? "Stablecoin events" : "稳定币事件"}</strong><span>{state.events.length} EVENTS</span></header><ol>{state.events.slice(-9).reverse().map((event) => <li key={event.id}><span>{String(event.index).padStart(2, "0")}</span><p>{formatEvent(event.message, locale)}</p></li>)}</ol></div>;
}

function StablecoinTimeline({ state, locale = "zh" }: { state: StablecoinState; locale?: string }) {
  const english = locale === "en";
  const stages = [
    { label: english ? "Collateral" : "抵押", done: state.reserveCollateral > 0 },
    { label: english ? "Minting" : "发行", done: state.supply > 0 },
    { label: english ? "Market price" : "市场价格", done: state.marketPriceCents !== state.targetPriceCents },
    { label: english ? "Redemption" : "赎回", done: state.totalRedemptions > 0 },
  ];
  return <div className="stablecoin-stage-timeline" aria-label={english ? "Stablecoin mechanism lifecycle" : "稳定币机制流程"}>{stages.map((stage, index) => <div className={stage.done ? "is-done" : ""} key={stage.label}><span>{stage.done ? "✓" : String(index + 1).padStart(2, "0")}</span><strong>{stage.label}</strong>{index < stages.length - 1 && <i aria-hidden="true" />}</div>)}</div>;
}

export function StablecoinLab({ focus = "core", locale = "zh" }: { focus?: StablecoinFocus; locale?: string }) {
  const english = locale === "en";
  const [scenario, setScenario] = useState<StablecoinScenario>("healthy");
  const [depositAmount, setDepositAmount] = useState(100);
  const [mintAmount, setMintAmount] = useState(60);
  const [redeemAmount, setRedeemAmount] = useState(100);
  const [marketPriceCents, setMarketPriceCents] = useState(100);
  const [lossAmount, setLossAmount] = useState(20);
  const simulation = useSimulation(stablecoinSpec, createStablecoinState(303, scenario));
  const state = simulation.state;
  const metrics = simulation.metrics;
  const safeDeposit = Math.min(Math.max(1, depositAmount), state.walletCollateral);
  const safeMint = Math.min(Math.max(1, mintAmount), metrics.availableToMint);
  const safeRedeem = Math.min(Math.max(1, redeemAmount), state.userStable);
  const safeLoss = Math.min(Math.max(1, lossAmount), state.reserveCollateral);
  const reserveWidth = Math.min(100, Math.max(3, (state.reserveCollateral / state.initialCollateral) * 100));
  const supplyWidth = Math.min(100, Math.max(3, (state.supply / Math.max(1, metrics.maxMint)) * 100));
  const phaseLabel = english ? ({ EMPTY: "Not minted", HEALTHY: "Stable", AT_RISK: "Thin buffer", UNDERCOLLATERALIZED: "Undercollateralized", DEPEGGED: "Depegged", ORACLE_STALE: "Stale oracle" } as Record<string, string>)[metrics.phase] : metrics.phaseLabel;
  const coachMessage = useMemo(() => {
    const latest = state.events.at(-1);
    if (!latest || latest.kind === "STABLECOIN_CREATED") return english ? "Deposit collateral, then mint USD-LAB. Target, market, and oracle prices are three different states." : "先存入抵押品，再发行一笔 USD-LAB。注意：目标价格、市场价格和预言机价格是三条不同的状态。";
    if (latest.kind === "COLLATERAL_DEPOSITED") return english ? "Reserves are now inside the protocol. The issuance ceiling comes from the minimum ratio, not wallet balance." : "储备已经进入协议。发行上限由最低抵押率决定，不是由钱包余额决定。";
    if (latest.kind === "STABLECOIN_MINTED") return english ? "Minting increased supply and your balance, but did not create reserves. Now move the market price away from $1." : "发行增加了供应和你的稳定币余额，但没有凭空增加储备。现在可以把市场价格推离 1 美元。";
    if (latest.kind === "MARKET_PRICE_MOVED") return english ? "The market can depeg; writing a target of 1.00 does not rewrite an external market." : "市场价格可以脱锚；协议不会因为目标价格写成 1.00 就自动改写外部市场。";
    if (latest.kind === "STABLECOIN_REDEEMED") return english ? "Redemption burns supply and releases reserves, creating an arbitrage direction; it still depends on reserves, fees, and price inputs." : "赎回销毁供应并释放储备，提供了套利方向；它仍然受储备、费用和价格输入限制。";
    if (latest.kind === "RESERVE_LOSS") return english ? "Reserve loss does not automatically reduce liabilities, so the collateral ratio exposes the system's real buffer." : "储备损失不会自动减少负债，所以抵押率会暴露系统的真实缓冲。";
    if (latest.kind === "ORACLE_UPDATED") return english ? "An oracle update changes reserve valuation; it does not automatically restore market liquidity or confidence." : "预言机更新只改变协议如何估值储备，不会自动修复市场流动性或参与者信心。";
    return english ? "Read supply, reserves, collateral ratio, and price gap together; stability is not one number." : "每一步都同时看供应、储备、抵押率和价格差；稳定不是一个单独的数字。";
  }, [english, state.events]);

  function resetScenario(nextScenario: StablecoinScenario) {
    setScenario(nextScenario);
    const nextState = createStablecoinState(303, nextScenario);
    simulation.reset(nextState);
    setMarketPriceCents(nextState.marketPriceCents);
  }

  return <section className="stablecoin-lab" aria-label={english ? "Stablecoin mechanism lab" : "稳定币机制实验室"}>
    <div className="stablecoin-lab__toolbar"><span><i />STABLECOIN SIMULATION</span><span>{english ? "Virtual reserves · no advice" : "虚拟储备 · 非投资建议"}</span><button onClick={() => resetScenario("healthy")} type="button">{english ? "Reset lab" : "重置实验"}</button></div>
    <div className="stablecoin-scenario-switcher" role="group" aria-label={english ? "Choose stablecoin scenario" : "选择稳定币场景"}><button className={scenario === "healthy" ? "active" : ""} onClick={() => resetScenario("healthy")} type="button">{english ? "Fresh mint" : "空白发行"}</button><button className={scenario === "depeg" ? "active is-alert" : ""} onClick={() => resetScenario("depeg")} type="button">{english ? "Market depeg" : "市场脱锚"}</button><button className={scenario === "stale-oracle" ? "active is-alert" : ""} onClick={() => resetScenario("stale-oracle")} type="button">{english ? "Stale oracle" : "预言机滞后"}</button><button className={scenario === "reserve-run" ? "active is-alert" : ""} onClick={() => resetScenario("reserve-run")} type="button">{english ? "Redemption run" : "连续赎回"}</button></div>
    <header className="stablecoin-lab__header"><div><small>STABLECOIN 001 · PEG / RESERVE / REDEMPTION</small><h3>COLLATERAL → USD-LAB</h3><p>{english ? "Put a one-dollar target stablecoin into a state machine and watch minting, price, redemption, and reserves define the stability boundary." : "把一枚目标为 1 美元的稳定币放进状态机，观察发行、价格、赎回和储备如何共同决定稳定边界。"}</p></div><div className={`stablecoin-status-badge is-${metrics.phase.toLowerCase()}`}><span>{english ? "Current state" : "当前状态"}</span><strong>{phaseLabel}</strong><small>{english ? "Ratio " : "抵押率 "}{formatRatio(metrics.collateralRatioBps)}</small></div></header>
    <StablecoinTimeline state={state} locale={locale} />
    <div className="stablecoin-lab__metrics"><div><span>{english ? "Target price" : "目标价格"}</span><strong>{formatDollar(state.targetPriceCents)}</strong><small>{english ? "protocol target" : "协议目标"}</small></div><div><span>{english ? "Market price" : "市场价格"}</span><strong>{formatDollar(state.marketPriceCents)}</strong><small>{english ? "Gap " : "价差 "}{formatPercent(metrics.pegGapBps)}</small></div><div><span>{english ? "Circulating supply" : "流通供应"}</span><strong>{formatNumber(state.supply, locale)}</strong><small>USD-LAB</small></div><div><span>{english ? "Reserve value" : "储备价值"}</span><strong>{formatDollar(metrics.collateralValueCents)}</strong><small>{state.reserveCollateral} COLLATERAL</small></div><div><span>{english ? "Available to mint" : "可发行"}</span><strong>{formatNumber(metrics.availableToMint, locale)}</strong><small>{english ? "minimum ratio 150%" : "最低抵押率 150%"}</small></div></div>

    {focus !== "core" && <section className="stablecoin-focus-panel" aria-label={english ? "Stablecoin focus experiment" : "稳定币章节焦点实验"}><header><div><span>FOCUS EXPERIMENT · {focus.toUpperCase()}</span><strong>{english ? (focus === "peg" ? "Target and redemption" : focus === "collateral" ? "Collateral and minting" : focus === "depeg" ? "Depeg and arbitrage" : "Reserves and run") : (focus === "peg" ? "目标与赎回" : focus === "collateral" ? "抵押与发行" : focus === "depeg" ? "脱锚与套利" : "储备与挤兑")}</strong></div><p>{english ? (focus === "peg" ? "Build an issuance and redemption path, then see how a target price becomes executable." : focus === "collateral" ? "Deposit collateral, mint gradually, and find the 150% ratio ceiling." : focus === "depeg" ? "Push the market below target, then compare redemption with supply contraction." : "Apply reserve loss and redeem repeatedly to expose coverage and remaining reserves.") : (focus === "peg" ? "先形成一条发行与赎回路径，再观察目标价格如何被兑现。" : focus === "collateral" ? "存入抵押品，逐步发行，找到 150% 抵押率上限。" : focus === "depeg" ? "把市场价格压到目标以下，再比较赎回和供应收缩。" : "施加储备损失并连续赎回，观察抵押率和剩余储备。")}</p></header><div className="stablecoin-focus-panel__actions"><button onClick={() => simulation.dispatch({ type: "DEPOSIT_COLLATERAL", amount: Math.min(100, state.walletCollateral) })} disabled={state.walletCollateral <= 0} type="button">{english ? "Deposit 100 collateral" : "存入 100 抵押品"}</button><button onClick={() => simulation.dispatch({ type: "MINT_STABLE", amount: Math.min(60, metrics.availableToMint) })} disabled={metrics.availableToMint <= 0} type="button">{english ? "Mint 60 USD-LAB" : "发行 60 USD-LAB"}</button><button onClick={() => simulation.dispatch({ type: "REDEEM_STABLE", amount: Math.min(10, state.userStable) })} disabled={!metrics.canRedeem} type="button">{english ? "Redeem 10 →" : "赎回 10 →"}</button><button onClick={() => simulation.dispatch({ type: "APPLY_RESERVE_LOSS", amount: Math.min(20, state.reserveCollateral) })} disabled={state.reserveCollateral <= 0} type="button">{english ? "Apply reserve loss" : "施加储备损失"}</button></div></section>}

    <div className="stablecoin-lab__main"><section className="stablecoin-reserve-panel"><header><strong>{english ? "Reserves & supply" : "储备与供应"}</strong><span>{phaseLabel}</span></header><div className="stablecoin-position-bars"><div><span>{english ? "Reserve COLLATERAL" : "储备 COLLATERAL"}</span><div><i style={{ width: `${reserveWidth}%` }} /></div><b>{formatNumber(state.reserveCollateral, locale)}</b></div><div><span>{english ? "Supply / mint ceiling" : "供应 / 发行上限"}</span><div><i style={{ width: `${supplyWidth}%` }} /></div><b>{formatNumber(state.supply, locale)}</b></div></div><dl className="stablecoin-balance-grid"><div><dt>{english ? "Wallet collateral" : "钱包抵押品"}</dt><dd>{formatNumber(state.walletCollateral, locale)}</dd></div><div><dt>{english ? "Your USD-LAB" : "你的 USD-LAB"}</dt><dd>{formatNumber(state.userStable, locale)}</dd></div><div><dt>{english ? "Lost reserves" : "已损失储备"}</dt><dd>{formatNumber(state.lostCollateral, locale)}</dd></div><div><dt>{english ? "Total redeemed" : "累计赎回"}</dt><dd>{formatNumber(state.totalRedemptions, locale)}</dd></div></dl><p>{english ? "Supply is a protocol promise; reserves are the assets actually available at exit. Keep both on the same ledger." : "供应是协议承诺，储备是退出时真正可处置的资产；两者必须放在同一张账上。"}</p></section>
      <aside className="stablecoin-action-console"><header><strong>{english ? "Operate account" : "操作账户"}</strong><span>{state.supply ? (english ? `Supply ${formatNumber(state.supply, locale)}` : `供应 ${formatNumber(state.supply)}`) : (english ? "Not minted yet" : "尚未发行")}</span></header><label><span>{english ? "Deposit collateral" : "存入抵押品"} <b>{safeDeposit} TOKEN</b></span><input aria-label={english ? "Collateral deposit amount" : "存入抵押品数量"} max={Math.max(1, state.walletCollateral)} min="1" onChange={(event) => setDepositAmount(Number(event.target.value))} type="range" value={Math.min(depositAmount, Math.max(1, state.walletCollateral))} /></label><button className="stablecoin-primary-action" disabled={state.walletCollateral <= 0} onClick={() => simulation.dispatch({ type: "DEPOSIT_COLLATERAL", amount: safeDeposit })} type="button">{english ? "Deposit collateral →" : "存入抵押品 →"}</button><label><span>{english ? "Mint amount" : "发行数量"} <b>{safeMint ? formatNumber(safeMint, locale) : "—"} USD-LAB</b></span><input aria-label={english ? "Stablecoin mint amount" : "发行稳定币数量"} max={Math.max(1, metrics.availableToMint)} min="1" onChange={(event) => setMintAmount(Number(event.target.value))} type="range" value={Math.min(mintAmount, Math.max(1, metrics.availableToMint))} /></label><button className="stablecoin-primary-action" disabled={safeMint <= 0} onClick={() => simulation.dispatch({ type: "MINT_STABLE", amount: safeMint })} type="button">{english ? "Mint stablecoins →" : "发行稳定币 →"}</button><label><span>{english ? "Redeem amount" : "赎回数量"} <b>{safeRedeem || "—"} USD-LAB</b></span><input aria-label={english ? "Stablecoin redemption amount" : "赎回稳定币数量"} max={Math.max(1, state.userStable)} min="1" onChange={(event) => setRedeemAmount(Number(event.target.value))} type="range" value={Math.min(redeemAmount, Math.max(1, state.userStable))} /></label><button className="stablecoin-secondary-action" disabled={!metrics.canRedeem} onClick={() => simulation.dispatch({ type: "REDEEM_STABLE", amount: safeRedeem })} type="button">{english ? "Burn and redeem →" : "销毁并赎回 →"}</button><div className="stablecoin-invariant-status"><span>{simulation.validation.valid ? "✓" : "!"}</span><p><strong>{english ? "System check" : "系统检查"}</strong>{simulation.validation.valid ? (english ? "Collateral, supply, and events can be replayed" : "抵押品、供应和事件可以重放") : simulation.validation.violations.join(english ? "; " : "；")}</p></div>{simulation.error && <p className="form-error" role="alert">{simulation.error}</p>}</aside></div>

    <section className="stablecoin-price-panel"><header><div><span>PRICE INPUTS · PEG BOUNDARY</span><strong>{english ? "Target price is not market price" : "目标价格不等于市场价格"}</strong></div><p>{english ? `Move the outside market, then choose when the oracle updates. Current deviation ${formatPercent(metrics.pegGapBps)}.` : `先移动外部市场，再决定何时更新预言机。当前偏离 ${formatPercent(metrics.pegGapBps)}。`}</p></header><div className="stablecoin-price-controls"><label><span>{english ? "Outside market price" : "外部市场价格"} <b>{formatDollar(marketPriceCents)}</b></span><input aria-label={english ? "Outside market price" : "外部市场价格"} max="115" min="70" onChange={(event) => setMarketPriceCents(Number(event.target.value))} type="range" value={marketPriceCents} /></label><button onClick={() => simulation.dispatch({ type: "SET_MARKET_PRICE", priceCents: marketPriceCents })} type="button">{english ? "Move market price" : "移动市场价格"}</button><button onClick={() => simulation.dispatch({ type: "UPDATE_ORACLE", priceCents: state.marketPriceCents })} type="button">{english ? "Update oracle" : "更新预言机"}</button></div></section>

    <section className="stablecoin-reserve-risk-panel"><header><div><span>RESERVE RISK · RUN SCENARIO</span><strong>{english ? "Who reaches the boundary after reserve loss?" : "储备损失会把谁推向边界？"}</strong></div><p>{english ? "Supply does not shrink automatically when reserves are lost. Apply loss, redeem part of the balance, and inspect coverage and exit capacity." : "供应不会因为储备损失自动减少。施加损失后，再赎回一部分，观察抵押率和退出容量。"}</p></header><div className="stablecoin-risk-readout"><div><span>{english ? "Collateral ratio" : "抵押率"}</span><strong>{formatRatio(metrics.collateralRatioBps)}</strong></div><div><span>{english ? "Reserve coverage" : "储备覆盖"}</span><strong>{formatRatio(metrics.reserveCoverageBps)}</strong></div><div><span>{english ? "Redeemable collateral" : "可赎回抵押品"}</span><strong>{formatNumber(metrics.redeemableCollateral, locale)}</strong></div><label><span>{english ? "Loss amount" : "损失数量"} <b>{safeLoss} TOKEN</b></span><input aria-label={english ? "Reserve loss amount" : "储备损失数量"} max={Math.max(1, state.reserveCollateral)} min="1" onChange={(event) => setLossAmount(Number(event.target.value))} type="range" value={Math.min(lossAmount, Math.max(1, state.reserveCollateral))} /></label><button disabled={state.reserveCollateral <= 0} onClick={() => simulation.dispatch({ type: "APPLY_RESERVE_LOSS", amount: safeLoss })} type="button">{english ? "Apply reserve loss →" : "施加储备损失 →"}</button></div></section>

    <div className="stablecoin-lab__coach" role="status"><span>{english ? "Observation prompt" : "观察提示"}</span><p>{coachMessage}</p></div><div className="stablecoin-lab__lower"><StablecoinEventLog state={state} locale={locale} /><aside className="stablecoin-invariant-panel"><header><strong>{english ? "Risk checks" : "风险检查"}</strong><span>STATE INVARIANTS</span></header><div className="stablecoin-health-summary"><span className={`is-${metrics.phase.toLowerCase()}`} /><p><strong>{phaseLabel}</strong>{metrics.collateralRatioBps === null ? (english ? "No supply is minted yet; start with collateral." : "还没有发行供应，先形成一笔抵押。") : (english ? `Ratio ${formatRatio(metrics.collateralRatioBps)}; target ${formatDollar(state.targetPriceCents)}.` : `抵押率 ${formatRatio(metrics.collateralRatioBps)}；目标 ${formatDollar(state.targetPriceCents)}。`)}</p></div><dl><div><dt>{english ? "Total redeemed" : "累计赎回"}</dt><dd>{formatNumber(state.totalRedemptions, locale)}</dd></div><div><dt>{english ? "Redemption fees" : "赎回费用"}</dt><dd>{formatNumber(state.totalFeesCollateral, locale)}</dd></div></dl>{simulation.actions.length > 0 && <button className="stablecoin-undo-button" onClick={() => simulation.replayTo(simulation.actions.length - 1)} type="button">{english ? "Undo last action" : "撤回上一步"}</button>}</aside></div>
    <SimulationTimeline snapshots={simulation.snapshots} actionCount={simulation.actions.length} onRewind={simulation.replayTo} journal={{ moduleId: "stablecoins", title: english ? "Stablecoin free lab" : "稳定币自由实验", scenario: phaseLabel, note: english ? `Supply ${state.supply} USD-LAB, reserves ${state.reserveCollateral} COLLATERAL, market price ${formatDollar(state.marketPriceCents)}.` : `供应 ${state.supply} USD-LAB，储备 ${state.reserveCollateral} COLLATERAL，市场价 ${formatDollar(state.marketPriceCents)}。`, labPath: "/labs/stablecoins", stateSnapshot: stablecoinSpec.serialize(state), actions: simulation.actions.map((action) => JSON.stringify(action) ?? "{}"), events: state.events.slice(-8).map(({ kind, message }) => ({ kind, message: formatEvent(message, locale) })), metrics: [{ label: english ? "Market price" : "市场价格", value: formatDollar(state.marketPriceCents) }, { label: english ? "Collateral ratio" : "抵押率", value: formatRatio(metrics.collateralRatioBps) }, { label: english ? "Supply" : "供应", value: `${state.supply} USD-LAB` }, { label: english ? "Reserves" : "储备", value: `${state.reserveCollateral} COLLATERAL` }, { label: english ? "Total redeemed" : "累计赎回", value: `${state.totalRedemptions} USD-LAB` }], insight: english ? "Target, market, reserve, supply, and oracle inputs must be read together; any one of them can mislead when detached from context." : "稳定币的目标价格、市场价格、储备、供应和预言机输入必须同时观察；任何一项脱离上下文都可能误导。" }} />
  </section>;
}
