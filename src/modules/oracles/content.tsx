import OracleLesson from "@content/zh/oracles/report-challenge-finalize.mdx";
import OracleSourceLesson from "@content/zh/oracles/source-quality-and-reporting.mdx";
import OracleChallengeLesson from "@content/zh/oracles/challenge-windows-and-bonds.mdx";
import OracleSettlementLesson from "@content/zh/oracles/settlement-handoff-and-failure.mdx";
import OracleLessonEn from "@content/en/oracles/report-challenge-finalize.mdx";
import OracleSourceLessonEn from "@content/en/oracles/source-quality-and-reporting.mdx";
import OracleChallengeLessonEn from "@content/en/oracles/challenge-windows-and-bonds.mdx";
import OracleSettlementLessonEn from "@content/en/oracles/settlement-handoff-and-failure.mdx";
import type { ModuleContentRegistry } from "@/platform/types/learning";

const content = {
  zh: {
    "report-challenge-finalize": OracleLesson,
    "source-quality-and-reporting": OracleSourceLesson,
    "challenge-windows-and-bonds": OracleChallengeLesson,
    "settlement-handoff-and-failure": OracleSettlementLesson,
  },
  en: {
    "report-challenge-finalize": OracleLessonEn,
    "source-quality-and-reporting": OracleSourceLessonEn,
    "challenge-windows-and-bonds": OracleChallengeLessonEn,
    "settlement-handoff-and-failure": OracleSettlementLessonEn,
  },
} as const;

export const oracleContentRegistry: ModuleContentRegistry = {
  moduleId: "oracles",
  locales: ["zh", "en"],
  lessonIds: Object.keys(content.zh),
  hasLesson: (locale, lessonId) => locale in content && lessonId in content[locale as keyof typeof content],
};

export function hasOracleLessonContent(locale: string, lessonId: string) {
  return oracleContentRegistry.hasLesson(locale, lessonId);
}

export function OracleLessonContent({ locale, lessonId }: { locale: string; lessonId: string }) {
  if (!hasOracleLessonContent(locale, lessonId)) return null;
  const Lesson = content[locale as keyof typeof content][lessonId as keyof (typeof content)["zh"]];
  return <Lesson />;
}
