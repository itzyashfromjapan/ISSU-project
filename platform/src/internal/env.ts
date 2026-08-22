/**
 * ISSU v0.2 Platform — fail-closed environment schema.
 * Governance record section 6. Key VALUES are never read here; only key NAMES.
 */

import type { Result } from "@issue/foundation";
import { AppError } from "@issue/foundation";
import { err, ok } from "@issue/foundation";
import { isContained } from "@issue/foundation";

export type IssuEnvName = "development" | "staging" | "production";
export type ProviderKind = "anthropic" | "openai" | "local";

export type PlatformEnv = {
  readonly env: IssuEnvName;
  readonly provider: ProviderKind;
  readonly model?: string;
  readonly apiKeyVarName?: string;
  readonly timeoutMs: number;
  readonly maxRetries: number;
  readonly workspaceRoot?: string;
};

const ENVS: ReadonlySet<string> = new Set([
  "development",
  "staging",
  "production",
]);
const PROVIDERS: ReadonlySet<string> = new Set([
  "anthropic",
  "openai",
  "local",
]);
const KNOWN_KEYS: ReadonlySet<string> = new Set([
  "ISSU_ENV",
  "ISSU_PROVIDER",
  "ISSU_PROVIDER_MODEL",
  "ISSU_PROVIDER_API_KEY_VAR",
  "ISSU_TIMEOUT_MS",
  "ISSU_MAX_RETRIES",
  "ISSU_WORKSPACE_ROOT",
]);

function validationError(message: string): Result<never, AppError> {
  return err(new AppError({ code: "issue.platform.env-validation", message }));
}

export function loadPlatformEnv(
  input?: Readonly<Record<string, string | undefined>>,
): Result<PlatformEnv, AppError> {
  const source = input ?? process.env;

  // Fail-closed on unknown ISSU_* keys (typo/confusion defense).
  for (const k of Object.keys(source)) {
    if (k.startsWith("ISSU_") && !KNOWN_KEYS.has(k)) {
      return validationError(`unknown ISSU_ environment key: ${k}`);
    }
  }

  const envName = source["ISSU_ENV"] ?? "development";
  if (!ENVS.has(envName)) {
    return validationError(
      `ISSU_ENV must be development|staging|production, got ${envName}`,
    );
  }

  const provider = source["ISSU_PROVIDER"] ?? "local";
  if (!PROVIDERS.has(provider)) {
    return validationError(
      `ISSU_PROVIDER must be anthropic|openai|local, got ${provider}`,
    );
  }
  const isLocal = provider === "local";

  const model = source["ISSU_PROVIDER_MODEL"];
  if (!isLocal && (model === undefined || model.trim() === "")) {
    return validationError(
      "ISSU_PROVIDER_MODEL is required when provider is not local",
    );
  }

  const apiKeyVarName = source["ISSU_PROVIDER_API_KEY_VAR"];
  if (
    !isLocal &&
    (apiKeyVarName === undefined || apiKeyVarName.trim() === "")
  ) {
    return validationError(
      "ISSU_PROVIDER_API_KEY_VAR is required when provider is not local",
    );
  }
  if (
    apiKeyVarName !== undefined &&
    !/^[A-Z_][A-Z0-9_]*$/.test(apiKeyVarName)
  ) {
    return validationError(
      `ISSU_PROVIDER_API_KEY_VAR must be an env-var NAME like MY_KEY, got ${apiKeyVarName}`,
    );
  }

  let timeoutMs = 30000;
  const rawTimeout = source["ISSU_TIMEOUT_MS"];
  if (rawTimeout !== undefined) {
    timeoutMs = Number(rawTimeout);
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000) {
      return validationError(
        "ISSU_TIMEOUT_MS must be an integer between 1000 and 60000",
      );
    }
  }

  let maxRetries = 2;
  const rawRetries = source["ISSU_MAX_RETRIES"];
  if (rawRetries !== undefined) {
    maxRetries = Number(rawRetries);
    if (!Number.isInteger(maxRetries) || maxRetries < 0 || maxRetries > 5) {
      return validationError(
        "ISSU_MAX_RETRIES must be an integer between 0 and 5",
      );
    }
  }

  const workspaceRoot = source["ISSU_WORKSPACE_ROOT"];
  if (workspaceRoot !== undefined && workspaceRoot.trim() !== "") {
    let contained = false;
    try {
      contained = isContained(process.cwd(), workspaceRoot);
    } catch {
      contained = false;
    }
    if (!contained) {
      return err(
        new AppError({
          code: "issue.platform.env-validation",
          message: `ISSU_WORKSPACE_ROOT escapes the current directory: ${workspaceRoot}`,
        }),
      );
    }
  }

  return ok({
    env: envName as IssuEnvName,
    provider: provider as ProviderKind,
    ...(model !== undefined && model !== "" ? { model } : {}),
    ...(apiKeyVarName !== undefined && apiKeyVarName !== ""
      ? { apiKeyVarName }
      : {}),
    timeoutMs,
    maxRetries,
    ...(workspaceRoot !== undefined && workspaceRoot.trim() !== ""
      ? { workspaceRoot }
      : {}),
  });
}
