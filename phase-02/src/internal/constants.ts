import type { OutcomeClass, ToolOperation } from "../index.js";

export const ERROR_CODES = {
  invalidContent: "issue.tool.read.invalidcontent",
  readNotFound: "issue.tool.read.notfound",
  listNotFound: "issue.tool.list.notfound",
  accessDenied: "issue.tool.accessdenied",
  tooLarge: "issue.tool.read.toolarge",
  invalidInput: "issue.tool.invalid",
  executionError: "issue.tool.execution",
  internalError: "issue.tool.internal",
} as const;

const VALID_OUTCOME_CLASSES: readonly OutcomeClass[] = [
  "success",
  "invalidContent",
  "notFound",
  "accessDenied",
  "tooLarge",
  "invalidInput",
  "executionError",
  "internalError",
];

export function isValidOutcomeClass(value: unknown): value is OutcomeClass {
  return (
    typeof value === "string" &&
    (VALID_OUTCOME_CLASSES as readonly string[]).includes(value)
  );
}

export function codeFor(
  classification: OutcomeClass,
  operation?: ToolOperation,
): string {
  switch (classification) {
    case "invalidContent":
      return ERROR_CODES.invalidContent;
    case "notFound":
      return operation === "readFile"
        ? ERROR_CODES.readNotFound
        : ERROR_CODES.listNotFound;
    case "accessDenied":
      return ERROR_CODES.accessDenied;
    case "tooLarge":
      return ERROR_CODES.tooLarge;
    case "invalidInput":
      return ERROR_CODES.invalidInput;
    case "executionError":
      return ERROR_CODES.executionError;
    case "internalError":
      return ERROR_CODES.internalError;
    case "success":
      return "";
  }
}

export function messageFor(classification: OutcomeClass): string {
  switch (classification) {
    case "invalidContent":
      return "File bytes are not strictly valid UTF-8.";
    case "notFound":
      return "The requested path does not exist.";
    case "accessDenied":
      return "The requested path is not authorized for access.";
    case "tooLarge":
      return "File content exceeds the maximum bytes per read.";
    case "invalidInput":
      return "The action reference is malformed.";
    case "executionError":
      return "A filesystem error occurred while executing the action.";
    case "internalError":
      return "An internal invariant was violated.";
    case "success":
      return "";
  }
}
