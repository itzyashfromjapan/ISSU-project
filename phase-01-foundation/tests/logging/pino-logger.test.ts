import { describe, expect, it } from "vitest";
import type { DestinationStream } from "pino";
import {
  createLoggerFromConfig,
  createPinoLogger,
} from "../../src/logging/pino-logger.js";
import { REDACTED } from "../../src/logging/redaction.js";

interface Capture {
  stream: DestinationStream;
  lines: () => string[];
}

function capture(): Capture {
  const lines: string[] = [];
  return {
    stream: {
      write: (msg: string) => {
        lines.push(msg);
      },
    },
    lines: () => lines,
  };
}

function records(lines: string[]): Record<string, unknown>[] {
  return lines.map(
    (line) => JSON.parse(line.trim()) as Record<string, unknown>,
  );
}

function single(lines: string[]): Record<string, unknown> {
  const record = records(lines)[0];
  if (record === undefined) throw new Error("expected exactly one log line");
  return record;
}

function nth(lines: string[], index: number): Record<string, unknown> {
  const record = records(lines)[index];
  if (record === undefined)
    throw new Error(`expected log line at index ${index}`);
  return record;
}

function ctxOf(record: Record<string, unknown>): Record<string, unknown> {
  const ctx = record.ctx;
  return ctx !== null && typeof ctx === "object" && !Array.isArray(ctx)
    ? (ctx as Record<string, unknown>)
    : {};
}

describe("level thresholds", () => {
  it("defaults to info and drops trace/debug records", () => {
    const c = capture();
    const logger = createPinoLogger({ stream: c.stream });
    logger.trace("t");
    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    expect(records(c.lines()).map((r) => r.level)).toEqual(["info", "warn"]);
  });

  it("honors an explicit threshold", () => {
    const c = capture();
    const logger = createPinoLogger({ stream: c.stream, level: "error" });
    logger.info("i");
    logger.error("e");
    logger.fatal("f");
    expect(records(c.lines()).map((r) => r.level)).toEqual(["error", "fatal"]);
  });
});

describe("JSON-lines shape", () => {
  it("writes one JSON line per record with level/time/msg/ctx and no pid or hostname", () => {
    const c = capture();
    const logger = createPinoLogger({ stream: c.stream });
    logger.info("hello world", { a: 1 });
    expect(c.lines()).toHaveLength(1);
    const record = single(c.lines());
    expect(record.level).toBe("info");
    expect(typeof record.time).toBe("number");
    expect(record.msg).toBe("hello world");
    expect(record.ctx).toEqual({ a: 1 });
    expect(record).not.toHaveProperty("pid");
    expect(record).not.toHaveProperty("hostname");
  });

  it("omits ctx when not provided", () => {
    const c = capture();
    const logger = createPinoLogger({ stream: c.stream });
    logger.info("bare");
    const record = single(c.lines());
    expect(record.msg).toBe("bare");
    expect(record).not.toHaveProperty("ctx");
  });
});

describe("TTY pretty", () => {
  it("renders a human-readable line when logPretty is enabled", () => {
    const c = capture();
    const logger = createPinoLogger({ stream: c.stream, logPretty: true });
    logger.warn("watch out", { a: 1 });
    const line = c.lines()[0]?.trim() ?? "";
    expect(line.startsWith("{")).toBe(false);
    expect(line).toContain("WARN");
    expect(line).toContain("watch out");
    expect(line).toContain('"a":1');
  });
});

describe("child()", () => {
  it("adds bindings to every emitted record from the child", () => {
    const c = capture();
    const logger = createPinoLogger({ stream: c.stream });
    const child = logger.child({ svc: "cli" });
    child.info("boot");
    logger.info("root");
    expect(c.lines()).toHaveLength(2);
    const a = nth(c.lines(), 0);
    const b = nth(c.lines(), 1);
    expect(a.svc).toBe("cli");
    expect(b.svc).toBeUndefined();
  });

  it("keeps the parent threshold for children", () => {
    const c = capture();
    const logger = createPinoLogger({ stream: c.stream, level: "error" });
    logger.child({ svc: "cli" }).info("silent");
    expect(c.lines()).toHaveLength(0);
  });
});

describe("redaction", () => {
  it("redacts secret values in JSON mode (no secret substring anywhere)", () => {
    const secret = "opencage-secret-token-xyz";
    const c = capture();
    const logger = createPinoLogger({
      stream: c.stream,
      redact: [secret, "password"],
    });
    logger.info(`connecting with ${secret}`, {
      password: secret,
      requestId: "req-1",
    });
    const text = c.lines().join("");
    expect(text).not.toContain(secret);
    expect(text).toContain(REDACTED);
    const record = single(c.lines());
    expect(ctxOf(record).password).toBe(REDACTED);
    expect(record.msg).toBe(`connecting with ${REDACTED}`);
    expect(ctxOf(record).requestId).toBe("req-1");
  });

  it("redacts a value at a matching key", () => {
    const c = capture();
    const logger = createPinoLogger({
      stream: c.stream,
      redact: ["requestId"],
    });
    logger.info("req", { requestId: "abc-123" });
    const record = single(c.lines());
    expect(ctxOf(record).requestId).toBe(REDACTED);
  });

  it("redacts in pretty mode too", () => {
    const secret = "hunter2-supersecret";
    const c = capture();
    const logger = createPinoLogger({
      stream: c.stream,
      logPretty: true,
      redact: [secret],
    });
    logger.info(`logging in with ${secret}`);
    const text = c.lines().join("");
    expect(text).not.toContain(secret);
    expect(text).toContain(REDACTED);
  });

  it("passes records through untouched when the redact list is empty", () => {
    const c = capture();
    const logger = createPinoLogger({ stream: c.stream });
    logger.info("clean");
    const line = c.lines()[0]?.trim() ?? "";
    expect(JSON.parse(line)).toEqual({
      level: "info",
      time: expect.any(Number),
      msg: "clean",
    });
    expect(line).not.toContain(REDACTED);
  });
});

describe("createLoggerFromConfig", () => {
  it("wires config redact, env secret values, and logLevel together", () => {
    const secret = "env-secret-abc";
    const c = capture();
    const logger = createLoggerFromConfig(
      { logLevel: "error", logPretty: false, redact: ["requestId"] },
      { API_KEY: secret },
      c.stream,
    );
    logger.info("skip me");
    logger.error("boom", { requestId: "r", token: secret });
    expect(c.lines()).toHaveLength(1);
    const record = single(c.lines());
    expect(record.level).toBe("error");
    expect(ctxOf(record).requestId).toBe(REDACTED);
    expect(ctxOf(record).token).toBe(REDACTED);
  });
});
