import { describe, it, expect } from "vitest";
import { getWorkspaceConfig } from "../src/internal/manifest.js";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function tmpWithPkg(pkg: string) {
  const dir = await mkdtemp(join(process.cwd(), "tmp-p9-mf-"));
  await writeFile(join(dir, "package.json"), pkg, "utf8");
  return dir;
}

describe("getWorkspaceConfig — edge branches", () => {
  it("validation on invalid JSON", async () => {
    const dir = await tmpWithPkg("{ nope");
    try {
      const r = await getWorkspaceConfig(dir);
      expect(!r.ok && r.error.code).toBe("issue.workspace.validation");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("validation when workspaces lack phase-09 and phase-*", async () => {
    const dir = await tmpWithPkg(
      JSON.stringify({ private: true, workspaces: ["other-*"] }),
    );
    try {
      const r = await getWorkspaceConfig(dir);
      expect(!r.ok && r.error.code).toBe("issue.workspace.validation");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("defaults packageManager and engines when absent", async () => {
    const dir = await tmpWithPkg(
      JSON.stringify({ private: true, workspaces: ["phase-09"] }),
    );
    try {
      const r = await getWorkspaceConfig(dir);
      expect(r.ok && r.value.packageManager).toBe("npm@10");
      expect(r.ok && r.value.engines.node).toBe(">=22.9.0");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
