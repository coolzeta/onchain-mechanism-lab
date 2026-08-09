import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { modules } from "@/platform/content/registry";
import { courseMetadata, createLocalizedMetadata, languageAlternates, lessonMetadata, localizedUrl } from "@/platform/seo";

describe("SEO contracts", () => {
  it("creates stable trailing-slash canonical and reciprocal language alternates", () => {
    expect(localizedUrl("zh", "learn/amm")).toBe("https://chainlab.zeta.lol/zh/learn/amm/");
    expect(languageAlternates("learn/amm")).toEqual({
      "zh-CN": "https://chainlab.zeta.lol/zh/learn/amm/",
      en: "https://chainlab.zeta.lol/en/learn/amm/",
      "x-default": "https://chainlab.zeta.lol/zh/learn/amm/",
    });
  });

  it("gives courses and lessons their own canonical, summary, and social image", () => {
    const prediction = modules.find((module) => module.id === "prediction-markets");
    expect(prediction).toBeDefined();
    const course = courseMetadata(prediction!, "zh");
    const lesson = lessonMetadata(prediction!, "en", prediction!.lessons[0].id);

    expect(course.alternates?.canonical).toBe("https://chainlab.zeta.lol/zh/learn/prediction-markets/");
    expect(course.description).toContain("六个章节");
    expect(course.openGraph && "images" in course.openGraph ? course.openGraph.images : undefined).toBeTruthy();
    expect(lesson.alternates?.canonical).toBe("https://chainlab.zeta.lol/en/learn/prediction-markets/a-question-that-can-settle/");
    expect(lesson.description).toContain("vague question");
  });

  it("keeps personalized pages crawlable enough to read noindex, but out of the sitemap", () => {
    const privatePage = createLocalizedMetadata({ locale: "zh", path: "progress", title: "我的学习进度", noIndex: true });
    expect(privatePage.robots).toMatchObject({ index: false, follow: true });
    expect(robots().rules).toEqual({ userAgent: "*", allow: "/" });

    const urls = sitemap().map((item) => item.url);
    expect(urls.some((url) => url.includes("/progress/"))).toBe(false);
    expect(urls.some((url) => url.includes("/journal/"))).toBe(false);
    expect(urls.some((url) => url.includes("/modules/"))).toBe(false);
  });

  it("publishes every localized course, lesson, and lab exactly once", () => {
    const entries = sitemap();
    const uniqueUrls = new Set(entries.map((item) => item.url));
    const lessonCount = modules.reduce((sum, manifest) => sum + manifest.lessons.length, 0);
    const expectedPerLocale = 5 + modules.length * 2 + lessonCount;

    expect(entries).toHaveLength(expectedPerLocale * 2);
    expect(uniqueUrls.size).toBe(entries.length);
    for (const manifest of modules) {
      expect(uniqueUrls.has(`https://chainlab.zeta.lol/zh/learn/${manifest.id}/`)).toBe(true);
      expect(uniqueUrls.has(`https://chainlab.zeta.lol/en/labs/${manifest.id}/`)).toBe(true);
    }
  });
});
