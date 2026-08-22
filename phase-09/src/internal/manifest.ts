/**
 * ISSU Phase 9 — Workspace manifest helpers.
 * Spec §7, Architecture Q9.1.
 */

import type { Result } from "@issue/foundation";
import { AppError } from "@issue/foundation";
import { err, ok } from "@issue/foundation";
import { isContained } from "@issue/foundation";

export type WorkspaceConfig = {
  readonly workspaces: readonly string[];
  readonly packageManager: string;
  readonly engines: { readonly node: string };
};

export async function getWorkspaceConfig(
  repoPath: string,
): Promise<Result<WorkspaceConfig, AppError>> {
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
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const content = await readFile(join(repoPath, "package.json"), "utf8");
    let pkg: unknown;
    try {
      pkg = JSON.parse(content) as unknown;
    } catch (e) {
      return err(
        new AppError({
          code: "issue.workspace.validation",
          message: `package.json parse failed: ${(e as Error).message}`,
          cause: e,
        }),
      );
    }
    const rec = pkg as Record<string, unknown>;
    const ws = rec["workspaces"];
    if (
      !Array.isArray(ws) ||
      ws.length === 0 ||
      !ws.every((x) => typeof x === "string")
    ) {
      return err(
        new AppError({
          code: "issue.workspace.validation",
          message: `workspaces must be string[] with at least one entry`,
        }),
      );
    }
    if (!ws.includes("phase-09") && !ws.includes("phase-*")) {
      return err(
        new AppError({
          code: "issue.workspace.validation",
          message: `workspaces must include phase-09`,
        }),
      );
    }
    const pm =
      typeof rec["packageManager"] === "string"
        ? (rec["packageManager"] as string)
        : "npm@10";
    const engines = rec["engines"] as Record<string, unknown> | undefined;
    const nodeEng =
      typeof engines?.["node"] === "string"
        ? (engines["node"] as string)
        : ">=22.9.0";
    return ok({
      workspaces: ws as readonly string[],
      packageManager: pm,
      engines: { node: nodeEng },
    });
  } catch (e) {
    return err(
      new AppError({
        code: "issue.workspace.not-found",
        message: `getWorkspaceConfig failed: ${(e as Error).message}`,
        cause: e,
      }),
    );
  }
}
