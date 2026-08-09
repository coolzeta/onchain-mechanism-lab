import { describe, expect, it } from "vitest";
import { modules } from "./registry";
import { valuePathStages, valuePathStageSchema } from "./value-path";

describe("value path content contract", () => {
  it("validates ten ordered boundaries", () => {
    expect(() => valuePathStageSchema.array().parse(valuePathStages)).not.toThrow();
    expect(valuePathStages).toHaveLength(10);
    expect(valuePathStages.map((stage) => stage.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(new Set(valuePathStages.map((stage) => stage.id)).size).toBe(valuePathStages.length);
    expect(new Set(valuePathStages.map((stage) => stage.moduleId)).size).toBe(valuePathStages.length);
  });

  it("points to registered modules and lessons in both languages", () => {
    for (const stage of valuePathStages) {
      const moduleManifest = modules.find((item) => item.id === stage.moduleId);
      expect(moduleManifest, stage.moduleId).toBeDefined();
      expect(moduleManifest?.lessons.some((lesson) => lesson.id === stage.lessonId), `${stage.moduleId}/${stage.lessonId}`).toBe(true);
      for (const copy of [stage.eyebrow, stage.title, stage.summary, stage.before, stage.after, stage.risk, stage.rule, stage.auditQuestion]) {
        expect(copy.zh.length).toBeGreaterThan(0);
        expect(copy.en.length).toBeGreaterThan(0);
      }
    }
  });
});
