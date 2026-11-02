import type { Metadata } from "next";
import Link from "next/link";
import { RwaLab } from "@/modules/rwa/components/RwaLab";
import { rwaManifest as module } from "@/modules/rwa/manifest";
import { labMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return labMetadata(module, locale);
}

export default async function RwaLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <div className="lab-page page-width-wide"><nav className="breadcrumbs" aria-label={english ? "Breadcrumbs" : "面包屑"}><Link href={`/${locale}`}>{english ? "Mechanism map" : "机制地图"}</Link><span>/</span><Link href={`/${locale}/learn/rwa`}>RWA</Link><span>/</span><span>{english ? "Free lab" : "自由实验室"}</span></nav><header className="lab-page__header"><div><span className="eyebrow">OPEN LAB · RIGHTS / ASSETS / REDEMPTION</span><h1>{english ? "RWA Free Lab" : "RWA 自由实验室"}</h1><p>{english ? "Explore a hypothetical tokenized asset and compare reported value, underlying value, issuance and redemption liquidity." : "通过假设的资产代币案例，比较报告价值、底层资产价值、发行量和赎回流动性。"}</p></div><aside><strong>{english ? "Lab rules" : "实验规则"}</strong><p>{english ? "This simplified educational model does not establish legal ownership, verify real assets, or promise liquidity or redemption." : "这是简化的教学模型，不能证明法律所有权或真实资产，也不保证流动性和赎回。"}</p></aside></header><RwaLab /></div>;
}
