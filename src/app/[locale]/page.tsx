import { ModuleCard } from "@/platform/components/ModuleCard";
import { LearningJourney } from "@/platform/components/LearningJourney";
import { categories, modules } from "@/platform/content/registry";
import { getLocalizedModule, isModuleAvailableForLocale } from "@/platform/content/localization";
import type { Metadata } from "next";
import { createLocalizedMetadata } from "@/platform/seo";
import { CourseCatalogStructuredData, WebsiteStructuredData } from "@/platform/components/StructuredData";
import { DependencyGraph } from "@/platform/content/DependencyGraph";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return createLocalizedMetadata({ locale });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  const availableModules = modules.filter((module) => isModuleAvailableForLocale(module, locale)).map((module) => getLocalizedModule(module, locale));
  const categoryTitles = english ? { foundations: "Chain foundations", assets: "Asset lifecycle", markets: "Market mechanisms", security: "Truth & risk" } : null;
  return (
    <>
      <WebsiteStructuredData locale={locale} />
      <CourseCatalogStructuredData modules={availableModules} locale={locale} />
      <section className="home-hero page-width">
        <div className="home-hero__copy">
          <span className="eyebrow">{english ? "INTERACTIVE COURSES" : "互动课程"}</span>
          <h1>{english ? <>See how onchain systems<br /><em>actually work.</em></> : <>看懂链上系统<br /><em>是怎么运转的。</em></>}</h1>
          <p>{english ? "Each course starts with a concrete question and a small simulation. Change the inputs, compare the results, and then read the rule behind them." : "每门课从一个具体问题开始，并配有可操作的模拟器。你可以先调整参数、观察结果，再了解背后的规则。"}</p>
          <LearningJourney locale={locale} compact />
        </div>
        <div className="hero-instrument" aria-label="预测市场价格示意">
          <div className="instrument-label"><span>{english ? "LAB 001" : "实验 001"}</span><span>{english ? "MARKET MECHANISM" : "市场机制"}</span></div>
          <p>{english ? "Will humans return to the Moon before 2028?" : "“2028 年前，人类会再次踏上月球吗？”"}</p>
          <div className="probability-dial">
            <div className="probability-dial__value"><strong>68</strong><span>{english ? "IMPLIED PRICE" : "隐含价格"}</span></div>
            <svg viewBox="0 0 240 132" role="img" aria-label={english ? "YES current price 68 credits" : "YES 当前价格 68 积分"}>
              <path d="M24 116 A96 96 0 0 1 216 116" pathLength="100" className="dial-track" />
              <path d="M24 116 A96 96 0 0 1 216 116" pathLength="100" className="dial-value" />
            </svg>
          </div>
          <div className="instrument-foot"><span>YES 68</span><span>NO 32</span><span>{english ? "LOCK 100" : "锁定 100"}</span></div>
        </div>
      </section>

      <DependencyGraph locale={locale} />

      <LearningJourney locale={locale} />

      <section className="principles-strip">
        <div className="page-width">
          <div><b>01</b><span>{english ? "Start with an example" : "先看一个例子"}</span><small>{english ? "Understand the problem" : "了解问题从哪里来"}</small></div>
          <div><b>02</b><span>{english ? "Change the inputs" : "再调整参数"}</span><small>{english ? "Compare what changes" : "比较结果怎样变化"}</small></div>
          <div><b>03</b><span>{english ? "Read the rule" : "最后读懂规则"}</span><small>{english ? "Understand the tradeoffs" : "理解设计上的取舍"}</small></div>
        </div>
      </section>

      <section className="atlas page-width" id="curriculum">
        <div className="section-heading">
          <div><span className="eyebrow">{english ? "COURSES" : "课程目录"}</span><h2>{english ? "Ten courses, each focused on one onchain system." : "十门课程，分别解释一种链上系统。"}</h2></div>
          <p>{english ? "Each course combines a plain-language explanation with an interactive example. If you are unsure where to begin, use the recommendation above." : "每门课都包括通俗说明、互动示例和理解检查。不确定先学什么，可以使用上面的课程推荐。"}</p>
        </div>
        <div className="category-row">
          {categories.map((category) => <span key={category.id}><b>0{category.index}</b>{categoryTitles?.[category.id as keyof typeof categoryTitles] ?? category.title}</span>)}
        </div>
        <div className="module-grid">
          {availableModules.map((module) => <ModuleCard key={module.id} module={module} locale={locale} />)}
        </div>
      </section>

    </>
  );
}
