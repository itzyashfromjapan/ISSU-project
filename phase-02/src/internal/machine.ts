import type {
  ActionRef,
  CorrectionDirection,
  DecisionProvider,
  OutcomeClass,
  TaskOptions,
  TaskResult,
  TaskState,
  TaskStatus,
  ToolResult,
} from "../index.js";
import { deriveAvailableActions } from "./actions.js";
import { createRunLog, createRunLogger, nextRunId } from "./observability.js";
import { coerceActionRef, errorResult, fallbackActionRef } from "./results.js";
import { createToolRuntime } from "./runtime.js";
import {
  parseAssessment,
  sameActionRef,
  validateOptions,
  validateProvider,
} from "./validate.js";

interface InternalState {
  status: TaskStatus;
  retries: number;
  corrections: number;
  verifications: number;
  completedFiles: string[];
  completedDirs: string[];
  lastAction?: ActionRef;
  lastResult?: ToolResult;
  lastCorrection?: CorrectionDirection;
  classification?: OutcomeClass;
}

const FATAL_CLASSIFICATIONS: readonly OutcomeClass[] = [
  "invalidInput",
  "internalError",
];

const NON_RETRYABLE_NON_FATAL: readonly OutcomeClass[] = [
  "invalidContent",
  "notFound",
  "accessDenied",
  "tooLarge",
];

function snapshot(state: InternalState): TaskState {
  const result: TaskState = {
    status: state.status,
    attempts: {
      retries: state.retries,
      corrections: state.corrections,
      verifications: state.verifications,
    },
    completed: {
      files: [...state.completedFiles],
      directories: [...state.completedDirs],
    },
    ...(state.lastAction !== undefined ? { lastAction: state.lastAction } : {}),
    ...(state.lastResult !== undefined ? { lastResult: state.lastResult } : {}),
    ...(state.lastCorrection !== undefined
      ? { lastCorrection: state.lastCorrection }
      : {}),
  };
  return result;
}

function isFatal(classification: OutcomeClass): boolean {
  return (FATAL_CLASSIFICATIONS as readonly string[]).includes(classification);
}

function allRefsCompleted(state: InternalState, options: TaskOptions): boolean {
  const files = new Set(options.refs.files);
  const directories = new Set(options.refs.directories);
  for (const file of state.completedFiles) files.delete(file);
  for (const dir of state.completedDirs) directories.delete(dir);
  return files.size === 0 && directories.size === 0;
}

function correctionDirection(
  classification: OutcomeClass,
  retries: number,
  maxRetries: number,
  corrections: number,
  maxCorrections: number,
): CorrectionDirection {
  if (classification === "executionError" && retries < maxRetries) {
    return "RETRY";
  }
  if (
    (NON_RETRYABLE_NON_FATAL as readonly string[]).includes(classification) &&
    corrections <= maxCorrections
  ) {
    return "ADVANCE";
  }
  return "EXHAUST";
}

function isAvailableSelection(
  available: readonly { ref: ActionRef }[],
  selected: unknown,
): boolean {
  if (selected === null || typeof selected !== "object") return false;
  return available.some((item) =>
    sameActionRef(item.ref, selected as ActionRef),
  );
}

function internalErrorResult(action: ActionRef, message: string): ToolResult {
  return errorResult(action, "internalError", "readFile", message);
}

