import type { Metadata } from "next";
import Link from "next/link";
import { MarketLab } from "@/modules/prediction-markets/components/MarketLab";
import { predictionMarketManifest as module } from "@/modules/prediction-markets/manifest";
import { labMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return labMetadata(module, locale);
}

export default async function PredictionMarketLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return (
    <div className="lab-page page-width-wide">
      <nav className="breadcrumbs" aria-label={english ? "Breadcrumb" : "面包屑"}><Link href={`/${locale}`}>{english ? "Mechanism atlas" : "机制地图"}</Link><span>/</span><Link href={`/${locale}/learn/prediction-markets`}>{english ? "Prediction markets" : "预测市场"}</Link><span>/</span><span>{english ? "Sandbox" : "自由实验室"}</span></nav>
      <header className="lab-page__header"><div><span className="eyebrow">FREE PLAYGROUND</span><h1>{english ? "Prediction market sandbox" : "预测市场自由实验室"}</h1><p>{english ? "There is no single correct route. Change orders, liquidity, and resolution to watch price, collateral, and positions move together." : "没有正确路线。改变订单、流动性和结算结果，观察价格、抵押和头寸如何一起变化。"}</p></div><aside><strong>{english ? "Lab rules" : "实验规则"}</strong><p>{english ? "All numbers are virtual credits. Matching uses price-time priority; each contract locks 100 credits." : "所有数字均为虚拟积分。撮合采用价格优先、时间优先；每份合约锁定 100 积分。"}</p></aside></header>
      <MarketLab locale={english ? "en" : "zh"} />
      <section className="lab-prompts"><h2>{english ? "Not sure where to start? Try these four experiments." : "不知道从哪里开始？试试这四个实验。"}</h2><div><article><span>01</span><p>{english ? "Choose thin liquidity, push the YES price toward 90, and inspect how much actually fills." : "选择低流动性，把 YES 价格拉到 90，观察你实际成交了多少。"}</p></article><article><span>02</span><p>{english ? "Submit an order that does not fill immediately, then cancel it from the book." : "提交一张没有立刻成交的订单，再从订单簿中撤销它。"}</p></article><article><span>03</span><p>{english ? "Resolve the same positions as YES and NO and compare final balances." : "分别用 YES 和 NO 结算同一组头寸，比较参与者的最终余额。"}</p></article><article><span>04</span><p>{english ? "Switch to the wrong oracle: price can look reasonable while settlement is completely wrong." : "切到错误预言机：市场价格可以合理，结算仍然可以完全错误。"}</p></article></div></section>
    </div>
  );
}
