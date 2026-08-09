import { learningPaths, type LearningPathId } from "./paths";

export type DiagnosticGoal = "markets" | "build" | "risk";

export type DiagnosticQuestionId = "state" | "price" | "risk";

export interface DiagnosticOption {
  label: string;
  explanation: string;
}

export interface DiagnosticQuestion {
  id: DiagnosticQuestionId;
  focus: "ledger" | "markets" | "risk";
  prompt: string;
  options: readonly DiagnosticOption[];
  correctIndex: number;
}

export const diagnosticQuestions: readonly DiagnosticQuestion[] = [
  {
    id: "state",
    focus: "ledger",
    prompt: "一笔交易有有效签名，为什么仍可能改变不了余额？",
    options: [
      { label: "签名本身已经等于转账", explanation: "签名只证明授权；还需要按 Nonce 执行交易并通过余额校验。" },
      { label: "执行时要验证 Nonce、余额和状态转换", explanation: "对。签名是入口，状态机规则决定它能否真正改变账本。" },
      { label: "只要 Gas 足够就一定成功", explanation: "Gas 只支付执行成本，不会绕过签名、Nonce 或余额规则。" },
    ],
    correctIndex: 1,
  },
  {
    id: "price",
    focus: "markets",
    prompt: "AMM 和订单簿最大的差别是什么？",
    options: [
      { label: "AMM 用曲线报价；订单簿等待对手方订单", explanation: "对。一个把流动性写进定价曲线，一个把价格和数量写进队列。" },
      { label: "它们都只是把价格写死在合约里", explanation: "价格会随储备或买卖盘变化，并不是一个永远不动的常数。" },
      { label: "订单簿本身就是预言机", explanation: "订单簿反映参与者订单，不负责把链外事实带回链上。" },
    ],
    correctIndex: 0,
  },
  {
    id: "risk",
    focus: "risk",
    prompt: "抵押品价格下跌而预言机滞后时，借贷协议可能发生什么？",
    options: [
      { label: "风险会暂时被低估，更新后可能集中清算", explanation: "对。协议看到的是旧价格，真实抵押率已经恶化，坏账风险可能累积。" },
      { label: "抵押率会自动变得更安全", explanation: "价格下跌不会凭空增加抵押品价值，滞后只会延迟风险被看见。" },
      { label: "预言机只影响显示，不影响偿付", explanation: "清算和借款额度依赖价格数据，错误或滞后会改变风险边界。" },
    ],
    correctIndex: 0,
  },
] as const;

export interface DiagnosticRecommendation {
  pathId: LearningPathId;
  title: string;
  reason: string;
  firstModuleId: string;
  score: number;
  total: number;
}

const goalPath: Record<DiagnosticGoal, LearningPathId> = {
  markets: "market-maker",
  build: "foundations-to-markets",
  risk: "risk-and-truth",
};

const goalPathEnglish: Record<DiagnosticGoal, LearningPathId> = {
  markets: "settlement-audit",
  build: "foundations-to-markets",
  risk: "settlement-audit",
};

const goalTitles = {
  zh: { markets: "市场机制路线", build: "从底层到市场", risk: "风险与现实" },
  en: { markets: "Settlement audit", build: "Foundations to markets", risk: "Settlement audit" },
} as const;

const focusLabels = {
  zh: { ledger: "状态与账本", markets: "价格与流动性", risk: "预言机与风险" },
  en: { ledger: "State & ledger", markets: "Price & liquidity", risk: "Oracles & risk" },
} as const;

function firstAvailableModule(pathId: LearningPathId, availableModuleIds?: readonly string[]) {
  const path = learningPaths.find((item) => item.id === pathId);
  return path?.moduleIds.find((id) => !availableModuleIds || availableModuleIds.includes(id)) ?? path?.moduleIds[0] ?? "ledger";
}

export function getDiagnosticRecommendation(
  goal: DiagnosticGoal,
  answers: Partial<Record<DiagnosticQuestionId, number>>,
  locale: string,
  availableModuleIds?: readonly string[],
): DiagnosticRecommendation {
  const english = locale === "en";
  const pathId = english ? goalPathEnglish[goal] : goalPath[goal];
  const score = diagnosticQuestions.reduce((total, question) => total + (answers[question.id] === question.correctIndex ? 1 : 0), 0);
  const total = diagnosticQuestions.length;
  const missed = diagnosticQuestions.find((question) => answers[question.id] !== undefined && answers[question.id] !== question.correctIndex);
  const title = goalTitles[english ? "en" : "zh"][goal];
  const firstModuleId = firstAvailableModule(pathId, availableModuleIds);

  if (missed) {
    const focus = focusLabels[english ? "en" : "zh"][missed.focus];
    return {
      pathId,
      title,
      reason: english
        ? `You have a useful question at the ${focus} boundary. Start here, then revisit the missed idea inside the experiments.`
        : `“${focus}”这道题没有答对。推荐路线会先补充相关基础，再进入后续课程。`,
      firstModuleId,
      score,
      total,
    };
  }

  return {
    pathId,
    title,
    reason: english
      ? `Your core intuition is already in place (${score}/${total}). Follow this route to connect the rules and their failure modes.`
      : `三道基础题答对了 ${score} 道。可以按这条路线继续，也可以直接选择其他课程。`,
    firstModuleId,
    score,
    total,
  };
}
