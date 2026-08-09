import { describe, expect, it } from "vitest";
import { AppError } from "../../src/errors/app-error.js";
import { toAppError } from "../../src/errors/normalize.js";

describe("toAppError", () => {
  it("passes AppError instances through unchanged", () => {
    const error = new AppError({ code: "issue.config.parse", message: "bad" });
    expect(toAppError(error)).toBe(error);
  });

  it("wraps plain Errors as issue.internal with the original as cause", () => {
    const original = new Error("boom");
    const error = toAppError(original);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe("issue.internal");
    expect(error.recoverable).toBe(false);
    expect(error.message).toBe("boom");
    expect(error.cause).toBe(original);
  });

  it("normalizes non-Error values into issue.internal AppErrors", () => {
    const error = toAppError("boom");
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe("issue.internal");
    expect(error.recoverable).toBe(false);
    expect(error.message).toBe("Unexpected non-Error value thrown (string)");
  });

  it("normalizes null without throwing", () => {
    const error = toAppError(null);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe("issue.internal");
  });
});
