import { describe, expect, it } from "vitest";
import { categories, getLessonKeyByCheckpoint, modules } from "./registry";
import { moduleManifestSchema } from "@/platform/types/learning";

describe("learning content registry", () => {
  it("contains only valid manifests and unique IDs", () => {
    const ids = modules.map((module) => module.id);
    expect(new Set(ids).size).toBe(ids.length);
    modules.forEach((manifest) => expect(() => moduleManifestSchema.parse(manifest)).not.toThrow());
  });

  it("references existing categories and unique lesson IDs", () => {
    const categoryIds = new Set(categories.map((category) => category.id));
    for (const manifest of modules) {
      expect(categoryIds.has(manifest.categoryId)).toBe(true);
      const lessonIds = manifest.lessons.map((lesson) => lesson.id);
      expect(new Set(lessonIds).size).toBe(lessonIds.length);
    }
  });

  it("can resolve every checkpoint back to its lesson boundary", () => {
    for (const manifest of modules) {
      for (const lesson of manifest.lessons) {
        expect(getLessonKeyByCheckpoint(lesson.checkpointId)).toBe(`${manifest.id}:${lesson.id}`);
      }
    }
    expect(getLessonKeyByCheckpoint("missing-checkpoint")).toBeNull();
  });

  it("gives every lesson a unique misconception-to-evidence investigation task", () => {
    const lessons = modules.filter((module) => module.status === "available").flatMap((module) => module.lessons);
    const taskIds = lessons.map((lesson) => lesson.task.id);
    expect(new Set(taskIds).size).toBe(taskIds.length);
    expect(lessons.every((lesson) => lesson.blocks.includes("simulation"))).toBe(true);
    expect(lessons.every((lesson) => lesson.task.misconception.length > 10 && lesson.task.action.length > 10 && lesson.task.evidence.length > 10)).toBe(true);
  });

  it("publishes a substantial six-part prediction market course", () => {
    const prediction = modules.find((module) => module.id === "prediction-markets");
    expect(prediction?.status).toBe("available");
    expect(prediction?.lessons).toHaveLength(6);
    expect(prediction?.lessons.every((lesson) => lesson.blocks.includes("checkpoint"))).toBe(true);
  });

  it("publishes AMM through the same reusable module protocol", () => {
    const amm = modules.find((module) => module.id === "amm");
    expect(amm?.status).toBe("available");
    expect(amm?.lessons).toHaveLength(4);
    expect(amm?.lessons[0].blocks).toEqual(expect.arrayContaining(["simulation", "checkpoint", "sources"]));
    expect(amm?.lessons[0].concepts).toContain("恒定乘积");
    expect(amm?.lessons.map((lesson) => lesson.id)).toEqual(expect.arrayContaining(["price-impact-and-slippage", "lp-inventory-and-fees", "arbitrage-and-impermanent-loss"]));
  });

  it("publishes token launch as an available supply module", () => {
    const token = modules.find((module) => module.id === "token-launch");
    expect(token?.status).toBe("available");
    expect(token?.lessons).toHaveLength(4);
    expect(token?.lessons[0].blocks).toEqual(expect.arrayContaining(["simulation", "checkpoint", "sources"]));
    expect(token?.lessons[0].concepts).toEqual(expect.arrayContaining(["总供应", "增发权限", "锁仓"]));
    expect(token?.lessons.map((lesson) => lesson.id)).toEqual(expect.arrayContaining(["allocation-and-vesting", "dilution-and-distribution", "permissions-and-governance"]));
  });

  it("publishes matching engine as an available orderbook module", () => {
    const engine = modules.find((module) => module.id === "matching-engine");
    expect(engine?.status).toBe("available");
    expect(engine?.prerequisites).toContain("prediction-markets");
    expect(engine?.lessons).toHaveLength(4);
    expect(engine?.lessons[0].blocks).toEqual(expect.arrayContaining(["simulation", "checkpoint", "sources"]));
    expect(engine?.lessons[0].concepts).toContain("部分成交");
    expect(engine?.lessons.map((lesson) => lesson.id)).toEqual(expect.arrayContaining(["market-orders-and-depth", "spread-and-liquidity", "risk-controls-and-replacement"]));
  });

  it("publishes oracle dispute flow as an available security module", () => {
    const oracle = modules.find((module) => module.id === "oracles");
    expect(oracle?.status).toBe("available");
    expect(oracle?.lessons).toHaveLength(4);
    expect(oracle?.lessons[0].blocks).toEqual(expect.arrayContaining(["simulation", "checkpoint", "sources"]));
    expect(oracle?.lessons[0].concepts).toEqual(expect.arrayContaining(["挑战窗口", "经济担保"]));
    expect(oracle?.lessons.map((lesson) => lesson.id)).toEqual(expect.arrayContaining(["source-quality-and-reporting", "challenge-windows-and-bonds", "settlement-handoff-and-failure"]));
  });

  it("publishes the ledger as the foundational state module", () => {
    const ledger = modules.find((module) => module.id === "ledger");
    expect(ledger?.status).toBe("available");
    expect(ledger?.lessons).toHaveLength(4);
    expect(ledger?.lessons[0].blocks).toEqual(expect.arrayContaining(["simulation", "checkpoint", "sources"]));
    expect(ledger?.lessons[0].concepts).toEqual(expect.arrayContaining(["签名", "Nonce", "状态根"]));
    expect(ledger?.lessons.map((lesson) => lesson.id)).toEqual(expect.arrayContaining(["transaction-pool-and-replacement", "block-order-and-state-root", "finality-and-confirmations"]));
  });

  it("publishes lending and liquidation as a complete risk module", () => {
    const lending = modules.find((module) => module.id === "lending");
    expect(lending?.status).toBe("available");
    expect(lending?.lessons).toHaveLength(4);
    expect(lending?.lessons[0].blocks).toEqual(expect.arrayContaining(["simulation", "checkpoint", "sources"]));
    expect(lending?.lessons[0].concepts).toEqual(expect.arrayContaining(["抵押品", "LTV"]));
    expect(lending?.lessons.map((lesson) => lesson.id)).toEqual(expect.arrayContaining(["interest-and-health", "price-shock-and-liquidation", "oracle-and-bad-debt"]));
  });

  it("publishes stablecoins as a reserve and redemption module", () => {
    const stablecoins = modules.find((module) => module.id === "stablecoins");
    expect(stablecoins?.status).toBe("available");
    expect(stablecoins?.lessons).toHaveLength(4);
    expect(stablecoins?.lessons[0].blocks).toEqual(expect.arrayContaining(["simulation", "checkpoint", "sources"]));
    expect(stablecoins?.lessons[0].concepts).toEqual(expect.arrayContaining(["锚定", "赎回"]));
    expect(stablecoins?.lessons.map((lesson) => lesson.id)).toEqual(expect.arrayContaining(["collateral-and-minting", "depeg-and-arbitrage", "reserves-and-run-risk"]));
  });
});
