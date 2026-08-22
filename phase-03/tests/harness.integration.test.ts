import { createLogger } from "@issue/foundation";
import type { DirectoryEntry, ToolResult } from "@issue/tool-runtime";
import { symlink } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createDeterministicProviderStub,
  runIntegrationTask,
} from "../src/index.js";
import type { IntegrationTaskRequest } from "../src/index.js";
import {
  abortingProvider,
  captureStdout,
  makeRoot,
  mkdirFixture,
  recordingProvider,
  removeRoot,
  scriptedProvider,
  writeFixture,
} from "./helpers.js";

function entriesOf(result: ToolResult | undefined): DirectoryEntry[] {
  if (
    result?.ok === true &&
    result.data !== undefined &&
    "entries" in result.data
  ) {
    return [...result.data.entries];
  }
  return [];
}

describe("harness request validation (§29.5)", () => {
  it("malformed requests are rejected with issue.usage", async () => {
    const root = await makeRoot();
    try {
      const stub = createDeterministicProviderStub();
      const base = {
        root,
        provider: stub,
        refs: { files: [] as string[], directories: [] as string[] },
      };
      const cases: Array<[unknown, string]> = [
        [null, "integration run request must be an object"],
        [{ ...base, root: "" }, "root must be a non-empty absolute path"],
        [{ ...base, root: 42 }, "root must be a non-empty absolute path"],
        [{ ...base, refs: undefined }, "refs must be a TaskRefs object"],
        [
          { ...base, refs: { files: "x", directories: [] } },
          "refs.files and refs.directories must be arrays",
        ],
        [
          { ...base, refs: { files: [], directories: "x" } },
          "refs.files and refs.directories must be arrays",
        ],
        [
          { ...base, refs: { files: [""], directories: [] } },
          "refs.files entries must be non-empty strings",
        ],
        [
          { ...base, refs: { files: [1], directories: [] } },
          "refs.files entries must be non-empty strings",
        ],
        [
          { ...base, refs: { files: [], directories: [""] } },
          "refs.directories entries must be non-empty strings",
        ],
        [
          { ...base, provider: undefined },
          "provider must be a DecisionProvider",
        ],
        [
          { ...base, provider: {} },
          "provider must implement selectAction and assess",
        ],
      ];
      for (const [request, message] of cases) {
        const res = await runIntegrationTask(
          request as unknown as IntegrationTaskRequest,
        );
        expect(res.ok).toBe(false);
        if (res.ok) continue;
        expect(res.error.code).toBe("issue.usage");
        expect(res.error.message).toBe(message);
      }
    } finally {
      await removeRoot(root);
    }
  });

  it("invalid bounds surface as a harness-layer error (issue.internal)", async () => {
    const root = await makeRoot();
    try {
      const res = await runIntegrationTask({
        root,
        provider: createDeterministicProviderStub(),
        bounds: {
          maxRetries: 0,
          maxCorrections: 5,
          maxVerifications: 10,
          maxBytesPerRead: 8,
          chunkSize: 8,
        },
        refs: { files: [], directories: [] },
      });
      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.error.code).toBe("issue.internal");
      expect(res.error.recoverable).toBe(false);
    } finally {
      await removeRoot(root);
    }
  });
});

describe("V5/V6 — containment projection", () => {
  it("V5: an out-of-root file target is refused before runTask and never executed", async () => {
    const root = await makeRoot();
    try {
      const rec = recordingProvider(createDeterministicProviderStub());
      const res = await runIntegrationTask({
        root,
        provider: rec.provider,
        refs: { files: [join(root, "..", "escape.txt")], directories: [] },
      });
      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.error.code).toBe("issue.path.escape");
      expect(res.error.recoverable).toBe(false);
      expect(rec.calls).toHaveLength(0);
    } finally {
      await removeRoot(root);
    }
  });

  it("V5: an out-of-root directory target is refused before runTask", async () => {
    const root = await makeRoot();
    try {
      const rec = recordingProvider(createDeterministicProviderStub());
      const res = await runIntegrationTask({
        root,
        provider: rec.provider,
        refs: { files: [], directories: [join(root, "..", "escape-dir")] },
      });
      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.error.code).toBe("issue.path.escape");
      expect(rec.calls).toHaveLength(0);
    } finally {
      await removeRoot(root);
    }
  });

  it("V6: a symlink escaping the root is refused by realpath containment; traversal fallback where symlinks are not permitted", async () => {
    const root = await makeRoot();
    const outer = await makeRoot("p3-outer-");
    try {
      await writeFixture(outer, "secret.txt", "top secret");
      const link = join(root, "link.txt");
      let symlinked = false;
      try {
        await symlink(join(outer, "secret.txt"), link);
        symlinked = true;
      } catch {
        symlinked = false;
      }
      const rec = recordingProvider(createDeterministicProviderStub());
      const target = symlinked
        ? link
        : join(root, "..", "escape-via-traversal.txt");
      const res = await runIntegrationTask({
        root,
        provider: rec.provider,
        refs: { files: [target], directories: [] },
      });
      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.error.code).toBe("issue.path.escape");
      expect(rec.calls).toHaveLength(0);
    } finally {
      await removeRoot(root);
      await removeRoot(outer);
    }
  });
});

