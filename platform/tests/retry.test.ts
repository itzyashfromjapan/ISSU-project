import { describe, it, expect } from "vitest";
import {
  DEFAULT_RETRY_POLICY,
  RETRYABLE_CODES,
  computeBackoffMs,
  createRetryPolicy,
  isRetryable,
} from "../src/internal/retry.js";
import { AppError } from "@issue/foundation";

describe("createRetryPolicy — bounded by governance record", () => {
  it("clamps maxAttempts to 1..5", () => {
    expect(createRetryPolicy({ maxAttempts: 0 }).maxAttempts).toBe(1);
    expect(createRetryPolicy({ maxAttempts: 99 }).maxAttempts).toBe(5);
    expect(DEFAULT_RETRY_POLICY.maxAttempts).toBe(3);
  });

  it("caps delay at 5000ms and enforces factor >= 1", () => {
    const p = createRetryPolicy({
      baseDelayMs: 100,
      maxDelayMs: 999999,
      factor: 0,
      jitter: false,
    });
    expect(p.maxDelayMs).toBeLessThanOrEqual(5000);
    expect(p.factor).toBe(1);
  });

  it("keeps maxDelay >= baseDelay", () => {
    const p = createRetryPolicy({
      baseDelayMs: 900,
      maxDelayMs: 100,
      jitter: false,
    });
    expect(p.maxDelayMs).toBeGreaterThanOrEqual(p.baseDelayMs);
  });
});

describe("computeBackoffMs — exponential with cap and optional jitter", () => {
  const policy = {
    maxAttempts: 5,
    baseDelayMs: 200,
    maxDelayMs: 2000,
    factor: 2,
    jitter: false,
  };
  it("doubles per failed attempt without jitter", () => {
    expect(computeBackoffMs(policy, 0)).toBe(200);
    expect(computeBackoffMs(policy, 1)).toBe(400);
    expect(computeBackoffMs(policy, 2)).toBe(800);
  });
  it("caps at maxDelayMs", () => {
    expect(computeBackoffMs(policy, 10)).toBe(2000);
  });
  it("full jitter stays within [0, cap)", () => {
    const j = { ...policy, jitter: true };
    for (let i = 0; i < 20; i++) {
      const v = computeBackoffMs(j, 3);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(j.maxDelayMs);
    }
  });
});

describe("isRetryable — governed code set only", () => {
  it("accepts exactly the three retryable codes", () => {
    for (const code of [
      "issue.provider.rate-limited",
      "issue.provider.timeout",
      "issue.network.timeout",
    ]) {
      expect(isRetryable(new AppError({ code, message: "x" }))).toBe(true);
    }
  });
  it("rejects non-retryable codes (auth/validation/not-allowed)", () => {
    for (const code of [
      "issue.provider.auth",
      "issue.provider.validation",
      "issue.provider.not-allowed",
    ]) {
      expect(isRetryable(new AppError({ code, message: "x" }))).toBe(false);
    }
    expect(RETRYABLE_CODES.size).toBe(3);
  });
});
