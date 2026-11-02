import { describe, expect, it } from "vitest";
import { buildDependencyGraph, getDependencyEdgeLabel } from "./dependency-graph-model";

const modules: Array<{ id: string; prerequisites: string[] }> = [
  { id: "ledger", prerequisites: [] },
  { id: "oracles", prerequisites: ["prediction-markets"] },
  { id: "prediction-markets", prerequisites: [] },
  { id: "lending", prerequisites: ["ledger", "oracles"] },
];

describe("dependency graph", () => {
  it("only draws edges whose endpoints are available in the current locale", () => {
    const graph = buildDependencyGraph(modules);

    expect(graph.nodes.map((node) => node.id)).toEqual(["ledger", "oracles", "prediction-markets", "lending"]);
    expect(graph.edges).toEqual([
      { from: "prediction-markets", to: "oracles" },
      { from: "ledger", to: "lending" },
      { from: "oracles", to: "lending" },
    ]);
  });

  it("keeps edge explanations separate from graph topology", () => {
    expect(getDependencyEdgeLabel({ from: "oracles", to: "lending" }, "zh")).toBe("风险输入");
    expect(getDependencyEdgeLabel({ from: "oracles", to: "lending" }, "en")).toBe("risk input");
    expect(getDependencyEdgeLabel({ from: "unknown", to: "lending" }, "zh")).toBe("前置边界");
  });

  it("uses a two-column layout on narrow screens", () => {
    const graph = buildDependencyGraph(modules, "compact");

    expect(graph.nodes.find((node) => node.id === "ledger")?.position).toEqual({ x: 22, y: 8 });
    expect(graph.nodes.find((node) => node.id === "prediction-markets")?.position).toEqual({ x: 78, y: 24 });
    expect(graph.edges).toHaveLength(3);
  });
});
