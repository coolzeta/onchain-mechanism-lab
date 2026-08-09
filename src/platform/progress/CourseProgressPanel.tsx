"use client";

import Link from "next/link";
import type { ModuleManifest } from "@/platform/types/learning";
import { getLessonCuriosities } from "@/platform/content/curiosities";
import { useProgressStore } from "./store";

function lessonHref(locale: string, module: ModuleManifest, lessonId: string) {
  return `/${locale}/learn/${module.id}/${lessonId}`;
}

export function CourseProgressPanel({ module, locale }: { module: ModuleManifest; locale: string }) {
  const english = locale === "en";
  const completedLessons = useProgressStore((state) => state.completedLessons);
  const answers = useProgressStore((state) => state.checkpointAnswers);
  const completedCount = module.lessons.filter((lesson) => completedLessons.includes(`${module.id}:${lesson.id}`)).length;
  const masteredCount = module.lessons.filter((lesson) => answers[lesson.checkpointId]).length;
  const percent = Math.round((completedCount / module.lessons.length) * 100);
  const nextLesson = module.lessons.find((lesson) => !completedLessons.includes(`${module.id}:${lesson.id}`)) ?? module.lessons[0];

  return (
    <aside className="course-progress-panel" aria-label={english ? "Course progress" : "课程进度"}>
      <div className="course-progress-panel__heading">
        <span>{english ? "Course progress" : "课程进度"}</span>
        <strong>{percent}%</strong>
      </div>
      <div className="progress-track" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div>
      <div className="course-progress-panel__stats">
        <div><strong>{completedCount}/{module.lessons.length}</strong><span>{english ? "lessons done" : "章节完成"}</span></div>
        <div><strong>{masteredCount}/{module.lessons.length}</strong><span>{english ? "checks correct" : "检查答对"}</span></div>
      </div>
      <Link className="course-progress-panel__continue" href={lessonHref(locale, module, nextLesson.id)}>
        <span>{completedCount === module.lessons.length ? (english ? "Review the course" : "再次复习课程") : completedCount === 0 ? (english ? "Start lesson one" : "从第一章开始") : (english ? "Continue learning" : "继续上次学习")}</span>
        <strong>{nextLesson.number.toString().padStart(2, "0")} · {nextLesson.title} →</strong>
      </Link>
    </aside>
  );
}

export function CourseRoadmap({ module, locale }: { module: ModuleManifest; locale: string }) {
  const completedLessons = useProgressStore((state) => state.completedLessons);
  const nextLesson = module.lessons.find((lesson) => !completedLessons.includes(`${module.id}:${lesson.id}`));

  return (
    <ol className="course-roadmap">
      {module.lessons.map((lesson) => {
        const done = completedLessons.includes(`${module.id}:${lesson.id}`);
        const next = nextLesson?.id === lesson.id;
        const curiosity = getLessonCuriosities(module.id, lesson.id, locale)[0];
        return (
          <li className={`${done ? "is-done" : ""} ${next ? "is-next" : ""}`} key={lesson.id}>
            <Link href={lessonHref(locale, module, lesson.id)} aria-current={next ? "step" : undefined}>
              <span className="course-roadmap__number">{done ? "✓" : String(lesson.number).padStart(2, "0")}</span>
              <div><small>{lesson.eyebrow}</small><h3>{lesson.title}</h3>{curiosity && <p className="course-roadmap__curiosity"><span>{locale === "en" ? "KEY QUESTION" : "本章问题"}</span><strong>{curiosity.question}</strong></p>}<p>{lesson.summary}</p><div className="course-roadmap__tags">{lesson.concepts.map((concept) => <span key={concept}>{concept}</span>)}</div></div>
              <span className="syllabus__time">{lesson.estimatedMinutes} MIN<br />→</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
