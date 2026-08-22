/**
 * ISSU Phase 6 — Observability wiring.
 * Spec §13, Architecture Q6.4. Reuses Phase 1 Logger + redactionList.
 */

import { createLogger, redactionList } from "@issue/foundation";
import type { Logger, LogLevel } from "@issue/foundation";

export function createCliLogger(level: LogLevel = "info"): Logger {
  return createLogger({ level, redact: redactionList() });
}

export function logProgress(
  logger: Logger,
  event: "cli.invoked" | "config.resolved" | "run.dispatched" | "run.completed",
  ctx: Record<string, unknown>,
): void {
  logger.info(event, ctx);
}
