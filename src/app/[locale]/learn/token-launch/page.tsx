import type { Metadata } from "next";
import { tokenLaunchManifest as module } from "@/modules/token-launch/manifest";
import { CourseOverview } from "@/platform/components/CourseOverview";
import { getLocalizedModule } from "@/platform/content/localization";
import { courseMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return courseMetadata(module, locale);
}

export default async function TokenLaunchOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  return <CourseOverview module={getLocalizedModule(module, locale)} locale={locale} content={{
    question: english ? "Who has the power to change a token's value?" : "一枚代币的价值，谁有权改变它？",
    questionDescription: english ? "Split a token into supply, authority, allocation, dilution, and time. See how a balance table becomes an economic promise." : "我们会把代币拆成供应、权限、分配、稀释和时间五个维度，观察一张余额表如何变成一套经济承诺。",
    roles: english ? [
      { avatar: "M", label: "Creator: holds or gives up mint authority" },
      { avatar: "C", label: "Community: receives allocation and vesting" },
      { avatar: "T", label: "Treasury: manages liquid assets" },
      { avatar: "Y", label: "Learner: checks whether power is symmetric" },
    ] : [
      { avatar: "发", label: "创建者：拥有或放弃增发权限" },
      { avatar: "社", label: "社区：获得分配与锁仓奖励" },
      { avatar: "国", label: "国库：管理可流通资产" },
      { avatar: "你", label: "学习者：检查权力是否对称" },
    ],
    outcomes: english ? [
      "Why total, liquid, and locked supply are different states",
      "What a cap limits, and what mint authority controls",
      "Whether vesting reduces sell pressure or postpones dilution",
      "How minting, distribution, and burning change the ledger",
      "Who can change supply after authority moves to a multisig",
    ] : [
      "总供应、流通供应和锁仓供应为什么不能混为一谈？",
      "供应上限和增发权限分别约束了什么？",
      "锁仓是减少抛压，还是把未来的稀释推迟？",
      "增发、分配和销毁分别如何改变总供应？",
      "单签移交到多签后，谁才有资格改变供应？",
    ],
  }} />;
}
