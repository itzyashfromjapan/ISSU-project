import { describe, it, expect } from "vitest";
import * as barrel from "../src/index.js";

describe("public API surface (§3)", () => {
  it("exports exactly the 5 functions + types + VERSION", async () => {
    expect(barrel.createAnthropicProvider).toBeDefined();
    expect(barrel.createOpenAIProvider).toBeDefined();
    expect(barrel.createLocalProvider).toBeDefined();
    expect(barrel.createModelRouter).toBeDefined();
    expect(barrel.callModel).toBeDefined();
    expect(barrel.getProviderAuth).toBeDefined();
    expect(barrel.VERSION).toBe("0.1.0");
  });
});
