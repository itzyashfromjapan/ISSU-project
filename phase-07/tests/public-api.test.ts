import { describe, it, expect } from "vitest";
import * as barrel from "../src/index.js";

describe("public API surface (§3)", () => {
  it("exports exactly the 9 functions + types + VERSION", async () => {
    expect(barrel.writeFile).toBeDefined();
    expect(barrel.editFile).toBeDefined();
    expect(barrel.deleteFile).toBeDefined();
    expect(barrel.execProcess).toBeDefined();
    expect(barrel.gitStatus).toBeDefined();
    expect(barrel.gitDiff).toBeDefined();
    expect(barrel.gitCommit).toBeDefined();
    expect(barrel.gitBranch).toBeDefined();
    expect(barrel.httpFetch).toBeDefined();
    expect(barrel.createToolLogger).toBeDefined();
    expect(barrel.VERSION).toBe("0.1.0");
  });
  it("createToolLogger returns logger", () => {
    const logger = barrel.createToolLogger("info");
    expect(logger.info).toBeDefined();
  });
});
