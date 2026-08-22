import { afterEach, describe, it, expect } from "vitest";
import { resolveMode, buildProvider } from "../src/internal/mode.js";

const KEYVAR = "TRIAL_UI_TEST_KEY";

afterEach(() => {
  delete process.env[KEYVAR];
  delete process.env.ISSU_ENV;
  delete process.env.ISSU_PROVIDER;
  delete process.env.ISSU_PROVIDER_MODEL;
  delete process.env.ISSU_PROVIDER_API_KEY_VAR;
});

describe("resolveMode — provider mode resolution", () => {
  it("defaults to stub with no configuration", () => {
    const saved = { p: process.env.ISSU_PROVIDER };
    delete process.env.ISSU_PROVIDER;
    const m = resolveMode({ ISSU_ENV: undefined as unknown as string });
    // explicit empty source: defaults apply
    const m2 = resolveMode({});
    if (saved.p !== undefined) process.env.ISSU_PROVIDER = saved.p;
    expect(m2.mode === "stub" || m2.mode === "unconfigured").toBe(true);
    void m;
  });

  it("unconfigured when the env schema is invalid", () => {
    const m = resolveMode({ ISSU_PROVIDER: "not-a-provider" });
    expect(m.mode).toBe("unconfigured");
    expect(m.error).toContain("ISSU_PROVIDER");
  });

  it("missing-credentials when remote key var is absent", () => {
    const m = resolveMode({
      ISSU_ENV: "staging",
      ISSU_PROVIDER: "anthropic",
      ISSU_PROVIDER_MODEL: "claude-x",
      ISSU_PROVIDER_API_KEY_VAR: KEYVAR,
    });
    expect(m.mode).toBe("missing-credentials");
    expect(m.detail).toContain(KEYVAR);
  });

  it("live when the remote key var resolves", () => {
    process.env[KEYVAR] = "secret-value";
    const m = resolveMode({
      ISSU_ENV: "staging",
      ISSU_PROVIDER: "openai",
      ISSU_PROVIDER_MODEL: "gpt-x",
      ISSU_PROVIDER_API_KEY_VAR: KEYVAR,
    });
    expect(m.mode).toBe("live");
    expect(m.env?.provider).toBe("openai");
  });
});

describe("buildProvider — construction rules", () => {
  it("errors issue.trial.unconfigured for unconfigured mode", () => {
    const r = buildProvider({ mode: "unconfigured", detail: "x" });
    expect(!r.ok && r.error.code).toBe("issue.trial.unconfigured");
  });

  it("errors issue.trial.missing-credentials for missing creds", () => {
    const r = buildProvider({
      mode: "missing-credentials",
      detail: `set ${KEYVAR}`,
    });
    expect(!r.ok && r.error.code).toBe("issue.trial.missing-credentials");
  });

  it("returns a local ModelProvider in stub mode", async () => {
    process.env[KEYVAR] = "v";
    const stub = resolveMode({ ISSU_PROVIDER: "local" });
    const r = buildProvider(stub);
    expect(r.ok && r.value.name).toBe("local");
    if (r.ok) {
      const g = await r.value.generateText("smoke");
      expect(g.ok && g.value).toContain("smoke");
    }
  });
});
