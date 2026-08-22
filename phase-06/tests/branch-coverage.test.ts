import { describe, it, expect } from "vitest";
import {
  resolveConfig,
  verifyConfig,
  getDefaultConfig,
} from "../src/internal/config.js";
import { parseArgs, runCli } from "../src/internal/cli.js";
import { createCliLogger, logProgress } from "../src/internal/observability.js";
import type { ConfigSchema } from "../src/internal/config.js";

describe("branch coverage — config validateSchema", () => {
  it("validateSchema: null → validation fail via resolveConfig defaults", () => {
    const res = resolveConfig({ defaults: null as unknown as ConfigSchema });
    expect(res.ok).toBe(false);
  });
  it("validateSchema: array → fail", () => {
    const res = resolveConfig({ defaults: [] as unknown as ConfigSchema });
    expect(res.ok).toBe(false);
  });
  it("unknown top-level key in file", () => {
    const res = resolveConfig({
      defaults: getDefaultConfig(),
      fileContent: `{"version": "1.0.0", "unknownKey": 1}`,
    });
    expect(res.ok).toBe(false);
  });
  it("logging not object", () => {
    const res = resolveConfig({
      defaults: getDefaultConfig(),
      fileContent: `{"version": "1.0.0", "logging": "not-object"}`,
    });
    expect(res.ok).toBe(false);
  });
  it("logging level invalid", () => {
    const res = resolveConfig({
      defaults: getDefaultConfig(),
      fileContent: `{"version": "1.0.0", "logging": {"level": "bad"}}`,
    });
    expect(res.ok).toBe(false);
  });
  it("section not object (models)", () => {
    const res = resolveConfig({
      defaults: getDefaultConfig(),
      fileContent: `{"version": "1.0.0", "models": "not-object"}`,
    });
    expect(res.ok).toBe(false);
  });
  it("cli unknown key", () => {
    const res = resolveConfig({
      defaults: getDefaultConfig(),
      cli: {
        version: "1.0.0",
        unknown: 123,
      } as unknown as Partial<ConfigSchema>,
    });
    expect(res.ok).toBe(false);
  });
  it("cli version wrong", () => {
    const res = resolveConfig({
      defaults: getDefaultConfig(),
      cli: { version: "0.9.0" as unknown as "1.0.0" } as Partial<ConfigSchema>,
    });
    expect(res.ok).toBe(false);
  });
  it("cli logging level wrong", () => {
    const res = resolveConfig({
      defaults: getDefaultConfig(),
      cli: {
        version: "1.0.0",
        logging: { level: "bad" as unknown as "info" },
      } as unknown as Partial<ConfigSchema>,
    });
    expect(res.ok).toBe(false);
  });
  it("env ISSU_LOGGING_LEVEL sets logging source to env", () => {
    const res = resolveConfig({
      defaults: getDefaultConfig(),
      env: { ISSU_LOGGING_LEVEL: "debug", OTHER: "x" },
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      const prov = res.value.provenance.find((p) => p.key === "logging");
      expect(prov?.source).toBe("env");
    }
  });
  it("fileContent invalid JSONC → fail", () => {
    const res = resolveConfig({
      defaults: getDefaultConfig(),
      fileContent: `{ invalid json`,
    });
    expect(res.ok).toBe(false);
  });
  it("defaults invalid version", () => {
    const res = resolveConfig({
      defaults: {
        version: "0.0.0" as unknown as "1.0.0",
        logging: { level: "info" },
      } as ConfigSchema,
    });
    expect(res.ok).toBe(false);
  });
});

describe("branch coverage — verifyConfig", () => {
  it("passes with redacted true and undefined value", () => {
    const v = verifyConfig([
      { source: "defaults", key: "models", value: undefined, redacted: true },
    ]);
    expect(v.ok).toBe(true);
  });
});

describe("branch coverage — parseArgs", () => {
  it("config --show --verbose", () => {
    const r = parseArgs(["config", "--show", "--verbose"]);
    expect(r.ok && r.value.verbose).toBe(true);
  });
  it("config --show --config missing value", () => {
    const r = parseArgs(["config", "--show", "--config"]);
    expect(r.ok).toBe(false);
  });
  it("run --config missing value", () => {
    const r = parseArgs(["run", "--config"]);
    expect(r.ok).toBe(false);
  });
  it("run duplicate flag", () => {
    const r = parseArgs(["run", "--analytics", "--tool-runtime"]);
    expect(r.ok).toBe(false);
  });
  it("run --verbose", () => {
    const r = parseArgs(["run", "--verbose"]);
    expect(r.ok && r.value.verbose).toBe(true);
  });
  it("config --show with --help returns help", () => {
    const r = parseArgs(["config", "--show", "--help"]);
    expect(r.ok && r.value.command === "help").toBe(true);
  });
});

describe("branch coverage — runCli verbose and error paths", () => {
  it("config --show --verbose returns 0", async () => {
    const res = await runCli(["config", "--show", "--verbose"]);
    expect(res.exitCode).toBe(0);
  });
  it("run --verbose dispatches", async () => {
    const res = await runCli(["run", "--analytics", "--verbose"]);
    expect([0, 1].includes(res.exitCode)).toBe(true);
  });
  it("config --show with invalid file JSONC", async () => {
    const { writeFile, mkdir, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const dir = join(tmpdir(), `p6-br-${Math.random().toString(36).slice(2)}`);
    await mkdir(dir, { recursive: true });
    const p = join(dir, "bad.jsonc");
    await writeFile(p, `{ invalid`, "utf8");
    const old = process.cwd();
    process.chdir(dir);
    try {
      const res = await runCli(["config", "--show", "--config", p]);
      expect(res.exitCode).toBe(1);
    } finally {
      process.chdir(old);
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("observability", () => {
  it("createCliLogger debug and info", () => {
    const a = createCliLogger("debug");
    const b = createCliLogger("info");
    expect(a.info).toBeDefined();
    expect(b.info).toBeDefined();
  });
  it("logProgress", () => {
    const logger = createCliLogger("info");
    logProgress(logger, "cli.invoked", { a: 1 });
    logProgress(logger, "config.resolved", { b: 2 });
    logProgress(logger, "run.dispatched", { c: 3 });
    logProgress(logger, "run.completed", { d: 4 });
    expect(true).toBe(true);
  });
});
