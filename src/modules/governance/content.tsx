import ProposalLesson from "@content/zh/governance/proposal-as-state.mdx";
import VotingLesson from "@content/zh/governance/voting-power-and-delegation.mdx";
import TimelockLesson from "@content/zh/governance/timelock-and-execution.mdx";
import TreasuryLesson from "@content/zh/governance/treasury-and-emergency.mdx";
import ProposalEnglishLesson from "@content/en/governance/proposal-as-state.mdx";
import VotingEnglishLesson from "@content/en/governance/voting-power-and-delegation.mdx";
import TimelockEnglishLesson from "@content/en/governance/timelock-and-execution.mdx";
import TreasuryEnglishLesson from "@content/en/governance/treasury-and-emergency.mdx";
import type { ModuleContentRegistry } from "@/platform/types/learning";

const zhContent = {
  "proposal-as-state": ProposalLesson,
  "voting-power-and-delegation": VotingLesson,
  "timelock-and-execution": TimelockLesson,
  "treasury-and-emergency": TreasuryLesson,
};

const enContent = {
  "proposal-as-state": ProposalEnglishLesson,
  "voting-power-and-delegation": VotingEnglishLesson,
  "timelock-and-execution": TimelockEnglishLesson,
  "treasury-and-emergency": TreasuryEnglishLesson,
};

export const governanceContentRegistry: ModuleContentRegistry = {
  moduleId: "governance",
  locales: ["zh", "en"],
  lessonIds: Object.keys(zhContent),
  hasLesson: (locale, lessonId) => locale === "zh" ? lessonId in zhContent : locale === "en" && lessonId in enContent,
};

export function hasGovernanceLessonContent(locale: string, lessonId: string) {
  return governanceContentRegistry.hasLesson(locale, lessonId);
}

export function GovernanceLessonContent({ locale, lessonId }: { locale: string; lessonId: string }) {
  if (!hasGovernanceLessonContent(locale, lessonId)) return null;
  const content = locale === "en" ? enContent : zhContent;
  const Lesson = content[lessonId as keyof typeof content];
  return <Lesson />;
}
