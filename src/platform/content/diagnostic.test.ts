import { describe, expect, it } from "vitest";
import { diagnosticQuestions, getDiagnosticRecommendation } from "./diagnostic";

describe("learning diagnostic", () => {
  it("routes a market learner to the market mechanism path and explains a missed boundary", () => {
    const result = getDiagnosticRecommendation("markets", { state: 0, price: 0, risk: 0 }, "zh", ["prediction-markets", "amm", "matching-engine"]);

    expect(result.pathId).toBe("market-maker");
    expect(result.title).toBe("市场机制路线");
    expect(result.score).toBe(2);
    expect(result.reason).toContain("状态与账本");
    expect(result.firstModuleId).toBe("prediction-markets");
  });

  it("keeps the English recommendation inside the modules translated so far", () => {
    const answers = Object.fromEntries(diagnosticQuestions.map((question) => [question.id, question.correctIndex]));
    const result = getDiagnosticRecommendation("risk", answers, "en", ["ledger", "oracles"]);

    expect(result.pathId).toBe("settlement-audit");
    expect(result.title).toBe("Settlement audit");
    expect(result.score).toBe(3);
    expect(result.firstModuleId).toBe("ledger");
    expect(result.reason).toContain("3/3");
  });
});
