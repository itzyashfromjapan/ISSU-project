import type { AppError, LoggerOptions, Result } from "@issue/foundation";
import type {
  ActionRef,
  DecisionProvider,
  OutcomeClass,
  ResourceBounds,
  TaskRefs,
  TaskResult,
  TaskStatus,
  ToolResult,
} from "@issue/tool-runtime";
import { describe, expect, expectTypeOf, it } from "vitest";
import * as integration from "../src/index.js";
import type {
  DeterministicProviderStubConfig,
  DeterministicStubTable,
  FailedToolResult,
  HarnessRecord,
  IntegrationTaskRequest,
  IntegrationTaskResult,
  ToolErrorDetails,
} from "../src/index.js";

describe("Phase 3 public barrel (§35.8)", () => {
  it("exports exactly the five public values and nothing else", () => {
    expect(Object.keys(integration).sort()).toEqual([
      "DEFAULT_BOUNDS",
      "createDeterministicProviderStub",
      "isFailedToolResult",
      "runIntegrationTask",
      "translateToolError",
    ]);
  });

  it("IntegrationTaskRequest type (§29.2)", () => {
    expectTypeOf<IntegrationTaskRequest>().toEqualTypeOf<{
      readonly root: string;
      readonly refs: TaskRefs;
      readonly bounds?: ResourceBounds;
      readonly includeHidden?: boolean;
      readonly objective?: string;
      readonly provider: DecisionProvider;
      readonly signal?: AbortSignal;
      readonly loggerConfig?: LoggerOptions;
    }>();
  });

  it("IntegrationTaskResult type (§29.6)", () => {
    expectTypeOf<IntegrationTaskResult>().toEqualTypeOf<{
      readonly run: TaskResult;
      readonly toolErrors: readonly AppError[];
      readonly records: readonly HarnessRecord[];
    }>();
  });

  it("HarnessRecord type (§29.10)", () => {
    expectTypeOf<HarnessRecord>().toEqualTypeOf<
      | { readonly event: "validate"; readonly outcome: "ok" }
      | { readonly event: "run"; readonly status: TaskStatus }
      | { readonly event: "translate"; readonly code: string }
    >();
  });

  it("DeterministicProviderStubConfig and DeterministicStubTable types (§30)", () => {
    expectTypeOf<DeterministicProviderStubConfig>().toEqualTypeOf<{
      readonly table?: DeterministicStubTable;
    }>();
    expectTypeOf<DeterministicStubTable>().toEqualTypeOf<{
      readonly selectionOrder?: readonly ActionRef[];
      readonly assessments?: ReadonlyMap<string, OutcomeClass>;
    }>();
  });

  it("FailedToolResult and ToolErrorDetails types (§28.1)", () => {
    expectTypeOf<FailedToolResult>().toEqualTypeOf<{
      readonly ok: false;
      readonly action: ActionRef;
      readonly classification: OutcomeClass;
      readonly error: { readonly code: string; readonly message: string };
      readonly bytesRead?: number;
    }>();
    expectTypeOf<ToolErrorDetails>().toEqualTypeOf<{
      readonly action: ActionRef;
      readonly classification: OutcomeClass;
      readonly bytesRead?: number;
    }>();
  });

  it("runIntegrationTask signature (§29)", () => {
    expectTypeOf<typeof integration.runIntegrationTask>().toEqualTypeOf<
      (
        request: IntegrationTaskRequest,
      ) => Promise<Result<IntegrationTaskResult, AppError>>
    >();
  });

  it("createDeterministicProviderStub signature (§30)", () => {
    expectTypeOf<
      typeof integration.createDeterministicProviderStub
    >().toEqualTypeOf<
      (config?: DeterministicProviderStubConfig) => DecisionProvider
    >();
  });

  it("translateToolError and isFailedToolResult signatures (§28)", () => {
    expectTypeOf<typeof integration.translateToolError>().toEqualTypeOf<
      (result: FailedToolResult) => AppError
    >();
    expectTypeOf<typeof integration.isFailedToolResult>().toEqualTypeOf<
      (result: ToolResult) => result is FailedToolResult
    >();
  });

  it("DEFAULT_BOUNDS mirrors frozen Phase 2 D-BOUNDS (§29.3)", () => {
    expect(integration.DEFAULT_BOUNDS).toEqual({
      maxRetries: 2,
      maxCorrections: 5,
      maxVerifications: 10,
      maxBytesPerRead: 1024 * 1024,
      chunkSize: 4096,
    });
  });

  it("no internal module is exported from the public barrel", () => {
    expect("harness" in integration).toBe(false);
    expect("ad1" in integration).toBe(false);
    expect("stub" in integration).toBe(false);
    expect("bounds" in integration).toBe(false);
    for (const key of Object.keys(integration)) {
      expect(key.includes("internal")).toBe(false);
    }
  });
});
