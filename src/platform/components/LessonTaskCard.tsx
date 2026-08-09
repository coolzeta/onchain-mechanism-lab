"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import type { LessonTask } from "@/platform/types/learning";
import { useProgressStore } from "@/platform/progress/store";
import { LessonCuriosityDeck } from "./LessonCuriosityDeck";
import { LessonJourneyStrip } from "./LessonJourneyStrip";

export function LessonTaskCard({ task, taskKey }: { task: LessonTask; taskKey: string }) {
  const english = useLocale() === "en";
  const complete = useProgressStore((state) => state.completedTasks.includes(taskKey));
  const markTaskComplete = useProgressStore((state) => state.markTaskComplete);
  const [moduleId, lessonId] = taskKey.split(":");

  useEffect(() => {
    if (complete) return;
    const recordInteraction = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".interactive-panel, [class$='-lab'], [class*='-lab ']")) {
        markTaskComplete(taskKey);
      }
    };
    document.addEventListener("click", recordInteraction, true);
    document.addEventListener("input", recordInteraction, true);
    return () => {
      document.removeEventListener("click", recordInteraction, true);
      document.removeEventListener("input", recordInteraction, true);
    };
  }, [complete, markTaskComplete, taskKey]);

  const openExperiment = () => {
    document.querySelector(".interactive-panel, .lesson-content [class$='-lab'], .lesson-content [class*='-lab ']")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <LessonJourneyStrip moduleId={moduleId} lessonId={lessonId} locale={english ? "en" : "zh"} />
      <LessonCuriosityDeck moduleId={moduleId} lessonId={lessonId} locale={english ? "en" : "zh"} />
      <aside id="lesson-task" className={`lesson-task-card ${complete ? "is-complete" : ""}`} aria-label={english ? "Lesson exercise" : "本章练习"}>
        <header>
          <div>
            <span className="eyebrow">{english ? "LESSON EXERCISE" : "本章练习"}</span>
            <h2>{task.title}</h2>
          </div>
          <span className="lesson-task-card__status" aria-label={complete ? (english ? "Task completed" : "任务已完成") : (english ? "Waiting for experiment" : "等待实验操作")}>{complete ? "✓" : "↓"}</span>
        </header>
        <div className="lesson-task-card__belief">
          <span>{english ? "Common misconception" : "常见误解"}</span>
          <p>“{task.misconception}”</p>
        </div>
        <ol>
          <li><span>{english ? "Do" : "需要操作"}</span><p>{task.action}</p></li>
          <li><span>{english ? "Look for" : "观察结果"}</span><p>{task.evidence}</p></li>
        </ol>
        <button className="lesson-task-card__complete" disabled={complete} onClick={openExperiment} type="button">
          {complete ? (english ? "Exercise recorded ✓" : "练习已记录 ✓") : (english ? "Go to the interactive example ↓" : "前往互动示例 ↓")}
        </button>
      </aside>
    </>
  );
}
