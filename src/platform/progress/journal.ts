"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";
import { siteConfig } from "@/platform/config";

const journalEventSchema = z.object({
  kind: z.string().min(1),
  message: z.string().min(1),
});

const journalMetricSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const researchRecordSchema = z.object({
  id: z.string().min(1),
  moduleId: z.string().min(1),
  locale: z.enum(["zh", "en"]),
  title: z.string().min(1),
  scenario: z.string().min(1),
  note: z.string().min(1),
  href: z.string().startsWith("/"),
  savedAt: z.number().int().positive(),
  actionCount: z.number().int().nonnegative(),
  stateSnapshot: z.string().min(2),
  actions: z.array(z.string()),
  events: z.array(journalEventSchema),
  metrics: z.array(journalMetricSchema).default([]),
  insight: z.string().default(""),
  reflection: z.string().default(""),
});

export type ResearchRecord = z.infer<typeof researchRecordSchema>;
export type ResearchRecordInput = Omit<ResearchRecord, "id" | "savedAt" | "reflection"> & { reflection?: string };
export type ResearchRecordSearchable = Pick<ResearchRecord, "id" | "moduleId" | "title" | "scenario" | "note">;

export function filterResearchRecords<T extends ResearchRecordSearchable>(records: readonly T[], query: string, moduleId = "all", labels: Readonly<Record<string, string>> = {}): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return records.filter((record) => {
    if (moduleId !== "all" && record.moduleId !== moduleId) return false;
    if (!normalizedQuery) return true;
    return `${record.title} ${record.scenario} ${record.note} ${labels[record.moduleId] ?? record.moduleId}`.toLowerCase().includes(normalizedQuery);
  });
}

interface ResearchJournalState {
  records: ResearchRecord[];
  saveRecord: (record: ResearchRecordInput) => string;
  updateReflection: (recordId: string, reflection: string) => void;
  removeRecord: (recordId: string) => void;
  clearRecords: () => void;
}

function createRecordId() {
  return `research-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseRecords(value: unknown): ResearchRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((record) => {
    const parsed = researchRecordSchema.safeParse(record);
    return parsed.success ? [parsed.data] : [];
  });
}

export const useResearchJournal = create<ResearchJournalState>()(
  persist(
    (set) => ({
      records: [],
      saveRecord: (input) => {
        const record = researchRecordSchema.parse({ ...input, id: createRecordId(), savedAt: Date.now() });
        set((state) => ({ records: [record, ...state.records].slice(0, 30) }));
        return record.id;
      },
      updateReflection: (recordId, reflection) => set((state) => ({
        records: state.records.map((record) => record.id === recordId ? { ...record, reflection } : record),
      })),
      removeRecord: (recordId) => set((state) => ({ records: state.records.filter((record) => record.id !== recordId) })),
      clearRecords: () => set({ records: [] }),
    }),
    {
      name: siteConfig.journalStorageKey,
      version: 3,
      migrate: (persisted) => ({ records: parseRecords((persisted as Partial<ResearchJournalState> | null)?.records) }),
      partialize: ({ records }) => ({ records }),
    },
  ),
);
