"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getLocalizedModule } from "@/platform/content/localization";
import { modules } from "@/platform/content/registry";
import { filterResearchRecords, useResearchJournal } from "./journal";

export function ResearchJournal({ locale }: { locale: string }) {
  const english = locale === "en";
  const records = useResearchJournal((state) => state.records);
  const updateReflection = useResearchJournal((state) => state.updateReflection);
  const removeRecord = useResearchJournal((state) => state.removeRecord);
  const clearRecords = useResearchJournal((state) => state.clearRecords);
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const labels = useMemo(() => Object.fromEntries(modules.map((module) => [module.id, getLocalizedModule(module, locale).shortTitle])), [locale]);
  const moduleOptions = useMemo(() => modules.filter((module) => records.some((record) => record.moduleId === module.id)).map((module) => ({ id: module.id, label: getLocalizedModule(module, locale).shortTitle })), [locale, records]);
  const visibleRecords = useMemo(() => filterResearchRecords(records, query, moduleFilter, labels), [labels, moduleFilter, query, records]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const totalActions = useMemo(() => records.reduce((total, record) => total + record.actionCount, 0), [records]);
  const selectedRecords = useMemo(() => selectedIds.flatMap((id) => { const record = records.find((candidate) => candidate.id === id); return record ? [record] : []; }), [records, selectedIds]);
  const comparisonMetricLabels = useMemo(() => Array.from(new Set(selectedRecords.flatMap((record) => record.metrics.map((metric) => metric.label)))), [selectedRecords]);

  function toggleSelected(recordId: string) {
    setSelectedIds((current) => current.includes(recordId) ? current.filter((id) => id !== recordId) : current.length < 3 ? [...current, recordId] : current);
  }

  function exportRecords() {
    const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), records }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `onchain-mechanism-lab-research-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function confirmClear() {
    if (window.confirm(english ? "Delete all local experiment records?" : "要清空所有本地实验记录吗？")) clearRecords();
  }

  return <section className="journal-page" aria-label={english ? "Experiment records" : "实验记录"}>
    <header className="journal-page__hero"><div><span className="eyebrow">{english ? "EXPERIMENT RECORDS" : "实验记录"}</span><h1>{english ? <>Saved experiments<br /><em>from your browser</em></> : <>保存在当前浏览器的<br /><em>实验记录</em></>}</h1><p>{english ? "Each record contains a state snapshot, actions, events, and selected metrics. You can compare records or return to the original sandbox." : "每条记录包括状态快照、操作、事件和主要指标。可以选择两到三条记录进行比较，也可以回到原来的实验室。"}</p></div><div className="journal-page__badge"><strong>{records.length}</strong><span>{english ? "saved records" : "条记录"}</span><small>{english ? "Local only · no account" : "仅保存在本地 · 无需账户"}</small></div></header>
    <div className="journal-page__metrics"><article><span>{english ? "Records" : "记录数"}</span><strong>{records.length}</strong><p>{english ? "saved in this browser" : "保存在当前浏览器"}</p></article><article><span>{english ? "Recorded actions" : "已记录操作"}</span><strong>{totalActions}</strong><p>{english ? "across all records" : "来自全部实验记录"}</p></article><article><span>{english ? "Format" : "记录格式"}</span><strong>JSON</strong><p>{english ? "state + actions + events" : "状态 + 操作 + 事件"}</p></article></div>
    <div className="journal-page__toolbar"><div><span className="eyebrow">{english ? "LOCAL STORAGE" : "本地存储"}</span><p>{english ? "Nothing leaves this device unless you export it." : "数据不会上传到服务器，只有主动导出时才会生成文件。"}</p></div><div><button className="text-button" disabled={!records.length} onClick={exportRecords} type="button">{english ? "Export JSON ↓" : "导出 JSON ↓"}</button><button className="text-button" disabled={!records.length} onClick={confirmClear} type="button">{english ? "Clear records" : "清空记录"}</button></div></div>
    {records.length ? <><div className="journal-filter-bar" aria-label={english ? "Filter research records" : "筛选实验记录"}><label><span>{english ? "Search records" : "搜索记录"}</span><input aria-label={english ? "Search records" : "搜索记录"} onChange={(event) => setQuery(event.target.value)} placeholder={english ? "Try: treasury, sandwich, price" : "试试：金库、夹子、价格"} type="search" value={query} /></label><label><span>{english ? "Mechanism" : "机制"}</span><select aria-label={english ? "Filter by mechanism" : "按机制筛选"} onChange={(event) => setModuleFilter(event.target.value)} value={moduleFilter}><option value="all">{english ? "All mechanisms" : "全部机制"}</option>{moduleOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label><span className="journal-filter-bar__count">{visibleRecords.length} / {records.length} {english ? "shown" : "条显示"}</span></div><section className="journal-comparison" aria-label={english ? "Experiment comparison" : "实验记录比较"}><header><div><span className="eyebrow">{english ? "COMPARE RECORDS" : "记录比较"}</span><h2>{english ? "What actually changed?" : "不同设置带来了什么变化？"}</h2><p>{english ? "Select two or three records below. The same metric means the same thing across scenarios." : "在下面选择两到三条记录。相同指标在不同场景里保持同一个含义。"}</p></div><span className="journal-comparison__count">{selectedRecords.length} / 3</span></header>{selectedRecords.length >= 2 ? <><div className="journal-comparison__table"><div className="journal-comparison__row is-head"><strong>{english ? "Metric" : "指标"}</strong>{selectedRecords.map((record) => <span key={record.id}>{record.scenario}</span>)}</div>{comparisonMetricLabels.map((label) => <div className="journal-comparison__row" key={label}><strong>{label}</strong>{selectedRecords.map((record) => <span key={`${record.id}-${label}`}>{record.metrics.find((metric) => metric.label === label)?.value ?? "—"}</span>)}</div>)}</div><div className="journal-comparison__insights">{selectedRecords.map((record) => <article key={record.id}><span>{record.scenario}</span><small>{record.reflection ? (english ? "Your reflection" : "你的复盘") : (english ? "Mechanism prompt" : "观察提示")}</small><p>{record.reflection || record.insight || record.note}</p></article>)}</div></> : <div className="journal-comparison__empty">{english ? "Choose at least two records below to open the comparison table." : "至少选择两条记录，才会打开对照表。"}</div>}</section>{visibleRecords.length ? <div className="journal-record-list">{visibleRecords.map((record) => <article className="journal-record" key={record.id}><header><div><span className="journal-record__module">{labels[record.moduleId] ?? record.moduleId}</span><h2>{record.title}</h2></div><div className="journal-record__header-actions"><label className="journal-record__select"><input aria-label={`${english ? "Compare " : "对照 "}${record.scenario}`} checked={selectedIds.includes(record.id)} onChange={() => toggleSelected(record.id)} type="checkbox" /><span>{english ? "Compare" : "加入对照"}</span></label><time dateTime={new Date(record.savedAt).toISOString()}>{new Date(record.savedAt).toLocaleString(english ? "en-US" : "zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time></div></header><div className="journal-record__meta"><span>{record.scenario}</span><span>{record.actionCount} {english ? "actions" : "步操作"}</span><span>{record.events.length} {english ? "events" : "个事件"}</span></div><p>{record.note}</p><label className="journal-record__reflection"><span>{english ? "Your reflection" : "你的复盘"}</span><textarea aria-label={`${english ? "Reflection for " : "对实验的复盘："}${record.scenario}`} defaultValue={record.reflection} maxLength={600} onBlur={(event) => updateReflection(record.id, event.currentTarget.value.trim())} placeholder={english ? "What changed, and what rule explains it?" : "这次实验改变了什么？哪条规则解释了它？"} rows={3} /></label>{record.events.length > 0 && <ol className="journal-record__events">{record.events.slice(-4).reverse().map((event) => <li key={`${record.id}-${event.kind}-${event.message}`}><span>{event.kind}</span><p>{event.message}</p></li>)}</ol>}<details className="journal-record__snapshot"><summary>{english ? "Inspect serialized state snapshot" : "查看序列化状态快照"}</summary><pre>{record.stateSnapshot.length > 2400 ? `${record.stateSnapshot.slice(0, 2400)}\n…` : record.stateSnapshot}</pre></details><footer><Link href={record.href}>{english ? "Return to this lab →" : "回到这个实验室 →"}</Link><button className="text-button" onClick={() => removeRecord(record.id)} type="button">{english ? "Delete" : "删除"}</button></footer></article>)}</div> : <div className="journal-filter-empty">{english ? "No records match this filter." : "没有符合筛选条件的记录。"}<button className="text-button" onClick={() => { setQuery(""); setModuleFilter("all"); }} type="button">{english ? "Clear filters" : "清除筛选"}</button></div>}</> : <div className="journal-empty"><span>⌁</span><h2>{english ? "Your notebook is empty." : "目前还没有实验记录。"}</h2><p>{english ? "Run a market, oracle, AMM, ledger, token, governance, or matching-engine experiment, then press ‘Save this experiment’ in the timeline." : "运行一次预测市场、预言机、AMM、账本、代币、治理或撮合实验，然后在时间轴里点击“记录这次实验”。"}</p><Link className="primary-button" href={`/${locale}/labs/${english ? "ledger" : "prediction-markets"}`}>{english ? "Open the first lab →" : "打开预测市场实验室 →"}</Link></div>}
  </section>;
}
