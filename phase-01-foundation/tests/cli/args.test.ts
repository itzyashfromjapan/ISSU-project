import { describe, expect, it } from "vitest";
import { parseCliArgs } from "../../src/cli/args.js";
import { AppError } from "../../src/errors/app-error.js";

function codeOf(fn: () => unknown): string {
  try {
    fn();
  } catch (error) {
    if (error instanceof AppError) return error.code;
    if (error instanceof Error) return `Error: ${error.message}`;
  }
  return "no error";
}

describe("parseCliArgs", () => {
  it("parses --help", () => {
    expect(parseCliArgs(["--help"])).toEqual({
      help: true,
      version: false,
      noColor: false,
    });
  });

  it("parses --version", () => {
    expect(parseCliArgs(["--version"])).toEqual({
      help: false,
      version: true,
      noColor: false,
    });
  });

  it("parses --config with a value", () => {
    expect(parseCliArgs(["--config", "conf.json"])).toEqual({
      help: false,
      version: false,
      noColor: false,
      config: "conf.json",
    });
  });

  it("parses --config=value form", () => {
    expect(parseCliArgs(["--config=conf.json"])).toEqual({
      help: false,
      version: false,
      noColor: false,
      config: "conf.json",
    });
  });

  it("parses --log-level and validates the value", () => {
    expect(parseCliArgs(["--log-level", "debug"])).toEqual({
      help: false,
      version: false,
      noColor: false,
      logLevel: "debug",
    });
  });

  it("parses --no-color", () => {
    expect(parseCliArgs(["--no-color"])).toEqual({
      help: false,
      version: false,
      noColor: true,
    });
  });

  it("parses a combination of flags", () => {
    expect(
      parseCliArgs(["--no-color", "--config", "a.json", "--log-level", "warn"]),
    ).toEqual({
      help: false,
      version: false,
      noColor: true,
      config: "a.json",
      logLevel: "warn",
    });
  });

  it("last duplicate wins", () => {
    expect(parseCliArgs(["--config", "a.json", "--config", "b.json"])).toEqual({
      help: false,
      version: false,
      noColor: false,
      config: "b.json",
    });
  });

  it("rejects an unknown flag with issue.cli.unknownflag", () => {
    expect(codeOf(() => parseCliArgs(["--bogus"]))).toBe(
      "issue.cli.unknownflag",
    );
    let message = "";
    try {
      parseCliArgs(["--bogus"]);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain("Unknown option '--bogus'");
  });

  it("rejects a positional argument with issue.usage", () => {
    expect(codeOf(() => parseCliArgs(["subcommand"]))).toBe("issue.usage");
  });

  it("rejects a missing option value with issue.usage", () => {
    expect(codeOf(() => parseCliArgs(["--config"]))).toBe("issue.usage");
  });

  it("rejects an ambiguous option value with issue.usage", () => {
    expect(codeOf(() => parseCliArgs(["--log-level", "--help"]))).toBe(
      "issue.usage",
    );
  });

  it("rejects an invalid --log-level value with issue.usage", () => {
    expect(codeOf(() => parseCliArgs(["--log-level", "loud"]))).toBe(
      "issue.usage",
    );
    let message = "";
    try {
      parseCliArgs(["--log-level", "loud"]);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain("Expected one of");
  });
});
