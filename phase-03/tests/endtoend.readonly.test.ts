import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createDeterministicProviderStub,
  runIntegrationTask,
} from "../src/index.js";
import {
  makeRoot,
  mkdirFixture,
  removeRoot,
  snapshotTree,
  writeFixture,
} from "./helpers.js";
import type { TreeSnapshot } from "./helpers.js";

function snapshotsEqual(a: TreeSnapshot, b: TreeSnapshot): boolean {
  if (a.entries.length !== b.entries.length) return false;
  for (let i = 0; i < a.entries.length; i++) {
    const ea = a.entries[i];
    const eb = b.entries[i];
    if (ea === undefined || eb === undefined) return false;
    if (ea.path !== eb.path || !ea.content.equals(eb.content)) return false;
  }
  return true;
}

describe("E2E V14 — filesystem integrity (§35.3)", () => {
  it("a successful E2E run leaves the fixture tree byte-identical", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "alpha");
      await mkdirFixture(root, "sub");
      await writeFixture(join(root, "sub"), "nested.txt", "nested");
      const before = await snapshotTree(root);
      const res = await runIntegrationTask({
        root,
        provider: createDeterministicProviderStub(),
        refs: {
          files: [join(root, "a.txt")],
          directories: [join(root, "sub")],
        },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.value.run.state.status).toBe("COMPLETED");
      const after = await snapshotTree(root);
      expect(snapshotsEqual(before, after)).toBe(true);
    } finally {
      await removeRoot(root);
    }
  });

  it("a failing E2E run (notFound) also leaves the fixture tree byte-identical", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "alpha");
      const before = await snapshotTree(root);
      const res = await runIntegrationTask({
        root,
        provider: createDeterministicProviderStub(),
        refs: { files: [join(root, "missing.txt")], directories: [] },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.value.run.state.status).toBe("FAILED");
      const after = await snapshotTree(root);
      expect(snapshotsEqual(before, after)).toBe(true);
    } finally {
      await removeRoot(root);
    }
  });
});
