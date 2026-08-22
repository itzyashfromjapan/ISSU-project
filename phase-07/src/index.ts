/**
 * ISSU Phase 7 — Write & Execution Tooling: public barrel (§3).
 * Exposes exactly the §3 public surface: 8 types + 9 functions.
 * Every other symbol is internal (§3 NORMATIVE) and SHALL NOT be imported.
 */

export type {
  WriteOptions,
  EditOptions,
  DeleteOptions,
  ProcessOptions,
  ProcessResult,
  GitOptions,
  GitStatus,
  FetchOptions,
} from "./internal/audit.js";
export { writeFile, editFile, deleteFile } from "./internal/write.js";
export { execProcess } from "./internal/process.js";
export { gitStatus, gitDiff, gitCommit, gitBranch } from "./internal/git.js";
export { httpFetch } from "./internal/fetch.js";
export { createToolLogger } from "./internal/audit.js";
export { VERSION } from "./version.js";
