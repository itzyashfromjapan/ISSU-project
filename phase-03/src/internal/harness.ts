import {
  AppError,
  assertContained,
  createLogger,
  err,
  isAppError,
  ok,
  toError,
} from "@issue/foundation";
import type { Logger, LoggerOptions, Result } from "@issue/foundation";
import { runTask as runToolRuntime } from "@issue/tool-runtime";
import type {
  DecisionProvider,
  ResourceBounds,
  TaskOptions,
  TaskRefs,
  TaskResult,
  TaskStatus,
} from "@issue/tool-runtime";
import { isFailedToolResult, translateToolError } from "./ad1.js";
import { DEFAULT_BOUNDS } from "./bounds.js";

/**
 * Phase 3 harness run request (§29.2). All run-layer inputs are consumed by
 * the Phase 2 public barrel only; the harness adds nothing to the plan.
 */
export interface IntegrationTaskRequest {
  readonly root: string;
  readonly refs: TaskRefs;
  readonly bounds?: ResourceBounds;
  readonly includeHidden?: boolean;
  readonly objective?: string;
  readonly provider: DecisionProvider;
  readonly signal?: AbortSignal;
  readonly loggerConfig?: LoggerOptions;
}

/** Deterministic structured harness records (§29.6, §29.10, §29.12). */
export type HarnessRecord =
  | { readonly event: "validate"; readonly outcome: "ok" }
  | { readonly event: "run"; readonly status: TaskStatus }
  | { readonly event: "translate"; readonly code: string };

export interface IntegrationTaskResult {
  readonly run: TaskResult;
  readonly toolErrors: readonly AppError[];
  readonly records: readonly HarnessRecord[];
}

function toHarnessError(error: unknown): AppError {
  if (isAppError(error)) return error;
  const normalized = toError(error);
  return new AppError({
    code: "issue.internal",
    message: normalized.message,
    recoverable: false,
    cause: normalized,
  });
}

function validateRequest(
  request: IntegrationTaskRequest,
): AppError | undefined {
  if (request === null || typeof request !== "object") {
    return new AppError({
      code: "issue.usage",
      message: "integration run request must be an object",
      recoverable: false,
    });
  }
  if (typeof request.root !== "string" || request.root.length === 0) {
    return new AppError({
      code: "issue.usage",
      message: "root must be a non-empty absolute path",
      recoverable: false,
    });
  }
  const refs = request.refs;
  if (refs === null || typeof refs !== "object") {
    return new AppError({
      code: "issue.usage",
      message: "refs must be a TaskRefs object",
      recoverable: false,
    });
  }
  if (!Array.isArray(refs.files) || !Array.isArray(refs.directories)) {
    return new AppError({
      code: "issue.usage",
      message: "refs.files and refs.directories must be arrays",
      recoverable: false,
    });
  }
  for (const file of refs.files) {
    if (typeof file !== "string" || file.length === 0) {
      return new AppError({
        code: "issue.usage",
        message: "refs.files entries must be non-empty strings",
        recoverable: false,
      });
    }
  }
  for (const directory of refs.directories) {
    if (typeof directory !== "string" || directory.length === 0) {
      return new AppError({
        code: "issue.usage",
        message: "refs.directories entries must be non-empty strings",
        recoverable: false,
      });
    }
  }
  const provider = request.provider;
  if (provider === null || typeof provider !== "object") {
    return new AppError({
      code: "issue.usage",
      message: "provider must be a DecisionProvider",
      recoverable: false,
    });
  }
  if (
    typeof provider.selectAction !== "function" ||
    typeof provider.assess !== "function"
  ) {
    return new AppError({
      code: "issue.usage",
      message: "provider must implement selectAction and assess",
      recoverable: false,
    });
  }
  return undefined;
}

function validateContainment(
  root: string,
  refs: TaskRefs,
): AppError | undefined {
  try {
    assertContained(root, root);
    for (const file of refs.files) assertContained(root, file);
    for (const directory of refs.directories) assertContained(root, directory);
    return undefined;
  } catch (error) {
    return toHarnessError(error);
  }
}

/**
 * Connection harness (§29): drives the frozen Phase 2 `runTask` seam using
 * Phase 1 Foundation primitives, through the public barrels only. Returns a
 * Phase 1 `Result` — `ok` carries the Phase 2 run outcome (terminal
 * `TaskState`), optional AD-1 translations of failed tool outcomes, and
 * deterministic structured records; `err` carries a harness-layer `AppError`
 * (invalid input, containment violation, or unexpected harness error).
 */
export async function runIntegrationTask(
  request: IntegrationTaskRequest,
): Promise<Result<IntegrationTaskResult, AppError>> {
  const requestError = validateRequest(request);
  if (requestError !== undefined) {
    return err(requestError);
  }

  const containmentError = validateContainment(request.root, request.refs);
  if (containmentError !== undefined) {
    return err(containmentError);
  }

  const records: HarnessRecord[] = [];
  records.push({ event: "validate", outcome: "ok" });

  const options: TaskOptions = {
    root: request.root,
    refs: request.refs,
    bounds: request.bounds ?? DEFAULT_BOUNDS,
    ...(request.includeHidden !== undefined
      ? { includeHidden: request.includeHidden }
      : {}),
    ...(request.objective !== undefined
      ? { objective: request.objective }
      : {}),
  };

  const logger: Logger | undefined =
    request.loggerConfig !== undefined
      ? createLogger(request.loggerConfig)
      : undefined;
  logger?.debug("harness: integration run starting", {
    root: request.root,
  });

  let run: TaskResult;
  try {
    run = await runToolRuntime(
      options,
      request.provider,
      request.signal !== undefined ? { signal: request.signal } : undefined,
    );
  } catch (error) {
    const harnessError = toHarnessError(error);
    logger?.error("harness: run failed at harness layer", {
      code: harnessError.code,
      message: harnessError.message,
    });
    return err(harnessError);
  }

  records.push({ event: "run", status: run.state.status });
  logger?.info("harness: integration run completed", {
    status: run.state.status,
  });

  const toolErrors: AppError[] = [];
  const lastResult = run.state.lastResult;
  if (lastResult !== undefined && isFailedToolResult(lastResult)) {
    const appError = translateToolError(lastResult);
    toolErrors.push(appError);
    records.push({ event: "translate", code: lastResult.error.code });
  }

  return ok({ run, toolErrors, records });
}
