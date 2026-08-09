import type { Metadata } from "next";
import Link from "next/link";
import { ResearchJournal } from "@/platform/progress/ResearchJournal";
import { createLocalizedMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const english = locale === "en";
  return createLocalizedMetadata({ locale, path: "journal", title: english ? "My experiment records" : "我的实验记录", description: english ? "Locally saved experiment snapshots and comparisons." : "保存在当前浏览器的实验快照与结果比较。", noIndex: true });
}

export default async function ResearchJournalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <div className="page-width"><nav className="breadcrumbs" aria-label={english ? "Breadcrumb" : "面包屑"}><Link href={`/${locale}`}>{english ? "Course map" : "课程目录"}</Link><span>/</span><span>{english ? "Experiment records" : "实验记录"}</span></nav><ResearchJournal locale={locale} /></div>;
}
