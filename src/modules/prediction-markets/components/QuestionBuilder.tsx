"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

const subscribeToHydration = () => () => undefined;
const getClientHydration = () => true;
const getServerHydration = () => false;

export function QuestionBuilder({ locale = "zh" }: { locale?: "zh" | "en" }) {
  const english = locale === "en";
  const variants = english ? [
    { text: "Will humans return to the Moon soon?", checks: [false, false, false], note: "“Soon” has no deadline, and “humans return” names neither a verifiable source nor an exact event." },
    { text: "Will humans return to the Moon before 2028?", checks: [true, true, false], note: "The time is clearer, but “return” and the resolution source still need definitions." },
    { text: "By 2028-12-31 23:59 UTC, will a NASA-published mission report confirm a human touched the lunar surface?", checks: [true, true, true], note: "This version names a deadline, an observable event, and a designated source." },
  ] : [
    { text: "人类很快会再次登月吗？", checks: [false, false, false], note: "“很快”没有截止日期，“人类登月”也没有指定可靠来源。" },
    { text: "2028 年前，人类会再次踏上月球吗？", checks: [true, true, false], note: "时间明确了，但还需要定义“踏上”和结果来源。" },
    { text: "截至 2028-12-31 23:59 UTC，是否有人类在 NASA 公布的任务中接触月球表面？", checks: [true, true, true], note: "这份问题已经给出截止时间、可观察事件和指定来源。" },
  ];
  const [index, setIndex] = useState(0);
  const isInteractive = useSyncExternalStore(subscribeToHydration, getClientHydration, getServerHydration);
  const current = variants[index];
  const score = useMemo(() => current.checks.filter(Boolean).length, [current]);

  return (
    <section className="interactive-panel question-builder" aria-label={english ? "Settleable question lab" : "可结算问题实验"}>
      <header><span>{english ? "Question editor" : "问题编辑器"}</span><strong>{score}/3 {english ? "anchors defined" : "条件明确"}</strong></header>
      <div className="question-builder__screen"><small>{english ? "Market question" : "市场问题"} v{index + 1}</small><p>{current.text}</p></div>
      <div className="check-grid">
        {(english ? ["Deadline", "Observable event", "Resolution source"] : ["截止时间", "可观察事件", "指定结果来源"]).map((label, checkIndex) => <div className={current.checks[checkIndex] ? "is-ready" : ""} key={label}><span>{current.checks[checkIndex] ? "✓" : "·"}</span>{label}</div>)}
      </div>
      <p className="panel-note">{current.note}</p>
      <div className="segmented-control" aria-label={english ? "Question versions" : "问题版本"}>
        {variants.map((_, variantIndex) => <button aria-pressed={index === variantIndex} disabled={!isInteractive} key={variantIndex} onClick={() => setIndex(variantIndex)} type="button">{english ? `Version ${variantIndex + 1}` : `版本 ${variantIndex + 1}`}</button>)}
      </div>
    </section>
  );
}
