import type { AppError } from "../errors/app-error.js";

export type Result<T, E = AppError> =
  { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isOk<T, E>(
  result: Result<T, E>,
): result is { ok: true; value: T } {
  return result.ok === true;
}

export function isErr<T, E>(
  result: Result<T, E>,
): result is { ok: false; error: E } {
  return result.ok === false;
}

export function match<T, E, A, B>(
  result: Result<T, E>,
  fns: { ok(value: T): A; err(error: E): B },
): A | B {
  if (result.ok === true) return fns.ok(result.value);
  return fns.err(result.error);
}

export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok === true) return result.value;
  throw result.error;
}
