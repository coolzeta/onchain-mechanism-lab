"use client";

import Link from "next/link";
import { useProgressStore } from "@/platform/progress/store";
import type { ModuleManifest } from "@/platform/types/learning";

export function LessonSidebar({ module, currentLesson, locale }: { module: ModuleManifest; currentLesson?: string; locale: string }) {
  const completed = useProgressStore((state) => state.completedLessons);
  const english = locale === "en";
  return (
    <aside className="lesson-sidebar">
      <Link className="lesson-sidebar__back" href={`/${locale}/learn/${module.id}`}>← {english ? "Course overview" : "课程概览"}</Link>
      <span className="lesson-sidebar__eyebrow">{module.shortTitle}</span>
      <ol>
        {module.lessons.map((lesson) => {
          const key = `${module.id}:${lesson.id}`;
          const isDone = completed.includes(key);
          return (
            <li className={currentLesson === lesson.id ? "is-current" : ""} key={lesson.id}>
              <Link aria-current={currentLesson === lesson.id ? "page" : undefined} aria-label={`${english ? `Lesson ${lesson.number}: ` : `第 ${lesson.number} 章：`}${lesson.title}`} href={`/${locale}/learn/${module.id}/${lesson.id}`}>
                <span>{isDone ? "✓" : String(lesson.number).padStart(2, "0")}</span>
                <div><small>{lesson.eyebrow}</small><strong>{lesson.title}</strong></div>
              </Link>
            </li>
          );
        })}
      </ol>
      <Link className="sidebar-lab-link" href={`/${locale}/labs/${module.id}`}>{english ? "Open sandbox ↗" : "打开自由实验室 ↗"}</Link>
    </aside>
  );
}
