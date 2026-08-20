import { createLogger } from "@issue/foundation";
import { describe, expect, it } from "vitest";
import { runAnalyticsTask } from "../src/index.js";
import {
  makeRoot,
  recordingAnalyticsProvider,
  removeRoot,
  writeFixture,
} from "./helpers.js";

const inlineSource = (id: string, name: string, content: string) => ({
  id,
  name,
  kind: "inline" as const,
  content,
});

describe("Phase 5 lifecycle (§4, §9)", () => {
  it("no data sources → abstention, terminal ABSTAINED, abstained=true", async () => {
    const result = await runAnalyticsTask({
      objective: "Analyze this.",
      sources: [],
    });
    expect(result.state).toBe("ABSTAINED");
    expect(result.abstained).toBe(true);
    expect(result.findings).toEqual([]);
    expect(result.provenance).toEqual([]);
    expect(result.uncertainty).toEqual([]);
    expect(result.report).toBeDefined();
    expect(result.report?.text).toContain("abstained");
    expect(result.evaluation.method).toBe("automated");
  });

  it("header-only dataset → abstention, terminal ABSTAINED", async () => {
    const result = await runAnalyticsTask({
      objective: "Analyze.",
      sources: [inlineSource("s1", "empty", "name,score")],
    });
    expect(result.state).toBe("ABSTAINED");
    expect(result.abstained).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it("valid inline data + default plan → COMPLETED with describe findings", async () => {
    const result = await runAnalyticsTask({
      objective: "Summarize scores.",
      sources: [inlineSource("s1", "scores", "name,score\nalpha,10\nbeta,20")],
    });
    expect(result.state).toBe("COMPLETED");
    expect(result.abstained).toBeUndefined();
    expect(result.findings.length).toBe(1);
    const finding = result.findings[0];
    expect(finding?.text).toContain("score.count=2");
    expect(finding?.text).toContain("score.sum=30");
    expect(finding?.provenance.sourceIds).toEqual(["s1"]);
    expect(finding?.provenance.steps.some((s) => s.kind === "parse")).toBe(
      true,
    );
    expect(finding?.provenance.steps.some((s) => s.kind === "describe")).toBe(
      true,
    );
    expect(finding?.uncertainty.calibrated).toBe(false);
    expect(result.report?.findingIds).toEqual([finding?.id]);
    expect(result.evaluation.dimensions.reproducibility).toBe(1);
  });

  it("explicit plan with count/sum/mean/min/max → COMPLETED", async () => {
    const result = await runAnalyticsTask({
      objective: "Compute stats.",
      sources: [
        inlineSource("s1", "scores", "name,score\nalpha,10\nbeta,20\ngamma,30"),
      ],
      plan: [
        { op: "count", dataset: "s1" },
        { op: "sum", dataset: "s1", field: "score" },
        { op: "mean", dataset: "s1", field: "score" },
        { op: "min", dataset: "s1", field: "score" },
        { op: "max", dataset: "s1", field: "score" },
      ],
    });
    expect(result.state).toBe("COMPLETED");
    expect(result.findings.length).toBe(5);
    const texts = result.findings.map((f) => f.text);
    expect(texts).toContain('Count of records in dataset "s1" = 3');
    expect(texts).toContain('Sum of "score" across dataset "s1" = 60');
    expect(texts).toContain('Mean of "score" across dataset "s1" = 20');
    expect(texts).toContain('Minimum of "score" across dataset "s1" = 10');
    expect(texts).toContain('Maximum of "score" across dataset "s1" = 30');
    expect(result.evaluation.dimensions.completeness).toBe(1);
  });

  it("invalid request → FAILED terminal", async () => {
    const result = await runAnalyticsTask({ objective: "", sources: [] });
    expect(result.state).toBe("FAILED");
    expect(result.report).toBeUndefined();
    expect(result.findings).toEqual([]);
  });

  it("pre-aborted signal → CANCELLED terminal", async () => {
    const controller = new AbortController();
    controller.abort();
    const result = await runAnalyticsTask(
      {
        objective: "Analyze.",
        sources: [inlineSource("s1", "x", "name,score\na,1")],
      },
      { signal: controller.signal },
    );
    expect(result.state).toBe("CANCELLED");
    expect(result.report).toBeUndefined();
    expect(result.findings).toEqual([]);
  });

  it("custom provider seam is consulted during the run", async () => {
    const provider = recordingAnalyticsProvider({
      async selectSource(available) {
        const first = available[0];
        if (first === undefined) throw new Error("no sources");
        return first;
      },
      async selectFindingToVerify(findings) {
        const first = findings[0];
        if (first === undefined) throw new Error("no findings");
        return first;
      },
      async decideRefinement() {
        throw new Error("not used");
      },
    });
    const result = await runAnalyticsTask(
      {
        objective: "Analyze.",
        sources: [inlineSource("s1", "scores", "name,score\na,1\nb,2")],
      },
      { provider: provider.provider },
    );
    expect(result.state).toBe("COMPLETED");
    expect(provider.calls.selectSource).toBeGreaterThanOrEqual(1);
    expect(provider.calls.selectFindingToVerify).toBeGreaterThanOrEqual(1);
  });

  it("logger is accepted as an option", async () => {
    const logger = createLogger({ level: "error" });
    const result = await runAnalyticsTask(
      {
        objective: "Analyze.",
        sources: [inlineSource("s1", "scores", "name,score\na,1")],
      },
      { logger },
    );
    expect(result.state).toBe("COMPLETED");
  });

  it("localFile source is read through the Phase 2/3 seam", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "data.csv", "name,score\na,5\nb,15");
      const result = await runAnalyticsTask({
        objective: "Read the file.",
        sources: [
          {
            id: "f1",
            name: "data.csv",
            kind: "localFile",
            path: root + "\\data.csv",
          },
        ],
        plan: [{ op: "sum", dataset: "f1", field: "score" }],
      });
      expect(result.state).toBe("COMPLETED");
      expect(result.findings[0]?.text).toContain("= 20");
      expect(result.findings[0]?.provenance.sourceIds).toEqual(["f1"]);
    } finally {
      await removeRoot(root);
    }
  });
});
