import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, modules } from "@/platform/content/registry";
import { getLocalizedModule } from "@/platform/content/localization";
import { createLocalizedMetadata } from "@/platform/seo";

export function generateStaticParams() {
  return modules.map((module) => ({ module: module.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; module: string }> }): Promise<Metadata> {
  const { locale, module: moduleId } = await params;
  const moduleItem = modules.find((candidate) => candidate.id === moduleId);
  const localized = moduleItem ? getLocalizedModule(moduleItem, locale) : undefined;
  return createLocalizedMetadata({
    locale,
    path: `modules/${moduleId}`,
    canonicalPath: `learn/${moduleId}`,
    title: localized?.title ?? (locale === "en" ? "Module preview" : "模块预览"),
    description: localized?.description,
    noIndex: true,
  });
}

export default async function ModulePreviewPage({ params }: { params: Promise<{ locale: string; module: string }> }) {
  const { locale, module: moduleId } = await params;
  const moduleItem = modules.find((candidate) => candidate.id === moduleId);
  if (!moduleItem) notFound();
  const category = categories.find((candidate) => candidate.id === moduleItem.categoryId);

  if (moduleItem.status === "available") {
    return <div className="module-preview page-width"><nav className="breadcrumbs" aria-label="面包屑"><Link href={`/${locale}`}>机制地图</Link><span>/</span><span>{moduleItem.shortTitle}</span></nav><header className="module-preview__header"><div><span className="eyebrow">{category?.title ?? "KNOWLEDGE MODULE"} · OPEN</span><h1>{moduleItem.title}</h1><p>{moduleItem.description}</p></div><div className="module-preview__badge"><span>状态</span><strong>已开放</strong><small>进入完整课程与自由实验室</small></div></header><section className="module-preview__why"><div><span className="eyebrow">OPEN MODULE</span><h2>这条机制路径已经可以开始。</h2></div><p>{moduleItem.summary} 进入课程会沿着叙事、状态变化、理解检查和边界实验逐步推进。</p></section><div className="hero-actions"><Link className="primary-button" href={`/${locale}/learn/${moduleItem.id}`}>进入完整课程 →</Link><Link className="text-button" href={`/${locale}/labs/${moduleItem.id}`}>打开自由实验室 ↗</Link></div></div>;
  }

  return (
    <div className="module-preview page-width">
      <nav className="breadcrumbs" aria-label="面包屑"><Link href={`/${locale}`}>机制地图</Link><span>/</span><span>{moduleItem.shortTitle}</span></nav>
      <header className="module-preview__header">
        <div><span className="eyebrow">{category?.title ?? "KNOWLEDGE MODULE"} · ROADMAP</span><h1>{moduleItem.title}</h1><p>{moduleItem.description}</p></div>
        <div className="module-preview__badge"><span>状态</span><strong>正在策划</strong><small>首发课程完成后开放</small></div>
      </header>

      <section className="module-preview__why">
        <div><span className="eyebrow">WHY THIS MATTERS</span><h2>先理解它解决的系统问题，再决定要不要写代码。</h2></div>
        <p>{moduleItem.summary} 这个模块会沿用实验室的共同方法：先观察状态变化，再拆出规则，最后用边界场景检查系统为什么会失效。</p>
      </section>

      <section className="module-preview__path">
        <div className="section-heading"><div><span className="eyebrow">PLANNED PATH</span><h2>未来会从这些问题展开</h2></div><p>每个规划中的章节都已经先写进统一内容协议，开放时只需接入正文与模拟器。</p></div>
        <ol>{moduleItem.lessons.map((lesson) => <li key={lesson.id}><span>{String(lesson.number).padStart(2, "0")}</span><div><small>{lesson.eyebrow}</small><h3>{lesson.title}</h3><p>{lesson.summary}</p><div>{lesson.concepts.map((concept) => <em key={concept}>{concept}</em>)}</div></div><strong>{lesson.estimatedMinutes} MIN</strong></li>)}</ol>
      </section>

      <section className="module-preview__prereq"><div><span className="eyebrow">DEPENDENCIES</span><h2>学习前需要什么？</h2></div><div>{moduleItem.prerequisites.length ? <ul>{moduleItem.prerequisites.map((prerequisite) => <li key={prerequisite}>{modules.find((item) => item.id === prerequisite)?.shortTitle ?? prerequisite}</li>)}</ul> : <p>不需要前置课程。我们会从一个普通互联网用户熟悉的问题开始。</p>}<Link className="text-button" href={`/${locale}`}>返回机制地图 →</Link></div></section>
    </div>
  );
}
