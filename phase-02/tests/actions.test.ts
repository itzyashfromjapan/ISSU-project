import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deriveAvailableActions } from "../src/index.js";
import type { TaskState } from "../src/index.js";
import { baseOptions, makeRoot, removeRoot } from "./helpers.js";
import { join } from "node:path";

let root: string;

beforeEach(async () => {
  root = await makeRoot();
});

afterEach(async () => {
  await removeRoot(root);
});

function readyState(
  completedFiles: string[] = [],
  completedDirs: string[] = [],
): TaskState {
  return {
    status: "READY",
    attempts: { retries: 0, corrections: 0, verifications: 0 },
    completed: { files: completedFiles, directories: completedDirs },
  };
}

describe("deriveAvailableActions (§4.3)", () => {
  it("offers every pending file and directory ref in input order", () => {
    const options = baseOptions(root);
    options.refs = {
      files: [join(root, "a.txt"), join(root, "b.txt")],
      directories: [join(root, "dir")],
    };
    const actions = deriveAvailableActions(readyState(), options);
    expect(actions).toHaveLength(3);
    expect(actions[0]?.ref).toMatchObject({
      operation: "readFile",
      target: join(root, "a.txt"),
    });
    expect(actions[1]?.ref).toMatchObject({
      operation: "readFile",
      target: join(root, "b.txt"),
    });
    expect(actions[2]?.ref).toMatchObject({
      operation: "listDirectory",
      target: join(root, "dir"),
    });
  });

  it("excludes refs already completed for the run (§4.3.2)", () => {
    const options = baseOptions(root);
    options.refs = {
      files: [join(root, "a.txt"), join(root, "b.txt")],
      directories: [join(root, "dir")],
    };
    const actions = deriveAvailableActions(
      readyState([join(root, "a.txt")], [join(root, "dir")]),
      options,
    );
    expect(actions).toHaveLength(1);
    expect(actions[0]?.ref.target).toBe(join(root, "b.txt"));
  });

  it("excludes targets that fail containment/authorization (§4.3.3)", () => {
    const options = baseOptions(root);
    const outside = join(root, "..", "escaped.txt");
    options.refs = {
      files: [join(root, "ok.txt"), outside],
      directories: [],
    };
    const actions = deriveAvailableActions(readyState(), options);
    expect(actions).toHaveLength(1);
    expect(actions[0]?.ref.target).toBe(join(root, "ok.txt"));
  });

  it("does not offer an action whose invocation would exceed resource bounds (§4.3.4)", () => {
    const options = baseOptions(root);
    options.bounds = { ...options.bounds, maxBytesPerRead: 0, chunkSize: 0 };
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const actions = deriveAvailableActions(readyState(), options);
    expect(actions).toHaveLength(0);
  });

  it("is pure: identical inputs produce identical output without touching the filesystem", () => {
    const options = baseOptions(root);
    options.refs = {
      files: [join(root, "a.txt"), join(root, "b.txt")],
      directories: [join(root, "dir")],
    };
    const first = deriveAvailableActions(readyState(), options);
    const second = deriveAvailableActions(readyState(), options);
    expect(second).toEqual(first);
  });

  it("propagates includeHidden default into list actions", () => {
    const options = baseOptions(root);
    options.includeHidden = true;
    options.refs = { files: [], directories: [join(root, "dir")] };
    const actions = deriveAvailableActions(readyState(), options);
    expect(actions[0]?.ref).toMatchObject({
      operation: "listDirectory",
      list: { includeHidden: true },
    });
  });

  it("carries explicit read bounds derived from options.bounds", () => {
    const options = baseOptions(root);
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const actions = deriveAvailableActions(readyState(), options);
    expect(actions[0]?.ref).toMatchObject({
      operation: "readFile",
      read: {
        maxBytes: options.bounds.maxBytesPerRead,
        chunkSize: options.bounds.chunkSize,
      },
    });
  });
});
