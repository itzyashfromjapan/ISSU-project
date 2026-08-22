/**
 * ISSU Phase 4 — Research: retrieval / source handling (§12.2) through the
 * frozen Phase 3 integration seam (§6). The deterministic core captures each
 * ref target's file content by invoking `runIntegrationTask` with a
 * single-target plan, so that `TaskState.lastResult` carries that target's
 * `FileContent` (the seam exposes only the LAST tool result).
 */

import { AppError, isOk, ok } from "@issue/foundation";
import type { Logger, Result } from "@issue/foundation";
import {
  createDeterministicProviderStub,
  runIntegrationTask,
} from "@issue/integration";
import type {
  DirectoryListing,
  ResourceBounds,
  TaskRefs,
} from "@issue/tool-runtime";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";

export interface RetrievedSource {
  readonly path: string;
  readonly title: string;
  readonly content: string;
  readonly bytesRead: number;
}

export interface RetrievalFailure {
  readonly target: string;
  readonly error: AppError;
}

export interface RetrievalOutcome {
  readonly sources: readonly RetrievedSource[];
  readonly failures: readonly RetrievalFailure[];
  readonly cancelled: boolean;
}

/**
 * Derive the authorized root as the common ancestor of all ref targets (§8.1
 * refs must pass Phase 2 containment semantics). Absolute canonical root.
 */
export function deriveRoot(refs: TaskRefs): string {
  const anchors: string[] = [];
  for (const file of refs.files) anchors.push(dirname(resolve(file)));
  for (const dir of refs.directories) anchors.push(resolve(dir));
  if (anchors.length === 0) return resolve(".");
  let root = anchors[0] as string;
  for (const anchor of anchors.slice(1)) {
    root = commonAncestor(root, anchor);
  }
  return root;
}

function commonAncestor(a: string, b: string): string {
  let current = a;
  while (!isWithin(current, b)) {
    const parent = dirname(current);
    if (parent === current) return current;
    current = parent;
  }
  return current;
}

function isWithin(root: string, candidate: string): boolean {
  const rel = relative(resolve(root), resolve(candidate));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

/**
 * Expand refs into read targets. Files are read targets directly; directories
 * are listed (single-level, §8.1) and each file entry becomes a read target,
 * respecting `includeHidden`.
 */
export interface ReadTarget {
  readonly path: string;
  readonly kind: "file" | "directory";
}

export function expandRefs(refs: TaskRefs): readonly ReadTarget[] {
  const files = refs.files.map((path) => ({ path, kind: "file" as const }));
  const dirs = refs.directories.map((path) => ({
    path,
    kind: "directory" as const,
  }));
  return [...files, ...dirs];
}

/**
 * Execute bounded read/list through the Phase 3 seam. Each file target is read
 * via a single-target integration plan so its content is captured from
 * `TaskState.lastResult`. Directory targets are listed, then each discovered
 * file entry is read.
 *
 * Failure semantics (§13): any non-recoverable target failure (including
 * harness-layer rejections, e.g. containment violations) is recorded in
 * `failures`; the caller decides escalation. Cancellation is reported via
 * `cancelled`.
 */
export async function retrieveSources(
  root: string,
  refs: TaskRefs,
  bounds: ResourceBounds,
  includeHidden: boolean,
  signal: AbortSignal | undefined,
  logger: Logger | undefined,
): Promise<Result<RetrievalOutcome, AppError>> {
  const provider = createDeterministicProviderStub();
  const sources: RetrievedSource[] = [];
  const failures: RetrievalFailure[] = [];

  const targets = expandRefs(refs);

  for (const target of targets) {
    if (signal?.aborted === true) {
      return ok({ sources, failures, cancelled: true });
    }
    if (target.kind === "file") {
      const outcome = await readTarget(
        root,
        target.path,
        bounds,
        includeHidden,
        provider,
        signal,
        logger,
      );
      if (outcome.cancelled) {
        return ok({ sources, failures, cancelled: true });
      }
      if (outcome.content !== undefined) {
        sources.push({
          path: target.path,
          title: basename(target.path),
          content: outcome.content,
          bytesRead: outcome.bytesRead,
        });
      } else if (outcome.error !== undefined) {
        failures.push({ target: target.path, error: outcome.error });
      }
      continue;
    }

    const listing = await listDirectory(
      root,
      target.path,
      bounds,
      includeHidden,
      provider,
      signal,
      logger,
    );
    if (listing.cancelled) {
      return ok({ sources, failures, cancelled: true });
    }
    if (listing.error !== undefined) {
      failures.push({ target: target.path, error: listing.error });
      continue;
    }
    const entries = listing.entries ?? [];
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      if (!includeHidden && entry.isHidden) continue;
      const filePath = resolve(target.path, entry.name);
      const outcome = await readTarget(
        root,
        filePath,
        bounds,
        includeHidden,
        provider,
        signal,
        logger,
      );
      if (outcome.cancelled) {
        return ok({ sources, failures, cancelled: true });
      }
      if (outcome.content !== undefined) {
        sources.push({
          path: filePath,
          title: entry.name,
          content: outcome.content,
          bytesRead: outcome.bytesRead,
        });
      } else if (outcome.error !== undefined) {
        failures.push({ target: filePath, error: outcome.error });
      }
    }
  }

  return ok({ sources, failures, cancelled: false });
}

