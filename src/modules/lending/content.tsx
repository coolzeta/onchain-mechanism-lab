import LendingCollateralLesson from "@content/zh/lending/collateral-and-borrowing.mdx";
import LendingHealthLesson from "@content/zh/lending/interest-and-health.mdx";
import LendingLiquidationLesson from "@content/zh/lending/price-shock-and-liquidation.mdx";
import LendingOracleLesson from "@content/zh/lending/oracle-and-bad-debt.mdx";
import LendingCollateralEnglishLesson from "@content/en/lending/collateral-and-borrowing.mdx";
import LendingHealthEnglishLesson from "@content/en/lending/interest-and-health.mdx";
import LendingLiquidationEnglishLesson from "@content/en/lending/price-shock-and-liquidation.mdx";
import LendingOracleEnglishLesson from "@content/en/lending/oracle-and-bad-debt.mdx";
import type { ModuleContentRegistry } from "@/platform/types/learning";

const zhContent = {
  "collateral-and-borrowing": LendingCollateralLesson,
  "interest-and-health": LendingHealthLesson,
  "price-shock-and-liquidation": LendingLiquidationLesson,
  "oracle-and-bad-debt": LendingOracleLesson,
};

const enContent = {
  "collateral-and-borrowing": LendingCollateralEnglishLesson,
  "interest-and-health": LendingHealthEnglishLesson,
  "price-shock-and-liquidation": LendingLiquidationEnglishLesson,
  "oracle-and-bad-debt": LendingOracleEnglishLesson,
};

export const lendingContentRegistry: ModuleContentRegistry = {
  moduleId: "lending",
  locales: ["zh", "en"],
  lessonIds: Object.keys(zhContent),
  hasLesson: (locale, lessonId) => locale === "zh" ? lessonId in zhContent : locale === "en" && lessonId in enContent,
};

export function hasLendingLessonContent(locale: string, lessonId: string) {
  return lendingContentRegistry.hasLesson(locale, lessonId);
}

export function LendingLessonContent({ locale, lessonId }: { locale: string; lessonId: string }) {
  if (!hasLendingLessonContent(locale, lessonId)) return null;
  const content = locale === "en" ? enContent : zhContent;
  const Lesson = content[lessonId as keyof typeof content];
  return <Lesson />;
}
