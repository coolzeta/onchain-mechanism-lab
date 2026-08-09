import type { ModuleManifest } from "@/platform/types/learning";
import { getLocalizedModule } from "@/platform/content/localization";
import { getSeoCopy, localizedUrl, safeJsonLd } from "@/platform/seo";
import { siteConfig } from "@/platform/config";

function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }} />;
}

export function WebsiteStructuredData({ locale }: { locale: string }) {
  const copy = getSeoCopy(locale);
  return <JsonLd data={{
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: copy.name,
    alternateName: [copy.shortName, "lab.zeta.lol"],
    description: copy.description,
    inLanguage: copy.language,
  }} />;
}

export function CourseCatalogStructuredData({ modules, locale }: { modules: ModuleManifest[]; locale: string }) {
  const copy = getSeoCopy(locale);
  return <JsonLd data={{
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: locale === "en" ? "Onchain mechanism interactive courses" : "链上机制互动课程目录",
    description: copy.description,
    numberOfItems: modules.length,
    itemListElement: modules.map((module, index) => {
      const localized = getLocalizedModule(module, locale);
      return {
        "@type": "ListItem",
        position: index + 1,
        url: localizedUrl(locale, `learn/${module.id}`),
        item: {
          "@type": "Course",
          name: localized.title,
          description: localized.description,
          url: localizedUrl(locale, `learn/${module.id}`),
          inLanguage: copy.language,
          isAccessibleForFree: true,
          provider: { "@type": "Organization", name: copy.name, url: siteConfig.url },
        },
      };
    }),
  }} />;
}

export function CourseStructuredData({ module, locale }: { module: ModuleManifest; locale: string }) {
  const localized = getLocalizedModule(module, locale);
  const copy = getSeoCopy(locale);
  const courseUrl = localizedUrl(locale, `learn/${module.id}`);
  return <>
    <JsonLd data={{
      "@context": "https://schema.org",
      "@type": "Course",
      "@id": `${courseUrl}#course`,
      name: localized.title,
      description: localized.description,
      url: courseUrl,
      inLanguage: copy.language,
      isAccessibleForFree: true,
      timeRequired: `PT${localized.estimatedMinutes}M`,
      numberOfCredits: 0,
      educationalLevel: locale === "en" ? "Beginner" : "入门",
      teaches: localized.lessons.flatMap((lesson) => lesson.concepts),
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: `PT${localized.estimatedMinutes}M`,
      },
      provider: { "@type": "Organization", name: copy.name, url: siteConfig.url },
    }} />
    <JsonLd data={{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: locale === "en" ? "Mechanism map" : "机制地图", item: localizedUrl(locale) },
        { "@type": "ListItem", position: 2, name: localized.shortTitle, item: courseUrl },
      ],
    }} />
  </>;
}