interface ReadOutcome {
  readonly content?: string;
  readonly bytesRead: number;
  readonly error?: AppError;
  readonly cancelled: boolean;
}

async function readTarget(
  root: string,
  path: string,
  bounds: ResourceBounds,
  includeHidden: boolean,
  provider: ReturnType<typeof createDeterministicProviderStub>,
  signal: AbortSignal | undefined,
  logger: Logger | undefined,
): Promise<ReadOutcome> {
  const result = await runIntegrationTask({
    root,
    provider,
    refs: { files: [path], directories: [] },
    bounds,
    includeHidden,
    ...(signal !== undefined ? { signal } : {}),
  });
  if (!isOk(result)) {
    logger?.error("research: target read rejected at harness layer", {
      code: result.error.code,
      message: result.error.message,
    });
    return { bytesRead: 0, error: result.error, cancelled: false };
  }
  const run = result.value.run.state;
  if (run.status === "CANCELLED") {
    return { bytesRead: 0, cancelled: true };
  }
  if (run.status === "FAILED") {
    const toolError = result.value.toolErrors[0];
    const error = toolError ?? notFoundError(path);
    logger?.warn("research: target read failed", {
      target: path,
      code: error.code,
    });
    return { bytesRead: 0, error, cancelled: false };
  }
  const last = run.lastResult;
  if (
    last !== undefined &&
    last.ok &&
    last.data !== undefined &&
    "text" in last.data
  ) {
    return {
      content: last.data.text,
      bytesRead: last.data.bytesRead,
      cancelled: false,
    };
  }
  // Unreachable by frozen Phase 2 invariants: a COMPLETED single-file plan
  // always carries that file's successful `FileContent` as `lastResult`;
  // every other terminal status is handled above (CANCELLED / FAILED).
  return { bytesRead: 0, cancelled: false };
}

interface ListOutcome {
  readonly entries?: DirectoryListing["entries"];
  readonly error?: AppError;
  readonly cancelled: boolean;
}

async function listDirectory(
  root: string,
  path: string,
  bounds: ResourceBounds,
  includeHidden: boolean,
  provider: ReturnType<typeof createDeterministicProviderStub>,
  signal: AbortSignal | undefined,
  logger: Logger | undefined,
): Promise<ListOutcome> {
  const result = await runIntegrationTask({
    root,
    provider,
    refs: { files: [], directories: [path] },
    bounds,
    includeHidden,
    ...(signal !== undefined ? { signal } : {}),
  });
  if (!isOk(result)) {
    logger?.error("research: directory list rejected at harness layer", {
      code: result.error.code,
      message: result.error.message,
    });
    return { error: result.error, cancelled: false };
  }
  const run = result.value.run.state;
  if (run.status === "CANCELLED") {
    return { cancelled: true };
  }
  if (run.status === "FAILED") {
    const toolError = result.value.toolErrors[0];
    const error = toolError ?? notFoundError(path);
    logger?.warn("research: directory list failed", {
      target: path,
      code: error.code,
    });
    return { error, cancelled: false };
  }
  const last = run.lastResult;
  if (
    last !== undefined &&
    last.ok &&
    last.data !== undefined &&
    "entries" in last.data
  ) {
    return { entries: last.data.entries, cancelled: false };
  }
  // Unreachable by frozen Phase 2 invariants: a COMPLETED single-directory
  // plan always carries that directory's successful `DirectoryListing` as
  // `lastResult`; every other terminal status is handled above.
  return { cancelled: false };
}

function notFoundError(target: string): AppError {
  return new AppError({
    code: "issue.research.retrieval",
    message: `target could not be retrieved: "${target}"`,
    recoverable: false,
    details: { target },
  });
}
