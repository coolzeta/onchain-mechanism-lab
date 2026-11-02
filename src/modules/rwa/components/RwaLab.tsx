"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { rwaMetrics, rwaScenarios, type RwaScenarioId } from "../core/model";
import styles from "./RwaLab.module.css";

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
};

function Slider({ label, value, min, max, step, display, onChange }: SliderProps) {
  return <label className={styles.slider}>
    <span>{label}<strong>{display}</strong></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
  </label>;
}

export function RwaLab({ locale }: { locale?: string } = {}) {
  const contextLocale = useLocale();
  const english = (locale ?? contextLocale) === "en";
  const [activeScenario, setActiveScenario] = useState<RwaScenarioId | null>("baseline");
  const [decision, setDecision] = useState<"sell" | "queue" | "borrow" | null>(null);
  const [assets, setAssets] = useState(100_000);
  const [supply, setSupply] = useState(1_000);
  const [cash, setCash] = useState(20_000);
  const [requested, setRequested] = useState(400);
  const [report, setReport] = useState({ value: 100_000, age: 0 });
  const metrics = rwaMetrics(assets, supply, cash, requested);
  const money = (value: number) => `$${value.toLocaleString(english ? "en-US" : "zh-CN", { maximumFractionDigits: 2 })}`;
  const number = (value: number) => value.toLocaleString(english ? "en-US" : "zh-CN");

  function applyScenario(id: RwaScenarioId) {
    const scenario = rwaScenarios[id];
    setAssets(scenario.assets);
    setSupply(scenario.supply);
    setCash(scenario.cash);
    setRequested(scenario.requested);
    setReport({ ...scenario.report });
    setActiveScenario(id);
    setDecision(null);
  }

  const scenarioCopy = {
    baseline: { label: english ? "1 · Starting point" : "1 · 初始情况", description: english ? "A hypothetical portfolio is worth $100,000 including $20,000 in cash. Holders submit 400 of 1,000 tokens." : "假设资产组合价值 10 万美元，其中现金 2 万美元；持有人申请赎回 1,000 份中的 400 份。" },
    priceShock: { label: english ? "2 · Value falls" : "2 · 估值下跌", description: english ? "Current assumed value falls to $80,000, while the last report still says $100,000. Compare both figures before updating the report." : "当前假设估值跌至 8 万美元，旧报告仍显示 10 万美元。更新报告前，先比较两个数字。" },
    redemptionPressure: { label: english ? "3 · Redemption pressure" : "3 · 集中赎回", description: english ? "Compare with the starting point: the portfolio and cash are unchanged, but requests rise from 400 to 800 tokens." : "与初始情况相比，资产组合和现金不变，但赎回申请从 400 份升至 800 份。" },
    moreCash: { label: english ? "4 · More cash on hand" : "4 · 假设现金增加", description: english ? "Compare with redemption pressure: assume $60,000 of other assets has been converted to cash at unchanged value, with no fees or delay. This is a scenario, not an executed sale." : "对比集中赎回：假设其他资产中的 6 万美元已按原值转换为现金，不计费用或时间。这是情景假设，并未执行卖出。" },
  } satisfies Record<RwaScenarioId, { label: string; description: string }>;

  const decisionCopy = {
    sell: english ? "A sale might raise cash if buyers exist, but pricing, execution time and costs can change the amount recovered. The simulation does not execute a sale." : "若有买家，出售资产可能增加现金；但成交价格、时间和费用会影响实际回收。此实验不会执行卖出。",
    queue: english ? "A queue may give time to obtain cash if the terms permit it, but delays holders and does not itself create assets or fix a shortfall." : "如果条款允许，排队可能为筹集现金争取时间；但持有人需要等待，排队本身不会创造资产或填补亏空。",
    borrow: english ? "Borrowing may add immediate cash if funding is available, but creates a liability and interest; collateral and creditor priority can affect holders. No loan is executed here." : "如果能获得融资，借款可能增加即时现金，但也会产生负债和利息；抵押与债权顺位可能影响持有人。这里不会执行借款。",
  };


  return <section className={`${styles.lab} interactive-panel`} aria-label={english ? "RWA teaching simulation" : "RWA 教学模拟"}>
    <header className={styles.header}>
      <div><span>RWA SIMULATION · ASSETS / REPORT / REDEMPTION</span><h3>{english ? "Can the assets meet redemption requests?" : "资产能否应对赎回请求？"}</h3><p>{english ? "Explore the fictional Harbor Note portfolio of off-chain assets and cash. Every number is illustrative." : "观察虚构的「海桥票据计划」资产组合：它由链下资产和现金组成，所有数字仅用于教学。"}</p></div>
      <button className={styles.reset} type="button" onClick={() => applyScenario("baseline")}>{english ? "Reset" : "重置"}</button>
    </header>

    <div className={styles.scenarios}>
      <div><span>{english ? "GUIDED COMPARISON" : "情景对照"}</span><h4>{english ? "Follow one portfolio through four situations" : "让同一个资产组合经历四种情况"}</h4><p>{english ? "Select a situation to load its assumptions, then compare the results. Adjust the sliders to explore your own case." : "选择情景载入假设，再对比结果；也可以调整滑块探索自己的情况。"}</p></div>
      <div className={styles.scenarioButtons} role="group" aria-label={english ? "Scenario presets" : "情景预设"}>
        {(Object.keys(scenarioCopy) as RwaScenarioId[]).map((id) => <button type="button" key={id} aria-pressed={activeScenario === id} onClick={() => applyScenario(id)}>{scenarioCopy[id].label}</button>)}
      </div>
      <p className={styles.scenarioDescription} aria-live="polite">{activeScenario ? scenarioCopy[activeScenario].description : (english ? "Custom assumptions. Reload a scenario to compare it with a preset." : "当前为自定义假设，可重新选择情景进行对照。")}</p>
    </div>

    <div className={styles.layout}>
      <div className={styles.controls}>
        <h4>{english ? "Change the scenario" : "调整场景"}</h4>
        <Slider label={english ? "Assumed portfolio value (including cash)" : "假设资产组合估值（含现金）"} min={0} max={200_000} step={5_000} value={assets} display={money(assets)} onChange={(value) => { setActiveScenario(null); setAssets(value); setCash((current) => Math.min(current, value)); }} />
        <Slider label={english ? "Tokens issued" : "已发行代币"} min={100} max={2_000} step={100} value={supply} display={number(supply)} onChange={(value) => { setActiveScenario(null); setSupply(value); setRequested((current) => Math.min(current, value)); }} />
        <Slider label={english ? "Cash available now" : "当前可用现金"} min={0} max={assets} step={5_000} value={cash} display={money(cash)} onChange={(value) => { setActiveScenario(null); setCash(value); }} />
        <Slider label={english ? "Tokens submitted for redemption" : "提交赎回的代币"} min={0} max={supply} step={100} value={requested} display={number(requested)} onChange={(value) => { setActiveScenario(null); setRequested(value); }} />
        <p>{english ? "Cash is part of the portfolio, not extra assets. Changing token supply here does not add or remove assets." : "现金包含在资产组合估值中，不是额外资产。这里调整代币数量不会增加或减少资产。"}</p>
      </div>

      <div className={styles.results} aria-live="polite">
        <h4>{english ? "Read the boundary" : "观察边界"}</h4>
        <dl className={styles.metrics}>
          <div><dt>{english ? "Illustrative value per token" : "每代币假设估值"}</dt><dd>{money(metrics.unitValue)}</dd></div>
          <div><dt>{english ? "Estimated value of requests" : "赎回请求估算金额"}</dt><dd>{money(metrics.estimatedRequestValue)}</dd></div>
          <div><dt>{english ? "Available cash" : "可用现金"}</dt><dd>{money(metrics.liquidCash)}</dd></div>
          <div className={styles.gap}><dt>{english ? "Estimated cash gap" : "估算现金缺口"}</dt><dd>{money(metrics.liquidityGap)}</dd></div>
        </dl>
        <p>{english ? "Request estimate = requested tokens × portfolio value ÷ tokens issued. The gap compares that estimate with available cash; it is not a loss calculation or proof that a redemption will be paid." : "请求估算金额 = 申请数量 × 资产组合估值 ÷ 已发行数量。缺口只比较估算金额与可用现金，不代表损失，也不证明赎回一定会获支付。"}</p>
      </div>
    </div>

    <div className={styles.report}>
      <div><span>{english ? "LAST REPORT · ASSUMED" : "最近一次报告 · 假设"}</span><strong>{money(report.value)}</strong><p>{english ? `Report age: ${report.age} simulated period${report.age === 1 ? "" : "s"}. Current assumed portfolio value: ${money(assets)}.` : `报告已过 ${report.age} 个模拟周期；当前假设资产组合估值为 ${money(assets)}。`}</p></div>
      <div className={styles.actions}><button type="button" onClick={() => { setActiveScenario(null); setReport((current) => ({ ...current, age: current.age + 1 })); }}>{english ? "Advance one report period" : "推进一个报告周期"}</button><button type="button" onClick={() => { setActiveScenario(null); setReport({ value: assets, age: 0 }); }}>{english ? "Update report" : "更新报告"}</button></div>
    </div>
    <div className={styles.decision}>
      <span>{english ? "DECISION EXERCISE" : "决策练习"}</span>
      <h4>{english ? "Cash is short. What might the issuer consider?" : "现金不足时，发行方可以考虑什么？"}</h4>
      <p>{english ? "Select an option to inspect its trade-offs. These are possibilities, not universally available or recommended actions; contracts, laws and market conditions matter." : "选择一个选项查看取舍。实际能否采用取决于合同、法律和市场条件，并不存在适用于所有产品的标准答案。"}</p>
      <div className={styles.scenarioButtons} role="group" aria-label={english ? "Compare responses" : "比较处理方式"}>
        <button type="button" aria-pressed={decision === "sell"} onClick={() => setDecision("sell")}>{english ? "Consider selling assets" : "考虑出售资产"}</button>
        <button type="button" aria-pressed={decision === "queue"} onClick={() => setDecision("queue")}>{english ? "Consider a queue" : "考虑排队等待"}</button>
        <button type="button" aria-pressed={decision === "borrow"} onClick={() => setDecision("borrow")}>{english ? "Consider borrowing" : "考虑借款"}</button>
      </div>
      {decision && <p className={styles.decisionResult} aria-live="polite">{decisionCopy[decision]}</p>}
    </div>
    <p className={styles.note}>{english ? "A report can be old or inaccurate; an on-chain token count alone cannot verify off-chain assets. Legal rights, eligibility, valuation, and redemption timing depend on the specific arrangement and applicable law." : "报告可能过时或不准确；仅凭链上代币数量无法核实链下资产。法律权益、参与资格、估值和赎回时间取决于具体安排及适用法律。"}</p>
  </section>;
}
