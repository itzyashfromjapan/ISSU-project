/**
 * ISSU Phase 6 — CLI: parseArgs, runCli, help.
 * Spec §8, §10, §11, §14, §15. Architecture Q6.3, Q6.4, Q6.8, Q6.11.
 */

import type { Result } from "@issue/foundation";
import { AppError } from "@issue/foundation";
import { err, isOk, ok } from "@issue/foundation";
import { isContained } from "@issue/foundation";
import { getDefaultConfig, resolveConfig, verifyConfig } from "./config.js";
import type { ConfigProvenance } from "./config.js";
import { createCliLogger } from "./observability.js";
import type { Logger } from "@issue/foundation";

// --- Public types (§3) -----------------------------------------------------

export type CliArgs = {
  readonly command: "help" | "config:show" | "run";
  readonly runTarget?: "tool-runtime" | "analytics";
  readonly configPath?: string;
  readonly verbose?: boolean;
};

export type CliResult = {
  readonly exitCode: 0 | 1 | 2;
  readonly stdout: string;
  readonly stderr: string;
};

// --- Help text -------------------------------------------------------------

export const HELP_TEXT = `issue — ISSU Configuration & CLI (Phase 6)

Usage:
  issue --help                          Show this help
  issue -h                              Show this help
  issue config --show [--config <path>] [--verbose]   Show resolved config (redacted)
  issue run [--tool-runtime|--analytics] [--config <path>] [--verbose]   Run frozen pipeline

Options:
  --config <path>   Path to config file (JSONC, must be inside cwd)
  --verbose         Enable verbose logging
  --help, -h        Show help

Examples:
  issue --help
  issue config --show
  issue run --analytics --config ./issu.config.jsonc
  issue run --tool-runtime
`;

// --- parseArgs (pure, §10) -------------------------------------------------

export function parseArgs(argv: readonly string[]): Result<CliArgs, AppError> {
  if (argv.length === 0) {
    return ok({ command: "help" });
  }
  if (argv.length === 1 && (argv[0] === "--help" || argv[0] === "-h")) {
    return ok({ command: "help" });
  }
  if (argv[0] === "config" && argv[1] === "--show") {
    const rest = argv.slice(2);
    let configPath: string | undefined;
    let verbose: boolean | undefined;
    for (let i = 0; i < rest.length; i++) {
      const tok = rest[i];
      if (tok === "--config") {
        const next = rest[i + 1];
        if (!next || next.startsWith("--")) {
          return err(
            new AppError({
              code: "issue.cli.missing-required",
              message: "--config requires a path",
            }),
          );
        }
        configPath = next;
        i++;
      } else if (tok === "--verbose") {
        verbose = true;
      } else if (tok === "--help" || tok === "-h") {
        return ok({ command: "help" });
      } else {
        return err(
          new AppError({
            code: "issue.cli.unknown-argument",
            message: `unknown argument: ${tok}`,
          }),
        );
      }
    }
    return ok({
      command: "config:show",
      ...(configPath ? { configPath } : {}),
      ...(verbose ? { verbose } : {}),
    });
  }
  if (argv[0] === "run") {
    const rest = argv.slice(1);
    let runTarget: "tool-runtime" | "analytics" | undefined;
    let configPath: string | undefined;
    let verbose: boolean | undefined;
    for (let i = 0; i < rest.length; i++) {
      const tok = rest[i];
      if (tok === "--tool-runtime") {
        if (runTarget) {
          return err(
            new AppError({
              code: "issue.cli.unknown-argument",
              message: "run target already specified",
            }),
          );
        }
        runTarget = "tool-runtime";
      } else if (tok === "--analytics") {
        if (runTarget) {
          return err(
            new AppError({
              code: "issue.cli.unknown-argument",
              message: "run target already specified",
            }),
          );
        }
        runTarget = "analytics";
      } else if (tok === "--config") {
        const next = rest[i + 1];
        if (!next || next.startsWith("--")) {
          return err(
            new AppError({
              code: "issue.cli.missing-required",
              message: "--config requires a path",
            }),
          );
        }
        configPath = next;
        i++;
      } else if (tok === "--verbose") {
        verbose = true;
      } else if (tok === "--help" || tok === "-h") {
        return ok({ command: "help" });
      } else {
        return err(
          new AppError({
            code: "issue.cli.unknown-argument",
            message: `unknown argument: ${tok}`,
          }),
        );
      }
    }
    return ok({
      command: "run",
      runTarget: runTarget ?? "analytics",
      ...(configPath ? { configPath } : {}),
      ...(verbose ? { verbose } : {}),
    });
  }
  return err(
    new AppError({
      code: "issue.cli.unknown-argument",
      message: `unknown command: ${argv[0]}`,
    }),
  );
}

