import Link from "next/link";
import type { ModuleManifest } from "@/platform/types/learning";
import { getModuleCuriosityTeasers } from "@/platform/content/curiosities";

const moduleMarks: Record<string, string> = {
  "prediction-markets": "P?",
  "token-launch": "T+",
  amm: "xy",
  "matching-engine": "↕",
  oracles: "◎",
  ledger: "#",
  lending: "₿",
  stablecoins: "$",
  mev: "↯",
  governance: "⚖",
};

export function ModuleCard({ module, locale }: { module: ModuleManifest; locale: string }) {
  const available = module.status === "available";
  const english = locale === "en";
  const curiosityTeasers = getModuleCuriosityTeasers(module.id, locale);
  const body = (
    <>
      <div className="module-card__top">
        <span className="module-mark" aria-hidden="true">{moduleMarks[module.id] ?? "◇"}</span>
        <span className={`status-label ${available ? "is-live" : ""}`}>{available ? (english ? "Open" : "课程已开放") : (english ? "In planning" : "内容准备中")}</span>
      </div>
      <div>
        <h3>{module.shortTitle}</h3>
        <p>{module.summary}</p>
      </div>
      {curiosityTeasers.length > 0 && <div className="module-card__curiosities"><span>{english ? "QUESTIONS COVERED" : "课程会回答"}</span><ul>{curiosityTeasers.map((item) => <li key={item.id}>{item.question}</li>)}</ul></div>}
      <div className="module-card__meta">
        <span>{english ? `${module.lessons.length} lesson${module.lessons.length === 1 ? "" : "s"}` : `${module.lessons.length} 个章节`}</span>
        <span>{english ? `${module.estimatedMinutes} min` : `${module.estimatedMinutes} 分钟`}</span>
        <strong>{available ? (english ? "View course →" : "查看课程 →") : (english ? "Coming soon" : "尚未开放")}</strong>
      </div>
    </>
  );

  return available ? (
    <Link className="module-card is-available" href={`/${locale}/learn/${module.id}`}>{body}</Link>
  ) : (
    <Link className="module-card is-coming" href={`/${locale}/modules/${module.id}`} aria-label={english ? `${module.shortTitle} module preview` : `${module.shortTitle}模块预览`}>{body}</Link>
  );
}
