import TokenLaunchLesson from "@content/zh/token-launch/supply-and-authority.mdx";
import VestingLesson from "@content/zh/token-launch/allocation-and-vesting.mdx";
import DistributionLesson from "@content/zh/token-launch/dilution-and-distribution.mdx";
import GovernanceLesson from "@content/zh/token-launch/permissions-and-governance.mdx";
import TokenLaunchEnglishLesson from "@content/en/token-launch/supply-and-authority.mdx";
import VestingEnglishLesson from "@content/en/token-launch/allocation-and-vesting.mdx";
import DistributionEnglishLesson from "@content/en/token-launch/dilution-and-distribution.mdx";
import GovernanceEnglishLesson from "@content/en/token-launch/permissions-and-governance.mdx";
import type { ModuleContentRegistry } from "@/platform/types/learning";

const zhContent = {
  "supply-and-authority": TokenLaunchLesson,
  "allocation-and-vesting": VestingLesson,
  "dilution-and-distribution": DistributionLesson,
  "permissions-and-governance": GovernanceLesson,
};

const enContent = {
  "supply-and-authority": TokenLaunchEnglishLesson,
  "allocation-and-vesting": VestingEnglishLesson,
  "dilution-and-distribution": DistributionEnglishLesson,
  "permissions-and-governance": GovernanceEnglishLesson,
};

export const tokenLaunchContentRegistry: ModuleContentRegistry = {
  moduleId: "token-launch",
  locales: ["zh", "en"],
  lessonIds: Object.keys(zhContent),
  hasLesson: (locale, lessonId) => locale === "zh" ? lessonId in zhContent : locale === "en" && lessonId in enContent,
};

export function hasTokenLaunchLessonContent(locale: string, lessonId: string) {
  return tokenLaunchContentRegistry.hasLesson(locale, lessonId);
}

export function TokenLaunchLessonContent({ locale, lessonId }: { locale: string; lessonId: string }) {
  if (!hasTokenLaunchLessonContent(locale, lessonId)) return null;
  const content = locale === "en" ? enContent : zhContent;
  const Lesson = content[lessonId as keyof typeof content];
  return <Lesson />;
}
