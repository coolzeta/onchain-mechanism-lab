import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { predictionMarketManifest as module } from "@/modules/prediction-markets/manifest";
import { hasPredictionLessonContent, PredictionLessonContent } from "@/modules/prediction-markets/content";
import { LessonSidebar } from "@/platform/components/LessonSidebar";
import { LessonTaskCard } from "@/platform/components/LessonTaskCard";
import { CompleteLesson } from "@/platform/components/LessonPrimitives";
import { getLocalizedModule } from "@/platform/content/localization";
import { lessonMetadata } from "@/platform/seo";

export function generateStaticParams() {
  return module.lessons.map((lesson) => ({ lesson: lesson.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; lesson: string }> }): Promise<Metadata> {
  const { locale, lesson } = await params;
  return lessonMetadata(module, locale, lesson);
}

export default async function LessonPage({ params }: { params: Promise<{ locale: string; lesson: string }> }) {
  const { locale, lesson: lessonId } = await params;
  const moduleItem = getLocalizedModule(module, locale);
  const lesson = moduleItem.lessons.find((candidate) => candidate.id === lessonId);
  if (!lesson || !hasPredictionLessonContent(locale, lessonId)) notFound();
  const next = moduleItem.lessons[lesson.number];
  const nextHref = next ? `/${locale}/learn/${moduleItem.id}/${next.id}` : `/${locale}/labs/prediction-markets`;
  const english = locale === "en";

  return (
    <div className="lesson-layout page-width-wide">
      <LessonSidebar module={moduleItem} currentLesson={lesson.id} locale={locale} />
      <article className="lesson-article">
        <header className="lesson-header">
          <div><span>{english ? "Lesson" : "第"} {String(lesson.number).padStart(2, "0")}{english ? "" : " 章"}</span><span>{lesson.estimatedMinutes} {english ? "min" : "分钟"}</span></div>
          <small>{lesson.eyebrow}</small>
          <h1>{lesson.title}</h1>
          <p>{lesson.summary}</p>
        </header>
        <section className="lesson-objectives" aria-label={english ? "Learning objectives" : "本章学习目标"}>
          <div><span>{english ? "OBJECTIVES" : "本章目标"}</span><strong>{english ? "After this lesson, you should be able to:" : "学完后，你应该能："}</strong></div>
          <ul>{lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
        </section>
        <LessonTaskCard task={lesson.task} taskKey={`${moduleItem.id}:${lesson.id}:${lesson.task.id}`} />
        <div className="lesson-content"><PredictionLessonContent locale={locale} lessonId={lessonId} /></div>
        <CompleteLesson lessonKey={`${module.id}:${lesson.id}`} nextHref={nextHref} nextTitle={next?.title} />
      </article>
    </div>
  );
}
