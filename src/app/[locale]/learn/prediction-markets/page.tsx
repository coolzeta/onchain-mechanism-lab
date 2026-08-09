import type { Metadata } from "next";
import { predictionMarketManifest as module } from "@/modules/prediction-markets/manifest";
import { CourseOverview } from "@/platform/components/CourseOverview";
import { getLocalizedModule } from "@/platform/content/localization";
import { courseMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return courseMetadata(module, locale);
}

export default async function PredictionMarketOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <CourseOverview module={getLocalizedModule(module, locale)} locale={locale} content={{
    question: english ? "Will humans return to the Moon before 2028?" : "“2028 年前，人类会再次踏上月球吗？”",
    questionDescription: english ? "Turn this sentence into a tradable, collateralized, and settleable market contract." : "我们会把这句话逐步变成一份可交易、可抵押、可结算的市场合同。",
    roles: [
      { avatar: "A", label: english ? "Alice: thinks it will happen" : "Alice：相信会发生" },
      { avatar: "B", label: english ? "Bob: remains skeptical" : "Bob：持怀疑态度" },
      { avatar: "C", label: english ? "Carol: looks for a fair price" : "Carol：寻找合理价格" },
      { avatar: english ? "Y" : "你", label: english ? "You: choose how much risk to take" : "决定承担多少风险" },
    ],
    outcomes: [
      english ? "Why can one YES share pay 100 credits at resolution?" : "一份 YES 为什么可以在结算时兑付 100 积分？",
      english ? "How do orders turn two different views into one price?" : "两个人观点不同，订单如何把分歧变成一个价格？",
      english ? "Why can 0.70 be read as an implied probability without being an objective probability?" : "为什么 0.70 可以被读作隐含概率，却不能直接当作客观概率？",
      english ? "If the oracle is wrong, why can a precise market still settle incorrectly?" : "如果预言机出错，再精确的市场为什么也会结算错误？",
    ],
  }} />;
}
