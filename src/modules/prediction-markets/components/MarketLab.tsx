"use client";

import { useMemo, useState } from "react";
import { createScenarioState, predictionMarketSpec } from "../core/engine";
import type { Outcome, ScenarioId } from "../core/types";
import { useSimulation } from "@/platform/simulation/useSimulation";
import { SimulationTimeline } from "@/platform/simulation/SimulationTimeline";
import { EventLog, OrderBookView, ParticipantTable, PriceGauge } from "./MarketPanels";

const scenarios: Array<{ id: ScenarioId; label: string; englishLabel: string; description: string; englishDescription: string }> = [
  { id: "normal", label: "正常市场", englishLabel: "Normal market", description: "报价集中在 68–72，买卖双方都在场。", englishDescription: "Quotes cluster around 68–72, with buyers and sellers on both sides." },
  { id: "thin", label: "低流动性", englishLabel: "Thin liquidity", description: "订单很少，价格之间留下巨大的空隙。", englishDescription: "There are few orders, leaving a wide gap between prices." },
  { id: "whale", label: "大户冲击", englishLabel: "Whale impact", description: "Alice 用大额高价订单迅速吃掉卖盘。", englishDescription: "Alice uses a large, aggressive order to consume the asks." },
  { id: "bad-oracle", label: "错误预言机", englishLabel: "Wrong oracle", description: "交易逻辑正常，但现实结果可能被错误报告。", englishDescription: "Trading rules work, but the outside result may be reported incorrectly." },
];

