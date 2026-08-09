import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "../../src/errors/app-error.js";
import { assertContained, isContained } from "../../src/paths/contain.js";

async function createDirLink(from: string, to: string): Promise<void> {
  await symlink(to, from, process.platform === "win32" ? "junction" : "dir");
}

describe("isContained", () => {
  let sandbox: string;
  let root: string;
  let outside: string;

  beforeEach(async () => {
    sandbox = await mkdtemp(join(tmpdir(), "issue-paths-"));
    root = join(sandbox, "root");
    outside = join(sandbox, "outside");
    await mkdir(join(root, "allowed"), { recursive: true });
    await writeFile(join(root, "allowed", "x.txt"), "x", "utf8");
    await mkdir(outside, { recursive: true });
    await writeFile(join(outside, "y.txt"), "y", "utf8");
    await createDirLink(join(root, "link-in"), join(root, "allowed"));
    await createDirLink(join(root, "link-out"), outside);
  });

  afterEach(async () => {
    await rm(sandbox, { recursive: true, force: true });
  });

  it("contains direct descendants", () => {
    expect(isContained(root, join(root, "allowed", "x.txt"))).toBe(true);
    expect(isContained(root, join(root, "allowed"))).toBe(true);
  });

  it("contains the root itself", () => {
    expect(isContained(root, root)).toBe(true);
  });

  it("contains not-yet-existing descendants", () => {
    expect(isContained(root, join(root, "new", "sub", "file"))).toBe(true);
  });

  it("contains paths that traverse inside but stay in root", () => {
    expect(
      isContained(root, join(root, "allowed", "..", "allowed", "x.txt")),
    ).toBe(true);
  });

  it("rejects sibling roots and their contents", () => {
    expect(isContained(root, outside)).toBe(false);
    expect(isContained(root, join(outside, "y.txt"))).toBe(false);
  });

  it("rejects parent traversal", () => {
    expect(isContained(root, join(root, "..", "escape"))).toBe(false);
    expect(isContained(root, join(root, "..", "..", "escape"))).toBe(false);
  });

  it("rejects absolute escapes outside the root", () => {
    expect(isContained(root, tmpdir())).toBe(false);
  });

  it("rejects paths escaping through a symlink", () => {
    expect(isContained(root, join(root, "link-out", "y.txt"))).toBe(false);
  });

  it("rejects symlinked paths that would escape once created", () => {
    expect(isContained(root, join(root, "link-out", "zzz-missing.txt"))).toBe(
      false,
    );
  });

  it("allows symlinks that resolve inside the root", () => {
    expect(isContained(root, join(root, "link-in", "x.txt"))).toBe(true);
  });

  it("handles paths under a file component without throwing", () => {
    expect(isContained(root, join(root, "allowed", "x.txt", "child"))).toBe(
      true,
    );
  });
});

describe("assertContained", () => {
  let sandbox: string;
  let root: string;
  let outside: string;

  beforeEach(async () => {
    sandbox = await mkdtemp(join(tmpdir(), "issue-paths-"));
    root = join(sandbox, "root");
    outside = join(sandbox, "outside");
    await mkdir(join(root, "allowed"), { recursive: true });
    await writeFile(join(root, "allowed", "x.txt"), "x", "utf8");
    await mkdir(outside, { recursive: true });
    await writeFile(join(outside, "y.txt"), "y", "utf8");
    await createDirLink(join(root, "link-in"), join(root, "allowed"));
    await createDirLink(join(root, "link-out"), outside);
  });

  afterEach(async () => {
    await rm(sandbox, { recursive: true, force: true });
  });

  it("returns the normalized path for a contained target", () => {
    expect(assertContained(root, join(root, "allowed", "x.txt"))).toBe(
      join(root, "allowed", "x.txt"),
    );
    expect(assertContained(root, root)).toBe(root);
  });

  it("throws issue.path.escape for parent traversal", () => {
    expect(() => assertContained(root, join(root, "..", "escape"))).toThrow(
      AppError,
    );
    expect(() =>
      assertContained(root, join(root, "..", "..", "escape")),
    ).toThrow(AppError);
  });

  it("throws issue.path.escape for symlink escapes", () => {
    expect(() =>
      assertContained(root, join(root, "link-out", "y.txt")),
    ).toThrow(AppError);
  });

  it("throws a structured, non-recoverable escape error with context", () => {
    const target = join(root, "..", "escape");
    let caught: unknown;
    try {
      assertContained(root, target);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(AppError);
    if (caught instanceof AppError) {
      expect(caught.code).toBe("issue.path.escape");
      expect(caught.recoverable).toBe(false);
      expect(caught.message).toContain(target);
      expect(caught.details).toEqual({ root, target });
    }
  });
});
