import type { IssueConfig, LogLevel } from "../index.js";

export const LOG_LEVELS: readonly LogLevel[] = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
];

export const DEFAULT_CONFIG: IssueConfig = {
  logLevel: "info",
  logPretty: false,
  redact: [],
};
