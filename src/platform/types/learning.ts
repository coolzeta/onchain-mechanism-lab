import { z } from "zod";

export const lessonBlockTypes = [
  "narrative",
  "simulation",
  "checkpoint",
  "recap",
  "sources",
] as const;

export type LessonBlock = (typeof lessonBlockTypes)[number];
export const supportedLocales = ["zh", "en"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

/**
 * A small, repeatable investigation loop that sits between the lesson story
 * and the free-form simulator. It turns a likely misconception into an
 * observable action and a piece of evidence the learner can name.
 */
export const lessonTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  misconception: z.string().min(1),
  action: z.string().min(1),
  evidence: z.string().min(1),
});

export type LessonTask = z.infer<typeof lessonTaskSchema>;

export const lessonManifestSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string().min(1),
  eyebrow: z.string().min(1),
  summary: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  checkpointId: z.string().min(1),
  objectives: z.array(z.string().min(1)).min(1),
  concepts: z.array(z.string().min(1)).min(1),
  blocks: z.array(z.enum(lessonBlockTypes)).min(1),
  task: lessonTaskSchema,
});

export const moduleManifestSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(["available", "coming-soon"]),
  estimatedMinutes: z.number().int().positive(),
  locales: z.array(z.enum(["zh", "en"])).min(1),
  prerequisites: z.array(z.string()),
  lessons: z.array(lessonManifestSchema).min(1),
});

export type LessonManifest = z.infer<typeof lessonManifestSchema>;
export type ModuleManifest = z.infer<typeof moduleManifestSchema>;

/** A locale-specific lesson contract shared by content adapters and route generation. */
export const lessonDefinitionSchema = lessonManifestSchema.extend({
  moduleId: z.string().min(1),
  locale: z.enum(supportedLocales),
  contentPath: z.string().startsWith("/content/"),
});

export type LessonDefinition = z.infer<typeof lessonDefinitionSchema>;

/** Stable adapter surface for a module's MDX content. */
export interface ModuleContentRegistry {
  moduleId: string;
  readonly locales: readonly SupportedLocale[];
  readonly lessonIds: readonly string[];
  hasLesson(locale: string, lessonId: string): boolean;
}

export interface CategoryManifest {
  id: string;
  title: string;
  description: string;
  index: number;
}
