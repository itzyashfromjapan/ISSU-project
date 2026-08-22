/**
 * ISSU Phase 9 — Audit & logger.
 * Spec §10, Architecture Q9.4.
 */

import { createLogger, redactionList } from "@issue/foundation";
import type { Logger, LogLevel } from "@issue/foundation";

export function createWorkspaceLogger(level: LogLevel = "info"): Logger {
  return createLogger({ level, redact: redactionList() });
}
