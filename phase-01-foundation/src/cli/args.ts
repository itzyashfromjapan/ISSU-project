import { parseArgs } from "node:util";
import { LOG_LEVELS } from "../config/defaults.js";
import { AppError } from "../errors/app-error.js";
import type { LogLevel } from "../logging/logger.js";

export interface CliArgs {
  help: boolean;
  version: boolean;
  config?: string;
  logLevel?: LogLevel;
  noColor: boolean;
}

export function parseCliArgs(argv: string[]): CliArgs {
  let values: Record<string, string | boolean | undefined>;
  try {
    values = parseArgs({
      args: argv,
      allowPositionals: false,
      options: {
        help: { type: "boolean" },
        version: { type: "boolean" },
        config: { type: "string" },
        "log-level": { type: "string" },
        "no-color": { type: "boolean" },
      },
    }).values;
  } catch (error) {
    throw cliArgError(error);
  }

  const config = stringValue(values, "config");
  const logLevelValue = stringValue(values, "log-level");
  const logLevel =
    logLevelValue === undefined ? undefined : validateLogLevel(logLevelValue);

  return {
    help: values.help === true,
    version: values.version === true,
    noColor: values["no-color"] === true,
    ...(config !== undefined ? { config } : {}),
    ...(logLevel !== undefined ? { logLevel } : {}),
  };
}

function stringValue(
  values: Record<string, string | boolean | undefined>,
  name: string,
): string | undefined {
  const value = values[name];
  return typeof value === "string" ? value : undefined;
}

function validateLogLevel(value: string): LogLevel {
  if ((LOG_LEVELS as readonly string[]).includes(value)) {
    return value as LogLevel;
  }
  throw new AppError({
    code: "issue.usage",
    message: `Invalid value for --log-level: "${value}". Expected one of ${LOG_LEVELS.join(", ")}.`,
    recoverable: false,
  });
}

function cliArgError(error: unknown): AppError {
  const code = (error as NodeJS.ErrnoException).code;
  const detail = error instanceof Error ? error.message : String(error);
  if (code === "ERR_PARSE_ARGS_UNKNOWN_OPTION") {
    return new AppError({
      code: "issue.cli.unknownflag",
      message: `${detail}. Run "issue --help" for usage.`,
      cause: error,
      recoverable: false,
    });
  }
  return new AppError({
    code: "issue.usage",
    message: `${detail}. Run "issue --help" for usage.`,
    cause: error,
    recoverable: false,
  });
}
