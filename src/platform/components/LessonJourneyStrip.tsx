import { getLocalizedModule } from "@/platform/content/localization";
import { getModule } from "@/platform/content/registry";

export function LessonJourneyStrip({ moduleId, lessonId, locale }: { moduleId: string; lessonId: string; locale: string }) {
  const manifest = getModule(moduleId);
  if (!manifest) return null;
  const moduleItem = getLocalizedModule(manifest, locale);
  const index = moduleItem.lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return null;
  const lesson = moduleItem.lessons[index];
  const previous = moduleItem.lessons[index - 1];
  const next = moduleItem.lessons[index + 1];
  const english = locale === "en";

  return <section className="lesson-journey-strip" aria-label={english ? "Course position" : "章节位置"}>
    <header><span>{english ? "COURSE POSITION" : "章节位置"}</span><strong>{english ? `Step ${index + 1} of ${moduleItem.lessons.length}` : `第 ${index + 1} / ${moduleItem.lessons.length} 章`}</strong></header>
    <ol>
      <li><small>{english ? "PREVIOUS" : "上一章"}</small><strong>{previous?.title ?? (english ? "Course introduction" : "课程开始")}</strong></li>
      <li className="is-current"><small>{english ? "CURRENT" : "本章"}</small><strong>{lesson.title}</strong><p>{lesson.summary}</p></li>
      <li><small>{english ? "NEXT" : "下一章"}</small><strong>{next?.title ?? (english ? "Free sandbox" : "自由实验室")}</strong></li>
    </ol>
  </section>;
}
