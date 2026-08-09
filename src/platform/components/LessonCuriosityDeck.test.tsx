import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach } from "vitest";
import { describe, expect, it } from "vitest";
import { useProgressStore } from "@/platform/progress/store";
import { LessonCuriosityDeck } from "./LessonCuriosityDeck";

describe("LessonCuriosityDeck", () => {
  beforeEach(() => useProgressStore.setState({ reviewSchedules: {}, reviewedLessons: {} }));

  it("renders lesson-specific questions as expandable predictions", () => {
    render(<LessonCuriosityDeck moduleId="prediction-markets" lessonId="price-is-not-truth" locale="zh" />);
    expect(screen.getByRole("region", { name: "课前问题" })).toBeInTheDocument();
    expect(screen.getByText(/为什么会超过 100/)).toBeInTheDocument();
    expect(screen.getAllByText(/简要回答/)).toHaveLength(5);
  });

  it("turns surprise into a scheduled review instead of a dead-end reveal", () => {
    render(<LessonCuriosityDeck moduleId="prediction-markets" lessonId="price-is-not-truth" locale="zh" />);
    fireEvent.click(screen.getAllByRole("button", { name: "不太一样 · 加入复习" })[0]);
    expect(screen.getByText(/已加入复习列表/)).toBeInTheDocument();
    expect(useProgressStore.getState().reviewSchedules["prediction-markets:price-is-not-truth"]?.lastRating).toBe("again");
  });
});
