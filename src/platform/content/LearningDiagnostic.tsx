"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { diagnosticQuestions, getDiagnosticRecommendation, type DiagnosticGoal, type DiagnosticQuestionId } from "./diagnostic";
import { modules } from "./registry";
import { isModuleAvailableForLocale } from "./localization";
import { useProgressStore } from "@/platform/progress/store";

const goalCopy = {
  zh: {
    markets: { label: "看懂市场与价格", description: "想知道价格、订单和流动性如何互相影响。" },
    build: { label: "理解协议如何被设计", description: "想从余额、供应和规则一路搭起系统。" },
    risk: { label: "了解系统风险", description: "想知道预言机、抵押品和清算为什么会出问题。" },
  },
  en: {
    markets: { label: "Understand markets & prices", description: "See how orders, liquidity, and prices constrain each other." },
    build: { label: "Understand protocol design", description: "Build the system from balances, supply, and explicit rules." },
    risk: { label: "Find risk boundaries", description: "Explore oracles, collateral, and the conditions that cause failure." },
  },
} as const;

const questionCopy = {
  zh: [
    { prompt: "一笔交易有有效签名，为什么仍可能改变不了余额？", options: ["签名本身已经等于转账", "执行时要验证 Nonce、余额和状态转换", "只要 Gas 足够就一定成功"] },
    { prompt: "AMM 和订单簿最大的差别是什么？", options: ["AMM 用曲线报价；订单簿等待对手方订单", "它们都只是把价格写死在合约里", "订单簿本身就是预言机"] },
    { prompt: "抵押品价格下跌而预言机滞后时，借贷协议可能发生什么？", options: ["风险会暂时被低估，更新后可能集中清算", "抵押率会自动变得更安全", "预言机只影响显示，不影响偿付"] },
  ],
  en: [
    { prompt: "A transaction has a valid signature. Why might the balance still not change?", options: ["A signature is the transfer itself", "Execution still checks nonce, balance, and state transition", "Enough gas guarantees success"] },
    { prompt: "What is the biggest difference between an AMM and an order book?", options: ["An AMM quotes from a curve; an order book waits for counterparties", "Both simply hard-code one price", "An order book is an oracle"] },
    { prompt: "What can happen when collateral falls while the oracle lags?", options: ["Risk is temporarily understated and liquidations may cluster after the update", "The collateral ratio becomes safer automatically", "The oracle only changes the display, not repayment"] },
  ],
} as const;

const explanationCopy = {
  zh: [
    "签名只证明授权；还需要按 Nonce 执行交易并通过余额校验。",
    "对。一个把流动性写进定价曲线，一个把价格和数量写进队列。",
    "对。协议看到的是旧价格，真实抵押率已经恶化，坏账风险可能累积。",
  ],
  en: [
    "A signature proves authorization; execution still needs nonce and balance checks.",
    "Exactly. One writes liquidity into a pricing curve; the other writes price and quantity into a queue.",
    "Exactly. The protocol sees an old price while the real collateral ratio has already deteriorated.",
  ],
} as const;

const missedExplanationCopy = {
  zh: [
    "签名只证明授权；Nonce、余额和状态转换仍然需要在执行时通过。",
    "订单簿不是预言机，AMM 也不是固定价格；两者都要面对流动性和价格变化。",
    "价格下跌不会自动变安全，预言机滞后只会让已经发生的风险晚一点被看见。",
  ],
  en: [
    "A signature proves authorization; nonce, balance, and state checks still happen during execution.",
    "An order book is not an oracle, and an AMM is not a fixed price. Both still face liquidity and price movement.",
    "A falling price does not become safer by itself. Oracle lag only delays when the risk becomes visible.",
  ],
} as const;

const focusCopy = {
  zh: ["状态与账本", "价格与流动性", "预言机与风险"],
  en: ["state & ledger", "price & liquidity", "oracles & risk"],
} as const;

const goalIds: readonly DiagnosticGoal[] = ["markets", "build", "risk"];

