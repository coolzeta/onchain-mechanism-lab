import type { Metadata } from "next";
import { matchingEngineManifest as module } from "@/modules/matching-engine/manifest";
import { CourseOverview } from "@/platform/components/CourseOverview";
import { getLocalizedModule } from "@/platform/content/localization";
import { courseMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return courseMetadata(module, locale);
}

export default async function MatchingEngineOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <CourseOverview module={getLocalizedModule(module, locale)} locale={locale} content={{
    question: english ? "Who should fill first in a single millisecond?" : "一毫秒里，谁应该先成交？",
    questionDescription: english ? "Treat an order book as a deterministic queue and inspect price, time, depth, remainder, and frozen assets." : "我们把一个订单簿当成确定性队列，逐步检查价格、时间、深度、剩余数量和资产冻结。",
    roles: english ? [
      { avatar: "A", label: "Maker A: enters first and supplies liquidity" },
      { avatar: "B", label: "Maker B: queues at the same price" },
      { avatar: "You", label: "Trader: crosses the spread" },
      { avatar: "ME", label: "Engine: executes explicit rules" },
    ] : [
      { avatar: "A", label: "Maker A：先挂单，提供流动性" },
      { avatar: "B", label: "Maker B：在同价位排队" },
      { avatar: "你", label: "交易者：用新订单穿过价差" },
      { avatar: "引", label: "撮合引擎：只执行明确规则" },
    ],
    outcomes: english ? [
      "Why do best bid and best ask determine the next match?",
      "Why does the earlier order fill first at the same price?",
      "Why can a large order fill partly while the remainder queues?",
      "How does a market order sweep levels, and why does its average worsen?",
      "How do repricing, self-trade prevention, and freezes protect the book?",
    ] : [
      "为什么最高买价和最低卖价决定下一次匹配？",
      "同一价格下，为什么更早进入的订单先成交？",
      "为什么一笔大单可以成交一部分、剩余部分继续排队？",
      "市价单如何扫过多个档位，平均执行价为什么会变差？",
      "改价、自成交保护和冻结资产如何共同守住订单簿边界？",
    ],
  }} />;
}
