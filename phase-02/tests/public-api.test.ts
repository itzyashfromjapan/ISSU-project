import { describe, expect, expectTypeOf, it } from "vitest";
import * as runtime from "../src/index.js";
import type {
  ActionRef,
  Assessment,
  AvailableAction,
  CorrectionDirection,
  DecisionProvider,
  DirectoryEntry,
  DirectoryListing,
  FileContent,
  ListOptions,
  OutcomeClass,
  ReadOptions,
  ResourceBounds,
  TaskOptions,
  TaskRefs,
  TaskResult,
  TaskState,
  TaskStatus,
  ToolOperation,
  ToolResult,
  ToolRuntime,
} from "../src/index.js";

// §17.3: every public function and type in §17.2 SHALL have at least one test.
// Type-level equality pins each symbol to its normative §17.2 definition so any
// public-surface deviation fails the typecheck gate.
describe("§17.2 public API — type-level exactness", () => {
  it("TaskStatus is the frozen nine-state union (§5.1)", () => {
    expectTypeOf<TaskStatus>().toEqualTypeOf<
      | "READY"
      | "SELECTING"
      | "EXECUTING"
      | "EVALUATING"
      | "CORRECTING"
      | "VERIFYING"
      | "COMPLETED"
      | "FAILED"
      | "CANCELLED"
    >();
  });

  it("ToolOperation is exactly the two operations (§8)", () => {
    expectTypeOf<ToolOperation>().toEqualTypeOf<"readFile" | "listDirectory">();
  });

  it("ActionRef (§8)", () => {
    expectTypeOf<ActionRef>().toEqualTypeOf<{
      readonly operation: ToolOperation;
      readonly target: string;
      readonly read?: ReadOptions;
      readonly list?: ListOptions;
    }>();
  });

  it("ReadOptions (§10.2)", () => {
    expectTypeOf<ReadOptions>().toEqualTypeOf<{
      readonly maxBytes?: number;
      readonly chunkSize?: number;
    }>();
  });

  it("ListOptions (§10.3)", () => {
    expectTypeOf<ListOptions>().toEqualTypeOf<{
      readonly includeHidden?: boolean;
    }>();
  });

  it("OutcomeClass is the complete frozen classification set (§13.2)", () => {
    expectTypeOf<OutcomeClass>().toEqualTypeOf<
      | "success"
      | "invalidContent"
      | "notFound"
      | "accessDenied"
      | "tooLarge"
      | "invalidInput"
      | "executionError"
      | "internalError"
    >();
  });

  it("CorrectionDirection (§6.2)", () => {
    expectTypeOf<CorrectionDirection>().toEqualTypeOf<
      "RETRY" | "ADVANCE" | "EXHAUST"
    >();
  });

  it("FileContent — exact §17.2 shape without any kind field", () => {
    expectTypeOf<FileContent>().toEqualTypeOf<{
      readonly text: string;
      readonly bytesRead: number;
    }>();
  });

  it("DirectoryEntry (§17.2)", () => {
    expectTypeOf<DirectoryEntry>().toEqualTypeOf<{
      readonly name: string;
      readonly isDirectory: boolean;
      readonly isHidden: boolean;
    }>();
  });

  it("DirectoryListing — exact §17.2 shape without any kind field", () => {
    expectTypeOf<DirectoryListing>().toEqualTypeOf<{
      readonly entries: readonly DirectoryEntry[];
    }>();
  });

  it("ToolResult (§17.2)", () => {
    expectTypeOf<ToolResult>().toEqualTypeOf<{
      readonly ok: boolean;
      readonly action: ActionRef;
      readonly classification: OutcomeClass;
      readonly data?: FileContent | DirectoryListing;
      readonly error?: {
        readonly code: string;
        readonly message: string;
      };
      readonly bytesRead?: number;
    }>();
  });

  it("TaskRefs (§17.2)", () => {
    expectTypeOf<TaskRefs>().toEqualTypeOf<{
      readonly files: readonly string[];
      readonly directories: readonly string[];
    }>();
  });

  it("ResourceBounds (§12)", () => {
    expectTypeOf<ResourceBounds>().toEqualTypeOf<{
      readonly maxRetries: number;
      readonly maxCorrections: number;
      readonly maxVerifications: number;
      readonly maxBytesPerRead: number;
      readonly chunkSize: number;
    }>();
  });

  it("TaskOptions — every field preserves its readonly modifier (§17.2)", () => {
    expectTypeOf<TaskOptions>().toEqualTypeOf<{
      readonly root: string;
      readonly objective?: string;
      readonly refs: TaskRefs;
      readonly includeHidden?: boolean;
      readonly bounds: ResourceBounds;
    }>();
  });

  it("TaskState (§17.2)", () => {
    expectTypeOf<TaskState>().toEqualTypeOf<{
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
    }>();
  });

  it("AvailableAction (§17.2)", () => {
    expectTypeOf<AvailableAction>().toEqualTypeOf<{
      readonly ref: ActionRef;
    }>();
  });

  it("DecisionProvider exposes exactly the two obligations (§7)", () => {
    expectTypeOf<DecisionProvider>().toEqualTypeOf<{
      selectAction(
        available: readonly AvailableAction[],
        state: TaskState,
      ): Promise<ActionRef>;
      assess(result: ToolResult, state: TaskState): Promise<Assessment>;
    }>();
  });

  it("Assessment carries only a neutral classification (§7)", () => {
    expectTypeOf<Assessment>().toEqualTypeOf<{
      readonly classification: OutcomeClass;
    }>();
  });

  it("TaskResult (§17.2)", () => {
    expectTypeOf<TaskResult>().toEqualTypeOf<{
      readonly state: TaskState;
    }>();
  });

  it("ToolRuntime is the exclusive EXECUTING dispatch seam (§9)", () => {
    expectTypeOf<ToolRuntime>().toEqualTypeOf<{
      execute(ref: ActionRef): Promise<ToolResult>;
    }>();
  });

  it("runTask signature (§17.2)", () => {
    expectTypeOf<typeof runtime.runTask>().toEqualTypeOf<
      (
        options: TaskOptions,
        provider: DecisionProvider,
        opts?: { signal?: AbortSignal },
      ) => Promise<TaskResult>
    >();
  });

  it("createToolRuntime signature (§17.2)", () => {
    expectTypeOf<typeof runtime.createToolRuntime>().toEqualTypeOf<
      (options: { root: string; bounds: ResourceBounds }) => ToolRuntime
    >();
  });

  it("deriveAvailableActions signature (§17.2)", () => {
    expectTypeOf<typeof runtime.deriveAvailableActions>().toEqualTypeOf<
      (state: TaskState, options: TaskOptions) => AvailableAction[]
    >();
  });
});

describe("§17.3 — barrel surface", () => {
  it("exports exactly the three public functions and nothing else", () => {
    expect(Object.keys(runtime).sort()).toEqual([
      "createToolRuntime",
      "deriveAvailableActions",
      "runTask",
    ]);
  });
});
