import { describe, expect, it } from "vitest";
import { DEFAULT_BOUNDS } from "@issue/integration";
import {
  deriveRoot,
  expandRefs,
  retrieveSources,
} from "../src/internal/retrieval.js";
import { makeRoot, mkdirFixture, removeRoot, writeFixture } from "./helpers.js";
import { join } from "node:path";

describe("Phase 4 deriveRoot/expandRefs (retrieval internals)", () => {
  it("empty refs produce an empty anchor root", () => {
    const root = deriveRoot({ files: [], directories: [] });
    expect(root.length).toBeGreaterThan(0);
  });

  it("deriveRoot computes the common ancestor across files and directories", async () => {
    const base = await makeRoot();
    try {
      await mkdirFixture(base, "a\\sub");
      await mkdirFixture(base, "b");
      const root = deriveRoot({
        files: [join(base, "a\\sub\\one.txt")],
        directories: [join(base, "b")],
      });
      expect(root).toBe(base);
    } finally {
      await removeRoot(base);
    }
  });

  it("expandRefs produces file and directory targets in order", () => {
    const targets = expandRefs({
      files: ["/x/f.txt"],
      directories: ["/y"],
    });
    expect(targets).toEqual([
      { path: "/x/f.txt", kind: "file" },
      { path: "/y", kind: "directory" },
    ]);
  });
});

describe("Phase 4 retrieveSources edge paths", () => {
  it("returns cancelled when the signal is pre-aborted", async () => {
    const root = await makeRoot();
    try {
      const controller = new AbortController();
      controller.abort();
      const outcome = await retrieveSources(
        root,
        { files: [join(root, "x.txt")], directories: [] },
        DEFAULT_BOUNDS,
        false,
        controller.signal,
        undefined,
      );
      expect(outcome.ok).toBe(true);
      if (outcome.ok) {
        expect(outcome.value.cancelled).toBe(true);
      }
    } finally {
      await removeRoot(root);
    }
  });

  it("rejects refs outside the authorized root as a retrieval failure", async () => {
    const root = await makeRoot();
    try {
      const outside = join(root, "..", "outside.txt");
      const outcome = await retrieveSources(
        root,
        { files: [outside], directories: [] },
        DEFAULT_BOUNDS,
        false,
        undefined,
        undefined,
      );
      expect(outcome.ok).toBe(true);
      if (outcome.ok) {
        expect(outcome.value.failures.length).toBeGreaterThan(0);
      }
    } finally {
      await removeRoot(root);
    }
  });

  it("collects directory listing failures as retrieval failures", async () => {
    const root = await makeRoot();
    try {
      await mkdirFixture(root, "docs");
      await writeFixture(root, "docs\\ok.txt", "Fine content here.");
      const outcome = await retrieveSources(
        root,
        { files: [], directories: [join(root, "docs\\missing")] },
        DEFAULT_BOUNDS,
        false,
        undefined,
        undefined,
      );
      expect(outcome.ok).toBe(true);
      if (outcome.ok) {
        expect(outcome.value.failures.length).toBeGreaterThan(0);
      }
    } finally {
      await removeRoot(root);
    }
  });
});
