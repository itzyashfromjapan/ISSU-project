import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFile, editFile, deleteFile } from "../src/internal/write.js";
import { mkdtemp, rm, writeFile as fsWrite, readFile } from "node:fs/promises";
import { join } from "node:path";

describe("writeFile (Spec §8)", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(process.cwd(), "tmp-p7-write-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });
  it("fails when not contained", async () => {
    const res = await writeFile("../outside.txt", "x", { allowWrite: true });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("issue.write.not-contained");
  });
  it("fails when allowWrite false", async () => {
    const target = join(dir, "a.txt");
    const res = await writeFile(target, "hello", { allowWrite: false });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("issue.write.permission-denied");
  });
  it("fails when too large", async () => {
    const target = join(dir, "b.txt");
    const res2 = await writeFile(target, "xx", {
      allowWrite: true,
      maxBytesPerWrite: 1,
    });
    expect(res2.ok).toBe(false);
    if (!res2.ok) expect(res2.error.code).toBe("issue.write.too-large");
  });
  it("writes successfully when contained and allowed", async () => {
    const target = join(dir, "c.txt");
    const res = await writeFile(target, "hello", { allowWrite: true });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.bytesWritten).toBe(5);
    const content = await readFile(target, "utf8");
    expect(content).toBe("hello");
  });
  it("fails when maxBytesPerWrite over cap", async () => {
    const target = join(dir, "d.txt");
    const res = await writeFile(target, "x", {
      allowWrite: true,
      maxBytesPerWrite: 10 * 1024 * 1024,
    });
    expect(res.ok).toBe(false);
  });
});

describe("editFile (Spec §9)", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(process.cwd(), "tmp-p7-edit-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });
  it("fails when oldString not found", async () => {
    const target = join(dir, "a.txt");
    await fsWrite(target, "hello world", "utf8");
    const res = await editFile(target, "notfound", "new", { allowWrite: true });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("issue.edit.not-found");
  });
  it("fails when multiple matches", async () => {
    const target = join(dir, "b.txt");
    await fsWrite(target, "a a a", "utf8");
    const res = await editFile(target, "a", "b", { allowWrite: true });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("issue.edit.multiple-matches");
  });
  it("fails when noop", async () => {
    const target = join(dir, "c.txt");
    await fsWrite(target, "hello", "utf8");
    const res = await editFile(target, "hello", "hello", { allowWrite: true });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("issue.edit.noop");
  });
  it("edits successfully with exact match", async () => {
    const target = join(dir, "d.txt");
    await fsWrite(target, "hello world", "utf8");
    const res = await editFile(target, "world", "there", { allowWrite: true });
    expect(res.ok).toBe(true);
    const content = await readFile(target, "utf8");
    expect(content).toBe("hello there");
  });
  it("fails when not contained", async () => {
    const res = await editFile("../outside.txt", "a", "b", {
      allowWrite: true,
    });
    expect(res.ok).toBe(false);
  });
});

describe("deleteFile (Spec §10)", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(process.cwd(), "tmp-p7-del-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });
  it("fails when not contained", async () => {
    const res = await deleteFile("../outside.txt", { allowWrite: true });
    expect(res.ok).toBe(false);
  });
  it("fails when not found", async () => {
    const target = join(dir, "missing.txt");
    const res = await deleteFile(target, { allowWrite: true });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("issue.delete.not-found");
  });
  it("deletes successfully", async () => {
    const target = join(dir, "a.txt");
    await fsWrite(target, "x", "utf8");
    const res = await deleteFile(target, { allowWrite: true });
    expect(res.ok).toBe(true);
  });
});