// --- runCli (§11) ----------------------------------------------------------

export async function runCli(
  argv: readonly string[],
  options?: {
    env?: Readonly<Record<string, string | undefined>>;
    logger?: Logger;
  },
): Promise<CliResult> {
  const parseResult = parseArgs(argv);
  if (!parseResult.ok) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: parseResult.error.message,
    };
  }
  const args = parseResult.value;
  if (args.command === "help") {
    return { exitCode: 0, stdout: HELP_TEXT, stderr: "" };
  }

  const verbose = args.verbose ?? false;
  const logger = options?.logger ?? createCliLogger(verbose ? "debug" : "info");
  logger.info("cli.invoked", { argv });

  let fileContent: string | undefined;
  if (args.configPath) {
    const cwd = process.cwd();
    let contained = false;
    try {
      contained = isContained(cwd, args.configPath);
    } catch {
      contained = false;
    }
    if (!contained) {
      return {
        exitCode: 1,
        stdout: "",
        stderr: new AppError({
          code: "issue.config.not-contained",
          message: `config path not contained in cwd: ${args.configPath}`,
        }).message,
      };
    }
    try {
      const { readFile } = await import("node:fs/promises");
      fileContent = await readFile(args.configPath, "utf8");
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      const notFound = code === "ENOENT";
      if (notFound) {
        return {
          exitCode: 1,
          stdout: "",
          stderr: new AppError({
            code: "issue.config.not-found",
            message: `config file not found: ${args.configPath}`,
            cause: e,
          }).message,
        };
      }
      return {
        exitCode: 1,
        stdout: "",
        stderr: new AppError({
          code: "issue.config.validation",
          message: `config file read failed: ${(e as Error).message}`,
          cause: e,
        }).message,
      };
    }
  }

  const defaults = getDefaultConfig();
  const resolveResult = resolveConfig({
    defaults,
    ...(fileContent ? { fileContent } : {}),
    ...(options?.env ? { env: options.env } : {}),
    ...(args.verbose
      ? {
          cli: {
            version: "1.0.0",
            logging: { level: "debug" },
          } as unknown as Partial<import("./config.js").ConfigSchema>,
        }
      : {}),
  });
  if (!resolveResult.ok) {
    return { exitCode: 1, stdout: "", stderr: resolveResult.error.message };
  }
  const resolved = resolveResult.value;
  logger.info("config.resolved", {
    configSource: resolved.provenance.map((p) => p.source).join(","),
  });

  const verify = verifyConfig(resolved.provenance as ConfigProvenance);
  if (!verify.ok) {
    return { exitCode: 1, stdout: "", stderr: verify.error.message };
  }

  if (args.command === "config:show") {
    const redacted = redactConfigForPrint(resolved);
    return {
      exitCode: 0,
      stdout: JSON.stringify(redacted, null, 2),
      stderr: "",
    };
  }

  if (args.command === "run") {
    logger.info("run.dispatched", { runTarget: args.runTarget });
    try {
      if (args.runTarget === "tool-runtime") {
        const { runTask } = await import("@issue/tool-runtime");
        const cwd = process.cwd();
        const bounds = {
          maxRetries: 2,
          maxCorrections: 5,
          maxVerifications: 10,
          maxBytesPerRead: 1024 * 1024,
          chunkSize: 4096,
        } as const;
        const options = {
          root: cwd,
          refs: { files: [], directories: [] },
          bounds,
        } as unknown as Parameters<typeof runTask>[0];
        const provider = {
          async selectAction(available: readonly { ref: unknown }[]) {
            const first = available[0] as { ref: unknown } | undefined;
            if (!first) throw new Error("no available action");
            return first.ref as unknown as import("@issue/tool-runtime").ActionRef;
          },
          async assess(result: import("@issue/tool-runtime").ToolResult) {
            return {
              classification: result.classification,
            } as import("@issue/tool-runtime").Assessment;
          },
        } as unknown as Parameters<typeof runTask>[1];
        const result = await runTask(options, provider);
        const stdout = JSON.stringify(result, null, 2);
        logger.info("run.completed", { runTarget: args.runTarget });
        let status: string | undefined;
        if (typeof result === "object" && result !== null && "ok" in result) {
          const r = result as { ok: boolean; value?: unknown; error?: unknown };
          if (
            r.ok &&
            r.value &&
            typeof r.value === "object" &&
            "state" in (r.value as unknown as Record<string, unknown>)
          ) {
            const st = (r.value as unknown as Record<string, unknown>)[
              "state"
            ] as unknown;
            status = typeof st === "string" ? st : undefined;
          } else if (!r.ok) {
            status = "FAILED";
          }
        } else if (
          typeof result === "object" &&
          result !== null &&
          "state" in (result as unknown as Record<string, unknown>)
        ) {
          const st = (result as unknown as Record<string, unknown>)[
            "state"
          ] as unknown;
          status = typeof st === "string" ? st : undefined;
          if (status && typeof status === "object") {
            const nested = status as unknown as { status?: string };
            if (nested.status) status = nested.status;
          }
        }
        let exitCode: 0 | 1 | 2 = 0;
        if (status === "FAILED" || status === "ABSTAINED") exitCode = 1;
        else if (status === "CANCELLED") exitCode = 2;
        return { exitCode, stdout, stderr: "" };
      } else {
        const { runAnalyticsTask } = await import("@issue/analytics");
        const result = await runAnalyticsTask(
          { objective: "cli run", sources: [] },
          { logger } as unknown as Parameters<typeof runAnalyticsTask>[1],
        );
        const stdout = JSON.stringify(result, null, 2);
        logger.info("run.completed", { runTarget: args.runTarget });
        const raw = result as unknown as Record<string, unknown>;
        const stateVal = raw["state"] as unknown;
        let status: string | undefined;
        if (typeof stateVal === "string") status = stateVal;
        else if (typeof raw["ok"] === "boolean")
          status = raw["ok"] ? "COMPLETED" : "FAILED";
        let exitCode: 0 | 1 | 2 = 0;
        if (status === "FAILED" || status === "ABSTAINED") exitCode = 1;
        else if (status === "CANCELLED") exitCode = 2;
        return { exitCode, stdout, stderr: "" };
      }
    } catch (e) {
      return {
        exitCode: 1,
        stdout: "",
        stderr: new AppError({
          code: "issue.cli.missing-required",
          message: `run dispatch failed: ${(e as Error).message}`,
          cause: e,
        }).message,
      };
    }
  }

  return { exitCode: 1, stdout: "", stderr: "unknown command" };
}

function redactConfigForPrint(
  resolved: import("./config.js").ResolvedConfig,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(resolved)) {
    if (k === "provenance") {
      out[k] = (v as ConfigProvenance).map((p) => ({
        ...p,
        value: p.redacted ? "[REDACTED]" : p.value,
      }));
    } else if (k === "models" || k === "providers" || k === "permissions") {
      out[k] = "[REDACTED]";
    } else {
      out[k] = v as unknown;
    }
  }
  return out;
}

const _isOk = isOk;
void _isOk;
