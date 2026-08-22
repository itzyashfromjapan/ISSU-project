import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createToolRuntime } from "../src/index.js";
import type {
  ActionRef,
  DirectoryListing,
  FileContent,
  ResourceBounds,
  ToolRuntime,
} from "../src/index.js";

let root: string;
let outside: string;
let tool: ToolRuntime;

const BOUNDS: ResourceBounds = {
  maxRetries: 1,
  maxCorrections: 1,
  maxVerifications: 1,
  maxBytesPerRead: 64,
  chunkSize: 16,
};

beforeAll(async () => {
  outside = await mkdtemp(join(tmpdir(), "p2-outside-"));
});

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "p2-runtime-"));
  tool = createToolRuntime({ root, bounds: BOUNDS });
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

function readRef(target: string, read?: ActionRef["read"]): ActionRef {
  return { operation: "readFile", target, read: read ?? {} };
}

function listRef(target: string, list?: ActionRef["list"]): ActionRef {
  return { operation: "listDirectory", target, list: list ?? {} };
}

describe("createToolRuntime (§9, §10)", () => {
  describe("readFile", () => {
    it("reads a valid file and reports bytesRead", async () => {
      await writeFile(join(root, "f.txt"), "hello", "utf8");
      const result = await tool.execute(readRef(join(root, "f.txt")));
      expect(result.ok).toBe(true);
      expect(result.classification).toBe("success");
      if (result.ok) {
        expect(result.data).toEqual({
          text: "hello",
          bytesRead: 5,
        });
        expect(result.bytesRead).toBe(5);
      }
    });

    it("reads content larger than one chunk without corrupting it (§10.2)", async () => {
      const content = "a".repeat(40);
      await writeFile(join(root, "big.txt"), content, "utf8");
      const result = await tool.execute(readRef(join(root, "big.txt")));
      expect(result.ok).toBe(true);
      if (result.ok) {
        const file = result.data as FileContent;
        expect(file.text).toBe(content);
        expect(file.bytesRead).toBe(40);
      }
    });

    it("honors a per-call maxBytes override smaller than the bound", async () => {
      await writeFile(join(root, "f.txt"), "abcdefghij", "utf8");
      const result = await tool.execute(
        readRef(join(root, "f.txt"), { maxBytes: 5 }),
      );
      expect(result.ok).toBe(false);
      expect(result.classification).toBe("tooLarge");
    });

    it("caps a per-call maxBytes override at the configured bound (§12)", async () => {
      await writeFile(join(root, "f.txt"), "a".repeat(40), "utf8");
      const result = await tool.execute(
        readRef(join(root, "f.txt"), { maxBytes: 10 ** 6 }),
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect((result.data as FileContent).text).toBe("a".repeat(40));
      }
    });

    it("classifies a missing file notFound with the read code", async () => {
      const result = await tool.execute(readRef(join(root, "missing.txt")));
      expect(result.ok).toBe(false);
      expect(result.classification).toBe("notFound");
      expect(result.error?.code).toBe("issue.tool.read.notfound");
    });

    it("classifies invalid UTF-8 as invalidContent and never returns text", async () => {
      await writeFile(join(root, "bad.bin"), Buffer.from([0xff, 0xfe, 0x41]));
      const result = await tool.execute(readRef(join(root, "bad.bin")));
      expect(result.ok).toBe(false);
      expect(result.classification).toBe("invalidContent");
      expect(result.error?.code).toBe("issue.tool.read.invalidcontent");
      expect(result.data).toBeUndefined();
      expect(result.error?.message).not.toContain("\uFFFD");
    });

    it("classifies a file larger than maxBytesPerRead as tooLarge (§10.2)", async () => {
      await writeFile(join(root, "big.txt"), "x".repeat(100), "utf8");
      const result = await tool.execute(readRef(join(root, "big.txt")));
      expect(result.ok).toBe(false);
      expect(result.classification).toBe("tooLarge");
      expect(result.error?.code).toBe("issue.tool.read.toolarge");
      expect(result.data).toBeUndefined();
    });

    it("denies a target outside the authorized root as accessDenied (§11)", async () => {
      await writeFile(join(outside, "secret.txt"), "secret", "utf8");
      const result = await tool.execute(readRef(join(outside, "secret.txt")));
      expect(result.ok).toBe(false);
      expect(result.classification).toBe("accessDenied");
      expect(result.error?.code).toBe("issue.tool.accessdenied");
    });

    it("does not embed file content in error messages (§13.4)", async () => {
      await writeFile(join(outside, "secret.txt"), "super-secret-body", "utf8");
      const result = await tool.execute(readRef(join(outside, "secret.txt")));
      expect(result.error?.message).not.toContain("super-secret-body");
    });
  });

  describe("listDirectory", () => {
    it("lists entries sorted, without . or .., hidden omitted by default (§10.3)", async () => {
      await mkdir(join(root, "sub"));
      await writeFile(join(root, "b.txt"), "b");
      await writeFile(join(root, "a.txt"), "a");
      await writeFile(join(root, ".hidden"), "h");
      const result = await tool.execute(listRef(root));
      expect(result.ok).toBe(true);
      if (result.ok) {
        const listing = result.data as DirectoryListing;
        expect(listing.entries.map((e) => e.name)).toEqual([
          "a.txt",
          "b.txt",
          "sub",
        ]);
        expect(listing.entries.every((e) => e.isHidden === false)).toBe(true);
        const sub = listing.entries.find((e) => e.name === "sub");
        expect(sub?.isDirectory).toBe(true);
      }
    });

    it("includes hidden entries when includeHidden is true", async () => {
      await writeFile(join(root, ".hidden"), "h");
      await writeFile(join(root, "a.txt"), "a");
      const result = await tool.execute(listRef(root, { includeHidden: true }));
      expect(result.ok).toBe(true);
      if (result.ok) {
        const listing = result.data as DirectoryListing;
        expect(listing.entries.map((e) => e.name)).toEqual([
          ".hidden",
          "a.txt",
        ]);
        expect(
          listing.entries.find((e) => e.name === ".hidden")?.isHidden,
        ).toBe(true);
      }
    });

    it("classifies a missing directory as notFound with the list code", async () => {
      const result = await tool.execute(listRef(join(root, "nope")));
      expect(result.ok).toBe(false);
      expect(result.classification).toBe("notFound");
      expect(result.error?.code).toBe("issue.tool.list.notfound");
    });

    it("is identical on repeat for the same includeHidden value (§10.3)", async () => {
      await writeFile(join(root, "a.txt"), "a", "utf8");
      await writeFile(join(root, ".hidden"), "h", "utf8");
      const first = await tool.execute(listRef(root));
      const second = await tool.execute(listRef(root));
      expect(first.ok && second.ok).toBe(true);
      if (first.ok && second.ok) {
        expect(second.data).toEqual(first.data);
      }
    });
  });

  describe("symlink containment (§11.2)", () => {
    it("refuses a symlink that resolves outside the root as accessDenied", async ({
      skip,
    }) => {
      const target = join(root, "escape");
      try {
        await mkdir(join(outside, "linked-dir"));
        await symlink(join(outside, "linked-dir"), target, "junction");
      } catch {
        skip("symlinks are not permitted on this platform");
        return;
      }
      const result = await tool.execute(listRef(target));
      expect(result.ok).toBe(false);
      expect(result.classification).toBe("accessDenied");
    });
  });

  describe("invalid ActionRef (§8)", () => {
    it("rejects an unknown operation as invalidInput", async () => {
      const result = await tool.execute({
        operation: "write",
        target: join(root, "f.txt"),
      } as unknown as ActionRef);
      expect(result.ok).toBe(false);
      expect(result.classification).toBe("invalidInput");
      expect(result.error?.code).toBe("issue.tool.invalid");
    });

    it("rejects readFile without read options", async () => {
      const result = await tool.execute({
        operation: "readFile",
        target: join(root, "f.txt"),
      } as unknown as ActionRef);
      expect(result.classification).toBe("invalidInput");
    });

    it("rejects listDirectory without list options", async () => {
      const result = await tool.execute({
        operation: "listDirectory",
        target: root,
      } as unknown as ActionRef);
      expect(result.classification).toBe("invalidInput");
    });

    it("rejects an empty target", async () => {
      const result = await tool.execute({
        operation: "readFile",
        target: "",
        read: {},
      } as unknown as ActionRef);
      expect(result.classification).toBe("invalidInput");
    });

    it("rejects a non-positive chunkSize", async () => {
      const result = await tool.execute(
        readRef(join(root, "f.txt"), { chunkSize: 0 }),
      );
      expect(result.classification).toBe("invalidInput");
    });

    it("rejects a chunkSize above the configured bound", async () => {
      const result = await tool.execute(
        readRef(join(root, "f.txt"), { chunkSize: BOUNDS.chunkSize + 1 }),
      );
      expect(result.classification).toBe("invalidInput");
    });

    it("clamps reads to a per-call maxBytes smaller than the chunk size", async () => {
      await writeFile(join(root, "f.txt"), "abcdefghij", "utf8");
      const result = await tool.execute(
        readRef(join(root, "f.txt"), { maxBytes: 4, chunkSize: 8 }),
      );
      expect(result.ok).toBe(false);
      expect(result.classification).toBe("tooLarge");
    });

    it("rejects a non-boolean includeHidden", async () => {
      const result = await tool.execute(
        listRef(root, { includeHidden: "yes" as unknown as boolean }),
      );
      expect(result.classification).toBe("invalidInput");
    });
  });
});
