import { describe, expect, it } from "vitest";
import { modules } from "./registry";
import { getLessonCuriosities, getModuleCuriosityTeasers, getModuleTeaserIds, lessonCuriosities } from "./curiosities";

describe("curiosity content contract", () => {
  it("gives every lesson a localized, substantial curiosity prompt", () => {
    for (const manifest of modules) {
      for (const lesson of manifest.lessons) {
        const chinese = getLessonCuriosities(manifest.id, lesson.id, "zh");
        const english = getLessonCuriosities(manifest.id, lesson.id, "en");
        expect(chinese.length, `${manifest.id}/${lesson.id} needs curiosity`).toBeGreaterThanOrEqual(1);
        expect(english).toHaveLength(chinese.length);
        for (const item of [...chinese, ...english]) {
          expect(item.question.length).toBeGreaterThan(8);
          expect(item.answer.length).toBeGreaterThan(40);
        }
      }
    }
  });

  it("keeps prompt IDs unique and exposes two questions before choosing a module", () => {
    const ids = Object.values(lessonCuriosities).flat().map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const manifest of modules) {
      expect(getModuleTeaserIds(manifest.id)).toHaveLength(2);
      expect(getModuleCuriosityTeasers(manifest.id, "zh")).toHaveLength(2);
      expect(getModuleCuriosityTeasers(manifest.id, "en")).toHaveLength(2);
    }
  });

  it("keeps the complement-price questions visible in prediction-market selection", () => {
    const questions = getModuleCuriosityTeasers("prediction-markets", "zh").map((item) => item.question);
    expect(questions.some((question) => question.includes("超过 100"))).toBe(true);
    expect(questions.some((question) => question.includes("小于 100"))).toBe(true);
  });
});
