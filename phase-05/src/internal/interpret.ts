/**
 * ISSU Phase 5 — Data and Analytics Agents: interpretation (§5 Interpretation)
 * — converting computed analytical results into `AnalyticalFinding`s, each
 * carrying a `ProvenanceChain` (§7) and `UncertaintyInfo` (§8). Findings are
 * grounded in their data: every chain resolves to its root sources, recorded
 * transforms, and the producing computation.
 */

import type {
  AnalyticalFinding,
  DatasetRef,
  ProvenanceChain,
  TransformRecord,
  UncertaintyInfo,
} from "./model.js";
import type { ComputedOperation } from "./compute.js";

function formatNumber(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

function findingText(op: ComputedOperation): string {
  const datasetId = op.datasetId;
  const value = op.result.kind === "table" ? undefined : op.result.value;
  switch (op.step.op) {
    case "count":
      return `Count of records in dataset "${datasetId}" = ${value}`;
    case "sum":
    case "mean":
    case "min":
    case "max": {
      const label =
        op.step.op === "sum"
          ? "Sum"
          : op.step.op === "mean"
            ? "Mean"
            : op.step.op === "min"
              ? "Minimum"
              : "Maximum";
      return `${label} of "${op.step.field}" across dataset "${datasetId}" = ${formatNumber(value ?? 0)}`;
    }
    case "describe": {
      const rows =
        op.result.kind === "table"
          ? op.result.rows
              .map((row) => `${row.label}=${formatNumber(row.value)}`)
              .join(", ")
          : "";
      return `Descriptive summary of dataset "${datasetId}": ${rows}`;
    }
  }
}

function deterministicUncertainty(): UncertaintyInfo {
  return {
    calibrated: false,
    method: "deterministic-core",
    note: "deterministic computation: confidence is not established and no calibration is asserted (§8)",
  };
}

function collectLineage(
  datasetId: string,
  transforms: readonly TransformRecord[],
  steps: {
    readonly kind: string;
    readonly ref: string;
    readonly description?: string;
    readonly field?: string;
  }[],
  seen: ReadonlySet<string>,
): void {
  if (seen.has(datasetId)) return;
  const producing = transforms.filter(
    (transform) => transform.outputDatasetId === datasetId,
  );
  if (producing.length === 0) return;
  const seenNext = new Set<string>(seen);
  seenNext.add(datasetId);
  for (const transform of producing) {
    for (const inputId of transform.inputDatasetIds) {
      collectLineage(inputId, transforms, steps, seenNext);
    }
    steps.push({
      kind: transform.kind,
      ref: transform.id,
      description: transform.description,
    });
  }
}

function buildChain(
  seq: number,
  op: ComputedOperation,
  dataset: DatasetRef | undefined,
  transforms: readonly TransformRecord[],
): ProvenanceChain {
  const steps: {
    readonly kind: string;
    readonly ref: string;
    readonly description?: string;
    readonly field?: string;
  }[] = [];
  collectLineage(op.datasetId, transforms, steps, new Set<string>());
  steps.push({
    kind: op.step.op,
    ref: op.datasetId,
    description: `computation ${op.step.op} on dataset "${op.datasetId}"`,
    ...(op.step.op === "sum" ||
    op.step.op === "mean" ||
    op.step.op === "min" ||
    op.step.op === "max"
      ? { field: op.step.field }
      : {}),
  });
  return {
    id: `chain-${seq}`,
    sourceIds: dataset?.sourceIds ?? [],
    steps,
  };
}

/**
 * Interpret computed operations into findings. Operations that produced no
 * result contribute no finding. Each finding's provenance chain references its
 * root sources, the transforms that produced its dataset, and the computation
 * operation (§7).
 */
export function interpretResults(
  computed: readonly ComputedOperation[],
  datasets: readonly DatasetRef[],
  transforms: readonly TransformRecord[],
): readonly AnalyticalFinding[] {
  const findings: AnalyticalFinding[] = [];
  for (let i = 0; i < computed.length; i++) {
    const op = computed[i];
    if (op === undefined) continue;
    const dataset = datasets.find((d) => d.id === op.datasetId);
    findings.push({
      id: `finding-${i + 1}`,
      text: findingText(op),
      provenance: buildChain(i + 1, op, dataset, transforms),
      uncertainty: deterministicUncertainty(),
    });
  }
  return findings;
}
