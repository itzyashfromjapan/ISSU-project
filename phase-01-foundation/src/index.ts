import type { LogLevel } from "./logging/logger.js";

export { VERSION } from "./version.js";

export { AppError } from "./errors/app-error.js";
export type { AppErrorJson, AppErrorParams } from "./errors/app-error.js";
export { isAppError, toError } from "./errors/guards.js";

export type { Result } from "./result/result.js";
export { err, isErr, isOk, match, ok } from "./result/result.js";

export type { LogLevel } from "./logging/logger.js";

export interface IssueConfig {
  logLevel: LogLevel;
  logPretty: boolean;
  redact: string[];
}

export type LoadConfigOptions = { cwd?: string; configPath?: string };

export { loadConfig } from "./config/load.js";
export { mergeConfigLayers } from "./config/resolve.js";

export interface EnvSource {
  [name: string]: string | undefined;
}

export interface EnvSnapshot {
  [name: string]: string | undefined;
}

export { readEnv } from "./env/env.js";
export { getSecret, redactionList } from "./env/secrets.js";

export type { Logger, LoggerOptions } from "./logging/logger.js";

export { createLogger } from "./logging/pino-logger.js";

export { assertContained, isContained } from "./paths/contain.js";

export { runCli } from "./cli/main.js";
