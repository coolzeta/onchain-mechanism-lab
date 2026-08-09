import { describe, expect, it } from "vitest";
import { modules } from "./registry";
import { getJourneyNextStep, type JourneyProgress } from "./journey";
import { learningPaths } from "./paths";

function progress(overrides: Partial<JourneyProgress> = {}): JourneyProgress {
  return {
    completedLessons: [],
    completedTasks: [],
    checkpointAnswers: {},
    completedChallenges: [],
    diagnosticGoal: null,
    diagnosticAnswers: {},
    diagnosticCompletedAt: null,
    ...overrides,
  };
}

function evidenceForPath(pathId: "market-maker") {
  const route = learningPaths.find((path) => path.id === pathId)!;
  const manifests = route.moduleIds.map((id) => modules.find((manifest) => manifest.id === id)).filter((manifest) => Boolean(manifest));
  return {
    completedLessons: manifests.flatMap((manifest) => manifest!.lessons.map((lesson) => `${manifest!.id}:${lesson.id}`)),
    completedTasks: manifests.flatMap((manifest) => manifest!.lessons.map((lesson) => `${manifest!.id}:${lesson.id}:${lesson.task.id}`)),
    checkpointAnswers: Object.fromEntries(manifests.flatMap((manifest) => manifest!.lessons.map((lesson) => [lesson.checkpointId, true]))),
  };
}

describe("learning journey", () => {
  it("gives a new learner one clear starting action", () => {
    const next = getJourneyNextStep("zh", modules, progress());

    expect(next.stage).toBe("orient");
    expect(next.href).toBe("/zh/paths#diagnostic");
    expect(next.actionLabel).toContain("学习方向");
  });

  it("continues into the first lesson on the recommended route", () => {
    const next = getJourneyNextStep("zh", modules, progress({
      diagnosticGoal: "markets",
      diagnosticAnswers: { state: 1, price: 0, risk: 0 },
      diagnosticCompletedAt: 1,
    }));

    expect(next.stage).toBe("learn");
    expect(next.pathId).toBe("market-maker");
    expect(next.href).toContain("/learn/prediction-markets/a-question-that-can-settle");
  });

  it("returns to missing experiment evidence after the route has been read", () => {
    const evidence = evidenceForPath("market-maker");
    const next = getJourneyNextStep("zh", modules, progress({
      completedLessons: evidence.completedLessons,
      diagnosticGoal: "markets",
      diagnosticCompletedAt: 1,
    }));

    expect(next.stage).toBe("experiment");
    expect(next.actionLabel).toContain("本章练习");
  });

  it("connects complete course evidence through the systems audit", () => {
    const evidence = evidenceForPath("market-maker");
    const next = getJourneyNextStep("zh", modules, progress({
      ...evidence,
      diagnosticGoal: "markets",
      diagnosticCompletedAt: 1,
    }));

    expect(next.stage).toBe("connect");
    expect(next.href).toBe("/zh/challenges");
  });

  it("moves a completed main route into review and transfer", () => {
    const evidence = evidenceForPath("market-maker");
    const next = getJourneyNextStep("zh", modules, progress({
      ...evidence,
      completedChallenges: ["mechanism-systems-audit"],
      diagnosticGoal: "markets",
      diagnosticCompletedAt: 1,
    }));

    expect(next.stage).toBe("review");
    expect(next.href).toBe("/zh/progress");
  });
});
