/**
 * ISSU v0.2 Platform — public barrel.
 * Resilient provider execution, fail-closed env schema, and preflight checks
 * composed over the frozen Phase 01-17 barrels (composition only).
 */

export type { PlatformEnv, IssuEnvName, ProviderKind } from "./internal/env.js";
export { loadPlatformEnv } from "./internal/env.js";

export type { RetryPolicy } from "./internal/retry.js";
export {
  DEFAULT_RETRY_POLICY,
  RETRYABLE_CODES,
  createRetryPolicy,
  computeBackoffMs,
  isRetryable,
} from "./internal/retry.js";

export type { ResilientOptions } from "./internal/provider-client.js";
export { createResilientProvider } from "./internal/provider-client.js";

export type { PreflightCheck, PreflightReport } from "./internal/health.js";
export { runPreflight } from "./internal/health.js";

export { createPlatformLogger } from "./internal/audit.js";
export { VERSION } from "./version.js";
