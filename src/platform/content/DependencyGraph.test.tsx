import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useProgressStore } from "@/platform/progress/store";
import { DependencyGraph } from "./DependencyGraph";

describe("DependencyGraph", () => {
  afterEach(cleanup);

  beforeEach(() => {
    useProgressStore.setState({
      completedLessons: [],
      checkpointAnswers: {},
      checkpointAttempts: {},
      completedTasks: [],
    });
  });

  it("lets keyboard users rearrange and reset course nodes", () => {
    render(<DependencyGraph locale="zh" />);
    const predictionMarket = screen.getByRole("button", { name: /移动课程节点：预测市场/ });

    expect(predictionMarket).toHaveStyle({ left: "56%", top: "23%" });
    fireEvent.keyDown(predictionMarket, { key: "ArrowRight" });
    expect(predictionMarket).toHaveStyle({ left: "58%", top: "23%" });

    fireEvent.click(screen.getByRole("button", { name: "重置布局" }));
    expect(predictionMarket).toHaveStyle({ left: "56%", top: "23%" });
  });

  it("shows the selected course relationships and entry point", () => {
    render(<DependencyGraph locale="zh" />);

    expect(screen.getByRole("region", { name: "课程关系图" })).toHaveTextContent("十门课程怎样连在一起");
    expect(screen.getByRole("link", { name: "查看课程 →" })).toHaveAttribute("href", "/zh/learn/prediction-markets");
    expect(screen.getByText("订单与撮合")).toBeInTheDocument();
  });
});
