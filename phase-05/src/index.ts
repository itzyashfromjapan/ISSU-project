/**
 * ISSU Phase 5 — Data and Analytics Agents: public barrel (§2).
 *
 * Exposes exactly the §2 public surface: `runAnalyticsTask` and the 13 public
 * types. Every other symbol is internal (§2 NORMATIVE) and SHALL NOT be
 * imported by consumers. Phase 5 consumes the frozen Phase 1/2/3 packages
 * only through their public barrels (§14/§15); no deep imports. Phase 4 is
 * NOT consumed by default (§15).
 */

export { runAnalyticsTask } from "./internal/machine.js";

export type { AnalyticsTaskRequest } from "./internal/model.js";
export type { AnalyticsTaskOptions } from "./internal/model.js";
export type { AnalyticsTaskResult } from "./internal/model.js";
export type { AnalyticsTaskStatus } from "./internal/model.js";
export type { DataSourceRef } from "./internal/model.js";
export type { DatasetRef } from "./internal/model.js";
export type { TransformRecord } from "./internal/model.js";
export type { AnalyticalFinding } from "./internal/model.js";
export type { AnalyticalReport } from "./internal/model.js";
export type { ProvenanceChain } from "./internal/model.js";
export type { UncertaintyInfo } from "./internal/model.js";
export type { AnalyticsEvaluationRecord } from "./internal/model.js";
export type { AnalyticsDecisionProvider } from "./internal/provider.js";
