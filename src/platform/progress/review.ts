import { z } from "zod";

export const reviewRatings = ["again", "hard", "good"] as const;
export type ReviewRating = (typeof reviewRatings)[number];

export const reviewScheduleSchema = z.object({
  lastReviewedAt: z.number().int().nonnegative().nullable(),
  dueAt: z.number().int().nonnegative(),
  intervalDays: z.number().int().nonnegative(),
  streak: z.number().int().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
  lastRating: z.enum(reviewRatings).nullable(),
});

export type ReviewSchedule = z.infer<typeof reviewScheduleSchema>;

export const REVIEW_MINUTE_MS = 60 * 1000;
export const REVIEW_DAY_MS = 24 * 60 * REVIEW_MINUTE_MS;

export function createReviewSchedule(): ReviewSchedule {
  return {
    lastReviewedAt: null,
    dueAt: 0,
    intervalDays: 0,
    streak: 0,
    reviewCount: 0,
    lastRating: null,
  };
}

export function scheduleReview(previous: ReviewSchedule | undefined, rating: ReviewRating, now: number): ReviewSchedule {
  const current = previous ?? createReviewSchedule();
  const intervalDays = rating === "again"
    ? 0
    : rating === "hard"
      ? Math.max(1, Math.round((current.intervalDays || 1) * 1.4))
      : current.intervalDays === 0
        ? 1
        : current.intervalDays === 1
          ? 3
          : current.intervalDays === 3
            ? 7
            : Math.min(60, Math.max(current.intervalDays + 1, Math.round(current.intervalDays * 2.2)));
  const delay = rating === "again" ? 10 * REVIEW_MINUTE_MS : intervalDays * REVIEW_DAY_MS;

  return {
    lastReviewedAt: now,
    dueAt: now + delay,
    intervalDays,
    streak: rating === "good" ? current.streak + 1 : rating === "again" ? 0 : current.streak,
    reviewCount: current.reviewCount + 1,
    lastRating: rating,
  };
}

export function isReviewDue(schedule: ReviewSchedule | undefined, now: number): boolean {
  return !schedule || schedule.dueAt <= now;
}

export function formatReviewDue(schedule: ReviewSchedule | undefined, now: number, locale: "zh" | "en"): string {
  if (!schedule) return locale === "en" ? "Not reviewed yet" : "还没有复盘";
  if (schedule.dueAt <= now) return locale === "en" ? "Due for review now" : "现在应该复盘";
  const remaining = schedule.dueAt - now;
  if (remaining < REVIEW_MINUTE_MS) return locale === "en" ? "Review in less than a minute" : "不到 1 分钟后复盘";
  const minutes = Math.ceil(remaining / REVIEW_MINUTE_MS);
  if (minutes < 60) return locale === "en" ? `Review in ${minutes} min` : `${minutes} 分钟后复盘`;
  const days = Math.ceil(remaining / REVIEW_DAY_MS);
  if (days === 1) return locale === "en" ? "Review tomorrow" : "明天复盘";
  return locale === "en" ? `Review in ${days} days` : `${days} 天后复盘`;
}

export function migrateLegacyReview(timestamp: number): ReviewSchedule {
  return {
    lastReviewedAt: timestamp,
    dueAt: timestamp,
    intervalDays: 0,
    streak: 0,
    reviewCount: 1,
    lastRating: null,
  };
}
