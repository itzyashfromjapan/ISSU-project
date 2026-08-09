import type { EnvSnapshot, IssueConfig, LogLevel } from "../index.js";
import { configError } from "./config-error.js";
import { DEFAULT_CONFIG, LOG_LEVELS } from "./defaults.js";
import { isSecretName } from "../env/secrets.js";

export function validateConfig(config: IssueConfig): IssueConfig {
  if (!LOG_LEVELS.includes(config.logLevel)) {
    throw configError(
      "issue.config.invalid",
      `Config validation failed: logLevel must be one of ${LOG_LEVELS.join(", ")}, got ${JSON.stringify(config.logLevel)}.`,
      { details: { key: "logLevel", value: config.logLevel } },
    );
  }
  if (typeof config.logPretty !== "boolean") {
    throw configError(
      "issue.config.invalid",
      `Config validation failed: logPretty must be a boolean, got ${JSON.stringify(config.logPretty)}.`,
      { details: { key: "logPretty", value: config.logPretty } },
    );
  }
  if (
    !Array.isArray(config.redact) ||
    config.redact.some((entry) => typeof entry !== "string")
  ) {
    throw configError(
      "issue.config.invalid",
      "Config validation failed: redact must be an array of strings.",
      {
        details: { key: "redact" },
      },
    );
  }
  return config;
}

export function mergeConfigLayers(
  ...layers: Partial<IssueConfig>[]
): IssueConfig {
  const merged: IssueConfig = {
    logLevel: DEFAULT_CONFIG.logLevel,
    logPretty: DEFAULT_CONFIG.logPretty,
    redact: [...DEFAULT_CONFIG.redact],
  };
  for (const layer of layers) {
    if (layer === null || layer === undefined) continue;
    if (layer.logLevel !== undefined) merged.logLevel = layer.logLevel;
    if (layer.logPretty !== undefined) merged.logPretty = layer.logPretty;
    if (layer.redact !== undefined) {
      merged.redact = dedupe([...merged.redact, ...layer.redact]);
    }
  }
  return validateConfig(merged);
}

export function configFromFile(value: unknown): Partial<IssueConfig> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw configError(
      "issue.config.invalid",
      "Config file validation failed: the file must contain a JSON object at the top level.",
    );
  }
  const record = value as Record<string, unknown>;
  assertNoSecretsInConfig(record);
  const layer: Partial<IssueConfig> = {};
  if (record.logLevel !== undefined) {
    if (
      typeof record.logLevel !== "string" ||
      !LOG_LEVELS.includes(record.logLevel as LogLevel)
    ) {
      throw configError(
        "issue.config.invalid",
        `Config file validation failed: logLevel must be one of ${LOG_LEVELS.join(", ")}, got ${JSON.stringify(record.logLevel)}.`,
        { details: { key: "logLevel", value: record.logLevel } },
      );
    }
    layer.logLevel = record.logLevel as LogLevel;
  }
  if (record.logPretty !== undefined) {
    if (typeof record.logPretty !== "boolean") {
      throw configError(
        "issue.config.invalid",
        `Config file validation failed: logPretty must be a boolean, got ${JSON.stringify(record.logPretty)}.`,
        { details: { key: "logPretty", value: record.logPretty } },
      );
    }
    layer.logPretty = record.logPretty;
  }
  if (record.redact !== undefined) {
    if (
      !Array.isArray(record.redact) ||
      record.redact.some((entry) => typeof entry !== "string")
    ) {
      throw configError(
        "issue.config.invalid",
        "Config file validation failed: redact must be an array of strings.",
        { details: { key: "redact" } },
      );
    }
    layer.redact = [...(record.redact as string[])];
  }
  return layer;
}

export function configFromEnv(env: EnvSnapshot): Partial<IssueConfig> {
  const layer: Partial<IssueConfig> = {};
  const level = env.ISSU_LOG_LEVEL;
  if (level !== undefined) {
    if (!LOG_LEVELS.includes(level as LogLevel)) {
      throw configError(
        "issue.config.invalid",
        `ISSU_LOG_LEVEL must be one of ${LOG_LEVELS.join(", ")}, got ${JSON.stringify(level)}.`,
        { details: { key: "ISSU_LOG_LEVEL", value: level } },
      );
    }
    layer.logLevel = level as LogLevel;
  }
  const pretty = env.ISSU_LOG_PRETTY;
  if (pretty !== undefined) {
    if (pretty !== "true" && pretty !== "false") {
      throw configError(
        "issue.config.invalid",
        `ISSU_LOG_PRETTY must be "true" or "false", got ${JSON.stringify(pretty)}.`,
        { details: { key: "ISSU_LOG_PRETTY", value: pretty } },
      );
    }
    layer.logPretty = pretty === "true";
  }
  const redactValue = env.ISSU_REDACT;
  if (redactValue !== undefined) {
    layer.redact = redactValue
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return layer;
}

export function assertNoSecretsInConfig(value: unknown, path = "$"): void {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      assertNoSecretsInConfig(value[i], `${path}[${i}]`);
    }
    return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const keyPath = `${path}.${key}`;
    if (isSecretName(key)) {
      throw configError(
        "issue.config.invalid",
        `Config file validation failed: config files must not contain secret-like keys (found ${keyPath}). Secrets belong in the environment (SPECIFICATION §4); remove ${keyPath} from the config file.`,
        { details: { key: keyPath } },
      );
    }
    assertNoSecretsInConfig(child, keyPath);
  }
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}
