import type { Metadata } from "next";
import { governanceManifest as module } from "@/modules/governance/manifest";
import { CourseOverview } from "@/platform/components/CourseOverview";
import { getLocalizedModule } from "@/platform/content/localization";
import { courseMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return courseMetadata(module, locale);
}

export default async function GovernanceOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <CourseOverview module={getLocalizedModule(module, locale)} locale={locale} content={{
    question: english ? "Who gets to change the protocol?" : "谁有权改变协议？",
    questionDescription: english ? "Follow one proposal through snapshots, quorum, delegation, a timelock, a treasury ledger, and an emergency cancel path." : "跟随一项提案穿过投票快照、法定人数、委托、时间锁、金库账本和紧急取消路径。",
    roles: english ? [
      { avatar: "P", label: "Proposer: turns an intention into an exact action" },
      { avatar: "V", label: "Voters: bring snapshot power and participation" },
      { avatar: "T", label: "Timelock: exposes the operation before execution" },
      { avatar: "G", label: "Guardian: can stop an unsafe transfer before it runs" },
    ] : [
      { avatar: "提", label: "提案者：把愿望写成精确动作" },
      { avatar: "票", label: "投票者：带来快照投票权和参与" },
      { avatar: "锁", label: "时间锁：执行前公开操作" },
      { avatar: "守", label: "守护者：在执行前阻止不安全拨款" },
    ],
    outcomes: english ? [
      "Why a proposal is a state transition, not a headline",
      "How delegation and snapshots prevent the same power being counted twice",
      "Why quorum, majority, and timelock are separate boundaries",
      "How treasury conservation and emergency cancellation change risk",
    ] : [
      "为什么提案是一条状态转换，而不是一条公告？",
      "委托与快照如何阻止同一份投票权被重复计算？",
      "法定人数、多数票和时间锁为什么是三条边界？",
      "金库守恒与紧急取消如何改变风险？",
    ],
  }} />;
}
