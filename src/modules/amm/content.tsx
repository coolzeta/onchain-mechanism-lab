import AMMLesson from "@content/zh/amm/pool-as-counterparty.mdx";
import AMMSlippageLesson from "@content/zh/amm/price-impact-and-slippage.mdx";
import AMMLPLesson from "@content/zh/amm/lp-inventory-and-fees.mdx";
import AMMArbitrageLesson from "@content/zh/amm/arbitrage-and-impermanent-loss.mdx";
import AMMEnglishLesson from "@content/en/amm/pool-as-counterparty.mdx";
import AMMSlippageEnglishLesson from "@content/en/amm/price-impact-and-slippage.mdx";
import AMMLPEnglishLesson from "@content/en/amm/lp-inventory-and-fees.mdx";
import AMMArbitrageEnglishLesson from "@content/en/amm/arbitrage-and-impermanent-loss.mdx";
import type { ModuleContentRegistry } from "@/platform/types/learning";

const zhContent = {
  "pool-as-counterparty": AMMLesson,
  "price-impact-and-slippage": AMMSlippageLesson,
  "lp-inventory-and-fees": AMMLPLesson,
  "arbitrage-and-impermanent-loss": AMMArbitrageLesson,
};

const enContent = {
  "pool-as-counterparty": AMMEnglishLesson,
  "price-impact-and-slippage": AMMSlippageEnglishLesson,
  "lp-inventory-and-fees": AMMLPEnglishLesson,
  "arbitrage-and-impermanent-loss": AMMArbitrageEnglishLesson,
};

export const ammContentRegistry: ModuleContentRegistry = {
  moduleId: "amm",
  locales: ["zh", "en"],
  lessonIds: Object.keys(zhContent),
  hasLesson: (locale, lessonId) => locale === "zh" ? lessonId in zhContent : locale === "en" && lessonId in enContent,
};

export function hasAMMLessonContent(locale: string, lessonId: string) {
  return ammContentRegistry.hasLesson(locale, lessonId);
}

export function AMMLessonContent({ locale, lessonId }: { locale: string; lessonId: string }) {
  if (!hasAMMLessonContent(locale, lessonId)) return null;
  const content = locale === "en" ? enContent : zhContent;
  const Lesson = content[lessonId as keyof typeof content];
  return <Lesson />;
}
