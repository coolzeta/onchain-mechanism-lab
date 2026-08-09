"use client";

import { useMemo, useState } from "react";
import { useSimulation } from "@/platform/simulation/useSimulation";
import { SimulationTimeline } from "@/platform/simulation/SimulationTimeline";
import { ammSpec, createAMMState, quoteSwap } from "../core/engine";
import type { AMMState, SwapDirection } from "../core/types";

const formatNumber = (value: number, locale = "zh") => value.toLocaleString(locale === "en" ? "en-US" : "zh-CN");
const formatPrice = (scaled: number) => (scaled / 1_000).toFixed(2);

export type AMMFocus = "core" | "slippage" | "lp" | "arbitrage";

function formatEvent(message: string, locale: string) {
  if (locale !== "en") return message;
  return message
    .replaceAll("积分", "credits")
    .replace("资金池创建：", "Pool created: ")
    .replace("初始价格为", "initial price ")
    .replace("积分 / TOKEN。", "credits / TOKEN.")
    .replace("你用", "You used")
    .replace("你用 ", "You used ")
    .replace("套利者用", "Arbitrageur used")
    .replace("换得", "to receive")
    .replace("手续费", "fee")
    .replace("这笔交易的价格冲击约为", "This trade's price impact is about")
    .replace("你存入", "You deposited")
    .replace("获得", "and received")
    .replace("你移除", "You removed")
    .replace("取回", "and withdrew")
    .replace("套利者把池内价格从", "Arbitrageur moved the pool price from")
    .replace("拉向", "toward")
    .replace("池内价格已经接近外部价格", "Pool price is already close to external price");
}

function AMMEventLog({ state, locale = "zh" }: { state: AMMState; locale?: string }) {
  const english = locale === "en";
  return <div className="amm-event-log" aria-live="polite"><header><strong>{english ? "Pool events" : "池子事件"}</strong><span>{state.events.length} EVENTS</span></header><ol>{state.events.slice(-7).reverse().map((event) => <li key={event.id}><span>{String(event.index).padStart(2, "0")}</span><p>{formatEvent(event.message, locale)}</p></li>)}</ol></div>;
}

