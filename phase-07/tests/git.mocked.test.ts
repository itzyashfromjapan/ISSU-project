import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/internal/process.js", () => ({ execProcess: vi.fn() }));

import { execProcess } from "../src/internal/process.js";
import type { Mock } from "vitest";
import { gitBranch, gitCommit, gitStatus } from "../src/internal/git.js";

const exec = execProcess as unknown as Mock;

afterEach(() => {
  exec.mockReset();
});

function ok(stdout: string, exitCode = 0) {
  return Promise.resolve({
    ok: true as const,
    value: { exitCode, stdout, stderr: "", timedOut: false },
  });
}
function fail() {
  return Promise.resolve({
    ok: false as const,
    error: Object.assign(new Error("exec"), {
      code: "issue.process.validation",
    }),
  });
}

describe("gitStatus — porcelain parsing branches (mocked exec)", () => {
  it("parses staged/unstaged/untracked and ahead count", async () => {
    exec.mockReturnValue(
      ok("## main...origin/main [ahead 2]\nM  s.txt\n M u.txt\n?? n.txt\n"),
    );
    const r = await gitStatus();
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.branch).toBe("main");
      expect(r.value.ahead).toBe(2);
      expect(r.value.staged).toContain("s.txt");
      expect(r.value.unstaged).toContain("u.txt");
      expect(r.value.untracked).toContain("n.txt");
    }
  });

  it("falls back to unknown when branch line does not match", async () => {
    exec.mockReturnValue(ok("## HEAD detached\n"));
    const r = await gitStatus();
    expect(r.ok && r.value.branch).toBe("unknown");
    expect(r.ok && r.value.ahead).toBe(0);
  });

  it("behind is parsed", async () => {
    exec.mockReturnValue(ok("## main...origin/main [behind 3]\n"));
    const r = await gitStatus();
    expect(r.ok && r.value.behind).toBe(3);
  });
});

describe("gitBranch — parse branches (mocked exec)", () => {
  it("extracts branch and tracking", async () => {
    exec.mockReturnValue(
      ok("* main abc123 [origin/main: ahead 1]\n  dev xyz\n"),
    );
    const r = await gitBranch();
    expect(r.ok && r.value.branch).toBe("main");
    expect(r.ok && r.value.tracking).toBe("origin/main: ahead 1");
  });

  it("returns unknown when no current line marker present", async () => {
    exec.mockReturnValue(ok("  dev xyz\n"));
    const r = await gitBranch();
    expect(r.ok && r.value.branch).toBe("unknown");
    expect(r.ok && r.value.tracking).toBe("");
  });
});

describe("gitCommit — failure branches (mocked exec)", () => {
  it("rejects --all flag explicitly", async () => {
    const r = await gitCommit("m", ["--all"]);
    expect(!r.ok && r.error.code).toBe("issue.git.validation");
  });

  it("rejects path escaping the repo via ..", async () => {
    const r = await gitCommit("m", ["../escape.txt"]);
    expect(!r.ok && r.error.code).toBe("issue.git.not-contained");
  });

  it("surfaces git add non-zero exit as validation", async () => {
    exec.mockImplementation((_c: string, args: readonly string[]) =>
      args[0] === "add" ? ok("", 128) : ok(""),
    );
    const r = await gitCommit("m", ["a.txt"]);
    expect(!r.ok && r.error.code).toBe("issue.git.validation");
  });

  it("surfaces git commit non-zero exit as validation", async () => {
    exec.mockImplementation((_c: string, args: readonly string[]) => {
      if (args[0] === "commit") return ok("", 1);
      if (args[0] === "log") return ok("deadbeef");
      if (args[0] === "diff") return ok("");
      return ok("");
    });
    const r = await gitCommit("m", ["a.txt"]);
    expect(!r.ok && r.error.code).toBe("issue.git.validation");
  });

  it("propagates exec failure from the add step", async () => {
    exec.mockImplementation((_c: string, args: readonly string[]) =>
      args[0] === "add" ? fail() : ok(""),
    );
    const r = await gitCommit("m", ["a.txt"]);
    expect(!r.ok).toBe(true);
  });
});
