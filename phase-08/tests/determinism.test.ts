import { describe, it, expect } from "vitest";
import { createLocalProvider } from "../src/internal/local.js";

describe("determinism (Spec §15)", () => {
  it("local provider generateText is deterministic", async () => {
    const p = createLocalProvider();
    const a = await p.generateText("same");
    const b = await p.generateText("same");
    expect(a.ok && b.ok && a.value === b.value).toBe(true);
  });
  it("countTokens is deterministic", async () => {
    const p = createLocalProvider();
    const a = await p.countTokens("hello");
    const b = await p.countTokens("hello");
    expect(a.ok && b.ok && a.value === b.value).toBe(true);
  });
});
