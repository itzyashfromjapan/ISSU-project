import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runTask } from "../src/index.js";
import {
  baseOptions,
  makeRoot,
  removeRoot,
  trustingProvider,
} from "./helpers.js";

let root: string;

beforeEach(async () => {
  root = await makeRoot();
});

afterEach(async () => {
  await removeRoot(root);
  delete process.env.P5_SECRET_TOKEN;
});

interface LogRecord {
  msg?: string;
  ctx?: Record<string, unknown>;
}

async function captureStdout<T>(
  fn: () => Promise<T>,
): Promise<{ value: T; records: LogRecord[] }> {
  const chunks: string[] = [];
  const spy = vi.spyOn(process.stdout, "write");
  spy.mockImplementation((chunk: string | Uint8Array) => {
    if (typeof chunk === "string") chunks.push(chunk);
    else chunks.push(Buffer.from(chunk).toString("utf8"));
    return true;
  });
  try {
    const value = await fn();
    const records: LogRecord[] = [];
    for (const line of chunks.join("").split("\n")) {
      if (line.trim() === "") continue;
      records.push(JSON.parse(line) as LogRecord);
    }
    return { value, records };
  } finally {
    spy.mockRestore();
  }
}

const STATES = [
  "READY",
  "SELECTING",
  "EXECUTING",
  "EVALUATING",
  "CORRECTING",
  "VERIFYING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

describe("observability (§15.1)", () => {
  it("emits structured state-machine events with the normative fields", async () => {
    await writeFile(join(root, "a.txt"), "hello", "utf8");
    const options = baseOptions(root);
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const { value, records } = await captureStdout(() =>
      runTask(options, trustingProvider),
    );
    expect(value.state.status).toBe("COMPLETED");

    const transitions = records.filter((r) => r.msg === "state.transition");
    expect(transitions.length).toBeGreaterThanOrEqual(4);
    const runIds = new Set(
      records.map((r) => r.ctx?.runId as string | undefined),
    );
    expect(runIds.size).toBe(1);
    const runId = [...runIds][0] as string;
    expect(runId.length).toBeGreaterThan(0);

    const begin = transitions.find(
      (t) => t.ctx?.reason === "run-begin",
    ) as LogRecord;
    expect(begin.ctx).toMatchObject({
      from: "READY",
      to: "SELECTING",
      reason: "run-begin",
      runId,
    });

    const done = transitions.find(
      (t) => t.ctx?.to === "COMPLETED",
    ) as LogRecord;
    expect(done.ctx).toMatchObject({ from: "VERIFYING", to: "COMPLETED" });

    const selection = records.filter((r) => r.msg === "action.selection");
    expect(selection[0]?.ctx).toMatchObject({
      action: { operation: "readFile", target: join(root, "a.txt") },
    });

    const execution = records.filter((r) => r.msg === "tool.execution");
    expect(execution[0]?.ctx).toMatchObject({
      action: { operation: "readFile", target: join(root, "a.txt") },
      ok: true,
      classification: "success",
      bytesRead: 5,
    });
    expect(execution[0]?.ctx?.durationMs).toBeGreaterThanOrEqual(0);

    const assessment = records.filter((r) => r.msg === "assessment");
    expect(assessment[0]?.ctx).toMatchObject({ classification: "success" });

    const completion = records.filter((r) => r.msg === "run.completion");
    expect(completion[0]?.ctx).toMatchObject({ status: "COMPLETED" });
    expect(completion[0]?.ctx?.attempts).toEqual({
      retries: 0,
      corrections: 0,
      verifications: 1,
    });

    for (const t of transitions) {
      expect(STATES).toContain(t.ctx?.from);
      expect(STATES).toContain(t.ctx?.to);
    }
  });

  it("emits correction and bound-exhaustion records for a retried failure", async () => {
    const options = baseOptions(root);
    options.bounds = {
      maxRetries: 1,
      maxCorrections: 5,
      maxVerifications: 5,
      maxBytesPerRead: 1024,
      chunkSize: 64,
    };
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const provider = {
      ...trustingProvider,
      assess: async (): Promise<{ classification: "executionError" }> => ({
        classification: "executionError",
      }),
    };
    const { value, records } = await captureStdout(() =>
      runTask(options, provider),
    );
    expect(value.state.status).toBe("FAILED");

    const corrections = records.filter((r) => r.msg === "correction.decision");
    expect(corrections.map((c) => c.ctx?.direction)).toEqual([
      "RETRY",
      "EXHAUST",
    ]);

    const bounds = records.filter((r) => r.msg === "bound.exhaustion");
    expect(bounds.some((b) => b.ctx?.kind === "retry")).toBe(true);
  });
});

describe("redaction (§15.2, V18)", () => {
  it("never logs file content from a successful read", async () => {
    const marker = "P5-CONTENT-MARKER-7f3k";
    await writeFile(join(root, "a.txt"), marker, "utf8");
    const options = baseOptions(root);
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const { records } = await captureStdout(() =>
      runTask(options, trustingProvider),
    );
    expect(JSON.stringify(records)).not.toContain(marker);
  });

  it("never logs content or content-bearing text for failed reads", async () => {
    const marker = "P5-FAILED-CONTENT-9z12";
    await writeFile(join(root, "bad.txt"), marker, "utf8");
    const options = baseOptions(root);
    options.bounds = {
      maxRetries: 1,
      maxCorrections: 1,
      maxVerifications: 1,
      maxBytesPerRead: 4,
      chunkSize: 4,
    };
    options.refs = { files: [join(root, "bad.txt")], directories: [] };
    const { value, records } = await captureStdout(() =>
      runTask(options, trustingProvider),
    );
    expect(value.state.status).toBe("FAILED");
    expect(JSON.stringify(records)).not.toContain(marker);
  });

  it("redacts secret-named environment values registered via the public barrel", async () => {
    process.env.P5_SECRET_TOKEN = "P5-SECRET-VALUE-x9k2";
    await writeFile(join(root, "a.txt"), "hello", "utf8");
    const options = baseOptions(root);
    options.refs = { files: [join(root, "a.txt")], directories: [] };
    const { records } = await captureStdout(() =>
      runTask(options, trustingProvider),
    );
    expect(JSON.stringify(records)).not.toContain("P5-SECRET-VALUE-x9k2");
  });

  it("redacts a secret value even when it appears in a logged target path", async () => {
    process.env.P5_SECRET_TOKEN = "P5-PATH-SECRET-4m1p";
    await writeFile(join(root, "a.txt"), "hi", "utf8");
    const options = baseOptions(root);
    options.refs = {
      files: [join(root, "P5-PATH-SECRET-4m1p", "a.txt")],
      directories: [],
    };
    const { records } = await captureStdout(() =>
      runTask(options, trustingProvider),
    );
    const execution = records.filter((r) => r.msg === "tool.execution");
    expect(execution.length).toBeGreaterThan(0);
    const target = execution[0]?.ctx?.action as { target?: string } | undefined;
    expect(target?.target).toContain("[REDACTED]");
    expect(JSON.stringify(records)).not.toContain("P5-PATH-SECRET-4m1p");
  });
});
