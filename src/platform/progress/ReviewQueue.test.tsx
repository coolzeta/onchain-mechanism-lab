import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ReviewQueue } from "./ReviewQueue";
import { useProgressStore } from "./store";

describe("ReviewQueue", () => {
  beforeEach(() => {
    useProgressStore.setState({
      completedLessons: [],
      checkpointAnswers: {},
      checkpointAttempts: {},
      completedTasks: [],
      reviewedLessons: {},
      reviewSchedules: {},
    });
  });

  it("turns the weakest lessons into a locally recoverable review action", () => {
    render(<ReviewQueue locale="zh" />);

    expect(screen.getByRole("region", { name: "复习建议" })).toBeInTheDocument();
    expect(screen.getByText("每次复习一到三章即可", { exact: true })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /已经会了/ })).toHaveLength(3);

    fireEvent.click(screen.getAllByRole("button", { name: /已经会了/ })[0]);

    expect(screen.getAllByRole("button", { name: /已经会了/ })).toHaveLength(3);
    expect(Object.keys(useProgressStore.getState().reviewedLessons)).toHaveLength(1);
    expect(Object.values(useProgressStore.getState().reviewSchedules)[0]?.intervalDays).toBe(1);
  });
});
