/**
 * ISSU Phase 6 — Configuration & CLI: public barrel (§3).
 * Exposes exactly the §3 public surface: 6 types + 3 functions.
 * Every other symbol is internal (§3 NORMATIVE) and SHALL NOT be imported.
 */

export type {
  ConfigSchema,
  ResolvedConfig,
  ConfigProvenance,
  ConfigProvenanceEntry,
  ConfigSource,
  LogLevel,
} from "./internal/config.js";
export {
  resolveConfig,
  verifyConfig,
  getDefaultConfig,
} from "./internal/config.js";

export type { CliArgs, CliResult } from "./internal/cli.js";
export { parseArgs, runCli, HELP_TEXT } from "./internal/cli.js";

export { createCliLogger, logProgress } from "./internal/observability.js";
export { VERSION } from "./version.js";
