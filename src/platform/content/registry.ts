import type { CategoryManifest, ModuleManifest } from "@/platform/types/learning";
import { moduleManifestSchema } from "@/platform/types/learning";
import { predictionMarketManifest } from "@/modules/prediction-markets/manifest";
import { ammManifest } from "@/modules/amm/manifest";
import { tokenLaunchManifest } from "@/modules/token-launch/manifest";
import { matchingEngineManifest } from "@/modules/matching-engine/manifest";
import { oracleManifest } from "@/modules/oracles/manifest";
import { ledgerManifest } from "@/modules/ledger/manifest";
import { lendingManifest } from "@/modules/lending/manifest";
import { stablecoinManifest } from "@/modules/stablecoins/manifest";
import { mevManifest } from "@/modules/mev/manifest";
import { governanceManifest } from "@/modules/governance/manifest";

export const categories: CategoryManifest[] = [
  {
    id: "foundations",
    title: "链的底层",
    description: "签名、账户、交易、区块、状态机与共识。",
    index: 1,
  },
  {
    id: "assets",
    title: "资产与发行",
    description: "代币、供应、权限、锁仓与发行曲线。",
    index: 2,
  },
  {
    id: "markets",
    title: "市场机制",
    description: "订单簿、AMM、预测、借贷与清算。",
    index: 3,
  },
  {
    id: "security",
    title: "对抗与安全",
    description: "MEV、预言机操纵、权限、治理与经济攻击。",
    index: 4,
  },
];

export const modules: ModuleManifest[] = [
  predictionMarketManifest,
  ammManifest,
  tokenLaunchManifest,
  matchingEngineManifest,
  oracleManifest,
  ledgerManifest,
  lendingManifest,
  stablecoinManifest,
  mevManifest,
  governanceManifest,
];

modules.forEach((module) => moduleManifestSchema.parse(module));

export function getModule(moduleId: string) {
  return modules.find((module) => module.id === moduleId);
}

export function getLessonKeyByCheckpoint(checkpointId: string) {
  for (const manifest of modules) {
    const lesson = manifest.lessons.find((candidate) => candidate.checkpointId === checkpointId);
    if (lesson) return `${manifest.id}:${lesson.id}`;
  }
  return null;
}
