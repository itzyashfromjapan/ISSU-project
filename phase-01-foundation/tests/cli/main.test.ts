import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DestinationStream } from "pino";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCliWith } from "../../src/cli/main.js";

interface Capture {
  stream: DestinationStream;
  text: () => string;
}

function capture(): Capture {
  let out = "";
  return {
    stream: {
      write: (msg: string) => {
        out += msg;
      },
    },
    text: () => out,
  };
}

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

describe("runCliWith", () => {
  let tempDir: string;
  let savedEnv: Record<string, string | undefined>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "issue-m6-"));
    savedEnv = snapshotIssueEnv();
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("ISSU_")) delete process.env[key];
    }
  });

  afterEach(async () => {
    restoreIssueEnv(savedEnv);
    await rm(tempDir, { recursive: true, force: true });
  });

  async function run(argv: string[]): Promise<{
    code: number;
    stdout: string;
    stderr: string;
  }> {
    const out = capture();
    const err = capture();
    const code = await runCliWith({
      argv,
      cwd: tempDir,
      stdout: out.stream,
      stderr: err.stream,
    });
    return { code, stdout: out.text(), stderr: err.text() };
  }

  it("--help prints usage and exits 0", async () => {
    const result = await run(["--help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Usage:");
    expect(result.stdout).toContain("--log-level");
  });

  it("--version prints the version and exits 0", async () => {
    const result = await run(["--version"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("issue 0.1.0");
  });

  it("an unknown flag exits 2 with a single issue.cli.unknownflag line", async () => {
    const result = await run(["--bogus"]);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("error[issue.cli.unknownflag]:");
    expect(result.stderr).toContain("--bogus");
    expect(result.stderr.split("\n").filter((l) => l.length > 0)).toHaveLength(
      1,
    );
  });

  it("a missing --config value exits 2 with issue.usage", async () => {
    const result = await run(["--config"]);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("error[issue.usage]:");
  });

  it("an invalid --log-level value exits 2 with issue.usage", async () => {
    const result = await run(["--log-level", "loud"]);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("error[issue.usage]:");
  });

  it("a bad --config path exits 2 with issue.config.notfound", async () => {
    const result = await run(["--config", "missing.json"]);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("error[issue.config.notfound]:");
  });

  it("a missing config file with default discovery exits 0", async () => {
    const result = await run([]);
    expect(result.code).toBe(0);
  });

  it("loads issue.config.json discovered in the working directory", async () => {
    await writeFile(
      join(tempDir, "issue.config.json"),
      '{ "logLevel": "warn" }',
      "utf8",
    );
    const result = await run([]);
    expect(result.code).toBe(0);
  });

  it("an invalid config file exits 2 with issue.config.invalid", async () => {
    await writeFile(
      join(tempDir, "issue.config.json"),
      '{ "logLevel": "loud" }',
      "utf8",
    );
    const result = await run([]);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("error[issue.config.invalid]:");
  });

  it("--log-level debug enables debug logging to stderr", async () => {
    const result = await run(["--log-level", "debug"]);
    expect(result.code).toBe(0);
    expect(result.stderr).toContain('"level":"debug"');
    expect(result.stderr).toContain("cli invoked");
  });

  it("--log-level overrides the config file value", async () => {
    await writeFile(
      join(tempDir, "issue.config.json"),
      '{ "logLevel": "fatal" }',
      "utf8",
    );
    const result = await run(["--log-level", "debug"]);
    expect(result.code).toBe(0);
    expect(result.stderr).toContain('"level":"debug"');
  });

  it("--no-color is accepted and exits 0", async () => {
    const result = await run(["--no-color"]);
    expect(result.code).toBe(0);
  });
});
