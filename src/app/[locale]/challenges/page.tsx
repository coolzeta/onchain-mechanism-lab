import type { Metadata } from "next";
import Link from "next/link";
import { CrossModuleChallenge } from "@/platform/content/CrossModuleChallenge";
import { getChallenge } from "@/platform/content/challenges";
import { createLocalizedMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const challenge = getChallenge(locale);
  return createLocalizedMetadata({ locale, path: "challenges", title: challenge.title, description: challenge.summary });
}

export default async function ChallengesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  const challenge = getChallenge(locale);
  return <div className="challenges-page page-width"><nav className="breadcrumbs" aria-label={english ? "Breadcrumb" : "面包屑"}><Link href={`/${locale}`}>{english ? "Mechanism atlas" : "机制地图"}</Link><span>/</span><span>{english ? "Systems challenge" : "系统挑战"}</span></nav><header className="challenges-page__header"><span className="eyebrow">{english ? "MULTI-COURSE EXERCISE" : "跨课程练习"}</span><h1>{challenge.title}</h1><p>{challenge.summary}</p><div className="challenges-page__meta"><span>{english ? `${challenge.steps.length} systems` : `${challenge.steps.length} 个系统`}</span><span>{english ? `About ${challenge.estimatedMinutes} min` : `约 ${challenge.estimatedMinutes} 分钟`}</span><span>{english ? "Can restart" : "可重新开始"}</span></div></header><CrossModuleChallenge locale={locale} /></div>;
}
