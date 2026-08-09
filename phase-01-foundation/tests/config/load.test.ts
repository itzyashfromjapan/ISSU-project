import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config/load.js";

function snapshotIssueEnv(): Record<string, string | undefined> {
  const saved: Record<string, string | undefined> = {};
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("ISSU_")) saved[key] = process.env[key];
  }
  return saved;
}

function restoreIssueEnv(saved: Record<string, string | undefined>): void {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("ISSU_")) delete process.env[key];
  }
  for (const [key, value] of Object.entries(saved)) {
    if (value !== undefined) process.env[key] = value;
  }
}

describe("loadConfig", () => {
  let tempDir: string;
  let savedEnv: Record<string, string | undefined>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "issue-m3-"));
    savedEnv = snapshotIssueEnv();
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("ISSU_")) delete process.env[key];
    }
  });

  afterEach(async () => {
    restoreIssueEnv(savedEnv);
    await rm(tempDir, { recursive: true, force: true });
  });

  it("returns defaults when no config file and no env overrides exist", async () => {
    const result = await loadConfig({ cwd: tempDir });
    expect(result).toEqual({
      ok: true,
      value: { logLevel: "info", logPretty: false, redact: [] },
    });
  });

  it("discovers issue.config.json in the working directory", async () => {
    await writeFile(
      join(tempDir, "issue.config.json"),
      '{ "logLevel": "warn" }',
      "utf8",
    );
    const result = await loadConfig({ cwd: tempDir });
    expect(result).toEqual({
      ok: true,
      value: { logLevel: "warn", logPretty: false, redact: [] },
    });
  });

  it("loads an explicitly supplied configPath over the default file", async () => {
    const configPath = join(tempDir, "custom.json");
    await writeFile(configPath, '{ "logPretty": true }', "utf8");
    const result = await loadConfig({ cwd: tempDir, configPath });
    expect(result).toEqual({
      ok: true,
      value: { logLevel: "info", logPretty: true, redact: [] },
    });
  });

  it("resolves a relative configPath against the working directory", async () => {
    await writeFile(
      join(tempDir, "relative.json"),
      '{ "logLevel": "debug" }',
      "utf8",
    );
    const result = await loadConfig({
      cwd: tempDir,
      configPath: "relative.json",
    });
    expect(result).toEqual({
      ok: true,
      value: { logLevel: "debug", logPretty: false, redact: [] },
    });
  });

  it("returns issue.config.notfound for a missing explicitly supplied path", async () => {
    const result = await loadConfig({
      cwd: tempDir,
      configPath: "missing.json",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("issue.config.notfound");
      expect(result.error.recoverable).toBe(true);
    }
  });

  it("uses ISSU_CONFIG for discovery when no configPath is supplied", async () => {
    const configPath = join(tempDir, "issue-via-env.json");
    await writeFile(configPath, '{ "logLevel": "error" }', "utf8");
    process.env.ISSU_CONFIG = configPath;
    const result = await loadConfig({ cwd: tempDir });
    expect(result).toEqual({
      ok: true,
      value: { logLevel: "error", logPretty: false, redact: [] },
    });
  });

  it("lets environment values override file values", async () => {
    await writeFile(
      join(tempDir, "issue.config.json"),
      '{ "logLevel": "warn" }',
      "utf8",
    );
    process.env.ISSU_LOG_LEVEL = "error";
    const result = await loadConfig({ cwd: tempDir });
    expect(result).toEqual({
      ok: true,
      value: { logLevel: "error", logPretty: false, redact: [] },
    });
  });

  it("maps ISSU_LOG_PRETTY into the resolved config", async () => {
    process.env.ISSU_LOG_PRETTY = "true";
    const result = await loadConfig({ cwd: tempDir });
    expect(result).toEqual({
      ok: true,
      value: { logLevel: "info", logPretty: true, redact: [] },
    });
  });

  it("unions ISSU_REDACT with file redact entries", async () => {
    await writeFile(
      join(tempDir, "issue.config.json"),
      '{ "redact": ["fileKey"] }',
      "utf8",
    );
    process.env.ISSU_REDACT = "envKey";
    const result = await loadConfig({ cwd: tempDir });
    expect(result).toEqual({
      ok: true,
      value: {
        logLevel: "info",
        logPretty: false,
        redact: ["fileKey", "envKey"],
      },
    });
  });

  it("returns issue.config.invalid for an invalid file value", async () => {
    await writeFile(
      join(tempDir, "issue.config.json"),
      '{ "logLevel": "loud" }',
      "utf8",
    );
    const result = await loadConfig({ cwd: tempDir });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("issue.config.invalid");
  });

  it("returns issue.config.parse for malformed JSONC in the file", async () => {
    await writeFile(
      join(tempDir, "issue.config.json"),
      '{ "logLevel": "info"',
      "utf8",
    );
    const result = await loadConfig({ cwd: tempDir });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("issue.config.parse");
  });

  it("returns issue.config.invalid for an invalid environment value", async () => {
    process.env.ISSU_LOG_LEVEL = "loud";
    const result = await loadConfig({ cwd: tempDir });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("issue.config.invalid");
  });

  it("rejects secret-like keys in the config file", async () => {
    await writeFile(
      join(tempDir, "issue.config.json"),
      '{ "password": "hunter2" }',
      "utf8",
    );
    const result = await loadConfig({ cwd: tempDir });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("issue.config.invalid");
  });

  it("does not leak secret env values into error messages", async () => {
    await writeFile(
      join(tempDir, "issue.config.json"),
      '{ "logLevel": "loud" }',
      "utf8",
    );
    process.env.ISSU_API_KEY = "SYNTHETIC-TEST-SECRET-7";
    const result = await loadConfig({ cwd: tempDir });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("issue.config.invalid");
      expect(result.error.message).not.toContain("SYNTHETIC-TEST-SECRET-7");
    }
  });
});
