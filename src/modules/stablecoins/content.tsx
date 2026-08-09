import StablecoinPegLesson from "@content/zh/stablecoins/peg-and-redemption.mdx";
import StablecoinCollateralLesson from "@content/zh/stablecoins/collateral-and-minting.mdx";
import StablecoinDepegLesson from "@content/zh/stablecoins/depeg-and-arbitrage.mdx";
import StablecoinReserveLesson from "@content/zh/stablecoins/reserves-and-run-risk.mdx";
import StablecoinPegEnglishLesson from "@content/en/stablecoins/peg-and-redemption.mdx";
import StablecoinCollateralEnglishLesson from "@content/en/stablecoins/collateral-and-minting.mdx";
import StablecoinDepegEnglishLesson from "@content/en/stablecoins/depeg-and-arbitrage.mdx";
import StablecoinReserveEnglishLesson from "@content/en/stablecoins/reserves-and-run-risk.mdx";
import type { ModuleContentRegistry } from "@/platform/types/learning";

const zhContent = {
  "peg-and-redemption": StablecoinPegLesson,
  "collateral-and-minting": StablecoinCollateralLesson,
  "depeg-and-arbitrage": StablecoinDepegLesson,
  "reserves-and-run-risk": StablecoinReserveLesson,
};

const enContent = {
  "peg-and-redemption": StablecoinPegEnglishLesson,
  "collateral-and-minting": StablecoinCollateralEnglishLesson,
  "depeg-and-arbitrage": StablecoinDepegEnglishLesson,
  "reserves-and-run-risk": StablecoinReserveEnglishLesson,
};

export const stablecoinContentRegistry: ModuleContentRegistry = {
  moduleId: "stablecoins",
  locales: ["zh", "en"],
  lessonIds: Object.keys(zhContent),
  hasLesson: (locale, lessonId) => locale === "zh" ? lessonId in zhContent : locale === "en" && lessonId in enContent,
};

export function hasStablecoinLessonContent(locale: string, lessonId: string) {
  return stablecoinContentRegistry.hasLesson(locale, lessonId);
}

export function StablecoinLessonContent({ locale, lessonId }: { locale: string; lessonId: string }) {
  if (!hasStablecoinLessonContent(locale, lessonId)) return null;
  const content = locale === "en" ? enContent : zhContent;
  const Lesson = content[lessonId as keyof typeof content];
  return <Lesson />;
}
