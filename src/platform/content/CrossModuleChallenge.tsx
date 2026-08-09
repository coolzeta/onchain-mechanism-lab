"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getChallenge } from "./challenges";
import { useProgressStore } from "@/platform/progress/store";
import { modules } from "./registry";
import { getLocalizedModule, isModuleAvailableForLocale } from "./localization";
import { buildKnowledgeMap } from "@/platform/progress/knowledge";
import { getRecommendedAuditStart } from "./audit";

const moduleLabels: Record<string, string> = {
  ledger: "最小账本",
  "token-launch": "代币发行",
  governance: "治理与金库",
  amm: "AMM",
  "matching-engine": "撮合引擎",
  lending: "借贷与清算",
  oracles: "预言机",
  stablecoins: "稳定币",
  "prediction-markets": "预测市场结算",
};

const moduleLabelsEn: Record<string, string> = {
  ledger: "Minimal ledger",
  "token-launch": "Token launch",
  governance: "Governance & treasury",
  amm: "AMM",
  "matching-engine": "Matching engine",
  lending: "Lending & liquidation",
  oracles: "Oracle",
  stablecoins: "Stablecoin",
  "prediction-markets": "Prediction settlement",
};

export function CrossModuleChallenge({ locale }: { locale: string }) {
  const challenge = getChallenge(locale);
  const english = locale === "en";
  const labels = english ? moduleLabelsEn : moduleLabels;
  const answers = useProgressStore((state) => state.challengeAnswers);
  const attempts = useProgressStore((state) => state.challengeAttempts);
  const completedLessons = useProgressStore((state) => state.completedLessons);
  const checkpointAnswers = useProgressStore((state) => state.checkpointAnswers);
  const checkpointAttempts = useProgressStore((state) => state.checkpointAttempts);
  const completedTasks = useProgressStore((state) => state.completedTasks);
  const completedChallenges = useProgressStore((state) => state.completedChallenges);
  const recordAnswer = useProgressStore((state) => state.recordChallengeAnswer);
  const markComplete = useProgressStore((state) => state.markChallengeComplete);
  const completedSteps = useMemo(() => challenge.steps.filter((step) => answers[`${challenge.id}:${step.id}`]).length, [answers, challenge.id, challenge.steps]);
  const activeModules = useMemo(() => modules.filter((module) => isModuleAvailableForLocale(module, locale)).map((module) => getLocalizedModule(module, locale)), [locale]);
  const knowledgeMap = useMemo(() => buildKnowledgeMap(activeModules, { completedLessons, checkpointAnswers, checkpointAttempts, completedTasks }, english ? "en" : "zh"), [activeModules, checkpointAnswers, checkpointAttempts, completedLessons, completedTasks, english]);
  const recommendation = useMemo(() => getRecommendedAuditStart(challenge, knowledgeMap, answers, english ? "en" : "zh"), [answers, challenge, english, knowledgeMap]);
  const [manualStepIndex, setManualStepIndex] = useState<number | null>(null);
  const activeStepIndex = manualStepIndex ?? recommendation.index;
  const [selected, setSelected] = useState<number | null>(null);
  const step = challenge.steps[activeStepIndex];
  const recommendedStep = challenge.steps[recommendation.index];
  const stepKey = `${challenge.id}:${step.id}`;
  const correct = selected === step.correctIndex;
  const done = completedChallenges.includes(challenge.id);
  const lessonHref = step.lessonHref;
  const labHref = step.labHref;
  const hasEnglishModule = activeModules.some((module) => module.id === step.moduleId);

  function choose(index: number) {
    setSelected(index);
    recordAnswer(stepKey, index === step.correctIndex);
    if (index === step.correctIndex && activeStepIndex === challenge.steps.length - 1) markComplete(challenge.id);
  }

  function next() {
    setSelected(null);
    setManualStepIndex((current) => Math.min(challenge.steps.length - 1, (current ?? recommendation.index) + 1));
  }

  function restart() {
    setSelected(null);
    setManualStepIndex(recommendation.index);
  }

  return <section className="cross-module-challenge" aria-label={english ? "Cross-module systems challenge" : "跨模块系统挑战"}>
    <header className="cross-module-challenge__header"><div><span className="eyebrow">{english ? `SYSTEMS CHALLENGE · ${challenge.steps.length} QUESTIONS` : `系统综合练习 · ${challenge.steps.length} 道题`}</span><h2>{challenge.title}</h2><p>{challenge.summary}</p></div><div className="challenge-progress-badge"><strong>{completedSteps}/{challenge.steps.length}</strong><span>{english ? "correct" : "已答对"}</span></div></header>
    <div className="challenge-progress-track" aria-label={english ? `Challenge progress ${completedSteps}/${challenge.steps.length}` : `挑战进度 ${completedSteps}/${challenge.steps.length}`}><span style={{ width: `${(completedSteps / challenge.steps.length) * 100}%` }} /></div>
    <aside className="challenge-recommendation" aria-label={english ? "Suggested starting question" : "建议起始题"}><div><span className="eyebrow">{english ? "SUGGESTED START" : "建议起点"}</span><strong>{english ? `Question ${recommendation.index + 1}: ${recommendedStep.title}` : `第 ${recommendation.index + 1} 题：${recommendedStep.title}`}</strong><p>{recommendation.reason}</p></div><button onClick={() => { setManualStepIndex(recommendation.index); setSelected(null); }} type="button">{english ? "Open →" : "打开 →"}</button></aside>
    <ol className="challenge-stepper">{challenge.steps.map((item, index) => <li className={`${index === activeStepIndex ? "is-current" : ""} ${answers[`${challenge.id}:${item.id}`] ? "is-done" : ""}`} key={item.id}><button aria-current={index === activeStepIndex ? "step" : undefined} aria-label={`${english ? `Go to step ${index + 1}: ` : `跳到第 ${index + 1} 步：`}${labels[item.moduleId] ?? item.moduleId}`} onClick={() => { setManualStepIndex(index); setSelected(null); }} type="button"><span>{answers[`${challenge.id}:${item.id}`] ? "✓" : String(index + 1).padStart(2, "0")}</span><div><small>{item.eyebrow}</small><strong>{labels[item.moduleId] ?? item.moduleId}</strong></div></button></li>)}</ol>
    {done && <div className="challenge-complete-banner" role="status"><span>✓</span><div><strong>{english ? "Systems challenge complete" : "系统综合练习已完成"}</strong><p>{english ? "You answered questions covering state, supply, liquidity, execution, reserves, outside facts, and settlement." : "你已经完成了关于账本、供应、流动性、成交、储备、链外事实和结算的十道题。"}</p></div><button onClick={restart} type="button">{english ? "Try again" : "重新答题"}</button></div>}
    <article className="challenge-question"><div className="challenge-question__meta"><span>{step.eyebrow}</span><small>{english ? `Question ${activeStepIndex + 1} / ${challenge.steps.length} · ${attempts[stepKey] ?? 0} attempts` : `第 ${activeStepIndex + 1} / ${challenge.steps.length} 题 · 已尝试 ${attempts[stepKey] ?? 0} 次`}</small></div><h3>{step.title}</h3><p className="challenge-question__prompt">{step.prompt}</p><div className="challenge-options">{step.options.map((option, index) => <button aria-pressed={selected === index} className={selected === index ? (correct ? "is-correct" : "is-wrong") : ""} key={option} onClick={() => choose(index)} type="button"><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{selected !== null && <div className={`challenge-feedback ${correct ? "is-correct" : "is-wrong"}`} role="status"><strong>{correct ? (english ? "Correct" : "答对了") : (english ? "Try again" : "这题没有答对")}</strong><p>{step.explanation}</p></div>}<div className="challenge-question__actions">{english && !hasEnglishModule ? <span className="text-button challenge-link-disabled">English lesson in progress</span> : <Link className="text-button" href={lessonHref}>{english ? `Open ${labels[step.moduleId] ?? "lesson"} →` : `查看${labels[step.moduleId] ?? "相关课程"} →`}</Link>}{english && !hasEnglishModule ? <span className="text-button challenge-link-disabled">English sandbox in progress</span> : <Link className="text-button" href={labHref}>{english ? "Open sandbox ↗" : "打开实验室 ↗"}</Link>}{selected !== null && correct && activeStepIndex < challenge.steps.length - 1 && <button className="primary-button" onClick={next} type="button">{english ? "Next question →" : "下一题 →"}</button>}{selected !== null && correct && activeStepIndex === challenge.steps.length - 1 && <button className="primary-button" onClick={() => markComplete(challenge.id)} type="button">{english ? "Complete challenge ✓" : "完成练习 ✓"}</button>}</div></article>
  </section>;
}
