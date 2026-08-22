/**
 * ISSU Phase 8 — callModel seam.
 * Spec §11, Architecture Q8.5.
 */

import type { Result } from "@issue/foundation";
import { AppError } from "@issue/foundation";
import { err } from "@issue/foundation";
import type { ModelProvider, CallModelOptions } from "./types.js";
import { createLogger, redactionList } from "@issue/foundation";

export async function callModel(
  prompt: string,
  provider: ModelProvider,
  options?: CallModelOptions,
): Promise<Result<string, AppError>> {
  if (!prompt) {
    return err(
      new AppError({
        code: "issue.provider.validation",
        message: "prompt must be non-empty",
      }),
    );
  }
  const logger =
    options?.logger ?? createLogger({ level: "info", redact: redactionList() });
  logger.info("model.audit", {
    tool: "callModel",
    provider: provider.name,
    prompt: prompt.slice(0, 100),
  });
  const genOpts: { maxTokens?: number; temperature?: number } = {};
  if (options?.maxTokens !== undefined) genOpts.maxTokens = options.maxTokens;
  if (options?.temperature !== undefined)
    genOpts.temperature = options.temperature;
  const res = await provider.generateText(
    prompt,
    Object.keys(genOpts).length ? genOpts : undefined,
  );
  return res;
}
