import type { Metadata } from "next";
import Link from "next/link";
import { LedgerLab } from "@/modules/ledger/components/LedgerLab";
import { ledgerManifest as module } from "@/modules/ledger/manifest";
import { labMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return labMetadata(module, locale);
}

export default async function LedgerLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <div className="lab-page page-width-wide"><nav className="breadcrumbs" aria-label="面包屑"><Link href={`/${locale}/learn/ledger`}>最小账本课程</Link><span>/</span><span>自由实验室</span></nav><header className="lab-page__header"><div><span className="eyebrow">OPEN LAB · MINIMAL LEDGER</span><h1>最小账本自由实验室</h1><p>签名、广播、篡改、Nonce 和区块打包都会留下事件。所有余额都是虚拟积分，不连接钱包，也不构成投资建议。</p></div><Link className="text-button" href={`/${locale}/learn/ledger/transaction-and-state`}>回到课程 →</Link></header><LedgerLab /></div>;
}
