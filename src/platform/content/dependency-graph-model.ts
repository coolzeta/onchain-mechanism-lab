import type { ModuleManifest } from "@/platform/types/learning";

export interface DependencyPosition {
  x: number;
  y: number;
}

export interface DependencyNode {
  id: string;
  position: DependencyPosition;
}

export interface DependencyEdge {
  from: string;
  to: string;
}

export type DependencyLayout = "wide" | "compact";

const widePositions: Record<string, DependencyPosition> = {
  ledger: { x: 12, y: 24 },
  "token-launch": { x: 34, y: 20 },
  governance: { x: 35, y: 63 },
  "prediction-markets": { x: 56, y: 23 },
  "matching-engine": { x: 75, y: 38 },
  amm: { x: 38, y: 48 },
  oracles: { x: 76, y: 66 },
  lending: { x: 53, y: 76 },
  stablecoins: { x: 20, y: 78 },
  mev: { x: 84, y: 22 },
};

const compactPositions: Record<string, DependencyPosition> = {
  ledger: { x: 22, y: 10 },
  "token-launch": { x: 78, y: 10 },
  governance: { x: 22, y: 30 },
  "prediction-markets": { x: 78, y: 30 },
  amm: { x: 22, y: 50 },
  "matching-engine": { x: 78, y: 50 },
  lending: { x: 22, y: 70 },
  oracles: { x: 78, y: 70 },
  stablecoins: { x: 22, y: 90 },
  mev: { x: 78, y: 90 },
};

const edgeLabels = {
  zh: {
    "ledger->lending": "状态与账户",
    "ledger->stablecoins": "资产记账",
    "ledger->token-launch": "供应状态",
    "ledger->governance": "状态与权限",
    "token-launch->governance": "代币与代表权",
    "prediction-markets->amm": "价格与流动性",
    "prediction-markets->matching-engine": "订单与撮合",
    "prediction-markets->oracles": "结果交接",
    "amm->lending": "价格与抵押品",
    "oracles->lending": "风险输入",
    "oracles->stablecoins": "锚定数据",
    "lending->stablecoins": "抵押与偿付",
    "matching-engine->mev": "排序与执行",
    "amm->mev": "储备与套利",
    "ledger->mev": "交易状态",
  },
  en: {
    "ledger->lending": "state & accounts",
    "ledger->stablecoins": "asset accounting",
    "ledger->token-launch": "supply state",
    "ledger->governance": "state & authority",
    "token-launch->governance": "tokens & representation",
    "prediction-markets->amm": "price & liquidity",
    "prediction-markets->matching-engine": "orders & matching",
    "prediction-markets->oracles": "result handoff",
    "amm->lending": "price & collateral",
    "oracles->lending": "risk input",
    "oracles->stablecoins": "peg data",
    "lending->stablecoins": "collateral & repayment",
    "matching-engine->mev": "ordering & execution",
    "amm->mev": "reserves & arbitrage",
    "ledger->mev": "transaction state",
  },
} as const;

function fallbackPosition(index: number): DependencyPosition {
  const columns = 4;
  return { x: 12 + (index % columns) * 25, y: 18 + Math.floor(index / columns) * 28 };
}

export function buildDependencyGraph(activeModules: readonly Pick<ModuleManifest, "id" | "prerequisites">[], layout: DependencyLayout = "wide") {
  const ids = new Set(activeModules.map((module) => module.id));
  const layoutPositions = layout === "compact" ? compactPositions : widePositions;
  const nodes: DependencyNode[] = activeModules.map((module, index) => ({ id: module.id, position: layoutPositions[module.id] ?? fallbackPosition(index) }));
  const edges: DependencyEdge[] = activeModules.flatMap((module) => module.prerequisites.filter((prerequisite) => ids.has(prerequisite)).map((prerequisite) => ({ from: prerequisite, to: module.id })));
  return { nodes, edges };
}

export function getDependencyEdgeLabel(edge: DependencyEdge, locale: "zh" | "en") {
  return edgeLabels[locale][`${edge.from}->${edge.to}` as keyof (typeof edgeLabels)[typeof locale]] ?? (locale === "en" ? "required boundary" : "前置边界");
}
