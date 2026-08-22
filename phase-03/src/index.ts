/**
 * ISSU Phase 3 — Integration: public barrel.
 *
 * Phase 3 consumes the frozen Phase 1 (`@issue/foundation`) and Phase 2
 * (`@issue/tool-runtime`) contracts ONLY through their public barrels
 * (SPECIFICATION.md §2; ARCHITECTURE.md §31). No deep imports, no internals.
 *
 * P4-1 exposes the Phase 3 components finalized by P3-2:
 * - the connection harness entry (`runIntegrationTask`, ARCHITECTURE.md §29);
 * - the AD-1 translation adapter (`translateToolError`, ARCHITECTURE.md §28);
 * - the deterministic provider stub (`createDeterministicProviderStub`,
 *   ARCHITECTURE.md §30);
 * - the Phase 3 DEFAULT_BOUNDS (ARCHITECTURE.md §29.3).
 */

export { DEFAULT_BOUNDS } from "./internal/bounds.js";

export { runIntegrationTask } from "./internal/harness.js";
export type {
  HarnessRecord,
  IntegrationTaskRequest,
  IntegrationTaskResult,
} from "./internal/harness.js";

export { createDeterministicProviderStub } from "./internal/stub.js";
export type {
  DeterministicProviderStubConfig,
  DeterministicStubTable,
} from "./internal/stub.js";

export { isFailedToolResult, translateToolError } from "./internal/ad1.js";
export type { FailedToolResult, ToolErrorDetails } from "./internal/ad1.js";
