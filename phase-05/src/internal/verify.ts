/**
 * ISSU Phase 5 — Data and Analytics Agents: verification (§6). A structurally
 * independent pass over the interpreted findings: each `ProvenanceChain` must
 * resolve — root `sourceIds` to known sources, transform steps to recorded
 * transforms, and the computation step to an existing dataset (and, for
 * numeric operations, to an existing field). Findings that fail verification
 * are excluded and the caller surfaces the shortfall as a partial result.
 */

import type {
  AnalyticalFinding,
  DatasetRef,
  ProvenanceChain,
  TransformRecord,
} from "./model.js";

const OPERATION_KINDS: ReadonlySet<string> = new Set([
  "count",
  "sum",
  "mean",
  "min",
  "max",
  "describe",
]);

function stepResolves(
  step: ProvenanceChain["steps"][number],
  datasets: readonly DatasetRef[],
  transforms: readonly TransformRecord[],
): boolean {
  if (step.kind === "parse" || step.kind === "filter") {
    return transforms.some((transform) => transform.id === step.ref);
  }
  if (OPERATION_KINDS.has(step.kind)) {
    const dataset = datasets.find((dataset) => dataset.id === step.ref);
    if (dataset === undefined) return false;
    if (step.field !== undefined) {
      return dataset.records.some(
        (record) => step.field !== undefined && step.field in record.fields,
      );
    }
    return true;
  }
  return false;
}

/** Resolve a single provenance chain against the prepared state. */
export function chainResolves(
  chain: ProvenanceChain,
  knownSourceIds: ReadonlySet<string>,
  datasets: readonly DatasetRef[],
  transforms: readonly TransformRecord[],
): boolean {
  const sourcesOk = chain.sourceIds.every((id) => knownSourceIds.has(id));
  if (!sourcesOk) return false;
  return chain.steps.every((step) => stepResolves(step, datasets, transforms));
}

export interface VerificationOutcome {
  readonly verified: readonly AnalyticalFinding[];
  readonly verifiedCount: number;
}

/**
 * Verify findings structurally (§6). Verification is an independent pass:
 * it never regenerates findings and never fabricates evidence.
 */
export function verifyFindings(
  findings: readonly AnalyticalFinding[],
  knownSourceIds: ReadonlySet<string>,
  datasets: readonly DatasetRef[],
  transforms: readonly TransformRecord[],
): VerificationOutcome {
  const verified: AnalyticalFinding[] = [];
  for (const finding of findings) {
    if (
      chainResolves(finding.provenance, knownSourceIds, datasets, transforms)
    ) {
      verified.push(finding);
    }
  }
  return { verified, verifiedCount: verified.length };
}
