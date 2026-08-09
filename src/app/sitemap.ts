import type { MetadataRoute } from "next";
import { modules } from "@/platform/content/registry";
import { languageAlternates, localizedUrl, seoLocales } from "@/platform/seo";

export const dynamic = "force-static";

const evergreenPaths = ["", "paths", "flows", "glossary", "challenges"];

function entry(locale: string, path: string, priority: number, changeFrequency: "weekly" | "monthly") {
  return {
    url: localizedUrl(locale, path),
    lastModified: new Date("2026-08-09T00:00:00.000Z"),
    changeFrequency,
    priority,
    alternates: { languages: languageAlternates(path) },
  } satisfies MetadataRoute.Sitemap[number];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [];
  for (const locale of seoLocales) {
    for (const path of evergreenPaths) {
      pages.push(entry(locale, path, path ? 0.72 : 1, path ? "monthly" : "weekly"));
    }

    for (const manifest of modules) {
      pages.push(entry(locale, `learn/${manifest.id}`, 0.9, "monthly"));
      for (const lesson of manifest.lessons) {
        pages.push(entry(locale, `learn/${manifest.id}/${lesson.id}`, 0.82, "monthly"));
      }
      pages.push(entry(locale, `labs/${manifest.id}`, 0.76, "monthly"));
    }
  }
  return pages;
}
