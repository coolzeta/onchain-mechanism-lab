import type { Metadata } from "next";
import { mevManifest as module } from "@/modules/mev/manifest";
import { CourseOverview } from "@/platform/components/CourseOverview";
import { getLocalizedModule } from "@/platform/content/localization";
import { courseMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return courseMetadata(module, locale);
}

export default async function MEVOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <CourseOverview module={getLocalizedModule(module, locale)} locale={locale} content={{
    question: english ? "Who gets to choose the order?" : "谁决定交易的顺序？",
    questionDescription: english ? "Put one user swap through a public mempool, a builder, a proposer, and an AMM. Compare visibility, ordering, protection, and value extraction." : "把一笔用户交换放进公开交易池、构建者、提议者和 AMM，比较可见性、排序、保护线和价值提取。",
    roles: english ? [
      { avatar: "U", label: "User: signs a swap with a minimum-output boundary" },
      { avatar: "S", label: "Searcher: scans visible intent for an executable sequence" },
      { avatar: "B", label: "Builder: chooses a block order and bundle" },
      { avatar: "P", label: "Proposer: publishes the block and receives ordering payment" },
    ] : [
      { avatar: "用", label: "用户：签署带最小得到数量的交换" },
      { avatar: "搜", label: "搜索者：扫描可见意图，寻找可执行排序" },
      { avatar: "构", label: "构建者：选择区块顺序和交易组合" },
      { avatar: "提", label: "提议者：发布区块并接收排序支付" },
    ],
    outcomes: english ? [
      "Why pending intent is not shared executed state",
      "How a sandwich changes output and how slippage guards create a revert boundary",
      "Why back-run arbitrage depends on the user's earlier state change",
      "What private order flow removes—and which trust boundaries remain",
    ] : [
      "为什么 pending 意图还不是共享执行状态？",
      "夹子交易如何改变输出，滑点保护如何形成回滚边界？",
      "为什么回跑套利依赖用户先改变状态？",
      "私有订单流减少了什么，哪些信任边界仍然存在？",
    ],
  }} />;
}
