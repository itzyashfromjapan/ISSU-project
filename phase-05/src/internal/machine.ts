/**
 * ISSU Phase 5 — Data and Analytics Agents: deterministic orchestrator
 * (`runAnalyticsTask`). Drives the §4 lifecycle: `READY → PLANNING →
 * ACQUIRING → PREPARING → ANALYZING → INTERPRETING → VERIFYING → EVALUATING →
 * terminal`. REPLANNING is a defined transition (§4) that the deterministic
 * core never enters: it has no refinement capability (Phase 4 §11 precedent).
 * Abstention (§9) is a distinct terminal status (`ABSTAINED`), produced only
 * for insufficient data; failure semantics follow §6/§13 precedent.
 */

import { AppError, isOk } from "@issue/foundation";
import type { Logger } from "@issue/foundation";
import { acquireSources } from "./acquire.js";
import type { ComputedOperation, ComputationStep } from "./compute.js";
import { computeOperation } from "./compute.js";
import { buildEvaluationRecord } from "./evaluate.js";
import type { EvaluationInput } from "./evaluate.js";
import { interpretResults } from "./interpret.js";
import type {
  AnalyticsPlanStep,
  AnalyticsTaskOptions,
  AnalyticsTaskRequest,
  AnalyticsTaskResult,
  AnalyticsTaskStatus,
  AnalyticalFinding,
  DataSourceRef,
  DatasetRef,
  TransformRecord,
} from "./model.js";
import { applyFilter, prepareDatasets } from "./prepare.js";
import { createDeterministicAnalyticsProviderStub } from "./provider.js";
import type { AnalyticsDecisionProvider } from "./provider.js";
import { buildAnalyticalReport } from "./report.js";
import { chainResolves } from "./verify.js";

const PLAN_OPERATIONS: ReadonlySet<string> = new Set([
  "filter",
  "describe",
  "count",
  "sum",
  "mean",
  "min",
  "max",
]);

function emptyResult(
  state: Extract<AnalyticsTaskStatus, "FAILED" | "CANCELLED">,
): AnalyticsTaskResult {
  return {
    state,
    findings: [],
    provenance: [],
    uncertainty: [],
    evaluation: buildEvaluationRecord({
      state,
      plannedUnits: 0,
      producedUnits: 0,
      totalFindings: 0,
      verifiedCount: 0,
      abstained: false,
      reportPresent: false,
    }),
  };
}

function abstentionResult(): AnalyticsTaskResult {
  const report = buildAnalyticalReport([], true);
  return {
    state: "ABSTAINED",
    report,
    findings: [],
    provenance: [],
    uncertainty: [],
    evaluation: buildEvaluationRecord({
      state: "ABSTAINED",
      plannedUnits: 0,
      producedUnits: 0,
      totalFindings: 0,
      verifiedCount: 0,
      abstained: true,
      reportPresent: true,
    }),
    abstained: true,
  };
}

function usageError(message: string): AppError {
  return new AppError({
    code: "issue.usage",
    message,
    recoverable: false,
  });
}

function validateRequest(request: AnalyticsTaskRequest): AppError | undefined {
  if (request === null || typeof request !== "object") {
    return usageError("analytics task request must be an object");
  }
  if (
    typeof request.objective !== "string" ||
    request.objective.trim().length === 0
  ) {
    return usageError("analytics task request requires a non-empty objective");
  }
  if (!Array.isArray(request.sources)) {
    return usageError("analytics task request requires a sources array");
  }
  for (const source of request.sources) {
    if (source === null || typeof source !== "object") {
      return usageError("each data source must be an object");
    }
    if (typeof source.id !== "string" || source.id.trim().length === 0) {
      return usageError("each data source requires a non-empty id");
    }
    if (typeof source.name !== "string" || source.name.trim().length === 0) {
      return usageError(`source "${source.id}" requires a name`);
    }
    if (source.kind === "inline" && typeof source.content !== "string") {
      return usageError(`inline source "${source.id}" requires content`);
    }
    if (source.kind === "localFile" && typeof source.path !== "string") {
      return usageError(`localFile source "${source.id}" requires a path`);
    }
    if (source.kind !== "inline" && source.kind !== "localFile") {
      return usageError(`source "${source.id}" has an unknown kind`);
    }
  }
  if (request.plan !== undefined) {
    if (!Array.isArray(request.plan)) {
      return usageError("plan must be an array");
    }
    for (const step of request.plan) {
      if (step === null || typeof step !== "object") {
        return usageError("each plan step must be an object");
      }
      if (typeof step.dataset !== "string" || step.dataset.length === 0) {
        return usageError("each plan step requires a dataset id");
      }
      if (typeof step.op !== "string" || !PLAN_OPERATIONS.has(step.op)) {
        return usageError("plan step has an unknown operation");
      }
      if (
        step.op !== "describe" &&
        step.op !== "count" &&
        (typeof step.field !== "string" || step.field.length === 0)
      ) {
        return usageError(`plan step "${step.op}" requires a field`);
      }
    }
  }
  return undefined;
}

