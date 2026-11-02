import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { rwaManifest as module } from "@/modules/rwa/manifest";
import { hasRwaLessonContent, RwaLessonContent } from "@/modules/rwa/content";
import { getLocalizedModule } from "@/platform/content/localization";
import { lessonMetadata } from "@/platform/seo";
import { LessonSidebar } from "@/platform/components/LessonSidebar";
import { LessonTaskCard } from "@/platform/components/LessonTaskCard";
import { CompleteLesson } from "@/platform/components/LessonPrimitives";

export function generateStaticParams() {
  return module.lessons.map((lesson) => ({ lesson: lesson.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; lesson: string }> }): Promise<Metadata> {
  const { locale, lesson } = await params;
  return lessonMetadata(module, locale, lesson);
}

export default async function RwaLessonPage({ params }: { params: Promise<{ locale: string; lesson: string }> }) {
  const { locale, lesson: lessonId } = await params;
  const localizedModule = getLocalizedModule(module, locale);
  const lesson = localizedModule.lessons.find((candidate) => candidate.id === lessonId);
  if (!lesson || !hasRwaLessonContent(locale, lessonId)) notFound();
  const next = localizedModule.lessons[lesson.number];
  const nextHref = next ? `/${locale}/learn/${module.id}/${next.id}` : `/${locale}/labs/${module.id}`;
  const english = locale === "en";

  return <div className="lesson-layout page-width-wide"><LessonSidebar module={localizedModule} currentLesson={lesson.id} locale={locale} /><article className="lesson-article"><header className="lesson-header"><div><span>{english ? "Lesson" : "第"} {String(lesson.number).padStart(2, "0")}{english ? "" : " 章"}</span><span>{lesson.estimatedMinutes} {english ? "min" : "分钟"}</span></div><small>{lesson.eyebrow}</small><h1>{lesson.title}</h1><p>{lesson.summary}</p></header><section className="lesson-objectives" aria-label={english ? "Lesson objectives" : "本章学习目标"}><div><span>{english ? "Objectives" : "本章目标"}</span><strong>{english ? "After this lesson, you should be able to:" : "学完后，你应该能："}</strong></div><ul>{lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></section><LessonTaskCard task={lesson.task} taskKey={`${module.id}:${lesson.id}:${lesson.task.id}`} /><div className="lesson-content"><RwaLessonContent locale={locale} lessonId={lessonId} /></div><CompleteLesson lessonKey={`${module.id}:${lesson.id}`} nextHref={nextHref} nextTitle={next?.title} /></article></div>;
}
