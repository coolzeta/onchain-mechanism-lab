import RightsZh from "@content/zh/rwa/rights-and-structure.mdx";
import IssuanceZh from "@content/zh/rwa/issuance-and-custody.mdx";
import ValuationZh from "@content/zh/rwa/valuation-and-transfer.mdx";
import RedemptionZh from "@content/zh/rwa/redemption-and-default.mdx";
import RightsEn from "@content/en/rwa/rights-and-structure.mdx";
import IssuanceEn from "@content/en/rwa/issuance-and-custody.mdx";
import ValuationEn from "@content/en/rwa/valuation-and-transfer.mdx";
import RedemptionEn from "@content/en/rwa/redemption-and-default.mdx";
import CashflowZh from "@content/zh/rwa/cashflow-and-nav.mdx";
import DiligenceZh from "@content/zh/rwa/due-diligence-and-failure.mdx";
import CashflowEn from "@content/en/rwa/cashflow-and-nav.mdx";
import DiligenceEn from "@content/en/rwa/due-diligence-and-failure.mdx";
import type { ModuleContentRegistry } from "@/platform/types/learning";

const zhContent = {
  "rights-and-structure": RightsZh,
  "issuance-and-custody": IssuanceZh,
  "valuation-and-transfer": ValuationZh,
  "redemption-and-default": RedemptionZh,
  "cashflow-and-nav": CashflowZh,
  "due-diligence-and-failure": DiligenceZh,
};
const enContent = {
  "rights-and-structure": RightsEn,
  "issuance-and-custody": IssuanceEn,
  "valuation-and-transfer": ValuationEn,
  "redemption-and-default": RedemptionEn,
  "cashflow-and-nav": CashflowEn,
  "due-diligence-and-failure": DiligenceEn,
};

export const rwaContentRegistry: ModuleContentRegistry = {
  moduleId: "rwa", locales: ["zh", "en"], lessonIds: Object.keys(zhContent),
  hasLesson: (locale, lessonId) => locale === "zh" ? lessonId in zhContent : locale === "en" && lessonId in enContent,
};

export function hasRwaLessonContent(locale: string, lessonId: string) {
  return rwaContentRegistry.hasLesson(locale, lessonId);
}

export function RwaLessonContent({ locale, lessonId }: { locale: string; lessonId: string }) {
  if (!hasRwaLessonContent(locale, lessonId)) return null;
  const content = locale === "en" ? enContent : zhContent;
  const Lesson = content[lessonId as keyof typeof content];
  return <Lesson />;
}
