/**
 * ISSU v0.2 Platform — resilient provider execution.
 * Decorates the frozen Phase 8 ModelProvider seam with bounded retries,
 * exponential backoff, rate-limit handling, and content-free audit metadata.
 * Governance record sections 4-5, 7, 11. Exhaustion returns the LAST
 * underlying error unchanged (transparent, fail-closed).
 */

import type { Result } from "@issue/foundation";
import { AppError, createLogger, redactionList } from "@issue/foundation";
import type { Logger } from "@issue/foundation";
import type { ModelProvider } from "@issue/model-provider";
import { createRetryPolicy, computeBackoffMs, isRetryable } from "./retry.js";
import type { RetryPolicy } from "./retry.js";

export type ResilientOptions = {
  readonly policy?: Partial<RetryPolicy>;
  /** Injectable delay for tests; defaults to real setTimeout. */
  readonly sleep?: (ms: number) => Promise<void>;
  readonly logger?: Logger;
  /** Caller-supplied correlation id propagated into audit contexts. */
  readonly correlationId?: string;
};

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createResilientProvider(
  inner: ModelProvider,
  options?: ResilientOptions,
): ModelProvider {
  const policy = createRetryPolicy(options?.policy);
  const logger =
    options?.logger ?? createLogger({ level: "info", redact: redactionList() });
  const sleep = options?.sleep ?? defaultSleep;

  async function attemptGenerate(
    prompt: string,
    callOptions?: { maxTokens?: number; temperature?: number },
  ): Promise<Result<string, AppError>> {
    let lastError: AppError | undefined;
    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      const started = Date.now();
      const result = await inner.generateText(prompt, callOptions);
      const elapsed = Date.now() - started;
      if (result.ok) {
        logger.info("platform.audit", {
          op: "model.call",
          provider: inner.name,
          attempt,
          ms: elapsed,
          outcome: "ok",
          ...(options?.correlationId !== undefined
            ? { correlationId: options.correlationId }
            : {}),
        });
        // Response validation: never surface an empty generation as success.
        if (result.value.trim() === "") {
          return {
            ok: false,
            error: new AppError({
              code: "issue.provider.empty-result",
              message: "provider returned an empty result",
            }),
          };
        }
        return result;
      }
      lastError = result.error;
      logger.warn("platform.audit", {
        op: "model.call",
        provider: inner.name,
        attempt,
        ms: elapsed,
        outcome: "err",
        code: result.error.code,
        ...(options?.correlationId !== undefined
          ? { correlationId: options.correlationId }
          : {}),
      });
      if (!isRetryable(result.error) || attempt === policy.maxAttempts) {
        return result; // transparent propagation of the last underlying error
      }
      const delayMs = computeBackoffMs(policy, attempt - 1);
      if (delayMs > 0) await sleep(delayMs);
    }
    // Unreachable (loop returns), kept for exhaustiveness.
    return { ok: false, error: lastError as AppError };
  }

  return {
    name: inner.name,
    generateText: attemptGenerate,
    async countTokens(text: string) {
      // Local/trivial operation: single attempt, no retry semantics.
      return inner.countTokens(text);
    },
  };
}
