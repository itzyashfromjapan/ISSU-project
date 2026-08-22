import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runTask } from "../src/index.js";
import type { DecisionProvider, TaskResult } from "../src/index.js";
import {
  assessingProvider,
  baseOptions,
  makeRoot,
  recordingProvider,
  removeRoot,
  trustingProvider,
} from "./helpers.js";

let root: string;

beforeEach(async () => {
  root = await makeRoot();
});

afterEach(async () => {
  await removeRoot(root);
});

describe("runTask (§5, §6)", () => {
  it("COMPLETED when every ref succeeds (V1)", async () => {
    await writeFile(join(root, "a.txt"), "hi", "utf8");
    await mkdir(join(root, "dir"));
    const options = baseOptions(root);
    options.refs = {
      files: [join(root, "a.txt")],
      directories: [join(root, "dir")],
    };
    const { provider, calls } = recordingProvider(trustingProvider);
    const result = await runTask(options, provider);
    expect(result.state.status).toBe("COMPLETED");
    expect(result.state.completed.files).toEqual([join(root, "a.txt")]);
    expect(result.state.completed.directories).toEqual([join(root, "dir")]);
    expect(result.state.attempts).toEqual({
      retries: 0,
      corrections: 0,
      verifications: 2,
    });
    expect(calls).toHaveLength(4);
  });

  it("FAILED when a file is missing (V2)", async () => {
    const options = baseOptions(root);
    options.bounds = {
      maxRetries: 1,
      maxCorrections: 1,
      maxVerifications: 1,
      maxBytesPerRead: 1024,
      chunkSize: 64,
    };
    options.refs = { files: [join(root, "missing.txt")], directories: [] };
    const result = await runTask(options, trustingProvider);
    expect(result.state.status).toBe("FAILED");
    expect(result.state.lastResult?.classification).toBe("notFound");
    expect(result.state.lastCorrection).toBe("ADVANCE");
    expect(result.state.attempts.corrections).toBe(1);
  });

  it("FAILED when a file has invalid UTF-8 and never returns text (V3)", async () => {
    await writeFile(join(root, "bad.bin"), Buffer.from([0xff, 0xfe, 0x41]));
    const options = baseOptions(root);
    options.refs = { files: [join(root, "bad.bin")], directories: [] };
    const result = await runTask(options, trustingProvider);
    expect(result.state.status).toBe("FAILED");
    expect(result.state.lastResult?.classification).toBe("invalidContent");
    expect(result.state.lastResult?.data).toBeUndefined();
  });

  it("FAILED when content exceeds maxBytesPerRead (V8)", async () => {
    await writeFile(join(root, "big.txt"), "x".repeat(100), "utf8");
    const options = baseOptions(root);
    options.bounds = {
      maxRetries: 1,
      maxCorrections: 1,
      maxVerifications: 1,
      maxBytesPerRead: 8,
      chunkSize: 8,
    };
    options.refs = { files: [join(root, "big.txt")], directories: [] };
    const result = await runTask(options, trustingProvider);
    expect(result.state.status).toBe("FAILED");
    expect(result.state.lastResult?.classification).toBe("tooLarge");
  });

  it("never offers or executes a target outside the root (V5, V17)", async () => {
    await writeFile(join(root, "inside.txt"), "in", "utf8");
    const outside = await mkdtemp(join(tmpdir(), "p2-outside-run-"));
    await writeFile(join(outside, "outside.txt"), "out", "utf8");
    try {
      const options = baseOptions(root);
      options.refs = {
        files: [join(root, "inside.txt"), join(outside, "outside.txt")],
        directories: [],
      };
      const seen: string[] = [];
      const provider: DecisionProvider = {
        async selectAction(available) {
          for (const item of available) seen.push(item.ref.target);
          const first = available[0];
          if (first === undefined) throw new Error("no available action");
          return first.ref;
        },
        async assess(result) {
          return { classification: result.classification };
        },
      };
      const result = await runTask(options, provider);
      expect(result.state.status).toBe("FAILED");
      expect(seen).toEqual([join(root, "inside.txt")]);
      expect(seen).not.toContain(join(outside, "outside.txt"));
      expect(result.state.lastResult?.classification).toBe("success");
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it("RETRYs an executionError exactly up to maxRetries then EXHAUSTs (V9, V10)", async () => {
    await writeFile(join(root, "a.txt"), "hi", "utf8");
    const options = baseOptions(root);
    options.bounds = {
      maxRetries: 2,
      maxCorrections: 10,
      maxVerifications: 10,
      maxBytesPerRead: 1024,
      chunkSize: 64,
    };
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const { provider, calls } = recordingProvider(
      assessingProvider("executionError"),
    );
    const result = await runTask(options, provider);
    expect(result.state.status).toBe("FAILED");
    expect(result.state.attempts.retries).toBe(2);
    expect(result.state.attempts.corrections).toBe(3);
    expect(result.state.lastCorrection).toBe("EXHAUST");
    const executions = calls.filter((call) => call.kind === "assess").length;
    expect(executions).toBe(3);
  });

  it("enters CORRECTING at most maxCorrections times (V11)", async () => {
    const options = baseOptions(root);
    options.bounds = {
      maxRetries: 1,
      maxCorrections: 2,
      maxVerifications: 5,
      maxBytesPerRead: 1024,
      chunkSize: 64,
    };
    options.refs = { files: [join(root, "missing.txt")], directories: [] };
    const { provider, calls } = recordingProvider(trustingProvider);
    const result = await runTask(options, provider);
    expect(result.state.status).toBe("FAILED");
    expect(result.state.attempts.corrections).toBe(2);
    expect(result.state.attempts.verifications).toBe(2);
    expect(result.state.lastCorrection).toBe("ADVANCE");
    expect(calls.filter((call) => call.kind === "assess")).toHaveLength(3);
  });

  it("enters VERIFYING at most maxVerifications times (V12)", async () => {
    const options = baseOptions(root);
    options.bounds = {
      maxRetries: 1,
      maxCorrections: 5,
      maxVerifications: 2,
      maxBytesPerRead: 1024,
      chunkSize: 64,
    };
    options.refs = { files: [join(root, "missing.txt")], directories: [] };
    const result = await runTask(options, trustingProvider);
    expect(result.state.status).toBe("FAILED");
    expect(result.state.attempts.verifications).toBe(2);
    expect(result.state.attempts.corrections).toBe(2);
  });

  it("ends CANCELLED without executing when the signal is pre-aborted (§5.4)", async () => {
    const options = baseOptions(root);
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const controller = new AbortController();
    controller.abort();
    let providerCalled = false;
    const provider: DecisionProvider = {
      async selectAction() {
        providerCalled = true;
        throw new Error("must not be called");
      },
      async assess() {
        providerCalled = true;
        throw new Error("must not be called");
      },
    };
    const result = await runTask(options, provider, {
      signal: controller.signal,
    });
    expect(result.state.status).toBe("CANCELLED");
    expect(providerCalled).toBe(false);
    expect(result.state.lastAction).toBeUndefined();
  });

  it("ends CANCELLED and executes nothing when cancelled during SELECTING (V13)", async () => {
    await writeFile(join(root, "a.txt"), "hi", "utf8");
    const options = baseOptions(root);
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const controller = new AbortController();
    const provider: DecisionProvider = {
      async selectAction(available) {
        controller.abort();
        const first = available[0];
        if (first === undefined) throw new Error("no available action");
        return first.ref;
      },
      async assess() {
        throw new Error("must not be called");
      },
    };
    const result = await runTask(options, provider, {
      signal: controller.signal,
    });
    expect(result.state.status).toBe("CANCELLED");
    expect(result.state.lastAction).toBeDefined();
    expect(result.state.lastResult).toBeUndefined();
  });

  it("emits no further transitions after a terminal state (V15)", async () => {
    await writeFile(join(root, "a.txt"), "hi", "utf8");
    const options = baseOptions(root);
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const { provider, calls } = recordingProvider(trustingProvider);
    const result = await runTask(options, provider);
    expect(result.state.status).toBe("COMPLETED");
    expect(calls).toHaveLength(2);
  });

  it("is deterministic for identical inputs (V16)", async () => {
    await writeFile(join(root, "a.txt"), "hi", "utf8");
    const options = baseOptions(root);
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const runOnce = async (): Promise<{
      result: TaskResult;
      calls: unknown[];
    }> => {
      const { provider, calls } = recordingProvider(trustingProvider);
      const result = await runTask(options, provider);
      return { result, calls };
    };
    const first = await runOnce();
    const second = await runOnce();
    expect(JSON.parse(JSON.stringify(first.result))).toEqual(
      JSON.parse(JSON.stringify(second.result)),
    );
    expect(first.calls).toEqual(second.calls);
  });

  it("leaves the filesystem byte-for-byte unchanged after a run (V14)", async () => {
    await writeFile(join(root, "a.txt"), "content-a", "utf8");
    await mkdir(join(root, "dir"));
    await writeFile(join(root, "dir", "b.txt"), "content-b", "utf8");
    const snapshot = async (): Promise<unknown[]> => {
      const out: unknown[] = [];
      const walk = async (dir: string): Promise<void> => {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries.sort((a, b) =>
          a.name < b.name ? -1 : 1,
        )) {
          if (entry.isDirectory()) {
            out.push([entry.name, "dir"]);
            await walk(join(dir, entry.name));
          } else {
            out.push([
              entry.name,
              "file",
              await readFile(join(dir, entry.name)),
            ]);
          }
        }
      };
      await walk(root);
      return out;
    };
    const before = await snapshot();
    const options = baseOptions(root);
    options.refs = {
      files: [join(root, "a.txt"), join(root, "dir", "b.txt")],
      directories: [join(root, "dir")],
    };
    const result = await runTask(options, trustingProvider);
    expect(result.state.status).toBe("COMPLETED");
    const after = await snapshot();
    expect(after).toEqual(before);
  });

  it("marks a ref completed only after a success assessment", async () => {
    await writeFile(join(root, "a.txt"), "hi", "utf8");
    const options = baseOptions(root);
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const provider: DecisionProvider = {
      async selectAction(available) {
        const first = available[0];
        if (first === undefined) throw new Error("no available action");
        return first.ref;
      },
      async assess(result) {
        if (result.classification === "success")
          return { classification: "notFound" };
        return { classification: "success" };
      },
    };
    const result = await runTask(options, provider);
    expect(result.state.status).toBe("FAILED");
    expect(result.state.completed.files).toEqual([]);
  });
});

describe("runTask provider contract (§7.3)", () => {
  it("rejects an assess result carrying a control-flow directive as internalError", async () => {
    await writeFile(join(root, "a.txt"), "hi", "utf8");
    const options = baseOptions(root);
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const provider: DecisionProvider = {
      async selectAction(available) {
        const first = available[0];
        if (first === undefined) throw new Error("no available action");
        return first.ref;
      },
      async assess() {
        return { classification: "success", direction: "RETRY" } as never;
      },
    };
    const result = await runTask(options, provider);
    expect(result.state.status).toBe("FAILED");
    expect(result.state.lastResult?.classification).toBe("internalError");
  });

  it("rejects an assess result with an unknown classification as internalError", async () => {
    await writeFile(join(root, "a.txt"), "hi", "utf8");
    const options = baseOptions(root);
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const provider: DecisionProvider = {
      async selectAction(available) {
        const first = available[0];
        if (first === undefined) throw new Error("no available action");
        return first.ref;
      },
      async assess() {
        return { classification: "bogus" } as never;
      },
    };
    const result = await runTask(options, provider);
    expect(result.state.status).toBe("FAILED");
    expect(result.state.lastResult?.classification).toBe("internalError");
  });

  it("rejects a selectAction result outside the available set as internalError", async () => {
    const options = baseOptions(root);
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const provider: DecisionProvider = {
      async selectAction() {
        return {
          operation: "readFile",
          target: join(root, "other.txt"),
          read: {},
        };
      },
      async assess(result) {
        return { classification: result.classification };
      },
    };
    const result = await runTask(options, provider);
    expect(result.state.status).toBe("FAILED");
    expect(result.state.lastResult?.classification).toBe("internalError");
  });

  it("ends FAILED when selectAction throws", async () => {
    const options = baseOptions(root);
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const provider: DecisionProvider = {
      async selectAction() {
        throw new Error("provider exploded");
      },
      async assess(result) {
        return { classification: result.classification };
      },
    };
    const result = await runTask(options, provider);
    expect(result.state.status).toBe("FAILED");
    expect(result.state.lastResult?.classification).toBe("internalError");
  });

  it("ends FAILED when assess throws", async () => {
    await writeFile(join(root, "a.txt"), "hi", "utf8");
    const options = baseOptions(root);
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const provider: DecisionProvider = {
      async selectAction(available) {
        const first = available[0];
        if (first === undefined) throw new Error("no available action");
        return first.ref;
      },
      async assess() {
        throw new Error("assess exploded");
      },
    };
    const result = await runTask(options, provider);
    expect(result.state.status).toBe("FAILED");
    expect(result.state.lastResult?.classification).toBe("internalError");
  });
});

describe("runTask input validation (§12)", () => {
  it("rejects non-positive bounds", async () => {
    const options = baseOptions(root);
    options.bounds = { ...options.bounds, maxRetries: 0 };
    options.refs = { files: [], directories: [] };
    await expect(runTask(options, trustingProvider)).rejects.toThrow(
      "maxRetries",
    );
  });

  it("rejects chunkSize above maxBytesPerRead", async () => {
    const options = baseOptions(root);
    options.bounds = { ...options.bounds, chunkSize: 2 * 10 ** 6 };
    options.refs = { files: [], directories: [] };
    await expect(runTask(options, trustingProvider)).rejects.toThrow(
      "chunkSize",
    );
  });

  it("rejects a relative root", async () => {
    const options = baseOptions(root);
    options.root = "relative/root";
    options.refs = { files: [], directories: [] };
    await expect(runTask(options, trustingProvider)).rejects.toThrow(
      "absolute",
    );
  });

  it("rejects a provider missing assess", async () => {
    const options = baseOptions(root);
    options.refs = { files: [], directories: [] };
    const provider = {
      selectAction: async () => ({}),
    } as unknown as DecisionProvider;
    await expect(runTask(options, provider)).rejects.toThrow("assess");
  });
});

describe("runTask — remaining §16 scenarios", () => {
  it("FAILED with notFound when a listed directory does not exist (V4)", async () => {
    const options = baseOptions(root);
    options.bounds = {
      maxRetries: 1,
      maxCorrections: 1,
      maxVerifications: 2,
      maxBytesPerRead: 1024,
      chunkSize: 64,
    };
    options.refs = { files: [], directories: [join(root, "missing-dir")] };
    const result = await runTask(options, trustingProvider);
    expect(result.state.status).toBe("FAILED");
    expect(result.state.lastResult?.classification).toBe("notFound");
    expect(result.state.lastResult?.error?.code).toBe(
      "issue.tool.list.notfound",
    );
    expect(result.state.attempts.corrections).toBe(1);
    expect(result.state.lastCorrection).toBe("ADVANCE");
  });

  it("COMPLETED immediately when the refs are empty (§4.2, V1 variant)", async () => {
    const options = baseOptions(root);
    options.refs = { files: [], directories: [] };
    const { provider, calls } = recordingProvider(trustingProvider);
    const result = await runTask(options, provider);
    expect(result.state.status).toBe("COMPLETED");
    expect(result.state.attempts).toEqual({
      retries: 0,
      corrections: 0,
      verifications: 1,
    });
    expect(calls).toHaveLength(0);
  });

  it("FAILED via no-actions-available when every ref is outside the root", async () => {
    const options = baseOptions(root);
    const outside = await mkdtemp(join(tmpdir(), "p2-outside-only-"));
    try {
      options.refs = {
        files: [join(outside, "a.txt")],
        directories: [join(outside, "d")],
      };
      const { provider, calls } = recordingProvider(trustingProvider);
      const result = await runTask(options, provider);
      expect(result.state.status).toBe("FAILED");
      expect(result.state.lastResult).toBeUndefined();
      expect(result.state.attempts.verifications).toBe(1);
      expect(calls).toHaveLength(0);
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it("CANCELLED before a second action executes; the second action never runs (V13)", async () => {
    await writeFile(join(root, "a.txt"), "a", "utf8");
    await writeFile(join(root, "b.txt"), "b", "utf8");
    const options = baseOptions(root);
    options.refs = {
      files: [join(root, "a.txt"), join(root, "b.txt")],
      directories: [],
    };
    const controller = new AbortController();
    const executed: string[] = [];
    let selection = 0;
    const provider: DecisionProvider = {
      async selectAction(available) {
        const first = available[0];
        if (first === undefined) throw new Error("no available action");
        selection += 1;
        if (selection === 2) queueMicrotask(() => controller.abort());
        return first.ref;
      },
      async assess(result) {
        executed.push(result.action.target);
        return { classification: "success" };
      },
    };
    const result = await runTask(options, provider, {
      signal: controller.signal,
    });
    expect(result.state.status).toBe("CANCELLED");
    expect(executed).toEqual([join(root, "a.txt")]);
    expect(result.state.completed.files).toEqual([join(root, "a.txt")]);
  });

  it("CANCELLED after a successful action; no further actions execute", async () => {
    await writeFile(join(root, "a.txt"), "a", "utf8");
    await writeFile(join(root, "b.txt"), "b", "utf8");
    const options = baseOptions(root);
    options.refs = {
      files: [join(root, "a.txt"), join(root, "b.txt")],
      directories: [],
    };
    const controller = new AbortController();
    const executed: string[] = [];
    const provider: DecisionProvider = {
      async selectAction(available) {
        const first = available[0];
        if (first === undefined) throw new Error("no available action");
        return first.ref;
      },
      async assess(result) {
        executed.push(result.action.target);
        controller.abort();
        return { classification: "success" };
      },
    };
    const result = await runTask(options, provider, {
      signal: controller.signal,
    });
    expect(result.state.status).toBe("CANCELLED");
    expect(executed).toEqual([join(root, "a.txt")]);
  });
});
