import { describe, expect, it } from "vitest";
import { AppError } from "../../src/errors/app-error.js";
import { isAppError } from "../../src/errors/guards.js";

describe("AppError", () => {
  it("is an Error with a stable shape", () => {
    const error = new AppError({ code: "issue.config.parse", message: "bad" });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AppError");
    expect(error.code).toBe("issue.config.parse");
    expect(error.message).toBe("bad");
  });

  it("defaults recoverable to true", () => {
    const error = new AppError({ code: "issue.internal", message: "x" });
    expect(error.recoverable).toBe(true);
  });

  it("honors an explicit recoverable flag", () => {
    const error = new AppError({
      code: "issue.path.escape",
      message: "x",
      recoverable: false,
    });
    expect(error.recoverable).toBe(false);
  });

  it("omits cause and details when not provided", () => {
    const error = new AppError({ code: "issue.internal", message: "x" });
    expect(error.cause).toBeUndefined();
    expect(error.details).toBeUndefined();
  });

  it("attaches cause and details when provided", () => {
    const cause = new Error("root");
    const error = new AppError({
      code: "issue.config.invalid",
      message: "x",
      cause,
      details: { key: "logLevel" },
    });
    expect(error.cause).toBe(cause);
    expect(error.details).toEqual({ key: "logLevel" });
  });

  it("chains nested AppError causes", () => {
    const inner = new AppError({ code: "issue.internal", message: "inner" });
    const outer = new AppError({
      code: "issue.config.parse",
      message: "outer",
      cause: inner,
    });
    expect(outer.cause).toBe(inner);
    const cause = outer.cause;
    expect(isAppError(cause)).toBe(true);
    if (isAppError(cause)) {
      expect(cause.code).toBe("issue.internal");
    }
  });

  it("toJSON serializes the full shape", () => {
    const error = new AppError({
      code: "issue.config.notfound",
      message: "missing",
      recoverable: false,
      cause: "root cause",
      details: { path: "/x" },
    });
    expect(error.toJSON()).toEqual({
      name: "AppError",
      code: "issue.config.notfound",
      message: "missing",
      recoverable: false,
      cause: "root cause",
      details: { path: "/x" },
    });
  });

  it("toJSON omits optional fields that were not provided", () => {
    const error = new AppError({ code: "issue.internal", message: "x" });
    const json = error.toJSON();
    expect(json).toEqual({
      name: "AppError",
      code: "issue.internal",
      message: "x",
      recoverable: true,
    });
    expect("cause" in json).toBe(false);
    expect("details" in json).toBe(false);
  });

  it("is stable to serialize with JSON.stringify", () => {
    const error = new AppError({
      code: "issue.config.invalid",
      message: "nope",
      details: { key: "logPretty" },
    });
    const parsed: unknown = JSON.parse(JSON.stringify(error));
    expect(parsed).toEqual({
      name: "AppError",
      code: "issue.config.invalid",
      message: "nope",
      recoverable: true,
      details: { key: "logPretty" },
    });
  });
});

describe("isAppError", () => {
  it("recognizes AppError instances", () => {
    expect(
      isAppError(new AppError({ code: "issue.internal", message: "x" })),
    ).toBe(true);
  });

  it("rejects plain Errors and non-error values", () => {
    expect(isAppError(new Error("plain"))).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError({})).toBe(false);
    expect(isAppError("issue.internal")).toBe(false);
  });
});
