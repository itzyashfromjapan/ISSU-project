import { isAppError } from "@issue/foundation";
import { describe, expect, it } from "vitest";
import { acquireSources } from "../src/internal/acquire.js";
import { computeOperation } from "../src/internal/compute.js";
import type { ComputationStep } from "../src/internal/compute.js";
import { buildEvaluationRecord } from "../src/internal/evaluate.js";
import type { EvaluationInput } from "../src/internal/evaluate.js";
import { isTerminalStatus } from "../src/internal/model.js";
import type {
  DatasetRef,
  FieldValue,
  ProvenanceChain,
} from "../src/internal/model.js";
import { parseContent } from "../src/internal/parse.js";
import { createDeterministicAnalyticsProviderStub } from "../src/internal/provider.js";
import { chainResolves, verifyFindings } from "../src/internal/verify.js";

const record = (id: string, fields: Record<string, FieldValue>) => ({
  id,
  fields,
});

const dataset = (
  id: string,
  records: readonly DatasetRef["records"][number][],
): DatasetRef => ({
  id,
  name: id,
  sourceIds: [id],
  records,
});

describe("Phase 5 acquisition seam errors (§16 AD-1)", () => {
  it("a missing localFile fails acquisition via the Phase 3 AD-1 adapter", async () => {
    const outcome = await acquireSources(
      [
        {
          id: "f1",
          name: "missing.csv",
          kind: "localFile",
          path: "C:\\definitely\\missing\\nope.csv",
        },
      ],
      undefined,
      undefined,
    );
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(isAppError(outcome.error)).toBe(true);
      expect(outcome.error.code).toBe("issue.tool.read.notfound");
    }
  });
});

describe("Phase 5 lifecycle statuses (§4)", () => {
  it("terminal statuses are recognized", () => {
    expect(isTerminalStatus("COMPLETED")).toBe(true);
    expect(isTerminalStatus("PARTIAL")).toBe(true);
    expect(isTerminalStatus("ABSTAINED")).toBe(true);
    expect(isTerminalStatus("FAILED")).toBe(true);
    expect(isTerminalStatus("CANCELLED")).toBe(true);
    expect(isTerminalStatus("PLANNING")).toBe(false);
    expect(isTerminalStatus("REPLANNING")).toBe(false);
  });
});

describe("Phase 5 parseContent (§5 normalization)", () => {
  it("empty and header-only content yield no records", () => {
    expect(parseContent("")).toEqual([]);
    expect(parseContent("   \n  \n")).toEqual([]);
    expect(parseContent("name,score")).toEqual([]);
  });

  it("parses numbers, booleans, nulls, and quoted strings", () => {
    const records = parseContent(
      "name,active,score,note\n" +
        'alpha,true,10,"hello, world"\n' +
        "beta,false,-2.5,\n" +
        "gamma,maybe,3,plain",
    );
    expect(records.length).toBe(3);
    expect(records[0]?.fields).toEqual({
      name: "alpha",
      active: true,
      score: 10,
      note: "hello, world",
    });
    expect(records[1]?.fields).toEqual({
      name: "beta",
      active: false,
      score: -2.5,
      note: null,
    });
    expect(records[2]?.fields).toEqual({
      name: "gamma",
      active: "maybe",
      score: 3,
      note: "plain",
    });
  });
});

describe("Phase 5 computeOperation (§5 analytical computation)", () => {
  it("count on an empty dataset returns 0", () => {
    const step: ComputationStep = { op: "count", dataset: "d1" };
    expect(computeOperation(step, dataset("d1", []))).toEqual({
      kind: "count",
      value: 0,
    });
  });

  it("sum/mean/min/max return undefined when no numeric values exist", () => {
    const d = dataset("d1", [record("r1", { name: "x" })]);
    expect(
      computeOperation({ op: "sum", dataset: "d1", field: "score" }, d),
    ).toBeUndefined();
    expect(
      computeOperation({ op: "mean", dataset: "d1", field: "score" }, d),
    ).toBeUndefined();
    expect(
      computeOperation({ op: "min", dataset: "d1", field: "score" }, d),
    ).toBeUndefined();
    expect(
      computeOperation({ op: "max", dataset: "d1", field: "score" }, d),
    ).toBeUndefined();
  });

  it("sum/mean/min/max compute over numeric values", () => {
    const d = dataset("d1", [
      record("r1", { score: 4 }),
      record("r2", { score: 8 }),
      record("r3", { score: 6 }),
    ]);
    expect(
      computeOperation({ op: "sum", dataset: "d1", field: "score" }, d),
    ).toEqual({ kind: "scalar", value: 18 });
    expect(
      computeOperation({ op: "mean", dataset: "d1", field: "score" }, d),
    ).toEqual({ kind: "scalar", value: 6 });
    expect(
      computeOperation({ op: "min", dataset: "d1", field: "score" }, d),
    ).toEqual({ kind: "scalar", value: 4 });
    expect(
      computeOperation({ op: "max", dataset: "d1", field: "score" }, d),
    ).toEqual({ kind: "scalar", value: 8 });
  });

  it("describe is undefined with no numeric fields and returns rows otherwise", () => {
    expect(
      computeOperation(
        { op: "describe", dataset: "d1" },
        dataset("d1", [record("r1", { name: "x" })]),
      ),
    ).toBeUndefined();
    const described = computeOperation(
      { op: "describe", dataset: "d1" },
      dataset("d1", [record("r1", { score: 2 }), record("r2", { score: 4 })]),
    );
    expect(described?.kind).toBe("table");
    if (described?.kind === "table") {
      const byLabel = new Map(described.rows.map((r) => [r.label, r.value]));
      expect(byLabel.get("score.count")).toBe(2);
      expect(byLabel.get("score.mean")).toBe(3);
      expect(byLabel.get("score.sum")).toBe(6);
    }
  });
});

