import { describe, expect, it } from "vitest";
import { mechanismSystemsAudit } from "./challenges";
import { getRecommendedAuditStart } from "./audit";
import { buildKnowledgeMap } from "@/platform/progress/knowledge";
import { ledgerManifest } from "@/modules/ledger/manifest";
import { tokenLaunchManifest } from "@/modules/token-launch/manifest";
import { ammManifest } from "@/modules/amm/manifest";
import { matchingEngineManifest } from "@/modules/matching-engine/manifest";
import { oracleManifest } from "@/modules/oracles/manifest";
import { predictionMarketManifest } from "@/modules/prediction-markets/manifest";
import { stablecoinManifest } from "@/modules/stablecoins/manifest";
import { mevManifest } from "@/modules/mev/manifest";
import { governanceManifest } from "@/modules/governance/manifest";

const manifests = [ledgerManifest, tokenLaunchManifest, governanceManifest, ammManifest, matchingEngineManifest, mevManifest, oracleManifest, stablecoinManifest, predictionMarketManifest];
const emptyProgress = { completedLessons: [], checkpointAnswers: {}, checkpointAttempts: {}, completedTasks: [] };

describe("systems audit recommendation", () => {
  it("starts at the first boundary with no evidence", () => {
    const map = buildKnowledgeMap(manifests, emptyProgress);
    const recommendation = getRecommendedAuditStart(mechanismSystemsAudit, map, {});

    expect(recommendation.index).toBe(0);
    expect(recommendation.moduleId).toBe("ledger");
    expect(recommendation.reason).toContain("谁授权了");
  });

  it("keeps a boundary with a wrong check at the front of the audit", () => {
    const ledger = ledgerManifest;
    const lesson = ledger.lessons[0];
    const map = buildKnowledgeMap(manifests, {
      completedLessons: [`ledger:${lesson.id}`],
      completedTasks: [`ledger:${lesson.id}:${lesson.task.id}`],
      checkpointAttempts: { [lesson.checkpointId]: 1 },
      checkpointAnswers: { [lesson.checkpointId]: false },
    });
    const recommendation = getRecommendedAuditStart(mechanismSystemsAudit, map, {});

    expect(recommendation.index).toBe(0);
    expect(recommendation.lesson?.status).toBe("needs-review");
    expect(recommendation.reason).toContain("建议复习");
  });

  it("moves to the next dependency after the first boundary is verified", () => {
    const first = ledgerManifest.lessons[0];
    const map = buildKnowledgeMap(manifests, {
      completedLessons: [`ledger:${first.id}`],
      completedTasks: [`ledger:${first.id}:${first.task.id}`],
      checkpointAttempts: { [first.checkpointId]: 1 },
      checkpointAnswers: { [first.checkpointId]: true },
    });
    const recommendation = getRecommendedAuditStart(mechanismSystemsAudit, map, { "mechanism-systems-audit:nonce-boundary": true });

    expect(recommendation.index).toBe(1);
    expect(recommendation.moduleId).toBe("token-launch");
  });
});
