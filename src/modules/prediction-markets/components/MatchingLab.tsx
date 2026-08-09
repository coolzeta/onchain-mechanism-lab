"use client";

import { createScenarioState, predictionMarketSpec } from "../core/engine";
import { useSimulation } from "@/platform/simulation/useSimulation";
import { EventLog, OrderBookView, PriceGauge } from "./MarketPanels";

export function MatchingLab({ locale = "zh" }: { locale?: "zh" | "en" }) {
  const english = locale === "en";
  const simulation = useSimulation(predictionMarketSpec, createScenarioState(11, "thin"));
  const hasCarolOrder = simulation.state.orders.some((order) => order.traderId === "carol");
  return (
    <section className="interactive-panel matching-lab" aria-label={english ? "Order matching lab" : "订单撮合实验"}>
      <header><span>{english ? "Matching console" : "撮合观察台"}</span><strong>{english ? "Price priority · time priority" : "价格优先 · 时间优先"}</strong></header>
      <PriceGauge locale={locale} state={simulation.state} />
      <div className="matching-lab__grid"><OrderBookView locale={locale} state={simulation.state} /><EventLog locale={locale} state={simulation.state} limit={4} /></div>
      <div className="lab-actions">
        <button disabled={hasCarolOrder} onClick={() => simulation.dispatch({ type: "PLACE_ORDER", traderId: "carol", outcome: "YES", price: 70, quantity: 1 })} type="button">{english ? "Carol: BUY YES @70" : "Carol：买 YES @70"}</button>
        <button onClick={() => simulation.dispatch({ type: "PLACE_ORDER", traderId: "bob", outcome: "NO", price: 55, quantity: 2 })} type="button">{english ? "Bob: BUY NO @55 ×2" : "Bob：买 NO @55 ×2"}</button>
        <button className="ghost-action" onClick={() => simulation.reset(createScenarioState(11, "thin"))} type="button">{english ? "Reset" : "重置"}</button>
      </div>
      {simulation.error && <p className="form-error" role="alert">{simulation.error}</p>}
      <p className="panel-note">{english ? "Watch the best quotes first, then submit an order that crosses the spread. The trade uses the price of the order that was resting earlier." : "先观察最优价格，再点击一张会穿过价差的订单。成交价采用更早进入订单簿的那张订单价格。"}</p>
    </section>
  );
}
