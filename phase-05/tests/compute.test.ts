import { describe, expect, it } from "vitest";
import { runAnalyticsTask } from "../src/index.js";

const inlineSource = (id: string, name: string, content: string) => ({
  id,
  name,
  kind: "inline" as const,
  content,
});

describe("Phase 5 computation & preparation (§5, §6)", () => {
  it("filter transform produces a derived dataset and sum over it", async () => {
    const result = await runAnalyticsTask({
      objective: "Analyze the filtered set.",
      sources: [
        inlineSource(
          "s1",
          "sales",
          "region,amount\nnorth,10\nsouth,20\nnorth,30",
        ),
      ],
      plan: [
        { op: "filter", dataset: "s1", field: "region", equals: "north" },
        { op: "sum", dataset: "derived-s1-1", field: "amount" },
      ],
    });
    expect(result.state).toBe("COMPLETED");
    const sumFinding = result.findings.find((f) =>
      f.text.includes('Sum of "amount"'),
    );
    expect(sumFinding?.text).toContain("= 40");
    const chain = sumFinding?.provenance;
    expect(chain?.steps.some((s) => s.kind === "filter")).toBe(true);
    expect(chain?.steps.some((s) => s.kind === "parse")).toBe(true);
    expect(
      chain?.steps.some((s) => s.kind === "sum" && s.field === "amount"),
    ).toBe(true);
  });

  it("plan step targeting a missing dataset → PARTIAL", async () => {
    const result = await runAnalyticsTask({
      objective: "Analyze.",
      sources: [inlineSource("s1", "scores", "name,score\na,1")],
      plan: [
        { op: "sum", dataset: "missing", field: "score" },
        { op: "count", dataset: "s1" },
      ],
    });
    expect(result.state).toBe("PARTIAL");
    expect(result.findings.length).toBe(1);
    expect(result.evaluation.dimensions.completeness).toBe(0.5);
  });

  it("filter targeting a missing dataset → PARTIAL shortfall", async () => {
    const result = await runAnalyticsTask({
      objective: "Analyze.",
      sources: [inlineSource("s1", "scores", "name,score\na,1")],
      plan: [
        { op: "filter", dataset: "missing", field: "score", equals: 1 },
        { op: "count", dataset: "s1" },
      ],
    });
    expect(result.state).toBe("PARTIAL");
    expect(result.findings.length).toBe(1);
    expect(result.evaluation.dimensions.completeness).toBe(0.5);
  });

  it("non-integer means are formatted deterministically", async () => {
    const result = await runAnalyticsTask({
      objective: "Analyze.",
      sources: [inlineSource("s1", "scores", "name,score\na,1\nb,2")],
      plan: [{ op: "mean", dataset: "s1", field: "score" }],
    });
    expect(result.state).toBe("COMPLETED");
    expect(result.findings[0]?.text).toContain("= 1.5");
  });

  it("provider returning an unknown source id → FAILED", async () => {
    const result = await runAnalyticsTask(
      {
        objective: "Analyze.",
        sources: [inlineSource("s1", "scores", "name,score\na,1")],
      },
      {
        provider: {
          async selectSource() {
            return { id: "ghost", name: "ghost", kind: "inline", content: "x" };
          },
          async selectFindingToVerify(findings) {
            const first = findings[0];
            if (first === undefined) throw new Error("no findings");
            return first;
          },
          async decideRefinement() {
            throw new Error("not used");
          },
        },
      },
    );
    expect(result.state).toBe("FAILED");
    expect(result.report).toBeUndefined();
  });

  it("provider returning an unknown finding id → FAILED", async () => {
    const result = await runAnalyticsTask(
      {
        objective: "Analyze.",
        sources: [inlineSource("s1", "scores", "name,score\na,1")],
        plan: [{ op: "count", dataset: "s1" }],
      },
      {
        provider: {
          async selectSource(available) {
            const first = available[0];
            if (first === undefined) throw new Error("no sources");
            return first;
          },
          async selectFindingToVerify() {
            return {
              id: "ghost",
              text: "x",
              provenance: { id: "c", sourceIds: [], steps: [] },
              uncertainty: { calibrated: false },
            };
          },
          async decideRefinement() {
            throw new Error("not used");
          },
        },
      },
    );
    expect(result.state).toBe("FAILED");
  });

  it("numeric op over a non-numeric field → PARTIAL (no result)", async () => {
    const result = await runAnalyticsTask({
      objective: "Analyze.",
      sources: [inlineSource("s1", "people", "name,age\na,b\nc,d")],
      plan: [{ op: "sum", dataset: "s1", field: "age" }],
    });
    expect(result.state).toBe("PARTIAL");
    expect(result.findings).toEqual([]);
  });

  it("explicit empty plan with data → PARTIAL (no findings produced)", async () => {
    const result = await runAnalyticsTask({
      objective: "Analyze.",
      sources: [inlineSource("s1", "scores", "name,score\na,1")],
      plan: [],
    });
    expect(result.state).toBe("PARTIAL");
    expect(result.findings).toEqual([]);
    expect(result.report?.text).toContain("No analytical findings");
  });

  it("invalid plan (unknown operation) → FAILED terminal", async () => {
    const result = await runAnalyticsTask({
      objective: "Analyze.",
      sources: [inlineSource("s1", "scores", "name,score\na,1")],
      plan: [{ op: "magic", dataset: "s1" } as never],
    });
    expect(result.state).toBe("FAILED");
  });

  it("invalid source (unknown kind) → FAILED terminal", async () => {
    const result = await runAnalyticsTask({
      objective: "Analyze.",
      sources: [{ id: "s1", name: "x", kind: "magic", content: "a" } as never],
    });
    expect(result.state).toBe("FAILED");
  });

  it("source missing a name → FAILED terminal", async () => {
    const result = await runAnalyticsTask({
      objective: "Analyze.",
      sources: [{ id: "s1", kind: "inline", content: "a,1" } as never],
    });
    expect(result.state).toBe("FAILED");
  });

  it("default describe over a string-only dataset → PARTIAL", async () => {
    const result = await runAnalyticsTask({
      objective: "Analyze.",
      sources: [inlineSource("s1", "names", "name\nalpha\nbeta")],
    });
    expect(result.state).toBe("PARTIAL");
    expect(result.findings).toEqual([]);
  });

  it("non-recoverable localFile failure → FAILED terminal", async () => {
    const result = await runAnalyticsTask({
      objective: "Analyze.",
      sources: [
        {
          id: "f1",
          name: "missing.csv",
          kind: "localFile",
          path: "C:\\definitely\\missing\\nope.csv",
        },
      ],
    });
    expect(result.state).toBe("FAILED");
    expect(result.report).toBeUndefined();
    expect(result.findings).toEqual([]);
  });

  it("abstained evaluation dimensions are in [0,1] and reported", async () => {
    const result = await runAnalyticsTask({
      objective: "Analyze.",
      sources: [],
    });
    expect(result.state).toBe("ABSTAINED");
    const dims = result.evaluation.dimensions;
    expect(Object.keys(dims).length).toBe(5);
    for (const value of Object.values(dims)) {
      expect(Number(value)).toBeGreaterThanOrEqual(0);
      expect(Number(value)).toBeLessThanOrEqual(1);
    }
    expect(result.evaluation.dimensions.reproducibility).toBe(1);
  });
});
