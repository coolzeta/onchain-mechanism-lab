import type { Metadata } from "next";
import Link from "next/link";
import { OracleLab } from "@/modules/oracles/components/OracleLab";
import { oracleManifest as module } from "@/modules/oracles/manifest";
import { labMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return labMetadata(module, locale);
}

export default async function OracleLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <div className="lab-page page-width-wide"><nav className="breadcrumbs" aria-label="面包屑"><Link href={`/${locale}/learn/oracles`}>预言机课程</Link><span>/</span><span>自由实验室</span></nav><header className="lab-page__header"><div><span className="eyebrow">OPEN LAB · ORACLE DISPUTE</span><h1>预言机自由实验室</h1><p>选择数据源场景，让报告、挑战、担保和仲裁走完一轮。这里是教育模拟，不连接真实市场，也不构成投资建议。</p></div><Link className="text-button" href={`/${locale}/learn/oracles/report-challenge-finalize`}>回到课程 →</Link></header><OracleLab /></div>;
}
