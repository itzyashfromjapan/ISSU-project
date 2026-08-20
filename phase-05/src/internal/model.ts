/**
 * ISSU Phase 5 — Data and Analytics Agents: public data model (§3), lifecycle
 * (§4), provenance (§7), uncertainty (§8), abstention (§9), evaluation (§10).
 * Types are the authoritative public contract surface (§2).
 *
 * Supporting structural types referenced by the public types (DatasetRecord,
 * AnalyticsPlanStep, AnalyticsEvaluationDimension, FieldValue) are exported
 * from this internal module so declaration emit stays valid; the PUBLIC BARREL
 * re-exports exactly the §2 enumerated surface (§2 NORMATIVE).
 */

import type { ResourceBounds } from "@issue/tool-runtime";
import type { Logger } from "@issue/foundation";
import type { AnalyticsDecisionProvider } from "./provider.js";

// --- §4 Analytics-task lifecycle -------------------------------------------

export type AnalyticsTaskStatus =
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
  | "CANCELLED";

export const ACTIVE_STATUSES: readonly AnalyticsTaskStatus[] = [
  "READY",
  "PLANNING",
  "ACQUIRING",
  "PREPARING",
  "ANALYZING",
  "INTERPRETING",
  "VERIFYING",
  "EVALUATING",
  "REPLANNING",
];

export const TERMINAL_STATUSES: readonly AnalyticsTaskStatus[] = [
  "COMPLETED",
  "PARTIAL",
  "ABSTAINED",
  "FAILED",
  "CANCELLED",
];

export function isTerminalStatus(status: AnalyticsTaskStatus): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

// --- §3.1 DataSourceRef (deterministic core: inline | localFile) ------------

export type DataSourceKind = "inline" | "localFile";

export interface DataSourceRef {
  readonly id: string;
  readonly name: string;
  readonly kind: DataSourceKind;
  readonly path?: string; // required iff kind === "localFile"
  readonly content?: string; // required iff kind === "inline"
}

// --- §3.2 DatasetRef (prepared tabular dataset) -----------------------------

export type FieldValue = string | number | boolean | null;

export interface DatasetRecord {
  readonly id: string;
  readonly fields: Readonly<Record<string, FieldValue>>;
}

export interface DatasetRef {
  readonly id: string;
  readonly name: string;
  readonly sourceIds: readonly string[];
  readonly records: readonly DatasetRecord[];
}

// --- §7 ProvenanceChain ------------------------------------------------------

export interface ProvenanceChain {
  readonly id: string;
  readonly sourceIds: readonly string[];
  readonly steps: readonly {
    readonly kind: string;
    readonly ref: string;
    readonly description?: string;
    readonly field?: string;
  }[];
}

// --- §5.2 TransformRecord ----------------------------------------------------

export interface TransformRecord {
  readonly id: string;
  readonly kind: string;
  readonly inputDatasetIds: readonly string[];
  readonly outputDatasetId: string;
  readonly description: string;
}

// --- §8 UncertaintyInfo ------------------------------------------------------

export interface UncertaintyInfo {
  readonly confidence?: number;
  readonly calibrated: boolean;
  readonly method?: string;
  readonly note?: string;
}

// --- §5 AnalyticalFinding ----------------------------------------------------

export interface AnalyticalFinding {
  readonly id: string;
  readonly text: string;
  readonly provenance: ProvenanceChain;
  readonly uncertainty: UncertaintyInfo;
}

// --- §11 AnalyticalReport ----------------------------------------------------

export interface AnalyticalReport {
  readonly id: string;
  readonly text: string;
  readonly findingIds: readonly string[];
}

// --- §10 AnalyticsEvaluationRecord (fixed 5-dimension set) -------------------

export type AnalyticsEvaluationDimension =
  | "correctness"
  | "completeness"
  | "provenance"
  | "confidenceUncertainty"
  | "reproducibility";

export const EVALUATION_DIMENSIONS: readonly AnalyticsEvaluationDimension[] = [
  "correctness",
  "completeness",
  "provenance",
  "confidenceUncertainty",
  "reproducibility",
];

export type EvaluationMethod = "automated" | "human" | "hybrid";

export interface AnalyticsEvaluationRecord {
  readonly dimensions: Record<AnalyticsEvaluationDimension, number>;
  readonly dimensionNotes?: Record<AnalyticsEvaluationDimension, string>;
  readonly method: EvaluationMethod;
}

// --- §3 AnalyticsTaskRequest (objective, sources, optional plan) -------------

export type AnalyticsPlanStep =
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
    };

export interface AnalyticsTaskRequest {
  readonly objective: string;
  readonly sources: readonly DataSourceRef[];
  readonly plan?: readonly AnalyticsPlanStep[];
}

// --- §3 AnalyticsTaskOptions ------------------------------------------------

export interface AnalyticsTaskOptions {
  readonly bounds?: ResourceBounds;
  readonly logger?: Logger;
  readonly provider?: AnalyticsDecisionProvider;
  readonly signal?: AbortSignal;
}

// --- §3 AnalyticsTaskResult --------------------------------------------------

export interface AnalyticsTaskResult {
  readonly state: AnalyticsTaskStatus;
  readonly report?: AnalyticalReport;
  readonly findings: readonly AnalyticalFinding[];
  readonly provenance: readonly ProvenanceChain[];
  readonly uncertainty: readonly UncertaintyInfo[];
  readonly evaluation: AnalyticsEvaluationRecord;
  readonly abstained?: boolean;
}
