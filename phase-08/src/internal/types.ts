/**
 * ISSU Phase 8 — Provider types.
 * Spec §6, §7.
 */

import type { Result } from "@issue/foundation";
import type { AppError } from "@issue/foundation";

export type ProviderConfig = {
  readonly provider: "anthropic" | "openai" | "local";
  readonly model: string;
  readonly apiKeyEnvVar: string;
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  readonly maxTokens?: number;
};

export interface ModelProvider {
  readonly name: "anthropic" | "openai" | "local";
  generateText(
    prompt: string,
    options?: { maxTokens?: number; temperature?: number },
  ): Promise<Result<string, AppError>>;
  countTokens(text: string): Promise<Result<number, AppError>>;
}

export type ProviderResult<T> = Result<T, AppError>;

export type ModelRouter = {
  route(
    task: { objective: string; requiredCapabilities?: readonly string[] },
    config: { providers?: Record<string, unknown> },
  ): Result<ModelProvider, AppError>;
};

export type CallModelOptions = {
  readonly maxTokens?: number;
  readonly temperature?: number;
  readonly logger?: import("@issue/foundation").Logger;
};
