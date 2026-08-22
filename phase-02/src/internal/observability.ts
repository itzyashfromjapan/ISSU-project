import { createLogger, redactionList } from "@issue/foundation";
import type { Logger } from "@issue/foundation";
import type {
  ActionRef,
  CorrectionDirection,
  OutcomeClass,
  TaskStatus,
  ToolResult,
} from "../index.js";

let runCounter = 0;

export function createRunLogger(): Logger {
  return createLogger({ level: "info", redact: redactionList() });
}

export function nextRunId(): string {
  runCounter += 1;
  return `run-${runCounter}`;
}

export interface RunLog {
  transition(
    from: TaskStatus,
    to: TaskStatus,
    reason: string,
    decision?: CorrectionDirection,
  ): void;
  selection(action: ActionRef): void;
  execution(result: ToolResult, durationMs: number): void;
  assessment(classification: OutcomeClass): void;
  correction(
    direction: CorrectionDirection,
    retries: number,
    corrections: number,
  ): void;
  bound(kind: "retry" | "correction" | "verification" | "bytes"): void;
  completion(status: TaskStatus, attempts: Record<string, number>): void;
}

export function createRunLog(logger: Logger, runId: string): RunLog {
  const emit = (event: string, fields: Record<string, unknown>): void => {
    logger.info(event, { runId, ...fields });
  };
  return {
    transition(from, to, reason, decision) {
      const fields: Record<string, unknown> = { from, to, reason };
      if (decision !== undefined) fields.decision = decision;
      emit("state.transition", fields);
    },
    selection(action) {
      emit("action.selection", {
        action: { operation: action.operation, target: action.target },
      });
    },
    execution(result, durationMs) {
      emit("tool.execution", {
        action: {
          operation: result.action.operation,
          target: result.action.target,
        },
        ok: result.ok,
        classification: result.classification,
        bytesRead: result.bytesRead ?? 0,
        durationMs,
      });
    },
    assessment(classification) {
      emit("assessment", { classification });
    },
    correction(direction, retries, corrections) {
      emit("correction.decision", { direction, retries, corrections });
    },
    bound(kind) {
      emit("bound.exhaustion", { kind });
    },
    completion(status, attempts) {
      emit("run.completion", { status, attempts });
    },
  };
}
