/**
 * ISSU v0.2 Platform — fail-closed preflight checks.
 * Governance record sections 3 and 11: abort before dispatching work.
 */

import type { Result } from "@issue/foundation";
import { AppError } from "@issue/foundation";
import { ok } from "@issue/foundation";
import { createLocalProvider } from "@issue/model-provider";
import { verifyWorkspaces } from "@issue/workspace";
import type { PlatformEnv } from "./env.js";
import { createWorkspaceAuditLogger } from "./audit.js";

export type PreflightCheck = {
  readonly name: string;
  readonly passed: boolean;
  readonly detail?: string;
};

export type PreflightReport = {
  readonly passed: boolean;
  readonly checks: readonly PreflightCheck[];
};

export async function runPreflight(
  env: PlatformEnv,
  options?: { repoPath?: string; logger?: import("@issue/foundation").Logger },
): Promise<Result<PreflightReport, AppError>> {
  const logger = options?.logger ?? createWorkspaceAuditLogger("info");
  const checks: PreflightCheck[] = [];

  // 1) Environment schema already validated by caller (loadPlatformEnv).
  checks.push({
    name: "env-schema",
    passed: true,
    detail: `env=${env.env} provider=${env.provider}`,
  });

  // 2) Provider credential-name presence (name only — never the value).
  if (env.provider !== "local") {
    checks.push({
      name: "provider-credential-name",
      passed: env.apiKeyVarName !== undefined,
      ...(env.apiKeyVarName !== undefined ? { detail: env.apiKeyVarName } : {}),
    });
  } else {
    checks.push({
      name: "provider-credential-name",
      passed: true,
      detail: "local provider needs none",
    });
  }

  // 3) Workspace integrity when a root is configured or discoverable.
  if (env.workspaceRoot !== undefined) {
    const ws = await verifyWorkspaces(env.workspaceRoot);
    checks.push({
      name: "workspaces",
      passed: ws.ok,
      detail: ws.ok ? `verified at ${env.workspaceRoot}` : ws.error.code,
    });
  }

  // 4) Provider smoke test on the deterministic local stub (offline, content-safe).
  try {
    const local = createLocalProvider();
    const smoke = await local.generateText("preflight");
    checks.push({
      name: "provider-smoke",
      passed: smoke.ok && smoke.value.includes("preflight"),
      detail: "local deterministic stub",
    });
  } catch (e) {
    checks.push({
      name: "provider-smoke",
      passed: false,
      detail: (e as Error).message,
    });
  }

  const failed = checks.filter((c) => !c.passed);
  for (const c of failed) {
    logger.warn("platform.preflight", {
      check: c.name,
      outcome: "fail",
      detail: c.detail ?? "",
    });
  }
  logger.info("platform.preflight", {
    outcome: failed.length === 0 ? "pass" : "fail",
    total: checks.length,
    failed: failed.length,
  });

  return ok({ passed: failed.length === 0, checks });
}
