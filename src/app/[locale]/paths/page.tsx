import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LearningPathExplorer } from "@/platform/content/LearningPathExplorer";
import { LearningDiagnostic } from "@/platform/content/LearningDiagnostic";
import { createLocalizedMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const english = locale === "en";
  return createLocalizedMetadata({
    locale,
    path: "paths",
    title: english ? "Choose an onchain learning path" : "选择你的链上机制学习路径",
    description: english ? "Choose a goal, answer three boundary questions, and get an explained route through ledgers, assets, markets, and risk." : "先选择目标，再回答三个机制边界问题，获得一条串起账本、资产、市场与风险的可解释学习路线。",
  });
}

export default async function LearningPathsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <div className="paths-page page-width"><nav className="breadcrumbs" aria-label={english ? "Breadcrumb" : "面包屑"}><Link href={`/${locale}`}>{english ? "Home" : "首页"}</Link><span>/</span><span>{english ? "Learning paths" : "学习路径"}</span></nav><header className="paths-page__header"><span className="eyebrow">{english ? "CHOOSE A START" : "选择起点"}</span><h1>{english ? <>Choose what you want to understand.<br /><em>We will suggest an order.</em></> : <>先选想了解的方向，<br /><em>再决定课程顺序。</em></>}</h1><p>{english ? "A learning path is simply an ordered set of existing courses. You can follow a recommendation or switch routes at any time." : "学习路径只是把现有课程按不同目标重新排序。可以使用推荐结果，也可以随时换一条路线。"}</p></header><LearningDiagnostic locale={locale} /><Suspense fallback={<div className="learning-path-explorer" aria-hidden="true" />}><LearningPathExplorer locale={locale} /></Suspense><section className="paths-page__note"><div><span className="eyebrow">{english ? "AFTER CHOOSING" : "选好以后"}</span><h2>{english ? "Start with the first course in the route." : "从路线中的第一门课开始即可。"}</h2></div><div><p>{english ? "Each course includes explanations, interactive examples, and a knowledge check. The challenge and progress pages are optional tools for comparison and review." : "每门课都包括说明、互动示例和理解检查。系统挑战可以用来比较不同课程，进度页则用于继续学习和复习。"}</p><Link className="text-button" href={`/${locale}#journey`}>{english ? "See how the site works →" : "查看网站使用说明 →"}</Link></div></section></div>;
}
