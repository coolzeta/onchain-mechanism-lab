import QuestionLesson from "@content/zh/prediction-markets/a-question-that-can-settle.mdx";
import CollateralLesson from "@content/zh/prediction-markets/one-dollar-two-futures.mdx";
import BeliefsLesson from "@content/zh/prediction-markets/beliefs-enter-the-book.mdx";
import MatchingLesson from "@content/zh/prediction-markets/how-matching-makes-a-price.mdx";
import ProbabilityLesson from "@content/zh/prediction-markets/price-is-not-truth.mdx";
import ResolutionLesson from "@content/zh/prediction-markets/oracle-and-resolution.mdx";
import QuestionLessonEn from "@content/en/prediction-markets/a-question-that-can-settle.mdx";
import CollateralLessonEn from "@content/en/prediction-markets/one-dollar-two-futures.mdx";
import BeliefsLessonEn from "@content/en/prediction-markets/beliefs-enter-the-book.mdx";
import MatchingLessonEn from "@content/en/prediction-markets/how-matching-makes-a-price.mdx";
import ProbabilityLessonEn from "@content/en/prediction-markets/price-is-not-truth.mdx";
import ResolutionLessonEn from "@content/en/prediction-markets/oracle-and-resolution.mdx";
import type { ModuleContentRegistry } from "@/platform/types/learning";

const zhContent = {
  "a-question-that-can-settle": QuestionLesson,
  "one-dollar-two-futures": CollateralLesson,
  "beliefs-enter-the-book": BeliefsLesson,
  "how-matching-makes-a-price": MatchingLesson,
  "price-is-not-truth": ProbabilityLesson,
  "oracle-and-resolution": ResolutionLesson,
};

const enContent = {
  "a-question-that-can-settle": QuestionLessonEn,
  "one-dollar-two-futures": CollateralLessonEn,
  "beliefs-enter-the-book": BeliefsLessonEn,
  "how-matching-makes-a-price": MatchingLessonEn,
  "price-is-not-truth": ProbabilityLessonEn,
  "oracle-and-resolution": ResolutionLessonEn,
};

export const predictionMarketContentRegistry: ModuleContentRegistry = {
  moduleId: "prediction-markets",
  locales: ["zh", "en"],
  lessonIds: Object.keys(zhContent),
  hasLesson: (locale, lessonId) => locale === "zh" ? lessonId in zhContent : locale === "en" && lessonId in enContent,
};

export function hasPredictionLessonContent(locale: string, lessonId: string) {
  return predictionMarketContentRegistry.hasLesson(locale, lessonId);
}

export function PredictionLessonContent({ locale, lessonId }: { locale: string; lessonId: string }) {
  if (locale === "en") {
    switch (lessonId) {
      case "a-question-that-can-settle": return <QuestionLessonEn />;
      case "one-dollar-two-futures": return <CollateralLessonEn />;
      case "beliefs-enter-the-book": return <BeliefsLessonEn />;
      case "how-matching-makes-a-price": return <MatchingLessonEn />;
      case "price-is-not-truth": return <ProbabilityLessonEn />;
      case "oracle-and-resolution": return <ResolutionLessonEn />;
      default: return null;
    }
  }
  if (locale !== "zh") return null;
  switch (lessonId) {
    case "a-question-that-can-settle": return <QuestionLesson />;
    case "one-dollar-two-futures": return <CollateralLesson />;
    case "beliefs-enter-the-book": return <BeliefsLesson />;
    case "how-matching-makes-a-price": return <MatchingLesson />;
    case "price-is-not-truth": return <ProbabilityLesson />;
    case "oracle-and-resolution": return <ResolutionLesson />;
    default: return null;
  }
}
