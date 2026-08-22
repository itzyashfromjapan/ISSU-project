import { describe, it, expect } from "vitest";
import {
  gitStatus,
  gitDiff,
  gitBranch,
  gitCommit,
} from "../src/internal/git.js";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { execSync } from "node:child_process";

describe("git* (Spec §12)", () => {
  it("gitStatus returns branch", async () => {
    const res = await gitStatus();
    expect(res.ok).toBe(true);
    if (res.ok) expect(typeof res.value.branch).toBe("string");
  });
  it("gitDiff returns stat", async () => {
    const res = await gitDiff();
    expect(res.ok).toBe(true);
  });
  it("gitBranch returns branch and tracking", async () => {
    const res = await gitBranch();
    expect(res.ok).toBe(true);
    if (res.ok) expect(typeof res.value.branch).toBe("string");
  });
  it("gitCommit fails with empty files", async () => {
    const res = await gitCommit("msg", []);
    expect(res.ok).toBe(false);
  });
  it("gitCommit fails with -A", async () => {
    const res = await gitCommit("msg", ["-A"]);
    expect(res.ok).toBe(false);
  });
  it("gitCommit succeeds with scoped file (integration)", async () => {
    const dir = await mkdtemp(join(process.cwd(), "tmp-p7-git-"));
    try {
      execSync("git init", { cwd: dir });
      execSync('git config user.email "test@test.com"', { cwd: dir });
      execSync('git config user.name "Test"', { cwd: dir });
      const { writeFile } = await import("node:fs/promises");
      const p = join(dir, "a.txt");
      await writeFile(p, "hello", "utf8");
      execSync("git add a.txt", { cwd: dir });
      execSync('git commit -m "init"', { cwd: dir });
      await writeFile(p, "hello2", "utf8");
      const res = await gitCommit("update", ["a.txt"], { repoPath: dir });
      expect(res.ok).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
  it("gitStatus fails when repoPath not contained", async () => {
    const res = await gitStatus({ repoPath: "../outside" });
    expect(res.ok).toBe(false);
  });
});
