import { describe, expect, it } from "vitest";
import { challengeDefinitionSchema, challenges } from "./challenges";

describe("cross-module challenges", () => {
  it("keeps every challenge step valid and linked to a real module", () => {
    for (const challenge of challenges) {
      expect(() => challengeDefinitionSchema.parse(challenge)).not.toThrow();
      for (const step of challenge.steps) {
        expect(step.correctIndex).toBeLessThan(step.options.length);
        expect(step.lessonHref).toContain(`/learn/${step.moduleId}/${step.lessonId}`);
      }
    }
  });

  it("makes the systems audit span state, asset, governance, liquidity, execution, ordering, lending, oracle, reserve and settlement layers", () => {
    expect(challenges[0].steps.map((step) => step.moduleId)).toEqual(["ledger", "token-launch", "governance", "amm", "matching-engine", "mev", "lending", "oracles", "stablecoins", "prediction-markets"]);
  });
});
