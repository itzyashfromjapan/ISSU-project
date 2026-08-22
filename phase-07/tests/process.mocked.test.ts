import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({ spawn: vi.fn() }));

import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import type { Mock } from "vitest";
import { execProcess } from "../src/internal/process.js";

const spawnMock = spawn as unknown as Mock;

interface FakeProc extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
  kill: ReturnType<typeof vi.fn>;
}

function makeProc(): FakeProc {
  const proc = new EventEmitter() as FakeProc;
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.kill = vi.fn();
  return proc;
}

function flush(ms = 10): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

afterEach(() => {
  spawnMock.mockReset();
});

describe("execProcess — mocked child_process branches", () => {
  it("resolves issue.process.not-contained when the child errors", async () => {
    const proc = makeProc();
    spawnMock.mockReturnValue(proc);
    const pending = execProcess("node", ["--version"], { allowExec: true });
    await flush();
    proc.emit("error", new Error("ENOEXEC"));
    const r = await pending;
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("issue.process.not-contained");
  });

  it("collects, caps, and truncates streams via close event", async () => {
    const proc = makeProc();
    spawnMock.mockReturnValue(proc);
    const pending = execProcess("node", ["-e", "x"], {
      allowExec: true,
      maxBytes: 10,
    });
    await flush();
    proc.stdout.emit("data", Buffer.from("a".repeat(40)));
    proc.stdout.emit("data", Buffer.from("a".repeat(40)));
    proc.stderr.emit("data", Buffer.from("b".repeat(40)));
    proc.emit("close", 0);
    const r = await pending;
    expect(r.ok && r.value.exitCode).toBe(0);
    expect(r.ok && r.value.stdout.length <= 10).toBe(true);
    expect(r.ok && r.value.stderr.length <= 10).toBe(true);
  });

  it("treats null exit code as 0 on close", async () => {
    const proc = makeProc();
    spawnMock.mockReturnValue(proc);
    const pending = execProcess("node", ["-e", "x"], { allowExec: true });
    await flush();
    proc.emit("close", null);
    const r = await pending;
    expect(r.ok && r.value.exitCode).toBe(0);
  });

  it("reports timedOut and kills the child on timeout", async () => {
    const proc = makeProc();
    spawnMock.mockReturnValue(proc);
    const pending = execProcess("node", ["-e", "loop"], {
      allowExec: true,
      timeoutMs: 25,
    });
    await flush(60);
    proc.emit("close", null);
    const r = await pending;
    expect(r.ok && r.value.timedOut).toBe(true);
    expect(proc.kill).toHaveBeenCalled();
  });
});
