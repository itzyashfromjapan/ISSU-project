import { describe, it, expect } from "vitest";
import * as barrel from "../src/index.js";

describe("public API surface", () => {
  it("exports the v0.2 platform surface", () => {
    expect(barrel.loadPlatformEnv).toBeDefined();
    expect(barrel.createResilientProvider).toBeDefined();
    expect(barrel.runPreflight).toBeDefined();
    expect(barrel.DEFAULT_RETRY_POLICY).toBeDefined();
    expect(barrel.createPlatformLogger).toBeDefined();
    expect(barrel.VERSION).toBe("0.2.0");
  });
});
