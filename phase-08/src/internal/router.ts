/**
 * ISSU Phase 8 — ModelRouter.
 * Spec §10, Architecture Q8.2.
 */

import type { Result } from "@issue/foundation";
import { AppError } from "@issue/foundation";
import { err, ok } from "@issue/foundation";
import type { ModelProvider, ModelRouter } from "./types.js";

export function createModelRouter(
  providers: readonly ModelProvider[],
): ModelRouter {
  return {
    route(
      _task: { objective: string; requiredCapabilities?: readonly string[] },
      _config: { providers?: Record<string, unknown> },
    ): Result<ModelProvider, AppError> {
      if (providers.length === 0) {
        return err(
          new AppError({
            code: "issue.provider.not-configured",
            message: "no providers",
          }),
        );
      }
      const cfg = _config.providers as Record<string, unknown> | undefined;
      const preferred = cfg?.["preferredProvider"] as string | undefined;
      if (preferred) {
        const found = providers.find((p) => p.name === preferred);
        if (found) return ok(found);
        return err(
          new AppError({
            code: "issue.provider.not-configured",
            message: `preferredProvider ${preferred} not found`,
          }),
        );
      }
      // cost-aware via order, first is cheapest
      return ok(providers[0] as ModelProvider);
    },
  };
}
