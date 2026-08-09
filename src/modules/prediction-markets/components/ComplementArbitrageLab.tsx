"use client";

import { useState } from "react";

type QuoteMode = "buy" | "sell";
type TradeChoice = "buy-both" | "split-sell" | "wait";

const presets = {
  cheap: { yes: 46, no: 47, costs: 2, mode: "buy" as const },
  balanced: { yes: 63, no: 37, costs: 2, mode: "buy" as const },
  expensiveAsks: { yes: 62, no: 45, costs: 2, mode: "buy" as const },
  richBids: { yes: 62, no: 45, costs: 2, mode: "sell" as const },
};

export function ComplementArbitrageLab({ locale = "zh" }: { locale?: "zh" | "en" }) {
  const english = locale === "en";
  const [yes, setYes] = useState(46);
  const [no, setNo] = useState(47);
  const [costs, setCosts] = useState(2);
  const [mode, setMode] = useState<QuoteMode>("buy");
  const [choice, setChoice] = useState<TradeChoice | null>(null);
  const total = yes + no;
  const grossEdge = mode === "buy" ? 100 - total : total - 100;
  const netEdge = grossEdge - costs;
  const actionable = grossEdge > 0;
  const correctChoice: TradeChoice = netEdge > 0 ? (mode === "buy" ? "buy-both" : "split-sell") : "wait";

  const applyPreset = (preset: (typeof presets)[keyof typeof presets]) => {
    setYes(preset.yes);
    setNo(preset.no);
    setCosts(preset.costs);
    setMode(preset.mode);
    setChoice(null);
  };

  const updateYes = (value: number) => { setYes(value); setChoice(null); };
  const updateNo = (value: number) => { setNo(value); setChoice(null); };
  const updateCosts = (value: number) => { setCosts(value); setChoice(null); };
  const updateMode = (value: QuoteMode) => { setMode(value); setChoice(null); };

  const resultTitle = !actionable
    ? (mode === "buy"
      ? (english ? "Buying both locks in a loss" : "买齐两边，反而锁定亏损")
      : (english ? "Selling both does not cover the collateral" : "卖掉两边，还覆盖不了抵押"))
    : netEdge > 0
      ? (mode === "buy"
        ? (english ? "Buy every future for less than 100" : "不到 100，就买齐了所有未来")
        : (english ? "Split one set, then sell both sides" : "拆出一套，再把两边同时卖掉"))
      : (english ? "A gross gap exists, but costs consume it" : "看见毛差了，但成本把它吃光了");

  return <section className="interactive-panel complement-arbitrage" aria-label={english ? "Complement price arbitrage lab" : "互补价格与套利实验"}>
    <header><span>{english ? "YES + NO · EXECUTABLE QUOTES" : "YES + NO · 可执行报价"}</span><strong>{english ? "First identify which side of the book you see" : "先分清你看到的是买价还是卖价"}</strong></header>

    <div className="complement-arbitrage__presets" aria-label={english ? "Example quote combinations" : "示例价格组合"}>
      <button type="button" onClick={() => applyPreset(presets.cheap)}>{english ? "Buy asks total 93" : "可买价合计 93"}</button>
      <button type="button" onClick={() => applyPreset(presets.balanced)}>{english ? "Exactly 100" : "刚好 100"}</button>
      <button type="button" onClick={() => applyPreset(presets.expensiveAsks)}>{english ? "Buy asks total 107" : "可买价合计 107"}</button>
      <button type="button" onClick={() => applyPreset(presets.richBids)}>{english ? "Sell bids total 107" : "可卖价合计 107"}</button>
    </div>

    <div className="complement-arbitrage__mode" role="group" aria-label={english ? "Quote direction" : "报价方向"}>
      <button type="button" aria-pressed={mode === "buy"} onClick={() => updateMode("buy")}><span>{english ? "I want to buy" : "我要买入"}</span><small>{english ? "Use asks: what I must pay" : "看卖一：我实际要付多少"}</small></button>
      <button type="button" aria-pressed={mode === "sell"} onClick={() => updateMode("sell")}><span>{english ? "I want to sell" : "我要卖出"}</span><small>{english ? "Use bids: what I can receive" : "看买一：我实际能收到多少"}</small></button>
    </div>

    <div className="complement-arbitrage__controls">
      <label><span><b>YES</b><strong>{yes}</strong></span><input aria-label={english ? "YES executable quote" : "YES 可执行价格"} type="range" min="1" max="99" value={yes} onChange={(event) => updateYes(Number(event.target.value))} /></label>
      <label><span><b>NO</b><strong>{no}</strong></span><input aria-label={english ? "NO executable quote" : "NO 可执行价格"} type="range" min="1" max="99" value={no} onChange={(event) => updateNo(Number(event.target.value))} /></label>
      <label><span><b>{english ? "FEES + FRICTION" : "费用＋摩擦"}</b><strong>{costs}</strong></span><input aria-label={english ? "Fees and execution friction" : "费用与执行摩擦"} type="range" min="0" max="12" value={costs} onChange={(event) => updateCosts(Number(event.target.value))} /></label>
    </div>

    <div className="complement-arbitrage__decision" aria-label={english ? "Choose a trade before revealing the answer" : "先选择交易动作再揭晓答案"}>
      <div><span>{english ? "COMMIT BEFORE REVEAL" : "先判断，再揭晓"}</span><strong>{english ? "What would you do with these executable quotes?" : "面对这组可执行报价，你会怎么做？"}</strong></div>
      <div role="group" aria-label={english ? "Trade decision" : "交易判断"}>
        <button type="button" aria-pressed={choice === "buy-both"} onClick={() => setChoice("buy-both")}>{english ? "Buy YES + NO" : "同时买入 YES＋NO"}</button>
        <button type="button" aria-pressed={choice === "split-sell"} onClick={() => setChoice("split-sell")}>{english ? "Split one set, sell both" : "抵押 100 拆一套，再同时卖出"}</button>
        <button type="button" aria-pressed={choice === "wait"} onClick={() => setChoice("wait")}>{english ? "Do not trade" : "暂时不交易"}</button>
      </div>
      {choice && <p className={choice === correctChoice ? "is-correct" : "is-wrong"} aria-live="polite"><b>{choice === correctChoice ? (english ? "✓ Good diagnosis." : "✓ 判断正确。") : (english ? "Not yet — inspect quote direction and net edge." : "还差一步：重新检查报价方向和扣除成本后的净差。")}</b> {choice === correctChoice ? (english ? "Now reveal the accounting below." : "现在再看下面的资金闭环。") : (english ? "The explanation below shows where the loop breaks." : "下面的解释会指出闭环在哪里断掉。")}</p>}
    </div>

    <div className={`complement-arbitrage__result ${actionable && netEdge > 0 ? "is-edge" : actionable ? "is-thin" : "is-trap"}`} role="status">
      <div className="complement-arbitrage__sum"><span>{english ? (mode === "buy" ? "TOTAL COST" : "TOTAL RECEIVED") : (mode === "buy" ? "合计成本" : "合计收入")}</span><strong>{yes}<i>＋</i>{no}<i>＝</i><em>{total}</em></strong><small>{total < 100 ? (english ? `${100 - total} below a complete set` : `比完整份额少 ${100 - total}`) : total > 100 ? (english ? `${total - 100} above a complete set` : `比完整份额多 ${total - 100}`) : (english ? "exactly one complete set" : "正好一套完整份额")}</small></div>
      <div className={`complement-arbitrage__explanation ${choice ? "is-revealed" : "is-hidden"}`}>{choice ? <><span>{actionable ? (english ? "POSSIBLE TRADE" : "可能的交易") : (english ? "NO FREE LOOP" : "没有免费的闭环")}</span><h3>{resultTitle}</h3><p>{mode === "buy"
        ? (english ? `Pay ${total} for one YES and one NO. The complete set returns 100, so gross edge is ${Math.max(0, grossEdge)} and estimated net edge is ${Math.max(0, netEdge)}.` : `各买一份 YES 和 NO 共付 ${total}。完整份额可回到 100，因此毛差 ${Math.max(0, grossEdge)}，扣除估算成本后净差 ${Math.max(0, netEdge)}。`)
        : (english ? `Lock 100 to split one complete set, then sell YES and NO for ${total}. Gross edge is ${Math.max(0, grossEdge)} and estimated net edge is ${Math.max(0, netEdge)}.` : `先锁 100 拆出一套完整份额，再把 YES 和 NO 共卖出 ${total}。毛差 ${Math.max(0, grossEdge)}，扣除估算成本后净差 ${Math.max(0, netEdge)}。`)}</p></> : <><span>{english ? "ANSWER COVERED" : "答案已遮住"}</span><h3>{english ? "Choose an action before reading the result" : "先选一个动作，再看资金怎样闭环"}</h3><p>{english ? "The sum alone is not enough. Decide whether these are asks or bids, then subtract execution friction." : "只看合计还不够。先判断这是卖一还是买一，再把执行摩擦扣掉。"}</p></>}</div>
    </div>

    <div className="complement-arbitrage__conditions"><strong>{english ? "The word ‘arbitrage’ is valid only if all four survive:" : "只有下面四关都通过，才能叫套利："}</strong><ul><li>{english ? "both quotes execute now for the same quantity" : "两个价格能在同一时刻、按同一数量成交"}</li><li>{english ? "fees, gas, and slippage are smaller than the gap" : "手续费、Gas 和滑点小于价差"}</li><li>{english ? "the market guarantees exactly one 100-credit winner" : "市场保证最终恰有一边兑付 100"}</li><li>{english ? "you can split/merge the set and settlement does not fail" : "你能拆分或合并完整份额，结算也不会失效"}</li></ul></div>
  </section>;
}
