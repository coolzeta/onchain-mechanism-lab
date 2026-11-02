"use client";

import Link from "next/link";
import { modules } from "@/platform/content/registry";
import { getLocalizedModule, isModuleAvailableForLocale } from "@/platform/content/localization";
import type { ModuleManifest } from "@/platform/types/learning";
import { useProgressStore } from "./store";
import { KnowledgeMap } from "./KnowledgeMap";
import { ReviewQueue } from "./ReviewQueue";
import { DependencyGraph } from "@/platform/content/DependencyGraph";

function lessonKey(module: ModuleManifest, lessonId: string) {
  return `${module.id}:${lessonId}`;
}

export function ProgressDashboard({ locale }: { locale: string }) {
  const english = locale === "en";
  const completedLessons = useProgressStore((state) => state.completedLessons);
  const checkpointAnswers = useProgressStore((state) => state.checkpointAnswers);
  const completedChallenges = useProgressStore((state) => state.completedChallenges);
  const completedTasks = useProgressStore((state) => state.completedTasks);
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const availableModules = modules
    .filter((module) => isModuleAvailableForLocale(module, locale))
    .map((module) => getLocalizedModule(module, locale))
    .sort((a, b) => {
      if (locale !== "en") return 0;
      const order = ["ledger", "token-launch", "governance", "prediction-markets", "amm", "matching-engine", "mev", "lending", "stablecoins", "oracles", "rwa"];
      return order.indexOf(a.id) - order.indexOf(b.id);
    });
  const totalLessons = availableModules.reduce((total, module) => total + module.lessons.length, 0);
  const totalTasks = totalLessons;
  const taskCount = availableModules.reduce((total, module) => total + module.lessons.filter((lesson) => completedTasks.includes(`${module.id}:${lesson.id}:${lesson.task.id}`)).length, 0);
  const completedCount = availableModules.reduce((total, module) => total + module.lessons.filter((lesson) => completedLessons.includes(lessonKey(module, lesson.id))).length, 0);
  const masteredCount = availableModules.reduce((total, module) => total + module.lessons.filter((lesson) => checkpointAnswers[lesson.checkpointId]).length, 0);
  const percent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;
  const next = availableModules.flatMap((module) => module.lessons.map((lesson) => ({ module, lesson }))).find(({ module, lesson }) => !completedLessons.includes(lessonKey(module, lesson.id)));
  const challengeDone = completedChallenges.includes("mechanism-systems-audit");

  function handleReset() {
    const message = english ? "Reset all local learning progress?" : "要清空本地学习进度吗？";
    if (window.confirm(message)) resetProgress();
  }

  return <section className="progress-dashboard" aria-label={english ? "Learning progress dashboard" : "学习进度中心"}>
    <header className="progress-dashboard__hero">
      <div>
        <span className="eyebrow">{english ? "LEARNING PROGRESS" : "学习进度"}</span>
        <h1>{english ? "Continue where you left off." : "从上次停下的地方继续"}</h1>
        <p>{english ? "Progress is stored only in this browser. This page lists completed lessons, exercises, checks, and suggested reviews." : "进度只保存在当前浏览器。这里会汇总已完成的章节、互动练习、理解检查和待复习内容。"}</p>
      </div>
      <div className="progress-dashboard__score" aria-label={english ? `${percent}% of lessons complete` : `已完成 ${percent}% 的课程`}>
        <strong>{percent}<small>%</small></strong>
        <span>{english ? "lessons complete" : "课程完成"}</span>
      </div>
    </header>

    <div className="progress-dashboard__metrics" aria-label={english ? "Progress metrics" : "进度指标"}>
      <article><span>{english ? "Lessons" : "课程章节"}</span><strong>{completedCount}<small> / {totalLessons}</small></strong><p>{english ? "completed" : "已完成"}</p></article>
      <article><span>{english ? "Checks" : "检查题"}</span><strong>{masteredCount}<small> / {totalLessons}</small></strong><p>{english ? "answered correctly" : "答对过"}</p></article>
      <article><span>{english ? "Exercises" : "互动练习"}</span><strong>{taskCount}<small> / {totalTasks}</small></strong><p>{english ? "completed" : "已完成"}</p></article>
      <article><span>{english ? "Systems challenge" : "系统挑战"}</span><strong>{challengeDone ? "1" : "0"}<small> / 1</small></strong><p>{challengeDone ? (english ? "completed" : "已完成") : (english ? "not yet" : "尚未完成")}</p></article>
    </div>

    <DependencyGraph locale={locale} />
    <KnowledgeMap locale={locale} />
    <ReviewQueue locale={locale} />

    <div className="progress-dashboard__next">
      <div><span className="eyebrow">{next ? (english ? "CONTINUE LEARNING" : "继续学习") : (english ? "ALL COURSES COMPLETE" : "课程已全部完成")}</span><h2>{next ? next.lesson.title : (english ? "You have completed every open lesson." : "当前开放的章节都已完成")}</h2><p>{next ? next.lesson.summary : (english ? "You can review a course, try another sandbox scenario, or take the systems challenge." : "可以复习任意课程、尝试其他沙盒场景，或完成系统挑战。")}</p></div>
      <div className="progress-dashboard__next-actions">{next ? <Link className="primary-button" href={`/${locale}/learn/${next.module.id}/${next.lesson.id}`}>{english ? `Continue ${next.module.shortTitle} →` : `继续 ${next.module.shortTitle} →`}</Link> : <Link className="primary-button" href={`/${locale}/challenges`}>{english ? "Open systems challenge →" : "查看系统挑战 →"}</Link>}<Link className="text-button" href={`/${locale}/labs/${next?.module.id ?? (english ? "ledger" : "prediction-markets")}`}>{english ? "Open sandbox ↗" : "打开沙盒 ↗"}</Link><Link className="text-button" href={`/${locale}/flows`}>{english ? "View system relationships ↗" : "查看系统关系 ↗"}</Link></div>
    </div>

    <section className="progress-dashboard__modules"><div className="section-heading"><div><span className="eyebrow">{english ? "COURSE PROGRESS" : "各课程进度"}</span><h2>{english ? "Progress by course" : "查看每门课程的完成情况"}</h2></div><p>{english ? "A lesson is complete after its interactive exercise and knowledge check are finished." : "完成互动练习并答对理解检查后，即可保存章节进度。"}</p></div><div className="progress-module-list">{availableModules.map((module) => { const done = module.lessons.filter((lesson) => completedLessons.includes(lessonKey(module, lesson.id))).length; const modulePercent = Math.round((done / module.lessons.length) * 100); const current = module.lessons.find((lesson) => !completedLessons.includes(lessonKey(module, lesson.id))) ?? module.lessons[0]; return <article className={`progress-module-card ${done === module.lessons.length ? "is-complete" : ""}`} key={module.id}><div className="progress-module-card__header"><div><span className="eyebrow">{module.categoryId.toUpperCase()} · {module.id}</span><h3>{module.title}</h3></div><strong>{modulePercent}%</strong></div><p>{module.summary}</p><div className="progress-module-card__track" role="progressbar" aria-label={english ? `${module.title} progress` : `${module.title}进度`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={modulePercent}><span style={{ width: `${modulePercent}%` }} /></div><div className="progress-module-card__footer"><span>{english ? `${done} / ${module.lessons.length} lesson${module.lessons.length === 1 ? "" : "s"}` : `${done} / ${module.lessons.length} 章`}</span><Link href={`/${locale}/learn/${module.id}/${current.id}`}>{done === module.lessons.length ? (english ? "Review →" : "复习 →") : (english ? "Continue →" : "继续 →")}</Link></div></article>; })}</div></section>

    <footer className="progress-dashboard__footer"><p>{english ? "No account. No wallet. No server-side profile." : "没有账户，没有钱包，也不会在服务器保存个人档案。"}</p><button className="text-button" onClick={handleReset} type="button">{english ? "Reset local progress" : "清空本地进度"}</button></footer>
  </section>;
}
