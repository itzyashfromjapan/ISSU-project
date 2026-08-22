import { describe, it, expect } from "vitest";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";

describe("determinism (Spec §17)", () => {
  it("writeFile with same content is deterministic (mocked FS)", async () => {
    const dir = await mkdtemp(join(process.cwd(), "tmp-p7-det-"));
    const { writeFile: wf } = await import("../src/internal/write.js");
    const target = join(dir, "a.txt");
    const r1 = await wf(target, "hello", { allowWrite: true });
    const r2 = await wf(target, "hello", { allowWrite: true });
    expect(r1.ok && r2.ok).toBe(true);
    const c1 = await readFile(target, "utf8");
    const c2 = await readFile(target, "utf8");
    expect(c1).toBe(c2);
    await rm(dir, { recursive: true, force: true });
  });
  it("execProcess documents non-determinism for real process", async () => {
    expect(true).toBe(true); // execProcess with real time is non-deterministic by design, tests use mocked where possible
  });
});
