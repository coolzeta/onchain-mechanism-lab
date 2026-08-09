import type { LessonManifest, ModuleManifest } from "@/platform/types/learning";
import type { ReviewSchedule } from "./review";

export type KnowledgeStatus = "unstarted" | "investigating" | "needs-review" | "verified";
export type KnowledgeLocale = "zh" | "en";

export interface KnowledgeProgressSnapshot {
  completedLessons: readonly string[];
  checkpointAnswers: Readonly<Record<string, boolean>>;
  checkpointAttempts: Readonly<Record<string, number>>;
  completedTasks: readonly string[];
  reviewedLessons?: Readonly<Record<string, number>>;
  reviewSchedules?: Readonly<Record<string, ReviewSchedule>>;
}

export interface LessonKnowledge {
  moduleId: string;
  lessonId: string;
  title: string;
  summary: string;
  score: number;
  status: KnowledgeStatus;
  lessonComplete: boolean;
  taskComplete: boolean;
  checkpointCorrect: boolean;
  checkpointAttempts: number;
  reviewedAt: number | null;
  reviewSchedule: ReviewSchedule | null;
  recommendation: string;
  href: string;
}

export interface ModuleKnowledge {
  moduleId: string;
  title: string;
  summary: string;
  score: number;
  status: KnowledgeStatus;
  lessons: LessonKnowledge[];
  completedLessons: number;
  completedTasks: number;
  correctChecks: number;
}

export interface KnowledgeMap {
  modules: ModuleKnowledge[];
  weakestLessons: LessonKnowledge[];
}

function lessonKey(moduleId: string, lessonId: string) {
  return `${moduleId}:${lessonId}`;
}

function taskKey(moduleId: string, lesson: LessonManifest) {
  return `${moduleId}:${lesson.id}:${lesson.task.id}`;
}

function getStatus(score: number, checkpointAttempts: number, checkpointCorrect: boolean): KnowledgeStatus {
  if (score === 0) return "unstarted";
  if (score === 100) return "verified";
  if (checkpointAttempts > 0 && !checkpointCorrect) return "needs-review";
  return "investigating";
}

function recommendation(lessonComplete: boolean, taskComplete: boolean, checkpointAttempts: number, checkpointCorrect: boolean, english: boolean) {
  if (!taskComplete) return english ? "Return to this lesson and complete the interactive exercise." : "回到本章，完成互动练习。";
  if (checkpointAttempts > 0 && !checkpointCorrect) return english ? "Read the explanation again, then answer the knowledge check once more." : "重新阅读相关说明，再回答一次理解检查。";
  if (!checkpointCorrect) return english ? "Complete the knowledge check." : "完成理解检查。";
  if (!lessonComplete) return english ? "Save this lesson to update your progress." : "保存本章，更新学习进度。";
  return english ? "Try another scenario in the free sandbox if you want more practice." : "如需继续练习，可以在自由实验室中尝试其他场景。";
}

export function getLessonKnowledge(module: ModuleManifest, lesson: LessonManifest, progress: KnowledgeProgressSnapshot, locale: KnowledgeLocale = "zh"): LessonKnowledge {
  const lessonComplete = progress.completedLessons.includes(lessonKey(module.id, lesson.id));
  const taskComplete = progress.completedTasks.includes(taskKey(module.id, lesson));
  const checkpointAttempts = progress.checkpointAttempts[lesson.checkpointId] ?? 0;
  const checkpointCorrect = progress.checkpointAnswers[lesson.checkpointId] === true;
  const reviewSchedule = progress.reviewSchedules?.[lessonKey(module.id, lesson.id)] ?? null;
  const reviewedAt = reviewSchedule?.lastReviewedAt ?? progress.reviewedLessons?.[lessonKey(module.id, lesson.id)] ?? null;
  const score = (lessonComplete ? 25 : 0) + (taskComplete ? 25 : 0) + (checkpointAttempts > 0 ? 10 : 0) + (checkpointCorrect ? 40 : 0);
  return {
    moduleId: module.id,
    lessonId: lesson.id,
    title: lesson.title,
    summary: lesson.summary,
    score,
    status: getStatus(score, checkpointAttempts, checkpointCorrect),
    lessonComplete,
    taskComplete,
    checkpointCorrect,
    checkpointAttempts,
    reviewedAt,
    reviewSchedule,
    recommendation: recommendation(lessonComplete, taskComplete, checkpointAttempts, checkpointCorrect, locale === "en"),
    href: `/learn/${module.id}/${lesson.id}`,
  };
}

export function buildKnowledgeMap(modules: readonly ModuleManifest[], progress: KnowledgeProgressSnapshot, locale: KnowledgeLocale = "zh"): KnowledgeMap {
  const moduleKnowledge = modules.map((module) => {
    const lessons = module.lessons.map((lesson) => getLessonKnowledge(module, lesson, progress, locale));
    const score = lessons.length ? Math.round(lessons.reduce((total, lesson) => total + lesson.score, 0) / lessons.length) : 0;
    return {
      moduleId: module.id,
      title: module.title,
      summary: module.summary,
      score,
      status: score === 100 ? "verified" : score > 0 ? "investigating" : "unstarted",
      lessons,
      completedLessons: lessons.filter((lesson) => lesson.lessonComplete).length,
      completedTasks: lessons.filter((lesson) => lesson.taskComplete).length,
      correctChecks: lessons.filter((lesson) => lesson.checkpointCorrect).length,
    } satisfies ModuleKnowledge;
  });
  const weakestLessons = moduleKnowledge
    .flatMap((module) => module.lessons)
    .filter((lesson) => lesson.status !== "verified")
    .sort((a, b) => a.score - b.score || a.title.localeCompare(b.title))
    .slice(0, 3);
  return { modules: moduleKnowledge, weakestLessons };
}
