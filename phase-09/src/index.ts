/**
 * ISSU Phase 9 — Workspace & Monorepo Migration: public barrel (§3).
 * Exposes exactly the §3 public surface: 3 types + 3 functions.
 * Every other symbol is internal (§3 NORMATIVE) and SHALL NOT be imported.
 */

export type { WorkspaceConfig } from "./internal/manifest.js";
export type { CheckAllResult } from "./internal/check.js";
export { getWorkspaceConfig } from "./internal/manifest.js";
export { verifyWorkspaces } from "./internal/verify.js";
export { runCheckAll } from "./internal/check.js";
export { createWorkspaceLogger } from "./internal/audit.js";
export { VERSION } from "./version.js";
