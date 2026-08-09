#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import type { DestinationStream } from "pino";
import { loadConfig } from "../config/load.js";
import { readEnv } from "../env/env.js";
import type { AppError } from "../errors/app-error.js";
import { toAppError } from "../errors/normalize.js";
import type { IssueConfig } from "../index.js";
import { createLoggerFromConfig } from "../logging/pino-logger.js";
import type { CliArgs } from "./args.js";
import { parseCliArgs } from "./args.js";
import { printHelp, printVersion } from "./print.js";

export interface RunCliOptions {
  argv: string[];
  cwd?: string;
  stdout?: DestinationStream;
  stderr?: DestinationStream;
}

export async function runCli(argv: string[]): Promise<number> {
  return runCliWith({ argv });
}

export async function runCliWith(options: RunCliOptions): Promise<number> {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const cwd = options.cwd ?? process.cwd();

  try {
    const args = parseCliArgs(options.argv);

    if (args.help) {
      stdout.write(printHelp());
      return 0;
    }

    if (args.version) {
      stdout.write(printVersion());
      return 0;
    }

    const loadResult = await loadConfig({
      cwd,
      ...(args.config !== undefined ? { configPath: args.config } : {}),
    });
    if (!loadResult.ok) {
      return fail(stderr, loadResult.error);
    }

    const logger = createLoggerFromConfig(
      applyCliFlags(loadResult.value, args),
      readEnv(),
      stderr,
    );
    logger.debug("cli invoked", { argv: options.argv });

    return 0;
  } catch (error) {
    return fail(stderr, toAppError(error));
  }
}

function applyCliFlags(config: IssueConfig, args: CliArgs): IssueConfig {
  let result = config;
  if (args.logLevel !== undefined) {
    result = { ...result, logLevel: args.logLevel };
  }
  if (args.noColor) {
    result = { ...result, logPretty: false };
  }
  return result;
}

function fail(stream: DestinationStream, error: AppError): number {
  stream.write(`error[${error.code}]: ${error.message}\n`);
  return exitCodeFor(error);
}

function exitCodeFor(error: AppError): 1 | 2 {
  return error.code === "issue.internal" ? 1 : 2;
}

const isMainEntry =
  process.argv[1] !== undefined &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMainEntry) {
  runCli(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (error: unknown) => {
      process.stderr.write(
        `error[issue.internal]: ${String(
          error instanceof Error ? error.message : error,
        )}\n`,
      );
      process.exitCode = 1;
    },
  );
}