export function AMMLab({ focus = "core", locale = "zh" }: { focus?: AMMFocus; locale?: string }) {
  const english = locale === "en";
  const simulation = useSimulation(ammSpec, createAMMState(17));
  const [direction, setDirection] = useState<SwapDirection>("X_TO_Y");
  const [amountIn, setAmountIn] = useState(12_000);
  const [targetExternalPrice, setTargetExternalPrice] = useState(150);
  const trader = simulation.state.trader;
  const maxInput = direction === "X_TO_Y" ? Math.max(1, Math.min(20_000, trader.xBalance)) : Math.max(1, Math.min(150, trader.yBalance));
  const safeAmount = Math.min(amountIn, maxInput);
  const quote = useMemo(() => {
    try { return { value: quoteSwap(simulation.state, direction, safeAmount), error: null }; }
    catch (cause) { return { value: null, error: cause instanceof Error ? cause.message : "暂时无法报价。" }; }
  }, [direction, safeAmount, simulation.state]);
  const metrics = simulation.metrics;
  const poolXWidth = Math.min(100, Math.max(8, (simulation.state.reserveX / 150_000) * 100));
  const poolYWidth = Math.min(100, Math.max(8, (simulation.state.reserveY / 1_500) * 100));
  const coachMessage = useMemo(() => {
    const latest = simulation.state.events.at(-1);
    if (!latest || latest.kind === "POOL_CREATED") return english ? "Start with the two reserves, then drag the swap size. Small trades stay near the spot price; large trades travel farther along the curve." : "先看池子的两种储备，再拖动交换数量。小额交易靠近现货价，大额交易会沿曲线越走越远。";
    if (latest.kind === "SWAP") return english ? "A trade does not search for another order. It changes the pool reserves directly, so the next quote starts from a new state." : "交易没有寻找另一个订单，而是直接改变池子的储备。下一笔报价会以新的储备为起点。";
    if (latest.kind === "SLIPPAGE") return english ? "Price impact is now visible: this pool is not infinitely deep, so size buys you immediacy at a worse average price." : "价格冲击已经很明显：同一个池子不是无限深度，交易者用规模换取确定的成交。";
    if (latest.kind === "LIQUIDITY_ADDED") return english ? "An LP deposits both assets and receives a proportional claim on fees and inventory changes." : "LP 把两种资产一起存入池子，获得按比例分配手续费和库存变化的份额。";
    return english ? "Removing liquidity returns both reserves in proportion to your LP shares. If price moved, the asset mix you receive also changes." : "移除流动性会按 LP 份额取回两种储备；如果价格发生过变化，取回的资产比例也会改变。";
  }, [english, simulation.state.events]);

  return (
    <section className="amm-lab" aria-label={english ? "Constant-product AMM lab" : "恒定乘积 AMM 实验室"}>
      <div className="amm-lab__toolbar"><span><i />SIMULATION ACTIVE</span><span>{english ? "0.30% fee" : "0.30% 交易费"}</span><button onClick={() => simulation.reset(createAMMState(17))} type="button">{english ? "Reset lab" : "重置实验"}</button></div>
      <header className="amm-lab__header"><div><small>POOL 001 · CONSTANT PRODUCT</small><h3>Credits / TOKEN</h3><p>{english ? "The pool does not wait for another order. Its reserve ratio produces the next quote." : "池子不需要等待另一个人挂单，它用储备比例给出下一笔报价。"}</p></div><div className="amm-lab__spot"><span>{english ? "Spot price" : "现货价格"}</span><strong>{formatPrice(metrics.spotPriceXPerYScaled)}</strong><small>{english ? "credits / TOKEN" : "积分 / TOKEN"}</small></div></header>

      <div className="amm-lab__metrics"><div><span>{english ? "Credits reserve" : "积分储备"}</span><strong>{formatNumber(simulation.state.reserveX, locale)}</strong><small>X</small></div><div><span>{english ? "TOKEN reserve" : "TOKEN 储备"}</span><strong>{formatNumber(simulation.state.reserveY, locale)}</strong><small>Y</small></div><div><span>{english ? "Fees collected" : "手续费累计"}</span><strong>{formatNumber(metrics.totalFeesX + metrics.totalFeesY, locale)}</strong><small>{english ? "in pool" : "池内资产"}</small></div><div><span>{english ? "k growth" : "k 增长"}</span><strong>{(metrics.invariantGrowthBps / 100).toFixed(2)}%</strong><small>{english ? "vs. initial pool" : "相对初始池子"}</small></div></div>

      <div className="amm-lab__middle"><div className="amm-pool-view"><header><strong>{english ? "Reserves in motion" : "储备正在移动"}</strong><span>x · y = {formatNumber(metrics.invariant, locale)}</span></header><div className="amm-pool-view__bars"><div><span>{english ? "Credits" : "积分"}</span><div><i style={{ width: `${poolXWidth}%` }} /></div><b>{formatNumber(simulation.state.reserveX, locale)}</b></div><div><span>TOKEN</span><div><i style={{ width: `${poolYWidth}%` }} /></div><b>{formatNumber(simulation.state.reserveY, locale)}</b></div></div><p>{english ? "Swap fees stay in the pool and slowly grow k; adding or removing liquidity also changes the reserve scale." : "交换手续费会留在池子里，让 k 缓慢增长；存入或取出流动性也会改变储备规模。"}</p></div>
        <aside className="amm-trade-console"><div className="amm-trade-console__tabs"><button className={direction === "X_TO_Y" ? "active" : ""} onClick={() => { setDirection("X_TO_Y"); setAmountIn(12_000); }} type="button">{english ? "Buy TOKEN with credits" : "用积分买 TOKEN"}</button><button className={direction === "Y_TO_X" ? "active" : ""} onClick={() => { setDirection("Y_TO_X"); setAmountIn(40); }} type="button">{english ? "Buy credits with TOKEN" : "用 TOKEN 买积分"}</button></div><label><span>{english ? "Input amount" : "输入数量"} <b>{formatNumber(safeAmount, locale)}</b></span><input aria-label={english ? "Swap amount" : "交换数量"} max={maxInput} min="1" onChange={(event) => setAmountIn(Number(event.target.value))} type="range" value={safeAmount} /></label><div className="amm-quote"><div><span>{english ? "Estimated output" : "预计得到"}</span><strong>{quote.value ? formatNumber(quote.value.amountOut, locale) : "—"}</strong><small>{direction === "X_TO_Y" ? "TOKEN" : english ? "credits" : "积分"}</small></div><dl><div><dt>{english ? "Fee" : "手续费"}</dt><dd>{quote.value ? formatNumber(quote.value.fee, locale) : "—"}</dd></div><div><dt>{english ? "Price impact" : "价格冲击"}</dt><dd>{quote.value ? `${(quote.value.priceImpactBps / 100).toFixed(2)}%` : "—"}</dd></div></dl></div>{quote.error && <p className="form-error" role="alert">{english ? "This quote is unavailable. Try a smaller amount." : quote.error}</p>}<button className="amm-swap-button" disabled={!quote.value} onClick={() => simulation.dispatch({ type: "SWAP", direction, amountIn: safeAmount })} type="button">{english ? "Execute swap →" : "执行交换 →"}</button></aside></div>

      {focus === "slippage" && <section className="amm-focus-panel" aria-label={english ? "Slippage comparison" : "滑点对比实验"}><header><div><span className="eyebrow">COMPARE THREE SIZES</span><h4>{english ? "One curve, three trade sizes" : "同一条曲线，三种交易规模"}</h4></div><p>{english ? "Choose a preset, execute the swap, and compare average execution price with price impact." : "先点一个预设，再执行交换；比较平均执行价和价格冲击如何一起变化。"}</p></header><div className="amm-focus-panel__actions"><button onClick={() => setAmountIn(1_200)} type="button">{english ? "Small · 1,200" : "小单 · 1,200"}</button><button onClick={() => setAmountIn(12_000)} type="button">{english ? "Medium · 12,000" : "中单 · 12,000"}</button><button onClick={() => setAmountIn(20_000)} type="button">{english ? "Large · 20,000" : "大单 · 20,000"}</button></div><div className="amm-focus-panel__readout"><span>{english ? "Current average execution price" : "当前平均执行价"}</span><strong>{quote.value ? `${formatPrice(quote.value.executionPriceScaled)} ${english ? "credits / TOKEN" : "积分 / TOKEN"}` : "—"}</strong><span>{english ? "Spot price before" : "交易前现货价"} {formatPrice(metrics.spotPriceXPerYScaled)}</span></div></section>}

      {focus === "lp" && <section className="amm-focus-panel" aria-label={english ? "LP inventory comparison" : "LP 持仓对照"}><header><div><span className="eyebrow">LP INVENTORY CHECK</span><h4>{english ? "What does your share represent now?" : "你的份额现在对应什么？"}</h4></div><p>{english ? "Deposit the suggested ratio, execute a few trades, and value your pool position against a hold-only baseline." : "先存入 LP，再执行几笔交易；这个对照把池内持仓和单纯持有基准都按当前价格估值。"}</p></header><div className="amm-focus-panel__stats"><div><span>{english ? "Credits withdrawable" : "可取回积分"}</span><strong>{formatNumber(metrics.lpPositionX, locale)}</strong></div><div><span>{english ? "TOKEN withdrawable" : "可取回 TOKEN"}</span><strong>{formatNumber(metrics.lpPositionY, locale)}</strong></div><div><span>{english ? "Pool position value" : "池内持仓价值"}</span><strong>{formatNumber(metrics.lpPositionValueX, locale)}</strong></div><div><span>{english ? "vs. hold baseline" : "相对持有基准"}</span><strong className={metrics.lpValueDeltaBps < 0 ? "is-negative" : ""}>{(metrics.lpValueDeltaBps / 100).toFixed(2)}%</strong></div></div></section>}

      {focus === "arbitrage" && <section className="amm-focus-panel" aria-label={english ? "Arbitrage and external price" : "套利与外部价格实验"}><header><div><span className="eyebrow">EXTERNAL PRICE · ARBITRAGE</span><h4>{english ? "Pull the pool price back to the market" : "把池内价格拉回外部市场"}</h4></div><p>{english ? "Move the external price, then run the arbitrageur. It pays fees and uses its own assets to rebalance the pool." : "移动外部价格，再运行一次套利者。套利者会支付手续费，并用自己的资产改变池子储备。"}</p></header><div className="amm-arbitrage-controls"><label><span>{english ? "External price" : "外部价格"} <b>{targetExternalPrice} {english ? "credits / TOKEN" : "积分 / TOKEN"}</b></span><input aria-label={english ? "External price" : "外部价格"} max="200" min="80" onChange={(event) => setTargetExternalPrice(Number(event.target.value))} type="range" value={targetExternalPrice} /></label><button onClick={() => simulation.dispatch({ type: "ARBITRAGE_TO_PRICE", targetPriceScaled: targetExternalPrice * 1_000 })} type="button">{english ? "Run arbitrageur →" : "运行套利者 →"}</button></div><div className="amm-focus-panel__stats"><div><span>{english ? "Pool price" : "池内价格"}</span><strong>{formatPrice(metrics.spotPriceXPerYScaled)}</strong></div><div><span>{english ? "External price" : "外部价格"}</span><strong>{formatPrice(metrics.externalPriceScaled)}</strong></div><div><span>{english ? "Price gap" : "价格差"}</span><strong className={Math.abs(metrics.priceGapBps) > 10 ? "is-negative" : ""}>{(metrics.priceGapBps / 100).toFixed(2)}%</strong></div><div><span>{english ? "Arbitrageur credits" : "套利者积分"}</span><strong>{formatNumber(simulation.state.arbitrageur.xBalance, locale)}</strong></div></div>{simulation.error && <p className="form-error" role="alert">{english ? "The arbitrageur cannot reach that price with its current balance." : simulation.error}</p>}</section>}

      <div className="amm-lab__coach" role="status"><span>{english ? "Coach" : "观察提示"}</span><p>{coachMessage}</p></div>

      <div className="amm-lab__lower"><AMMEventLog state={simulation.state} locale={locale} /><aside className="amm-liquidity-console"><header><strong>{english ? "Become an LP" : "成为 LP"}</strong><span>{english ? "Liquidity shares" : "流动性份额"}</span></header><p>{english ? "Deposit both assets near the current ratio and watch the LP shares you receive." : "存入接近当前比例的两种资产，观察你获得的 LP 份额。"}</p><div className="amm-liquidity-preset"><span>{english ? "Suggested deposit" : "建议存入"}</span><strong>{english ? "12,000 credits + 100 TOKEN" : "12,000 积分 + 100 TOKEN"}</strong></div><button onClick={() => simulation.dispatch({ type: "ADD_LIQUIDITY", amountX: 12_000, amountY: 100 })} type="button">{english ? "Deposit and mint LP" : "存入并获得 LP"}</button>{trader.lpShares > 0 && <><div className="amm-lp-balance">{english ? "Your LP shares" : "你的 LP 份额"} <strong>{formatNumber(trader.lpShares, locale)}</strong></div><button className="ghost-action" onClick={() => simulation.dispatch({ type: "REMOVE_LIQUIDITY", shares: Math.max(1, Math.floor(trader.lpShares / 2)) })} type="button">{english ? "Withdraw half liquidity" : "取回一半流动性"}</button></>}<div className="invariant-status"><span>{simulation.validation.valid ? "✓" : "!"}</span><p><strong>{english ? "System check" : "系统检查"}</strong>{simulation.validation.valid ? (english ? "Assets conserved; pool state is valid" : "资产守恒，池子状态有效") : simulation.validation.violations.join(english ? "; " : "；")}</p></div>{simulation.actions.length > 0 && <button className="undo-button" onClick={() => simulation.replayTo(simulation.actions.length - 1)} type="button">{english ? "Undo previous step" : "撤回上一步"}</button>}</aside></div>
      <SimulationTimeline snapshots={simulation.snapshots} actionCount={simulation.actions.length} onRewind={simulation.replayTo} journal={{ moduleId: "amm", title: english ? "AMM free lab" : "AMM 自由实验", scenario: english ? "Credits / TOKEN constant-product pool" : "积分 / TOKEN 恒定乘积池", note: english ? "Capture reserves, price impact, fees, and LP inventory." : "记录储备、滑点、手续费与 LP 库存的当前状态。", labPath: "/labs/amm", stateSnapshot: ammSpec.serialize(simulation.state), actions: simulation.actions.map((action) => JSON.stringify(action) ?? "{}"), events: simulation.state.events.slice(-8).map(({ kind, message }) => ({ kind, message: formatEvent(message, locale) })), metrics: [{ label: english ? "Pool spot price" : "池内现货价", value: `${formatPrice(metrics.spotPriceXPerYScaled)} ${english ? "credits / TOKEN" : "积分 / TOKEN"}` }, { label: english ? "Credits reserve" : "积分储备", value: formatNumber(simulation.state.reserveX, locale) }, { label: english ? "TOKEN reserve" : "TOKEN 储备", value: formatNumber(simulation.state.reserveY, locale) }, { label: english ? "Fees collected" : "累计手续费", value: formatNumber(metrics.totalFeesX + metrics.totalFeesY, locale) }], insight: english ? "AMM depth comes from reserves; trade size moves the curve and changes the next quote." : "AMM 的深度来自储备；交易规模会沿曲线改变下一笔报价。" }} />
    </section>
  );
}