function defaultPlan(
  datasets: readonly DatasetRef[],
): readonly AnalyticsPlanStep[] {
  return datasets.map((dataset) => ({
    op: "describe" as const,
    dataset: dataset.id,
  }));
}

function isFilterStep(
  step: AnalyticsPlanStep,
): step is Extract<AnalyticsPlanStep, { readonly op: "filter" }> {
  return step.op === "filter";
}

function isComputationStep(step: AnalyticsPlanStep): step is ComputationStep {
  return step.op !== "filter";
}

/**
 * Consult the provider to select the next item from a mutable working set.
 * The selection is validated against the working set so the core never
 * consumes a fabricated item; an unknown id fails the run (Phase 4 §13
 * non-recoverable failure precedent). Selection is consumed (spliced) in the
 * provider's chosen order, preserving determinism of the default stub.
 */
async function providerPickNext<T extends { readonly id: string }>(
  remaining: T[],
  label: string,
  pick: (items: readonly T[]) => Promise<T>,
): Promise<T> {
  const chosen = await pick(remaining);
  const index = remaining.findIndex((item) => item.id === chosen.id);
  if (index === -1) {
    throw new Error(
      `analytics provider returned an unknown ${label} id "${chosen.id}"`,
    );
  }
  const [selected] = remaining.splice(index, 1);
  if (selected === undefined) {
    throw new Error(
      `analytics provider returned an unknown ${label} id "${chosen.id}"`,
    );
  }
  return selected;
}

async function orderSources(
  sources: readonly DataSourceRef[],
  provider: AnalyticsDecisionProvider,
): Promise<DataSourceRef[]> {
  const ordered: DataSourceRef[] = [];
  const remaining = [...sources];
  while (remaining.length > 0) {
    const selected = await providerPickNext(remaining, "source", (items) =>
      provider.selectSource(items, { status: "ACQUIRING" }),
    );
    ordered.push(selected);
  }
  return ordered;
}

async function verifyInProviderOrder(
  findings: readonly AnalyticalFinding[],
  provider: AnalyticsDecisionProvider,
  knownSourceIds: ReadonlySet<string>,
  datasets: readonly DatasetRef[],
  transforms: readonly TransformRecord[],
): Promise<AnalyticalFinding[]> {
  const remaining = [...findings];
  const verified: AnalyticalFinding[] = [];
  while (remaining.length > 0) {
    const candidate = await providerPickNext(remaining, "finding", (items) =>
      provider.selectFindingToVerify(items, { status: "VERIFYING" }),
    );
    if (
      chainResolves(candidate.provenance, knownSourceIds, datasets, transforms)
    ) {
      verified.push(candidate);
    }
  }
  return verified;
}

/**
 * Deterministic analytics task (§3). Guarantees a terminal `state` (§4) and an
 * internally consistent result: every finding carries a resolving provenance
 * chain (§7), uncertainty is surfaced (§8), abstention is distinct from
 * failure (§9), and the evaluation record scores the fixed dimension set (§10).
 */
