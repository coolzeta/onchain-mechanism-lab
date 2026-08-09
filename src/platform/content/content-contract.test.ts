import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { modules, getModule } from "./registry";
import { getEnglishModuleCopy } from "./localization";
import { mechanismSystemsAudit, mechanismSystemsAuditEn } from "./challenges";
import { lessonDefinitionSchema } from "@/platform/types/learning";

const contentRoot = resolve(process.cwd(), "content");
const moduleRoot = resolve(process.cwd(), "src", "modules");

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readLesson(locale: string, moduleId: string, lessonId: string) {
  const file = resolve(contentRoot, locale, moduleId, `${lessonId}.mdx`);
  expect(existsSync(file), `missing content file: ${file}`).toBe(true);
  return readFileSync(file, "utf8");
}

describe("content contract", () => {
  it("keeps every manifest lesson mapped to a real locale file", () => {
    for (const manifest of modules.filter((candidate) => candidate.status === "available")) {
      const adapterFile = resolve(moduleRoot, manifest.id, "content.tsx");
      expect(existsSync(adapterFile), `missing content adapter: ${adapterFile}`).toBe(true);
      const adapterSource = readFileSync(adapterFile, "utf8");
      for (const locale of manifest.locales) {
        for (const lesson of manifest.lessons) {
          const lessonMappingPattern = new RegExp(`(?:[\"']${escapeRegExp(lesson.id)}[\"']\\s*:|case\\s+[\"']${escapeRegExp(lesson.id)}[\"'])`);
          expect(adapterSource, `${manifest.id}/${locale}/${lesson.id} is not mapped`).toMatch(lessonMappingPattern);
          expect(adapterSource, `${manifest.id}/${locale} content import is missing`).toContain(`@content/${locale}/${manifest.id}/`);
          const source = readLesson(locale, manifest.id, lesson.id);
          expect(() => lessonDefinitionSchema.parse({ ...lesson, moduleId: manifest.id, locale, contentPath: `/content/${locale}/${manifest.id}/${lesson.id}.mdx` })).not.toThrow();
          const checkpointPattern = new RegExp(`<Checkpoint[\\s\\S]*?id="${escapeRegExp(lesson.checkpointId)}"`);
          expect(source, `${manifest.id}/${locale}/${lesson.id} is missing its checkpoint`).toMatch(checkpointPattern);
          expect(source).toContain("<SourceList>");
          expect(source).toContain("</SourceList>");
          expect(source.match(/\[[^\]]+\]\(https?:\/\/[^)]+\)/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it("keeps checkpoint IDs unique across modules and localized copies complete", () => {
    const checkpointIds = modules.flatMap((module) => module.lessons.map((lesson) => lesson.checkpointId));
    expect(new Set(checkpointIds).size).toBe(checkpointIds.length);
    for (const manifest of modules.filter((candidate) => candidate.locales.includes("en"))) {
      const copy = getEnglishModuleCopy(manifest.id);
      expect(copy, `missing English module copy for ${manifest.id}`).toBeTruthy();
      expect(Object.keys(copy?.lessons ?? {}).sort()).toEqual(manifest.lessons.map((lesson) => lesson.id).sort());
    }
  });

  it("keeps cross-module challenge links inside the registered lesson graph", () => {
    for (const challenge of [mechanismSystemsAudit, mechanismSystemsAuditEn]) {
      for (const step of challenge.steps) {
        const parts = step.lessonHref.split("/").filter(Boolean);
        const moduleId = parts[2];
        const lessonId = parts[3];
        const manifest = getModule(moduleId);
        expect(manifest, `challenge link has unknown module: ${step.lessonHref}`).toBeTruthy();
        expect(manifest?.lessons.some((lesson) => lesson.id === lessonId), `challenge link has unknown lesson: ${step.lessonHref}`).toBe(true);
        expect(manifest?.lessons.some((lesson) => lesson.id === step.lessonId), `challenge step has stale lessonId: ${step.id}`).toBe(true);
      }
    }
  });
});
