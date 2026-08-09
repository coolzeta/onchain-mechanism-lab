import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LearningDiagnostic } from "./LearningDiagnostic";
import { useProgressStore } from "@/platform/progress/store";

describe("LearningDiagnostic", () => {
  beforeEach(() => {
    useProgressStore.setState({ diagnosticGoal: null, diagnosticAnswers: {}, diagnosticCompletedAt: null });
  });

  it("turns a goal and three boundary answers into an explained route", () => {
    render(<LearningDiagnostic locale="zh" />);

    fireEvent.click(screen.getByRole("button", { name: /看懂市场与价格/ }));
    fireEvent.click(screen.getByRole("option", { name: /签名本身已经等于转账/ }));
    expect(screen.getByText("这题没有答对。", { exact: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "下一题 →" }));
    fireEvent.click(screen.getByRole("option", { name: /AMM 用曲线报价/ }));
    fireEvent.click(screen.getByRole("button", { name: "下一题 →" }));
    fireEvent.click(screen.getByRole("option", { name: /风险会暂时被低估/ }));
    fireEvent.click(screen.getByRole("button", { name: "查看推荐路线 →" }));

    expect(screen.getByText("市场机制路线", { exact: true })).toBeInTheDocument();
    expect(screen.getByText(/“状态与账本”这道题没有答对/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看这条路线 →" })).toHaveAttribute("href", "/zh/paths?path=market-maker");
  });

  it("can be resumed from persisted answers", () => {
    useProgressStore.setState({ diagnosticGoal: "build", diagnosticAnswers: { state: 1 }, diagnosticCompletedAt: null });
    render(<LearningDiagnostic locale="zh" />);

    expect(screen.getByText("AMM 和订单簿最大的差别是什么？", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("第 2 / 3 题", { exact: true })).toBeInTheDocument();
  });
});
