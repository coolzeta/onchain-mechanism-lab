"use client";

import { useMemo, useState } from "react";
import { useSimulation } from "@/platform/simulation/useSimulation";
import { SimulationTimeline } from "@/platform/simulation/SimulationTimeline";
import { createOracleState, oracleSpec } from "../core/engine";
import type { OracleOutcome, OracleScenario, OracleState } from "../core/types";

export type OracleFocus = "core" | "sources" | "challenge" | "settlement";

const formatNumber = (value: number) => value.toLocaleString("zh-CN");
const outcomeLabel = (outcome: OracleOutcome | null) => outcome === "YES" ? "YES" : outcome === "NO" ? "NO" : "未报告";

function OracleEventLog({ state }: { state: OracleState }) {
  return <div className="oracle-engine-event-log" aria-live="polite"><header><strong>预言机事件</strong><span>{state.events.length} EVENTS</span></header><ol>{state.events.slice(-9).reverse().map((event) => <li key={event.id}><span>{String(event.index).padStart(2, "0")}</span><p>{event.message}</p></li>)}</ol></div>;
}

function StatusTimeline({ state }: { state: OracleState }) {
  const stages = [
    { label: "数据源", done: true },
    { label: "初始报告", done: Boolean(state.proposedOutcome) },
    { label: "挑战窗口", done: state.phase === "FINALIZED" || state.challengeWindow < state.maxChallengeWindow },
    { label: "最终结果", done: state.phase === "FINALIZED" },
  ];
  return <div className="oracle-status-timeline" aria-label="预言机状态流程">{stages.map((stage, index) => <div className={stage.done ? "is-done" : ""} key={stage.label}><span>{stage.done ? "✓" : String(index + 1).padStart(2, "0")}</span><strong>{stage.label}</strong>{index < stages.length - 1 && <i aria-hidden="true" />}</div>)}</div>;
}

