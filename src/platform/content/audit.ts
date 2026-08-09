import type { ChallengeDefinition } from "./challenges";
import type { KnowledgeMap, LessonKnowledge } from "@/platform/progress/knowledge";

export interface AuditRecommendation {
  index: number;
  stepId: string;
  moduleId: string;
  lessonId: string;
  lesson: LessonKnowledge | undefined;
  reason: string;
}

function findLesson(map: KnowledgeMap, moduleId: string, lessonId: string) {
  return map.modules.find((module) => module.moduleId === moduleId)?.lessons.find((lesson) => lesson.lessonId === lessonId);
}

export function getRecommendedAuditStart(challenge: ChallengeDefinition, map: KnowledgeMap, answers: Readonly<Record<string, boolean>>, locale: "zh" | "en" = "zh"): AuditRecommendation {
  const english = locale === "en";
  const index = challenge.steps.findIndex((step) => {
    const lesson = findLesson(map, step.moduleId, step.lessonId);
    return !answers[`${challenge.id}:${step.id}`] || lesson?.status !== "verified";
  });
  const safeIndex = index === -1 ? 0 : index;
  const step = challenge.steps[safeIndex];
  const lesson = findLesson(map, step.moduleId, step.lessonId);
  const reason = lesson?.status === "needs-review"
    ? (english ? `“${lesson.title}” is due for review, so start with this question.` : `“${lesson.title}”目前建议复习，可以先从这道题开始。`)
    : lesson?.status === "unstarted"
      ? (english ? `You have not completed “${lesson.title}” yet, so this is a useful place to begin.` : `“${lesson.title}”尚未完成，可以先从相关问题开始。`)
      : (english ? `Start with “${step.title}”.` : `建议从“${step.title}”开始。`);
  return { index: safeIndex, stepId: step.id, moduleId: step.moduleId, lessonId: step.lessonId, lesson, reason };
}
