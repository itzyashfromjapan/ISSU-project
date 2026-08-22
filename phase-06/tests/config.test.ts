import { describe, it, expect } from "vitest";
import {
  resolveConfig,
  verifyConfig,
  getDefaultConfig,
} from "../src/internal/config.js";
import type { ConfigSchema } from "../src/internal/config.js";

describe("resolveConfig (Spec §9)", () => {
  it("resolves defaults only", () => {
    const defaults = getDefaultConfig();
    const res = resolveConfig({ defaults });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.version).toBe("1.0.0");
      expect(res.value.logging.level).toBe("info");
      expect(res.value.provenance.some((p) => p.source === "defaults")).toBe(
        true,
      );
    }
  });

  it("merges file JSONC over defaults", () => {
    const defaults = getDefaultConfig();
    const fileContent = `{
      "version": "1.0.0",
      "logging": {"level": "debug"},
      "project": {"name": "demo"}
    }`;
    const res = resolveConfig({ defaults, fileContent });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.logging.level).toBe("debug");
      expect(res.value.project).toEqual({ name: "demo" });
      expect(
        res.value.provenance.find((p) => p.key === "logging")?.source,
      ).toBe("file");
    }
  });

  it("strips // and /* */ comments and trailing commas", () => {
    const defaults = getDefaultConfig();
    const fileContent = `{
      // line comment
      "version": "1.0.0", // trailing
      "logging": { "level": "warn", },
      /* block comment */
      "project": { "name": "x", },
    }`;
    const res = resolveConfig({ defaults, fileContent });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.logging.level).toBe("warn");
  });

  it("fails on invalid version", () => {
    const defaults = {
      version: "1.0.0" as const,
      logging: { level: "info" as const },
    };
    const res = resolveConfig({
      defaults,
      fileContent: `{"version": "0.9.0", "logging": {"level": "info"}}`,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("issue.config.validation");
  });

  it("fails on unknown top-level key", () => {
    const defaults = getDefaultConfig();
    const res = resolveConfig({
      defaults,
      fileContent: `{"version": "1.0.0", "unknown": 123}`,
    });
    expect(res.ok).toBe(false);
  });

  it("fails on invalid logging.level", () => {
    const defaults = getDefaultConfig();
    const res = resolveConfig({
      defaults,
      fileContent: `{"version": "1.0.0", "logging": {"level": "nope"}}`,
    });
    expect(res.ok).toBe(false);
  });

  it("merges cli over file", () => {
    const defaults = getDefaultConfig();
    const fileContent = `{"version": "1.0.0", "logging": {"level": "debug"}}`;
    const res = resolveConfig({
      defaults,
      fileContent,
      cli: {
        version: "1.0.0",
        logging: { level: "error" },
      } as unknown as Partial<ConfigSchema>,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.logging.level).toBe("error");
      expect(
        res.value.provenance.find((p) => p.key === "logging")?.source,
      ).toBe("cli");
    }
  });

  it("provenance is sorted deterministically", () => {
    const defaults = getDefaultConfig();
    const res = resolveConfig({
      defaults,
      fileContent: `{"version": "1.0.0", "project": {"a": 1}, "tools": {"b": 2}}`,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      const keys = res.value.provenance.map((p) => p.key);
      const sorted = [...keys].sort();
      expect(keys).toEqual(sorted);
    }
  });

  it("secret keys are redacted in provenance", () => {
    const defaults = getDefaultConfig();
    const res = resolveConfig({
      defaults,
      fileContent: `{"version": "1.0.0", "models": {"x": 1}}`,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      const e = res.value.provenance.find((p) => p.key === "models");
      expect(e?.redacted).toBe(true);
    }
  });

  it("fails on invalid JSONC", () => {
    const defaults = getDefaultConfig();
    const res = resolveConfig({ defaults, fileContent: `{ invalid json` });
    expect(res.ok).toBe(false);
  });
});

describe("verifyConfig (Spec §12)", () => {
  it("passes on valid provenance", () => {
    const defaults = getDefaultConfig();
    const res = resolveConfig({ defaults });
    expect(res.ok).toBe(true);
    if (res.ok) {
      const v = verifyConfig(res.value.provenance);
      expect(v.ok).toBe(true);
    }
  });

  it("fails on unknown source", () => {
    const v = verifyConfig([
      {
        source: "nope" as unknown as "defaults",
        key: "logging",
        value: "info",
        redacted: false,
      },
    ]);
    expect(v.ok).toBe(false);
  });

  it("fails on unknown key", () => {
    const v = verifyConfig([
      { source: "defaults", key: "unknownKey", value: 123, redacted: false },
    ]);
    expect(v.ok).toBe(false);
  });

  it("fails on undefined value when not redacted", () => {
    const v = verifyConfig([
      { source: "defaults", key: "logging", value: undefined, redacted: false },
    ]);
    expect(v.ok).toBe(false);
  });
});
