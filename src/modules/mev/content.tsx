import MempoolLesson from "@content/zh/mev/mempool-and-ordering.mdx";
import SandwichLesson from "@content/zh/mev/sandwich-and-slippage.mdx";
import BackrunLesson from "@content/zh/mev/backrun-and-arbitrage.mdx";
import PrivateFlowLesson from "@content/zh/mev/builders-and-private-orderflow.mdx";
import MempoolEnglishLesson from "@content/en/mev/mempool-and-ordering.mdx";
import SandwichEnglishLesson from "@content/en/mev/sandwich-and-slippage.mdx";
import BackrunEnglishLesson from "@content/en/mev/backrun-and-arbitrage.mdx";
import PrivateFlowEnglishLesson from "@content/en/mev/builders-and-private-orderflow.mdx";
import type { ModuleContentRegistry } from "@/platform/types/learning";

const zhContent = {
  "mempool-and-ordering": MempoolLesson,
  "sandwich-and-slippage": SandwichLesson,
  "backrun-and-arbitrage": BackrunLesson,
  "builders-and-private-orderflow": PrivateFlowLesson,
};

const enContent = {
  "mempool-and-ordering": MempoolEnglishLesson,
  "sandwich-and-slippage": SandwichEnglishLesson,
  "backrun-and-arbitrage": BackrunEnglishLesson,
  "builders-and-private-orderflow": PrivateFlowEnglishLesson,
};

export const mevContentRegistry: ModuleContentRegistry = {
  moduleId: "mev",
  locales: ["zh", "en"],
  lessonIds: Object.keys(zhContent),
  hasLesson: (locale, lessonId) => locale === "zh" ? lessonId in zhContent : locale === "en" && lessonId in enContent,
};

export function hasMEVLessonContent(locale: string, lessonId: string) {
  return mevContentRegistry.hasLesson(locale, lessonId);
}

export function MEVLessonContent({ locale, lessonId }: { locale: string; lessonId: string }) {
  if (!hasMEVLessonContent(locale, lessonId)) return null;
  const content = locale === "en" ? enContent : zhContent;
  const Lesson = content[lessonId as keyof typeof content];
  return <Lesson />;
}
