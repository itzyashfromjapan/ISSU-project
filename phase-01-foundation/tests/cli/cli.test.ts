import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const projectRoot = resolve(fileURLToPath(new URL("../../", import.meta.url)));
const BIN = join(projectRoot, "dist", "cli", "main.js");

interface SpawnResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function runCli(
  args: string[],
  opts: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
): SpawnResult {
  const result = spawnSync(process.execPath, [BIN, ...args], {
    cwd: opts.cwd,
    env: opts.env === undefined ? process.env : { ...process.env, ...opts.env },
    encoding: "utf8",
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

describe("built CLI binary (node dist/cli/main.js)", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "issue-m6-spawn-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("--help exits 0 and prints usage to stdout", () => {
    const result = runCli(["--help"], { cwd: tempDir });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Usage:");
  });

  it("--version exits 0 and prints the version to stdout", () => {
    const result = runCli(["--version"], { cwd: tempDir });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("0.1.0");
  });

  it("an unknown flag exits 2 with issue.cli.unknownflag on stderr", () => {
    const result = runCli(["--bogus"], { cwd: tempDir });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("error[issue.cli.unknownflag]:");
    expect(result.stderr).not.toContain("\n    at ");
  });

  it("a bad --config path exits 2 with issue.config.notfound", () => {
    const result = runCli(["--config", "missing.json"], { cwd: tempDir });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("error[issue.config.notfound]:");
  });

  it("--log-level debug exits 0 and writes a debug JSON line to stderr", () => {
    const result = runCli(["--log-level", "debug"], { cwd: tempDir });
    expect(result.status).toBe(0);
    expect(result.stderr).toContain('"level":"debug"');
  });

  it("--no-color is accepted and exits 0", () => {
    const result = runCli(["--no-color"], { cwd: tempDir });
    expect(result.status).toBe(0);
  });
});
