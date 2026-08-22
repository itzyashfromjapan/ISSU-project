/**
 * ISSU Phase 2 — ToolRuntime: public barrel.
 *
 * This module defines the exact public interface specified by
 * SPECIFICATION.md §17 (Public API). It is the ONLY public surface of Phase 2:
 * internal modules (the state machine driver, the runtime implementation) are
 * private and SHALL never be imported by consumers (§17.3).
 *
 * The behavioral implementations (runTask, createToolRuntime,
 * deriveAvailableActions) are implemented at milestone P4 in private internal
 * modules and re-exported here unchanged.
 */

// States — FROZEN nine-state machine (§5.1)
export type TaskStatus =
  | "READY"
  | "SELECTING"
  | "EXECUTING"
  | "EVALUATING"
  | "CORRECTING"
  | "VERIFYING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

// The two filesystem operations — the ONLY operations Phase 2 may execute (§8, §10.1)
export type ToolOperation = "readFile" | "listDirectory";

// §8
export interface ActionRef {
  readonly operation: ToolOperation;
  readonly target: string; // absolute path; MUST resolve inside the authorized root
  readonly read?: ReadOptions; // present iff operation === 'readFile'
  readonly list?: ListOptions; // present iff operation === 'listDirectory'
}

// §10.2
export interface ReadOptions {
  readonly maxBytes?: number; // total cap for this read; default = bounds.maxBytesPerRead
  readonly chunkSize?: number; // chunk size; default = bounds.chunkSize
}

// §10.3
export interface ListOptions {
  readonly includeHidden?: boolean; // default false
}

// §13.2 — complete, frozen classification set
export type OutcomeClass =
  | "success"
  | "invalidContent"
  | "notFound"
  | "accessDenied"
  | "tooLarge"
  | "invalidInput"
  | "executionError"
  | "internalError";

// §6.2 — deterministic correction direction; NEVER produced by DecisionProvider
export type CorrectionDirection = "RETRY" | "ADVANCE" | "EXHAUST";

export interface FileContent {
  readonly text: string; // strictly valid UTF-8; never contains invalid bytes
  readonly bytesRead: number;
}

export interface DirectoryEntry {
  readonly name: string;
  readonly isDirectory: boolean;
  readonly isHidden: boolean;
}

export interface DirectoryListing {
  readonly entries: readonly DirectoryEntry[];
}

// data present iff ok; error present iff not ok
export interface ToolResult {
  readonly ok: boolean;
  readonly action: ActionRef;
  readonly classification: OutcomeClass;
  readonly data?: FileContent | DirectoryListing; // present iff ok
  readonly error?: { readonly code: string; readonly message: string }; // code = issue.tool.*; message never embeds content/secrets
  readonly bytesRead?: number;
}

export interface TaskRefs {
  readonly files: readonly string[];
  readonly directories: readonly string[];
}

// §12
export interface ResourceBounds {
  readonly maxRetries: number; // per-ActionRef, ≥ 1
  readonly maxCorrections: number; // per-run, ≥ 1
  readonly maxVerifications: number; // per-run, ≥ 1
  readonly maxBytesPerRead: number; // per-read, > 0
  readonly chunkSize: number; // > 0 and ≤ maxBytesPerRead
}

// §4
export interface TaskOptions {
  readonly root: string; // authorized root; absolute canonical path
  readonly objective?: string; // advisory; never used to derive actions
  readonly refs: TaskRefs; // fixed plan — the ONLY work items
  readonly includeHidden?: boolean; // default for listDirectory
  readonly bounds: ResourceBounds;
}

// §5.1
export interface TaskState {
  readonly status: TaskStatus;
  readonly attempts: {
    readonly retries: number;
    readonly corrections: number;
    readonly verifications: number;
  };
  readonly completed: {
    readonly files: readonly string[];
    readonly directories: readonly string[];
  };
  readonly lastAction?: ActionRef;
  readonly lastResult?: ToolResult;
  readonly lastCorrection?: CorrectionDirection;
}

export interface AvailableAction {
  readonly ref: ActionRef;
}

// §7 — the ONLY model-permitted contract; Phase 2 never talks to a model itself
export interface DecisionProvider {
  selectAction(
    available: readonly AvailableAction[],
    state: TaskState,
  ): Promise<ActionRef>;
  assess(result: ToolResult, state: TaskState): Promise<Assessment>;
}

export interface Assessment {
  readonly classification: OutcomeClass; // neutral classification only; never a control-flow directive
}

export interface TaskResult {
  readonly state: TaskState; // final state; status SHALL be terminal
}

// §9 — exclusive EXECUTING dispatch seam
export interface ToolRuntime {
  execute(ref: ActionRef): Promise<ToolResult>;
}

// Public functions
// Drives the frozen nine-state machine deterministically; dispatches exclusively
// through an internal ToolRuntime; consults the provider only at SELECTING/EVALUATING.
export { runTask } from "./internal/machine.js";

// Constructs the Phase 2 ToolRuntime bound to the authorized root and bounds.
export { createToolRuntime } from "./internal/runtime.js";

// §4.3 — pure, deterministic available-action derivation.
export { deriveAvailableActions } from "./internal/actions.js";
