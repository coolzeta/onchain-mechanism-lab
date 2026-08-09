import type { Metadata } from "next";
import Link from "next/link";
import { ProgressDashboard } from "@/platform/progress/ProgressDashboard";
import { createLocalizedMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const english = locale === "en";
  return createLocalizedMetadata({ locale, path: "progress", title: english ? "My learning progress" : "我的学习进度", description: english ? "Your locally stored lesson progress and review suggestions." : "保存在当前浏览器的课程进度与复习建议。", noIndex: true });
}

export default async function ProgressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <div className="progress-page page-width"><nav className="breadcrumbs" aria-label={english ? "Breadcrumb" : "面包屑"}><Link href={`/${locale}`}>{english ? "Mechanism atlas" : "机制地图"}</Link><span>/</span><span>{english ? "My progress" : "我的进度"}</span></nav><ProgressDashboard locale={locale} /></div>;
}
