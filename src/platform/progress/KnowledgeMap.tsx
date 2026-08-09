"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { modules } from "@/platform/content/registry";
import { getLocalizedModule, isModuleAvailableForLocale } from "@/platform/content/localization";
import { buildKnowledgeMap, type KnowledgeStatus } from "./knowledge";
import { formatReviewDue } from "./review";
import { useProgressStore } from "./store";

const statusLabels: Record<KnowledgeStatus, { zh: string; en: string }> = {
  unstarted: { zh: "未开始", en: "Not started" },
  investigating: { zh: "学习中", en: "In progress" },
  "needs-review": { zh: "建议复习", en: "Needs review" },
  verified: { zh: "已完成", en: "Complete" },
};

export function KnowledgeMap({ locale }: { locale: string }) {
  const english = locale === "en";
  const completedLessons = useProgressStore((state) => state.completedLessons);
  const checkpointAnswers = useProgressStore((state) => state.checkpointAnswers);
  const checkpointAttempts = useProgressStore((state) => state.checkpointAttempts);
  const completedTasks = useProgressStore((state) => state.completedTasks);
  const reviewSchedules = useProgressStore((state) => state.reviewSchedules);
  const [now] = useState(() => Date.now());
  const activeModules = useMemo(() => modules.filter((module) => isModuleAvailableForLocale(module, locale)).map((module) => getLocalizedModule(module, locale)), [locale]);
  const map = useMemo(() => buildKnowledgeMap(activeModules, { completedLessons, checkpointAnswers, checkpointAttempts, completedTasks, reviewSchedules }, english ? "en" : "zh"), [activeModules, checkpointAnswers, checkpointAttempts, completedLessons, completedTasks, english, reviewSchedules]);

  function statusLabel(status: KnowledgeStatus) {
    return statusLabels[status][english ? "en" : "zh"];
  }

  return <section className="knowledge-map" aria-label={english ? "Learning overview" : "学习情况"}>
    <header className="knowledge-map__header">
      <div><span className="eyebrow">{english ? "LEARNING OVERVIEW" : "学习情况"}</span><h2>{english ? "Lessons that may need another look" : "哪些章节可能需要再看一次"}</h2><p>{english ? "The score combines lesson completion, the interactive exercise, and the knowledge check. It is only used to order review suggestions." : "分数由章节完成情况、互动练习和理解检查组成，只用于排列复习建议。"}</p></div>
      <span className="knowledge-map__legend">{english ? "For review only" : "仅供安排复习"}</span>
    </header>

    <div className="knowledge-map__weakest">
      <div className="knowledge-map__subheading"><span className="eyebrow">{english ? "SUGGESTED REVIEW" : "建议复习"}</span><strong>{english ? "Start with the lowest-scoring lessons" : "优先回看完成度较低的章节"}</strong></div>
      {map.weakestLessons.length ? <div className="knowledge-map__weakest-list">{map.weakestLessons.map((lesson) => <article key={`${lesson.moduleId}-${lesson.lessonId}`}><div className="knowledge-map__lesson-score"><strong>{lesson.score}</strong><span>/100</span></div><div><span className={`knowledge-map__status is-${lesson.status}`}>{statusLabel(lesson.status)}</span><h3>{lesson.title}</h3><p>{lesson.recommendation}</p><small className="knowledge-map__review-due">{formatReviewDue(lesson.reviewSchedule ?? undefined, now, english ? "en" : "zh")}</small></div><Link href={`/${locale}${lesson.href}`}>{english ? "Open →" : "打开 →"}</Link></article>)}</div> : <div className="knowledge-map__empty">{english ? "There is nothing to review yet. Complete a lesson or knowledge check first." : "目前没有待复习内容。完成课程或理解检查后，这里会给出建议。"}</div>}
    </div>

    <div className="knowledge-map__modules">{map.modules.map((module) => <details className={`knowledge-map__module is-${module.status}`} key={module.moduleId} open={module.status === "investigating" || module.status === "needs-review"}><summary><div><span className="eyebrow">{module.moduleId}</span><h3>{module.title}</h3></div><div className="knowledge-map__module-score"><strong>{module.score}</strong><span>/100 · {statusLabel(module.status)}</span></div></summary><div className="knowledge-map__module-body"><p>{module.summary}</p><div className="knowledge-map__module-stats"><span>{module.completedLessons}/{module.lessons.length} {english ? "lessons" : "章节"}</span><span>{module.completedTasks}/{module.lessons.length} {english ? "investigations" : "任务"}</span><span>{module.correctChecks}/{module.lessons.length} {english ? "checks" : "检查答对"}</span></div><ol>{module.lessons.map((lesson, index) => <li className={`knowledge-map__lesson is-${lesson.status}`} key={lesson.lessonId}><div className="knowledge-map__lesson-marker" aria-hidden="true">{lesson.status === "verified" ? "✓" : String(index + 1).padStart(2, "0")}</div><div><div className="knowledge-map__lesson-heading"><h4>{lesson.title}</h4><span>{lesson.score}/100 · {statusLabel(lesson.status)}</span></div><p>{lesson.recommendation}</p></div><Link href={`/${locale}${lesson.href}`} aria-label={`${english ? "Open " : "打开"}${lesson.title}`}>→</Link></li>)}</ol></div></details>)}</div>
    <footer className="knowledge-map__footer"><p>{english ? "The systems challenge combines several courses in one case." : "系统挑战会把多门课程放进同一个案例中。"}</p><Link href={`/${locale}/challenges`}>{english ? "Open the systems challenge →" : "查看系统挑战 →"}</Link></footer>
  </section>;
}
