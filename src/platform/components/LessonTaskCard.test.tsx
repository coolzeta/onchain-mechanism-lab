import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProgressStore } from "@/platform/progress/store";
import { LessonTaskCard } from "./LessonTaskCard";

vi.mock("next-intl", () => ({ useLocale: () => "zh" }));

const task = {
  id: "test-task",
  title: "找出价格改变的原因",
  misconception: "最近成交价就是客观概率。",
  action: "切换场景并观察盘口深度。",
  evidence: "低流动性会让价格更容易被冲击。",
};

describe("LessonTaskCard", () => {
  beforeEach(() => {
    useProgressStore.setState({ completedTasks: [] });
  });

  it("records the investigation only after the learner touches a simulator", () => {
    render(<><LessonTaskCard task={task} taskKey="prediction-markets:test-task:test-task" /><section className="interactive-panel"><button type="button">切换实验场景</button></section></>);
    expect(screen.getByText("常见误解")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "前往互动示例 ↓" })).toBeEnabled();
    expect(useProgressStore.getState().completedTasks).not.toContain("prediction-markets:test-task:test-task");

    fireEvent.click(screen.getByRole("button", { name: "切换实验场景" }));

    expect(screen.getByRole("button", { name: "练习已记录 ✓" })).toBeDisabled();
    expect(useProgressStore.getState().completedTasks).toContain("prediction-markets:test-task:test-task");
  });
});
