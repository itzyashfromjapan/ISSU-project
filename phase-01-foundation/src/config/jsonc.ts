import { configError } from "./config-error.js";

export function parseJsonc(text: string): unknown {
  const cleaned = stripCommentsAndTrailingCommas(text);
  let value: unknown;
  try {
    value = JSON.parse(cleaned);
  } catch (error) {
    throw configError(
      "issue.config.parse",
      parseFailureMessage(cleaned, error),
      {
        cause: error,
      },
    );
  }
  return value;
}

function isWhitespace(ch: string | undefined): boolean {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
}

function stripCommentsAndTrailingCommas(text: string): string {
  let out = "";
  let i = 0;
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];
    if (inLineComment) {
      if (ch === "\n") {
        out += "\n";
        inLineComment = false;
      }
      i += 1;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 2;
        continue;
      }
      if (ch === "\n") out += "\n";
      i += 1;
      continue;
    }
    if (inString) {
      out += ch;
      if (ch === "\\" && next !== undefined) {
        out += next;
        i += 2;
        continue;
      }
      if (ch === '"') inString = false;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "/") {
      inLineComment = true;
      i += 2;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i += 2;
      continue;
    }
    if (ch === ",") {
      const nextSignificant = peekSignificant(text, i + 1);
      if (nextSignificant === "}" || nextSignificant === "]") {
        const lastSignificant = out.trimEnd().slice(-1);
        if (
          lastSignificant !== "{" &&
          lastSignificant !== "[" &&
          lastSignificant !== ","
        ) {
          i += 1;
          continue;
        }
      }
    }
    out += ch;
    i += 1;
  }
  if (inBlockComment) {
    throw configError(
      "issue.config.parse",
      "Unterminated block comment in config file.",
    );
  }
  if (inString) {
    throw configError(
      "issue.config.parse",
      "Unterminated string literal in config file.",
    );
  }
  return out;
}

function peekSignificant(text: string, start: number): string | undefined {
  let i = start;
  while (i < text.length) {
    const ch = text[i];
    if (isWhitespace(ch)) {
      i += 1;
      continue;
    }
    if (ch === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i += 1;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/"))
        i += 1;
      i += 2;
      continue;
    }
    return text[i];
  }
  return undefined;
}

function parseFailureMessage(cleaned: string, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const index = errorIndex(message, cleaned);
  if (index < 0) {
    return `Config file is not valid JSON: ${message}`;
  }
  const { line, column } = lineColumnAt(cleaned, index);
  const lines = cleaned.split("\n");
  const excerpt = lines[line - 1] ?? "";
  return `Config file is not valid JSON at line ${line}, column ${column}: ${message}${
    excerpt !== "" ? `\n  ${excerpt}` : ""
  }`;
}

/**
 * Locate the error position within `cleaned` from a JSON.parse message.
 * Handles both V8 message formats: the older "at position N (line L column C)"
 * form and the newer "Unexpected token ..." form, which embeds the parsed
 * JSON text (up to and including the offending token) as a quoted snippet.
 */
function errorIndex(message: string, cleaned: string): number {
  const positionMatch = /at position (\d+)/i.exec(message);
  if (positionMatch !== null) {
    const index = Number(positionMatch[1]);
    if (Number.isFinite(index) && index >= 0 && index <= cleaned.length) {
      return index;
    }
  }
  const snippetMatch =
    /Unexpected token '[^']*', "([\s\S]*)" is not valid JSON$/.exec(message);
  const snippet = snippetMatch?.[1];
  if (
    snippet !== undefined &&
    snippet.length > 0 &&
    snippet.length <= cleaned.length
  ) {
    return snippet.length - 1;
  }
  if (message.includes("Unexpected end of JSON input")) {
    return cleaned.length;
  }
  return -1;
}

function lineColumnAt(
  text: string,
  index: number,
): { line: number; column: number } {
  let line = 1;
  let column = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text[i] === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}
