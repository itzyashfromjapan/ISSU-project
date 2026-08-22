import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as runtime from "../src/index.js";
import type { FileContent } from "../src/index.js";
import { baseOptions, trustingProvider } from "./helpers.js";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "p2-contract-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("public contract surface (§17)", () => {
  it("exposes exactly the §17 runtime function surface", () => {
    expect(Object.keys(runtime).sort()).toEqual([
      "createToolRuntime",
      "deriveAvailableActions",
      "runTask",
    ]);
  });

  it("runTask drives a complete successful run to COMPLETED", async () => {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(join(root, "a.txt"), "hi", "utf8");
    const options = baseOptions(root);
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const result = await runtime.runTask(options, trustingProvider);
    expect(result.state.status).toBe("COMPLETED");
    expect(result.state.completed.files).toEqual([join(root, "a.txt")]);
  });

  it("createToolRuntime executes a read-only readFile against a real file", async () => {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(join(root, "hello.txt"), "hello world");
    const tool = runtime.createToolRuntime({
      root,
      bounds: baseOptions(root).bounds,
    });
    const result = await tool.execute({
      operation: "readFile",
      target: join(root, "hello.txt"),
      read: {},
    });
    expect(result.ok).toBe(true);
    expect(result.classification).toBe("success");
    if (result.ok) {
      expect((result.data as FileContent).text).toBe("hello world");
    }
  });

  it("deriveAvailableActions returns the pending refs deterministically", () => {
    const options = baseOptions(root);
    options.refs = { files: [join(root, "x.txt")], directories: [] };
    const state = {
      status: "READY" as const,
      attempts: { retries: 0, corrections: 0, verifications: 0 },
      completed: { files: [], directories: [] },
    };
    const actions = runtime.deriveAvailableActions(state, options);
    expect(actions).toHaveLength(1);
    expect(actions[0]?.ref.operation).toBe("readFile");
    expect(actions[0]?.ref.target).toBe(join(root, "x.txt"));
  });
});
