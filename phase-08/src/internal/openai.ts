/**
 * ISSU Phase 8 — OpenAI provider via httpFetch.
 * Spec §8.
 */

import type { Result } from "@issue/foundation";
import { AppError } from "@issue/foundation";
import { err, ok } from "@issue/foundation";
import { httpFetch } from "@issue/write-execution";
import type { ModelProvider, ProviderConfig } from "./types.js";
import { getProviderAuth } from "./auth.js";
import { createLogger, redactionList } from "@issue/foundation";

export function createOpenAIProvider(config: ProviderConfig): ModelProvider {
  return {
    name: "openai",
    async generateText(
      prompt: string,
      options?: { maxTokens?: number; temperature?: number },
    ): Promise<Result<string, AppError>> {
      if (!prompt) {
        return err(
          new AppError({
            code: "issue.provider.validation",
            message: "prompt must be non-empty",
          }),
        );
      }
      const auth = getProviderAuth(config);
      if (!auth.ok) return auth as unknown as Result<string, AppError>;
      const apiKey = auth.value;
      if (config.model === "") {
        return err(
          new AppError({
            code: "issue.provider.validation",
            message: "model must be non-empty",
          }),
        );
      }
      const url =
        config.baseUrl ?? "https://api.openai.com/v1/chat/completions";
      if (!url.startsWith("https://")) {
        return err(
          new AppError({
            code: "issue.provider.validation",
            message: `baseUrl must be https://, got ${url}`,
          }),
        );
      }
      const logger = createLogger({ level: "info", redact: redactionList() });
      logger.info("model.audit", {
        provider: "openai",
        prompt: prompt.slice(0, 100),
      });
      void JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: options?.maxTokens ?? config.maxTokens ?? 1024,
        temperature: options?.temperature,
      });
      const res = await httpFetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        allowAuth: true,
        allowPrivate: false,
        timeoutMs: config.timeoutMs ?? 30000,
        maxResponseBytes: 1024 * 1024,
        logger,
      });
      if (!res.ok) {
        const code =
          res.error.code === "issue.network.timeout"
            ? "issue.provider.timeout"
            : "issue.provider.not-allowed";
        return err(
          new AppError({ code, message: res.error.message, cause: res.error }),
        );
      }
      if (res.value.status === 429) {
        return err(
          new AppError({
            code: "issue.provider.rate-limited",
            message: "rate limited",
            cause: res.value,
          }),
        );
      }
      if (res.value.status < 200 || res.value.status >= 300) {
        return err(
          new AppError({
            code: "issue.provider.validation",
            message: `provider status ${res.value.status}`,
            cause: res.value,
          }),
        );
      }
      try {
        const parsed = JSON.parse(res.value.body) as {
          choices?: Array<{ message?: { content?: string } }>;
          text?: string;
        };
        const text = parsed.choices?.[0]?.message?.content ?? parsed.text ?? "";
        return ok(text);
      } catch (e) {
        return err(
          new AppError({
            code: "issue.provider.validation",
            message: `parse failed: ${(e as Error).message}`,
            cause: e,
          }),
        );
      }
    },
    async countTokens(text: string): Promise<Result<number, AppError>> {
      return ok(text.length);
    },
  };
}
