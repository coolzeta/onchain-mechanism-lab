import type { Metadata } from "next";
import Link from "next/link";
import { MatchingEngineLab } from "@/modules/matching-engine/components/MatchingEngineLab";
import { matchingEngineManifest as module } from "@/modules/matching-engine/manifest";
import { labMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return labMetadata(module, locale);
}

export default async function MatchingEngineLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <div className="lab-page page-width-wide"><nav className="breadcrumbs" aria-label={english ? "Breadcrumb" : "面包屑"}><Link href={`/${locale}/learn/matching-engine`}>{english ? "Matching engine course" : "撮合引擎课程"}</Link><span>/</span><span>{english ? "Free lab" : "自由实验室"}</span></nav><header className="lab-page__header"><div><span className="eyebrow">OPEN LAB · ORDERBOOK ENGINE</span><h1>{english ? "Matching Engine Free Lab" : "撮合引擎自由实验室"}</h1><p>{english ? "Submit limit or market orders, cross the spread, and observe partial fills, depth impact, cancel-replace, and risk events. Assets are virtual credits; no wallet or investment advice." : "提交限价单或市价单，穿过价差，观察部分成交、深度冲击、撤改单与风控事件。所有资产都是虚拟积分，不连接钱包，也不代表投资建议。"}</p></div><Link className="text-button" href={`/${locale}/learn/matching-engine/priority-and-partial-fills`}>{english ? "Back to course →" : "回到课程 →"}</Link></header><MatchingEngineLab locale={locale} /></div>;
}