export function OracleLab({ focus = "core" }: { focus?: OracleFocus }) {
  const [scenario, setScenario] = useState<OracleScenario>("wrong-report");
  const [reportStake, setReportStake] = useState(200);
  const [challengeStake, setChallengeStake] = useState(250);
  const simulation = useSimulation(oracleSpec, createOracleState(67, scenario));
  const state = simulation.state;
  const metrics = simulation.metrics;
  const suggestedReport: OracleOutcome = scenario === "reliable" ? "YES" : "NO";
  const challengeOutcome: OracleOutcome = state.proposedOutcome === "YES" ? "NO" : "YES";
  const coachMessage = useMemo(() => {
    const latest = state.events.at(-1);
    if (!latest || latest.kind === "SOURCE_ATTACHED") return "预言机不是把 API 结果复制上链，而是把一组带激励、担保和争议流程的事实输入接入结算。";
    if (latest.kind === "REPORT_SUBMITTED") return "初始报告只是一个带担保金的主张，不是最终真相。接下来要给其他参与者时间和动机去挑战它。";
    if (latest.kind === "REPORT_CHALLENGED") return "挑战者没有修改历史报告，而是锁定相反观点和自己的担保金，把争议升级给仲裁步骤。";
    if (latest.kind === "REPORT_FINALIZED") return "没有挑战时，协议会把初报写入市场。错误不会被价格自动修复，这正是预言机风险。";
    if (latest.kind === "DISPUTE_ADJUDICATED") return "仲裁把现实证据带回争议：正确的一方拿回双方担保金，错误的一方承担经济损失。";
    if (latest.kind === "SETTLEMENT_HANDOFF") return "结算交接已经发生。下游市场可以读取最终结果，但仍然应该保留来源、时间和争议记录。";
    return "窗口推进只改变时间，不改变报告内容。最终化必须等待窗口结束，避免一个瞬时数据源直接决定赔付。";
  }, [state.events]);

  function resetScenario(nextScenario: OracleScenario) {
    setScenario(nextScenario);
    simulation.reset(createOracleState(67, nextScenario));
  }

  return <section className="oracle-lab" aria-label="预言机机制实验室">
    <div className="oracle-lab__toolbar"><span><i />ORACLE SIMULATION</span><span>虚拟担保 · 非投资建议</span><button onClick={() => resetScenario("wrong-report")} type="button">重置实验</button></div>
    <div className="oracle-scenario-switcher" role="group" aria-label="选择数据源场景"><button className={scenario === "reliable" ? "active" : ""} onClick={() => resetScenario("reliable")} type="button">正常报告</button><button className={scenario === "wrong-report" ? "active" : ""} onClick={() => resetScenario("wrong-report")} type="button">错误初报</button><button className={scenario === "ambiguous-source" ? "active" : ""} onClick={() => resetScenario("ambiguous-source")} type="button">模糊来源</button></div>
    <header className="oracle-lab__header"><div><small>ORACLE 001 · REPORT / CHALLENGE / FINALIZE</small><h3>现实结果如何进入链上？</h3><p>{state.question}</p></div><div className={`oracle-source-badge is-${state.source.status.toLowerCase()}`}><span>数据源状态</span><strong>{metrics.sourceReliabilityLabel}</strong><small>{state.source.name}</small></div></header>
    <StatusTimeline state={state} />

    <div className="oracle-lab__metrics"><div><span>当前阶段</span><strong>{metrics.statusLabel}</strong><small>{state.phase === "CHALLENGE" ? `剩 ${state.challengeWindow} 个窗口` : "状态机"}</small></div><div><span>初始报告</span><strong>{outcomeLabel(state.proposedOutcome)}</strong><small>{metrics.reportMatchesSource === false ? "与现实证据冲突" : "尚未比较"}</small></div><div><span>最终结果</span><strong>{outcomeLabel(state.finalOutcome)}</strong><small>发送给市场结算</small></div><div><span>担保风险</span><strong>{formatNumber(metrics.stakeAtRisk)}</strong><small>积分锁定中</small></div><div><span>结算交接</span><strong>{metrics.settlementAcknowledged ? "已交接" : "未交接"}</strong><small>{metrics.settlementReady ? "市场可读取" : "等待最终化"}</small></div></div>

    {focus !== "core" && <section className="oracle-focus-panel" aria-label="预言机章节焦点实验"><header><span>FOCUS EXPERIMENT · {focus.toUpperCase()}</span><strong>{focus === "sources" ? "数据源质量" : focus === "challenge" ? "挑战与担保" : "结算交接"}</strong></header>{focus === "sources" && <div className="oracle-focus-grid"><p>同一个报告流程，换一个数据源就会改变风险。先比较来源状态，再决定报告者是否应该立即相信它。</p><div className="oracle-focus-actions"><button className={scenario === "reliable" ? "active" : ""} onClick={() => resetScenario("reliable")} type="button">多源一致</button><button className={scenario === "wrong-report" ? "active is-wrong" : ""} onClick={() => resetScenario("wrong-report")} type="button">来源冲突</button><button className={scenario === "ambiguous-source" ? "active is-ambiguous" : ""} onClick={() => resetScenario("ambiguous-source")} type="button">来源模糊</button></div></div>}{focus === "challenge" && <div className="oracle-focus-grid"><p>建议实验：报告一个与现实相反的结果，让 Challenger 提交相反主张，推进两个窗口后交给仲裁者。</p><div className="oracle-focus-actions"><button onClick={() => simulation.dispatch({ type: "SUBMIT_REPORT", outcome: "NO", stake: reportStake })} disabled={state.phase !== "READY"} type="button">报告 NO（锁定担保）</button><button onClick={() => simulation.dispatch({ type: "CHALLENGE_REPORT", outcome: "YES", stake: challengeStake })} disabled={state.phase !== "CHALLENGE" || Boolean(state.challenge)} type="button">挑战并报告 YES</button><button onClick={() => simulation.dispatch({ type: "ADVANCE_WINDOW" })} disabled={state.phase !== "CHALLENGE" || state.challengeWindow <= 0} type="button">推进一个挑战窗口</button></div></div>}{focus === "settlement" && <div className="oracle-focus-grid"><p>最终化只产生预言机结果。点击交接后，预测市场才获得一次明确、可审计的结算许可。</p><div className="oracle-focus-actions"><button onClick={() => simulation.dispatch({ type: "HANDOFF_TO_MARKET" })} disabled={!metrics.settlementReady || metrics.settlementAcknowledged} type="button">把结果交给市场结算 →</button><dl><div><dt>最终结果</dt><dd>{outcomeLabel(state.finalOutcome)}</dd></div><div><dt>接口状态</dt><dd>{metrics.settlementAcknowledged ? "HANDOFF_DONE" : "WAITING"}</dd></div></dl></div></div>}</section>}

    <div className="oracle-lab__main"><section className="oracle-evidence-panel"><header><strong>现实证据与参与者</strong><span>实验真相可展开</span></header><details><summary>揭开数据源记录（教学用真相）</summary><div><strong>{outcomeLabel(state.source.outcome)}</strong><p>{state.source.note}</p></div></details><div className="oracle-participants">{state.participants.map((participant) => <article key={participant.id}><div><span>{participant.id === "reporter" ? "报告者" : "挑战者"}</span><strong>{participant.name}</strong></div><dl><div><dt>可用积分</dt><dd>{formatNumber(participant.credits)}</dd></div><div><dt>锁定担保</dt><dd>{formatNumber(participant.lockedStake)}</dd></div><div><dt>正确 / 错误</dt><dd>{participant.correctReports} / {participant.incorrectReports}</dd></div></dl></article>)}</div><p className="oracle-evidence-note">数据源是现实世界的输入；担保金是让参与者在错误报告时付出代价的激励。两者都不能被价格本身替代。</p></section>
      <aside className="oracle-action-console"><header><strong>运行报告流程</strong><span>{state.phase}</span></header>{state.phase === "READY" && <><p>Primary Reporter 先提交一个带担保的结果。错误初报场景建议先报告 NO，再让 Challenger 观察并挑战 YES。</p><label><span>报告担保金 <b>{formatNumber(reportStake)} 积分</b></span><input aria-label="报告担保金" max="500" min="100" step="50" onChange={(event) => setReportStake(Number(event.target.value))} type="range" value={reportStake} /></label><div className="oracle-outcome-buttons"><button className="is-yes" onClick={() => simulation.dispatch({ type: "SUBMIT_REPORT", outcome: "YES", stake: reportStake })} type="button">报告 YES</button><button className="is-no" onClick={() => simulation.dispatch({ type: "SUBMIT_REPORT", outcome: "NO", stake: reportStake })} type="button">报告 NO</button></div><p className="oracle-suggestion">当前场景建议：<strong>{suggestedReport}</strong>（也可以故意选错，观察没有挑战时会发生什么）。</p></>}{state.phase === "CHALLENGE" && <><div className="oracle-report-card"><span>Primary Reporter 已报告</span><strong>{outcomeLabel(state.proposedOutcome)}</strong><small>{state.challenge ? `Challenger 已提出 ${outcomeLabel(state.challenge.outcome)} 挑战` : "等待其他人挑战"}</small></div>{!state.challenge && state.challengeWindow > 0 && <><label><span>挑战担保金 <b>{formatNumber(challengeStake)} 积分</b></span><input aria-label="挑战担保金" max="500" min="100" step="50" onChange={(event) => setChallengeStake(Number(event.target.value))} type="range" value={challengeStake} /></label><button className="oracle-challenge-button" onClick={() => simulation.dispatch({ type: "CHALLENGE_REPORT", outcome: challengeOutcome, stake: challengeStake })} type="button">挑战并报告 {challengeOutcome} →</button></>}{state.challengeWindow > 0 && <button className="oracle-window-button" onClick={() => simulation.dispatch({ type: "ADVANCE_WINDOW" })} type="button">推进一个挑战窗口（剩 {state.challengeWindow}）</button>}{state.challengeWindow === 0 && !state.challenge && <button className="oracle-finalize-button" onClick={() => simulation.dispatch({ type: "FINALIZE_REPORT" })} type="button">最终化初始报告</button>}{state.challengeWindow === 0 && state.challenge && <button className="oracle-finalize-button" onClick={() => simulation.dispatch({ type: "ADJUDICATE_DISPUTE" })} type="button">交给仲裁者裁决 →</button>}</>}{state.phase === "FINALIZED" && <div className="oracle-final-card"><span>市场可以读取的结果</span><strong>{outcomeLabel(state.finalOutcome)}</strong><p>结果已经写入结算接口。注意：最终化成功不等于数据源一定正确。</p><button className="oracle-handoff-button" disabled={metrics.settlementAcknowledged} onClick={() => simulation.dispatch({ type: "HANDOFF_TO_MARKET" })} type="button">{metrics.settlementAcknowledged ? "已交给市场结算 ✓" : "把结果交给市场结算 →"}</button></div>}{simulation.error && <p className="form-error" role="alert">{simulation.error}</p>}</aside></div>

    <div className="oracle-lab__coach" role="status"><span>观察提示</span><p>{coachMessage}</p></div>
    <div className="oracle-lab__lower"><OracleEventLog state={state} /><aside className="oracle-invariant-panel"><header><strong>结算接口</strong><span>MARKET HANDOFF</span></header><div className="oracle-handoff"><span>{state.phase === "FINALIZED" ? "✓" : "○"}</span><p><strong>{state.phase === "FINALIZED" ? "结果已准备好" : "等待最终结果"}</strong>{state.phase === "FINALIZED" ? `预测市场可以读取 ${outcomeLabel(state.finalOutcome)} 并开始赔付。` : "只有最终化后，市场才应该允许头寸结算。"}</p></div><div className="oracle-invariant-status"><span>{simulation.validation.valid ? "✓" : "!"}</span><p><strong>系统检查</strong>{simulation.validation.valid ? "担保金守恒，阶段转换有效" : simulation.validation.violations.join("；")}</p></div>{simulation.actions.length > 0 && <button className="undo-button" onClick={() => simulation.replayTo(simulation.actions.length - 1)} type="button">撤回上一步</button>}</aside></div>
    <SimulationTimeline snapshots={simulation.snapshots} actionCount={simulation.actions.length} onRewind={simulation.replayTo} journal={{ moduleId: "oracles", title: "预言机自由实验", scenario: metrics.sourceReliabilityLabel, note: `${state.question} 当前流程已记录 ${state.events.length} 个事件。`, labPath: "/labs/oracles", stateSnapshot: oracleSpec.serialize(state), actions: simulation.actions.map((action) => JSON.stringify(action) ?? "{}"), events: state.events.slice(-8).map(({ kind, message }) => ({ kind, message })), metrics: [{ label: "当前阶段", value: metrics.statusLabel }, { label: "初始报告", value: outcomeLabel(state.proposedOutcome) }, { label: "最终结果", value: outcomeLabel(state.finalOutcome) }, { label: "锁定担保", value: `${formatNumber(metrics.stakeAtRisk)} 积分` }, { label: "结算交接", value: metrics.settlementAcknowledged ? "已交接" : "未交接" }], insight: "最终化不等于事实正确；挑战窗口、担保和交接记录共同构成信任边界。" }} />
  </section>;
}
