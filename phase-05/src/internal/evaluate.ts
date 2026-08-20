/**
 * ISSU Phase 5 — Data and Analytics Agents: multi-dimensional quality
 * evaluation (§10). The fixed 5-dimension set (ARCHITECTURE §10) is scored
 * from observable deterministic signals only; no single scalar metric is the
 * sole criterion (§10). Weights/thresholds are §17 UNRESOLVED.
 */

import type {
  AnalyticsEvaluationDimension,
  AnalyticsEvaluationRecord,
  AnalyticsTaskStatus,
} from "./model.js";

export interface EvaluationInput {
  readonly state: AnalyticsTaskStatus;
  readonly plannedUnits: number;
  readonly producedUnits: number;
  readonly totalFindings: number;
  readonly verifiedCount: number;
  readonly abstained: boolean;
  readonly reportPresent: boolean;
}

function fraction(numerator: number, denominator: number): number {
  if (denominator <= 0) return 1;
  return Math.min(1, numerator / denominator);
}

/**
 * Score the fixed dimension set (§10) from deterministic signals only.
 * Each dimension is scored independently in [0,1] with a basis note.
 */
export function buildEvaluationRecord(
  input: EvaluationInput,
): AnalyticsEvaluationRecord {
  const scores = {} as Record<AnalyticsEvaluationDimension, number>;
  const notes = {} as Record<AnalyticsEvaluationDimension, string>;

  scores.correctness = fraction(input.verifiedCount, input.totalFindings);
  notes.correctness =
    "fraction of interpreted findings that passed structural verification";

  scores.completeness = fraction(input.producedUnits, input.plannedUnits);
  notes.completeness =
    "fraction of planned work units (transforms + computations) that produced results";

  const provenanceScore =
    input.totalFindings === 0
      ? 0.5
      : fraction(input.verifiedCount, input.totalFindings);
  scores.provenance = provenanceScore;
  notes.provenance =
    "fraction of findings whose provenance chains fully resolve";

  scores.confidenceUncertainty = 0.5;
  notes.confidenceUncertainty =
    "deterministic core performs no model-based calibration: confidence is not established and no calibration is asserted (§8)";

  scores.reproducibility = 1;
  notes.reproducibility =
    "deterministic core: identical inputs yield identical results";

  if (input.abstained) {
    scores.correctness = 0.5;
    notes.correctness =
      "task abstained: no findings were asserted rather than fabricating from insufficient data (§9)";
    scores.completeness = 0.5;
    notes.completeness =
      "no plan was executed: abstention occurred before analysis";
  }

  return {
    dimensions: scores,
    dimensionNotes: notes,
    method: "automated",
  };
}
