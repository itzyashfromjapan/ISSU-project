import { describe, it, expect } from "vitest";
import { createLocalProvider } from "../src/internal/local.js";
import { createModelRouter } from "../src/internal/router.js";

describe("ModelRouter (Spec §10)", () => {
  it("fails when no providers", () => {
    const router = createModelRouter([]);
    const res = router.route({ objective: "test" }, { providers: {} });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("issue.provider.not-configured");
  });
  it("returns first provider when no preferred", () => {
    const local = createLocalProvider();
    const router = createModelRouter([local]);
    const res = router.route({ objective: "test" }, { providers: {} });
    expect(res.ok && res.value.name === "local").toBe(true);
  });
  it("returns preferredProvider when set", () => {
    const local = createLocalProvider();
    const router = createModelRouter([local]);
    const res = router.route({ objective: "test" }, {
      providers: { preferredProvider: "local" },
    } as unknown as { providers?: Record<string, unknown> });
    expect(res.ok && res.value.name === "local").toBe(true);
  });
  it("fails when preferred not found", () => {
    const local = createLocalProvider();
    const router = createModelRouter([local]);
    const res = router.route({ objective: "test" }, {
      providers: { preferredProvider: "anthropic" },
    } as unknown as { providers?: Record<string, unknown> });
    expect(res.ok).toBe(false);
  });
});
