import { describe, expect, it } from "vitest";
import { verifyClaims } from "../src/internal/claims.js";
import { detectConflicts } from "../src/internal/conflicts.js";
import {
  buildEvaluationRecord,
  buildSourceReferences,
} from "../src/internal/evaluate.js";
import type { SourceReference } from "../src/internal/model.js";
import { createDeterministicResearchProviderStub } from "../src/internal/provider.js";

const source = (id: string): SourceReference => ({
  id,
  title: id,
  role: "primary",
  freshness: "unknown",
  credibility: {
    sourceId: id,
    dimensions: {
      expertise: 0.5,
      trustworthiness: 0.5,
      bias: 0.5,
      transparency: 0.5,
      date: 0.5,
      provenance: 0.5,
    },
  },
});

describe("Phase 4 provider stub (§12.4)", () => {
  it("selectSource and selectClaimToVerify throw on empty sets", async () => {
    const provider = createDeterministicResearchProviderStub();
    await expect(
      provider.selectSource([], { status: "RETRIEVING" }),
    ).rejects.toThrow("non-empty available");
    await expect(
      provider.selectClaimToVerify([], { status: "VERIFYING" }),
    ).rejects.toThrow("non-empty claims");
  });

  it("assess maps secondary-only links to PARTIALLY_SUPPORTED", async () => {
    const provider = createDeterministicResearchProviderStub();
    const s1 = source("src-1");
    const claim = {
      id: "claim-1",
      text: "The system is fast.",
      support: "SUPPORTED" as const,
      sources: [s1],
    };
    const evidence = [
      {
        claimId: "claim-1",
        sourceId: "src-1",
        kind: "secondary" as const,
        strength: "PARTIALLY_SUPPORTED" as const,
      },
    ];
    const assessment = await provider.assess(claim, evidence, {
      status: "VERIFYING",
    });
    expect(assessment.support).toBe("PARTIALLY_SUPPORTED");
  });
});

describe("Phase 4 verifyClaims (§12.5)", () => {
  it("claims without evidence are reclassified UNSUPPORTED", () => {
    const s1 = source("src-1");
    const claims = [
      {
        id: "claim-1",
        text: "No evidence here.",
        support: "SUPPORTED" as const,
        sources: [s1],
      },
    ];
    const verified = verifyClaims(claims, [], new Set(["src-1"]));
    expect(verified[0]?.support).toBe("UNSUPPORTED");
  });

  it("claims with only secondary evidence are reclassified UNCERTAIN", () => {
    const s1 = source("src-1");
    const claims = [
      {
        id: "claim-1",
        text: "Heard via intermediary.",
        support: "SUPPORTED" as const,
        sources: [s1],
      },
    ];
    const evidence = [
      {
        claimId: "claim-1",
        sourceId: "src-1",
        kind: "secondary" as const,
        strength: "SUPPORTED" as const,
      },
    ];
    const verified = verifyClaims(claims, evidence, new Set(["src-1"]));
    expect(verified[0]?.support).toBe("UNCERTAIN");
  });
});

describe("Phase 4 detectConflicts (§12.7)", () => {
  it("non-SUPPORTED claims produce gap records", () => {
    const s1 = source("src-1");
    const claims = [
      {
        id: "claim-1",
        text: "Unsupported claim.",
        support: "UNSUPPORTED" as const,
        sources: [s1],
      },
    ];
    const conflicts = detectConflicts(claims);
    expect(conflicts.some((c) => c.kind === "gap")).toBe(true);
  });

  it("claims sharing a source are not contradictions", () => {
    const s1 = source("src-1");
    const claims = [
      {
        id: "claim-1",
        text: "The sky is blue.",
        support: "SUPPORTED" as const,
        sources: [s1],
      },
      {
        id: "claim-2",
        text: "The sky is not blue.",
        support: "SUPPORTED" as const,
        sources: [s1],
      },
    ];
    const conflicts = detectConflicts(claims);
    expect(conflicts.some((c) => c.kind === "contradiction")).toBe(false);
  });
});

describe("Phase 4 buildSourceReferences / evaluation", () => {
  it("builds deterministic source references", () => {
    const refs = buildSourceReferences([
      { path: "a.txt", title: "a.txt", content: "x", bytesRead: 1 },
    ]);
    expect(refs[0]).toMatchObject({
      id: "src-1",
      title: "a.txt",
      role: "primary",
      freshness: "unknown",
    });
    expect(refs[0]?.credibility.dimensions.expertise).toBe(0.5);
  });

  it("evaluation sourceQuality drops when not all targets retrieved", () => {
    const record = buildEvaluationRecord({
      state: "PARTIAL",
      claims: [],
      evidence: [],
      sources: [],
      conflicts: [],
      abstained: true,
      requestedTargets: 3,
      retrievedTargets: 1,
      report: "report",
    });
    expect(record.dimensions.sourceQuality).toBe(0.5);
    expect(record.dimensions.recallCompleteness).toBeLessThan(1);
  });

  it("failed evaluation reports failureTolerance 0", () => {
    const record = buildEvaluationRecord({
      state: "FAILED",
      claims: [],
      evidence: [],
      sources: [],
      conflicts: [],
      abstained: false,
      requestedTargets: 0,
      retrievedTargets: 0,
      report: undefined,
    });
    expect(record.dimensions.failureTolerance).toBe(0);
  });
});
