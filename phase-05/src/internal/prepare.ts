/**
 * ISSU Phase 5 — Data and Analytics Agents: data preparation (§5 Preparation).
 * Each acquired source becomes a root `DatasetRef` via a recorded `parse`
 * transform; each `filter` plan step produces a derived dataset recorded as a
 * `filter` transform. Every transformation is recorded (§7); no transformation
 * step silently disappears.
 */

import type {
  AnalyticsPlanStep,
  DatasetRef,
  TransformRecord,
} from "./model.js";
import type { AcquiredSource } from "./acquire.js";
import { parseContent } from "./parse.js";

export interface PreparedState {
  readonly datasets: readonly DatasetRef[];
  readonly transforms: readonly TransformRecord[];
}

/** Build root datasets from acquired sources, recording the parse transform. */
export function prepareDatasets(
  sources: readonly AcquiredSource[],
): PreparedState {
  const datasets: DatasetRef[] = [];
  const transforms: TransformRecord[] = [];
  let transformSeq = 0;
  for (const acquired of sources) {
    transformSeq += 1;
    const records = parseContent(acquired.content);
    datasets.push({
      id: acquired.ref.id,
      name: acquired.ref.name,
      sourceIds: [acquired.ref.id],
      records,
    });
    transforms.push({
      id: `transform-${transformSeq}`,
      kind: "parse",
      inputDatasetIds: [],
      outputDatasetId: acquired.ref.id,
      description: `parsed content of source "${acquired.ref.id}" into dataset records`,
    });
  }
  return { datasets, transforms };
}

export interface FilterApplication {
  readonly datasets: readonly DatasetRef[];
  readonly transforms: readonly TransformRecord[];
  readonly applied: boolean;
}

/**
 * Apply a `filter` transform, producing a derived dataset. When the source
 * dataset does not exist the step is not applied (`applied: false`) and the
 * caller surfaces the shortfall as a partial result.
 */
export function applyFilter(
  datasets: readonly DatasetRef[],
  transforms: readonly TransformRecord[],
  step: Extract<AnalyticsPlanStep, { readonly op: "filter" }>,
): FilterApplication {
  const input = datasets.find((dataset) => dataset.id === step.dataset);
  if (input === undefined) {
    return { datasets, transforms, applied: false };
  }
  const records = input.records.filter(
    (record) => record.fields[step.field] === step.equals,
  );
  const priorDerived = transforms.filter(
    (transform) =>
      transform.kind === "filter" &&
      transform.inputDatasetIds.includes(input.id),
  ).length;
  const outputId = `derived-${step.dataset}-${priorDerived + 1}`;
  const datasetsNext: DatasetRef[] = [
    ...datasets,
    {
      id: outputId,
      name: input.name,
      sourceIds: input.sourceIds,
      records,
    },
  ];
  const transformsNext: TransformRecord[] = [
    ...transforms,
    {
      id: `transform-${transforms.length + 1}`,
      kind: "filter",
      inputDatasetIds: [input.id],
      outputDatasetId: outputId,
      description: `filtered dataset "${input.id}" to records where ${step.field} equals ${String(step.equals)}`,
    },
  ];
  return {
    datasets: datasetsNext,
    transforms: transformsNext,
    applied: true,
  };
}
