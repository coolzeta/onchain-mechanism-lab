import type { Metadata } from "next";
import type { ModuleManifest, SupportedLocale } from "@/platform/types/learning";
import { getLocalizedModule } from "@/platform/content/localization";
import { siteConfig } from "@/platform/config";

export const seoLocales = ["zh", "en"] as const;

export interface SeoCopy {
  name: string;
  shortName: string;
  description: string;
  language: string;
  openGraphLocale: string;
}

const seoCopy: Record<SupportedLocale, SeoCopy> = {
  zh: {
    name: siteConfig.name,
    shortName: siteConfig.shortName,
    description: siteConfig.description,
    language: "zh-CN",
    openGraphLocale: "zh_CN",
  },
  en: {
    name: siteConfig.englishName,
    shortName: "Mechanism Lab",
    description: siteConfig.englishDescription,
    language: "en",
    openGraphLocale: "en_US",
  },
};

export function asSeoLocale(locale: string): SupportedLocale {
  return locale === "en" ? "en" : "zh";
}

export function getSeoCopy(locale: string): SeoCopy {
  return seoCopy[asSeoLocale(locale)];
}

function cleanPath(path: string) {
  const value = path.replace(/^\/+|\/+$/g, "");
  return value ? `/${value}/` : "/";
}

export function localizedUrl(locale: string, path = "") {
  return `${siteConfig.url}/${asSeoLocale(locale)}${cleanPath(path)}`;
}

export function languageAlternates(path = "") {
  return {
    "zh-CN": localizedUrl("zh", path),
    en: localizedUrl("en", path),
    "x-default": localizedUrl("zh", path),
  };
}

export interface LocalizedMetadataOptions {
  locale: string;
  path?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  noIndex?: boolean;
  canonicalPath?: string;
}

export function createLocalizedMetadata({
  locale,
  path = "",
  title,
  description,
  keywords = [],
  noIndex = false,
  canonicalPath,
}: LocalizedMetadataOptions): Metadata {
  const normalizedLocale = asSeoLocale(locale);
  const copy = getSeoCopy(normalizedLocale);
  const finalTitle = title ?? copy.name;
  const finalDescription = description ?? copy.description;
  const resolvedPath = canonicalPath ?? path;
  const canonical = localizedUrl(normalizedLocale, resolvedPath);

  return {
    title: title ? finalTitle : { absolute: finalTitle },
    description: finalDescription,
    keywords,
    alternates: {
      canonical,
      languages: languageAlternates(resolvedPath),
    },
    robots: noIndex
      ? { index: false, follow: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: copy.name,
      title: finalTitle,
      description: finalDescription,
      locale: copy.openGraphLocale,
      alternateLocale: normalizedLocale === "zh" ? ["en_US"] : ["zh_CN"],
      images: [
        {
          url: `${siteConfig.url}/og-image.png`,
          width: 1200,
          height: 630,
          alt: normalizedLocale === "zh" ? "链上机制实验室课程与互动实验" : "Onchain Mechanism Lab courses and interactive labs",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDescription,
      images: [`${siteConfig.url}/og-image.png`],
    },
  };
}

export function courseMetadata(module: ModuleManifest, locale: string): Metadata {
  const localized = getLocalizedModule(module, locale);
  const english = asSeoLocale(locale) === "en";
  return createLocalizedMetadata({
    locale,
    path: `learn/${module.id}`,
    title: localized.title,
    description: localized.description,
    keywords: [
      localized.shortTitle,
      english ? "interactive course" : "互动课程",
      english ? "blockchain education" : "区块链原理",
      english ? "onchain mechanism" : "链上机制",
    ],
  });
}

export function lessonMetadata(module: ModuleManifest, locale: string, lessonId: string): Metadata {
  const localized = getLocalizedModule(module, locale);
  const lesson = localized.lessons.find((candidate) => candidate.id === lessonId);
  const english = asSeoLocale(locale) === "en";
  return createLocalizedMetadata({
    locale,
    path: `learn/${module.id}/${lessonId}`,
    title: lesson?.title ?? (english ? `${localized.shortTitle} lesson` : `${localized.shortTitle}课程章节`),
    description: lesson?.summary ?? localized.summary,
    keywords: lesson ? [...lesson.concepts, localized.shortTitle] : [localized.shortTitle],
  });
}

export function labMetadata(module: ModuleManifest, locale: string): Metadata {
  const localized = getLocalizedModule(module, locale);
  const english = asSeoLocale(locale) === "en";
  return createLocalizedMetadata({
    locale,
    path: `labs/${module.id}`,
    title: english ? `${localized.shortTitle} interactive sandbox` : `${localized.shortTitle}互动实验室`,
    description: english
      ? `Change the state yourself and test how ${localized.shortTitle} behaves at its boundaries. All assets and results are educational simulations.`
      : `亲手改变状态，观察${localized.shortTitle}在不同边界条件下如何运行。所有资产与结果均为教育模拟。`,
    keywords: [localized.shortTitle, english ? "interactive simulator" : "互动模拟器", english ? "mechanism lab" : "机制实验"],
  });
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
