import { describe, expect, expectTypeOf, it } from "vitest";
import * as research from "../src/index.js";
import type {
  Claim,
  ConflictRecord,
  CredibilityProfile,
  EvaluationRecord,
  EvidenceLink,
  ResearchDecisionProvider,
  ResearchTaskOptions,
  ResearchTaskRequest,
  ResearchTaskResult,
  ResearchTaskStatus,
  SourceReference,
  SupportClass,
} from "../src/index.js";

type CredibilityDimensionKey =
  | "expertise"
  | "trustworthiness"
  | "bias"
  | "transparency"
  | "date"
  | "provenance";

type EvaluationDimensionKey =
  | "factualCorrectness"
  | "claimSupport"
  | "citationAccuracy"
  | "citationCompleteness"
  | "sourceQuality"
  | "traceability"
  | "contradictionHandling"
  | "uncertainty"
  | "calibration"
  | "abstention"
  | "recallCompleteness"
  | "reasoningQuality"
  | "reportQuality"
  | "humanAssessment"
  | "reproducibility"
  | "freshness"
  | "costLatency"
  | "failureTolerance";

describe("Phase 4 public barrel (§4)", () => {
  it("exports exactly the public values and nothing else", () => {
    expect(Object.keys(research).sort()).toEqual([
      "VERSION",
      "runResearchTask",
    ]);
  });

  it("VERSION is defined", () => {
    expect(typeof research.VERSION).toBe("string");
    expect(research.VERSION.length).toBeGreaterThan(0);
  });

  it("ResearchTaskRequest type (§8.1)", () => {
    expectTypeOf<ResearchTaskRequest>().toEqualTypeOf<{
      readonly prompt: string;
      readonly refs?: {
        readonly files: readonly string[];
        readonly directories: readonly string[];
      };
      readonly includeHidden?: boolean;
      readonly bounds?: {
        readonly maxRetries: number;
        readonly maxCorrections: number;
        readonly maxVerifications: number;
        readonly maxBytesPerRead: number;
        readonly chunkSize: number;
      };
    }>();
  });

  it("ResearchTaskOptions type (§12.1)", () => {
    expectTypeOf<ResearchTaskOptions>().toMatchTypeOf<{
      readonly logger?: object;
      readonly provider?: ResearchDecisionProvider;
      readonly signal?: AbortSignal;
    }>();
  });

  it("ResearchTaskStatus is the §11 union", () => {
    expectTypeOf<ResearchTaskStatus>().toEqualTypeOf<
      | "READY"
      | "PLANNING"
      | "RETRIEVING"
      | "EVALUATING_SOURCES"
      | "SYNTHESIZING"
      | "VERIFYING"
      | "EVALUATING"
      | "REPLANNING"
      | "COMPLETED"
      | "PARTIAL"
      | "FAILED"
      | "CANCELLED"
    >();
  });

  it("SupportClass is the §10.2 union", () => {
    expectTypeOf<SupportClass>().toEqualTypeOf<
      "SUPPORTED" | "PARTIALLY_SUPPORTED" | "UNSUPPORTED" | "UNCERTAIN"
    >();
  });

  it("ResearchTaskResult type (§8.6)", () => {
    expectTypeOf<ResearchTaskResult>().toMatchTypeOf<{
      readonly state: ResearchTaskStatus;
      readonly report?: string;
      readonly claims: readonly Claim[];
      readonly evidence: readonly EvidenceLink[];
      readonly sources: readonly SourceReference[];
      readonly conflicts: readonly ConflictRecord[];
      readonly evaluation: EvaluationRecord;
      readonly abstained?: boolean;
    }>();
  });

  it("Claim type (§8.2)", () => {
    expectTypeOf<Claim>().toEqualTypeOf<{
      readonly id: string;
      readonly text: string;
      readonly support: SupportClass;
      readonly confidence?: number;
      readonly abstained?: boolean;
      readonly sources: readonly SourceReference[];
    }>();
  });

  it("EvidenceLink type (§8.3)", () => {
    expectTypeOf<EvidenceLink>().toEqualTypeOf<{
      readonly claimId: string;
      readonly sourceId: string;
      readonly location?: string;
      readonly kind: "direct" | "secondary";
      readonly strength: SupportClass;
    }>();
  });

  it("SourceReference type (§8.4)", () => {
    expectTypeOf<SourceReference>().toEqualTypeOf<{
      readonly id: string;
      readonly title: string;
      readonly organization?: string;
      readonly authors?: readonly string[];
      readonly publishedAt?: string;
      readonly url?: string;
      readonly role: "primary" | "secondary";
      readonly freshness: "current" | "stale" | "unknown";
      readonly credibility: CredibilityProfile;
    }>();
  });

  it("CredibilityProfile type (§8.5) with the fixed 6-dimension set", () => {
    expectTypeOf<CredibilityProfile>().toEqualTypeOf<{
      readonly sourceId: string;
      readonly dimensions: Record<CredibilityDimensionKey, number>;
      readonly dimensionNotes?: Record<CredibilityDimensionKey, string>;
    }>();
  });

  it("ConflictRecord type (§8.7)", () => {
    expectTypeOf<ConflictRecord>().toEqualTypeOf<{
      readonly id: string;
      readonly kind: "contradiction" | "gap" | "weak-signal";
      readonly claimIds: readonly string[];
      readonly sourceIds: readonly string[];
      readonly description: string;
    }>();
  });

  it("EvaluationRecord type (§8.8) with the fixed 18-dimension set", () => {
    expectTypeOf<EvaluationRecord>().toEqualTypeOf<{
      readonly dimensions: Record<EvaluationDimensionKey, number>;
      readonly dimensionNotes?: Record<EvaluationDimensionKey, string>;
      readonly method: "automated" | "human" | "hybrid";
    }>();
  });

  it("ResearchDecisionProvider interface (§12.4)", () => {
    expectTypeOf<ResearchDecisionProvider>().toEqualTypeOf<{
      selectSource(
        available: readonly SourceReference[],
        state: { readonly status: ResearchTaskStatus },
      ): Promise<SourceReference>;
      selectClaimToVerify(
        claims: readonly Claim[],
        state: { readonly status: ResearchTaskStatus },
      ): Promise<Claim>;
      assess(
        claim: Claim,
        evidence: readonly EvidenceLink[],
        state: { readonly status: ResearchTaskStatus },
      ): Promise<{ readonly support: SupportClass }>;
    }>();
  });

  it("runResearchTask signature (§12.1)", () => {
    expectTypeOf<typeof research.runResearchTask>().toEqualTypeOf<
      (
        request: ResearchTaskRequest,
        options?: ResearchTaskOptions,
      ) => Promise<ResearchTaskResult>
    >();
  });

  it("no internal module is exported from the public barrel", () => {
    expect("machine" in research).toBe(false);
    expect("model" in research).toBe(false);
    expect("provider" in research).toBe(false);
    expect("retrieval" in research).toBe(false);
    expect("claims" in research).toBe(false);
    expect("conflicts" in research).toBe(false);
    expect("synthesize" in research).toBe(false);
    expect("evaluate" in research).toBe(false);
    for (const key of Object.keys(research)) {
      expect(key.includes("internal")).toBe(false);
    }
  });
});
