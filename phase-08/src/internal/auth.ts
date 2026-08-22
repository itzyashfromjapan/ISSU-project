/**
 * ISSU Phase 8 — Credential protection.
 * Spec §8, Architecture Q8.3.
 */

import type { Result } from "@issue/foundation";
import { AppError } from "@issue/foundation";
import { err, ok } from "@issue/foundation";
import { getSecret } from "@issue/foundation";
import type { ProviderConfig } from "./types.js";

export function getProviderAuth(
  config: ProviderConfig,
): Result<string, AppError> {
  if (config.provider === "local") {
    return ok("local-no-auth");
  }
  const key = getSecret(config.apiKeyEnvVar);
  if (key === undefined) {
    return err(
      new AppError({
        code: "issue.provider.auth",
        message: `missing apiKey for ${config.apiKeyEnvVar}`,
      }),
    );
  }
  return ok(key);
}
