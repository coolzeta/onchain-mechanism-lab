import LedgerLesson from "@content/zh/ledger/transaction-and-state.mdx";
import LedgerPoolLesson from "@content/zh/ledger/transaction-pool-and-replacement.mdx";
import LedgerReplayLesson from "@content/zh/ledger/block-order-and-state-root.mdx";
import LedgerFinalityLesson from "@content/zh/ledger/finality-and-confirmations.mdx";
import LedgerLessonEn from "@content/en/ledger/transaction-and-state.mdx";
import LedgerPoolLessonEn from "@content/en/ledger/transaction-pool-and-replacement.mdx";
import LedgerReplayLessonEn from "@content/en/ledger/block-order-and-state-root.mdx";
import LedgerFinalityLessonEn from "@content/en/ledger/finality-and-confirmations.mdx";
import type { ModuleContentRegistry } from "@/platform/types/learning";

const content = {
  zh: {
    "transaction-and-state": LedgerLesson,
    "transaction-pool-and-replacement": LedgerPoolLesson,
    "block-order-and-state-root": LedgerReplayLesson,
    "finality-and-confirmations": LedgerFinalityLesson,
  },
  en: {
    "transaction-and-state": LedgerLessonEn,
    "transaction-pool-and-replacement": LedgerPoolLessonEn,
    "block-order-and-state-root": LedgerReplayLessonEn,
    "finality-and-confirmations": LedgerFinalityLessonEn,
  },
} as const;

export const ledgerContentRegistry: ModuleContentRegistry = {
  moduleId: "ledger",
  locales: ["zh", "en"],
  lessonIds: Object.keys(content.zh),
  hasLesson: (locale, lessonId) => locale in content && lessonId in content[locale as keyof typeof content],
};

export function hasLedgerLessonContent(locale: string, lessonId: string) {
  return ledgerContentRegistry.hasLesson(locale, lessonId);
}

export function LedgerLessonContent({ locale, lessonId }: { locale: string; lessonId: string }) {
  if (!hasLedgerLessonContent(locale, lessonId)) return null;
  const Lesson = content[locale as keyof typeof content][lessonId as keyof (typeof content)["zh"]];
  return <Lesson />;
}
