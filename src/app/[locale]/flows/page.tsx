import type { Metadata } from "next";
import Link from "next/link";
import { ValuePathExplorer } from "@/platform/content/ValuePathExplorer";
import { createLocalizedMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const english = locale === "en";
  return createLocalizedMetadata({ locale, path: "flows", title: english ? "How onchain systems depend on one another" : "链上系统之间如何互相影响", description: english ? "See how ledgers, assets, governance, liquidity, execution, leverage, oracles, reserves, and settlement relate." : "查看账本、资产、治理、流动性、成交、杠杆、预言机、储备与结算之间的关系。" });
}

export default async function ValuePathPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return (
    <div className="flows-page page-width">
      <nav className="breadcrumbs" aria-label={english ? "Breadcrumb" : "面包屑"}><Link href={`/${locale}`}>{english ? "Mechanism atlas" : "机制地图"}</Link><span>/</span><span>{english ? "Value path" : "价值路径"}</span></nav>
      <header className="flows-page__header">
        <span className="eyebrow">{english ? "SYSTEM RELATIONSHIPS" : "系统关系"}</span>
        <h1>{english ? <>How do onchain systems<br /><em>depend on one another?</em></> : <>链上系统之间，<br /><em>怎样互相影响？</em></>}</h1>
        <p>{english ? "This page links ten parts of an onchain system, from the ledger to final settlement. It is useful after you have completed one or two courses." : "这页把账本、资产、治理、流动性、成交、借贷、预言机、储备和结算放在一起，适合学完一两门课程后查看。"}</p>
        <div className="flows-page__meta"><span>{english ? "10 steps" : "10 个环节"}</span><span>{english ? "Interactive" : "可交互"}</span><span>{english ? "Educational example" : "教学示例"}</span></div>
      </header>
      <ValuePathExplorer locale={locale} />
      <section className="flows-page__note">
        <div><span className="eyebrow">{english ? "ABOUT THIS DIAGRAM" : "关于这张图"}</span><h2>{english ? "It explains relationships, not a fixed call order." : "它说明系统关系，不代表固定调用顺序"}</h2></div>
        <p>{english ? "Real protocols may skip or reorder these steps. Use the diagram to identify what changes, what each step depends on, and where a failure can affect later systems." : "真实协议可能跳过或调整其中的步骤。可以用这张图确认每一步改变了什么、依赖什么，以及错误会怎样影响后续系统。"}</p>
      </section>
      <div className="flows-page__footer-actions"><Link className="text-button" href={`/${locale}/challenges`}>{english ? "Take the systems challenge →" : "去做系统挑战 →"}</Link><Link className="text-button" href={`/${locale}/paths`}>{english ? "Choose a learning path ↗" : "选择学习路径 ↗"}</Link></div>
    </div>
  );
}