export function LearningDiagnostic({ locale }: { locale: string }) {
  const english = locale === "en";
  const language = english ? "en" : "zh";
  const diagnosticGoal = useProgressStore((state) => state.diagnosticGoal);
  const diagnosticAnswers = useProgressStore((state) => state.diagnosticAnswers);
  const diagnosticCompletedAt = useProgressStore((state) => state.diagnosticCompletedAt);
  const setDiagnosticGoal = useProgressStore((state) => state.setDiagnosticGoal);
  const recordDiagnosticAnswer = useProgressStore((state) => state.recordDiagnosticAnswer);
  const markDiagnosticComplete = useProgressStore((state) => state.markDiagnosticComplete);
  const resetDiagnostic = useProgressStore((state) => state.resetDiagnostic);
  const [questionIndex, setQuestionIndex] = useState(() => diagnosticQuestions.findIndex((question) => diagnosticAnswers[question.id] === undefined) === -1 ? diagnosticQuestions.length - 1 : Math.max(0, diagnosticQuestions.findIndex((question) => diagnosticAnswers[question.id] === undefined)));
  const availableModuleIds = useMemo(() => modules.filter((module) => isModuleAvailableForLocale(module, locale)).map((module) => module.id), [locale]);
  const recommendation = diagnosticGoal ? getDiagnosticRecommendation(diagnosticGoal, diagnosticAnswers, locale, availableModuleIds) : null;
  const isComplete = Boolean(diagnosticGoal && diagnosticCompletedAt && diagnosticQuestions.every((question) => diagnosticAnswers[question.id] !== undefined));
  const firstUnansweredIndex = diagnosticQuestions.findIndex((question) => diagnosticAnswers[question.id] === undefined);
  const [answerReviewed, setAnswerReviewed] = useState(false);
  const activeQuestionIndex = !answerReviewed && firstUnansweredIndex >= 0 && diagnosticAnswers[diagnosticQuestions[questionIndex]?.id] !== undefined ? firstUnansweredIndex : questionIndex;
  const currentQuestion = diagnosticQuestions[activeQuestionIndex] ?? diagnosticQuestions[0];
  const currentAnswer = diagnosticAnswers[currentQuestion.id];
  const selectedCorrect = currentAnswer === currentQuestion.correctIndex;
  const questionText = questionCopy[language][activeQuestionIndex];
  const correctExplanation = explanationCopy[language][activeQuestionIndex];

  const chooseGoal = (goal: DiagnosticGoal) => {
    setDiagnosticGoal(goal);
    setQuestionIndex(0);
    setAnswerReviewed(false);
  };

  const continueQuestion = () => {
    if (activeQuestionIndex >= diagnosticQuestions.length - 1) {
      markDiagnosticComplete();
      return;
    }
    setQuestionIndex(activeQuestionIndex + 1);
    setAnswerReviewed(false);
  };

  const startOver = () => {
    resetDiagnostic();
    setQuestionIndex(0);
    setAnswerReviewed(false);
  };

  return <section className="learning-diagnostic" id="diagnostic" aria-label={english ? "Course recommendation" : "课程推荐"}>
    <div className="learning-diagnostic__intro">
      <div><span className="eyebrow">{english ? "COURSE RECOMMENDATION" : "课程推荐"}</span><h2>{english ? "Choose a topic, then answer three questions." : "选择一个方向，再回答三道基础题"}</h2><p>{english ? "The answers help us suggest an order for the existing courses. They are not a score or personality test." : "这些答案只用于推荐课程顺序，不是能力测试，也不会影响你查看其他课程。"}</p></div>
      <div className="learning-diagnostic__meta"><strong>03</strong><span>{english ? "questions" : "道题"}</span><small>{english ? "about 3 minutes" : "约 3 分钟"}</small></div>
    </div>

    {!diagnosticGoal && <div className="learning-diagnostic__goals" role="list" aria-label={english ? "Choose your learning goal" : "选择学习目标"}>{goalIds.map((goal) => <button className="learning-diagnostic__goal" key={goal} type="button" onClick={() => chooseGoal(goal)}><span>{goalCopy[language][goal].label}</span><small>{goalCopy[language][goal].description}</small><b>{english ? "Answer three questions →" : "回答三道题 →"}</b></button>)}</div>}

    {diagnosticGoal && !isComplete && <div className="learning-diagnostic__quiz">
      <div className="learning-diagnostic__progress"><span>{english ? `Question ${activeQuestionIndex + 1} / ${diagnosticQuestions.length}` : `第 ${activeQuestionIndex + 1} / ${diagnosticQuestions.length} 题`}</span><i aria-hidden="true"><b style={{ width: `${((activeQuestionIndex + (currentAnswer !== undefined ? 1 : 0)) / diagnosticQuestions.length) * 100}%` }} /></i><button type="button" className="text-button" onClick={startOver}>{english ? "Change goal" : "更换目标"}</button></div>
      <div className="learning-diagnostic__question"><span className="eyebrow">{focusCopy[language][activeQuestionIndex]}</span><h3>{questionText.prompt}</h3><div className="learning-diagnostic__answers" role="listbox" aria-label={english ? "Choose an answer" : "选择答案"}>{questionText.options.map((option, index) => <button type="button" role="option" aria-selected={currentAnswer === index} className={currentAnswer === index ? "is-selected" : ""} key={option} onClick={() => { recordDiagnosticAnswer(currentQuestion.id as DiagnosticQuestionId, index); setAnswerReviewed(true); }}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{currentAnswer !== undefined && <div className={`learning-diagnostic__feedback ${selectedCorrect ? "is-correct" : "is-missed"}`} role="status"><strong>{selectedCorrect ? (english ? "Correct." : "答对了。") : (english ? "Not quite." : "这题没有答对。")}</strong><p>{selectedCorrect ? correctExplanation : missedExplanationCopy[language][activeQuestionIndex]}</p><button className="primary-button" type="button" onClick={continueQuestion}>{activeQuestionIndex === diagnosticQuestions.length - 1 ? (english ? "See my route →" : "查看推荐路线 →") : (english ? "Next question →" : "下一题 →")}</button></div>}</div>
    </div>}

    {diagnosticGoal && isComplete && recommendation && <div className="learning-diagnostic__result"><div className="learning-diagnostic__score"><span>{english ? "RESULT" : "答题结果"}</span><strong>{recommendation.score}<small>/{recommendation.total}</small></strong><em>{english ? "correct answers" : "题回答正确"}</em></div><div className="learning-diagnostic__recommendation"><span className="eyebrow">{english ? "SUGGESTED ROUTE" : "推荐路线"}</span><h3>{recommendation.title}</h3><p>{recommendation.reason}</p><div className="learning-diagnostic__result-actions"><Link className="primary-button" href={`/${locale}/paths?path=${recommendation.pathId}`}>{english ? "View this route →" : "查看这条路线 →"}</Link><button className="text-button" type="button" onClick={startOver}>{english ? "Run it again" : "重新选择"}</button></div></div></div>}
  </section>;
}
