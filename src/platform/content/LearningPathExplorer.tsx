"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { modules } from "./registry";
import { getLocalizedModule, isModuleAvailableForLocale } from "./localization";
import { isLearningPathId, learningPaths, type LearningPathId } from "./paths";
import { getDiagnosticRecommendation } from "./diagnostic";
import { useProgressStore } from "@/platform/progress/store";

function moduleHref(locale: string, module: (typeof modules)[number]) {
  return module.status === "available" ? `/${locale}/learn/${module.id}` : `/${locale}/modules/${module.id}`;
}

export function LearningPathExplorer({ locale, initialPathId }: { locale: string; initialPathId?: LearningPathId }) {
  const searchParams = useSearchParams();
  const requestedPath = searchParams.get("path") ?? undefined;
  const requestedPathId = isLearningPathId(requestedPath) ? requestedPath : undefined;
  const [chosenPathId, setChosenPathId] = useState<LearningPathId | null>(requestedPathId ?? initialPathId ?? null);
  const completedLessons = useProgressStore((state) => state.completedLessons);
  const diagnosticGoal = useProgressStore((state) => state.diagnosticGoal);
  const diagnosticAnswers = useProgressStore((state) => state.diagnosticAnswers);
  const diagnosticCompletedAt = useProgressStore((state) => state.diagnosticCompletedAt);
  const availableModuleIds = useMemo(() => modules.filter((manifest) => isModuleAvailableForLocale(manifest, locale)).map((manifest) => manifest.id), [locale]);
  const recommendedPathId = diagnosticGoal && diagnosticCompletedAt
    ? getDiagnosticRecommendation(diagnosticGoal, diagnosticAnswers, locale, availableModuleIds).pathId
    : null;
  const pathId = chosenPathId ?? recommendedPathId ?? (locale === "en" ? "foundations-to-markets" : "market-maker");
  const selectedPath = learningPaths.find((path) => path.id === pathId) ?? learningPaths[0];
  const pathModules = selectedPath.moduleIds.map((id) => modules.find((module) => module.id === id)).filter((module): module is (typeof modules)[number] => Boolean(module)).filter((module) => isModuleAvailableForLocale(module, locale)).map((module) => getLocalizedModule(module, locale));
  const english = locale === "en";
  const completedModules = useMemo(() => new Set(pathModules.filter((module) => module.lessons.every((lesson) => completedLessons.includes(`${module.id}:${lesson.id}`))).map((module) => module.id)), [completedLessons, pathModules]);
  const nextModule = pathModules.find((module) => !completedModules.has(module.id));

  const pathTitles = english ? { "foundations-to-markets": "Foundations to markets", "market-maker": "Market mechanisms", "risk-and-truth": "Risk and reality", "settlement-audit": "Settlement audit" } : null;
  const pathDescriptions = english ? { "foundations-to-markets": "Understand assets, state, and governance before entering AMMs, prediction markets, oracles, lending, stablecoins, and ordering.", "market-maker": "Compare order books, AMMs, matching engines, and transaction ordering through the lens of price discovery.", "risk-and-truth": "See where governance, price, oracles, liquidity, ordering, and system boundaries fail.", "settlement-audit": "Follow finality, oracle handoff, prediction-market payout, and ordering as one auditable dependency chain." } : null;
  return <section className="learning-path-explorer" aria-label={english ? "Cross-module learning paths" : "跨模块学习路径"}>
    <header className="learning-path-explorer__header"><div><span className="eyebrow">{recommendedPathId === selectedPath.id && !chosenPathId ? (english ? "YOUR RECOMMENDED ROUTE" : "为你推荐的路线") : (english ? "CURRENT ROUTE" : "当前学习路线")}</span><h2>{pathTitles?.[selectedPath.id] ?? selectedPath.label}</h2><p>{pathDescriptions?.[selectedPath.id] ?? selectedPath.description}</p></div>{nextModule && <Link className="primary-button" href={moduleHref(locale, nextModule)}>{english ? `Continue: ${nextModule.shortTitle} →` : `继续：${nextModule.shortTitle} →`}</Link>}</header>
    {pathModules.length ? <ol className="learning-path-explorer__steps">{pathModules.map((module, index) => { const done = completedModules.has(module.id); const available = module.status === "available"; return <li className={`${done ? "is-done" : ""} ${module.id === nextModule?.id ? "is-next" : ""}`} key={module.id}><span className="learning-path-explorer__line" aria-hidden="true" /><div className="learning-path-explorer__index">{done ? "✓" : String(index + 1).padStart(2, "0")}</div><Link href={moduleHref(locale, module)}><div><span>{available ? (english ? "Open" : "课程已开放") : (english ? "Planned" : "内容准备中")}</span><h3>{module.title}</h3><p>{module.summary}</p><small>{english ? `${module.lessons.length} lesson${module.lessons.length === 1 ? "" : "s"} · ${module.estimatedMinutes} min` : `${module.lessons.length} 章 · ${module.estimatedMinutes} 分钟`}{module.prerequisites.length ? ` · ${english ? "Prerequisites: " : "建议先学："}${module.prerequisites.map((id) => modules.find((item) => item.id === id)?.shortTitle ?? id).join(english ? ", " : "、")}` : ""}</small></div><strong>{available ? (english ? "Open course →" : "查看课程 →") : (english ? "View route →" : "查看介绍 →")}</strong></Link></li>; })}</ol> : <div className="learning-path-explorer__empty"><strong>{english ? "This path is still being translated." : "这条路线还在补充内容。"}</strong><p>{english ? "Start with the Minimal Ledger or Oracle course while the rest of the path opens up." : "你可以先从最小账本或预言机课程开始，其他章节会逐步开放。"}</p></div>}
    <details className="learning-path-explorer__alternatives">
      <summary><span><strong>{english ? "Why are there other routes?" : "其他路线有什么不同？"}</strong><small>{english ? "The courses are the same; only their order changes." : "课程内容相同，只是排列顺序不同。"}</small></span><b>{english ? "View or switch" : "查看或更换"}</b></summary>
      <div>{learningPaths.map((path) => <button aria-pressed={path.id === selectedPath.id} onClick={() => setChosenPathId(path.id)} key={path.id} type="button"><strong>{pathTitles?.[path.id] ?? path.label}</strong><small>{pathDescriptions?.[path.id] ?? path.description}</small></button>)}</div>
    </details>
  </section>;
}
