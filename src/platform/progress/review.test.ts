import { describe, expect, it } from "vitest";
import { REVIEW_DAY_MS, REVIEW_MINUTE_MS, createReviewSchedule, formatReviewDue, isReviewDue, scheduleReview } from "./review";

describe("review scheduler", () => {
  const now = 1_700_000_000_000;

  it("starts a good review with a one-day interval and grows the interval", () => {
    const first = scheduleReview(undefined, "good", now);
    const second = scheduleReview(first, "good", now + REVIEW_DAY_MS);
    const third = scheduleReview(second, "good", now + REVIEW_DAY_MS * 4);

    expect(first.dueAt).toBe(now + REVIEW_DAY_MS);
    expect(second.intervalDays).toBe(3);
    expect(third.intervalDays).toBe(7);
    expect(third.streak).toBe(3);
  });

  it("brings a shaky boundary back quickly without destroying its history", () => {
    const good = scheduleReview(undefined, "good", now);
    const again = scheduleReview(good, "again", now + REVIEW_DAY_MS);

    expect(again.dueAt).toBe(now + REVIEW_DAY_MS + 10 * REVIEW_MINUTE_MS);
    expect(again.intervalDays).toBe(0);
    expect(again.streak).toBe(0);
    expect(again.reviewCount).toBe(2);
    expect(again.lastRating).toBe("again");
  });

  it("treats an untouched lesson and an overdue lesson as due", () => {
    const fresh = createReviewSchedule();
    const future = scheduleReview(undefined, "good", now);

    expect(isReviewDue(undefined, now)).toBe(true);
    expect(isReviewDue(fresh, now)).toBe(true);
    expect(isReviewDue(future, now + REVIEW_DAY_MS)).toBe(true);
    expect(isReviewDue(future, now + REVIEW_DAY_MS - 1)).toBe(false);
  });

  it("keeps due labels understandable in both locales", () => {
    const future = scheduleReview(undefined, "good", now);

    expect(formatReviewDue(undefined, now, "zh")).toBe("还没有复盘");
    expect(formatReviewDue(future, now, "en")).toBe("Review tomorrow");
    expect(formatReviewDue(future, now + REVIEW_DAY_MS, "zh")).toBe("现在应该复盘");
  });
});
