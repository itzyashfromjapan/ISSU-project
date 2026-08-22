/**
 * ISSU v0.2 Platform — audit logger factory.
 * Governance record section 7: content-free contexts only.
 */

import { createLogger, redactionList } from "@issue/foundation";
import type { Logger, LogLevel } from "@issue/foundation";

export function createPlatformLogger(level: LogLevel = "info"): Logger {
  return createLogger({ level, redact: redactionList() });
}

export function createWorkspaceAuditLogger(level: LogLevel = "info"): Logger {
  return createPlatformLogger(level);
}
