import type { Metadata } from "next";
import { oracleManifest as module } from "@/modules/oracles/manifest";
import { CourseOverview } from "@/platform/components/CourseOverview";
import { courseMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return courseMetadata(module, locale);
}

export default async function OracleOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = locale === "en" ? {
    question: "Who can prove that reality has happened?",
    questionDescription: "We break the gap between the chain and the outside world into sources, reports, challenge windows, and arbitration so every trust assumption has a state and a cost.",
    roles: [
      { avatar: "SRC", label: "Source: provide an observation from outside the chain" },
      { avatar: "REP", label: "Reporter: submit a result with a bond" },
      { avatar: "CHL", label: "Challenger: risk a bond to contest the report" },
      { avatar: "ARB", label: "Arbitrator: read evidence and decide payout" },
    ],
    outcomes: [
      "Why are the source, initial report, and final result different things?",
      "How does a challenge window leave time to correct a wrong report?",
      "How does an economic bond turn being wrong into a real loss?",
      "Why can an unchallenged wrong report still settle a market, and how should handoff be audited?",
    ],
  } : {
    question: "谁来证明现实已经发生？",
    questionDescription: "我们会把“链上无法直接读取现实”拆成数据源、报告、挑战期和仲裁，让每一次信任都有状态和成本。",
    roles: [
      { avatar: "源", label: "数据源：提供窗外的记录" },
      { avatar: "报", label: "报告者：锁定担保提交结果" },
      { avatar: "挑", label: "挑战者：用相反证据承担风险" },
      { avatar: "裁", label: "仲裁者：读取证据并决定赔付" },
    ],
    outcomes: [
      "为什么数据源、初始报告和最终结果不是同一件事？",
      "挑战窗口如何给错误报告留下可纠正的时间？",
      "经济担保如何把“说错了”变成真实损失？",
      "为什么没有人挑战时，错误仍可能进入市场结算，交接又该如何审计？",
    ],
  };
  return <CourseOverview module={module} locale={locale} content={content} />;
}