export async function runAnalyticsTask(
  request: AnalyticsTaskRequest,
  options?: AnalyticsTaskOptions,
): Promise<AnalyticsTaskResult> {
  const logger: Logger | undefined = options?.logger;
  const signal: AbortSignal | undefined = options?.signal;
  const provider: AnalyticsDecisionProvider =
    options?.provider ?? createDeterministicAnalyticsProviderStub();

  if (signal?.aborted === true) {
    logger?.warn("analytics: task cancelled before start");
    return emptyResult("CANCELLED");
  }

  const validationError = validateRequest(request);
  if (validationError !== undefined) {
    logger?.error("analytics: invalid request", {
      code: validationError.code,
      message: validationError.message,
    });
    return emptyResult("FAILED");
  }

  const sources = request.sources;
  if (sources.length === 0) {
    logger?.warn("analytics: no data sources provided; abstaining (§9)");
    return abstentionResult();
  }

  try {
    const ordered = await orderSources(sources, provider);

    const acquisition = await acquireSources(ordered, signal, logger);
    if (!isOk(acquisition)) {
      logger?.error("analytics: acquisition failed", {
        code: acquisition.error.code,
        message: acquisition.error.message,
      });
      return emptyResult("FAILED");
    }
    if (acquisition.value.cancelled) {
      logger?.warn("analytics: task cancelled during acquisition");
      return emptyResult("CANCELLED");
    }

    const prepared = prepareDatasets(acquisition.value.sources);
    if (prepared.datasets.every((dataset) => dataset.records.length === 0)) {
      logger?.warn(
        "analytics: all datasets are empty after preparation; abstaining (§9)",
      );
      return abstentionResult();
    }

    const plan = request.plan ?? defaultPlan(prepared.datasets);
    const transformSteps = plan.filter(isFilterStep);
    const computationSteps = plan.filter(isComputationStep);

    let datasets: readonly DatasetRef[] = prepared.datasets;
    let transforms: readonly TransformRecord[] = prepared.transforms;
    let appliedTransforms = 0;
    for (const step of transformSteps) {
      const applied = applyFilter(datasets, transforms, step);
      datasets = applied.datasets;
      transforms = applied.transforms;
      if (applied.applied) appliedTransforms += 1;
    }

    const computed: ComputedOperation[] = [];
    for (let i = 0; i < computationSteps.length; i++) {
      const step = computationSteps[i];
      if (step === undefined) continue;
      const dataset = datasets.find((d) => d.id === step.dataset);
      if (dataset === undefined) continue;
      const result = computeOperation(step, dataset);
      if (result !== undefined) {
        computed.push({
          opId: `op-${i + 1}`,
          step,
          datasetId: step.dataset,
          result,
        });
      }
    }

    const findings = interpretResults(computed, datasets, transforms);
    const knownSourceIds = new Set(sources.map((source) => source.id));
    const verified = await verifyInProviderOrder(
      findings,
      provider,
      knownSourceIds,
      datasets,
      transforms,
    );

    const plannedUnits = transformSteps.length + computationSteps.length;
    const producedUnits = appliedTransforms + computed.length;
    const allProduced = producedUnits === plannedUnits;
    const allVerified =
      verified.length === findings.length && findings.length > 0;
    const state: AnalyticsTaskStatus =
      allProduced && allVerified ? "COMPLETED" : "PARTIAL";

    const report = buildAnalyticalReport(verified, false);

    const evaluationInput: EvaluationInput = {
      state,
      plannedUnits,
      producedUnits,
      totalFindings: findings.length,
      verifiedCount: verified.length,
      abstained: false,
      reportPresent: report.text.length > 0,
    };
    const evaluation = buildEvaluationRecord(evaluationInput);

    const result: AnalyticsTaskResult = {
      state,
      report,
      findings: verified,
      provenance: verified.map((finding) => finding.provenance),
      uncertainty: verified.map((finding) => finding.uncertainty),
      evaluation,
    };
    return result;
  } catch (error) {
    logger?.error("analytics: unrecoverable error during task", {
      message: error instanceof Error ? error.message : String(error),
    });
    return emptyResult("FAILED");
  }
}
