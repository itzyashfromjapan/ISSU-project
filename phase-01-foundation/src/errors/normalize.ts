import { AppError } from "./app-error.js";
import { toError } from "./guards.js";

export function toAppError(value: unknown): AppError {
  const error = toError(value);
  if (error instanceof AppError) return error;
  return new AppError({
    code: "issue.internal",
    message: error.message,
    cause: error,
    recoverable: false,
  });
}
