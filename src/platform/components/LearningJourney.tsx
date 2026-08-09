"use client";

import Link from "next/link";
import { getJourneyNextStep, journeyStageIds } from "@/platform/content/journey";
import { getLocalizedModule, isModuleAvailableForLocale } from "@/platform/content/localization";
import { modules } from "@/platform/content/registry";
import { useProgressStore } from "@/platform/progress/store";

const stageCopy = {
  zh: {
    orient: { label: "选择方向", detail: "根据兴趣推荐课程" },
    learn: { label: "阅读课程", detail: "理解问题和规则" },
    experiment: { label: "操作示例", detail: "调整参数并比较结果" },
    connect: { label: "理解关联", detail: "查看课程之间的依赖" },
    review: { label: "按需复习", detail: "回看答错或未完成的内容" },
  },
  en: {
    orient: { label: "Choose a start", detail: "Goal + 3 boundary checks" },
    learn: { label: "Learn", detail: "Story, state, and rules" },
    experiment: { label: "Verify", detail: "Change the key variables" },
    connect: { label: "Connect", detail: "Trace value across modules" },
    review: { label: "Review", detail: "Strengthen weak boundaries" },
  },
} as const;

export function LearningJourney({ locale, compact = false }: { locale: string; compact?: boolean }) {
  const completedLessons = useProgressStore((state) => state.completedLessons);
  const completedTasks = useProgressStore((state) => state.completedTasks);
  const checkpointAnswers = useProgressStore((state) => state.checkpointAnswers);
  const completedChallenges = useProgressStore((state) => state.completedChallenges);
  const diagnosticGoal = useProgressStore((state) => state.diagnosticGoal);
  const diagnosticAnswers = useProgressStore((state) => state.diagnosticAnswers);
  const diagnosticCompletedAt = useProgressStore((state) => state.diagnosticCompletedAt);
  const availableModules = modules
    .filter((manifest) => manifest.status === "available" && isModuleAvailableForLocale(manifest, locale))
    .map((manifest) => getLocalizedModule(manifest, locale));
  const next = getJourneyNextStep(locale, availableModules, {
    completedLessons,
    completedTasks,
    checkpointAnswers,
    completedChallenges,
    diagnosticGoal,
    diagnosticAnswers,
    diagnosticCompletedAt,
  });
  const language = locale === "en" ? "en" : "zh";

  if (compact) {
    return <div className="journey-next journey-next--compact" aria-label={language === "en" ? "Your next learning step" : "你的下一步学习"}>
      <div><span>{language === "en" ? "YOUR NEXT STEP" : "你的下一步"}</span><small>{next.progressLabel}</small></div>
      <strong>{next.title}</strong>
      <Link className="primary-button" href={next.href}>{next.actionLabel}</Link>
    </div>;
  }

  return <section className="learning-journey page-width" id="journey" aria-labelledby="journey-title">
    <header className="learning-journey__header">
      <div><span className="eyebrow">{language === "en" ? "HOW TO USE THE SITE" : "网站怎么用"}</span><h2 id="journey-title">{language === "en" ? "A suggested order, from choosing a topic to reviewing it." : "从选课到复习，可以按这五步进行。"}</h2></div>
      <p>{language === "en" ? "Choose a topic, read the course, try the example, then use the challenge and progress pages when you need them." : "先选择感兴趣的方向，再阅读课程和操作示例。系统挑战用于比较不同课程，进度页用于继续学习和复习。"}</p>
    </header>
    <ol className="learning-journey__stages">
      {journeyStageIds.map((stageId, index) => {
        const state = index < next.stageIndex ? "is-done" : index === next.stageIndex ? "is-active" : "is-upcoming";
        const copy = stageCopy[language][stageId];
        return <li className={state} key={stageId} aria-current={state === "is-active" ? "step" : undefined}>
          <span className="learning-journey__number">{state === "is-done" ? "✓" : String(index + 1).padStart(2, "0")}</span>
          <div><strong>{copy.label}</strong><small>{copy.detail}</small></div>
        </li>;
      })}
    </ol>
    <div className="journey-next">
      <div className="journey-next__meta"><span>{language === "en" ? "SUGGESTED NEXT" : "建议下一步"}</span><small>{next.pathLabel} · {next.progressLabel}</small></div>
      <div className="journey-next__copy"><h3>{next.title}</h3><p>{next.description}</p></div>
      <Link className="primary-button" href={next.href}>{next.actionLabel}</Link>
    </div>
  </section>;
}
