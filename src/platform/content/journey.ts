import type { ModuleManifest } from "@/platform/types/learning";
import type { DiagnosticGoal, DiagnosticQuestionId } from "./diagnostic";
import { getDiagnosticRecommendation } from "./diagnostic";
import { learningPaths, type LearningPathId } from "./paths";

export const journeyStageIds = ["orient", "learn", "experiment", "connect", "review"] as const;
export type JourneyStageId = (typeof journeyStageIds)[number];

export interface JourneyProgress {
  completedLessons: readonly string[];
  completedTasks: readonly string[];
  checkpointAnswers: Readonly<Record<string, boolean>>;
  completedChallenges: readonly string[];
  diagnosticGoal: DiagnosticGoal | null;
  diagnosticAnswers: Partial<Record<DiagnosticQuestionId, number>>;
  diagnosticCompletedAt: number | null;
}

export interface JourneyNextStep {
  stage: JourneyStageId;
  stageIndex: number;
  pathId: LearningPathId | null;
  pathLabel: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  progressLabel: string;
}

function pathCopy(pathId: LearningPathId, locale: string) {
  const english = locale === "en";
  const titles: Record<LearningPathId, string> = english
    ? {
      "foundations-to-markets": "Foundations to markets",
      "market-maker": "Market mechanisms",
      "risk-and-truth": "Risk and reality",
      "settlement-audit": "Settlement audit",
    }
    : Object.fromEntries(learningPaths.map((path) => [path.id, path.label])) as Record<LearningPathId, string>;
  return titles[pathId];
}

function lessonHref(locale: string, manifest: ModuleManifest, lessonId: string) {
  return `/${locale}/learn/${manifest.id}/${lessonId}`;
}

export function getJourneyNextStep(
  locale: string,
  manifests: readonly ModuleManifest[],
  progress: JourneyProgress,
): JourneyNextStep {
  const english = locale === "en";
  const hasLearningEvidence = progress.completedLessons.length > 0
    || progress.completedTasks.length > 0
    || Object.keys(progress.checkpointAnswers).length > 0;
  const diagnosticComplete = Boolean(progress.diagnosticGoal && progress.diagnosticCompletedAt);

  if (!diagnosticComplete && !hasLearningEvidence) {
    return {
      stage: "orient",
      stageIndex: 0,
      pathId: null,
      pathLabel: english ? "No route chosen yet" : "尚未选择路线",
      title: english ? "Choose a starting point in about 3 minutes" : "用 3 分钟选择学习起点",
      description: english
        ? "Choose what you want to understand and answer three boundary questions. We will explain why your route starts there."
        : "选择一个最关心的主题，再回答三道基础题。网站会据此推荐课程顺序，并说明推荐理由。",
      actionLabel: english ? "Choose a starting point →" : "选择学习方向 →",
      href: `/${locale}/paths#diagnostic`,
      progressLabel: english ? "Step 1 of 5" : "第 1 / 5 步",
    };
  }

  const availableIds = manifests.map((manifest) => manifest.id);
  const pathId = diagnosticComplete && progress.diagnosticGoal
    ? getDiagnosticRecommendation(progress.diagnosticGoal, progress.diagnosticAnswers, locale, availableIds).pathId
    : (english ? "foundations-to-markets" : "market-maker");
  const selectedPath = learningPaths.find((path) => path.id === pathId) ?? learningPaths[0];
  const pathModules = selectedPath.moduleIds
    .map((id) => manifests.find((manifest) => manifest.id === id))
    .filter((manifest): manifest is ModuleManifest => Boolean(manifest));
  const routeLessons = pathModules.flatMap((manifest) => manifest.lessons.map((lesson) => ({ manifest, lesson })));
  const incompleteLesson = routeLessons.find(({ manifest, lesson }) => !progress.completedLessons.includes(`${manifest.id}:${lesson.id}`));

  if (incompleteLesson) {
    const completedCount = routeLessons.filter(({ manifest, lesson }) => progress.completedLessons.includes(`${manifest.id}:${lesson.id}`)).length;
    return {
      stage: "learn",
      stageIndex: 1,
      pathId,
      pathLabel: pathCopy(pathId, locale),
      title: incompleteLesson.lesson.title,
      description: incompleteLesson.lesson.summary,
      actionLabel: completedCount > 0
        ? (english ? `Continue ${incompleteLesson.manifest.shortTitle} →` : `继续学习：${incompleteLesson.manifest.shortTitle} →`)
        : (english ? `Start with ${incompleteLesson.manifest.shortTitle} →` : `从${incompleteLesson.manifest.shortTitle}开始 →`),
      href: lessonHref(locale, incompleteLesson.manifest, incompleteLesson.lesson.id),
      progressLabel: english
        ? `${completedCount} of ${routeLessons.length} route lessons complete`
        : `路线已完成 ${completedCount} / ${routeLessons.length} 章`,
    };
  }

  const missingTask = routeLessons.find(({ manifest, lesson }) => !progress.completedTasks.includes(`${manifest.id}:${lesson.id}:${lesson.task.id}`));
  const missingCheckpoint = routeLessons.find(({ lesson }) => progress.checkpointAnswers[lesson.checkpointId] !== true);
  const missingEvidence = missingTask ?? missingCheckpoint;

  if (missingEvidence) {
    const isTask = Boolean(missingTask);
    return {
      stage: "experiment",
      stageIndex: 2,
      pathId,
      pathLabel: pathCopy(pathId, locale),
      title: isTask
        ? (english ? `Try the example: ${missingEvidence.lesson.title}` : `完成本章练习：${missingEvidence.lesson.title}`)
        : (english ? `Recheck: ${missingEvidence.lesson.title}` : `回到理解检查：${missingEvidence.lesson.title}`),
      description: isTask
        ? missingEvidence.lesson.task.evidence
        : (english ? "Return to the explanation and answer the knowledge check again." : "回到相关说明，再回答一次理解检查。"),
      actionLabel: isTask ? (english ? "Open the exercise →" : "打开本章练习 →") : (english ? "Return to the check →" : "回到理解检查 →"),
      href: lessonHref(locale, missingEvidence.manifest, missingEvidence.lesson.id),
      progressLabel: english ? "Course read · exercise incomplete" : "课程已读完 · 练习尚未完成",
    };
  }

  if (!progress.completedChallenges.includes("mechanism-systems-audit")) {
    return {
      stage: "connect",
      stageIndex: 3,
      pathId,
      pathLabel: pathCopy(pathId, locale),
      title: english ? "Compare how the systems depend on one another" : "比较不同系统之间的依赖关系",
      description: english
        ? "Use the systems audit to follow state, liquidity, risk, truth, and settlement across module boundaries."
        : "系统挑战会把账本、流动性、预言机和结算放在同一个案例中，帮助你检查它们如何互相影响。",
      actionLabel: english ? "Start the systems challenge →" : "开始系统挑战 →",
      href: `/${locale}/challenges`,
      progressLabel: english ? "Courses and exercises complete" : "课程与练习已完成",
    };
  }

  return {
    stage: "review",
    stageIndex: 4,
    pathId,
    pathLabel: pathCopy(pathId, locale),
    title: english ? "Review the parts that need another look" : "复习答错或尚未完成的内容",
    description: english
      ? "Your progress page now turns checks and experiments into a review queue, while the value path helps you compare mechanisms."
      : "进度页会列出未完成的练习和答错的检查题，也可以从这里继续上次的课程。",
    actionLabel: english ? "Open my progress →" : "查看学习进度 →",
    href: `/${locale}/progress`,
    progressLabel: english ? "Route complete · review as needed" : "路线已完成 · 可按需复习",
  };
}
