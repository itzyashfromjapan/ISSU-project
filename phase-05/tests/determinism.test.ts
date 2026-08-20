import { describe, expect, it } from "vitest";
import { runAnalyticsTask } from "../src/index.js";

describe("Phase 5 deterministic core — determinism (§6, §15)", () => {
  it("identical inputs produce identical results", async () => {
    const request = {
      objective: "Analyze the scores.",
      sources: [
        {
          id: "s1",
          name: "scores",
          kind: "inline" as const,
          content: "name,score\nalpha,10\nbeta,20\n",
        },
      ],
      plan: [
        { op: "sum", dataset: "s1", field: "score" },
        { op: "mean", dataset: "s1", field: "score" },
      ],
    } as const;

    const a = await runAnalyticsTask({ ...request });
    const b = await runAnalyticsTask({ ...request });

    expect(a.state).toBe("COMPLETED");
    expect(b.state).toBe("COMPLETED");
    expect(a).toEqual(b);
    expect(a.report).toEqual(b.report);
    expect(a.findings).toEqual(b.findings);
    expect(a.provenance).toEqual(b.provenance);
    expect(a.uncertainty).toEqual(b.uncertainty);
    expect(a.evaluation).toEqual(b.evaluation);
    expect(a.evaluation.dimensions.reproducibility).toBe(1);
  });
});
