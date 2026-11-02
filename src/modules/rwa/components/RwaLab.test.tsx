import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LessonTaskCard } from "@/platform/components/LessonTaskCard";
import { useProgressStore } from "@/platform/progress/store";
import { rwaManifest } from "@/modules/rwa/manifest";
import { RwaLab } from "./RwaLab";

vi.mock("next-intl", () => ({ useLocale: () => "zh" }));

describe("RWA lesson integration", () => {
  beforeEach(() => useProgressStore.setState({ completedTasks: [] }));

  it("records lesson exercise progress when a learner changes an RWA scenario", () => {
    const lesson = rwaManifest.lessons[0];
    const key = `rwa:${lesson.id}:${lesson.task.id}`;
    render(<><LessonTaskCard task={lesson.task} taskKey={key} /><RwaLab /></>);
    expect(useProgressStore.getState().completedTasks).not.toContain(key);
    fireEvent.click(screen.getByRole("button", { name: "3 · 集中赎回" }));
    expect(useProgressStore.getState().completedTasks).toContain(key);
    expect(screen.getByText("$60,000")).toBeInTheDocument();
  });
});
