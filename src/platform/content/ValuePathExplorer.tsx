"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { isModuleAvailableForLocale } from "./localization";
import { modules } from "./registry";
import { valuePathStages, type ValuePathStage } from "./value-path";

type Lens = "flow" | "risk" | "rule";

const lensCopy = {
  zh: {
    flow: { label: "资金变化", eyebrow: "前后变化", heading: "这一步改变了什么" },
    risk: { label: "可能风险", eyebrow: "风险说明", heading: "哪里可能出问题" },
    rule: { label: "检查问题", eyebrow: "理解检查", heading: "用一个问题确认理解" },
  },
  en: {
    flow: { label: "Flow", eyebrow: "TRACE THE STATE", heading: "How the state moves to the next boundary" },
    risk: { label: "Risk boundary", eyebrow: "FIND THE EDGE", heading: "Which assumption can fail first" },
    rule: { label: "Audit question", eyebrow: "ASK THE PROTOCOL", heading: "Check your understanding with one question" },
  },
} as const;

function stageText(stage: ValuePathStage, field: "eyebrow" | "title" | "summary" | "before" | "after" | "risk" | "rule" | "auditQuestion", locale: string) {
  return stage[field][locale === "en" ? "en" : "zh"];
}

export function ValuePathExplorer({ locale }: { locale: string }) {
  const english = locale === "en";
  const copy = lensCopy[english ? "en" : "zh"];
  const [selectedId, setSelectedId] = useState(valuePathStages[0].id);
  const [lens, setLens] = useState<Lens>("flow");
  const selected = valuePathStages.find((stage) => stage.id === selectedId) ?? valuePathStages[0];
  const moduleManifest = modules.find((item) => item.id === selected.moduleId);
  const targetLocale = moduleManifest && isModuleAvailableForLocale(moduleManifest, locale) ? locale : moduleManifest?.locales[0] ?? locale;
  const lesson = moduleManifest?.lessons.find((item) => item.id === selected.lessonId);
  const lessonHref = `/${targetLocale}/learn/${selected.moduleId}/${selected.lessonId}`;
  const labHref = `/${targetLocale}/labs/${selected.moduleId}`;
  const lensBody = useMemo(() => {
    if (lens === "risk") return stageText(selected, "risk", locale);
    if (lens === "rule") return stageText(selected, "auditQuestion", locale);
    return `${stageText(selected, "before", locale)} → ${stageText(selected, "after", locale)}`;
  }, [lens, locale, selected]);

  return (
    <section className="value-path-explorer" aria-label={english ? "System relationship explorer" : "系统关系图"}>
      <div className="value-path-explorer__header">
        <div className="value-path-explorer__intro">
          <span className="eyebrow">{english ? "SYSTEM RELATIONSHIPS · 10 STEPS" : "系统关系 · 10 个环节"}</span>
          <h2>{english ? "How an asset moves through several systems" : "一笔资产怎样经过不同系统"}</h2>
          <p>{english ? "The order is an explanatory example, not a required protocol call sequence. Select a step to read its change, risk, and related course." : "这里的顺序只用于说明系统关系，并不是协议必须遵循的调用流程。选择一个环节，可以查看前后变化、可能风险和相关课程。"}</p>
        </div>
        <div className="value-path-explorer__lenses" role="group" aria-label={english ? "Value path lenses" : "价值路径观察镜头"}>
          {(Object.keys(copy) as Lens[]).map((key) => (
            <button className="value-path-explorer__lens" aria-pressed={lens === key} key={key} onClick={() => setLens(key)} type="button">
              {copy[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="value-path-explorer__body">
        <ol className="value-path-explorer__steps" aria-label={english ? "Value path boundaries" : "价值路径边界"}>
          {valuePathStages.map((stage) => {
            const active = stage.id === selected.id;
            return (
              <li className={active ? "is-active" : ""} key={stage.id}>
                <button className="value-path-explorer__step-button" aria-current={active ? "step" : undefined} onClick={() => setSelectedId(stage.id)} type="button">
                  <span className="value-path-explorer__step-index">{String(stage.step).padStart(2, "0")}</span>
                  <span className="value-path-explorer__step-copy"><small>{stageText(stage, "eyebrow", locale)}</small><strong>{stageText(stage, "title", locale)}</strong><em>{stage.moduleId}</em></span>
                </button>
              </li>
            );
          })}
        </ol>

        <article className="value-path-explorer__detail" aria-live="polite">
          <span className="eyebrow">{stageText(selected, "eyebrow", locale)}</span>
          <h3>{stageText(selected, "title", locale)}</h3>
          <p className="value-path-explorer__summary">{stageText(selected, "summary", locale)}</p>

          <div className="value-path-explorer__state-transition" aria-label={english ? "Before and after" : "前后变化"}>
            <div><small>{english ? "BEFORE" : "这一步之前"}</small><strong>{stageText(selected, "before", locale)}</strong></div>
            <span aria-hidden="true">→</span>
            <div><small>{english ? "AFTER" : "这一步之后"}</small><strong>{stageText(selected, "after", locale)}</strong></div>
          </div>

          <div className="value-path-explorer__lens-panel">
            <small>{copy[lens].eyebrow}</small>
            <h4>{copy[lens].heading}</h4>
            <p>{lensBody}</p>
            {lens === "rule" && <p className="value-path-explorer__audit">{english ? "Think about this before opening the lesson:" : "打开章节前，可以先想一想："} {stageText(selected, "auditQuestion", locale)}</p>}
          </div>

          <div className="value-path-explorer__actions">
            <Link className="primary-button" href={lessonHref}>{targetLocale !== locale ? (english ? "Read Chinese lesson →" : "阅读章节 →") : (english ? "Open lesson →" : "打开章节 →")}</Link>
            <Link className="text-button" href={labHref}>{english ? "Open the sandbox ↗" : "打开实验室 ↗"}</Link>
          </div>
          {!lesson && <p className="value-path-explorer__note">{english ? "This boundary is registered now; its guided lesson is the next content surface." : "这个边界已加入体系，配套引导章节会作为下一步内容继续展开。"}</p>}
        </article>
      </div>
    </section>
  );
}
