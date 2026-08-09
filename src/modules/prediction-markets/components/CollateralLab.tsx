"use client";

import { useState } from "react";
import type { Outcome } from "../core/types";

export function CollateralLab({ locale = "zh" }: { locale?: "zh" | "en" }) {
  const english = locale === "en";
  const [pairs, setPairs] = useState(3);
  const [result, setResult] = useState<Outcome>("YES");
  return (
    <section className="interactive-panel collateral-lab" aria-label={english ? "Collateral and outcome shares lab" : "抵押与结果份额实验"}>
      <header><span>{english ? "Complete-set minter" : "完整份额铸造器"}</span><strong>{english ? "Always fully collateralized" : "始终足额抵押"}</strong></header>
      <label className="range-label"><span>{english ? "How many credits do you deposit?" : "存入多少积分？"}</span><b>{pairs * 100}</b><input min="1" max="8" value={pairs} onChange={(event) => setPairs(Number(event.target.value))} type="range" /></label>
      <div className="collateral-flow">
        <div className="flow-node is-collateral"><small>{english ? "Collateral pool" : "抵押池"}</small><strong>{pairs * 100}</strong><span>{english ? "credits" : "积分"}</span></div>
        <div className="flow-arrow">→<small>{english ? "split" : "拆分"}</small></div>
        <div className="outcome-stack"><div className={result === "YES" ? "wins" : ""}><strong>{pairs}</strong><span>YES</span></div><div className={result === "NO" ? "wins" : ""}><strong>{pairs}</strong><span>NO</span></div></div>
      </div>
      <div className="result-toggle"><span>{english ? "Assume the final result:" : "假设最终结果："}</span><button className={result === "YES" ? "active" : ""} onClick={() => setResult("YES")} type="button">YES</button><button className={result === "NO" ? "active" : ""} onClick={() => setResult("NO")} type="button">NO</button></div>
      <p className="panel-note">{english ? <>The winning {pairs} {result} shares can claim <b>{pairs * 100}</b> credits; the other side goes to zero. The system does not need to find payout money later.</> : <>获胜的 {pairs} 份 {result} 可以领取 <b>{pairs * 100}</b> 积分；另一边归零。系统不需要临时寻找赔付资金。</>}</p>
    </section>
  );
}
