import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createDeterministicProviderStub,
  runIntegrationTask,
} from "../src/index.js";
import type { ToolErrorDetails } from "../src/index.js";
import { makeRoot, mkdirFixture, removeRoot, writeFixture } from "./helpers.js";

describe("V1 — all refs succeed", () => {
  it("classifies success, completes every ref, and produces no AD-1 translation", async () => {
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
      expect(state.attempts).toEqual({
        retries: 0,
        corrections: 0,
        verifications: 3,
      });
      expect(state.completed.files).toEqual([a, b]);
      expect(state.completed.directories).toEqual([sub]);
      expect(state.lastResult?.ok).toBe(true);
      expect(state.lastResult?.classification).toBe("success");
      expect(state.lastResult?.data).toBeDefined();
      expect(res.value.toolErrors).toHaveLength(0);
    } finally {
      await removeRoot(root);
    }
  });

  it("returns the exact file content for a successful read", async () => {
    const root = await makeRoot();
    try {
      const file = join(root, "a.txt");
      await writeFixture(root, "a.txt", "alpha content");
      const res = await runIntegrationTask({
        root,
        provider: createDeterministicProviderStub(),
        refs: { files: [file], directories: [] },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const data = res.value.run.state.lastResult?.data;
      expect(data).toBeDefined();
      if (data !== undefined && "text" in data) {
        expect(data.text).toBe("alpha content");
        expect(data.bytesRead).toBe("alpha content".length);
      }
    } finally {
      await removeRoot(root);
    }
  });
});

describe("V2 — read nonexistent file", () => {
  it("classifies notFound with the read code and fails with AD-1 translation", async () => {
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
      expect(state.lastResult?.classification).toBe("notFound");
      expect(state.lastResult?.error?.code).toBe("issue.tool.read.notfound");
      expect(state.lastResult?.error?.message).toBe(
        "The requested path does not exist.",
      );
      expect(state.completed.files).not.toContain(missing);
      expect(res.value.toolErrors).toHaveLength(1);
      expect(res.value.toolErrors[0]?.code).toBe("issue.tool.read.notfound");
      expect(res.value.toolErrors[0]?.recoverable).toBe(false);
    } finally {
      await removeRoot(root);
    }
  });
});

describe("V3 — invalid UTF-8 content", () => {
  it("classifies invalidContent and returns no text", async () => {
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
      expect(state.lastResult?.error?.code).toBe(
        "issue.tool.read.invalidcontent",
      );
      expect(state.lastResult?.error?.message).toBe(
        "File bytes are not strictly valid UTF-8.",
      );
      expect(state.lastResult?.data).toBeUndefined();
      expect(state.completed.files).not.toContain(file);
      expect(res.value.toolErrors[0]?.code).toBe(
        "issue.tool.read.invalidcontent",
      );
    } finally {
      await removeRoot(root);
    }
  });
});

describe("V4 — list nonexistent directory", () => {
  it("classifies notFound with the list code and fails with AD-1 translation", async () => {
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
      expect(state.lastResult?.error?.message).toBe(
        "The requested path does not exist.",
      );
      expect(state.completed.directories).not.toContain(missing);
      expect(res.value.toolErrors[0]?.code).toBe("issue.tool.list.notfound");
      const details = res.value.toolErrors[0]?.details as
        ToolErrorDetails | undefined;
      expect(details?.action.operation).toBe("listDirectory");
    } finally {
      await removeRoot(root);
    }
  });
});

describe("V8 — size bound", () => {
  it("a file above maxBytesPerRead classifies tooLarge; no truncated success is reported", async () => {
    const root = await makeRoot();
    try {
      const file = join(root, "big.txt");
      await writeFixture(root, "big.txt", "1234567890");
      const res = await runIntegrationTask({
        root,
        provider: createDeterministicProviderStub(),
        bounds: {
          maxRetries: 2,
          maxCorrections: 5,
          maxVerifications: 10,
          maxBytesPerRead: 4,
          chunkSize: 4,
        },
        refs: { files: [file], directories: [] },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const state = res.value.run.state;
      expect(state.status).toBe("FAILED");
      expect(state.lastResult?.classification).toBe("tooLarge");
      expect(state.lastResult?.error?.code).toBe("issue.tool.read.toolarge");
      expect(state.lastResult?.error?.message).toBe(
        "File content exceeds the maximum bytes per read.",
      );
      expect(state.lastResult?.data).toBeUndefined();
      expect(state.completed.files).toEqual([]);
      expect(state.attempts.corrections).toBe(5);
      expect(res.value.toolErrors[0]?.code).toBe("issue.tool.read.toolarge");
    } finally {
      await removeRoot(root);
    }
  });
});
