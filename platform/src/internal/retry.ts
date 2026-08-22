/**
 * ISSU v0.2 Platform — bounded retry policy with exponential backoff.
 * Governance record sections 4-5. Bounded: maxAttempts <= 5, delay cap 5s.
 */

import type { AppError } from "@issue/foundation";

export type RetryPolicy = {
  readonly maxAttempts: number; // 1..5 (1 = no retry)
  readonly baseDelayMs: number; // >= 0
  readonly maxDelayMs: number; // >= baseDelayMs, capped at 5000 by factory
  readonly factor: number; // >= 1
  readonly jitter: boolean;
};

export const RETRYABLE_CODES: ReadonlySet<string> = new Set([
  "issue.provider.rate-limited",
  "issue.provider.timeout",
  "issue.network.timeout",
]);

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 2000,
  factor: 2,
  jitter: true,
};

export function createRetryPolicy(
  overrides?: Partial<RetryPolicy>,
): RetryPolicy {
  const merged: RetryPolicy = { ...DEFAULT_RETRY_POLICY, ...overrides };
  return {
    maxAttempts: Math.min(Math.max(Math.trunc(merged.maxAttempts), 1), 5),
    baseDelayMs: Math.max(merged.baseDelayMs, 0),
    maxDelayMs: Math.min(Math.max(merged.maxDelayMs, merged.baseDelayMs), 5000),
    factor: Math.max(merged.factor, 1),
    jitter: merged.jitter,
  };
}

export function isRetryable(error: AppError): boolean {
  return RETRYABLE_CODES.has(error.code);
}

/** Backoff for attempt n (0-based failures): base * factor^n, capped, optional full jitter. */
export function computeBackoffMs(
  policy: RetryPolicy,
  failedAttempts: number,
): number {
  const raw = policy.baseDelayMs * Math.pow(policy.factor, failedAttempts);
  const capped = Math.min(raw, policy.maxDelayMs);
  if (!policy.jitter) return capped;
  return Math.floor(Math.random() * capped);
}
