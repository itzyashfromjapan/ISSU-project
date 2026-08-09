import { describe, expect, expectTypeOf, it } from "vitest";
import { AppError } from "../../src/errors/app-error.js";
import {
  err,
  isErr,
  isOk,
  match,
  ok,
  unwrap,
} from "../../src/result/result.js";
import type { Result } from "../../src/result/result.js";

describe("ok / err", () => {
  it("ok produces a success result", () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
  });

  it("err produces a failure result", () => {
    expect(err("boom")).toEqual({ ok: false, error: "boom" });
  });

  it("types ok and err as narrow single-variant results", () => {
    expectTypeOf(ok(42)).toEqualTypeOf<Result<number, never>>();
    expectTypeOf(err("boom")).toEqualTypeOf<Result<never, string>>();
  });
});

describe("isOk / isErr", () => {
  it("distinguishes the two variants", () => {
    const success: Result<number, string> = ok(1);
    const failure: Result<number, string> = err("e");
    expect(isOk(success)).toBe(true);
    expect(isErr(success)).toBe(false);
    expect(isOk(failure)).toBe(false);
    expect(isErr(failure)).toBe(true);
  });

  it("narrows the result within guards", () => {
    const success: Result<number, string> = ok(1);
    const failure: Result<number, string> = err("e");
    if (isOk(success)) {
      expectTypeOf(success.value).toEqualTypeOf<number>();
      expect(success.value).toBe(1);
    }
    if (isErr(failure)) {
      expectTypeOf(failure.error).toEqualTypeOf<string>();
      expect(failure.error).toBe("e");
    }
  });

  it("rejects an untyped result value", () => {
    const failure: Result<number, string> = err("e");
    // @ts-expect-error - the Err variant has no `value` property
    expect(failure.value).toBeUndefined();
    const success: Result<number, string> = ok(1);
    // @ts-expect-error - the Ok variant has no `error` property
    expect(success.error).toBeUndefined();
  });
});

describe("match", () => {
  it("dispatches the ok handler on success", () => {
    const result: Result<number, string> = ok(41);
    const value = match(result, { ok: (v) => v + 1, err: (e) => e.length });
    expect(value).toBe(42);
    expectTypeOf(value).toEqualTypeOf<number>();
  });

  it("dispatches the err handler on failure", () => {
    const result: Result<number, string> = err("boom");
    const value = match(result, { ok: (v) => v + 1, err: (e) => e.length });
    expect(value).toBe(4);
  });

  it("is exhaustive: every result resolves to the branch union type", () => {
    const result: Result<number, string> = ok(1);
    const value: number = match(result, {
      ok: (v) => v,
      err: (e) => Number(e),
    });
    expect(value).toBe(1);
  });
});

describe("unwrap", () => {
  it("returns the value on success", () => {
    expect(unwrap(ok(7))).toBe(7);
  });

  it("throws the error payload on failure", () => {
    expect(() => unwrap(err("boom"))).toThrow("boom");
  });

  it("throws AppError payloads as-is", () => {
    const failure = err(new AppError({ code: "issue.internal", message: "x" }));
    expect(() => unwrap(failure)).toThrow(AppError);
  });
});

describe("Result default type parameter", () => {
  it("defaults the error type to AppError", () => {
    const failure: Result<number> = err(
      new AppError({ code: "issue.internal", message: "x" }),
    );
    if (isErr(failure)) {
      expectTypeOf(failure.error).toEqualTypeOf<AppError>();
      expect(failure.error.code).toBe("issue.internal");
    }
  });
});
