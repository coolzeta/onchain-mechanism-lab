import type { Metadata } from "next";
import { stablecoinManifest as module } from "@/modules/stablecoins/manifest";
import { CourseOverview } from "@/platform/components/CourseOverview";
import { getLocalizedModule } from "@/platform/content/localization";
import { courseMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return courseMetadata(module, locale);
}

export default async function StablecoinOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <CourseOverview module={getLocalizedModule(module, locale)} locale={locale} content={{
    question: english ? "Who keeps a token near one dollar?" : "谁保证一枚代币尽量接近 1 美元？",
    questionDescription: english ? "Put target price, market price, collateral, redemption, reserve loss, and oracle inputs on one state ledger. Follow the boundaries that make “stable” possible." : "我们会把目标价格、市场价格、抵押品、赎回、储备损失和预言机放在同一张状态账上，观察“稳定”到底依赖哪些边界。",
    roles: english ? [
      { avatar: "M", label: "Minter: locks collateral and mints USD-LAB" },
      { avatar: "H", label: "Holder: trades or redeems under the rule" },
      { avatar: "R", label: "Reserve pool: holds the exit value behind supply" },
      { avatar: "O", label: "Oracle: supplies the collateral valuation input" },
    ] : [
      { avatar: "发", label: "发行者：锁定抵押品并铸造 USD-LAB" },
      { avatar: "持", label: "持有人：在市场交易或按规则赎回" },
      { avatar: "储", label: "储备池：承载每一枚稳定币背后的退出价值" },
      { avatar: "价", label: "预言机：提供协议计算抵押率的价格输入" },
    ],
    outcomes: english ? [
      "Why target, market, and oracle prices are different numbers",
      "How a minimum collateral ratio limits issuance and leaves a buffer",
      "What redemption and arbitrage incentivize during a depeg—and cannot guarantee",
      "How reserve loss, a run, and wrong prices push a system undercollateralized",
    ] : [
      "为什么目标价格、市场价格和预言机价格不是同一个数字？",
      "最低抵押率如何限制发行量并留下安全缓冲？",
      "脱锚时赎回与套利提供了什么激励，又无法保证什么？",
      "储备损失、挤兑和错误价格如何把系统推向抵押不足？",
    ],
  }} />;
}
