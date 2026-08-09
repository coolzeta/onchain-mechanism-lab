"use client";

import { activeAsks, activeBids, deriveMetrics } from "../core/engine";
import type { PredictionMarketState } from "../core/types";
import type { SimulationEvent } from "@/platform/simulation/types";

type Locale = "zh" | "en";

export function PriceGauge({ state, locale = "zh" }: { state: PredictionMarketState; locale?: Locale }) {
  const english = locale === "en";
  const metrics = deriveMetrics(state);
  return (
    <div className="price-gauge">
      <div><span>{english ? "YES implied price" : "YES 隐含价格"}</span><strong>{metrics.impliedPrice}</strong><small>/ 100</small></div>
      <div className="price-gauge__bar"><span style={{ width: `${metrics.impliedPrice}%` }} /></div>
      <p><span>{english ? "Best bid" : "买一"} {metrics.bestBid ?? "—"}</span><span>{english ? "Best ask" : "卖一"} {metrics.bestAsk ?? "—"}</span><span>{english ? "Spread" : "价差"} {metrics.spread ?? "—"}</span></p>
    </div>
  );
}

export function OrderBookView({ state, onCancel, locale = "zh" }: { state: PredictionMarketState; onCancel?: (orderId: string) => void; locale?: Locale }) {
  const english = locale === "en";
  const bids = activeBids(state).slice(0, 5);
  const asks = activeAsks(state).slice(0, 5);
  const traderName = (id: string) => id === "you" && english ? "You" : state.traders.find((trader) => trader.id === id)?.name ?? id;
  return (
    <div className="orderbook" aria-label={english ? "YES order book" : "YES 订单簿"}>
      <header><strong>{english ? "YES order book" : "YES 订单簿"}</strong><span>{english ? "Price / quantity" : "价格 / 数量"}</span></header>
      <div className="orderbook__columns">
        <section><h4>{english ? "BIDS" : "买单 BIDS"}</h4>{bids.length ? bids.map((order) => <div className="book-row bid" key={order.id}><span>{traderName(order.traderId)}</span><b>{order.yesPrice}</b><em>{order.remaining}</em>{onCancel && order.traderId === "you" && <button onClick={() => onCancel(order.id)} type="button">{english ? "Cancel" : "撤"}</button>}</div>) : <p>{english ? "No bids" : "暂无买单"}</p>}</section>
        <section><h4>{english ? "ASKS" : "卖单 ASKS"}</h4>{asks.length ? asks.map((order) => <div className="book-row ask" key={order.id}><span>{traderName(order.traderId)}</span><b>{order.yesPrice}</b><em>{order.remaining}</em>{onCancel && order.traderId === "you" && <button onClick={() => onCancel(order.id)} type="button">{english ? "Cancel" : "撤"}</button>}</div>) : <p>{english ? "No asks" : "暂无卖单"}</p>}</section>
      </div>
      <footer>{english ? "BUY NO @ q appears as SELL YES @ 100−q" : "买 NO @ q 会显示为卖 YES @ 100−q"}</footer>
    </div>
  );
}

export function ParticipantTable({ state, locale = "zh" }: { state: PredictionMarketState; locale?: Locale }) {
  const english = locale === "en";
  return (
    <div className="participant-table">
      <header><strong>{english ? "Accounts and positions" : "账户与头寸"}</strong><span>{english ? "Credits / YES / NO" : "积分 / YES / NO"}</span></header>
      {state.traders.map((trader) => (
        <div key={trader.id}>
          <span className="participant-avatar">{trader.avatar}</span>
          <strong>{trader.id === "you" && english ? "You" : trader.name}</strong>
          <span>{trader.credits - trader.reservedCredits} <small>{trader.reservedCredits ? `(+${trader.reservedCredits} ${english ? "reserved" : "冻结"})` : ""}</small></span>
          <b>{trader.yesShares}</b><b>{trader.noShares}</b>
        </div>
      ))}
    </div>
  );
}

function eventMessage(event: SimulationEvent, english: boolean) {
  if (!english) return event.message;
  if (event.kind === "MARKET_CREATED") return "Market created: Will humans return to the Moon before 2028?";
  if (event.kind === "COLLATERAL_LOCKED") {
    const amount = event.message.match(/(\d+)/)?.[1] ?? "?";
    return `${amount} credits locked in the settlement contract.`;
  }
  if (event.kind === "ORDER_SUBMITTED") {
    const match = event.message.match(/(.+?) 提交：买 (YES|NO) (\d+) 份，最高 (\d+) 积分/);
    return match ? `${match[1] === "你" ? "You" : match[1]} submitted: BUY ${match[2]} ${match[3]} shares, max ${match[4]} credits.` : "Order submitted to the book.";
  }
  if (event.kind === "ORDER_MATCHED") {
    const match = event.message.match(/(.+?) 与 (.+?) 成交 (\d+) 份：YES (\d+)，NO (\d+)/);
    return match ? `Trade matched between ${match[1] === "你" ? "You" : match[1]} and ${match[2] === "你" ? "You" : match[2]}: ${match[3]} shares, YES ${match[4]}, NO ${match[5]}.` : "Orders matched.";
  }
  if (event.kind === "ORDER_CANCELLED") {
    const match = event.message.match(/(.+?) 撤销了剩余 (\d+) 份/);
    return match ? `${match[1] === "你" ? "You" : match[1]} cancelled ${match[2]} remaining shares.` : "Remaining order cancelled.";
  }
  if (event.kind === "MARKET_RESOLVED") {
    const outcome = event.message.match(/(YES|NO)/)?.[1] ?? "?";
    return `Oracle reported the final result: ${outcome}. Unfilled orders were cancelled.`;
  }
  if (event.kind === "PAYOUT_REDEEMED") {
    const match = event.message.match(/(.+?) 用 (\d+) 份获胜头寸领取 (\d+) 积分/);
    return match ? `${match[1] === "你" ? "You" : match[1]} redeemed ${match[2]} winning shares for ${match[3]} credits.` : "Payout redeemed.";
  }
  return event.message;
}

export function EventLog({ state, limit = 6, locale = "zh" }: { state: PredictionMarketState; limit?: number; locale?: Locale }) {
  const english = locale === "en";
  return (
    <div className="event-log" aria-live="polite">
      <header><strong>{english ? "Event log" : "事件记录"}</strong><span>{state.events.length} EVENTS</span></header>
      <ol>{state.events.slice(-limit).reverse().map((event) => <li key={event.id}><span>{String(event.index).padStart(2, "0")}</span><p>{eventMessage(event, english)}</p></li>)}</ol>
    </div>
  );
}
