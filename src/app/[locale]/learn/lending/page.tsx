import type { Metadata } from "next";
import { lendingManifest as module } from "@/modules/lending/manifest";
import { CourseOverview } from "@/platform/components/CourseOverview";
import { getLocalizedModule } from "@/platform/content/localization";
import { courseMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return courseMetadata(module, locale);
}

export default async function LendingOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <CourseOverview module={getLocalizedModule(module, locale)} locale={locale} content={{
    question: english ? "When does collateral get liquidated?" : "抵押品什么时候会被清算？",
    questionDescription: english ? "Put collateral, debt, interest, oracle readings, and a liquidator on one state ledger. Follow how one price input travels through the system." : "我们会把抵押品、债务、利息、预言机和清算人放在同一张状态账上，观察风险如何从一个价格输入传到整个系统。",
    roles: english ? [
      { avatar: "B", label: "Borrower: locks TOKEN to receive credits" },
      { avatar: "P", label: "Pool: supplies liquidity and records debt" },
      { avatar: "K", label: "Keeper: repays debt when risk crosses the line" },
      { avatar: "O", label: "Oracle: supplies the risk price" },
    ] : [
      { avatar: "借", label: "借款人：锁定 TOKEN 换取积分" },
      { avatar: "池", label: "借贷池：提供流动性并收取债务" },
      { avatar: "清", label: "清算人：在风险越线时偿还债务" },
      { avatar: "价", label: "预言机：提供协议用于风控的价格" },
    ],
    outcomes: english ? [
      "Why collateral value is not the same as borrowing capacity",
      "How interest lowers health even when price is flat",
      "How liquidation price, bonus, and asset flow are calculated",
      "Why stale oracle data delays risk—and can create bad debt",
    ] : [
      "为什么抵押品价值不等于可借额度？",
      "利息如何在价格不变时降低健康度？",
      "清算价格、清算奖励和资产流向如何计算？",
      "预言机滞后为什么会把风险推迟，甚至制造坏账？",
    ],
  }} />;
}
