"use client";

import { useState } from "react";

const cases = {
  deep: { label: "参与充分", englishLabel: "Deep participation", price: 68, people: 324, depth: "深", englishDepth: "deep", note: "参与者多、买卖价差小，单个交易者较难推动价格。它仍不是事实，但通常包含更多分散信息。", englishNote: "Many participants and a tight spread make it harder for one trader to move the price. It is still not a fact, but it may contain more dispersed information." },
  thin: { label: "流动性很薄", englishLabel: "Thin liquidity", price: 84, people: 9, depth: "浅", englishDepth: "thin", note: "只需少量资金就能吃掉卖单。84 更可能说明订单簿很空，而不是世界突然改变。", englishNote: "A small amount of capital can consume the asks. 84 may say more about an empty book than a sudden change in the world." },
  whale: { label: "大户冲击", englishLabel: "Whale impact", price: 91, people: 57, depth: "失衡", englishDepth: "imbalanced", note: "一名参与者愿意付出很高成本表达观点。价格反映了资金与信念，不是一人一票。", englishNote: "One participant is willing to pay a high cost to express a view. Price reflects capital and belief, not one-person-one-vote." },
} as const;

export function ProbabilityLab({ locale = "zh" }: { locale?: "zh" | "en" }) {
  const english = locale === "en";
  const [caseId, setCaseId] = useState<keyof typeof cases>("deep");
  const current = cases[caseId];
  return (
    <section className="interactive-panel probability-lab" aria-label={english ? "Price and probability lab" : "价格与概率实验"}>
      <header><span>{english ? "One number, different markets" : "同一个数字，不同的市场"}</span><strong>{english ? "Ask where the price came from" : "先问价格从哪里来"}</strong></header>
      <div className="scenario-tabs">{Object.entries(cases).map(([id, item]) => <button aria-pressed={id === caseId} key={id} onClick={() => setCaseId(id as keyof typeof cases)} type="button">{english ? item.englishLabel : item.label}</button>)}</div>
      <div className="probability-case"><div><small>{english ? "YES market price" : "YES 市场价格"}</small><strong>{current.price}</strong><span>≈ {current.price}% {english ? "implied probability" : "隐含概率"}</span></div><dl><div><dt>{english ? "Active participants" : "活跃参与者"}</dt><dd>{current.people}</dd></div><div><dt>{english ? "Market depth" : "市场深度"}</dt><dd>{english ? current.englishDepth : current.depth}</dd></div></dl></div>
      <p className="panel-note">{english ? current.englishNote : current.note}</p>
    </section>
  );
}
