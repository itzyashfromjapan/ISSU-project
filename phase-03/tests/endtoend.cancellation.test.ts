import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createDeterministicProviderStub,
  runIntegrationTask,
} from "../src/index.js";
import {
  abortingProvider,
  makeRoot,
  mkdirFixture,
  recordingProvider,
  removeRoot,
  writeFixture,
} from "./helpers.js";

describe("E2E V13 — mid-run cancellation (§35.7)", () => {
  it("abort mid-run freezes the completed set at the abort point and executes no further actions", async () => {
    const root = await makeRoot();
    try {
      const a = join(root, "a.txt");
      const b = join(root, "b.txt");
      const sub = join(root, "sub");
      await writeFixture(root, "a.txt", "a");
      await writeFixture(root, "b.txt", "b");
      await mkdirFixture(root, "sub");
      const controller = new AbortController();
      const aborting = abortingProvider(
        controller,
        createDeterministicProviderStub(),
        2,
      );
      const rec = recordingProvider(aborting);
      const res = await runIntegrationTask({
        root,
        provider: rec.provider,
        refs: { files: [a, b], directories: [sub] },
        signal: controller.signal,
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const state = res.value.run.state;
      expect(state.status).toBe("CANCELLED");
      expect(state.completed.files).toEqual([a]);
      expect(state.completed.files).not.toContain(b);
      expect(state.completed.directories).toEqual([]);
      expect(rec.calls.filter((call) => call.kind === "select")).toHaveLength(
        2,
      );
      expect(rec.calls.filter((call) => call.kind === "assess")).toHaveLength(
        1,
      );
      expect(state.attempts).toEqual({
        retries: 0,
        corrections: 0,
        verifications: 1,
      });
      expect(res.value.records).toEqual([
        { event: "validate", outcome: "ok" },
        { event: "run", status: "CANCELLED" },
      ]);
      expect(res.value.toolErrors).toHaveLength(0);
    } finally {
      await removeRoot(root);
    }
  });
});
