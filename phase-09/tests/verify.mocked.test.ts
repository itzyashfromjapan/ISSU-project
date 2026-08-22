import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@issue/write-execution", () => ({ execProcess: vi.fn() }));

import { execProcess } from "@issue/write-execution";
import type { Mock } from "vitest";
import { AppError } from "@issue/foundation";
import { verifyWorkspaces } from "../src/internal/verify.js";

const exec = execProcess as unknown as Mock;

afterEach(() => {
  exec.mockReset();
});

function okRes(exitCode = 0, stdout = "", stderr = "") {
  return Promise.resolve({
    ok: true as const,
    value: { exitCode, stdout, stderr, timedOut: false },
  });
}

describe("verifyWorkspaces — exec branches (mocked)", () => {
  it("exec-failed when the barrel import exec itself fails", async () => {
    exec.mockReturnValue(
      Promise.resolve({
        ok: false as const,
        error: new AppError({ code: "issue.process.validation", message: "x" }),
      }),
    );
    const r = await verifyWorkspaces(process.cwd());
    expect(!r.ok && r.error.code).toBe("issue.workspace.exec-failed");
  });

  it("validation when barrel import exits non-zero", async () => {
    exec.mockReturnValue(okRes(1, "", "boom"));
    const r = await verifyWorkspaces(process.cwd());
    expect(!r.ok && r.error.code).toBe("issue.workspace.validation");
  });

  it("validation when deep import unexpectedly succeeds", async () => {
    exec.mockImplementation((_c: string, args: readonly string[]) =>
      Promise.resolve(String(args[1]).includes("/dist/") ? okRes(0) : okRes(0)),
    );
    const r = await verifyWorkspaces(process.cwd());
    expect(!r.ok && r.error.code).toBe("issue.workspace.validation");
  });

  it("not-found when workspaces symlink is absent", async () => {
    exec.mockImplementation((_c: string, args: readonly string[]) =>
      Promise.resolve(
        String(args[1]).includes("/dist/")
          ? okRes(1, "", "ERR_PACKAGE_PATH_NOT_EXPORTED")
          : okRes(0),
      ),
    );
    const { mkdtemp, rm } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const dir = await mkdtemp(join(process.cwd(), "tmp-p9-vm-"));
    try {
      const r = await verifyWorkspaces(dir);
      expect(!r.ok && r.error.code).toBe("issue.workspace.not-found");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
