/**
 * ISSU Phase 7 — Git tooling via execProcess.
 * Spec §12, Architecture Q7.4.
 */

import type { Result } from "@issue/foundation";
import { AppError } from "@issue/foundation";
import { err, ok } from "@issue/foundation";
import { isContained } from "@issue/foundation";
import type { GitOptions, GitStatus } from "./audit.js";
import { createToolLogger } from "./audit.js";
import { execProcess } from "./process.js";

function checkRepoPath(repoPath?: string): Result<string, AppError> {
  const cwd = process.cwd();
  const target = repoPath ?? cwd;
  let contained = false;
  try {
    contained = isContained(cwd, target);
  } catch {
    contained = false;
  }
  if (!contained) {
    return err(
      new AppError({
        code: "issue.git.not-contained",
        message: `repoPath not contained: ${target}`,
      }),
    );
  }
  return ok(target);
}

export async function gitStatus(
  options?: GitOptions,
): Promise<Result<GitStatus, AppError>> {
  const logger = options?.logger ?? createToolLogger("info");
  const repoCheck = checkRepoPath(options?.repoPath);
  if (!repoCheck.ok) return repoCheck as unknown as Result<GitStatus, AppError>;
  const repoPath = repoCheck.value;
  const res = await execProcess("git", ["status", "--porcelain", "-b"], {
    cwd: repoPath,
    allowExec: true,
    logger,
  });
  if (!res.ok) return res as unknown as Result<GitStatus, AppError>;
  const out = res.value.stdout;
  // parse ## main...origin/main [ahead 1]
  const lines = out.split("\n");
  const branchLine = lines[0] ?? "";
  const branchMatch = branchLine.match(
    /## ([^.]+)\.\.\.([^ ]+)(?: \[ahead (\d+)\])?(?: \[behind (\d+)\])?/,
  );
  const branch = branchMatch?.[1] ?? "unknown";
  const ahead = branchMatch?.[3] ? parseInt(branchMatch[3], 10) : 0;
  const behind = branchMatch?.[4] ? parseInt(branchMatch[4], 10) : 0;
  const staged: string[] = [];
  const unstaged: string[] = [];
  const untracked: string[] = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    if (line.startsWith("??")) untracked.push(line.slice(3).trim());
    else if (line[0] !== " " && line[0] !== "?")
      staged.push(line.slice(3).trim());
    else unstaged.push(line.slice(3).trim());
  }
  logger.info("git.audit", { tool: "gitStatus", repoPath, branch });
  return ok({ branch, ahead, behind, staged, unstaged, untracked });
}

export async function gitDiff(
  options?: GitOptions,
): Promise<Result<{ stat: string; nameStatus: string }, AppError>> {
  const logger = options?.logger ?? createToolLogger("info");
  const repoCheck = checkRepoPath(options?.repoPath);
  if (!repoCheck.ok)
    return repoCheck as unknown as Result<
      { stat: string; nameStatus: string },
      AppError
    >;
  const repoPath = repoCheck.value;
  const statRes = await execProcess("git", ["diff", "--stat"], {
    cwd: repoPath,
    allowExec: true,
    logger,
  });
  if (!statRes.ok)
    return statRes as unknown as Result<
      { stat: string; nameStatus: string },
      AppError
    >;
  const nameRes = await execProcess(
    "git",
    ["diff", "--cached", "--name-status"],
    { cwd: repoPath, allowExec: true, logger },
  );
  if (!nameRes.ok)
    return nameRes as unknown as Result<
      { stat: string; nameStatus: string },
      AppError
    >;
  return ok({ stat: statRes.value.stdout, nameStatus: nameRes.value.stdout });
}

export async function gitCommit(
  message: string,
  files: readonly string[],
  options?: GitOptions,
): Promise<Result<{ commit: string }, AppError>> {
  const logger = options?.logger ?? createToolLogger("info");
  const repoCheck = checkRepoPath(options?.repoPath);
  if (!repoCheck.ok)
    return repoCheck as unknown as Result<{ commit: string }, AppError>;
  const repoPath = repoCheck.value;
  if (files.length === 0) {
    return err(
      new AppError({
        code: "issue.git.validation",
        message: "gitCommit requires at least one file",
      }),
    );
  }
  if (files.some((f) => f === "-A" || f === "--all")) {
    return err(
      new AppError({
        code: "issue.git.validation",
        message: "git add -A not allowed, use scoped staging",
      }),
    );
  }
  for (const f of files) {
    let contained = false;
    try {
      contained = isContained(repoPath, f);
    } catch {
      contained = false;
    }
    // allow relative paths inside repo
    if (!contained && f.includes("..")) {
      return err(
        new AppError({
          code: "issue.git.not-contained",
          message: `file not contained: ${f}`,
        }),
      );
    }
  }
  const addRes = await execProcess("git", ["add", ...files], {
    cwd: repoPath,
    allowExec: true,
    logger,
  });
  if (!addRes.ok)
    return addRes as unknown as Result<{ commit: string }, AppError>;
  if (addRes.value.exitCode !== 0) {
    return err(
      new AppError({
        code: "issue.git.validation",
        message: `git add failed: ${addRes.value.stderr}`,
      }),
    );
  }
  const diffRes = await execProcess("git", ["diff", "--cached", "--stat"], {
    cwd: repoPath,
    allowExec: true,
    logger,
  });
  if (!diffRes.ok)
    return diffRes as unknown as Result<{ commit: string }, AppError>;
  logger.info("git.audit", {
    tool: "gitCommit",
    repoPath,
    files: files.join(","),
  });
  const commitRes = await execProcess("git", ["commit", "-m", message], {
    cwd: repoPath,
    allowExec: true,
    logger,
  });
  if (!commitRes.ok)
    return commitRes as unknown as Result<{ commit: string }, AppError>;
  if (commitRes.value.exitCode !== 0) {
    return err(
      new AppError({
        code: "issue.git.validation",
        message: `git commit failed: ${commitRes.value.stderr}`,
      }),
    );
  }
  const logRes = await execProcess("git", ["log", "-1", "--pretty=%H"], {
    cwd: repoPath,
    allowExec: true,
    logger,
  });
  if (!logRes.ok)
    return logRes as unknown as Result<{ commit: string }, AppError>;
  return ok({ commit: logRes.value.stdout.trim() });
}

export async function gitBranch(
  options?: GitOptions,
): Promise<Result<{ branch: string; tracking: string }, AppError>> {
  const logger = options?.logger ?? createToolLogger("info");
  const repoCheck = checkRepoPath(options?.repoPath);
  if (!repoCheck.ok)
    return repoCheck as unknown as Result<
      { branch: string; tracking: string },
      AppError
    >;
  const repoPath = repoCheck.value;
  const res = await execProcess("git", ["branch", "-vv"], {
    cwd: repoPath,
    allowExec: true,
    logger,
  });
  if (!res.ok)
    return res as unknown as Result<
      { branch: string; tracking: string },
      AppError
    >;
  const line =
    res.value.stdout.split("\n").find((l) => l.startsWith("*")) ?? "";
  const m = line.match(/\* (\S+)\s+([a-f0-9]+)\s+\[([^\]]+)\]/);
  const branch = m?.[1] ?? "unknown";
  const tracking = m?.[3] ?? "";
  return ok({ branch, tracking });
}