export async function runTask(
  options: TaskOptions,
  provider: DecisionProvider,
  opts?: { signal?: AbortSignal },
): Promise<TaskResult> {
  validateOptions(options);
  validateProvider(provider);
  const signal = opts?.signal;
  const runtime = createToolRuntime({
    root: options.root,
    bounds: options.bounds,
  });
  const logger = createRunLogger();
  const runId = nextRunId();
  const log = createRunLog(logger, runId);

  const state: InternalState = {
    status: "READY",
    retries: 0,
    corrections: 0,
    verifications: 0,
    completedFiles: [],
    completedDirs: [],
  };

  const maxRetries = options.bounds.maxRetries;
  const maxCorrections = options.bounds.maxCorrections;
  const maxVerifications = options.bounds.maxVerifications;

  const cancelled = (): boolean => signal !== undefined && signal.aborted;

  const finish = (status: TaskStatus): TaskResult => {
    log.completion(status, {
      retries: state.retries,
      corrections: state.corrections,
      verifications: state.verifications,
    });
    return { state: snapshot(state) };
  };

  if (cancelled()) {
    state.status = "CANCELLED";
    log.transition("READY", "CANCELLED", "aborted-before-start");
    return finish("CANCELLED");
  }

  state.status = "SELECTING";
  log.transition("READY", "SELECTING", "run-begin");

  for (;;) {
    if (isTerminal(state.status)) return finish(state.status);
    switch (state.status) {
      case "SELECTING": {
        if (cancelled()) {
          state.status = "CANCELLED";
          log.transition("SELECTING", "CANCELLED", "cancellation-requested");
          continue;
        }
        const available = deriveAvailableActions(snapshot(state), options);
        if (available.length === 0) {
          state.status = "VERIFYING";
          log.transition("SELECTING", "VERIFYING", "no-actions-available");
          continue;
        }
        const publicState = snapshot(state);
        let selected: unknown;
        try {
          selected = await provider.selectAction(available, publicState);
        } catch {
          state.status = "FAILED";
          state.lastResult = internalErrorResult(
            fallbackActionRef(),
            "DecisionProvider.selectAction threw",
          );
          log.transition("SELECTING", "FAILED", "provider-contract-violation");
          continue;
        }
        if (!isAvailableSelection(available, selected)) {
          state.status = "FAILED";
          state.lastAction = coerceActionRef(selected);
          state.lastResult = internalErrorResult(
            coerceActionRef(selected),
            "DecisionProvider.selectAction returned an action outside the available set",
          );
          log.transition("SELECTING", "FAILED", "provider-contract-violation");
          continue;
        }
        state.lastAction = selected as ActionRef;
        delete state.lastResult;
        delete state.classification;
        state.retries = 0;
        log.selection(state.lastAction);
        state.status = "EXECUTING";
        log.transition("SELECTING", "EXECUTING", "action-selected");
        continue;
      }
      case "EXECUTING": {
        if (cancelled()) {
          state.status = "CANCELLED";
          log.transition("EXECUTING", "CANCELLED", "cancellation-requested");
          continue;
        }
        const action = state.lastAction;
        if (action === undefined) {
          state.status = "FAILED";
          state.lastResult = internalErrorResult(
            fallbackActionRef(),
            "EXECUTING entered without a selected action",
          );
          log.transition("EXECUTING", "FAILED", "internal-error");
          continue;
        }
        const started = performance.now();
        const result = await runtime.execute(action);
        const durationMs = Math.round(performance.now() - started);
        state.lastResult = result;
        log.execution(result, durationMs);
        state.status = "EVALUATING";
        log.transition("EXECUTING", "EVALUATING", "tool-result");
        continue;
      }
      case "EVALUATING": {
        if (cancelled()) {
          state.status = "CANCELLED";
          log.transition("EVALUATING", "CANCELLED", "cancellation-requested");
          continue;
        }
        const result = state.lastResult;
        if (result === undefined) {
          state.status = "FAILED";
          state.lastResult = internalErrorResult(
            fallbackActionRef(),
            "EVALUATING entered without a tool result",
          );
          log.transition("EVALUATING", "FAILED", "internal-error");
          continue;
        }
        let assessment: { classification: OutcomeClass } | null;
        try {
          assessment = parseAssessment(
            await provider.assess(result, snapshot(state)),
          );
        } catch {
          state.status = "FAILED";
          state.lastResult = internalErrorResult(
            result.action,
            "DecisionProvider.assess threw",
          );
          log.transition("EVALUATING", "FAILED", "provider-contract-violation");
          continue;
        }
        if (assessment === null) {
          state.status = "FAILED";
          state.lastResult = internalErrorResult(
            result.action,
            "DecisionProvider.assess returned an invalid assessment",
          );
          log.transition("EVALUATING", "FAILED", "provider-contract-violation");
          continue;
        }
        state.classification = assessment.classification;
        log.assessment(assessment.classification);
        if (assessment.classification === "success") {
          if (result.action.operation === "readFile") {
            state.completedFiles.push(result.action.target);
          } else {
            state.completedDirs.push(result.action.target);
          }
          state.status = "VERIFYING";
          log.transition("EVALUATING", "VERIFYING", "success");
          continue;
        }
        if (assessment.classification === "tooLarge") {
          log.bound("bytes");
        }
        if (isFatal(assessment.classification)) {
          state.status = "FAILED";
          log.transition("EVALUATING", "FAILED", "fatal-classification");
          continue;
        }
        if (state.corrections >= maxCorrections) {
          state.status = "FAILED";
          log.bound("correction");
          log.transition("EVALUATING", "FAILED", "correction-exhausted");
          continue;
        }
        state.status = "CORRECTING";
        log.transition("EVALUATING", "CORRECTING", "correction-required");
        continue;
      }
      case "CORRECTING": {
        if (cancelled()) {
          state.status = "CANCELLED";
          log.transition("CORRECTING", "CANCELLED", "cancellation-requested");
          continue;
        }
        const classification = state.classification;
        if (classification === undefined) {
          state.status = "FAILED";
          state.lastResult = internalErrorResult(
            state.lastAction ?? fallbackActionRef(),
            "CORRECTING entered without a classification",
          );
          log.transition("CORRECTING", "FAILED", "internal-error");
          continue;
        }
        state.corrections += 1;
        const direction = correctionDirection(
          classification,
          state.retries,
          maxRetries,
          state.corrections,
          maxCorrections,
        );
        state.lastCorrection = direction;
        log.correction(direction, state.retries, state.corrections);
        if (direction === "RETRY") {
          state.retries += 1;
          state.status = "EXECUTING";
          log.transition("CORRECTING", "EXECUTING", "retry");
          continue;
        }
        if (direction === "ADVANCE") {
          state.status = "VERIFYING";
          log.transition("CORRECTING", "VERIFYING", "advance");
          continue;
        }
        state.status = "FAILED";
        if (classification === "executionError") {
          log.bound("retry");
        } else if (
          (NON_RETRYABLE_NON_FATAL as readonly string[]).includes(
            classification,
          )
        ) {
          log.bound("correction");
        }
        log.transition("CORRECTING", "FAILED", "exhaust");
        continue;
      }
      case "VERIFYING": {
        if (cancelled()) {
          state.status = "CANCELLED";
          log.transition("VERIFYING", "CANCELLED", "cancellation-requested");
          continue;
        }
        state.verifications += 1;
        if (allRefsCompleted(state, options)) {
          state.status = "COMPLETED";
          log.transition("VERIFYING", "COMPLETED", "verified");
          continue;
        }
        if (state.verifications >= maxVerifications) {
          state.status = "FAILED";
          log.bound("verification");
          log.transition("VERIFYING", "FAILED", "verification-exhausted");
          continue;
        }
        const available = deriveAvailableActions(snapshot(state), options);
        if (available.length === 0) {
          state.status = "FAILED";
          log.transition("VERIFYING", "FAILED", "no-actions-available");
          continue;
        }
        state.status = "SELECTING";
        log.transition("VERIFYING", "SELECTING", "more-actions-available");
        continue;
      }
      default: {
        const from = state.status;
        state.status = "FAILED";
        state.lastResult = internalErrorResult(
          state.lastAction ?? fallbackActionRef(),
          "TaskMachine reached an undefined status",
        );
        log.transition(from, "FAILED", "internal-error");
        continue;
      }
    }
  }
}

function isTerminal(status: TaskStatus): boolean {
  return (
    status === "COMPLETED" || status === "FAILED" || status === "CANCELLED"
  );
}
