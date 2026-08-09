"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { englishGlossaryEntries, englishGlossaryGroups, glossaryEntries, glossaryGroups } from "./glossary";
import { getLocalizedModule } from "./localization";
import { modules } from "./registry";

export function GlossaryExplorer({ locale }: { locale: string }) {
  const [query, setQuery] = useState("");
  const english = locale === "en";
  const activeEntries = english ? englishGlossaryEntries : glossaryEntries;
  const activeGroups = english ? englishGlossaryGroups : glossaryGroups;
  const allLabel = english ? "All" : "全部";
  const [group, setGroup] = useState(allLabel);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => activeEntries.filter((entry) => {
    const matchesGroup = group === allLabel || entry.group === group;
    const relatedModule = modules.find((module) => module.id === (entry.relatedModuleId ?? "prediction-markets"));
    const localizedModule = relatedModule ? getLocalizedModule(relatedModule, locale) : undefined;
    const searchableText = `${entry.term} ${entry.definition} ${localizedModule?.title ?? ""} ${localizedModule?.shortTitle ?? ""}`.toLowerCase();
    const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
    return matchesGroup && matchesQuery;
  }), [activeEntries, allLabel, group, locale, normalizedQuery]);

  function clearFilters() {
    setQuery("");
    setGroup(allLabel);
  }

  return (
    <>
      <section className="glossary-tools" aria-label={english ? "Glossary search" : "术语检索"}>
        <label htmlFor="glossary-search">{english ? "Search a term or definition" : "搜索术语或解释"}</label>
        <div className="glossary-search-row">
          <input id="glossary-search" onChange={(event) => setQuery(event.target.value)} placeholder={english ? "Try: nonce, oracle, state root" : "试试：流动性、预言机、限价单"} type="search" value={query} />
          {query && <button aria-label={english ? "Clear search" : "清空搜索"} onClick={() => setQuery("")} type="button">{english ? "Clear" : "清空"}</button>}
        </div>
        <div className="glossary-filters" role="group" aria-label={english ? "Glossary categories" : "术语分类"}>
          {[allLabel, ...activeGroups.map((item) => item.title)].map((item) => <button aria-pressed={group === item} key={item} onClick={() => setGroup(item)} type="button">{item}</button>)}
        </div>
        <p role="status">{english ? `${filtered.length} terms found${normalizedQuery ? ` matching “${query.trim()}”` : ""}` : `找到 ${filtered.length} 个术语${normalizedQuery ? `，匹配“${query.trim()}”` : ""}`}</p>
      </section>

      {filtered.length ? <div className="glossary-results">
        {filtered.map((entry) => {
          const relatedModule = modules.find((module) => module.id === (entry.relatedModuleId ?? "prediction-markets"));
          const lessonLocale = relatedModule?.locales.includes(locale as "zh" | "en") ? locale : relatedModule?.locales[0];
          const crossLocale = Boolean(lessonLocale && lessonLocale !== locale);
          const localizedModule = relatedModule && lessonLocale ? getLocalizedModule(relatedModule, lessonLocale) : relatedModule;
          return <article key={`${entry.group}-${entry.term}`}>
          <div className="glossary-result__heading"><span>{entry.group}</span><h2>{entry.term}</h2>{relatedModule && lessonLocale && <Link className="glossary-result__module" href={`/${lessonLocale}/${relatedModule.status === "available" ? "learn" : "modules"}/${relatedModule.id}`}>{english ? `Module · ${localizedModule?.shortTitle ?? relatedModule.shortTitle}` : `模块 · ${localizedModule?.shortTitle ?? relatedModule.shortTitle}`}</Link>}</div>
          <p>{entry.definition}</p>
          {entry.relatedLesson && lessonLocale && <Link href={`/${lessonLocale}/learn/${entry.relatedModuleId ?? "prediction-markets"}/${entry.relatedLesson}`}>{crossLocale ? (english ? "Read Chinese lesson →" : "阅读相关章节 →") : (english ? "Open related lesson →" : "回到相关章节 →")}</Link>}
        </article>;
        })}
      </div> : <div className="glossary-empty"><strong>{english ? "No matching term." : "还没有找到这个词。"}</strong><p>{english ? "Try a shorter keyword or start with a category." : "换一个更短的关键词，或者先从分类标签开始。"}</p><button className="glossary-empty__reset" onClick={clearFilters} type="button">{english ? "Clear filters" : "清除筛选"}</button></div>}
    </>
  );
}
