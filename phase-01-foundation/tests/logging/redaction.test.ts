import { describe, expect, it } from "vitest";
import {
  REDACTED,
  redactRecord,
  redactValues,
} from "../../src/logging/redaction.js";

describe("redactValues", () => {
  it("replaces each listed value substring with [REDACTED]", () => {
    expect(redactValues("token=abc123 end", ["abc123"])).toBe(
      `token=${REDACTED} end`,
    );
  });

  it("replaces longer values before shorter overlapping ones", () => {
    expect(redactValues("xxabcdefyy", ["abc", "abcdef"])).toBe(
      `xx${REDACTED}yy`,
    );
  });

  it("leaves text unchanged when nothing matches", () => {
    expect(redactValues("hello world", ["secret"])).toBe("hello world");
  });

  it("ignores empty entries", () => {
    expect(redactValues("abc", ["", "abc"])).toBe(REDACTED);
  });
});

describe("redactRecord", () => {
  const secret = "s3cr3t-value";

  it("redacts a value at a matching key", () => {
    expect(redactRecord({ requestId: secret }, ["requestId"])).toEqual({
      requestId: REDACTED,
    });
  });

  it("redacts secret substrings inside string values", () => {
    expect(
      redactRecord({ msg: `connecting with ${secret}` }, [secret]),
    ).toEqual({ msg: `connecting with ${REDACTED}` });
  });

  it("recurses into nested objects and arrays", () => {
    const record = {
      ctx: { nested: [{ token: secret }] },
      list: [secret, "plain"],
    };
    expect(redactRecord(record, [secret])).toEqual({
      ctx: { nested: [{ token: REDACTED }] },
      list: [REDACTED, "plain"],
    });
  });

  it("does not mangle non-matching keys or values", () => {
    const result = redactRecord(
      { requestId: secret, ok: true, msg: "all good" },
      ["requestId"],
    ) as Record<string, unknown>;
    expect(result.requestId).toBe(REDACTED);
    expect(result.ok).toBe(true);
    expect(result.msg).toBe("all good");
  });

  it("leaves primitives and null intact", () => {
    expect(redactRecord(null, [secret])).toBe(null);
    expect(redactRecord(42, [secret])).toBe(42);
    expect(redactRecord(true, [secret])).toBe(true);
  });
});
