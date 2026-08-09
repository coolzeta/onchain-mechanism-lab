import { beforeEach, describe, expect, it } from "vitest";
import { useProgressStore } from "./store";

describe("progress evidence feeds review scheduling", () => {
  beforeEach(() => {
    localStorage.clear();
    useProgressStore.getState().resetProgress();
  });

  it("queues a wrong checkpoint as an urgent review for the owning lesson", () => {
    useProgressStore.getState().recordCheckpoint("question-contract", false);

    const state = useProgressStore.getState();
    const schedule = state.reviewSchedules["prediction-markets:a-question-that-can-settle"];
    expect(state.checkpointAttempts["question-contract"]).toBe(1);
    expect(state.checkpointAnswers["question-contract"]).toBe(false);
    expect(schedule?.lastRating).toBe("again");
    expect(schedule?.intervalDays).toBe(0);
    expect(schedule?.dueAt).toBeGreaterThan(schedule?.lastReviewedAt ?? 0);
  });

  it("turns a later correct answer into a longer interval", () => {
    useProgressStore.getState().recordCheckpoint("question-contract", false);
    useProgressStore.getState().recordCheckpoint("question-contract", true);

    const state = useProgressStore.getState();
    const schedule = state.reviewSchedules["prediction-markets:a-question-that-can-settle"];
    expect(state.checkpointAttempts["question-contract"]).toBe(2);
    expect(schedule?.lastRating).toBe("good");
    expect(schedule?.intervalDays).toBe(1);
    expect(state.reviewedLessons["prediction-markets:a-question-that-can-settle"]).toBe(schedule?.lastReviewedAt);
  });

  it("does not invent a review record for an unknown checkpoint", () => {
    useProgressStore.getState().recordCheckpoint("unknown-checkpoint", false);

    expect(Object.keys(useProgressStore.getState().reviewSchedules)).toHaveLength(0);
  });
});
