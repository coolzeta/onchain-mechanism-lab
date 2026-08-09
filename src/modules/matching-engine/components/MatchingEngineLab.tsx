"use client";

import { useMemo, useState } from "react";
import { useSimulation } from "@/platform/simulation/useSimulation";
import { SimulationTimeline } from "@/platform/simulation/SimulationTimeline";
import { activeAsks, activeBids, createMatchingEngineState, matchingEngineSpec } from "../core/engine";
import type { EngineOrder, OrderSide, MatchingEngineState } from "../core/types";

export type MatchingEngineFocus = "core" | "market" | "depth" | "risk";

const formatNumber = (value: number, locale = "zh") => value.toLocaleString(locale === "en" ? "en-US" : "zh-CN");

function formatEvent(message: string, locale: string) {
  if (locale !== "en") return message;
  return message
    .replaceAll("你", "You")
    .replaceAll("的买入", "'s buy")
    .replaceAll("的卖出", "'s sell")
    .replaceAll(" 的新订单会与自己的订单成交，已取消新订单剩余", "'s new order would self-trade; cancelled remaining")
    .replaceAll("LAB。", " LAB.")
    .replaceAll("积分。", " credits.")
    .replaceAll("分。", ".")
    .replaceAll(" 与 ", " and ")
    .replaceAll("成交采用静止订单价格：", "Execution uses the resting order price: ")
    .replaceAll("的", "'s ")
    .replaceAll("成交", " filled ")
    .replaceAll("提交", " submitted ")
    .replaceAll("限价单", "limit order")
    .replaceAll("市价单", "market order")
    .replaceAll("立即吃掉可用深度", "to consume available depth immediately")
    .replaceAll("市价单剩余", "Market order remainder")
    .replaceAll("没有对手方，按 IOC 规则取消，冻结资产已释放", "has no counterparty; IOC cancelled it and released frozen assets")
    .replaceAll("撤掉", "cancelled")
    .replaceAll("以新价格重新排队", "and re-queued at a new price")
    .replaceAll("重新提交", " resubmitted ")
    .replaceAll("时间优先级重新开始", "with a new time priority")
    .replaceAll("撤销", "cancelled")
    .replaceAll("的剩余订单", " remaining order")
    .replaceAll("盘口创建：", "Book created: ")
    .replaceAll("卖一", "best ask")
    .replaceAll("买一", "best bid")
    .replaceAll("两个价位相同的订单", "two orders at the same price")
    .replaceAll("价格和时间都需要被保留", "price and time priority must be preserved");
}

function OrderBook({ state, locale = "zh" }: { state: MatchingEngineState; locale?: string }) {
  const english = locale === "en";
  const asks = activeAsks(state);
  const bids = activeBids(state);
  const rows = Math.max(asks.length, bids.length, 3);
  const row = (order: EngineOrder | undefined, side: OrderSide, index: number) => order ? <div className={`engine-book__row ${side === "BUY" ? "is-buy" : "is-sell"}`} key={order.id}><span>{order.price}</span><b>{order.remaining}</b><small>{order.traderId === "you" ? (english ? "You" : "你") : order.traderId === "maker-a" ? "A" : "B"}</small></div> : <div className="engine-book__row is-empty" key={`${side}-empty-${index}`}><span>—</span><b>—</b><small>{english ? "Empty" : "空"}</small></div>;
  return <section className="engine-book" aria-label={english ? "Limit order book" : "限价订单簿"}><header><strong>{english ? "Live order book" : "实时订单簿"}</strong><span>{english ? "Price / remaining / source" : "价格 / 剩余 / 来源"}</span></header><div className="engine-book__labels"><span>{english ? "Asks (SELL)" : "卖单（ASK）"}</span><span>{english ? "Bids (BUY)" : "买单（BID）"}</span></div><div className="engine-book__columns"><div>{Array.from({ length: rows }, (_, index) => row(asks[index], "SELL", index))}</div><div>{Array.from({ length: rows }, (_, index) => row(bids[index], "BUY", index))}</div></div><footer><span><i className="is-sell" />{english ? "Best ask: " : "卖一："}{asks[0]?.price ?? "—"}</span><span><i className="is-buy" />{english ? "Best bid: " : "买一："}{bids[0]?.price ?? "—"}</span></footer></section>;
}

