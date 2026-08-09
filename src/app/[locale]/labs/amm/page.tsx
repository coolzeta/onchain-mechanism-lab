import type { Metadata } from "next";
import Link from "next/link";
import { AMMLab } from "@/modules/amm/components/AMMLab";
import { ammManifest as module } from "@/modules/amm/manifest";
import { labMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return labMetadata(module, locale);
}

export default async function AMMLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <div className="lab-page page-width-wide"><nav className="breadcrumbs" aria-label={english ? "Breadcrumb" : "面包屑"}><Link href={`/${locale}`}>{english ? "Mechanism map" : "机制地图"}</Link><span>/</span><Link href={`/${locale}/learn/amm`}>AMM</Link><span>/</span><span>{english ? "Free lab" : "自由实验室"}</span></nav><header className="lab-page__header"><div><span className="eyebrow">FREE PLAYGROUND · AMM</span><h1>{english ? "AMM Free Lab" : "AMM 自由实验室"}</h1><p>{english ? "Change swap size, inspect fees, become an LP, and withdraw liquidity. Every number is virtual." : "改变交换规模、观察手续费、成为 LP，再取回你的流动性。所有数字都是虚拟资产。"}</p></div><aside><strong>{english ? "Lab rules" : "实验规则"}</strong><p>{english ? "This is a teaching approximation of a constant-product pool. Real protocols also handle precision, minimum output, flash loans, and contract security." : "这是一个恒定乘积池的教学近似模型。实际协议还会处理精度、最小输出量、闪电贷和合约安全。"}</p></aside></header><AMMLab locale={locale} /><section className="lab-prompts"><h2>{english ? "Not sure where to start? Try these four experiments." : "不知道从哪里开始？试试这四个实验。"}</h2><div><article><span>01</span><p>{english ? "Buy a little TOKEN with credits, then scale up and compare spot with execution price." : "用积分买一小笔 TOKEN，再逐步放大数量，比较现货价和实际成交价。"}</p></article><article><span>02</span><p>{english ? "After a swap, inspect k: which side of the pool keeps the fee?" : "完成一笔交易后观察 k 的变化：手续费留在池子里的哪一边？"}</p></article><article><span>03</span><p>{english ? "Deposit 12,000 credits and 100 TOKEN, become an LP, then withdraw half." : "存入 12,000 积分和 100 TOKEN，成为 LP，再移除一半份额。"}</p></article><article><span>04</span><p>{english ? "Trade repeatedly in one direction and watch reserves push the price back." : "连续用同一方向交易，观察储备比例和价格如何把你推回另一边。"}</p></article></div></section></div>;
}
