/**
 * ISSU Phase 6 — Configuration & CLI: config schema, resolution, provenance, verification.
 * Spec §6, §7, §9, §12, §15. Architecture Q6.1, Q6.2, Q6.6, Q6.7.
 */

import type { Result } from "@issue/foundation";
import { AppError } from "@issue/foundation";
import { err, ok } from "@issue/foundation";

// --- Public types (§3) -----------------------------------------------------

export type ConfigSchema = {
  readonly version: "1.0.0";
  readonly models?: Readonly<Record<string, unknown>>;
  readonly providers?: Readonly<Record<string, unknown>>;
  readonly tools?: Readonly<Record<string, unknown>>;
  readonly permissions?: Readonly<Record<string, unknown>>;
  readonly memory?: Readonly<Record<string, unknown>>;
  readonly agent?: Readonly<Record<string, unknown>>;
  readonly project?: Readonly<Record<string, unknown>>;
  readonly logging?: Readonly<{ level?: LogLevel }>;
  readonly performance?: Readonly<Record<string, unknown>>;
};

export type LogLevel = "debug" | "info" | "warn" | "error";

export type ResolvedConfig = {
  readonly version: "1.0.0";
  readonly models: Readonly<Record<string, unknown>>;
  readonly providers: Readonly<Record<string, unknown>>;
  readonly tools: Readonly<Record<string, unknown>>;
  readonly permissions: Readonly<Record<string, unknown>>;
  readonly memory: Readonly<Record<string, unknown>>;
  readonly agent: Readonly<Record<string, unknown>>;
  readonly project: Readonly<Record<string, unknown>>;
  readonly logging: { readonly level: LogLevel };
  readonly performance: Readonly<Record<string, unknown>>;
  readonly provenance: ConfigProvenance;
};

export type ConfigSource = "defaults" | "file" | "env" | "cli";

export type ConfigProvenanceEntry = {
  readonly source: ConfigSource;
  readonly key: string;
  readonly value: unknown;
  readonly redacted: boolean;
};

export type ConfigProvenance = readonly ConfigProvenanceEntry[];

// --- Helpers ---------------------------------------------------------------

const ALLOWED_TOP_KEYS = [
  "version",
  "models",
  "providers",
  "tools",
  "permissions",
  "memory",
  "agent",
  "project",
  "logging",
  "performance",
] as const;

const SECRET_KEYS = new Set(["models", "providers", "permissions"]);

function isLogLevel(v: unknown): v is LogLevel {
  return v === "debug" || v === "info" || v === "warn" || v === "error";
}

// Minimal JSONC strip: remove // line comments and /* block */ and trailing commas
function stripJsonc(text: string): string {
  // Remove /* */ block comments
  let out = text.replace(/\/\*[\s\S]*?\*\//g, "");
  // Remove // line comments (not inside strings — simplified, good enough for config)
  out = out
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("//");
      if (idx === -1) return line;
      // crude: if // inside string, we still strip — acceptable for Phase 6 minimal
      return line.slice(0, idx);
    })
    .join("\n");
  // Remove trailing commas before } or ]
  out = out.replace(/,\s*([}\]])/g, "$1");
  return out;
}

function parseJsonc(content: string): Result<unknown, AppError> {
  try {
    const stripped = stripJsonc(content);
    const parsed: unknown = JSON.parse(stripped);
    return ok(parsed);
  } catch (e) {
    return err(
      new AppError({
        code: "issue.config.validation",
        message: `config file JSONC parse failed: ${(e as Error).message}`,
        cause: e,
      }),
    );
  }
}

