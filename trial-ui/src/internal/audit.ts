/**
 * ISSU v0.2 Trial UI — capturing audit logger.
 * Implements the Phase 1 Logger contract and records content-free events
 * into a bounded array for display in the execution view.
 */

import type { Logger, LogLevel } from "@issue/foundation";

export type AuditEvent = {
  readonly level: LogLevel;
  readonly msg: string;
  readonly ctx: Record<string, unknown>;
};

export class ArrayLogger implements Logger {
  readonly events: AuditEvent[] = [];
  constructor(
    private readonly level: LogLevel = "info",
    private readonly max = 100,
  ) {}

  private record(level: LogLevel, msg: string, ctx?: object): void {
    if (this.events.length >= this.max) return;
    this.events.push({
      level,
      msg,
      ctx: (ctx ?? {}) as Record<string, unknown>,
    });
  }
  trace(_msg: string, _ctx?: object): void {}
  debug(msg: string, ctx?: object): void {
    if (this.level === "debug" || this.level === "trace")
      this.record("debug", msg, ctx);
  }
  info(msg: string, ctx?: object): void {
    this.record("info", msg, ctx);
  }
  warn(msg: string, ctx?: object): void {
    this.record("warn", msg, ctx);
  }
  error(msg: string, ctx?: object): void {
    this.record("error", msg, ctx);
  }
  fatal(msg: string, ctx?: object): void {
    this.record("fatal", msg, ctx);
  }
  child(_bindings?: object): Logger {
    return this;
  }
}
