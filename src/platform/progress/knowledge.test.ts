import { describe, expect, it } from "vitest";
import { predictionMarketManifest } from "@/modules/prediction-markets/manifest";
import { ledgerManifest } from "@/modules/ledger/manifest";
import { getLocalizedModule } from "@/platform/content/localization";
import { buildKnowledgeMap, getLessonKnowledge } from "./knowledge";

const emptyProgress = {
  completedLessons: [],
  checkpointAnswers: {},
  checkpointAttempts: {},
  completedTasks: [],
};

describe("knowledge evidence model", () => {
  it("does not call an untouched lesson mastered", () => {
    const lesson = predictionMarketManifest.lessons[0];
    const result = getLessonKnowledge(predictionMarketManifest, lesson, emptyProgress);

    expect(result.score).toBe(0);
    expect(result.status).toBe("unstarted");
    expect(result.recommendation).toContain("互动练习");
  });

  it("marks a wrong check as a review boundary instead of hiding it behind completion", () => {
    const lesson = predictionMarketManifest.lessons[0];
    const result = getLessonKnowledge(predictionMarketManifest, lesson, {
      completedLessons: [`prediction-markets:${lesson.id}`],
      completedTasks: [`prediction-markets:${lesson.id}:${lesson.task.id}`],
      checkpointAttempts: { [lesson.checkpointId]: 1 },
      checkpointAnswers: { [lesson.checkpointId]: false },
    });

    expect(result.score).toBe(60);
    expect(result.status).toBe("needs-review");
    expect(result.recommendation).toContain("重新阅读");
  });

  it("keeps the last review timestamp separate from mastery evidence", () => {
    const lesson = predictionMarketManifest.lessons[0];
    const result = getLessonKnowledge(predictionMarketManifest, lesson, {
      ...emptyProgress,
      reviewedLessons: { [`prediction-markets:${lesson.id}`]: 123 },
    });

    expect(result.reviewedAt).toBe(123);
    expect(result.score).toBe(0);
    expect(result.status).toBe("unstarted");
  });

  it("aggregates module evidence and keeps English recommendations localized", () => {
    const localizedLedger = getLocalizedModule(ledgerManifest, "en");
    const first = localizedLedger.lessons[0];
    const map = buildKnowledgeMap([localizedLedger], {
      completedLessons: [`ledger:${first.id}`],
      completedTasks: [`ledger:${first.id}:${first.task.id}`],
      checkpointAttempts: { [first.checkpointId]: 1 },
      checkpointAnswers: { [first.checkpointId]: true },
    }, "en");

    expect(map.modules[0]?.score).toBeGreaterThan(0);
    expect(map.weakestLessons[0]?.recommendation).toContain("Return to this lesson");
    expect(map.modules[0]?.lessons[0]?.title).toBe("Who Authorized This Transfer?");
  });
});
