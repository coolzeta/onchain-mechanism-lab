"use client";

import { useProgressStore } from "./store";

export function ProgressSummary({ total }: { total: number }) {
  const completed = useProgressStore((state) => state.completedLessons.length);
  const percent = Math.round((Math.min(completed, total) / total) * 100);

  return (
    <div className="progress-summary" aria-label={`课程进度 ${percent}%`}>
      <div className="progress-summary__copy">
        <span>你的研究进度</span>
        <strong>{completed}/{total} 章</strong>
      </div>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
