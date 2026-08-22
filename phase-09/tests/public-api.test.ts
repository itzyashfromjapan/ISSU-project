import { describe, it, expect } from "vitest";
import * as barrel from "../src/index.js";

describe("public API surface (§3)", () => {
  it("exports exactly the 3 functions + types + VERSION", async () => {
    expect(barrel.getWorkspaceConfig).toBeDefined();
    expect(barrel.verifyWorkspaces).toBeDefined();
    expect(barrel.runCheckAll).toBeDefined();
    expect(barrel.createWorkspaceLogger).toBeDefined();
    expect(barrel.VERSION).toBe("0.1.0");
  });
});
