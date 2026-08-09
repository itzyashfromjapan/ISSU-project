import { describe, expect, it } from "vitest";
import {
  assertNoSecretsInConfig,
  configFromFile,
} from "../../src/config/resolve.js";

const INVALID_CODE = "issue.config.invalid";

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
    return undefined;
  } catch (error) {
    return (error as { code?: string }).code;
  }
}

describe("no secrets in config file (M3-4)", () => {
  it.each([
    "password",
    "apiKey",
    "access_token",
    "AUTH_TOKEN",
    "client_secret",
    "secretKey",
    "credentials",
  ])("rejects an obvious secret key %s", (key) => {
    expect(
      codeOf(() => configFromFile({ [key]: "synthetic-test-secret" })),
    ).toBe(INVALID_CODE);
  });

  it("rejects nested secret-like configuration", () => {
    const value = {
      logLevel: "info",
      models: { apiKey: "synthetic-test-secret" },
    };
    expect(codeOf(() => configFromFile(value))).toBe(INVALID_CODE);
  });

  it("rejects secret-like keys nested inside arrays", () => {
    const value = {
      services: [{ name: "a", password: "synthetic-test-secret" }],
    };
    expect(codeOf(() => configFromFile(value))).toBe(INVALID_CODE);
  });

  it("includes the offending key path in the error message", () => {
    let message = "";
    try {
      configFromFile({
        logLevel: "info",
        models: { apiKey: "synthetic-test-secret" },
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain("$.models.apiKey");
  });

  it("accepts a valid non-secret configuration", () => {
    expect(() =>
      configFromFile({
        logLevel: "debug",
        logPretty: true,
        redact: ["requestId"],
      }),
    ).not.toThrow();
  });

  it("avoids false positives for keys that merely contain a suffix", () => {
    expect(() =>
      configFromFile({
        keyword: "hello",
        monkey: 1,
        keyboard: "x",
        logLevel: "info",
      }),
    ).not.toThrow();
  });

  it("is also enforced by the standalone helper", () => {
    expect(
      codeOf(() =>
        assertNoSecretsInConfig({ password: "synthetic-test-secret" }),
      ),
    ).toBe(INVALID_CODE);
    expect(() =>
      assertNoSecretsInConfig({ logLevel: "info", redact: ["requestId"] }),
    ).not.toThrow();
  });
});
