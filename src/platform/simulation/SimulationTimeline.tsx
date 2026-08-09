"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { SimulationSnapshot } from "./types";
import { useResearchJournal } from "@/platform/progress/journal";

export interface SimulationJournalMeta {
  moduleId: string;
  title: string;
  scenario: string;
  note: string;
  labPath: string;
  stateSnapshot: string;
  actions: string[];
  events: Array<{ kind: string; message: string }>;
  metrics: Array<{ label: string; value: string }>;
  insight: string;
}

interface SimulationTimelineProps<State> {
  snapshots: readonly SimulationSnapshot<State>[];
  actionCount: number;
  onRewind: (actionIndex: number) => void;
  label?: string;
  journal?: SimulationJournalMeta;
}

/**
 * A small, domain-agnostic review rail for every lab.
 *
 * The simulation hook owns the state machine; this component only exposes the
 * recorded snapshots. That keeps review controls reusable without making a
 * domain engine depend on React or on a particular visual language.
 */
export function SimulationTimeline<State>({
  snapshots,
  actionCount,
  onRewind,
  label = "实验时间轴",
  journal,
}: SimulationTimelineProps<State>) {
  const safeActionCount = Math.max(0, actionCount);
  const hasHistory = safeActionCount > 0;
  const pathname = usePathname();
  const locale = pathname.split("/")[1] === "en" ? "en" : "zh";
  const english = locale === "en";
  const localizedLabel = english && label === "实验时间轴" ? "Experiment timeline" : label;
  const saveRecord = useResearchJournal((state) => state.saveRecord);
  const [savedId, setSavedId] = useState<string | null>(null);

  function saveCurrentExperiment() {
    if (!journal) return;
    setSavedId(saveRecord({ ...journal, locale, href: `/${locale}${journal.labPath}`, actionCount: journal.actions.length }));
  }

  return (
    <section className="simulation-timeline" aria-label={localizedLabel}>
      <header className="simulation-timeline__header">
        <div>
          <span className="eyebrow">{english ? "ACTION HISTORY" : "操作记录"}</span>
          <strong>{localizedLabel}</strong>
        </div>
        <span>{english ? `${snapshots.length} state snapshots` : `${snapshots.length} 个状态快照`}</span>
      </header>
      <p>{english ? "Use the slider to return to an earlier step. Continuing from there replaces the later history with a new sequence." : "拖动滑块可以回到此前的步骤。从那里继续操作时，后续记录会替换为新的操作序列。"}</p>
      <div className="simulation-timeline__control">
        <label htmlFor="simulation-timeline-range">{english ? "Rewind to step" : "回到第几步"}</label>
        <output htmlFor="simulation-timeline-range">{safeActionCount === 0 ? (english ? "Initial state" : "初始状态") : (english ? `Step ${safeActionCount}` : `第 ${safeActionCount} 步`)}</output>
        <input
          aria-label={english ? "Experiment rewind step" : "实验回退步骤"}
          disabled={!hasHistory}
          id="simulation-timeline-range"
          max={Math.max(1, safeActionCount)}
          min="0"
          onChange={(event) => onRewind(Number(event.target.value))}
          step="1"
          type="range"
          value={safeActionCount}
        />
      </div>
      <div className="simulation-timeline__actions">
        <button disabled={!hasHistory} onClick={() => onRewind(0)} type="button">{english ? "Return to initial" : "回到初始状态"}</button>
        <button disabled={!hasHistory} onClick={() => onRewind(Math.max(0, safeActionCount - 1))} type="button">{english ? "Undo last step" : "撤回上一步"}</button>
      </div>
      {journal && <div className="simulation-timeline__save"><button onClick={saveCurrentExperiment} type="button">{english ? "Save this experiment" : "保存这次实验"}</button>{savedId && <span role="status">{english ? "Saved to experiment records" : "已保存到实验记录"}</span>}<Link href={`/${locale}/journal`}>{english ? "View experiment records →" : "查看实验记录 →"}</Link></div>}
    </section>
  );
}
