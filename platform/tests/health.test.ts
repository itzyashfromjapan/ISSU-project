import { describe, it, expect } from "vitest";
import { loadPlatformEnv } from "../src/internal/env.js";
import { runPreflight } from "../src/internal/health.js";

describe("runPreflight â€” fail-closed checks", () => {
  it("passes for local provider with no workspace root configured", async () => {
    const env = loadPlatformEnv({
      ISSU_ENV: "development",
      ISSU_PROVIDER: "local",
    });
    expect(env.ok).toBe(true);
    if (!env.ok) return;
    const r = await runPreflight(env.value);
    expect(r.ok && r.value.passed).toBe(true);
    if (r.ok) {
      const names = r.value.checks.map((c) => c.name);
      expect(names).toContain("env-schema");
      expect(names).toContain("provider-credential-name");
      expect(names).toContain("provider-smoke");
    }
  });

  it("reports credential-name check failure for remote providers missing key-var", async () => {
    // Build an env object that would normally be impossible via the loader
    // (loader enforces key-var presence), simulating direct construction.
    const env = loadPlatformEnv({
      ISSU_ENV: "staging",
      ISSU_PROVIDER: "local",
    });
    if (!env.ok) return;
    const mutated = { ...env.value, provider: "anthropic" as const };
    const r = await runPreflight(mutated);
    const cred = r.ok
      ? r.value.checks.find((c) => c.name === "provider-credential-name")
      : undefined;
    expect(cred?.passed).toBe(false);
    expect(r.ok && r.value.passed).toBe(false);
  });

  it("fails workspaces check when configured root has no workspace manifest", async () => {
    const { mkdtemp, rm } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const dir = await mkdtemp(join(process.cwd(), "tmp-plat-"));
    try {
      const env = loadPlatformEnv({
        ISSU_PROVIDER: "local",
        ISSU_WORKSPACE_ROOT: dir,
      });
      expect(env.ok).toBe(true);
      if (!env.ok) return;
      const r = await runPreflight(env.value);
      const ws = r.ok
        ? r.value.checks.find((c) => c.name === "workspaces")
        : undefined;
      expect(ws?.passed).toBe(false);
      expect(r.ok && r.value.passed).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
