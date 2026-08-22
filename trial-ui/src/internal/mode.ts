/**
 * ISSU v0.2 Trial UI — provider mode resolution.
 * stub (default) | live (credentials present) | missing-credentials | unconfigured.
 * Key VALUES are never read here — only whether getSecret(name) resolves.
 */

import type { Result } from "@issue/foundation";
import { AppError } from "@issue/foundation";
import { err, ok } from "@issue/foundation";
import { createLocalProvider, getProviderAuth } from "@issue/model-provider";
import type { ModelProvider, ProviderConfig } from "@issue/model-provider";
import { loadPlatformEnv } from "@issue/platform";
import type { PlatformEnv } from "@issue/platform";

export type ProviderMode =
  "stub" | "live" | "missing-credentials" | "unconfigured";

export type ResolvedMode = {
  readonly mode: ProviderMode;
  readonly env?: PlatformEnv;
  readonly detail: string;
  readonly error?: string;
};

export function resolveMode(
  source?: Readonly<Record<string, string | undefined>>,
): ResolvedMode {
  const loaded = loadPlatformEnv(source);
  if (!loaded.ok) {
    return {
      mode: "unconfigured",
      detail:
        "environment schema invalid — fix ISSU_* variables to enable live mode",
      error: loaded.error.message,
    };
  }
  const env = loaded.value;
  if (env.provider === "local") {
    return {
      mode: "stub",
      env,
      detail: "deterministic stub provider (offline)",
    };
  }
  // Remote provider: verify the credential NAME resolves in the environment.
  const cfg: ProviderConfig = {
    provider: env.provider,
    model: env.model ?? "",
    apiKeyEnvVar: env.apiKeyVarName ?? "",
    timeoutMs: env.timeoutMs,
  };
  const auth = getProviderAuth(cfg);
  if (!auth.ok) {
    return {
      mode: "missing-credentials",
      env,
      detail: `set ${env.apiKeyVarName} in your environment to enable live mode`,
      error: auth.error.message,
    };
  }
  return {
    mode: "live",
    env,
    detail: `live via ${env.provider} (${env.model ?? "model"})`,
  };
}

/** Builds the ModelProvider for a resolved live/stub mode. */
export function buildProvider(
  mode: ResolvedMode,
): Result<ModelProvider, AppError> {
  if (mode.mode === "unconfigured") {
    return err(
      new AppError({
        code: "issue.trial.unconfigured",
        message: mode.detail,
      }),
    );
  }
  if (mode.mode === "missing-credentials") {
    return err(
      new AppError({
        code: "issue.trial.missing-credentials",
        message: mode.detail,
      }),
    );
  }
  const env = mode.env;
  if (!env) {
    return err(
      new AppError({ code: "issue.trial.unconfigured", message: "no env" }),
    );
  }
  if (env.provider === "local") {
    return ok(createLocalProvider());
  }
  // Remote adapters are constructed through the frozen Phase 8 factories;
  // the key VALUE is fetched inside those adapters at call time.
  return err(
    new AppError({
      code: "issue.provider.validation",
      message: "use factory construction for remote providers",
    }),
  );
}
