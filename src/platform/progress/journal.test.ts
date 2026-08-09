import { describe, expect, it } from "vitest";
import { filterResearchRecords, researchRecordSchema, type ResearchRecordSearchable } from "./journal";

describe("research journal contract", () => {
  it("accepts a portable serialized experiment record", () => {
    const record = researchRecordSchema.parse({
      id: "research-test",
      moduleId: "prediction-markets",
      locale: "zh",
      title: "预测市场自由实验",
      scenario: "低流动性",
      note: "订单簿很薄。",
      href: "/zh/labs/prediction-markets",
      savedAt: 1_735_689_600_000,
      actionCount: 2,
      stateSnapshot: "{\"phase\":\"OPEN\"}",
      actions: ["{\"type\":\"PLACE_ORDER\"}"],
      events: [{ kind: "ORDER_SUBMITTED", message: "订单已提交。" }],
      metrics: [{ label: "隐含价格", value: "68 / 100" }],
      insight: "价格不是事实。",
      reflection: "低流动性时，我需要先问成交量够不够。",
    });

    expect(record.actionCount).toBe(2);
    expect(record.events[0]?.kind).toBe("ORDER_SUBMITTED");
    expect(record.metrics[0]?.value).toBe("68 / 100");
    expect(record.reflection).toContain("低流动性");
  });

  it("rejects records that could not be restored to a local lab", () => {
    expect(() => researchRecordSchema.parse({ id: "broken", moduleId: "amm" })).toThrow();
  });

  it("keeps older records readable when metric fields are added", () => {
    const legacy = researchRecordSchema.parse({
      id: "legacy",
      moduleId: "amm",
      locale: "zh",
      title: "旧记录",
      scenario: "初始池",
      note: "旧版记录没有比较指标。",
      href: "/zh/labs/amm",
      savedAt: 1_735_689_600_000,
      actionCount: 0,
      stateSnapshot: "{}",
      actions: [],
      events: [],
    });

    expect(legacy.metrics).toEqual([]);
    expect(legacy.insight).toBe("");
    expect(legacy.reflection).toBe("");
  });

  it("filters records by mechanism and searchable evidence text", () => {
    const records = [
      { id: "governance", moduleId: "governance", title: "治理实验", scenario: "金库拨款", note: "时间锁之后执行拨款。" },
      { id: "amm", moduleId: "amm", title: "AMM 实验", scenario: "低流动性", note: "价格冲击变大。" },
    ] satisfies ResearchRecordSearchable[];
    expect(filterResearchRecords(records, "金库", "all", { governance: "治理与金库" }).map((record) => record.id)).toEqual(["governance"]);
    expect(filterResearchRecords(records, "", "amm").map((record) => record.id)).toEqual(["amm"]);
  });
});
