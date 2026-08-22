import type {
  ActionRef,
  DirectoryListing,
  FileContent,
  OutcomeClass,
  ToolOperation,
  ToolResult,
} from "../index.js";
import { codeFor, messageFor } from "./constants.js";

const FALLBACK_ACTION: ActionRef = {
  operation: "readFile",
  target: "",
  read: {},
};

export function fallbackActionRef(): ActionRef {
  return { ...FALLBACK_ACTION };
}

export function coerceActionRef(value: unknown): ActionRef {
  if (value !== null && typeof value === "object") {
    const candidate = value as Partial<ActionRef>;
    if (
      typeof candidate.target === "string" &&
      (candidate.operation === "readFile" ||
        candidate.operation === "listDirectory")
    ) {
      return candidate as ActionRef;
    }
  }
  return fallbackActionRef();
}

export function okResult(
  ref: ActionRef,
  data: FileContent | DirectoryListing,
  bytesRead?: number,
): ToolResult {
  const result: ToolResult = {
    ok: true,
    action: ref,
    classification: "success",
    data,
    ...(bytesRead !== undefined ? { bytesRead } : {}),
  };
  return result;
}

export function errorResult(
  ref: ActionRef,
  classification: OutcomeClass,
  operation: ToolOperation,
  messageOverride?: string,
): ToolResult {
  const result: ToolResult = {
    ok: false,
    action: ref,
    classification,
    error: {
      code: codeFor(classification, operation),
      message: messageOverride ?? messageFor(classification),
    },
  };
  return result;
}
