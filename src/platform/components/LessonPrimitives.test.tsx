import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProgressStore } from "@/platform/progress/store";
import { CompleteLesson } from "./LessonPrimitives";

vi.mock("next-intl", () => ({ useLocale: () => "zh" }));

describe("CompleteLesson", () => {
  beforeEach(() => {
    useProgressStore.setState({ completedLessons: [], completedTasks: [], checkpointAnswers: {} });
  });

  it("requires experiment evidence and a correct check before saving", () => {
    render(<CompleteLesson lessonKey="prediction-markets:a-question-that-can-settle" nextHref="/zh/next" nextTitle="下一章" />);
    expect(screen.getByRole("button", { name: "保存本章" })).toBeDisabled();

    act(() => useProgressStore.setState({ completedTasks: ["prediction-markets:a-question-that-can-settle:contract-anchors"] }));
    expect(screen.getByRole("button", { name: "保存本章" })).toBeDisabled();

    act(() => useProgressStore.setState({ checkpointAnswers: { "question-contract": true } }));
    expect(screen.getByRole("button", { name: "保存本章" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "保存本章" }));
    expect(screen.getByRole("link", { name: /进入下一章/ })).toBeInTheDocument();
  });
});
