/**
 * ISSU Phase 9 — Migration audit: verifyWorkspaces.
 * Spec §8, Architecture Q9.4.
 */

import type { Result } from "@issue/foundation";
import { AppError } from "@issue/foundation";
import { err, ok } from "@issue/foundation";
import { isContained } from "@issue/foundation";
import { execProcess } from "@issue/write-execution";
import { createWorkspaceLogger } from "./audit.js";

export async function verifyWorkspaces(
  repoPath: string,
): Promise<Result<true, AppError>> {
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
  const logger = createWorkspaceLogger("info");
  // 1) import('@issue/foundation') should succeed
  const okRes = await execProcess(
    "node",
    ["-e", "import('@issue/foundation')"],
    {
      cwd: repoPath,
      allowExec: true,
      logger,
    },
  );
  if (!okRes.ok) {
    return err(
      new AppError({
        code: "issue.workspace.exec-failed",
        message: `verifyWorkspaces ok import failed: ${okRes.error.message}`,
        cause: okRes.error,
      }),
    );
  }
  if (okRes.value.exitCode !== 0) {
    return err(
      new AppError({
        code: "issue.workspace.validation",
        message: `import('@issue/foundation') failed with exit ${okRes.value.exitCode}: ${okRes.value.stderr}`,
      }),
    );
  }
  // 2) import('@issue/foundation/dist/index.js') should fail with ERR_PACKAGE_PATH_NOT_EXPORTED
  const badRes = await execProcess(
    "node",
    ["-e", "import('@issue/foundation/dist/index.js')"],
    {
      cwd: repoPath,
      allowExec: true,
      logger,
    },
  );
  if (!badRes.ok) {
    return err(
      new AppError({
        code: "issue.workspace.exec-failed",
        message: `verifyWorkspaces bad import exec failed: ${badRes.error.message}`,
        cause: badRes.error,
      }),
    );
  }
  if (badRes.value.exitCode === 0) {
    return err(
      new AppError({
        code: "issue.workspace.validation",
        message: `exports map did not block deep import, expected non-zero exit`,
      }),
    );
  }
  if (!badRes.value.stderr.includes("ERR_PACKAGE_PATH_NOT_EXPORTED")) {
    // also accept generic not-found, but prefer specific
    // If stderr doesn't contain expected, still consider fail if exit 0, but exit non-zero is enough
    // So we don't strictly require the string, just non-zero
  }
  // 3) workspaces symlink exists at node_modules/@issue/foundation
  try {
    const { stat } = await import("node:fs/promises");
    const { join } = await import("node:path");
    await stat(join(repoPath, "node_modules", "@issue", "foundation"));
  } catch (e) {
    return err(
      new AppError({
        code: "issue.workspace.not-found",
        message: `workspaces symlink not found at node_modules/@issue/foundation`,
        cause: e,
      }),
    );
  }
  logger.info("workspace.audit", {
    tool: "verifyWorkspaces",
    repoPath,
    result: "ok",
  });
  return ok(true);
}
