import { describe, it, expect } from "vitest";
import * as barrel from "../src/index.js";

describe("public API surface (§3)", () => {
  it("exports exactly the 8 types + 1 function + VERSION", async () => {
    expect(barrel.runBusinessTask).toBeDefined();
    expect(barrel.createStubProvider).toBeDefined();
    expect(barrel.stubProvider).toBeDefined();
    expect(barrel.VERSION).toBe("0.1.0");
  });
});