function validateSchema(obj: unknown): Result<ConfigSchema, AppError> {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return err(
      new AppError({
        code: "issue.config.validation",
        message: "config must be an object",
      }),
    );
  }
  const rec = obj as Record<string, unknown>;
  // version
  if (rec["version"] !== "1.0.0") {
    return err(
      new AppError({
        code: "issue.config.validation",
        message: `config.version must be "1.0.0", got ${String(rec["version"])}`,
      }),
    );
  }
  // unknown top-level keys
  for (const k of Object.keys(rec)) {
    if (!(ALLOWED_TOP_KEYS as readonly string[]).includes(k)) {
      return err(
        new AppError({
          code: "issue.config.validation",
          message: `unknown config key: ${k}`,
        }),
      );
    }
  }
  // logging.level
  const logging = rec["logging"];
  if (logging !== undefined) {
    if (
      typeof logging !== "object" ||
      logging === null ||
      Array.isArray(logging)
    ) {
      return err(
        new AppError({
          code: "issue.config.validation",
          message: "config.logging must be an object",
        }),
      );
    }
    const lvl = (logging as Record<string, unknown>)["level"];
    if (lvl !== undefined && !isLogLevel(lvl)) {
      return err(
        new AppError({
          code: "issue.config.validation",
          message: `config.logging.level must be debug|info|warn|error, got ${String(lvl)}`,
        }),
      );
    }
  }
  // all sections must be objects if present (except version)
  for (const k of ALLOWED_TOP_KEYS) {
    if (k === "version" || k === "logging") continue;
    const v = rec[k];
    if (
      v !== undefined &&
      (typeof v !== "object" || v === null || Array.isArray(v))
    ) {
      return err(
        new AppError({
          code: "issue.config.validation",
          message: `config.${k} must be an object`,
        }),
      );
    }
  }
  return ok(rec as unknown as ConfigSchema);
}

// --- resolveConfig (pure, deterministic) ----------------------------------

export type ResolveLayers = {
  readonly defaults: ConfigSchema;
  readonly fileContent?: string;
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly cli?: Partial<ConfigSchema>;
};

