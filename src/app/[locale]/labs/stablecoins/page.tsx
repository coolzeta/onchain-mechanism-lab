import type { Metadata } from "next";
import Link from "next/link";
import { StablecoinLab } from "@/modules/stablecoins/components/StablecoinLab";
import { stablecoinManifest as module } from "@/modules/stablecoins/manifest";
import { labMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return labMetadata(module, locale);
}

export default async function StablecoinLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <div className="lab-page page-width-wide"><nav className="breadcrumbs" aria-label={english ? "Breadcrumb" : "面包屑"}><Link href={`/${locale}`}>{english ? "Mechanism map" : "机制地图"}</Link><span>/</span><Link href={`/${locale}/learn/stablecoins`}>{english ? "Stablecoins" : "稳定币"}</Link><span>/</span><span>{english ? "Free lab" : "自由实验室"}</span></nav><header className="lab-page__header"><div><span className="eyebrow">OPEN LAB · PEG / RESERVE / REDEMPTION</span><h1>{english ? "Stablecoin Free Lab" : "稳定币自由实验室"}</h1><p>{english ? "Deposit collateral, mint USD-LAB, move the market price, redeem, and apply reserve losses. Watch where “stability” fails at the boundary. Every number is virtual." : "存入抵押品、发行 USD-LAB、移动市场价格并执行赎回，再施加储备损失，观察“稳定”如何在边界处失效。所有数字都是虚拟资产。"}</p></div><aside><strong>{english ? "Lab rules" : "实验规则"}</strong><p>{english ? "This is an educational approximation of a collateralized stablecoin. Real systems also handle multiple collateral types, liquidation auctions, liquidity, reserve disclosure, pause controls, and governance risk." : "这是一个教育用的抵押稳定币近似模型。实际系统还会处理多种抵押品、清算拍卖、流动性、储备披露、暂停机制和治理风险。"}</p></aside></header><StablecoinLab locale={locale} /><section className="lab-prompts"><h2>{english ? "Not sure where to start? Try these four experiments." : "不知道从哪里开始？试试这四个实验。"}</h2><div><article><span>01</span><p>{english ? "Deposit 100 COLLATERAL, mint 60 USD-LAB, and record the minimum ratio and remaining issuance room." : "存入 100 COLLATERAL，发行 60 USD-LAB，记录最低抵押率和剩余发行空间。"}</p></article><article><span>02</span><p>{english ? "Move the market price to $0.94, redeem, and follow supply and reserves shrinking together." : "把市场价格移动到 0.94 美元，再执行赎回，追踪供应和储备如何收缩。"}</p></article><article><span>03</span><p>{english ? "Drop the market price while keeping the old oracle, then update it and compare when the protocol sees the move." : "先让市场价格下跌但保持旧预言机，再更新价格，比较协议何时真正看见变化。"}</p></article><article><span>04</span><p>{english ? "Apply a reserve loss, redeem repeatedly, and observe when coverage crosses the safety boundary." : "施加储备损失，再连续赎回，观察抵押率什么时候跌破安全边界。"}</p></article></div></section></div>;
}
