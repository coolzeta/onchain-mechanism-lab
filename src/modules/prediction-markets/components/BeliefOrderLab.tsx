"use client";

import { useMemo, useState } from "react";

export function BeliefOrderLab({ locale = "zh" }: { locale?: "zh" | "en" }) {
  const english = locale === "en";
  const [belief, setBelief] = useState(68);
  const [confidence, setConfidence] = useState(4);
  const quote = Math.max(1, Math.min(99, belief - Math.round((6 - confidence) * 2.5)));
  const quantity = confidence * 2;
  const action = belief >= 50 ? "YES" : "NO";
  const outcomeQuote = action === "YES" ? quote : 100 - quote;
  const explanation = useMemo(() => english ? (confidence > 3 ? "You are willing to express the view with more quantity." : "You have a view, but do not want to take much risk.") : (confidence > 3 ? "你愿意用更大的数量表达观点。" : "你有判断，但不想承担太多风险。"), [confidence, english]);
  return (
    <section className="interactive-panel belief-lab" aria-label={english ? "Belief to order lab" : "信念到订单实验"}>
      <header><span>{english ? "Translate a view into an order" : "把想法翻译成订单"}</span><strong>{english ? "A quote ≠ a slogan" : "报价 ≠ 口号"}</strong></header>
      <div className="belief-controls">
        <label className="range-label"><span>{english ? "Your YES belief" : "你认为 YES 的可能性"}</span><b>{belief}%</b><input min="5" max="95" value={belief} onChange={(event) => setBelief(Number(event.target.value))} type="range" /></label>
        <label className="range-label"><span>{english ? "Confidence in the judgment" : "你对判断的信心"}</span><b>{confidence}/5</b><input min="1" max="5" value={confidence} onChange={(event) => setConfidence(Number(event.target.value))} type="range" /></label>
      </div>
      <div className="order-ticket"><small>{english ? "Generated limit order" : "生成的限价订单"}</small><strong>{english ? `BUY ${action} · ${quantity} shares` : `买 ${action} · ${quantity} 份`}</strong><span>{english ? `Maximum ${outcomeQuote} credits per share` : `最高支付 ${outcomeQuote} 积分/份`}</span></div>
      <p className="panel-note">{english ? "Belief chooses the direction, the limit sets the most you will pay, and quantity sets how much a wrong judgment can cost. " : "信念决定你偏向哪一边，限价决定你最多愿意付多少，数量决定判断错误时会损失多少。"}{explanation}</p>
    </section>
  );
}
