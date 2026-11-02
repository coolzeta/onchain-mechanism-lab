import type { Metadata } from "next";
import { rwaManifest as module } from "@/modules/rwa/manifest";
import { CourseOverview } from "@/platform/components/CourseOverview";
import { courseMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return courseMetadata(module, locale);
}

export default async function RwaOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <CourseOverview module={module} locale={locale} content={{
    question: english ? "What does a tokenized asset actually represent?" : "一枚资产代币到底代表什么？",
    questionDescription: english ? "Follow a hypothetical tokenized asset from its legal structure and custody through valuation, transfer and redemption." : "从一个假设的资产代币案例出发，追踪法律结构、托管、估值、转让和赎回之间的边界。",
    roles: english ? [
      { avatar: "I", label: "Issuer: sets the terms and issues tokens" },
      { avatar: "C", label: "Custodian: holds or administers underlying assets" },
      { avatar: "H", label: "Holder: has the rights specified by the documents" },
      { avatar: "V", label: "Verifier: reviews reports and reconciliation" },
    ] : [
      { avatar: "发", label: "发行方：制定条款并发行代币" },
      { avatar: "托", label: "托管方：持有或管理底层资产" },
      { avatar: "持", label: "持有人：享有文件中规定的权利" },
      { avatar: "核", label: "核验方：检查报告与对账结果" },
    ],
    outcomes: english ? ["Distinguish an asset, a legal claim, and a token", "Trace issuance, custody and reconciliation", "Examine stale valuations and transfer restrictions", "Follow redemption, liquidity and default boundaries", "Calculate a simplified net asset value after fees and liabilities", "Build a due diligence checklist for rights, evidence and recovery"] : ["区分底层资产、法律权利和代币", "追踪发行、托管与资产对账", "理解估值滞后和转让限制", "识别赎回、流动性与违约边界", "计算扣除费用与负债后的简化净值", "用尽调清单检查权利、证据与回收路径"],
  }} />;
}
