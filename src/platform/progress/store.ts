"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { siteConfig } from "@/platform/config";
import type { DiagnosticGoal, DiagnosticQuestionId } from "@/platform/content/diagnostic";
import { getLessonKeyByCheckpoint } from "@/platform/content/registry";
import { migrateLegacyReview, reviewScheduleSchema, scheduleReview, type ReviewRating, type ReviewSchedule } from "./review";

interface ProgressState {
  completedLessons: string[];
  checkpointAnswers: Record<string, boolean>;
  checkpointAttempts: Record<string, number>;
  completedChallenges: string[];
  challengeAnswers: Record<string, boolean>;
  challengeAttempts: Record<string, number>;
  completedTasks: string[];
  reviewedLessons: Record<string, number>;
  reviewSchedules: Record<string, ReviewSchedule>;
  diagnosticGoal: DiagnosticGoal | null;
  diagnosticAnswers: Partial<Record<DiagnosticQuestionId, number>>;
  diagnosticCompletedAt: number | null;
  markLessonComplete: (lessonKey: string) => void;
  recordCheckpoint: (checkpointKey: string, correct: boolean) => void;
  markChallengeComplete: (challengeKey: string) => void;
  recordChallengeAnswer: (stepKey: string, correct: boolean) => void;
  markTaskComplete: (taskKey: string) => void;
  markLessonReviewed: (lessonKey: string) => void;
  reviewLesson: (lessonKey: string, rating: ReviewRating) => void;
  setDiagnosticGoal: (goal: DiagnosticGoal) => void;
  recordDiagnosticAnswer: (questionId: DiagnosticQuestionId, optionIndex: number) => void;
  markDiagnosticComplete: () => void;
  resetDiagnostic: () => void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      completedLessons: [],
      checkpointAnswers: {},
      checkpointAttempts: {},
      completedChallenges: [],
      challengeAnswers: {},
      challengeAttempts: {},
      completedTasks: [],
      reviewedLessons: {},
      reviewSchedules: {},
      diagnosticGoal: null,
      diagnosticAnswers: {},
      diagnosticCompletedAt: null,
      markLessonComplete: (lessonKey) =>
        set((state) => ({
          completedLessons: state.completedLessons.includes(lessonKey)
            ? state.completedLessons
            : [...state.completedLessons, lessonKey],
        })),
      recordCheckpoint: (checkpointKey, correct) =>
        set((state) => {
          const now = Date.now();
          const lessonKey = getLessonKeyByCheckpoint(checkpointKey);
          return {
            checkpointAnswers: {
              ...state.checkpointAnswers,
              [checkpointKey]: correct,
            },
            checkpointAttempts: {
              ...state.checkpointAttempts,
              [checkpointKey]: (state.checkpointAttempts[checkpointKey] ?? 0) + 1,
            },
            reviewSchedules: lessonKey
              ? { ...state.reviewSchedules, [lessonKey]: scheduleReview(state.reviewSchedules[lessonKey], correct ? "good" : "again", now) }
              : state.reviewSchedules,
            reviewedLessons: lessonKey
              ? { ...state.reviewedLessons, [lessonKey]: now }
              : state.reviewedLessons,
          };
        }),
      markChallengeComplete: (challengeKey) =>
        set((state) => ({
          completedChallenges: state.completedChallenges.includes(challengeKey)
            ? state.completedChallenges
            : [...state.completedChallenges, challengeKey],
        })),
      recordChallengeAnswer: (stepKey, correct) =>
        set((state) => ({
          challengeAnswers: {
            ...state.challengeAnswers,
            [stepKey]: correct,
          },
          challengeAttempts: {
            ...state.challengeAttempts,
            [stepKey]: (state.challengeAttempts[stepKey] ?? 0) + 1,
          },
        })),
      markTaskComplete: (taskKey) =>
        set((state) => ({
          completedTasks: state.completedTasks.includes(taskKey)
            ? state.completedTasks
            : [...state.completedTasks, taskKey],
        })),
      markLessonReviewed: (lessonKey) => set((state) => {
        const now = Date.now();
        return {
          reviewedLessons: { ...state.reviewedLessons, [lessonKey]: now },
          reviewSchedules: { ...state.reviewSchedules, [lessonKey]: scheduleReview(state.reviewSchedules[lessonKey], "good", now) },
        };
      }),
      reviewLesson: (lessonKey, rating) => set((state) => {
        const now = Date.now();
        return {
          reviewedLessons: { ...state.reviewedLessons, [lessonKey]: now },
          reviewSchedules: { ...state.reviewSchedules, [lessonKey]: scheduleReview(state.reviewSchedules[lessonKey], rating, now) },
        };
      }),
      setDiagnosticGoal: (diagnosticGoal) => set({ diagnosticGoal, diagnosticAnswers: {}, diagnosticCompletedAt: null }),
      recordDiagnosticAnswer: (questionId, optionIndex) => set((state) => ({ diagnosticAnswers: { ...state.diagnosticAnswers, [questionId]: optionIndex } })),
      markDiagnosticComplete: () => set({ diagnosticCompletedAt: Date.now() }),
      resetDiagnostic: () => set({ diagnosticGoal: null, diagnosticAnswers: {}, diagnosticCompletedAt: null }),
      resetProgress: () => set({ completedLessons: [], checkpointAnswers: {}, checkpointAttempts: {}, completedChallenges: [], challengeAnswers: {}, challengeAttempts: {}, completedTasks: [], reviewedLessons: {}, reviewSchedules: {}, diagnosticGoal: null, diagnosticAnswers: {}, diagnosticCompletedAt: null }),
    }),
    {
      name: siteConfig.progressStorageKey,
      version: 7,
      migrate: (persisted, version) => {
        const previous = persisted as Partial<ProgressState>;
        const reviewedLessons = version >= 5 ? previous.reviewedLessons ?? {} : {};
        const reviewSchedules = version >= 7
          ? Object.fromEntries(Object.entries(previous.reviewSchedules ?? {}).flatMap(([key, value]) => {
            const parsed = reviewScheduleSchema.safeParse(value);
            return parsed.success ? [[key, parsed.data]] : [];
          }))
          : Object.fromEntries(Object.entries(reviewedLessons).map(([key, timestamp]) => [key, migrateLegacyReview(timestamp)]));
        return {
          completedLessons: previous.completedLessons ?? [],
          checkpointAnswers: previous.checkpointAnswers ?? {},
          checkpointAttempts: version >= 2 ? previous.checkpointAttempts ?? {} : {},
          completedChallenges: version >= 3 ? previous.completedChallenges ?? [] : [],
          challengeAnswers: version >= 3 ? previous.challengeAnswers ?? {} : {},
          challengeAttempts: version >= 3 ? previous.challengeAttempts ?? {} : {},
          completedTasks: version >= 4 ? previous.completedTasks ?? [] : [],
          reviewedLessons,
          reviewSchedules,
          diagnosticGoal: version >= 6 ? previous.diagnosticGoal ?? null : null,
          diagnosticAnswers: version >= 6 ? previous.diagnosticAnswers ?? {} : {},
          diagnosticCompletedAt: version >= 6 ? previous.diagnosticCompletedAt ?? null : null,
        };
      },
      partialize: ({ completedLessons, checkpointAnswers, checkpointAttempts, completedChallenges, challengeAnswers, challengeAttempts, completedTasks, reviewedLessons, reviewSchedules, diagnosticGoal, diagnosticAnswers, diagnosticCompletedAt }) => ({
        completedLessons,
        checkpointAnswers,
        checkpointAttempts,
        completedChallenges,
        challengeAnswers,
        challengeAttempts,
        completedTasks,
        reviewedLessons,
        reviewSchedules,
        diagnosticGoal,
        diagnosticAnswers,
        diagnosticCompletedAt,
      }),
    },
  ),
);
