import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as issue from "../src/index.js";

describe("public contract surface", () => {
  it("exposes exactly the approved runtime exports", () => {
    const keys = Object.keys(issue).sort();
    expect(keys).toEqual(
      [
        "AppError",
        "VERSION",
        "assertContained",
        "createLogger",
        "err",
        "getSecret",
        "isAppError",
        "isContained",
        "isErr",
        "isOk",
        "loadConfig",
        "match",
        "mergeConfigLayers",
        "ok",
        "readEnv",
        "redactionList",
        "runCli",
        "toError",
      ].sort(),
    );
  });
});

describe("M6 public contract (real implementations)", () => {
  it("runCli resolves to a process exit code through the public barrel", async () => {
    const stdoutWrite = process.stdout.write.bind(process.stdout);
    const stderrWrite = process.stderr.write.bind(process.stderr);
    process.stdout.write = (() => true) as typeof process.stdout.write;
    process.stderr.write = (() => true) as typeof process.stderr.write;
    try {
      await expect(issue.runCli(["--version"])).resolves.toBe(0);
      await expect(issue.runCli(["--unknown-flag-probe"])).resolves.toBe(2);
    } finally {
      process.stdout.write = stdoutWrite;
      process.stderr.write = stderrWrite;
    }
  });
});

describe("M5 public contract (real implementations)", () => {
  it("AppError constructs with default recoverable=true and serializes", () => {
    const error = new issue.AppError({
      code: "issue.config.parse",
      message: "bad",
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AppError");
    expect(error.code).toBe("issue.config.parse");
    expect(error.recoverable).toBe(true);
    expect(error.toJSON()).toEqual({
      name: "AppError",
      code: "issue.config.parse",
      message: "bad",
      recoverable: true,
    });
  });

  it("isAppError and toError normalize through the public barrel", () => {
    const error = new issue.AppError({ code: "issue.internal", message: "x" });
    expect(issue.isAppError(error)).toBe(true);
    expect(issue.isAppError(new Error("plain"))).toBe(false);
    expect(issue.toError(error)).toBe(error);
    expect(issue.toError(new Error("plain")).message).toBe("plain");
  });

  it("ok/err/isOk/isErr/match work through the public barrel", () => {
    const success = issue.ok(42);
    const failure = issue.err(
      new issue.AppError({ code: "issue.config.parse", message: "bad" }),
    );
    expect(issue.isOk(success)).toBe(true);
    expect(issue.isErr(success)).toBe(false);
    expect(issue.isOk(failure)).toBe(false);
    expect(issue.isErr(failure)).toBe(true);
    expect(issue.match(success, { ok: (v) => v + 1, err: (_e) => 0 })).toBe(43);
    expect(issue.match(failure, { ok: (v) => v, err: (e) => e.code })).toBe(
      "issue.config.parse",
    );
  });

  it("assertContained/isContained work through the public barrel", async () => {
    const root = await mkdtemp(join(tmpdir(), "issue-contract-m5-"));
    try {
      expect(issue.isContained(root, join(root, "file.txt"))).toBe(true);
      expect(issue.isContained(root, join(root, "..", "outside"))).toBe(false);
      expect(issue.assertContained(root, join(root, "file.txt"))).toBe(
        join(root, "file.txt"),
      );
      expect(() =>
        issue.assertContained(root, join(root, "..", "outside")),
      ).toThrow(Error);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe("M4 public contract (real implementations)", () => {
  it("createLogger returns a Logger-shaped facade through the public barrel", () => {
    const logger = issue.createLogger({ level: "fatal" });
    expect(typeof logger.trace).toBe("function");
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.fatal).toBe("function");
    expect(typeof logger.child).toBe("function");
  });
});

describe("M3 public contract (real implementations)", () => {
  let tempDir: string;
  let savedEnv: Record<string, string | undefined>;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "issue-contract-"));
    savedEnv = {};
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("ISSU_")) savedEnv[key] = process.env[key];
    }
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("ISSU_")) delete process.env[key];
    }
  });

  afterAll(async () => {
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value !== undefined) process.env[key] = value;
    }
    await rm(tempDir, { recursive: true, force: true });
  });

  it("loadConfig resolves built-in defaults through the public barrel", async () => {
    const result = await issue.loadConfig({ cwd: tempDir });
    expect(result).toEqual({
      ok: true,
      value: { logLevel: "info", logPretty: false, redact: [] },
    });
  });

  it("loadConfig returns a typed issue.config.notfound for a missing explicit path", async () => {
    const result = await issue.loadConfig({
      cwd: tempDir,
      configPath: "missing.json",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("issue.config.notfound");
  });

  it("mergeConfigLayers applies precedence through the public barrel", () => {
    expect(
      issue.mergeConfigLayers({ logLevel: "warn" }, { logLevel: "error" }),
    ).toEqual({ logLevel: "error", logPretty: false, redact: [] });
  });

  it("readEnv snapshots only ISSU_* variables through the public barrel", () => {
    expect(issue.readEnv({ ISSU_LOG_LEVEL: "debug", PATH: "/x" })).toEqual({
      ISSU_LOG_LEVEL: "debug",
    });
  });

  it("getSecret reads a secret value through the public barrel", () => {
    expect(
      issue.getSecret("API_KEY", { API_KEY: "synthetic-contract-secret" }),
    ).toBe("synthetic-contract-secret");
  });

  it("redactionList returns secret values through the public barrel", () => {
    expect(
      issue.redactionList({ API_KEY: "synthetic-contract-secret" }),
    ).toEqual(["synthetic-contract-secret"]);
  });
});
