/**
 * ISSU Phase 8 — Local stub provider (deterministic).
 * Spec §9, Architecture Q8.1.
 */

import type { Result } from "@issue/foundation";
import { ok } from "@issue/foundation";
import type { ModelProvider } from "./types.js";

export function createLocalProvider(): ModelProvider {
  return {
    name: "local",
    async generateText(
      prompt: string,
    ): Promise<Result<string, import("@issue/foundation").AppError>> {
      return ok(`stub response for: ${prompt}`);
    },
    async countTokens(
      text: string,
    ): Promise<Result<number, import("@issue/foundation").AppError>> {
      return ok(text.length);
    },
  };
}
