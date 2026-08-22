import { describe, it, expect } from "vitest";
import { runCli } from "../src/internal/cli.js";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("seam.integration — config file read via isContained + runCli", () => {
  it("reads config file inside cwd via runCli config --show", async () => {
    const dir = join(tmpdir(), `p6-${Math.random().toString(36).slice(2)}`);
    await mkdir(dir, { recursive: true });
    const cfgPath = join(dir, "issu.config.jsonc");
    await writeFile(
      cfgPath,
      `{"version": "1.0.0", "project": {"name": "from-file"}}`,
      "utf8",
    );
    const oldCwd = process.cwd();
    process.chdir(dir);
    try {
      const res = await runCli(["config", "--show", "--config", cfgPath]);
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toContain("from-file");
    } finally {
      process.chdir(oldCwd);
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("rejects path traversal outside cwd", async () => {
    const res = await runCli([
      "config",
      "--show",
      "--config",
      "../outside.jsonc",
    ]);
    expect(res.exitCode).toBe(1);
    expect(res.stderr).toContain("not contained");
  });

  it("handles not-found config file as error when explicitly requested", async () => {
    const _p = join(tmpdir(), `missing-${Date.now()}.jsonc`);
    void _p;
    const cwdFile = join(process.cwd(), `missing-${Date.now()}.jsonc`);
    const res2 = await runCli(["config", "--show", "--config", cwdFile]);
    expect(res2.exitCode).toBe(1);
  });
});
