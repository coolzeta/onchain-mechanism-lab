import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuestionBuilder } from "./QuestionBuilder";

describe("QuestionBuilder", () => {
  it("shows how a vague question becomes settleable", () => {
    render(<QuestionBuilder />);
    expect(screen.getByText("0/3 条件明确")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "版本 3" }));
    expect(screen.getByText("3/3 条件明确")).toBeInTheDocument();
    expect(screen.getByText(/NASA 公布的任务/)).toBeInTheDocument();
  });
});
