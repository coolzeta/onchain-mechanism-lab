import type { Metadata } from "next";
import Link from "next/link";
import { MEVLab } from "@/modules/mev/components/MEVLab";
import { mevManifest as module } from "@/modules/mev/manifest";
import { labMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return labMetadata(module, locale);
}

export default async function MEVLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <div className="lab-page page-width-wide"><nav className="breadcrumbs" aria-label={english ? "Breadcrumb" : "面包屑"}><Link href={`/${locale}`}>{english ? "Mechanism map" : "机制地图"}</Link><span>/</span><Link href={`/${locale}/learn/mev`}>{english ? "MEV & ordering" : "MEV 与排序"}</Link><span>/</span><span>{english ? "Free lab" : "自由实验室"}</span></nav><header className="lab-page__header"><div><span className="eyebrow">OPEN LAB · MEMPOOL / ORDERING / MEV</span><h1>{english ? "MEV & Ordering Free Lab" : "MEV 与交易排序自由实验室"}</h1><p>{english ? "Submit a user swap, inspect public or private visibility, build a block order, and compare output protection with searcher and proposer balances. Every asset is virtual." : "提交一笔用户交换，观察公开或私有可见性，构建区块排序，再比较输出保护与搜索者、提议者的余额变化。所有资产都是虚拟的。"}</p></div><Link className="text-button" href={`/${locale}/learn/mev/mempool-and-ordering`}>{english ? "Back to course →" : "回到课程 →"}</Link></header><MEVLab locale={locale} /><section className="lab-prompts"><h2>{english ? "Try these four ordering experiments." : "试试这四个排序实验。"}</h2><div><article><span>01</span><p>{english ? "Run the plain public path and mark the moment pending becomes shared state." : "运行普通公开路径，标记 pending 变成共享状态的那一刻。"}</p></article><article><span>02</span><p>{english ? "Run a sandwich with a loose guard, then tighten minimum output until the victim reverts." : "用宽松保护运行夹子交易，再收紧最小得到数量直到用户回滚。"}</p></article><article><span>03</span><p>{english ? "Run the back-run and keep pool reserves, searcher P/L, and proposer tip on one ledger." : "运行回跑，把池子储备、搜索者盈亏和提议者小费放在同一张账上。"}</p></article><article><span>04</span><p>{english ? "Repeat the same swap through private flow and name the trust boundary that remains." : "通过私有订单流重复同一笔交换，并指出仍然存在的信任边界。"}</p></article></div></section></div>;
}
