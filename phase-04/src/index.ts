/**
 * ISSU Phase 4 — Research: public barrel (§4).
 *
 * Exposes exactly the §4 public surface: `VERSION`, `runResearchTask`, and the
 * 12 public types. Every other symbol is internal (§4 DECISION) and SHALL NOT
 * be imported by consumers. Phase 4 consumes the frozen Phase 1/2/3 packages
 * only through their public barrels (§5); no deep imports.
 */

export { VERSION } from "./version.js";

export { runResearchTask } from "./internal/machine.js";

export type { ResearchTaskRequest } from "./internal/model.js";
export type { ResearchTaskOptions } from "./internal/model.js";
export type { ResearchTaskResult } from "./internal/model.js";
export type { Claim } from "./internal/model.js";
export type { EvidenceLink } from "./internal/model.js";
export type { SourceReference } from "./internal/model.js";
export type { CredibilityProfile } from "./internal/model.js";
export type { ConflictRecord } from "./internal/model.js";
export type { EvaluationRecord } from "./internal/model.js";
export type { ResearchDecisionProvider } from "./internal/provider.js";
export type { ResearchTaskStatus } from "./internal/model.js";
export type { SupportClass } from "./internal/model.js";
