"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { getLessonKeyByCheckpoint, getModule } from "@/platform/content/registry";
import { useProgressStore } from "@/platform/progress/store";

export function LessonLead({ children }: { children: React.ReactNode }) {
  return <div className="lesson-lead">{children}</div>;
}

export function Concept({ title, children }: { title: string; children: React.ReactNode }) {
  const english = useLocale() === "en";
  return <aside className="concept-box"><span>{english ? "KEY IDEA" : "关键概念"}</span><h3>{title}</h3><div>{children}</div></aside>;
}

export function Think({ children }: { children: React.ReactNode }) {
  const english = useLocale() === "en";
  return <aside className="think-box"><span aria-hidden="true">?</span><div><strong>{english ? "THINK ABOUT IT" : "想一想"}</strong>{children}</div></aside>;
}

export function MechanismDetails({ children }: { children: React.ReactNode }) {
  const english = useLocale() === "en";
  return <details className="mechanism-details"><summary>{english ? "Expand: how this step works" : "展开：这一步如何实现"}</summary><div>{children}</div></details>;
}

export function SourceList({ children }: { children: React.ReactNode }) {
  const english = useLocale() === "en";
  return <aside className="source-list"><strong>{english ? "Sources and further reading" : "资料与继续阅读"}</strong>{children}</aside>;
}

export function Checkpoint({
  id,
  question,
  options,
  correctIndex,
  explanation,
}: {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}) {
  const english = useLocale() === "en";
  const [selected, setSelected] = useState<number | null>(null);
  const recordCheckpoint = useProgressStore((state) => state.recordCheckpoint);
  const attempts = useProgressStore((state) => state.checkpointAttempts[id] ?? 0);
  const lastAnswer = useProgressStore((state) => state.checkpointAnswers[id]);
  const lessonKey = getLessonKeyByCheckpoint(id);
  const reviewSchedule = useProgressStore((state) => lessonKey ? state.reviewSchedules[lessonKey] : undefined);
  const correct = selected === correctIndex;

  return (
    <section className="checkpoint" id="lesson-checkpoint" aria-labelledby={`${id}-title`}>
      <span className="checkpoint__label">{english ? "KNOWLEDGE CHECK" : "理解检查"}</span>
      <h3 id={`${id}-title`}>{question}</h3>
      <div className="checkpoint__options">
        {options.map((option, index) => (
          <button
            aria-pressed={selected === index}
            className={selected === index ? (correct ? "is-correct" : "is-wrong") : ""}
            key={option}
            onClick={() => { setSelected(index); recordCheckpoint(id, index === correctIndex); }}
            type="button"
          >
            <span>{String.fromCharCode(65 + index)}</span>{option}
          </button>
        ))}
      </div>
      {attempts > 0 && <p className="checkpoint__meta" role="status">{english ? `Attempted ${attempts} times · ${lastAnswer ? "last answer was correct" : "take another look"}` : `已尝试 ${attempts} 次 · ${lastAnswer ? "上次回答正确" : "上次还需要再想一步"}`}{reviewSchedule?.lastRating && <span className="checkpoint__schedule">{reviewSchedule.lastRating === "again" ? (english ? "Review queued soon" : "已安排近期复习") : (english ? "Added to your review interval" : "已加入间隔复习")}</span>}</p>}
      {selected !== null && <p className={`checkpoint__feedback ${correct ? "is-correct" : "is-wrong"}`} role="status">{correct ? (english ? "Correct." : "答对了。") : (english ? "Take another look." : "再想一步。")} {explanation}</p>}
    </section>
  );
}

export function CompleteLesson({ lessonKey, nextHref, nextTitle }: { lessonKey: string; nextHref?: string; nextTitle?: string }) {
  const english = useLocale() === "en";
  const completedLessons = useProgressStore((state) => state.completedLessons);
  const completedTasks = useProgressStore((state) => state.completedTasks);
  const checkpointAnswers = useProgressStore((state) => state.checkpointAnswers);
  const markLessonComplete = useProgressStore((state) => state.markLessonComplete);
  const [moduleId, lessonId] = lessonKey.split(":");
  const lesson = getModule(moduleId)?.lessons.find((candidate) => candidate.id === lessonId);
  const taskKey = lesson ? `${moduleId}:${lessonId}:${lesson.task.id}` : null;
  const taskDone = taskKey ? completedTasks.includes(taskKey) : true;
  const checkpointDone = lesson ? Boolean(checkpointAnswers[lesson.checkpointId]) : true;
  const ready = taskDone && checkpointDone;
  const done = completedLessons.includes(lessonKey);
  return (
    <div className="complete-lesson">
      <div><span>{english ? "LESSON RECAP" : "本章小结"}</span><strong>{done ? (english ? "Lesson saved" : "本章进度已保存") : ready ? (english ? "Exercise complete · save this lesson" : "练习已完成，可以保存本章") : (english ? "Complete the exercise and knowledge check first" : "完成练习和理解检查后，可以保存本章")}</strong>{!done && <ul className="complete-lesson__requirements"><li className={taskDone ? "is-done" : ""}>{taskDone ? "✓" : "○"} <a href="#lesson-task">{english ? "Try the interactive example" : "操作互动示例"}</a></li><li className={checkpointDone ? "is-done" : ""}>{checkpointDone ? "✓" : "○"} <a href="#lesson-checkpoint">{english ? "Answer the knowledge check" : "答对理解检查"}</a></li></ul>}</div>
      {nextHref && done ? <Link className="primary-button" href={nextHref}>{english ? (nextTitle ? `Continue to ${nextTitle} →` : "Open the sandbox →") : (nextTitle ? `进入下一章：${nextTitle} →` : "进入下一章 →")}</Link> : (
        <button className="primary-button" disabled={!ready} onClick={() => markLessonComplete(lessonKey)} type="button">{english ? "Save lesson" : "保存本章"}</button>
      )}
    </div>
  );
}
