import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
  DecisionProvider,
  OutcomeClass,
  ResourceBounds,
  TaskOptions,
} from "../src/index.js";

export async function makeRoot(): Promise<string> {
  return mkdtemp(join(tmpdir(), "p2-"));
}

export async function removeRoot(root: string): Promise<void> {
  await rm(root, { recursive: true, force: true });
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export const DEFAULT_BOUNDS: ResourceBounds = {
  maxRetries: 2,
  maxCorrections: 5,
  maxVerifications: 10,
  maxBytesPerRead: 1024 * 1024,
  chunkSize: 4096,
};

export function baseOptions(root: string): Mutable<TaskOptions> {
  return {
    root,
    refs: { files: [], directories: [] },
    bounds: DEFAULT_BOUNDS,
  };
}

export const trustingProvider: DecisionProvider = {
  async selectAction(available) {
    const first = available[0];
    if (first === undefined) throw new Error("no available action");
    return first.ref;
  },
  async assess(result) {
    return { classification: result.classification };
  },
};

export function assessingProvider(
  classification: OutcomeClass,
): DecisionProvider {
  return {
    async selectAction(available) {
      const first = available[0];
      if (first === undefined) throw new Error("no available action");
      return first.ref;
    },
    async assess() {
      return { classification };
    },
  };
}

export interface RecordedCall {
  kind: "select" | "assess";
  status: string;
}

export function recordingProvider(base: DecisionProvider): {
  provider: DecisionProvider;
  calls: RecordedCall[];
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
