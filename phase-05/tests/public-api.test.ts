import { describe, expect, expectTypeOf, it } from "vitest";
import * as analytics from "../src/index.js";
import type {
  AnalyticalFinding,
  AnalyticalReport,
  AnalyticsDecisionProvider,
  AnalyticsEvaluationRecord,
  AnalyticsTaskOptions,
  AnalyticsTaskRequest,
  AnalyticsTaskResult,
  AnalyticsTaskStatus,
  DataSourceRef,
  DatasetRef,
  ProvenanceChain,
  TransformRecord,
  UncertaintyInfo,
} from "../src/index.js";

describe("Phase 5 public barrel (§2)", () => {
  it("exports exactly the public values and nothing else", () => {
    expect(Object.keys(analytics).sort()).toEqual(["runAnalyticsTask"]);
  });

  it("AnalyticsTaskRequest type (§3)", () => {
    expectTypeOf<AnalyticsTaskRequest>().toEqualTypeOf<{
      readonly objective: string;
      readonly sources: readonly {
        readonly id: string;
        readonly name: string;
        readonly kind: "inline" | "localFile";
        readonly path?: string;
        readonly content?: string;
      }[];
      readonly plan?: readonly (
        | {
            readonly op: "filter";
            readonly dataset: string;
            readonly field: string;
            readonly equals: string | number | boolean;
          }
        | { readonly op: "describe"; readonly dataset: string }
        | { readonly op: "count"; readonly dataset: string }
        | {
            readonly op: "sum" | "mean" | "min" | "max";
            readonly dataset: string;
            readonly field: string;
          }
      )[];
    }>();
  });

  it("AnalyticsTaskOptions type (§3)", () => {
    expectTypeOf<AnalyticsTaskOptions>().toMatchTypeOf<{
      readonly logger?: object;
      readonly provider?: AnalyticsDecisionProvider;
      readonly signal?: AbortSignal;
      readonly bounds?: {
        readonly maxRetries: number;
        readonly maxCorrections: number;
        readonly maxVerifications: number;
        readonly maxBytesPerRead: number;
        readonly chunkSize: number;
      };
    }>();
  });

  it("AnalyticsTaskStatus is the §4 union", () => {
    expectTypeOf<AnalyticsTaskStatus>().toEqualTypeOf<
      | "READY"
      | "PLANNING"
      | "ACQUIRING"
      | "PREPARING"
      | "ANALYZING"
      | "INTERPRETING"
      | "VERIFYING"
      | "EVALUATING"
      | "REPLANNING"
      | "COMPLETED"
      | "PARTIAL"
      | "ABSTAINED"
      | "FAILED"
      | "CANCELLED"
    >();
  });

  it("AnalyticsTaskResult type (§3)", () => {
    expectTypeOf<AnalyticsTaskResult>().toMatchTypeOf<{
      readonly state: AnalyticsTaskStatus;
      readonly report?: AnalyticalReport;
      readonly findings: readonly AnalyticalFinding[];
      readonly provenance: readonly ProvenanceChain[];
      readonly uncertainty: readonly UncertaintyInfo[];
      readonly evaluation: AnalyticsEvaluationRecord;
      readonly abstained?: boolean;
    }>();
  });

  it("DataSourceRef type (§3.1)", () => {
    expectTypeOf<DataSourceRef>().toEqualTypeOf<{
      readonly id: string;
      readonly name: string;
      readonly kind: "inline" | "localFile";
      readonly path?: string;
      readonly content?: string;
    }>();
  });

  it("DatasetRef type (§3.2)", () => {
    expectTypeOf<DatasetRef>().toEqualTypeOf<{
      readonly id: string;
      readonly name: string;
      readonly sourceIds: readonly string[];
      readonly records: readonly {
        readonly id: string;
        readonly fields: Readonly<
          Record<string, string | number | boolean | null>
        >;
      }[];
    }>();
  });

  it("ProvenanceChain type (§7)", () => {
    expectTypeOf<ProvenanceChain>().toEqualTypeOf<{
      readonly id: string;
      readonly sourceIds: readonly string[];
      readonly steps: readonly {
        readonly kind: string;
        readonly ref: string;
        readonly description?: string;
        readonly field?: string;
      }[];
    }>();
  });

  it("TransformRecord type (§5.2)", () => {
    expectTypeOf<TransformRecord>().toEqualTypeOf<{
      readonly id: string;
      readonly kind: string;
      readonly inputDatasetIds: readonly string[];
      readonly outputDatasetId: string;
      readonly description: string;
    }>();
  });

  it("AnalyticalFinding type (§5)", () => {
    expectTypeOf<AnalyticalFinding>().toEqualTypeOf<{
      readonly id: string;
      readonly text: string;
      readonly provenance: ProvenanceChain;
      readonly uncertainty: UncertaintyInfo;
    }>();
  });

  it("AnalyticalReport type (§11)", () => {
    expectTypeOf<AnalyticalReport>().toEqualTypeOf<{
      readonly id: string;
      readonly text: string;
      readonly findingIds: readonly string[];
    }>();
  });

  it("UncertaintyInfo type (§8)", () => {
    expectTypeOf<UncertaintyInfo>().toEqualTypeOf<{
      readonly confidence?: number;
      readonly calibrated: boolean;
      readonly method?: string;
      readonly note?: string;
    }>();
  });

  it("AnalyticsEvaluationRecord type (§10) with the fixed 5-dimension set", () => {
    expectTypeOf<AnalyticsEvaluationRecord>().toEqualTypeOf<{
      readonly dimensions: Record<
        | "correctness"
        | "completeness"
        | "provenance"
        | "confidenceUncertainty"
        | "reproducibility",
        number
      >;
      readonly dimensionNotes?: Record<
        | "correctness"
        | "completeness"
        | "provenance"
        | "confidenceUncertainty"
        | "reproducibility",
        string
      >;
      readonly method: "automated" | "human" | "hybrid";
    }>();
  });

  it("AnalyticsDecisionProvider interface (§16)", () => {
    expectTypeOf<AnalyticsDecisionProvider>().toEqualTypeOf<{
      selectSource(
        available: readonly DataSourceRef[],
        state: { readonly status: AnalyticsTaskStatus },
      ): Promise<DataSourceRef>;
      selectFindingToVerify(
        findings: readonly AnalyticalFinding[],
        state: { readonly status: AnalyticsTaskStatus },
      ): Promise<AnalyticalFinding>;
      decideRefinement(
        refinements: readonly {
          readonly id: string;
          readonly description: string;
        }[],
        state: { readonly status: AnalyticsTaskStatus },
      ): Promise<{ readonly id: string; readonly description: string }>;
    }>();
  });

  it("runAnalyticsTask signature", () => {
    expectTypeOf<typeof analytics.runAnalyticsTask>().toEqualTypeOf<
      (
        request: AnalyticsTaskRequest,
        options?: AnalyticsTaskOptions,
      ) => Promise<AnalyticsTaskResult>
    >();
  });

  it("no internal module is exported from the public barrel", () => {
    expect("machine" in analytics).toBe(false);
    expect("model" in analytics).toBe(false);
    expect("provider" in analytics).toBe(false);
    expect("acquire" in analytics).toBe(false);
    expect("prepare" in analytics).toBe(false);
    expect("compute" in analytics).toBe(false);
    expect("interpret" in analytics).toBe(false);
    expect("verify" in analytics).toBe(false);
    expect("evaluate" in analytics).toBe(false);
    expect("report" in analytics).toBe(false);
    for (const key of Object.keys(analytics)) {
      expect(key.includes("internal")).toBe(false);
    }
  });
});
