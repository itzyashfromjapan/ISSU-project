import { describe, it, expect } from "vitest";
import { execProcess } from "../src/internal/process.js";

describe("execProcess (Spec §11)", () => {
  it("fails when allowExec false", async () => {
    const res = await execProcess("node", ["--version"], { allowExec: false });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("issue.process.permission-denied");
  });
  it("fails when cwd not contained", async () => {
    const res = await execProcess("node", ["--version"], {
      allowExec: true,
      cwd: "../outside",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("issue.process.not-contained");
  });
  it("fails when timeoutMs over max", async () => {
    const res = await execProcess("node", ["--version"], {
      allowExec: true,
      timeoutMs: 70000,
    });
    expect(res.ok).toBe(false);
  });
  it("fails when maxBytes over cap", async () => {
    const res = await execProcess("node", ["--version"], {
      allowExec: true,
      maxBytes: 2 * 1024 * 1024,
    });
    expect(res.ok).toBe(false);
  });
  it("executes node --version successfully", async () => {
    const res = await execProcess("node", ["--version"], { allowExec: true });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.exitCode).toBe(0);
      expect(res.value.stdout).toContain("v");
      expect(res.value.timedOut).toBe(false);
    }
  });
  it("handles timeout", async () => {
    const res = await execProcess("node", ["-e", "setTimeout(()=>{}, 2000)"], {
      allowExec: true,
      timeoutMs: 200,
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.timedOut).toBe(true);
  });
  it("truncates maxBytes", async () => {
    const res = await execProcess(
      "node",
      ["-e", "process.stdout.write('a'.repeat(1000))"],
      { allowExec: true, maxBytes: 10 },
    );
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.stdout.length <= 10).toBe(true);
  });
});
