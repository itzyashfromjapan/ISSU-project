/**
 * ISSU Phase 4 — Research: data model (§8), lifecycle (§11), citation/support
 * model (§10). Types are the authoritative public contract surface (§4).
 *
 * ResearchTaskRequest intentionally does NOT carry a `sources`/`SourceSelector`
 * field in the deterministic core: its exact shape is §20 #2 UNRESOLVED and it
 * depends on the deferred §20 #1 retrieval provider. Owner disposition
 * (2026-08-15): omit `sources` from the request.
 */

import type { ResourceBounds, TaskRefs } from "@issue/tool-runtime";
import type { Logger } from "@issue/foundation";
import type { ResearchDecisionProvider } from "./provider.js";

// --- §11 Research-task lifecycle -------------------------------------------

export type ResearchTaskStatus =
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
  | "CANCELLED";

export const ACTIVE_STATUSES: readonly ResearchTaskStatus[] = [
  "READY",
  "PLANNING",
  "RETRIEVING",
  "EVALUATING_SOURCES",
  "SYNTHESIZING",
  "VERIFYING",
  "EVALUATING",
  "REPLANNING",
];

export const TERMINAL_STATUSES: readonly ResearchTaskStatus[] = [
  "COMPLETED",
  "PARTIAL",
  "FAILED",
  "CANCELLED",
];

export function isTerminalStatus(status: ResearchTaskStatus): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

// --- §10.2 Support classification (non-binary 4-class) ----------------------

export type SupportClass =
  "SUPPORTED" | "PARTIALLY_SUPPORTED" | "UNSUPPORTED" | "UNCERTAIN";

export const SUPPORT_CLASSES: readonly SupportClass[] = [
  "SUPPORTED",
  "PARTIALLY_SUPPORTED",
  "UNSUPPORTED",
  "UNCERTAIN",
];

// --- §8.3 / §8.7 / §10.3 / §8.6 domain enums --------------------------------

export type EvidenceKind = "direct" | "secondary";
export type ConflictKind = "contradiction" | "gap" | "weak-signal";
export type SourceRole = "primary" | "secondary";
export type Freshness = "current" | "stale" | "unknown";
export type EvaluationMethod = "automated" | "human" | "hybrid";

// --- §8.5 CredibilityDimension (fixed set) ----------------------------------

export const CREDIBILITY_DIMENSIONS = [
  "expertise",
  "trustworthiness",
  "bias",
  "transparency",
  "date",
  "provenance",
] as const;

export type CredibilityDimension = (typeof CREDIBILITY_DIMENSIONS)[number];

// --- §8.8 EvaluationDimension (fixed set, incl. humanAssessment per F4) -----

export const EVALUATION_DIMENSIONS = [
  "factualCorrectness",
  "claimSupport",
  "citationAccuracy",
  "citationCompleteness",
  "sourceQuality",
  "traceability",
  "contradictionHandling",
  "uncertainty",
  "calibration",
  "abstention",
  "recallCompleteness",
  "reasoningQuality",
  "reportQuality",
  "humanAssessment",
  "reproducibility",
  "freshness",
  "costLatency",
  "failureTolerance",
] as const;

export type EvaluationDimension = (typeof EVALUATION_DIMENSIONS)[number];

// --- §8.1 ResearchTaskRequest (deterministic core; `sources` omitted) ------

export interface ResearchTaskRequest {
  readonly prompt: string;
  readonly refs?: TaskRefs;
  readonly includeHidden?: boolean;
  readonly bounds?: ResourceBounds;
}

// --- §12.1 ResearchTaskOptions ----------------------------------------------

export interface ResearchTaskOptions {
  readonly logger?: Logger;
  readonly provider?: ResearchDecisionProvider;
  readonly signal?: AbortSignal;
}

// --- §8.2 Claim -------------------------------------------------------------

export interface Claim {
  readonly id: string;
  readonly text: string;
  readonly support: SupportClass;
  readonly confidence?: number;
  readonly abstained?: boolean;
  readonly sources: readonly SourceReference[];
}

// --- §8.3 EvidenceLink ------------------------------------------------------

export interface EvidenceLink {
  readonly claimId: string;
  readonly sourceId: string;
  readonly location?: string;
  readonly kind: EvidenceKind;
  readonly strength: SupportClass;
}

// --- §8.4 SourceReference ---------------------------------------------------

export interface SourceReference {
  readonly id: string;
  readonly title: string;
  readonly organization?: string;
  readonly authors?: readonly string[];
  readonly publishedAt?: string;
  readonly url?: string;
  readonly role: SourceRole;
  readonly freshness: Freshness;
  readonly credibility: CredibilityProfile;
}

// --- §8.5 CredibilityProfile ------------------------------------------------

export interface CredibilityProfile {
  readonly sourceId: string;
  readonly dimensions: Record<CredibilityDimension, number>;
  readonly dimensionNotes?: Record<CredibilityDimension, string>;
}

// --- §8.6 ResearchTaskResult ------------------------------------------------

export interface ResearchTaskResult {
  readonly state: ResearchTaskStatus;
  readonly report?: string;
  readonly claims: readonly Claim[];
  readonly evidence: readonly EvidenceLink[];
  readonly sources: readonly SourceReference[];
  readonly conflicts: readonly ConflictRecord[];
  readonly evaluation: EvaluationRecord;
  readonly abstained?: boolean;
}

// --- §8.7 ConflictRecord ----------------------------------------------------

export interface ConflictRecord {
  readonly id: string;
  readonly kind: ConflictKind;
  readonly claimIds: readonly string[];
  readonly sourceIds: readonly string[];
  readonly description: string;
}

// --- §8.8 EvaluationRecord --------------------------------------------------

export interface EvaluationRecord {
  readonly dimensions: Record<EvaluationDimension, number>;
  readonly dimensionNotes?: Record<EvaluationDimension, string>;
  readonly method: EvaluationMethod;
}
