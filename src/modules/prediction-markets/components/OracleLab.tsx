"use client";

import { useState } from "react";
import type { Outcome } from "../core/types";

export function OracleLab({ locale = "zh" }: { locale?: "zh" | "en" }) {
  const english = locale === "en";
  const [report, setReport] = useState<Outcome | null>(null);
  const [disputed, setDisputed] = useState(false);
  const [final, setFinal] = useState<Outcome | null>(null);
  const reset = () => { setReport(null); setDisputed(false); setFinal(null); };
  return (
    <section className="interactive-panel oracle-lab" aria-label={english ? "Oracle and resolution lab" : "预言机与结算实验"}>
      <header><span>{english ? "Reality → onchain" : "现实 → 链上"}</span><strong>{final ? (english ? "Market resolved" : "市场已结算") : report ? (english ? "Awaiting confirmation" : "等待确认") : (english ? "Awaiting report" : "等待报告")}</strong></header>
      <div className="oracle-timeline">
        <div className="is-done"><span>1</span><strong>{english ? "Close time" : "截止时间"}</strong><small>2028-12-31</small></div>
        <div className={report ? "is-done" : ""}><span>2</span><strong>{english ? "Oracle report" : "预言机报告"}</strong><small>{report ?? (english ? "Waiting" : "等待")}</small></div>
        <div className={disputed ? "is-alert" : final ? "is-done" : ""}><span>3</span><strong>{english ? "Challenge window" : "挑战窗口"}</strong><small>{disputed ? (english ? "Disputed" : "发生争议") : final ? (english ? "Passed" : "已通过") : (english ? "24 hours" : "24 小时")}</small></div>
        <div className={final ? "is-done" : ""}><span>4</span><strong>{english ? "Resolution" : "结算"}</strong><small>{final ?? (english ? "Not started" : "未开始")}</small></div>
      </div>
      {!report && <div className="lab-actions"><button onClick={() => setReport("YES")} type="button">{english ? "Report YES" : "报告 YES"}</button><button onClick={() => setReport("NO")} type="button">{english ? "Report NO" : "报告 NO"}</button></div>}
      {report && !final && <div className="lab-actions"><button onClick={() => setFinal(report)} type="button">{english ? "Finalize without challenge" : "无人质疑，确认结果"}</button><button onClick={() => setDisputed(true)} type="button">{english ? "Challenge the report" : "发起质疑"}</button>{disputed && <button onClick={() => setFinal(report === "YES" ? "NO" : "YES")} type="button">{english ? "Review and correct" : "复核并纠正"}</button>}</div>}
      {final && <div className="resolution-banner"><strong>{final} {english ? "shares pay 100" : "份额兑付 100"}</strong><span>{final === "YES" ? "NO" : "YES"} {english ? "shares go to zero" : "份额归零"}</span><button onClick={reset} type="button">{english ? "Run again" : "重新实验"}</button></div>}
      <p className="panel-note">{english ? "An oracle does not predict the future. After the close time, it reports a fact using the agreed source. The challenge mechanism handles wrong or malicious reports." : "预言机不是预测未来，而是在截止后按事先约定的来源报告事实。挑战机制用于处理错误或作恶报告。"}</p>
    </section>
  );
}
