import type { Metadata } from "next";
import { ammManifest as module } from "@/modules/amm/manifest";
import { CourseOverview } from "@/platform/components/CourseOverview";
import { getLocalizedModule } from "@/platform/content/localization";
import { courseMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return courseMetadata(module, locale);
}

export default async function AMMOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <CourseOverview module={getLocalizedModule(module, locale)} locale={locale} content={{
    question: english ? "Without an order book, who quotes the next trade?" : "没有订单簿，谁来给出下一笔报价？",
    questionDescription: english ? "Split a pool into reserves, curve, trader, and LP, then watch a rule replace manual matching." : "我们会把一个资金池拆成储备、曲线、交易者和 LP，观察它如何用规则代替人工撮合。",
    roles: english ? [
      { avatar: "Pool", label: "Pool: quotes continuously" },
      { avatar: "Trader", label: "Trader: trades size for immediacy" },
      { avatar: "LP", label: "LP: earns fees" },
      { avatar: "Arb", label: "Arbitrageur: reconnects outside prices" },
    ] : [
      { avatar: "池", label: "资金池：持续给出报价" },
      { avatar: "交", label: "交易者：用规模换取即时成交" },
      { avatar: "LP", label: "流动性提供者：赚取手续费" },
      { avatar: "套利", label: "套利者：把价格带回外部市场" },
    ],
    outcomes: english ? [
      "How does x·y=k turn two reserves into a quote?",
      "Why do large trades face larger price impact?",
      "How do fees grow k and become LP income?",
      "Why does an LP's asset mix change after swaps?",
      "How does arbitrage move reserves when outside prices change?",
    ] : [
      "x·y=k 如何把两种储备转换成下一笔报价？",
      "为什么大额交易会遭遇更大的价格冲击？",
      "手续费如何让 k 增长，并成为 LP 的收入？",
      "为什么 LP 的资产比例会随着交易而改变？",
      "外部价格变化时，套利如何改变储备，以及无常损失如何显现？",
    ],
  }} />;
}
