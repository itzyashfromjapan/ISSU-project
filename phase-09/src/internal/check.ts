/**
 * ISSU Phase 9 — Unified verification: runCheckAll.
 * Spec §9, Architecture Q9.3.
 */

import type { Result } from "@issue/foundation";
import { AppError } from "@issue/foundation";
import { err, ok } from "@issue/foundation";
import { isContained } from "@issue/foundation";
import { execProcess } from "@issue/write-execution";
import { createWorkspaceLogger } from "./audit.js";
import type { Logger } from "@issue/foundation";

export type CheckAllResult = {
  readonly passed: readonly string[];
  readonly failed: readonly string[];
};

export async function runCheckAll(
  repoPath: string,
  options?: { logger?: Logger },
): Promise<Result<CheckAllResult, AppError>> {
  let contained = false;
  try {
    contained = isContained(process.cwd(), repoPath);
  } catch {
    contained = false;
  }
  if (!contained) {
    return err(
      new AppError({
        code: "issue.workspace.not-contained",
        message: `repoPath not contained: ${repoPath}`,
      }),
    );
  }
  const logger = options?.logger ?? createWorkspaceLogger("info");
  const res = await execProcess("npm", ["--workspaces", "run", "check"], {
    cwd: repoPath,
    allowExec: true,
    timeoutMs: 120000,
    maxBytes: 1024 * 1024,
    logger,
  });
  if (!res.ok) {
    return err(
      new AppError({
        code: "issue.workspace.exec-failed",
        message: `runCheckAll exec failed: ${res.error.message}`,
        cause: res.error,
      }),
    );
  }
  // In Phase 9 minimal, we don't parse per-workspace results; we treat overall exitCode 0 as all passed
  if (res.value.exitCode === 0) {
    return ok({ passed: ["all"], failed: [] });
  }
  return ok({ passed: [], failed: ["unknown"] });
}
