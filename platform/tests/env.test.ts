import { describe, it, expect } from "vitest";
import { loadPlatformEnv } from "../src/internal/env.js";

describe("loadPlatformEnv — fail-closed schema", () => {
  it("defaults to development/local with safe timeouts", () => {
    const r = loadPlatformEnv({});
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.env).toBe("development");
      expect(r.value.provider).toBe("local");
      expect(r.value.timeoutMs).toBe(30000);
      expect(r.value.maxRetries).toBe(2);
    }
  });

  it("requires model + key-var for non-local providers", () => {
    const missingBoth = loadPlatformEnv({ ISSU_PROVIDER: "anthropic" });
    expect(missingBoth.ok).toBe(false);

    const missingKey = loadPlatformEnv({
      ISSU_PROVIDER: "openai",
      ISSU_PROVIDER_MODEL: "gpt-x",
    });
    expect(!missingKey.ok && missingKey.error.code).toBe(
      "issue.platform.env-validation",
    );

    const complete = loadPlatformEnv({
      ISSU_PROVIDER: "anthropic",
      ISSU_PROVIDER_MODEL: "claude-x",
      ISSU_PROVIDER_API_KEY_VAR: "ANTHROPIC_API_KEY",
    });
    expect(complete.ok).toBe(true);
  });

  it("rejects unknown ISSU_ keys (fail-closed)", () => {
    const r = loadPlatformEnv({ ISSU_ENV: "development", ISSU_UNKNOWN: "x" });
    expect(!r.ok && r.error.message).toContain("unknown ISSU_ environment key");
  });

  it("rejects bad enums and out-of-range numbers", () => {
    const badEnv = loadPlatformEnv({ ISSU_ENV: "productionn" });
    expect(badEnv.ok).toBe(false);

    const badProvider = loadPlatformEnv({ ISSU_PROVIDER: "palm" });
    expect(badProvider.ok).toBe(false);

    const badTimeoutLow = loadPlatformEnv({ ISSU_TIMEOUT_MS: "500" });
    expect(badTimeoutLow.ok).toBe(false);

    const badTimeoutHigh = loadPlatformEnv({ ISSU_TIMEOUT_MS: "61000" });
    expect(badTimeoutHigh.ok).toBe(false);

    const badRetries = loadPlatformEnv({ ISSU_MAX_RETRIES: "9" });
    expect(badRetries.ok).toBe(false);

    const okBounds = loadPlatformEnv({
      ISSU_TIMEOUT_MS: "60000",
      ISSU_MAX_RETRIES: "5",
    });
    expect(okBounds.ok && okBounds.value.maxRetries).toBe(5);
  });

  it("validates key-var NAME shape, never values", () => {
    const badName = loadPlatformEnv({
      ISSU_PROVIDER: "openai",
      ISSU_PROVIDER_MODEL: "m",
      ISSU_PROVIDER_API_KEY_VAR: "not a name!",
    });
    expect(badName.ok).toBe(false);

    const goodName = loadPlatformEnv({
      ISSU_PROVIDER: "openai",
      ISSU_PROVIDER_MODEL: "m",
      ISSU_PROVIDER_API_KEY_VAR: "OPENAI_API_KEY_2",
    });
    expect(goodName.ok && goodName.value.apiKeyVarName).toBe(
      "OPENAI_API_KEY_2",
    );
  });

  it("production env is accepted and preserved", () => {
    const r = loadPlatformEnv({
      ISSU_ENV: "production",
      ISSU_PROVIDER: "local",
    });
    expect(r.ok && r.value.env).toBe("production");
  });
});
