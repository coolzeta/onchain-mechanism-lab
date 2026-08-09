import type { Metadata } from "next";
import Link from "next/link";
import { LendingLab } from "@/modules/lending/components/LendingLab";
import { lendingManifest as module } from "@/modules/lending/manifest";
import { labMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return labMetadata(module, locale);
}

export default async function LendingLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <div className="lab-page page-width-wide"><nav className="breadcrumbs" aria-label={english ? "Breadcrumb" : "面包屑"}><Link href={`/${locale}`}>{english ? "Mechanism map" : "机制地图"}</Link><span>/</span><Link href={`/${locale}/learn/lending`}>{english ? "Lending & liquidation" : "借贷与清算"}</Link><span>/</span><span>{english ? "Free lab" : "自由实验室"}</span></nav><header className="lab-page__header"><div><span className="eyebrow">OPEN LAB · COLLATERAL / LIQUIDATION</span><h1>{english ? "Lending & Liquidation Free Lab" : "借贷与清算自由实验室"}</h1><p>{english ? "Deposit collateral, borrow, accrue interest, and shock the price. Then see who can trigger liquidation after the oracle updates. Every number is virtual." : "存入抵押品、借款、推进利息和价格冲击，再观察预言机更新后谁可以触发清算。所有数字都是虚拟资产。"}</p></div><aside><strong>{english ? "Lab rules" : "实验规则"}</strong><p>{english ? "This is an educational approximation of lending. Real protocols also handle rate curves, auctions, flash loans, price guards, and more complex bad-debt socialization." : "这是一个教育用的借贷近似模型。实际协议还会处理利率曲线、拍卖、闪电贷、价格保护和更复杂的坏账社会化。"}</p></aside></header><LendingLab locale={locale} /><section className="lab-prompts"><h2>{english ? "Not sure where to start? Try these four experiments." : "不知道从哪里开始？试试这四个实验。"}</h2><div><article><span>01</span><p>{english ? "Deposit 100 TOKEN, borrow near 75% LTV, and record the safety room that remains." : "存入 100 TOKEN，借到接近 75% LTV 的额度，记录还剩多少安全空间。"}</p></article><article><span>02</span><p>{english ? "Advance interest while price stays flat, watch health fall, then repay part of the debt." : "推进计息周期，观察价格不动时健康度如何下降，再偿还一部分债务。"}</p></article><article><span>03</span><p>{english ? "Lower the oracle price below the liquidation line, run the keeper, and follow credits and TOKEN." : "把预言机价格降到清算线以下，运行清算人，追踪积分和 TOKEN 的流向。"}</p></article><article><span>04</span><p>{english ? "Drop the market price while keeping the old oracle, then compare when risk truly appears." : "先让市场价格下跌但保持旧预言机，再更新价格，比较风险何时真正暴露。"}</p></article></div></section></div>;
}
