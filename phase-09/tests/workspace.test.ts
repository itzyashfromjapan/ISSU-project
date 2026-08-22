import { describe, it, expect } from "vitest";
import { getWorkspaceConfig } from "../src/internal/manifest.js";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

describe("getWorkspaceConfig (Spec §7)", () => {
  it("fails when repoPath not contained", async () => {
    const res = await getWorkspaceConfig("../outside");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("issue.workspace.not-contained");
  });
  it("fails when package.json missing workspaces", async () => {
    const dir = await mkdtemp(join(process.cwd(), "tmp-p9-ws-"));
    try {
      await writeFile(join(dir, "package.json"), `{"name": "test"}`, "utf8");
      const res = await getWorkspaceConfig(dir);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe("issue.workspace.validation");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
  it("succeeds when workspaces includes phase-09", async () => {
    const dir = await mkdtemp(join(process.cwd(), "tmp-p9-ws2-"));
    try {
      await writeFile(
        join(dir, "package.json"),
        JSON.stringify({
          private: true,
          workspaces: ["phase-09", "phase-01-foundation"],
          packageManager: "npm@10",
          engines: { node: ">=22.9.0" },
        }),
        "utf8",
      );
      const res = await getWorkspaceConfig(dir);
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.value.workspaces).toContain("phase-09");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
  it("succeeds with phase-* glob", async () => {
    const dir = await mkdtemp(join(process.cwd(), "tmp-p9-ws3-"));
    try {
      await writeFile(
        join(dir, "package.json"),
        JSON.stringify({
          private: true,
          workspaces: ["phase-*"],
          packageManager: "npm@10",
        }),
        "utf8",
      );
      const res = await getWorkspaceConfig(dir);
      expect(res.ok).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
