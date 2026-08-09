"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { modules } from "@/platform/content/registry";
import { getLocalizedModule, isModuleAvailableForLocale } from "@/platform/content/localization";
import { buildKnowledgeMap, type LessonKnowledge } from "./knowledge";
import { formatReviewDue, isReviewDue, type ReviewRating } from "./review";
import { useProgressStore } from "./store";

function lessonKey(lesson: LessonKnowledge) {
  return lesson.moduleId + ":" + lesson.lessonId;
}

export function ReviewQueue({ locale }: { locale: string }) {
  const english = locale === "en";
  const completedLessons = useProgressStore((state) => state.completedLessons);
  const checkpointAnswers = useProgressStore((state) => state.checkpointAnswers);
  const checkpointAttempts = useProgressStore((state) => state.checkpointAttempts);
  const completedTasks = useProgressStore((state) => state.completedTasks);
  const reviewedLessons = useProgressStore((state) => state.reviewedLessons);
  const reviewSchedules = useProgressStore((state) => state.reviewSchedules);
  const reviewLesson = useProgressStore((state) => state.reviewLesson);
  const activeModules = useMemo(() => modules.filter((module) => isModuleAvailableForLocale(module, locale)).map((module) => getLocalizedModule(module, locale)), [locale]);
  const map = useMemo(() => buildKnowledgeMap(activeModules, { completedLessons, checkpointAnswers, checkpointAttempts, completedTasks, reviewedLessons, reviewSchedules }, english ? "en" : "zh"), [activeModules, checkpointAnswers, checkpointAttempts, completedLessons, completedTasks, english, reviewedLessons, reviewSchedules]);
  const [now] = useState(() => Date.now());
  const queue = useMemo(() => [...map.weakestLessons].sort((a, b) => {
    const aDue = isReviewDue(a.reviewSchedule ?? undefined, now);
    const bDue = isReviewDue(b.reviewSchedule ?? undefined, now);
    if (aDue !== bDue) return aDue ? -1 : 1;
    if (aDue && bDue && a.reviewSchedule && b.reviewSchedule && a.reviewSchedule.dueAt !== b.reviewSchedule.dueAt) return a.reviewSchedule.dueAt - b.reviewSchedule.dueAt;
    return a.score - b.score || a.title.localeCompare(b.title);
  }).slice(0, 3), [map.weakestLessons, now]);

  function rateLesson(lesson: LessonKnowledge, rating: ReviewRating) {
    reviewLesson(lessonKey(lesson), rating);
  }

  return <section className="review-queue" aria-label={english ? "Suggested review" : "复习建议"}>
    <header className="review-queue__header"><div><span className="eyebrow">{english ? "SUGGESTED REVIEW" : "复习建议"}</span><h2>{english ? "Review up to three lessons at a time." : "每次复习一到三章即可"}</h2><p>{english ? "Review the explanation, complete the interactive exercise, and answer the knowledge check again." : "可以先回看说明，再完成互动练习，并重新回答理解检查。"}</p></div><span className="review-queue__count">{queue.length} {english ? "queued" : "待复习"}</span></header>
    {queue.length ? <div className="review-queue__list">{queue.map((lesson, index) => <article key={lesson.moduleId + "-" + lesson.lessonId}><header><div><span className="review-queue__number">0{index + 1}</span><h3>{lesson.title}</h3></div><strong>{lesson.score}<small>/100</small></strong></header><p className="review-queue__recommendation">{lesson.recommendation}</p><ol><li className={lesson.taskComplete ? "is-done" : ""}><span>01</span><div><strong>{english ? "Interactive exercise" : "互动练习"}</strong><small>{lesson.taskComplete ? (english ? "Complete" : "已完成") : (english ? "Not complete" : "尚未完成")}</small></div><Link href={"/" + locale + lesson.href}>{lesson.taskComplete ? (english ? "Review →" : "回看 →") : (english ? "Do it →" : "去完成 →")}</Link></li><li className={lesson.checkpointCorrect ? "is-done" : ""}><span>02</span><div><strong>{english ? "Knowledge check" : "理解检查"}</strong><small>{lesson.checkpointCorrect ? (english ? "Answered correctly" : "已答对") : lesson.checkpointAttempts ? (english ? "Try again" : "需要再答一次") : (english ? "Not attempted" : "还没尝试")}</small></div><Link href={"/" + locale + lesson.href}>{lesson.checkpointCorrect ? (english ? "Review →" : "回看 →") : (english ? "Try it →" : "去回答 →")}</Link></li><li><span>03</span><div><strong>{english ? "Free sandbox" : "自由实验室"}</strong><small>{english ? "Try another scenario" : "尝试其他场景"}</small></div><Link href={"/" + locale + "/labs/" + lesson.moduleId}>{english ? "Open →" : "打开 →"}</Link></li></ol><footer><span>{formatReviewDue(lesson.reviewSchedule ?? undefined, now, english ? "en" : "zh")}</span><div className="review-queue__ratings" aria-label={english ? `Rate review for ${lesson.title}` : `评价复习：${lesson.title}`}><button className="is-again" onClick={() => rateLesson(lesson, "again")} type="button">{english ? "Again · 10 min" : "还不熟 · 10 分钟"}</button><button className="is-hard" onClick={() => rateLesson(lesson, "hard")} type="button">{english ? "Hard · tomorrow" : "有点难 · 明天"}</button><button className="is-good" onClick={() => rateLesson(lesson, "good")} type="button">{english ? "Got it · 1 day" : "已经会了 · 1 天"}</button></div></footer></article>)}</div> : <div className="review-queue__empty"><strong>{english ? "There is nothing to review yet." : "目前没有待复习内容"}</strong><p>{english ? "Complete a lesson or a knowledge check first. Suggestions will appear here." : "完成章节或理解检查后，这里会出现复习建议。"}</p><Link href={"/" + locale + "/"}>{english ? "Browse courses →" : "查看课程 →"}</Link></div>}
  </section>;
}
