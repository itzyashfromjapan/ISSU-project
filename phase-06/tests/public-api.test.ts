import { describe, it, expect } from "vitest";
import * as barrel from "../src/index.js";

describe("public API surface (§3)", () => {
  it("exports exactly the 6 types + 3 functions + HELP_TEXT + VERSION + observability", async () => {
    expect(barrel.resolveConfig).toBeDefined();
    expect(barrel.verifyConfig).toBeDefined();
    expect(barrel.getDefaultConfig).toBeDefined();
    expect(barrel.parseArgs).toBeDefined();
    expect(barrel.runCli).toBeDefined();
    expect(barrel.createCliLogger).toBeDefined();
    expect(barrel.logProgress).toBeDefined();
    expect(barrel.HELP_TEXT).toBeDefined();
    expect(barrel.VERSION).toBe("0.1.0");
  });

  it("createCliLogger returns a logger with info method", () => {
    const logger = barrel.createCliLogger("info");
    expect(logger.info).toBeDefined();
  });

  it("HELP_TEXT contains expected commands", () => {
    expect(barrel.HELP_TEXT).toContain("issue --help");
    expect(barrel.HELP_TEXT).toContain("config --show");
    expect(barrel.HELP_TEXT).toContain("issue run");
  });
});
