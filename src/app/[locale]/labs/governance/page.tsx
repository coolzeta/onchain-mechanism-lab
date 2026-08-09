import type { Metadata } from "next";
import Link from "next/link";
import { GovernanceLab } from "@/modules/governance/components/GovernanceLab";
import { governanceManifest as module } from "@/modules/governance/manifest";
import { labMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return labMetadata(module, locale);
}

export default async function GovernanceLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <div className="lab-page page-width-wide"><nav className="breadcrumbs" aria-label={english ? "Breadcrumb" : "面包屑"}><Link href={`/${locale}`}>{english ? "Mechanism map" : "机制地图"}</Link><span>/</span><Link href={`/${locale}/learn/governance`}>{english ? "Governance & treasury" : "治理与金库"}</Link><span>/</span><span>{english ? "Free lab" : "自由实验室"}</span></nav><header className="lab-page__header"><div><span className="eyebrow">OPEN LAB · PROPOSAL / VOTE / TIMELOCK / TREASURY</span><h1>{english ? "Governance & Treasury Free Lab" : "治理与金库自由实验室"}</h1><p>{english ? "Create a proposal, delegate voting power, meet quorum, wait through a timelock, and execute or cancel a virtual treasury action. No wallet, chain, or real funds." : "创建提案、委托投票权、达到法定人数、等待时间锁，再执行或取消一笔虚拟金库动作。不连接钱包、链或真实资金。"}</p></div><Link className="text-button" href={`/${locale}/learn/governance/proposal-as-state`}>{english ? "Back to course →" : "回到课程 →"}</Link></header><GovernanceLab locale={locale} /><section className="lab-prompts"><h2>{english ? "Try these four governance experiments." : "试试这四个治理实验。"}</h2><div><article><span>01</span><p>{english ? "Create a fee proposal and identify the exact step that changes protocol state." : "创建手续费提案，指出真正改变协议状态的那一步。"}</p></article><article><span>02</span><p>{english ? "Delegate Alice to Bob before the snapshot and test duplicate voting power." : "在快照前把 Alice 的票委托给 Bob，测试重复使用投票权。"}</p></article><article><span>03</span><p>{english ? "Reach quorum, queue the proposal, then watch the two-day reaction window." : "达到法定人数、进入时间锁，再观察两天反应窗口。"}</p></article><article><span>04</span><p>{english ? "Run a treasury grant, then cancel it before execution and compare both ledgers." : "运行金库拨款，再在执行前取消，比较两张账。"}</p></article></div></section></div>;
}
