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
import type {
  ActionRef,
  DecisionProvider,
  OutcomeClass,
} from "@issue/tool-runtime";

export async function makeRoot(prefix = "p3-"): Promise<string> {
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

export interface RecordedCall {
  readonly kind: "select" | "assess";
  readonly status: string;
}

export function recordingProvider(base: DecisionProvider): {
  readonly provider: DecisionProvider;
  readonly calls: RecordedCall[];
} {
  const calls: RecordedCall[] = [];
  return {
    provider: {
      async selectAction(available, state) {
        calls.push({ kind: "select", status: state.status });
        return base.selectAction(available, state);
      },
      async assess(result, state) {
        calls.push({ kind: "assess", status: state.status });
        return base.assess(result, state);
      },
    },
    calls,
  };
}

export interface ScriptedStep {
  readonly select?: ActionRef;
  readonly assess?: OutcomeClass;
}

export function scriptedProvider(steps: readonly ScriptedStep[]): {
  readonly provider: DecisionProvider;
  readonly calls: { readonly selects: number; readonly assesses: number };
} {
  const calls = { selects: 0, assesses: 0 };
  const provider: DecisionProvider = {
    async selectAction(available) {
      const step = steps[calls.selects] ?? steps[steps.length - 1];
      calls.selects += 1;
      if (step !== undefined && step.select !== undefined) {
        const sel = step.select;
        const match = available.find(
          (item) =>
            item.ref.operation === sel.operation &&
            item.ref.target === sel.target,
        );
        if (match !== undefined) return match.ref;
      }
      const first = available[0];
      if (first === undefined) {
        throw new Error(
          "scripted provider: selectAction requires a non-empty available set",
        );
      }
      return first.ref;
    },
    async assess(result) {
      const step = steps[calls.assesses] ?? steps[steps.length - 1];
      calls.assesses += 1;
      if (step !== undefined && step.assess !== undefined) {
        return { classification: step.assess };
      }
      return { classification: result.classification };
    },
  };
  return { provider, calls };
}

export function abortingProvider(
  controller: AbortController,
  base: DecisionProvider,
  abortAtSelectCall: number,
): DecisionProvider {
  let selects = 0;
  return {
    async selectAction(available, state) {
      selects += 1;
      if (selects === abortAtSelectCall) controller.abort();
      return base.selectAction(available, state);
    },
    async assess(result, state) {
      return base.assess(result, state);
    },
  };
}

export async function captureStdout(
  fn: () => Promise<void>,
): Promise<string[]> {
  const chunks: string[] = [];
  const original = process.stdout.write;
  const spy = (chunk: unknown, ...rest: unknown[]): boolean => {
    chunks.push(String(chunk));
    return (original as unknown as (...args: unknown[]) => boolean).call(
      process.stdout,
      chunk,
      ...rest,
    );
  };
  process.stdout.write = spy as typeof process.stdout.write;
  try {
    await fn();
    await new Promise((resolve) => setImmediate(resolve));
  } finally {
    process.stdout.write = original;
  }
  return chunks;
}
