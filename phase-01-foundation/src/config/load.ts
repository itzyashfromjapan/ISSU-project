import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import type {
  AppError,
  IssueConfig,
  LoadConfigOptions,
  Result,
} from "../index.js";
import { configError, toAppError } from "./config-error.js";
import { parseJsonc } from "./jsonc.js";
import { configFromEnv, configFromFile, mergeConfigLayers } from "./resolve.js";
import { readEnv } from "../env/env.js";

const DEFAULT_CONFIG_FILE = "issue.config.json";

export async function loadConfig(
  options?: LoadConfigOptions,
): Promise<Result<IssueConfig, AppError>> {
  try {
    const cwd = options?.cwd ?? process.cwd();
    const env = readEnv();
    const fileLayer = await loadFileLayer(
      options?.configPath ?? env.ISSU_CONFIG,
      cwd,
    );
    const envLayer = configFromEnv(env);
    const flagsLayer: Partial<IssueConfig> = {};
    const config = mergeConfigLayers(fileLayer, envLayer, flagsLayer);
    return { ok: true, value: config };
  } catch (error) {
    return { ok: false, error: toAppError(error) };
  }
}

async function loadFileLayer(
  configPath: string | undefined,
  cwd: string,
): Promise<Partial<IssueConfig>> {
  let filePath: string;
  let missingIsOk = false;
  if (configPath === undefined) {
    filePath = resolve(cwd, DEFAULT_CONFIG_FILE);
    missingIsOk = true;
  } else {
    filePath = isAbsolute(configPath) ? configPath : resolve(cwd, configPath);
  }

  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if (isMissingFile(error) && missingIsOk) return {};
    if (isMissingFile(error)) {
      throw configError(
        "issue.config.notfound",
        `Config file not found at "${filePath}". Check the path, or create issue.config.json in the working directory.`,
        { cause: error },
      );
    }
    throw configError(
      "issue.config.parse",
      `Cannot read config file at "${filePath}": ${errorMessage(error)}`,
      {
        cause: error,
      },
    );
  }

  const parsed = parseJsonc(raw);
  return configFromFile(parsed);
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    ((error as NodeJS.ErrnoException).code === "ENOENT" ||
      (error as NodeJS.ErrnoException).code === "ENOTDIR")
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
