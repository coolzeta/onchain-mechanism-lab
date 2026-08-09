import type { Metadata } from "next";
import Link from "next/link";
import { GlossaryExplorer } from "@/platform/content/GlossaryExplorer";
import { createLocalizedMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const english = locale === "en";
  return createLocalizedMetadata({ locale, path: "glossary", title: english ? "Onchain mechanism glossary" : "链上机制术语表", description: english ? "Search concise definitions and jump from each term back to the lesson where the mechanism becomes visible." : "搜索链上机制的易懂定义，并从每个术语回到能亲眼看见它运行的课程章节。" });
}

export default async function GlossaryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return (
    <div className="glossary-page page-width">
      <nav className="breadcrumbs" aria-label={english ? "Breadcrumb" : "面包屑"}><Link href={`/${locale}`}>{english ? "Mechanism atlas" : "机制地图"}</Link><span>/</span><span>{english ? "Glossary" : "术语表"}</span></nav>
      <header><span className="eyebrow">{english ? "GLOSSARY" : "术语表"}</span><h1>{english ? <>Definitions used<br />throughout the courses</> : <>课程中常见的<br />链上术语</>}</h1><p>{english ? "Search for a term, read a short definition, or open the course where it is explained in context." : "可以搜索术语、查看简要解释，或打开相关课程了解它在具体场景中的用法。"}</p></header>
      <GlossaryExplorer locale={locale} />
    </div>
  );
}