function EngineEventLog({ state, locale = "zh" }: { state: MatchingEngineState; locale?: string }) {
  const english = locale === "en";
  return <div className="engine-event-log" aria-live="polite"><header><strong>{english ? "Engine events" : "引擎事件"}</strong><span>{state.events.length} EVENTS</span></header><ol>{state.events.slice(-9).reverse().map((event) => <li key={event.id}><span>{String(event.index).padStart(2, "0")}</span><p>{formatEvent(event.message, locale)}</p></li>)}</ol></div>;
}

export function MatchingEngineLab({ focus = "core", locale = "zh" }: { focus?: MatchingEngineFocus; locale?: string }) {
  const english = locale === "en";
  const simulation = useSimulation(matchingEngineSpec, createMatchingEngineState(41));
  const [side, setSide] = useState<OrderSide>("BUY");
  const [price, setPrice] = useState(104);
  const [quantity, setQuantity] = useState(6);
  const [depthQuantity, setDepthQuantity] = useState(5);
  const [riskPrice, setRiskPrice] = useState(100);
  const metrics = simulation.metrics;
  const you = simulation.state.traders.find((trader) => trader.id === "you");
  const userOrders = simulation.state.orders.filter((order) => order.traderId === "you" && order.remaining > 0);
  const riskOrder = userOrders.find((order) => order.orderType === "LIMIT");
  const safePrice = Math.max(1, Math.min(999, price));
  const safeQuantity = Math.max(1, Math.min(20, quantity));
  const coachMessage = useMemo(() => {
    const latest = simulation.state.events.at(-1);
    if (!latest || latest.kind === "BOOK_CREATED") return english ? "Read the book first: best ask is the lowest sell, best bid is the highest buy. Matching starts only when buy price reaches sell price." : "先读盘口：卖一是当前最低卖价，买一是当前最高买价。只有买价不低于卖价时，撮合循环才会启动。";
    if (latest.kind === "MAKER_PRICE") return english ? "Execution uses the resting order price. A new order can take the queue, but its own limit does not rewrite the fill price." : "成交价采用静止订单价格。新订单可以主动吃掉队列，但不能把自己的限价改写成成交价。";
    if (latest.kind === "ORDER_CANCELLED") return english ? "Cancellation changes no historical fill; it only releases the frozen assets for the remainder. The book is current state, while the fill log is irreversible history." : "撤单没有改变历史成交，只释放了剩余数量对应的冻结资产。订单簿是当前状态，成交日志是不可逆的历史。";
    return english ? "Orders are accepted first, then queued by price and time. One action can create several fills—or only a partial fill." : "订单先被接受，再按价格优先、时间优先进入队列。一个动作可能产生多笔成交，也可能只成交一部分。";
  }, [english, simulation.state.events]);

  function submitOrder() {
    simulation.dispatch({ type: "PLACE_LIMIT", traderId: "you", side, price: safePrice, quantity: safeQuantity });
  }

  function submitMarketOrder() {
    simulation.dispatch({ type: "PLACE_MARKET", traderId: "you", side: "BUY", quantity: 12 });
  }

  function queueRiskOrder() {
    simulation.dispatch({ type: "PLACE_LIMIT", traderId: "you", side: "BUY", price: 100, quantity: 2 });
  }

  function replaceRiskOrder() {
    if (!riskOrder) return;
    simulation.dispatch({ type: "REPLACE_ORDER", orderId: riskOrder.id, price: riskPrice, quantity: 2 });
  }

  function submitDepthProbe() {
    simulation.dispatch({ type: "PLACE_MARKET", traderId: "you", side: "BUY", quantity: depthQuantity });
  }

  return <section className="matching-engine-lab" aria-label={english ? "Matching engine lab" : "撮合引擎实验室"}>
    <div className="matching-engine-lab__toolbar"><span><i />ENGINE RUNNING</span><span>LAB / {english ? "credits" : "积分"}</span><button onClick={() => simulation.reset(createMatchingEngineState(41))} type="button">{english ? "Reset lab" : "重置实验"}</button></div>
    <header className="matching-engine-lab__header"><div><small>ORDERBOOK 001 · PRICE / TIME PRIORITY</small><h3>LAB / {english ? "credits" : "积分"}</h3><p>{english ? "Limit orders enter the queue; only a crossed book turns them into fills." : "限价订单先进入队列；只有盘口交叉，撮合引擎才会把它们变成成交。"}</p></div><div className="engine-last-price"><span>{english ? "Last trade" : "最近成交"}</span><strong>{metrics.lastPrice ?? "—"}</strong><small>{english ? "credits / LAB" : "分 / LAB"}</small></div></header>
    <div className="matching-engine-lab__metrics"><div><span>{english ? "Best bid" : "买一"}</span><strong>{metrics.bestBid ?? "—"}</strong><small>{english ? "highest buy" : "最高买价"}</small></div><div><span>{english ? "Best ask" : "卖一"}</span><strong>{metrics.bestAsk ?? "—"}</strong><small>{english ? "lowest sell" : "最低卖价"}</small></div><div><span>{english ? "Spread" : "价差"}</span><strong>{metrics.spread ?? "—"}</strong><small>{english ? "ticks" : "分"}</small></div><div><span>{english ? "Traded" : "已成交"}</span><strong>{metrics.tradedQuantity}</strong><small>LAB</small></div></div>

    {focus !== "core" && <section className="matching-engine-focus-panel" aria-label={english ? "Lesson focus experiment" : "本章焦点实验"}>
      {focus === "market" && <>
        <div><span className="focus-panel__eyebrow">MARKET ORDER · IOC</span><h4>{english ? "A market order walks the ask levels" : "市价单会沿着卖盘逐档成交"}</h4><p>{english ? "It does not write a price into the book; it consumes visible depth immediately. Unfilled remainder does not quietly become a limit order." : "它不把价格写进订单簿，而是立即消耗当下可见的深度；没有成交的剩余部分不会悄悄变成挂单。"}</p></div>
        <div className="matching-engine-focus-panel__actions"><button onClick={submitMarketOrder} type="button">{english ? "Market buy 12 LAB" : "市价买入 12 LAB"}</button><button onClick={() => simulation.reset(createMatchingEngineState(41))} type="button">{english ? "Reset asks" : "重置卖盘"}</button></div>
        <div className="matching-engine-focus-panel__stats"><span>{english ? "Best-ask depth" : "卖一深度"} <b>{metrics.bestAskDepth} LAB</b></span><span>{english ? "Last market average" : "最近市价均价"} <b>{metrics.lastExecution?.orderType === "MARKET" && metrics.lastExecution.averagePrice !== null ? `${metrics.lastExecution.averagePrice.toFixed(2)} ${english ? "credits" : "分"}` : "—"}</b></span><span>{english ? "Cancelled remainder" : "未成交并取消"} <b>{metrics.lastExecution?.orderType === "MARKET" ? metrics.lastExecution.remainingQuantity : "—"} LAB</b></span></div>
      </>}
      {focus === "depth" && <>
        <div><span className="focus-panel__eyebrow">DEPTH · IMPACT</span><h4>{english ? "Can one buy cross several price levels?" : "同一个“买入”会不会穿过多个价格档位？"}</h4><p>{english ? "Read best-ask size, then adjust the depth probe. Only when it reaches 105 does average execution rise above the first quote." : "先看卖一有多少数量，再调整深度探针。只有跨到 105 分档位时，平均执行价才会高于第一档报价。"}</p></div>
        <div className="matching-engine-focus-panel__controls"><label><span>{english ? "Depth probe" : "深度探针数量"} <b>{depthQuantity} LAB</b></span><input aria-label={english ? "Depth probe quantity" : "深度探针数量"} type="range" min="1" max="8" value={depthQuantity} onChange={(event) => setDepthQuantity(Number(event.target.value))} /></label><button onClick={submitDepthProbe} type="button">{english ? "Sweep asks with market order" : "用市价单扫过卖盘"}</button><button onClick={() => simulation.reset(createMatchingEngineState(41))} type="button">{english ? "Restore three levels" : "恢复三档盘口"}</button></div>
        <div className="matching-engine-focus-panel__stats"><span>{english ? "Best-ask size" : "卖一数量"} <b>{metrics.bestAskDepth} LAB</b></span><span>{english ? "Estimated average for 5 LAB" : "5 LAB 预估均价"} <b>{metrics.probeAveragePrice ?? (english ? "Not enough depth" : "深度不足")}{metrics.probeAveragePrice !== null ? ` ${english ? "credits" : "分"}` : ""}</b></span><span>{english ? "Impact vs. best ask" : "相对卖一冲击"} <b>{metrics.probeImpactBps === null ? "—" : `${metrics.probeImpactBps} bps`}</b></span></div>
      </>}
      {focus === "risk" && <>
        <div><span className="focus-panel__eyebrow">CANCEL · REPLACE · SELF-TRADE</span><h4>{english ? "Repricing is a new queue entry" : "改价不是“编辑”，而是一次新的排队"}</h4><p>{english ? "Cancel-replace releases the old freeze and re-enters with a new sequence. If the new price crosses the book, self-trade protection still applies." : "撤改单会释放旧订单的冻结资产，并用新的序号重新进入队列。若新价格穿过盘口，系统仍会执行自成交保护。"}</p></div>
        <div className="matching-engine-focus-panel__controls"><button disabled={Boolean(riskOrder)} onClick={queueRiskOrder} type="button">{english ? "Queue bid 100 × 2" : "先挂买单 100 × 2"}</button><label><span>{english ? "New price" : "改成价格"} <b>{riskPrice} {english ? "credits" : "分"}</b></span><input aria-label={english ? "New price" : "改成价格"} type="range" min="99" max="104" value={riskPrice} onChange={(event) => setRiskPrice(Number(event.target.value))} /></label><button disabled={!riskOrder} onClick={replaceRiskOrder} type="button">{english ? "Cancel-replace" : "撤改单并重新排队"}</button><button onClick={() => simulation.reset(createMatchingEngineState(41))} type="button">{english ? "Reset risk lab" : "重置风控实验"}</button></div>
        <div className="matching-engine-focus-panel__stats"><span>{english ? "Current order" : "当前挂单"} <b>{riskOrder ? `${riskOrder.price} ${english ? "credits" : "分"} · #${riskOrder.sequence}` : (english ? "None" : "无")}</b></span><span>{english ? "Last action" : "最近动作"} <b>{metrics.lastExecution?.orderType ?? "—"}</b></span><span>{english ? "System state" : "系统状态"} <b>{simulation.validation.valid ? (english ? "Conserved, no crossing" : "守恒且无交叉") : (english ? "Check required" : "需要检查")}</b></span></div>
      </>}
    </section>}

    <div className="matching-engine-lab__main"><OrderBook state={simulation.state} locale={locale} /><aside className="engine-order-console"><header><strong>{english ? "Place a limit order" : "提交一张限价单"}</strong><span>{english ? "Your account" : "你的账户"}</span></header><div className="engine-tabs"><button className={side === "BUY" ? "active is-buy" : ""} onClick={() => { setSide("BUY"); setPrice(104); }} type="button">{english ? "Buy LAB" : "买入 LAB"}</button><button className={side === "SELL" ? "active is-sell" : ""} onClick={() => { setSide("SELL"); setPrice(99); }} type="button">{english ? "Sell LAB" : "卖出 LAB"}</button></div><label><span>{english ? "Limit" : "限价"} <b>{safePrice} {english ? "credits" : "分"}</b></span><input aria-label={english ? "Limit price" : "限价"} max="999" min="1" onChange={(event) => setPrice(Number(event.target.value))} type="range" value={safePrice} /></label><label><span>{english ? "Quantity" : "数量"} <b>{safeQuantity} LAB</b></span><input aria-label={english ? "Order quantity" : "订单数量"} max="20" min="1" onChange={(event) => setQuantity(Number(event.target.value))} type="range" value={safeQuantity} /></label><div className="engine-order-preview"><span>{english ? "This order" : "这张订单"}</span><strong>{side === "BUY" ? (english ? "Buy" : "买入") : (english ? "Sell" : "卖出")} {safeQuantity} LAB @ {safePrice} {english ? "credits" : "分"}</strong><small>{side === "BUY" ? (english ? `Max freeze ${formatNumber(safePrice * safeQuantity, locale)} credits` : `最多冻结 ${formatNumber(safePrice * safeQuantity)} 积分`) : (english ? `Max freeze ${safeQuantity} LAB` : `最多冻结 ${safeQuantity} LAB`)}</small></div><button className={`engine-submit ${side === "BUY" ? "is-buy" : "is-sell"}`} onClick={submitOrder} type="button">{english ? "Submit and match →" : "提交并运行撮合 →"}</button><div className="engine-balance"><span>{english ? "Available credits" : "可用积分"} <b>{formatNumber((you?.cash ?? 0) - (you?.reservedCash ?? 0), locale)}</b></span><span>{english ? "Available LAB" : "可用 LAB"} <b>{formatNumber((you?.asset ?? 0) - (you?.reservedAsset ?? 0), locale)}</b></span></div></aside></div>

    <div className="matching-engine-lab__coach" role="status"><span>{english ? "Coach" : "观察提示"}</span><p>{coachMessage}</p></div>

    <div className="matching-engine-lab__lower"><EngineEventLog state={simulation.state} locale={locale} /><aside className="engine-account-console"><header><strong>{english ? "Your resting orders" : "你的挂单"}</strong><span>{userOrders.length} ACTIVE</span></header>{userOrders.length ? <ul>{userOrders.map((order) => <li key={order.id}><div><strong>{order.side === "BUY" ? (english ? "Buy" : "买") : (english ? "Sell" : "卖")} {order.remaining} LAB @ {order.price}</strong><small>{english ? "Sequence" : "序号"} #{order.sequence}</small></div><button onClick={() => simulation.dispatch({ type: "CANCEL_ORDER", orderId: order.id })} type="button">{english ? "Cancel" : "撤单"}</button></li>)}</ul> : <p className="engine-empty">{english ? "No resting orders. Submit BUY 104 for 6 and watch it consume the two same-price asks." : "没有等待中的订单。提交一张买入 104 分、数量 6 的订单，观察它如何吃掉两个同价卖单。"}</p>}<div className="engine-invariant-status"><span>{simulation.validation.valid ? "✓" : "!"}</span><p><strong>{english ? "System check" : "系统检查"}</strong>{simulation.validation.valid ? (english ? "No crossed book; cash and LAB conserved" : "订单簿无交叉，现金与 LAB 守恒") : simulation.validation.violations.join(english ? "; " : "；")}</p></div>{simulation.error && <p className="form-error" role="alert">{english ? "The engine rejected this action. Check available balance and price limits." : simulation.error}</p>}{simulation.actions.length > 0 && <button className="undo-button" onClick={() => simulation.replayTo(simulation.actions.length - 1)} type="button">{english ? "Undo previous step" : "撤回上一步"}</button>}</aside></div>
    <SimulationTimeline snapshots={simulation.snapshots} actionCount={simulation.actions.length} onRewind={simulation.replayTo} journal={{ moduleId: "matching-engine", title: english ? "Matching engine free lab" : "撮合引擎自由实验", scenario: english ? "Price priority · time priority" : "价格优先 · 时间优先", note: english ? "Capture order-book depth, partial fills, cancellations, and risk controls." : "记录订单簿深度、部分成交、撤单与风险控制的当前状态。", labPath: "/labs/matching-engine", stateSnapshot: matchingEngineSpec.serialize(simulation.state), actions: simulation.actions.map((action) => JSON.stringify(action) ?? "{}"), events: simulation.state.events.slice(-8).map(({ kind, message }) => ({ kind, message: formatEvent(message, locale) })), metrics: [{ label: english ? "Best bid" : "买一", value: metrics.bestBid === null ? "—" : `${metrics.bestBid}` }, { label: english ? "Best ask" : "卖一", value: metrics.bestAsk === null ? "—" : `${metrics.bestAsk}` }, { label: english ? "Spread" : "价差", value: metrics.spread === null ? "—" : `${metrics.spread} ${english ? "credits" : "分"}` }, { label: english ? "Traded" : "已成交", value: `${metrics.tradedQuantity} LAB` }], insight: english ? "Price only means something when it fills against real depth; market orders consume levels one by one." : "价格只有在真实深度中成交才有意义；市价单会逐档消耗流动性。" }} />
  </section>;
}
