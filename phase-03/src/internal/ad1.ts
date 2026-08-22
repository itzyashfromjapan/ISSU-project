import { AppError } from "@issue/foundation";
import type { ActionRef, OutcomeClass, ToolResult } from "@issue/tool-runtime";

/**
 * A structurally valid AD-1 input: a failed Phase 2 `ToolResult`
 * (ARCHITECTURE.md §28.1).
 */
export interface FailedToolResult {
  readonly ok: false;
  readonly action: ActionRef;
  readonly classification: OutcomeClass;
  readonly error: { readonly code: string; readonly message: string };
  readonly bytesRead?: number;
}

/**
 * Surrounding `ToolResult` context carried in the produced `AppError.details`
 * (§28.1: `action`/`classification`/`bytesRead` → `details`).
 */
export interface ToolErrorDetails {
  readonly action: ActionRef;
  readonly classification: OutcomeClass;
  readonly bytesRead?: number;
}

/** Narrowing guard from the full Phase 2 `ToolResult` to a `FailedToolResult`. */
export function isFailedToolResult(
  result: ToolResult,
): result is FailedToolResult {
  return result.ok === false && result.error !== undefined;
}

/**
 * AD-1 adapter (§28): translates a failed Phase 2 `ToolResult` into a Phase 1
 * `AppError`. Total and deterministic for any structurally valid
 * `FailedToolResult`; never throws; never invents codes or messages; preserves
 * `code`/`message` verbatim; maps `classification` → `recoverable` per §28.2.
 */
export function translateToolError(result: FailedToolResult): AppError {
  const details: ToolErrorDetails = {
    action: result.action,
    classification: result.classification,
    ...(result.bytesRead !== undefined ? { bytesRead: result.bytesRead } : {}),
  };
  return new AppError({
    code: result.error.code,
    message: result.error.message,
    recoverable: result.classification === "executionError",
    details,
  });
}
