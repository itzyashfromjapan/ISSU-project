import { describe, it, expect } from "vitest";
import { loadRunner } from "../src/internal/registry.js";
import type { DomainMeta } from "../src/internal/registry.js";
import { buildProvider, resolveMode } from "../src/internal/mode.js";

describe("loadRunner — error branch", () => {
  it("throws when the runner export is missing from the barrel", async () => {
    const fake: DomainMeta = {
      id: "business",
      label: "Business",
      phase: "Phase 10",
      specifier: "@issue/foundation",
      runner: "NOT_A_REAL_RUNNER",
    };
    await expect(loadRunner(fake)).rejects.toThrow(/NOT_A_REAL_RUNNER/);
  });
});

describe("buildProvider — live-mode construction boundary", () => {
  it("directs remote construction through the frozen Phase 8 factories (err here)", () => {
    process.env.TRIAL_LIVE_KEY = "v";
    try {
      const live = resolveMode({
        ISSU_ENV: "staging",
        ISSU_PROVIDER: "openai",
        ISSU_PROVIDER_MODEL: "gpt-x",
        ISSU_PROVIDER_API_KEY_VAR: "TRIAL_LIVE_KEY",
      });
      const r = buildProvider(live);
      expect(!r.ok && r.error.code).toBe("issue.provider.validation");
    } finally {
      delete process.env.TRIAL_LIVE_KEY;
    }
  });

  it("errors when stub/live mode lacks an env object", () => {
    const r = buildProvider({ mode: "stub", detail: "no env attached" });
    expect(!r.ok && r.error.code).toBe("issue.trial.unconfigured");
  });
});
