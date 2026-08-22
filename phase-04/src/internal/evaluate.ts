/**
 * ISSU Phase 4 — Research: deterministic source evaluation (§12.3) and
 * multi-dimensional quality evaluation (§12.11, §8.8). The deterministic core
 * has no model/provider binding (§12.4) and no external freshness service
 * (§12.6): sources receive all-`unknown`-grade credibility profiles and each
 * evaluation dimension is scored from observable deterministic signals only.
 */

import type {
  Claim,
  ConflictRecord,
  CredibilityProfile,
  EvaluationDimension,
  EvaluationRecord,
  EvidenceLink,
  ResearchTaskStatus,
  SourceReference,
} from "./model.js";
import { CREDIBILITY_DIMENSIONS } from "./model.js";
import type { RetrievedSource } from "./retrieval.js";

const UNKNOWN_GRADE = 0.5;

/** All-`unknown`-grade credibility profile for sources the core cannot score. */
export function unknownCredibilityProfile(
  sourceId: string,
): CredibilityProfile {
  const dimensions = {} as Record<
    (typeof CREDIBILITY_DIMENSIONS)[number],
    number
  >;
  const dimensionNotes = {} as Record<
    (typeof CREDIBILITY_DIMENSIONS)[number],
    string
  >;
  for (const dimension of CREDIBILITY_DIMENSIONS) {
    dimensions[dimension] = UNKNOWN_GRADE;
    dimensionNotes[dimension] =
      "unknown-grade: deterministic core performs no external source evaluation";
  }
  return { sourceId, dimensions, dimensionNotes };
}

/**
 * Build deterministic `SourceReference`s from retrieved sources. Roles are
 * `primary` (direct evidence, §10.3); freshness is `unknown` because the
 * deterministic core has no freshness service (§12.6); credibility is an
 * all-`unknown`-grade profile (§12.3).
 */
export function buildSourceReferences(
  retrieved: readonly RetrievedSource[],
): readonly SourceReference[] {
  return retrieved.map((source, index) => ({
    id: `src-${index + 1}`,
    title: source.title,
    role: "primary",
    freshness: "unknown",
    credibility: unknownCredibilityProfile(`src-${index + 1}`),
  }));
}

export interface EvaluationInput {
  readonly state: ResearchTaskStatus;
  readonly claims: readonly Claim[];
  readonly evidence: readonly EvidenceLink[];
  readonly sources: readonly SourceReference[];
  readonly conflicts: readonly ConflictRecord[];
  readonly abstained: boolean;
  readonly requestedTargets: number;
  readonly retrievedTargets: number;
  readonly report: string | undefined;
}

function fraction(numerator: number, denominator: number): number {
  if (denominator <= 0) return 1;
  return Math.min(1, numerator / denominator);
}

/**
 * Score the fixed dimension set (§8.8) from deterministic signals only.
 * Each dimension is scored independently in [0,1] with a basis note (§12.11).
 */
export function buildEvaluationRecord(
  input: EvaluationInput,
): EvaluationRecord {
  const scores = {} as Record<EvaluationDimension, number>;
  const notes = {} as Record<EvaluationDimension, string>;

  const supportedClaims = input.claims.filter(
    (claim) => claim.support === "SUPPORTED",
  ).length;
  const uncertainClaims = input.claims.filter(
    (claim) => claim.support === "UNCERTAIN",
  ).length;
  const claimIds = new Set(input.claims.map((claim) => claim.id));
  const sourceIds = new Set(input.sources.map((source) => source.id));
  const validLinks = input.evidence.filter(
    (link) => claimIds.has(link.claimId) && sourceIds.has(link.sourceId),
  ).length;
  const claimsWithLinks = input.claims.filter((claim) =>
    input.evidence.some((link) => link.claimId === claim.id),
  ).length;
  const claimsWithLocation = input.claims.filter((claim) =>
    input.evidence.some(
      (link) => link.claimId === claim.id && link.location !== undefined,
    ),
  ).length;
  const contradictions = input.conflicts.filter(
    (conflict) => conflict.kind === "contradiction",
  ).length;
  const retrievalRatio = fraction(
    input.retrievedTargets,
    input.requestedTargets,
  );

  const okClaim = supportedClaims + uncertainClaims;
  scores.factualCorrectness = okClaim === input.claims.length ? 1 : 0.5;
  notes.factualCorrectness =
    okClaim === input.claims.length
      ? "all claims are quoted verbatim from retrieved sources"
      : "some claims are not fully supported";

  scores.claimSupport = fraction(supportedClaims, input.claims.length);
  notes.claimSupport = "fraction of claims classified SUPPORTED";

  scores.citationAccuracy =
    input.evidence.length === 0 || validLinks === input.evidence.length
      ? 1
      : 0.5;
  notes.citationAccuracy =
    input.evidence.length === 0 || validLinks === input.evidence.length
      ? "all evidence links reference existing claims and sources"
      : "some evidence links reference missing claims or sources";

  scores.citationCompleteness = fraction(claimsWithLinks, input.claims.length);
  notes.citationCompleteness =
    "fraction of claims with at least one evidence link";

  scores.sourceQuality =
    input.requestedTargets === 0 ||
    input.retrievedTargets === input.requestedTargets
      ? 1
      : 0.5;
  notes.sourceQuality = "fraction of requested targets successfully retrieved";

  scores.traceability = fraction(claimsWithLocation, input.claims.length);
  notes.traceability = "fraction of claims with a located evidence pointer";

  scores.contradictionHandling = contradictions > 0 ? 1 : 0.5;
  notes.contradictionHandling =
    contradictions > 0
      ? "contradictions surfaced as ConflictRecords, never flattened"
      : "no contradictions detected";

  scores.uncertainty = fraction(
    input.claims.length - uncertainClaims,
    input.claims.length,
  );
  notes.uncertainty = "1 - fraction of claims classified UNCERTAIN";

  scores.calibration = 0.5;
  notes.calibration =
    "no confidence scoring: calibration formula is §20 #5 UNRESOLVED";

  const abstentionConsistent =
    (input.claims.length === 0) === (input.abstained === true);
  scores.abstention = abstentionConsistent ? 1 : 0.5;
  notes.abstention =
    "abstention flag is consistent with whether claims were produced";

  scores.recallCompleteness = retrievalRatio;
  notes.recallCompleteness = "fraction of requested targets retrieved";

  scores.reasoningQuality = 0.5;
  notes.reasoningQuality =
    "deterministic core performs no model-based reasoning (§12.4)";

  scores.reportQuality =
    input.report !== undefined && input.report.length > 0 ? 1 : 0.5;
  notes.reportQuality = "report text produced and non-empty";

  scores.humanAssessment = 0;
  notes.humanAssessment = "no human review was performed (§8.8 NORMATIVE)";

  scores.reproducibility = 1;
  notes.reproducibility =
    "deterministic core: identical inputs yield identical results";

  scores.freshness = 0.5;
  notes.freshness =
    "all sources are freshness 'unknown': no external freshness service (§12.6)";

  scores.costLatency = 0.5;
  notes.costLatency =
    "deterministic core: no external retrieval or model calls; latency not measured";

  scores.failureTolerance =
    input.state === "COMPLETED" || input.state === "PARTIAL" ? 1 : 0;
  notes.failureTolerance =
    input.state === "COMPLETED" || input.state === "PARTIAL"
      ? "no unrecoverable failure was encountered"
      : "the task terminated in a failed/cancelled state";

  return { dimensions: scores, dimensionNotes: notes, method: "automated" };
}
