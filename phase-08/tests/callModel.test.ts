import { describe, it, expect } from "vitest";
import { createLocalProvider } from "../src/internal/local.js";
import { callModel } from "../src/internal/callModel.js";

describe("callModel (Spec §11)", () => {
  it("fails when prompt empty", async () => {
    const p = createLocalProvider();
    const res = await callModel("", p);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("issue.provider.validation");
  });
  it("succeeds with local provider", async () => {
    const p = createLocalProvider();
    const res = await callModel("hello", p);
    expect(res.ok && res.value === "stub response for: hello").toBe(true);
  });
  it("logs audit (no throw)", async () => {
    const p = createLocalProvider();
    const res = await callModel("test", p);
    expect(res.ok).toBe(true);
  });
});
