import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LessonJourneyStrip } from "./LessonJourneyStrip";

describe("LessonJourneyStrip", () => {
  it("shows what the current lesson receives and hands forward", () => {
    render(<LessonJourneyStrip moduleId="prediction-markets" lessonId="one-dollar-two-futures" locale="zh" />);
    expect(screen.getByRole("region", { name: "章节位置" })).toHaveTextContent("第 2 / 6 章");
    expect(screen.getByText("什么样的问题可以结算？")).toBeInTheDocument();
    expect(screen.getByText("观点怎样变成订单？")).toBeInTheDocument();
  });
});