describe("V13 — cancellation", () => {
  it("V13 abort-before-start: an already-aborted signal ends the run CANCELLED before any action executes", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "a");
      await writeFixture(root, "b.txt", "b");
      const controller = new AbortController();
      controller.abort();
      const rec = recordingProvider(createDeterministicProviderStub());
      const res = await runIntegrationTask({
        root,
        provider: rec.provider,
        refs: {
          files: [join(root, "a.txt"), join(root, "b.txt")],
          directories: [],
        },
        signal: controller.signal,
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const state = res.value.run.state;
      expect(state.status).toBe("CANCELLED");
      expect(state.completed.files).toEqual([]);
      expect(state.attempts).toEqual({
        retries: 0,
        corrections: 0,
        verifications: 0,
      });
      expect(rec.calls).toHaveLength(0);
      expect(res.value.records).toEqual([
        { event: "validate", outcome: "ok" },
        { event: "run", status: "CANCELLED" },
      ]);
    } finally {
      await removeRoot(root);
    }
  });

  it("V13 mid-run: with at least two references, cancellation after a fixed select call freezes the completed set and blocks later actions", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "a");
      await writeFixture(root, "b.txt", "b");
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
        refs: {
          files: [join(root, "a.txt"), join(root, "b.txt")],
          directories: [],
        },
        signal: controller.signal,
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const state = res.value.run.state;
      expect(state.status).toBe("CANCELLED");
      expect(state.completed.files).toEqual([join(root, "a.txt")]);
      expect(state.completed.files).not.toContain(join(root, "b.txt"));
      expect(rec.calls.filter((call) => call.kind === "select")).toHaveLength(
        2,
      );
      expect(rec.calls.filter((call) => call.kind === "assess")).toHaveLength(
        1,
      );
      expect(res.value.records[1]).toEqual({
        event: "run",
        status: "CANCELLED",
      });
    } finally {
      await removeRoot(root);
    }
  });
});

describe("V15 — record ordering and terminal stability", () => {
  it("successful run: records are [validate, run]; no translate record; terminal status stable", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "hello");
      const res = await runIntegrationTask({
        root,
        provider: createDeterministicProviderStub(),
        refs: { files: [join(root, "a.txt")], directories: [] },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.value.records).toEqual([
        { event: "validate", outcome: "ok" },
        { event: "run", status: "COMPLETED" },
      ]);
      const runRecord = res.value.records[1];
      expect(runRecord?.event).toBe("run");
      if (runRecord?.event === "run") {
        expect(runRecord.status).toBe(res.value.run.state.status);
      }
      expect(res.value.toolErrors).toHaveLength(0);
    } finally {
      await removeRoot(root);
    }
  });

  it("failed run: records are [validate, run, translate]; terminal status stable", async () => {
    const root = await makeRoot();
    try {
      const res = await runIntegrationTask({
        root,
        provider: createDeterministicProviderStub(),
        refs: { files: [join(root, "missing.txt")], directories: [] },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.value.records).toEqual([
        { event: "validate", outcome: "ok" },
        { event: "run", status: "FAILED" },
        { event: "translate", code: "issue.tool.read.notfound" },
      ]);
      const runRecord = res.value.records[1];
      expect(runRecord?.event).toBe("run");
      if (runRecord?.event === "run") {
        expect(runRecord.status).toBe(res.value.run.state.status);
      }
      expect(res.value.toolErrors).toHaveLength(1);
    } finally {
      await removeRoot(root);
    }
  });
});

