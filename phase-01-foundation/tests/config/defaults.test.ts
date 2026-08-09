import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, LOG_LEVELS } from "../../src/config/defaults.js";

describe("config defaults", () => {
  it("provides the documented built-in defaults", () => {
    expect(DEFAULT_CONFIG).toEqual({
      logLevel: "info",
      logPretty: false,
      redact: [],
    });
  });

  it("exposes the canonical ordered log levels", () => {
    expect(LOG_LEVELS).toEqual([
      "trace",
      "debug",
      "info",
      "warn",
      "error",
      "fatal",
    ]);
  });
});
