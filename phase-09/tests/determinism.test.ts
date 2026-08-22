import { describe, it, expect } from "vitest";
import { getWorkspaceConfig } from "../src/internal/manifest.js";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

describe("determinism (Spec §13)", () => {
  it("getWorkspaceConfig with same package.json is deterministic", async () => {
    const dir = await mkdtemp(join(process.cwd(), "tmp-p9-det-"));
    try {
      const pkg = JSON.stringify({
        private: true,
        workspaces: ["phase-09"],
        packageManager: "npm@10",
        engines: { node: ">=22.9.0" },
      });
      await writeFile(join(dir, "package.json"), pkg, "utf8");
      const a = await getWorkspaceConfig(dir);
      const b = await getWorkspaceConfig(dir);
      expect(
        a.ok && b.ok && JSON.stringify(a.value) === JSON.stringify(b.value),
      ).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
