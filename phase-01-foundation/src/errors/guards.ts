import { AppError } from "./app-error.js";

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

export function toError(value: unknown): Error {
  if (value instanceof AppError) return value;
  if (value instanceof Error) return value;
  return new AppError({
    code: "issue.internal",
    message: `Unexpected non-Error value thrown (${describeType(value)})`,
    recoverable: false,
  });
}

function describeType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}
