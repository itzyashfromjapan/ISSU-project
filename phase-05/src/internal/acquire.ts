/**
 * ISSU Phase 5 — Data and Analytics Agents: data acquisition (data boundary,
 * ARCHITECTURE §3/§12). The deterministic core acquires `inline` content
 * directly and `localFile` content through the frozen Phase 3 integration seam
 * (single-target read), so `TaskState.lastResult` carries the target's
 * `FileContent` (§5). External acquisition is an external dependency boundary
 * — never silently implemented (§16; ARCHITECTURE §3).
 */

import { AppError, err, isOk, ok } from "@issue/foundation";
import type { Logger, Result } from "@issue/foundation";
import {
  DEFAULT_BOUNDS,
  createDeterministicProviderStub,
  isFailedToolResult,
  runIntegrationTask,
  translateToolError,
} from "@issue/integration";
import { dirname, resolve } from "node:path";
import type { DataSourceRef } from "./model.js";

export interface AcquiredSource {
  readonly ref: DataSourceRef;
  readonly content: string;
}

export interface AcquisitionOutcome {
  readonly sources: readonly AcquiredSource[];
  readonly cancelled: boolean;
}

/**
 * Acquire every data source (§5 Acquisition). Any non-recoverable target
 * failure (including a missing local file) fails the whole acquisition
 * (Phase 4 §13 non-recoverable failure precedent). Cancellation is surfaced
 * via `cancelled`.
 */
export async function acquireSources(
  refs: readonly DataSourceRef[],
  signal: AbortSignal | undefined,
  logger: Logger | undefined,
): Promise<Result<AcquisitionOutcome, AppError>> {
  const sources: AcquiredSource[] = [];
  for (const ref of refs) {
    if (signal?.aborted === true) {
      return ok({ sources, cancelled: true });
    }
    if (ref.kind === "inline") {
      sources.push({ ref, content: ref.content ?? "" });
      continue;
    }
    const read = await readLocalFile(ref, signal, logger);
    if (!isOk(read)) {
      return read;
    }
    if (read.value.cancelled) {
      return ok({ sources, cancelled: true });
    }
    sources.push({ ref, content: read.value.content });
  }
  return ok({ sources, cancelled: false });
}

type ReadOutcome =
  | { readonly cancelled: true }
  | { readonly cancelled: false; readonly content: string };

async function readLocalFile(
  ref: DataSourceRef,
  signal: AbortSignal | undefined,
  logger: Logger | undefined,
): Promise<Result<ReadOutcome, AppError>> {
  if (ref.path === undefined) {
    return err(usageError(`localFile source "${ref.id}" requires a path`));
  }
  const target = resolve(ref.path);
  const root = dirname(target);
  const result = await runIntegrationTask({
    root,
    provider: createDeterministicProviderStub(),
    refs: { files: [target], directories: [] },
    bounds: DEFAULT_BOUNDS,
    includeHidden: false,
    ...(signal !== undefined ? { signal } : {}),
  });
  if (!isOk(result)) {
    logger?.error("analytics: source read rejected at harness layer", {
      source: ref.id,
      code: result.error.code,
      message: result.error.message,
    });
    return err(result.error);
  }
  const run = result.value.run.state;
  if (run.status === "CANCELLED") {
    return ok({ cancelled: true });
  }
  if (run.status === "FAILED") {
    // §16 NORMATIVE: seam-originated errors are produced through the Phase 3
    // AD-1 adapter (`isFailedToolResult` / `translateToolError`) so they surface
    // as Phase 1 `AppError`s with the tool's code/message preserved. When the
    // harness did not surface a failed tool result (e.g. a bounds/assertion
    // failure), fall back to the harness-translated error, else a Phase 5
    // acquisition error.
    let error: AppError;
    const last = run.lastResult;
    if (last !== undefined && isFailedToolResult(last)) {
      error = translateToolError(last);
    } else if (result.value.toolErrors[0] !== undefined) {
      error = result.value.toolErrors[0];
    } else {
      error = notFoundError(ref.id, target);
    }
    logger?.warn("analytics: source read failed", {
      source: ref.id,
      code: error.code,
    });
    return err(error);
  }
  const last = run.lastResult;
  if (
    last !== undefined &&
    last.ok &&
    last.data !== undefined &&
    "text" in last.data
  ) {
    return ok({ cancelled: false, content: last.data.text });
  }
  // Unreachable by frozen Phase 2 invariants: a COMPLETED single-file plan
  // always carries that file's successful `FileContent` as `lastResult`.
  return ok({ cancelled: false, content: "" });
}

function usageError(message: string): AppError {
  return new AppError({
    code: "issue.usage",
    message,
    recoverable: false,
  });
}

function notFoundError(source: string, target: string): AppError {
  return new AppError({
    code: "issue.analytics.acquisition",
    message: `source "${source}" could not be read: "${target}"`,
    recoverable: false,
    details: { source, target },
  });
}
