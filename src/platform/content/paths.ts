export const learningPaths = [
  {
    id: "foundations-to-markets",
    label: "从底层到市场",
    description: "先理解资产、状态与治理，再进入 AMM、预测市场、预言机、借贷、稳定币与交易排序。",
    moduleIds: ["ledger", "token-launch", "governance", "amm", "prediction-markets", "oracles", "lending", "stablecoins", "mev"],
  },
  {
    id: "market-maker",
    label: "市场机制路线",
    description: "从订单簿和价格发现，横向比较 AMM、撮合引擎与交易排序。",
    moduleIds: ["prediction-markets", "amm", "matching-engine", "mev"],
  },
  {
    id: "risk-and-truth",
    label: "风险与现实",
    description: "重点学习治理、价格、预言机、流动性和交易排序中常见的风险。",
    moduleIds: ["governance", "prediction-markets", "amm", "oracles", "lending", "stablecoins", "mev"],
  },
  {
    id: "settlement-audit",
    label: "结算审计路线",
    description: "从交易最终确认、预言机报告到预测市场赔付，了解一次结算需要经过哪些步骤。",
    moduleIds: ["ledger", "prediction-markets", "oracles"],
  },
] as const;

export type LearningPathId = (typeof learningPaths)[number]["id"];

export function isLearningPathId(value: string | undefined): value is LearningPathId {
  return Boolean(value && learningPaths.some((path) => path.id === value));
}
