/**
 * ISSU Phase 7 — Audit & permission types.
 * Spec §3, Architecture Q7.6, Q7.7.
 */

import { createLogger, redactionList } from "@issue/foundation";
import type { Logger, LogLevel } from "@issue/foundation";

export type WriteOptions = {
  readonly allowWrite?: boolean;
  readonly maxBytesPerWrite?: number;
  readonly logger?: Logger;
};

export type EditOptions = {
  readonly allowWrite?: boolean;
  readonly logger?: Logger;
};

export type DeleteOptions = {
  readonly allowWrite?: boolean;
  readonly logger?: Logger;
};

export type ProcessOptions = {
  readonly cwd?: string;
  readonly timeoutMs?: number;
  readonly maxBytes?: number;
  readonly allowExec?: boolean;
  readonly logger?: Logger;
};

export type ProcessResult = {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
};

export type GitOptions = {
  readonly repoPath?: string;
  readonly logger?: Logger;
};

export type GitStatus = {
  readonly branch: string;
  readonly ahead: number;
  readonly behind: number;
  readonly staged: readonly string[];
  readonly unstaged: readonly string[];
  readonly untracked: readonly string[];
};

export type FetchOptions = {
  readonly timeoutMs?: number;
  readonly maxResponseBytes?: number;
  readonly allowPrivate?: boolean;
  readonly allowAuth?: boolean;
  readonly headers?: Record<string, string>;
  readonly logger?: Logger;
};

export function createToolLogger(level: LogLevel = "info"): Logger {
  return createLogger({ level, redact: redactionList() });
}
