import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ResearchDecisionProvider } from "../src/index.js";

export async function makeRoot(prefix = "p4-"): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

export async function removeRoot(root: string): Promise<void> {
  await rm(root, { recursive: true, force: true });
}

export async function writeFixture(
  root: string,
  rel: string,
  content: string | Buffer,
): Promise<void> {
  await writeFile(join(root, rel), content);
}

export async function mkdirFixture(root: string, rel: string): Promise<void> {
  await mkdir(join(root, rel), { recursive: true });
}

export async function readFixture(root: string, rel: string): Promise<string> {
  return readFile(join(root, rel), "utf8");
}

export interface TreeEntry {
  readonly path: string;
  readonly content: Buffer;
}

export interface TreeSnapshot {
  readonly entries: readonly TreeEntry[];
}

export async function snapshotTree(root: string): Promise<TreeSnapshot> {
  const entries: Array<{ path: string; content: Buffer }> = [];
  await collectEntries(root, "", entries);
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { entries };
}

async function collectEntries(
  dir: string,
  relDir: string,
  entries: Array<{ path: string; content: Buffer }>,
): Promise<void> {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    if (dirent.name === "." || dirent.name === "..") continue;
    const rel = relDir === "" ? dirent.name : join(relDir, dirent.name);
    if (dirent.isDirectory()) {
      entries.push({ path: rel + "/", content: Buffer.alloc(0) });
      await collectEntries(join(dir, dirent.name), rel, entries);
    } else {
      entries.push({
        path: rel,
        content: await readFile(join(dir, dirent.name)),
      });
    }
  }
}

export interface RecordingResearchProvider {
  readonly provider: ResearchDecisionProvider;
  readonly calls: {
    readonly selectSource: number;
    readonly selectClaimToVerify: number;
    readonly assess: number;
  };
}

export function recordingResearchProvider(
  base: ResearchDecisionProvider,
): RecordingResearchProvider {
  const calls = { selectSource: 0, selectClaimToVerify: 0, assess: 0 };
  return {
    provider: {
      async selectSource(available, state) {
        calls.selectSource += 1;
        return base.selectSource(available, state);
      },
      async selectClaimToVerify(claims, state) {
        calls.selectClaimToVerify += 1;
        return base.selectClaimToVerify(claims, state);
      },
      async assess(claim, evidence, state) {
        calls.assess += 1;
        return base.assess(claim, evidence, state);
      },
    },
    calls,
  };
}

export async function treesEqual(a: string, b: string): Promise<boolean> {
  const na = await snapshotTree(a);
  const nb = await snapshotTree(b);
  if (na.entries.length !== nb.entries.length) return false;
  for (let i = 0; i < na.entries.length; i++) {
    const ea = na.entries[i];
    const eb = nb.entries[i];
    if (ea === undefined || eb === undefined) return false;
    if (ea.path !== eb.path || !ea.content.equals(eb.content)) return false;
  }
  return true;
}