export function resolveConfig(
  layers: ResolveLayers,
): Result<ResolvedConfig, AppError> {
  // Validate defaults first
  const defaultsResult = validateSchema(layers.defaults);
  if (!defaultsResult.ok)
    return defaultsResult as unknown as Result<ResolvedConfig, AppError>;

  // Parse file if present
  let fileSchema: ConfigSchema | undefined;
  if (layers.fileContent !== undefined) {
    const parsed = parseJsonc(layers.fileContent);
    if (!parsed.ok)
      return parsed as unknown as Result<ResolvedConfig, AppError>;
    const validated = validateSchema(parsed.value);
    if (!validated.ok)
      return validated as unknown as Result<ResolvedConfig, AppError>;
    fileSchema = validated.value;
  }

  // Env is not used for config keys in Phase 6 minimal (env is handled by Phase 1 readEnv, but we keep provenance)
  // Cli partial
  let cliSchema: ConfigSchema | undefined;
  if (layers.cli !== undefined) {
    // cli is Partial, but we validate if it looks like a schema
    const cliAsUnknown: unknown = layers.cli;
    if (
      cliAsUnknown !== undefined &&
      typeof cliAsUnknown === "object" &&
      cliAsUnknown !== null
    ) {
      const cliRec = cliAsUnknown as Record<string, unknown>;
      // allow cli to have only subset; we validate each provided key
      for (const k of Object.keys(cliRec)) {
        if (!(ALLOWED_TOP_KEYS as readonly string[]).includes(k)) {
          return err(
            new AppError({
              code: "issue.config.validation",
              message: `cli config unknown key: ${k}`,
            }),
          );
        }
      }
      // if cli provides version, must be correct
      if (cliRec["version"] !== undefined && cliRec["version"] !== "1.0.0") {
        return err(
          new AppError({
            code: "issue.config.validation",
            message: `cli config.version must be "1.0.0"`,
          }),
        );
      }
      if (cliRec["logging"] !== undefined) {
        const lvl = (cliRec["logging"] as Record<string, unknown>)?.["level"];
        if (lvl !== undefined && !isLogLevel(lvl)) {
          return err(
            new AppError({
              code: "issue.config.validation",
              message: `cli config.logging.level must be debug|info|warn|error`,
            }),
          );
        }
      }
      cliSchema = cliRec as unknown as ConfigSchema;
    }
  }

  // Merge layers: defaults → file → env (no keys from env in minimal) → cli
  // Shallow per section, no array merge
  const merged: Record<string, unknown> = {};
  // start with defaults
  for (const k of ALLOWED_TOP_KEYS) {
    const v = (layers.defaults as Record<string, unknown>)[k];
    if (v !== undefined) merged[k] = v;
  }
  if (fileSchema) {
    for (const k of ALLOWED_TOP_KEYS) {
      const v = (fileSchema as Record<string, unknown>)[k];
      if (v !== undefined) merged[k] = v;
    }
  }
  // env layer: Phase 6 minimal does not map env to config keys (kept for provenance only)
  if (cliSchema) {
    for (const k of ALLOWED_TOP_KEYS) {
      const v = (cliSchema as Record<string, unknown>)[k];
      if (v !== undefined) merged[k] = v;
    }
  }

  // Build provenance: track last source per key
  const provenance: ConfigProvenanceEntry[] = [];
  const lastSource = new Map<string, ConfigSource>();
  // defaults
  for (const k of Object.keys(layers.defaults as Record<string, unknown>)) {
    lastSource.set(k, "defaults");
  }
  if (fileSchema) {
    for (const k of Object.keys(
      fileSchema as unknown as Record<string, unknown>,
    )) {
      lastSource.set(k, "file");
    }
  }
  if (layers.env) {
    // env provenance: if env has ISSU_* keys, we note them (minimal)
    for (const k of Object.keys(layers.env)) {
      if (k.startsWith("ISSU_")) {
        // map ISSU_LOGGING_LEVEL → logging
        if (k === "ISSU_LOGGING_LEVEL") lastSource.set("logging", "env");
      }
    }
  }
  if (cliSchema) {
    for (const k of Object.keys(
      cliSchema as unknown as Record<string, unknown>,
    )) {
      lastSource.set(k, "cli");
    }
  }
  for (const [key, source] of lastSource.entries()) {
    const value = merged[key];
    provenance.push({
      source,
      key,
      value,
      redacted: SECRET_KEYS.has(key),
    });
  }
  // Deterministic order: sort by key
  provenance.sort((a, b) => a.key.localeCompare(b.key));
  const frozenProvenance = Object.freeze(provenance) as ConfigProvenance;

  // Build ResolvedConfig with defaults for missing sections
  const resolved: ResolvedConfig = {
    version: "1.0.0",
    models: (merged["models"] as Record<string, unknown>) ?? {},
    providers: (merged["providers"] as Record<string, unknown>) ?? {},
    tools: (merged["tools"] as Record<string, unknown>) ?? {},
    permissions: (merged["permissions"] as Record<string, unknown>) ?? {},
    memory: (merged["memory"] as Record<string, unknown>) ?? {},
    agent: (merged["agent"] as Record<string, unknown>) ?? {},
    project: (merged["project"] as Record<string, unknown>) ?? {},
    logging: (() => {
      const lvl = (merged["logging"] as { level?: unknown })?.level;
      return { level: isLogLevel(lvl) ? lvl : "info" };
    })(),
    performance: (merged["performance"] as Record<string, unknown>) ?? {},
    provenance: frozenProvenance,
  };

  // Freeze top-level and each section for determinism
  Object.freeze(resolved);
  Object.freeze(resolved.models);
  Object.freeze(resolved.providers);
  Object.freeze(resolved.tools);
  Object.freeze(resolved.permissions);
  Object.freeze(resolved.memory);
  Object.freeze(resolved.agent);
  Object.freeze(resolved.project);
  Object.freeze(resolved.logging);
  Object.freeze(resolved.performance);

  return ok(resolved);
}

// --- verifyConfig ----------------------------------------------------------

export function verifyConfig(
  provenance: ConfigProvenance,
): Result<true, AppError> {
  const allowedSources: ReadonlySet<ConfigSource> = new Set([
    "defaults",
    "file",
    "env",
    "cli",
  ]);
  const allowedKeys = new Set<string>(ALLOWED_TOP_KEYS as readonly string[]);
  for (const entry of provenance) {
    if (!allowedSources.has(entry.source)) {
      return err(
        new AppError({
          code: "issue.config.validation",
          message: `provenance source must be defaults|file|env|cli, got ${entry.source}`,
        }),
      );
    }
    if (!allowedKeys.has(entry.key)) {
      return err(
        new AppError({
          code: "issue.config.validation",
          message: `provenance key unknown: ${entry.key}`,
        }),
      );
    }
    if (entry.value === undefined && !entry.redacted) {
      return err(
        new AppError({
          code: "issue.config.validation",
          message: `provenance value undefined for ${entry.key}`,
        }),
      );
    }
  }
  return ok(true);
}

// --- defaults helper -------------------------------------------------------

export function getDefaultConfig(): ConfigSchema {
  return {
    version: "1.0.0",
    logging: { level: "info" },
  };
}
