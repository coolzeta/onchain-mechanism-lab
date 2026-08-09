import type { Metadata } from "next";
import Link from "next/link";
import { TokenLaunchLab } from "@/modules/token-launch/components/TokenLaunchLab";
import { tokenLaunchManifest as module } from "@/modules/token-launch/manifest";
import { labMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return labMetadata(module, locale);
}

export default async function TokenLaunchLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <div className="lab-page page-width-wide"><nav className="breadcrumbs" aria-label={english ? "Breadcrumb" : "面包屑"}><Link href={`/${locale}`}>{english ? "Mechanism map" : "机制地图"}</Link><span>/</span><Link href={`/${locale}/learn/token-launch`}>{english ? "Token launch" : "代币发行课程"}</Link><span>/</span><span>{english ? "Free lab" : "自由实验室"}</span></nav><header className="lab-page__header"><div><span className="eyebrow">OPEN LAB · TOKEN LAUNCH</span><h1>{english ? "Token Launch Free Lab" : "代币发行自由实验室"}</h1><p>{english ? "Adjust minting, distribution, vesting, burning, and authority handoff. Watch supply become a relationship of power. All assets are virtual and educational." : "调整增发、分配、锁仓、销毁和权限移交，看看“供应”如何变成权力关系。这里没有真实资产，也不代表任何投资建议。"}</p></div><Link className="text-button" href={`/${locale}/learn/token-launch/supply-and-authority`}>{english ? "Back to course →" : "回到课程 →"}</Link></header><TokenLaunchLab locale={locale} /></div>;
}
