import { AppError } from "../errors/app-error.js";

const CONFIG_ERROR_MARKER: unique symbol = Symbol("issue.configError");

export interface ConfigErrorOptions {
  cause?: unknown;
  recoverable?: boolean;
  details?: unknown;
}

export function configError(
  code: string,
  message: string,
  options: ConfigErrorOptions = {},
): AppError {
  const error = new AppError({
    code,
    message,
    recoverable: options.recoverable ?? true,
    ...(options.cause !== undefined ? { cause: options.cause } : {}),
    ...(options.details !== undefined ? { details: options.details } : {}),
  });
  Object.defineProperty(error, CONFIG_ERROR_MARKER, {
    value: true,
    enumerable: false,
  });
  return error;
}

export function isConfigError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as Record<symbol, unknown>)[CONFIG_ERROR_MARKER] === true
  );
}

export function toAppError(error: unknown): AppError {
  if (isConfigError(error)) return error;
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return configError(
      "issue.internal",
      `Unexpected failure while loading configuration: ${error.message}`,
      {
        cause: error,
        recoverable: false,
      },
    );
  }
  return new AppError({
    code: "issue.internal",
    message: "Unexpected failure while loading configuration (non-Error value)",
    recoverable: false,
  });
}
