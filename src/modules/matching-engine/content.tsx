import MatchingEngineLesson from "@content/zh/matching-engine/priority-and-partial-fills.mdx";
import MarketOrdersLesson from "@content/zh/matching-engine/market-orders-and-depth.mdx";
import SpreadLiquidityLesson from "@content/zh/matching-engine/spread-and-liquidity.mdx";
import RiskControlsLesson from "@content/zh/matching-engine/risk-controls-and-replacement.mdx";
import MatchingEngineEnglishLesson from "@content/en/matching-engine/priority-and-partial-fills.mdx";
import MarketOrdersEnglishLesson from "@content/en/matching-engine/market-orders-and-depth.mdx";
import SpreadLiquidityEnglishLesson from "@content/en/matching-engine/spread-and-liquidity.mdx";
import RiskControlsEnglishLesson from "@content/en/matching-engine/risk-controls-and-replacement.mdx";
import type { ModuleContentRegistry } from "@/platform/types/learning";

const zhContent = {
  "priority-and-partial-fills": MatchingEngineLesson,
  "market-orders-and-depth": MarketOrdersLesson,
  "spread-and-liquidity": SpreadLiquidityLesson,
  "risk-controls-and-replacement": RiskControlsLesson,
};

const enContent = {
  "priority-and-partial-fills": MatchingEngineEnglishLesson,
  "market-orders-and-depth": MarketOrdersEnglishLesson,
  "spread-and-liquidity": SpreadLiquidityEnglishLesson,
  "risk-controls-and-replacement": RiskControlsEnglishLesson,
};

export const matchingEngineContentRegistry: ModuleContentRegistry = {
  moduleId: "matching-engine",
  locales: ["zh", "en"],
  lessonIds: Object.keys(zhContent),
  hasLesson: (locale, lessonId) => locale === "zh" ? lessonId in zhContent : locale === "en" && lessonId in enContent,
};

export function hasMatchingEngineLessonContent(locale: string, lessonId: string) {
  return matchingEngineContentRegistry.hasLesson(locale, lessonId);
}

export function MatchingEngineLessonContent({ locale, lessonId }: { locale: string; lessonId: string }) {
  if (!hasMatchingEngineLessonContent(locale, lessonId)) return null;
  const content = locale === "en" ? enContent : zhContent;
  const Lesson = content[lessonId as keyof typeof content];
  return <Lesson />;
}
