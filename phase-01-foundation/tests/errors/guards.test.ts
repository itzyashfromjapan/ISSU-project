import { describe, expect, it } from "vitest";
import { AppError } from "../../src/errors/app-error.js";
import { isAppError, toError } from "../../src/errors/guards.js";

const SECRET = "SYNTHETIC-TOKEN-secret-9";

describe("toError", () => {
  it("passes AppError instances through unchanged", () => {
    const error = new AppError({ code: "issue.internal", message: "known" });
    expect(toError(error)).toBe(error);
  });

  it("passes plain Errors through unchanged", () => {
    const error = new Error("boom");
    expect(toError(error)).toBe(error);
  });

  it("normalizes thrown strings into issue.internal AppErrors", () => {
    const error = toError("boom");
    expect(error).toBeInstanceOf(AppError);
    const appError = error as AppError;
    expect(appError.message).toBe("Unexpected non-Error value thrown (string)");
    expect(appError.code).toBe("issue.internal");
    expect(appError.recoverable).toBe(false);
  });

  it("never leaks the raw non-Error value", () => {
    const error = toError(SECRET);
    expect(error.message).not.toContain("SYNTHETIC-TOKEN");
    expect(JSON.stringify(error)).not.toContain("SYNTHETIC-TOKEN");
  });

  it("describes other non-Error values by type", () => {
    expect(toError(42).message).toBe(
      "Unexpected non-Error value thrown (number)",
    );
    expect(toError(null).message).toBe(
      "Unexpected non-Error value thrown (null)",
    );
    expect(toError(undefined).message).toBe(
      "Unexpected non-Error value thrown (undefined)",
    );
    expect(toError({ nested: 1 }).message).toBe(
      "Unexpected non-Error value thrown (object)",
    );
    expect(toError([1, 2]).message).toBe(
      "Unexpected non-Error value thrown (array)",
    );
    expect(toError(() => 1).message).toBe(
      "Unexpected non-Error value thrown (function)",
    );
  });
});

describe("isAppError", () => {
  it("recognizes AppError instances and rejects others", () => {
    expect(
      isAppError(new AppError({ code: "issue.internal", message: "x" })),
    ).toBe(true);
    expect(isAppError(new Error("plain"))).toBe(false);
    expect(isAppError({ code: "issue.internal" })).toBe(false);
    expect(isAppError("issue.internal")).toBe(false);
  });
});
