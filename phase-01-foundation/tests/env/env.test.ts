import { describe, expect, it } from "vitest";
import { readEnv } from "../../src/env/env.js";

describe("readEnv", () => {
  it("snapshots only ISSU_* variables from a custom source", () => {
    const source = {
      ISSU_LOG_LEVEL: "debug",
      ISSU_REDACT: "a",
      PATH: "/usr/bin",
      HOME: "/home/x",
    };
    expect(readEnv(source)).toEqual({
      ISSU_LOG_LEVEL: "debug",
      ISSU_REDACT: "a",
    });
  });

  it("returns an empty snapshot when no ISSU_* variables exist", () => {
    expect(readEnv({ PATH: "/usr/bin" })).toEqual({});
  });

  it("includes unknown ISSU_* variables in the snapshot", () => {
    expect(readEnv({ ISSU_FUTURE_FLAG: "1" })).toEqual({
      ISSU_FUTURE_FLAG: "1",
    });
  });

  it("reads from process.env by default", () => {
    process.env.ISSU_TEST_SNAPSHOT = "value-1";
    try {
      expect(readEnv().ISSU_TEST_SNAPSHOT).toBe("value-1");
    } finally {
      delete process.env.ISSU_TEST_SNAPSHOT;
    }
  });
});
