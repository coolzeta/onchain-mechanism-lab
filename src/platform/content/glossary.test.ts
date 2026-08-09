import { describe, expect, it } from "vitest";
import { modules } from "./registry";
import { englishGlossaryEntries, glossaryEntries } from "./glossary";

describe("glossary content contract", () => {
  it("covers the stablecoin boundary in both language indexes", () => {
    expect(glossaryEntries.filter((entry) => entry.relatedModuleId === "stablecoins").map((entry) => entry.term)).toEqual(expect.arrayContaining(["稳定币", "赎回", "脱锚", "挤兑"]));
    expect(englishGlossaryEntries.filter((entry) => entry.relatedModuleId === "stablecoins").map((entry) => entry.term)).toEqual(expect.arrayContaining(["Stablecoin", "Redemption", "Depeg", "Run"]));
    expect(glossaryEntries.filter((entry) => entry.relatedModuleId === "mev").map((entry) => entry.term)).toEqual(expect.arrayContaining(["MEV（可提取价值）", "夹子交易", "私有订单流"]));
    expect(englishGlossaryEntries.filter((entry) => entry.relatedModuleId === "mev").map((entry) => entry.term)).toEqual(expect.arrayContaining(["MEV", "Sandwich attack", "Private order flow"]));
  });

  it("keeps every glossary lesson link inside a registered module", () => {
    const moduleIds = new Set(modules.map((module) => module.id));
    for (const entry of [...glossaryEntries, ...englishGlossaryEntries]) {
      if (!entry.relatedModuleId) continue;
      expect(moduleIds.has(entry.relatedModuleId), `unknown glossary module: ${entry.term}`).toBe(true);
      const moduleItem = modules.find((candidate) => candidate.id === entry.relatedModuleId);
      expect(moduleItem?.lessons.some((lesson) => lesson.id === entry.relatedLesson), `unknown glossary lesson: ${entry.term}`).toBe(true);
    }
  });

  it("gives every available module an English concept entry", () => {
    const englishModuleIds = new Set(englishGlossaryEntries.map((entry) => entry.relatedModuleId).filter(Boolean));
    for (const manifest of modules.filter((candidate) => candidate.status === "available")) {
      expect(englishModuleIds.has(manifest.id), `English glossary has no entry for ${manifest.id}`).toBe(true);
    }
  });
});