describe("V7 — hidden entries and options flow-through", () => {
  it("hidden entries are excluded by default, included with includeHidden: true, and identical on repeat", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "visible.txt", "v");
      await writeFixture(root, ".hidden.txt", "h");
      const stub = createDeterministicProviderStub();
      const request = {
        root,
        provider: stub,
        refs: { files: [], directories: [root] },
      };

      const first = await runIntegrationTask(request);
      expect(first.ok).toBe(true);
      if (!first.ok) return;
      const entriesDefault = entriesOf(first.value.run.state.lastResult);
      expect(entriesDefault.map((entry) => entry.name)).toEqual([
        "visible.txt",
      ]);
      expect(entriesDefault.every((entry) => !entry.isHidden)).toBe(true);

      const withHidden = { ...request, includeHidden: true };
      const second = await runIntegrationTask(withHidden);
      expect(second.ok).toBe(true);
      if (!second.ok) return;
      const entriesHidden = entriesOf(second.value.run.state.lastResult);
      expect(entriesHidden.map((entry) => entry.name)).toEqual([
        ".hidden.txt",
        "visible.txt",
      ]);
      expect(
        entriesHidden.find((entry) => entry.name === ".hidden.txt")?.isHidden,
      ).toBe(true);

      const repeat = await runIntegrationTask(withHidden);
      expect(repeat.ok).toBe(true);
      if (!repeat.ok) return;
      expect(entriesOf(repeat.value.run.state.lastResult)).toEqual(
        entriesHidden,
      );
    } finally {
      await removeRoot(root);
    }
  });

  it("objective and loggerConfig flow through without changing the outcome", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "hello");
      const res = await runIntegrationTask({
        root,
        provider: createDeterministicProviderStub(),
        refs: { files: [join(root, "a.txt")], directories: [] },
        objective: "verify content",
        loggerConfig: { level: "error", redact: ["nope"] },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.value.run.state.status).toBe("COMPLETED");
      expect(res.value.run.state.completed.files).toEqual([
        join(root, "a.txt"),
      ]);
    } finally {
      await removeRoot(root);
    }
  });

  it("a consumer-supplied scripted provider drives decisions through the harness", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "hello");
      const scripted = scriptedProvider([{ assess: "success" }]);
      const res = await runIntegrationTask({
        root,
        provider: scripted.provider,
        refs: { files: [join(root, "a.txt")], directories: [] },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.value.run.state.status).toBe("COMPLETED");
      expect(scripted.calls.selects).toBe(1);
      expect(scripted.calls.assesses).toBe(1);
    } finally {
      await removeRoot(root);
    }
  });
});

describe("V17 — authorized pending references projection", () => {
  it("completed set equals the authorized refs on a successful run", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "a");
      await writeFixture(root, "b.txt", "b");
      await mkdirFixture(root, "sub");
      const stub = createDeterministicProviderStub();
      const refs = {
        files: [join(root, "a.txt"), join(root, "b.txt")],
        directories: [join(root, "sub")],
      };
      const res = await runIntegrationTask({ root, provider: stub, refs });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const state = res.value.run.state;
      expect(state.completed.files).toEqual(refs.files);
      expect(state.completed.directories).toEqual(refs.directories);
      for (const file of state.completed.files)
        expect(refs.files).toContain(file);
      for (const dir of state.completed.directories) {
        expect(refs.directories).toContain(dir);
      }
    } finally {
      await removeRoot(root);
    }
  });

  it("a mixed request with an out-of-root ref is refused pre-run; nothing is processed", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "a");
      const rec = recordingProvider(createDeterministicProviderStub());
      const res = await runIntegrationTask({
        root,
        provider: rec.provider,
        refs: {
          files: [join(root, "a.txt"), join(root, "..", "escape.txt")],
          directories: [],
        },
      });
      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.error.code).toBe("issue.path.escape");
      expect(rec.calls).toHaveLength(0);
    } finally {
      await removeRoot(root);
    }
  });
});

describe("V18 — redaction and content-free errors", () => {
  const SECRET = "SUPER-SECRET-TOKEN-9f3k2";

  it("secret content never leaks into log lines or error surfaces; redaction yields [REDACTED]", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "secret.txt", `payload ${SECRET} at rest`);
      const stub = createDeterministicProviderStub();

      const successChunks = await captureStdout(async () => {
        const res = await runIntegrationTask({
          root,
          provider: stub,
          refs: { files: [join(root, "secret.txt")], directories: [] },
          loggerConfig: { level: "info", redact: [SECRET] },
        });
        expect(res.ok).toBe(true);
        if (!res.ok) return;
        expect(res.value.run.state.status).toBe("COMPLETED");
        const data = res.value.run.state.lastResult?.data;
        expect(data).toBeDefined();
        if (data !== undefined && "text" in data) {
          expect(data.text).toContain(SECRET);
        }
      });
      for (const line of successChunks) expect(line).not.toContain(SECRET);

      const failureChunks = await captureStdout(async () => {
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
        expect(res.value.toolErrors).toHaveLength(1);
        expect(res.value.toolErrors[0]?.message ?? "").not.toContain(SECRET);
        expect(
          JSON.stringify(res.value.toolErrors[0]?.details ?? {}),
        ).not.toContain(SECRET);
      });
      for (const line of failureChunks) expect(line).not.toContain(SECRET);

      const redactionChunks = await captureStdout(async () => {
        createLogger({ level: "info", redact: [SECRET] }).info("redaction", {
          secret: SECRET,
        });
      });
      for (const line of redactionChunks) {
        expect(line).not.toContain(SECRET);
        expect(line).toContain("[REDACTED]");
      }

      const withoutConfig = await runIntegrationTask({
        root,
        provider: stub,
        refs: { files: [join(root, "secret.txt")], directories: [] },
      });
      expect(withoutConfig.ok).toBe(true);
      if (!withoutConfig.ok) return;
      expect(withoutConfig.value.run.state.status).toBe("COMPLETED");
    } finally {
      await removeRoot(root);
    }
  });
});
