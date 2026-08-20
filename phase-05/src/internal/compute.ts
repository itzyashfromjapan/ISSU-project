/**
 * ISSU Phase 5 — Data and Analytics Agents: analytical computation (Phase 5
 * native, ARCHITECTURE §3/§4). The deterministic core supports a bounded set
 * of tabular computations over prepared datasets: `count`, `sum`, `mean`,
 * `min`, `max`, and `describe` (descriptive per-field statistics). Computations
 * are deterministic and model-free (§6).
 */

import type { AnalyticsPlanStep, DatasetRef } from "./model.js";

export type ComputationStep = Exclude<
  AnalyticsPlanStep,
  { readonly op: "filter" }
>;

export type ComputationResult =
  | { readonly kind: "scalar"; readonly value: number }
  | { readonly kind: "count"; readonly value: number }
  | {
      readonly kind: "table";
      readonly rows: readonly {
        readonly label: string;
        readonly value: number;
      }[];
    };

export interface ComputedOperation {
  readonly opId: string;
  readonly step: ComputationStep;
  readonly datasetId: string;
  readonly result: ComputationResult;
}

function numericValues(field: string, dataset: DatasetRef): readonly number[] {
  const values: number[] = [];
  for (const record of dataset.records) {
    const value = record.fields[field];
    if (typeof value === "number") values.push(value);
  }
  return values;
}

/**
 * Execute one computation step. Returns `undefined` when the step cannot
 * produce a result (no numeric values for the target field / no numeric fields
 * for `describe`); the caller surfaces such shortfalls as a partial result.
 */
export function computeOperation(
  step: ComputationStep,
  dataset: DatasetRef,
): ComputationResult | undefined {
  if (step.op === "count") {
    return { kind: "count", value: dataset.records.length };
  }
  if (step.op === "describe") {
    return describeDataset(dataset);
  }
  const values = numericValues(step.field, dataset);
  if (values.length === 0) return undefined;
  if (step.op === "sum") {
    return { kind: "scalar", value: values.reduce((a, b) => a + b, 0) };
  }
  if (step.op === "mean") {
    return {
      kind: "scalar",
      value: values.reduce((a, b) => a + b, 0) / values.length,
    };
  }
  if (step.op === "min") {
    return { kind: "scalar", value: Math.min(...values) };
  }
  return { kind: "scalar", value: Math.max(...values) };
}

function describeDataset(dataset: DatasetRef): ComputationResult | undefined {
  const byField = new Map<string, number[]>();
  for (const record of dataset.records) {
    for (const [field, value] of Object.entries(record.fields)) {
      if (typeof value === "number") {
        const existing = byField.get(field) ?? [];
        existing.push(value);
        byField.set(field, existing);
      }
    }
  }
  if (byField.size === 0) return undefined;
  const rows: { readonly label: string; readonly value: number }[] = [];
  for (const [field, values] of byField) {
    rows.push({ label: `${field}.count`, value: values.length });
    rows.push({ label: `${field}.min`, value: Math.min(...values) });
    rows.push({ label: `${field}.max`, value: Math.max(...values) });
    rows.push({
      label: `${field}.sum`,
      value: values.reduce((a, b) => a + b, 0),
    });
    rows.push({
      label: `${field}.mean`,
      value: values.reduce((a, b) => a + b, 0) / values.length,
    });
  }
  return { kind: "table", rows };
}
