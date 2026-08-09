import { VERSION } from "../version.js";

export function printVersion(): string {
  return `issue ${VERSION}\n`;
}

export function printHelp(): string {
  return [
    "issue - ISSU autonomous intelligence platform (Phase 1 foundation)",
    "",
    "Usage:",
    "  issue [options]",
    "",
    "Options:",
    "  --help              Show this help message and exit",
    "  --version           Print the version and exit",
    "  --config <path>     Load configuration from <path> (JSONC).",
    "                      Defaults to $ISSU_CONFIG or ./issue.config.json.",
    "  --log-level <level> Log threshold: trace | debug | info | warn | error | fatal.",
    "  --no-color          Disable ANSI colors in output.",
    "",
    "Exit codes:",
    "  0  Success",
    "  1  Unexpected failure (issue.internal)",
    "  2  Usage or configuration error",
    "",
  ].join("\n");
}