export function MarketLab({ locale = "zh" }: { locale?: "zh" | "en" }) {
  const english = locale === "en";
  const [scenario, setScenario] = useState<ScenarioId>("normal");
  const [outcome, setOutcome] = useState<Outcome>("YES");
  const [price, setPrice] = useState(66);
  const [quantity, setQuantity] = useState(2);
  const simulation = useSimulation(predictionMarketSpec, createScenarioState(7, scenario));
  const currentScenario = scenarios.find((item) => item.id === scenario)!;
  const scenarioLabel = english ? currentScenario.englishLabel : currentScenario.label;
  const scenarioDescription = english ? currentScenario.englishDescription : currentScenario.description;
  const question = english ? "Will humans return to the Moon before 2028?" : simulation.state.question;
  const you = simulation.state.traders.find((trader) => trader.id === "you")!;
  const available = you.credits - you.reservedCredits;
  const canRedeem = simulation.state.phase === "RESOLVED" && !you.redeemed;
  const validationText = useMemo(
    () => simulation.validation.valid ? (english ? "All invariants hold" : "全部不变量成立") : simulation.validation.violations.join(english ? "; " : "；"),
    [english, simulation.validation],
  );
  const coachingMessage = useMemo(() => {
    const latest = simulation.state.events.at(-1);
    if (!latest) return english ? "Watch the best bid, best ask, and spread before choosing a price you can bear." : "先观察买一、卖一和价差，再决定你愿意承担什么价格。";
    if (latest.kind === "ORDER_MATCHED") return english ? "Orders met: the trade uses the resting order price, and insufficient quantity creates a partial fill. Check which order arrived first." : "订单已经相遇：成交价来自静止订单，数量不足时只会部分成交。看一眼事件记录，确认哪一边先进入订单簿。";
    if (latest.kind === "ORDER_SUBMITTED") return english ? "The order entered the public book. It may fill immediately or wait if it does not cross the spread." : "订单已进入公共订单簿。它可能马上成交，也可能因为价格没有穿过价差而继续等待。";
    if (latest.kind === "ORDER_CANCELLED") return english ? "Cancelling releases only the unfilled reservation; a completed position cannot be cancelled." : "撤单只释放尚未成交部分的冻结积分；已经成交的头寸不会被撤回。";
    if (latest.kind === "MARKET_RESOLVED") return english ? "The oracle writes a result only after trading ends. Price is a signal, not a substitute for reality." : "预言机只在交易结束后写入结果。市场价格提供信号，但不能替现实做决定。";
    if (latest.kind === "PAYOUT_REDEEMED") return english ? "Payout can be claimed once. Multiply winning shares by 100 and check the credits received." : "结算款只能领取一次。把到账积分和获胜份额数量相乘，检查是否等于每份 100。";
    return english ? "Change the scenario or price and see whether the invariant survives while market behavior changes." : "试着改变场景或价格，让一个不变量仍然成立但市场表现发生变化。";
  }, [english, simulation.state.events]);

  const chooseScenario = (id: ScenarioId) => {
    setScenario(id);
    simulation.reset(createScenarioState(7, id));
  };

  return (
    <section className="market-lab" aria-label={english ? "Prediction market sandbox" : "预测市场自由实验室"}>
      <div className="market-lab__toolbar">
        <div><span className="lab-live-dot" />{english ? "SIMULATION ACTIVE" : "SIMULATION ACTIVE"}</div>
        <div className="scenario-switcher" aria-label={english ? "Market scenarios" : "市场场景"}>
          {scenarios.map((item) => <button aria-pressed={scenario === item.id} key={item.id} onClick={() => chooseScenario(item.id)} type="button">{english ? item.englishLabel : item.label}</button>)}
        </div>
        <button className="toolbar-reset" onClick={() => simulation.reset(createScenarioState(7, scenario))} type="button">{english ? "Reset lab" : "重置实验"}</button>
      </div>

      <header className="market-lab__question">
        <div><small>{english ? "Binary event market" : "二元事件市场"} · {scenarioLabel}</small><h2>{question}</h2><p>{scenarioDescription}</p></div>
        <div className={`market-phase ${simulation.state.phase === "RESOLVED" ? "is-resolved" : ""}`}><span>{simulation.state.phase === "OPEN" ? (english ? "Trading" : "交易中") : (english ? "Resolved" : "已结算")}</span><strong>{simulation.state.resolution ?? "OPEN"}</strong></div>
      </header>

      <section className="market-lab__beliefs" aria-label={english ? "Participant beliefs" : "参与者信念"}>
        <header><div><strong>{english ? "Tune beliefs, then watch orders" : "先调信念，再看订单"}</strong><p>{english ? "A belief does not become a trade by itself; the market only sees a price, quantity, and budget in the order book." : "信念是参与者心中的判断，不会自动变成成交；只有价格、数量和预算一起进入订单簿，市场才看得见它。"}</p></div><span>{english ? "Subjective view" : "主观判断"}</span></header>
        <div>{simulation.state.traders.filter((trader) => trader.id !== "you").map((trader) => <label key={trader.id}><span>{trader.name}<b>{trader.belief}</b></span><input aria-label={`${trader.name} ${english ? "belief" : "主观判断"}`} disabled={simulation.state.phase === "RESOLVED"} max="99" min="1" onChange={(event) => simulation.dispatch({ type: "SET_BELIEF", traderId: trader.id, belief: Number(event.target.value) })} type="range" value={trader.belief} /></label>)}</div>
      </section>

      <div className="market-lab__metrics">
        <PriceGauge locale={locale} state={simulation.state} />
        <div><span>{english ? "Locked collateral" : "锁定抵押"}</span><strong>{simulation.state.collateral}</strong><small>{english ? "credits" : "积分"}</small></div>
        <div><span>{english ? "Your available balance" : "你的可用余额"}</span><strong>{available}</strong><small>{english ? "credits" : "积分"}</small></div>
        <div><span>{english ? "Open interest" : "未平仓份额"}</span><strong>{simulation.metrics.openInterest}</strong><small>{english ? "contracts" : "份合约"}</small></div>
      </div>
      <div className="market-lab__coach" role="status"><span>{english ? "Coach" : "观察提示"}</span><p>{coachingMessage}</p></div>

      <div className="market-lab__main">
        <div className="market-lab__market">
          <OrderBookView locale={locale} state={simulation.state} onCancel={(orderId) => simulation.dispatch({ type: "CANCEL_ORDER", orderId })} />
          <ParticipantTable locale={locale} state={simulation.state} />
        </div>
        <aside className="trade-console">
          <div className="trade-console__tabs"><button className={outcome === "YES" ? "active" : ""} onClick={() => setOutcome("YES")} type="button">{english ? "BUY YES" : "买 YES"}</button><button className={outcome === "NO" ? "active" : ""} onClick={() => setOutcome("NO")} type="button">{english ? "BUY NO" : "买 NO"}</button></div>
          <label><span>{english ? "Maximum price" : "最高价格"}</span><b>{price}</b><input disabled={simulation.state.phase === "RESOLVED"} min="1" max="99" value={price} onChange={(event) => setPrice(Number(event.target.value))} type="range" /></label>
          <label><span>{english ? "Quantity" : "数量"}</span><b>{quantity}</b><input disabled={simulation.state.phase === "RESOLVED"} min="1" max="10" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} type="range" /></label>
          <dl><div><dt>{english ? "Max reserved" : "最多冻结"}</dt><dd>{price * quantity}</dd></div><div><dt>{english ? "Payout if right" : "判断正确时兑付"}</dt><dd>{quantity * 100}</dd></div><div><dt>{english ? "Maximum loss" : "最大损失"}</dt><dd>{price * quantity}</dd></div></dl>
          <button className="submit-order" disabled={simulation.state.phase === "RESOLVED"} onClick={() => simulation.dispatch({ type: "PLACE_ORDER", traderId: "you", outcome, price, quantity })} type="button">{english ? "Submit limit order" : "提交限价订单"}</button>
          {simulation.error && <p className="form-error" role="alert">{simulation.error}</p>}
        </aside>
      </div>

      <div className="market-lab__lower">
        <EventLog locale={locale} state={simulation.state} limit={8} />
        <div className="resolution-console">
          <header><strong>{english ? "Oracle and resolution" : "预言机与结算"}</strong><span>{simulation.state.oracleReliable ? (english ? "Reliable source" : "来源可靠") : (english ? "Source may be wrong" : "来源可能错误")}</span></header>
          {simulation.state.phase === "OPEN" ? (
            <><p>{english ? "Choose the result the oracle will finally write. In the wrong-oracle scenario, deliberately choose the opposite of reality." : "选择预言机最终写入系统的结果。错误预言机场景中，可以故意选择与现实相反的结果。"}</p><div><button onClick={() => simulation.dispatch({ type: "RESOLVE", outcome: "YES" })} type="button">{english ? "Report YES" : "报告 YES"}</button><button onClick={() => simulation.dispatch({ type: "RESOLVE", outcome: "NO" })} type="button">{english ? "Report NO" : "报告 NO"}</button></div></>
          ) : canRedeem ? (
            <><p>{english ? `Your positions: YES ${you.yesShares} / NO ${you.noShares}. The winning side pays 100 per share.` : `你的头寸：YES ${you.yesShares} / NO ${you.noShares}。获胜方向每份兑付 100。`}</p><button className="redeem-button" onClick={() => simulation.dispatch({ type: "REDEEM", traderId: "you" })} type="button">{english ? "Redeem my payout" : "领取我的结算款"}</button></>
          ) : <p>{english ? "Your account has settled. Reset or switch scenarios to run another experiment." : "你的账户已完成结算。可以重置或切换场景继续实验。"}</p>}
          <div className="invariant-status"><span>{simulation.validation.valid ? "✓" : "!"}</span><p><strong>{english ? "System checks" : "系统检查"}</strong>{validationText}</p></div>
          {simulation.actions.length > 0 && <button className="undo-button" onClick={() => simulation.replayTo(simulation.actions.length - 1)} type="button">{english ? "Undo previous action" : "撤回上一步"}</button>}
        </div>
      </div>
      <SimulationTimeline snapshots={simulation.snapshots} actionCount={simulation.actions.length} onRewind={simulation.replayTo} journal={{ moduleId: "prediction-markets", title: english ? "Prediction market sandbox" : "预测市场自由实验", scenario: scenarioLabel, note: `${scenarioDescription} ${english ? `${simulation.state.events.length} events recorded.` : `已记录 ${simulation.state.events.length} 个事件。`}`, labPath: "/labs/prediction-markets", stateSnapshot: predictionMarketSpec.serialize(simulation.state), actions: simulation.actions.map((action) => JSON.stringify(action) ?? "{}"), events: simulation.state.events.slice(-8).map(({ kind, message }) => ({ kind, message })), metrics: [{ label: english ? "Implied price" : "隐含价格", value: `${simulation.metrics.impliedPrice} / 100` }, { label: english ? "Spread" : "买卖价差", value: simulation.metrics.spread === null ? "—" : `${simulation.metrics.spread} ${english ? "credits" : "分"}` }, { label: english ? "Open interest" : "未平仓份额", value: `${simulation.metrics.openInterest}` }, { label: english ? "Locked collateral" : "锁定抵押", value: `${simulation.state.collateral} ${english ? "credits" : "积分"}` }], insight: english ? "Price is an order-book signal, not a fact written by the oracle." : "价格是订单簿的信号，不是预言机写入的事实。" }} />
    </section>
  );
}
