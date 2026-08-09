import { describe, expect, it } from "vitest";
import { AppError } from "../../src/errors/app-error.js";
import {
  configFromEnv,
  configFromFile,
  mergeConfigLayers,
} from "../../src/config/resolve.js";
import { configError, toAppError } from "../../src/config/config-error.js";

const INVALID_CODE = "issue.config.invalid";

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
    return undefined;
  } catch (error) {
    return (error as { code?: string }).code;
  }
}

describe("mergeConfigLayers", () => {
  it("applies built-in defaults when no layers are provided", () => {
    expect(mergeConfigLayers()).toEqual({
      logLevel: "info",
      logPretty: false,
      redact: [],
    });
  });

  it("lets later scalar layers override earlier ones", () => {
    expect(
      mergeConfigLayers({ logLevel: "warn" }, { logLevel: "debug" }).logLevel,
    ).toBe("debug");
  });

  it("overrides logPretty from a later layer", () => {
    expect(mergeConfigLayers({}, { logPretty: true }).logPretty).toBe(true);
  });

  it("unions redact across layers without dropping values", () => {
    const merged = mergeConfigLayers(
      { redact: ["requestId"] },
      { redact: ["requestId", "traceId"] },
    );
    expect(merged.redact).toEqual(["requestId", "traceId"]);
  });

  it("demonstrates the full precedence chain defaults < file < env < flags", () => {
    const merged = mergeConfigLayers(
      { logLevel: "warn" },
      { logLevel: "error" },
      { logLevel: "fatal" },
    );
    expect(merged.logLevel).toBe("fatal");
  });

  it("rejects an invalid logLevel with issue.config.invalid", () => {
    expect(
      codeOf(() => mergeConfigLayers({ logLevel: "verbose" as never })),
    ).toBe(INVALID_CODE);
  });

  it("rejects an invalid logPretty with issue.config.invalid", () => {
    expect(codeOf(() => mergeConfigLayers({ logPretty: "yes" as never }))).toBe(
      INVALID_CODE,
    );
  });

  it("rejects a non-string redact entry with issue.config.invalid", () => {
    expect(
      codeOf(() => mergeConfigLayers({ redact: ["a", 42] as never })),
    ).toBe(INVALID_CODE);
  });
});

describe("configFromFile", () => {
  it("coerces a valid file object into a config layer", () => {
    expect(
      configFromFile({ logLevel: "debug", logPretty: true, redact: ["a"] }),
    ).toEqual({ logLevel: "debug", logPretty: true, redact: ["a"] });
  });

  it("ignores unknown top-level keys (forward-compatible)", () => {
    expect(configFromFile({ logLevel: "debug", futureSetting: 123 })).toEqual({
      logLevel: "debug",
    });
  });

  it("rejects a non-object top level", () => {
    expect(codeOf(() => configFromFile("[1, 2]"))).toBe(INVALID_CODE);
    expect(codeOf(() => configFromFile("nope"))).toBe(INVALID_CODE);
    expect(codeOf(() => configFromFile(null))).toBe(INVALID_CODE);
  });

  it("rejects an invalid logLevel value", () => {
    expect(codeOf(() => configFromFile({ logLevel: "loud" }))).toBe(
      INVALID_CODE,
    );
    expect(codeOf(() => configFromFile({ logLevel: 5 }))).toBe(INVALID_CODE);
  });

  it("rejects an invalid logPretty value", () => {
    expect(codeOf(() => configFromFile({ logPretty: "yes" }))).toBe(
      INVALID_CODE,
    );
  });

  it("rejects an invalid redact value", () => {
    expect(codeOf(() => configFromFile({ redact: "requestId" }))).toBe(
      INVALID_CODE,
    );
    expect(codeOf(() => configFromFile({ redact: [1] }))).toBe(INVALID_CODE);
  });
});

describe("configFromEnv", () => {
  it("maps documented ISSU_* variables to config values", () => {
    expect(
      configFromEnv({
        ISSU_LOG_LEVEL: "error",
        ISSU_LOG_PRETTY: "true",
        ISSU_REDACT: " a , b ,,",
      }),
    ).toEqual({ logLevel: "error", logPretty: true, redact: ["a", "b"] });
  });

  it("returns an empty layer when no mapped variables are present", () => {
    expect(configFromEnv({ ISSU_OTHER: "x" })).toEqual({});
  });

  it("rejects an invalid ISSU_LOG_LEVEL", () => {
    expect(codeOf(() => configFromEnv({ ISSU_LOG_LEVEL: "loud" }))).toBe(
      INVALID_CODE,
    );
  });

  it("rejects an invalid ISSU_LOG_PRETTY", () => {
    expect(codeOf(() => configFromEnv({ ISSU_LOG_PRETTY: "yes" }))).toBe(
      INVALID_CODE,
    );
  });

  it("maps ISSU_LOG_PRETTY=false to false", () => {
    expect(configFromEnv({ ISSU_LOG_PRETTY: "false" })).toEqual({
      logPretty: false,
    });
  });
});

describe("config error mechanism (real AppError since M5)", () => {
  it("creates real AppError instances with the requested code", () => {
    const error = configError("issue.config.parse", "bad config");
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe("issue.config.parse");
    expect(error.recoverable).toBe(true);
    expect(error.name).toBe("AppError");
  });

  it("passes through config errors unchanged", () => {
    const error = configError("issue.config.invalid", "bad");
    expect(toAppError(error)).toBe(error);
  });

  it("wraps unexpected errors as issue.internal (recoverable=false)", () => {
    const wrapped = toAppError(new Error("boom"));
    expect(wrapped.code).toBe("issue.internal");
    expect(wrapped.recoverable).toBe(false);
    expect(wrapped.message).toContain("boom");
  });

  it("includes cause and details when provided", () => {
    const cause = new Error("root");
    const error = configError("issue.config.notfound", "missing", {
      cause,
      details: { path: "/x" },
    });
    expect(error.cause).toBe(cause);
    expect(error.details).toEqual({ path: "/x" });
  });
});
