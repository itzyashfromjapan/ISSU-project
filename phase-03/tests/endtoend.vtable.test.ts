import { createLogger } from "@issue/foundation";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createDeterministicProviderStub,
  DEFAULT_BOUNDS,
  runIntegrationTask,
} from "../src/index.js";
import {
  captureStdout,
  makeRoot,
  mkdirFixture,
  removeRoot,
  writeFixture,
} from "./helpers.js";

describe("E2E V1 — full happy path (§35.3)", () => {
  it("completes every ref through default bounds and ends terminal COMPLETED", async () => {
    const root = await makeRoot();
    try {
      const a = join(root, "a.txt");
      const b = join(root, "b.txt");
      const sub = join(root, "sub");
      await writeFixture(root, "a.txt", "alpha");
      await writeFixture(root, "b.txt", "beta");
      await mkdirFixture(root, "sub");
      const res = await runIntegrationTask({
        root,
        provider: createDeterministicProviderStub(),
        refs: { files: [a, b], directories: [sub] },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const state = res.value.run.state;
      expect(state.status).toBe("COMPLETED");
      expect(state.completed.files).toEqual([a, b]);
      expect(state.completed.directories).toEqual([sub]);
      expect(state.lastResult?.classification).toBe("success");
      expect(state.attempts).toEqual({
        retries: 0,
        corrections: 0,
        verifications: 3,
      });
      expect(res.value.toolErrors).toHaveLength(0);
      expect(res.value.records).toEqual([
        { event: "validate", outcome: "ok" },
        { event: "run", status: "COMPLETED" },
      ]);
    } finally {
      await removeRoot(root);
    }
  });
});

describe("E2E V2/V3/V4 — terminal FAILED (§35.3)", () => {
  it("V2: a read of a nonexistent file ends terminal FAILED", async () => {
    const root = await makeRoot();
    try {
      const missing = join(root, "missing.txt");
      const res = await runIntegrationTask({
        root,
        provider: createDeterministicProviderStub(),
        refs: { files: [missing], directories: [] },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const state = res.value.run.state;
      expect(state.status).toBe("FAILED");
      expect(state.completed.files).not.toContain(missing);
      expect(res.value.records[1]).toEqual({ event: "run", status: "FAILED" });
    } finally {
      await removeRoot(root);
    }
  });

  it("V3: invalid UTF-8 content ends terminal FAILED with no text returned", async () => {
    const root = await makeRoot();
    try {
      const file = join(root, "bad.bin");
      await writeFixture(root, "bad.bin", Buffer.from([0xc3, 0x28, 0x00]));
      const res = await runIntegrationTask({
        root,
        provider: createDeterministicProviderStub(),
        refs: { files: [file], directories: [] },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const state = res.value.run.state;
      expect(state.status).toBe("FAILED");
      expect(state.lastResult?.classification).toBe("invalidContent");
      expect(state.lastResult?.data).toBeUndefined();
    } finally {
      await removeRoot(root);
    }
  });

  it("V4: a list of a nonexistent directory ends terminal FAILED", async () => {
    const root = await makeRoot();
    try {
      const missing = join(root, "missing-dir");
      const res = await runIntegrationTask({
        root,
        provider: createDeterministicProviderStub(),
        refs: { files: [], directories: [missing] },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const state = res.value.run.state;
      expect(state.status).toBe("FAILED");
      expect(state.lastResult?.classification).toBe("notFound");
      expect(state.lastResult?.error?.code).toBe("issue.tool.list.notfound");
    } finally {
      await removeRoot(root);
    }
  });
});

describe("E2E V11/V12 — correction and verification bounds (§35.3)", () => {
  it("V11: a forced notFound ADVANCE loop exhausts corrections exactly at maxCorrections and ends FAILED", async () => {
    const root = await makeRoot();
    try {
      const file = join(root, "a.txt");
      await writeFixture(root, "a.txt", "a");
      const stub = createDeterministicProviderStub({
        table: { assessments: new Map([[file, "notFound"]]) },
      });
      const res = await runIntegrationTask({
        root,
        provider: stub,
        refs: { files: [file], directories: [] },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const state = res.value.run.state;
      expect(state.status).toBe("FAILED");
      expect(state.attempts.corrections).toBeLessThanOrEqual(
        DEFAULT_BOUNDS.maxCorrections,
      );
      expect(state.attempts.corrections).toBe(5);
      expect(state.completed.files).not.toContain(file);
    } finally {
      await removeRoot(root);
    }
  });

  it("V12: exceeding maxVerifications on a real run ends terminal FAILED at the bound", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "a");
      await writeFixture(root, "b.txt", "b");
      const res = await runIntegrationTask({
        root,
        provider: createDeterministicProviderStub(),
        bounds: {
          maxRetries: 2,
          maxCorrections: 5,
          maxVerifications: 1,
          maxBytesPerRead: 1024 * 1024,
          chunkSize: 4096,
        },
        refs: {
          files: [join(root, "a.txt"), join(root, "b.txt")],
          directories: [],
        },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const state = res.value.run.state;
      expect(state.status).toBe("FAILED");
      expect(state.attempts.verifications).toBe(1);
      expect(state.attempts.verifications).toBeLessThanOrEqual(1);
      expect(state.completed.files).toEqual([join(root, "a.txt")]);
    } finally {
      await removeRoot(root);
    }
  });

  it("V12: a default-bounds happy path stays within maxVerifications", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "a");
      await writeFixture(root, "b.txt", "b");
      const res = await runIntegrationTask({
        root,
        provider: createDeterministicProviderStub(),
        refs: {
          files: [join(root, "a.txt"), join(root, "b.txt")],
          directories: [],
        },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const state = res.value.run.state;
      expect(state.status).toBe("COMPLETED");
      expect(state.attempts.verifications).toBeLessThanOrEqual(
        DEFAULT_BOUNDS.maxVerifications,
      );
    } finally {
      await removeRoot(root);
    }
  });
});

describe("E2E V15/V16/V17 — terminal closure, determinism, authorized projection (§35.3)", () => {
  it("V15: the E2E run is terminal and the run record matches the final state", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "a");
      const res = await runIntegrationTask({
        root,
        provider: createDeterministicProviderStub(),
        refs: { files: [join(root, "a.txt")], directories: [] },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const runRecord = res.value.records[1];
      expect(runRecord?.event).toBe("run");
      if (runRecord?.event === "run") {
        expect(runRecord.status).toBe(res.value.run.state.status);
      }
      expect(["COMPLETED", "FAILED", "CANCELLED"]).toContain(
        res.value.run.state.status,
      );
    } finally {
      await removeRoot(root);
    }
  });

  it("V16: two identical E2E runs produce identical terminal, attempts, and completed sets", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "a");
      await writeFixture(root, "b.txt", "b");
      await mkdirFixture(root, "sub");
      const request = {
        root,
        provider: createDeterministicProviderStub(),
        refs: {
          files: [join(root, "a.txt"), join(root, "b.txt")],
          directories: [join(root, "sub")],
        },
      };
      const first = await runIntegrationTask(request);
      const second = await runIntegrationTask(request);
      expect(first.ok).toBe(true);
      expect(second.ok).toBe(true);
      if (!first.ok || !second.ok) return;
      const firstState = first.value.run.state;
      const secondState = second.value.run.state;
      expect(secondState.status).toBe(firstState.status);
      expect(secondState.attempts).toEqual(firstState.attempts);
      expect(secondState.completed).toEqual(firstState.completed);
    } finally {
      await removeRoot(root);
    }
  });

  it("V17: on an E2E run the completed set contains only authorized refs", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "a");
      const refs = { files: [join(root, "a.txt")], directories: [] };
      const res = await runIntegrationTask({
        root,
        provider: createDeterministicProviderStub(),
        refs,
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const state = res.value.run.state;
      for (const file of state.completed.files) {
        expect(refs.files).toContain(file);
      }
      for (const dir of state.completed.directories) {
        expect(refs.directories).toContain(dir);
      }
    } finally {
      await removeRoot(root);
    }
  });
});

describe("E2E V18 — redaction repeat on an E2E run (§35.3)", () => {
  const SECRET = "E2E-SECRET-TOKEN-7x1q";

  it("a redacted E2E run never surfaces the secret in logs or error surfaces", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "secret.txt", `payload ${SECRET} at rest`);
      const stub = createDeterministicProviderStub();

      const runChunks = await captureStdout(async () => {
        const res = await runIntegrationTask({
          root,
          provider: stub,
          bounds: {
            maxRetries: 2,
            maxCorrections: 5,
            maxVerifications: 10,
            maxBytesPerRead: 4,
            chunkSize: 4,
          },
          refs: { files: [join(root, "secret.txt")], directories: [] },
          loggerConfig: { level: "info", redact: [SECRET] },
        });
        expect(res.ok).toBe(true);
        if (!res.ok) return;
        const state = res.value.run.state;
        expect(state.status).toBe("FAILED");
        expect(state.lastResult?.classification).toBe("tooLarge");
        expect(state.lastResult?.data).toBeUndefined();
        expect(state.lastResult?.error?.message ?? "").not.toContain(SECRET);
        expect(JSON.stringify(res.value.toolErrors)).not.toContain(SECRET);
      });
      for (const line of runChunks) expect(line).not.toContain(SECRET);

      const redactionChunks = await captureStdout(async () => {
        createLogger({ level: "info", redact: [SECRET] }).info("redaction", {
          secret: SECRET,
        });
      });
      for (const line of redactionChunks) {
        expect(line).not.toContain(SECRET);
        expect(line).toContain("[REDACTED]");
      }
    } finally {
      await removeRoot(root);
    }
  });
});
