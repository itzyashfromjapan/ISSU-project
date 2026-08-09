import { describe, expect, it } from "vitest";
import { parseJsonc } from "../../src/config/jsonc.js";

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
    return undefined;
  } catch (error) {
    return (error as { code?: string }).code;
  }
}

function messageOf(fn: () => unknown): string {
  try {
    fn();
    return "(no error)";
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

describe("parseJsonc — valid inputs", () => {
  it("parses plain valid JSON objects", () => {
    expect(parseJsonc('{ "logLevel": "info" }')).toEqual({ logLevel: "info" });
  });

  it("parses valid JSON primitives and arrays", () => {
    expect(parseJsonc("[1, 2, 3]")).toEqual([1, 2, 3]);
    expect(parseJsonc('"hello"')).toBe("hello");
    expect(parseJsonc("42")).toBe(42);
    expect(parseJsonc("true")).toBe(true);
    expect(parseJsonc("null")).toBeNull();
  });

  it("supports line comments", () => {
    const text = `{
      // this is a line comment
      "logLevel": "debug"
    }`;
    expect(parseJsonc(text)).toEqual({ logLevel: "debug" });
  });

  it("supports line comments after values", () => {
    const text = `{
      "logLevel": "debug", // trailing line comment
      "logPretty": true
    }`;
    expect(parseJsonc(text)).toEqual({ logLevel: "debug", logPretty: true });
  });

  it("supports block comments", () => {
    const text = `/* header comment */ {
      "logLevel": "warn" /* inline */
    }`;
    expect(parseJsonc(text)).toEqual({ logLevel: "warn" });
  });

  it("supports multi-line block comments", () => {
    const text = `{
      /* comment
         spanning lines */
      "logPretty": false
    }`;
    expect(parseJsonc(text)).toEqual({ logPretty: false });
  });

  it("supports trailing commas in objects", () => {
    expect(parseJsonc('{ "a": 1, "b": 2, }')).toEqual({ a: 1, b: 2 });
  });

  it("supports trailing commas in arrays", () => {
    expect(parseJsonc("[1, 2, 3,]")).toEqual([1, 2, 3]);
  });

  it("supports comments combined with trailing commas", () => {
    const text = `{
      "a": 1, // comment after the comma
      "b": 2,
      // another comment before the closing brace
    }`;
    expect(parseJsonc(text)).toEqual({ a: 1, b: 2 });
  });

  it("does not strip comment-like text inside strings", () => {
    const text = `{
      "url": "https://example.com/path#fragment",
      "note": "/* not a comment */ // not a comment"
    }`;
    expect(parseJsonc(text)).toEqual({
      url: "https://example.com/path#fragment",
      note: "/* not a comment */ // not a comment",
    });
  });

  it("does not treat escaped quotes inside strings as string terminators", () => {
    const text = '{ "a": "quote \\" inside" }';
    expect(parseJsonc(text)).toEqual({ a: 'quote " inside' });
  });
});

describe("parseJsonc — malformed input", () => {
  const PARSE_CODE = "issue.config.parse";

  it("rejects malformed JSON with issue.config.parse", () => {
    expect(codeOf(() => parseJsonc('{ "logLevel": "info"'))).toBe(PARSE_CODE);
  });

  it("rejects trailing garbage after a value", () => {
    expect(codeOf(() => parseJsonc('{ "a": 1 } xyz'))).toBe(PARSE_CODE);
  });

  it("rejects unterminated block comments", () => {
    expect(codeOf(() => parseJsonc('{ "a": 1 /* oops'))).toBe(PARSE_CODE);
  });

  it("rejects unterminated strings", () => {
    expect(codeOf(() => parseJsonc('{ "a": "oops'))).toBe(PARSE_CODE);
  });

  it("rejects unquoted keys", () => {
    expect(codeOf(() => parseJsonc("{ a: 1 }"))).toBe(PARSE_CODE);
  });

  it("rejects a comma with no preceding value", () => {
    expect(codeOf(() => parseJsonc("[,]"))).toBe(PARSE_CODE);
  });

  it("produces actionable error messages with line and column", () => {
    const message = messageOf(() => parseJsonc('{\n  "a": ,\n}'));
    expect(message).toMatch(/line \d+, column \d+/);
    expect(message).toMatch(/not valid JSON/);
  });
});
