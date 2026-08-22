import { AppError } from "@issue/foundation";
import type { ActionRef, OutcomeClass, ToolResult } from "@issue/tool-runtime";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createDeterministicProviderStub,
  isFailedToolResult,
  runIntegrationTask,
  translateToolError,
} from "../src/index.js";
import type { FailedToolResult, ToolErrorDetails } from "../src/index.js";
import { makeRoot, removeRoot } from "./helpers.js";

const readRef = (target: string): ActionRef => ({
  operation: "readFile",
  target,
  read: { maxBytes: 64, chunkSize: 16 },
});

const CODE_FOR: Record<OutcomeClass, string> = {
  success: "",
  invalidContent: "issue.tool.read.invalidcontent",
  notFound: "issue.tool.read.notfound",
  accessDenied: "issue.tool.accessdenied",
  tooLarge: "issue.tool.read.toolarge",
  invalidInput: "issue.tool.invalid",
  executionError: "issue.tool.execution",
  internalError: "issue.tool.internal",
};

function failedResult(
  classification: OutcomeClass,
  target = "/r/x.txt",
): ToolResult {
  return {
    ok: false,
    action: readRef(target),
    classification,
    error: {
      code: CODE_FOR[classification],
      message: `message for ${classification}`,
    },
  };
}

describe("AD-1 adapter (§28)", () => {
  it("isFailedToolResult narrows only failed results with an error", () => {
    expect(isFailedToolResult(failedResult("notFound"))).toBe(true);
    expect(isFailedToolResult(failedResult("executionError"))).toBe(true);
    const okResult: ToolResult = {
      ok: true,
      action: readRef("/r/x.txt"),
      classification: "success",
      data: { text: "x", bytesRead: 1 },
    };
    expect(isFailedToolResult(okResult)).toBe(false);
  });

  it("translateToolError preserves code and message verbatim and returns an AppError", () => {
    const appError = translateToolError(
      failedResult("notFound") as FailedToolResult,
    );
    expect(appError).toBeInstanceOf(AppError);
    expect(appError.code).toBe("issue.tool.read.notfound");
    expect(appError.message).toBe("message for notFound");
  });

  it("recoverable is true only for executionError (§28.2)", () => {
    const cases: Array<[OutcomeClass, boolean]> = [
      ["executionError", true],
      ["notFound", false],
      ["invalidContent", false],
      ["accessDenied", false],
      ["tooLarge", false],
      ["invalidInput", false],
      ["internalError", false],
    ];
    for (const [classification, expected] of cases) {
      const appError = translateToolError(
        failedResult(classification) as FailedToolResult,
      );
      expect(appError.recoverable).toBe(expected);
    }
  });

  it("details carry action, classification, and bytesRead when present", () => {
    const withBytes: FailedToolResult = {
      ...(failedResult("tooLarge", "/r/big.txt") as FailedToolResult),
      bytesRead: 0,
    };
    const appError = translateToolError(withBytes);
    const details = appError.details as ToolErrorDetails | undefined;
    expect(details?.action.operation).toBe("readFile");
    expect(details?.action.target).toBe("/r/big.txt");
    expect(details?.classification).toBe("tooLarge");
    expect(details?.bytesRead).toBe(0);
  });

  it("details omit bytesRead when absent", () => {
    const appError = translateToolError(
      failedResult("accessDenied") as FailedToolResult,
    );
    const details = appError.details as ToolErrorDetails | undefined;
    expect(details?.bytesRead).toBeUndefined();
    expect("bytesRead" in (details ?? {})).toBe(false);
  });

  it("integration: a real failed run produces a translated AppError matching the harness output", async () => {
    const root = await makeRoot();
    try {
      const res = await runIntegrationTask({
        root,
        provider: createDeterministicProviderStub(),
        refs: { files: [join(root, "missing.txt")], directories: [] },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const lastResult = res.value.run.state.lastResult;
      expect(lastResult).toBeDefined();
      if (lastResult === undefined) return;
      expect(isFailedToolResult(lastResult)).toBe(true);
      if (!isFailedToolResult(lastResult)) return;
      const appError = translateToolError(lastResult);
      expect(appError.code).toBe("issue.tool.read.notfound");
      expect(appError.recoverable).toBe(false);
      expect(res.value.toolErrors).toEqual([appError]);
    } finally {
      await removeRoot(root);
    }
  });
});
