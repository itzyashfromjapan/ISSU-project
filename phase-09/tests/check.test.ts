import { describe, it, expect } from "vitest";
import { runCheckAll } from "../src/internal/check.js";

describe("runCheckAll (Spec §9)", () => {
  it("fails when repoPath not contained", async () => {
    const res = await runCheckAll("../outside");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("issue.workspace.not-contained");
  });
  it("returns Result for cwd (may be ok or exec-failed depending on workspaces)", async () => {
    const res = await runCheckAll(process.cwd());
    expect(typeof res.ok).toBe("boolean");
    if (res.ok) {
      expect(Array.isArray(res.value.passed)).toBe(true);
    } else {
      expect(res.error.code).toBe("issue.workspace.exec-failed");
    }
  });
});
