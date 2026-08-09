import Link from "next/link";
import type { ModuleManifest } from "@/platform/types/learning";
import { CourseProgressPanel, CourseRoadmap } from "@/platform/progress/CourseProgressPanel";
import { getLocalizedModule } from "@/platform/content/localization";
import { CourseStructuredData } from "@/platform/components/StructuredData";

export interface CourseOverviewContent {
  question: string;
  questionDescription: string;
  roles: Array<{ avatar: string; label: string }>;
  outcomes: string[];
}

export function CourseOverview({ module, locale, content }: { module: ModuleManifest; locale: string; content: CourseOverviewContent }) {
  const moduleItem = getLocalizedModule(module, locale);
  const english = locale === "en";
  if (!module.locales.includes(locale as "zh" | "en")) {
    const fallbackLocale = module.locales[0] ?? "zh";
    return <div className="course-overview page-width"><nav className="breadcrumbs" aria-label={english ? "Breadcrumbs" : "面包屑"}><Link href={`/${locale}`}>{english ? "Mechanism map" : "机制地图"}</Link><span>/</span><span>{module.shortTitle}</span></nav><section className="course-unavailable" aria-label={english ? "Translation status" : "语言版本状态"}><span className="eyebrow">TRANSLATION IN PROGRESS</span><h1>{english ? `${module.title} is currently available in Chinese.` : `${module.title} 正在准备其他语言版本。`}</h1><p>{english ? "The mechanism is already available as an interactive course in Chinese. We keep this route visible so the curriculum map stays stable while the translation is reviewed." : "这门课程已经有完整的中文互动内容。我们保留稳定路由，等其他语言版本完成校对后再开放。"}</p><Link className="primary-button" href={`/${fallbackLocale}/learn/${module.id}`}>{english ? "Open the available course →" : "打开可用课程 →"}</Link></section></div>;
  }
  return (
    <div className="course-overview page-width">
      <CourseStructuredData module={moduleItem} locale={locale} />
      <nav className="breadcrumbs" aria-label={english ? "Breadcrumbs" : "面包屑"}><Link href={`/${locale}`}>{english ? "Mechanism map" : "机制地图"}</Link><span>/</span><span>{moduleItem.shortTitle}</span></nav>
      <header className="course-header">
        <div>
          <span className="eyebrow">{english ? (moduleItem.categoryId === "markets" ? "MARKET SYSTEMS" : "ONCHAIN SYSTEMS") : "互动课程"} · {english ? "COURSE" : "共"} {english ? String(moduleItem.lessons[0]?.number ?? 1).padStart(3, "0") : `${moduleItem.lessons.length} 章`}</span>
          <h1>{moduleItem.title}</h1>
          <p>{moduleItem.description}</p>
          <div className="course-meta"><span>{moduleItem.lessons.length} {english ? "lessons" : "个章节"}</span><span>{english ? `about ${moduleItem.estimatedMinutes} min` : `约 ${moduleItem.estimatedMinutes} 分钟`}</span><span>{english ? "beginner friendly" : "适合入门"}</span></div>
          <div className="hero-actions"><Link className="primary-button" href={`/${locale}/learn/${moduleItem.id}/${moduleItem.lessons[0].id}`}>{english ? "Start lesson one" : "开始第一章"}</Link><Link className="text-button" href={`/${locale}/labs/${moduleItem.id}`}>{english ? "Open sandbox ↗" : "直接进入沙盒 ↗"}</Link></div>
        </div>
        <CourseProgressPanel module={moduleItem} locale={locale} />
      </header>

      <section className="course-premise"><div className="premise-question"><span>{english ? "COURSE EXAMPLE" : "课程使用的例子"}</span><strong>{content.question}</strong><p>{content.questionDescription}</p></div><div className="premise-roles"><span>{english ? "PARTICIPANTS" : "例子中的参与者"}</span><ul>{content.roles.map((role) => <li key={`${role.avatar}-${role.label}`}><b>{role.avatar}</b>{role.label}</li>)}</ul></div></section>

      <section className="syllabus"><div className="section-heading"><div><span className="eyebrow">{english ? "COURSE OUTLINE" : "课程目录"}</span><h2>{english ? "One question per lesson" : "每章集中解释一个问题"}</h2></div><p>{english ? "The lessons are ordered so that each one uses concepts introduced earlier." : "章节按概念的先后关系排列，建议第一次学习时按顺序阅读。"}</p></div><CourseRoadmap module={moduleItem} locale={locale} /></section>

      <section className="course-outcomes"><span className="eyebrow">{english ? "WHAT IT COVERS" : "课程范围"}</span><h2>{english ? "Questions covered in this course" : "这门课会回答这些问题"}</h2><div>{content.outcomes.map((outcome, index) => <article key={outcome}><b>{String(index + 1).padStart(2, "0")}</b><p>{outcome}</p></article>)}</div></section>
    </div>
  );
}