describe("Phase 5 chainResolves / verifyFindings (§6)", () => {
  const transforms = [
    {
      id: "transform-1",
      kind: "parse",
      inputDatasetIds: [],
      outputDatasetId: "d1",
      description: "parse",
    },
  ];
  const datasets = [dataset("d1", [record("r1", { score: 1 })])];
  const knownSources = new Set(["d1"]);

  it("a valid chain resolves", () => {
    const chain: ProvenanceChain = {
      id: "chain-1",
      sourceIds: ["d1"],
      steps: [
        { kind: "parse", ref: "transform-1" },
        { kind: "sum", ref: "d1", field: "score" },
      ],
    };
    expect(chainResolves(chain, knownSources, datasets, transforms)).toBe(true);
  });

  it("an unknown source fails resolution", () => {
    const chain: ProvenanceChain = {
      id: "chain-2",
      sourceIds: ["ghost"],
      steps: [{ kind: "sum", ref: "d1", field: "score" }],
    };
    expect(chainResolves(chain, knownSources, datasets, transforms)).toBe(
      false,
    );
  });

  it("an unresolved transform step fails resolution", () => {
    const chain: ProvenanceChain = {
      id: "chain-3",
      sourceIds: ["d1"],
      steps: [{ kind: "filter", ref: "transform-99" }],
    };
    expect(chainResolves(chain, knownSources, datasets, transforms)).toBe(
      false,
    );
  });

  it("a numeric op referencing a missing field fails resolution", () => {
    const chain: ProvenanceChain = {
      id: "chain-4",
      sourceIds: ["d1"],
      steps: [{ kind: "sum", ref: "d1", field: "nope" }],
    };
    expect(chainResolves(chain, knownSources, datasets, transforms)).toBe(
      false,
    );
  });

  it("verifyFindings keeps only resolving findings", () => {
    const findings = [
      {
        id: "finding-1",
        text: "ok",
        provenance: {
          id: "chain-1",
          sourceIds: ["d1"],
          steps: [{ kind: "sum", ref: "d1", field: "score" }],
        },
        uncertainty: { calibrated: false },
      },
      {
        id: "finding-2",
        text: "bad",
        provenance: {
          id: "chain-2",
          sourceIds: ["ghost"],
          steps: [{ kind: "sum", ref: "d1", field: "score" }],
        },
        uncertainty: { calibrated: false },
      },
    ];
    const outcome = verifyFindings(
      findings,
      knownSources,
      datasets,
      transforms,
    );
    expect(outcome.verifiedCount).toBe(1);
    expect(outcome.verified[0]?.id).toBe("finding-1");
  });
});

describe("Phase 5 provider stub (§16)", () => {
  it("selectSource and selectFindingToVerify throw on empty sets", async () => {
    const provider = createDeterministicAnalyticsProviderStub();
    await expect(
      provider.selectSource([], { status: "ACQUIRING" }),
    ).rejects.toThrow("non-empty available");
    await expect(
      provider.selectFindingToVerify([], { status: "VERIFYING" }),
    ).rejects.toThrow("non-empty findings");
  });

  it("decideRefinement is rejected by the deterministic core", async () => {
    const provider = createDeterministicAnalyticsProviderStub();
    await expect(
      provider.decideRefinement([{ id: "r1", description: "x" }], {
        status: "REPLANNING",
      }),
    ).rejects.toThrow("no refinement capability");
  });
});

describe("Phase 5 buildEvaluationRecord (§10)", () => {
  const base: EvaluationInput = {
    state: "COMPLETED",
    plannedUnits: 3,
    producedUnits: 3,
    totalFindings: 3,
    verifiedCount: 3,
    abstained: false,
    reportPresent: true,
  };

  it("scores all five fixed dimensions in [0,1]", () => {
    const record = buildEvaluationRecord(base);
    expect(Object.keys(record.dimensions).length).toBe(5);
    for (const value of Object.values(record.dimensions)) {
      expect(Number(value)).toBeGreaterThanOrEqual(0);
      expect(Number(value)).toBeLessThanOrEqual(1);
    }
    expect(record.method).toBe("automated");
  });

  it("partial results lower correctness and completeness", () => {
    const record = buildEvaluationRecord({
      ...base,
      state: "PARTIAL",
      producedUnits: 1,
      verifiedCount: 1,
    });
    expect(record.dimensions.completeness).toBeCloseTo(1 / 3);
    expect(record.dimensions.correctness).toBeCloseTo(1 / 3);
  });

  it("abstention reports no assertion", () => {
    const record = buildEvaluationRecord({
      state: "ABSTAINED",
      plannedUnits: 0,
      producedUnits: 0,
      totalFindings: 0,
      verifiedCount: 0,
      abstained: true,
      reportPresent: true,
    });
    expect(record.dimensions.correctness).toBe(0.5);
    expect(record.dimensions.completeness).toBe(0.5);
    expect(record.dimensions.confidenceUncertainty).toBe(0.5);
  });
});
