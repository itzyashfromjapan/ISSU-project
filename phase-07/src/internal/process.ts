/**
 * ISSU Phase 7 — Process execution tooling.
 * Spec §11, Architecture Q7.3.
 */

import type { Result } from "@issue/foundation";
import { AppError } from "@issue/foundation";
import { err, ok } from "@issue/foundation";
import { isContained } from "@issue/foundation";
import type { ProcessOptions, ProcessResult } from "./audit.js";
import { createToolLogger } from "./audit.js";

const DEFAULT_TIMEOUT = 30000;
const MAX_TIMEOUT = 60000;
const DEFAULT_MAX_BYTES = 256 * 1024;
const MAX_BYTES_CAP = 1024 * 1024;

export async function execProcess(
  command: string,
  args: readonly string[],
  options?: ProcessOptions,
): Promise<Result<ProcessResult, AppError>> {
  const logger = options?.logger ?? createToolLogger("info");
  if (options?.allowExec !== true) {
    return err(
      new AppError({
        code: "issue.process.permission-denied",
        message: `exec permission denied for: ${command}`,
      }),
    );
  }
  if (options?.cwd) {
    let contained = false;
    try {
      contained = isContained(process.cwd(), options.cwd);
    } catch {
      contained = false;
    }
    if (!contained) {
      return err(
        new AppError({
          code: "issue.process.not-contained",
          message: `cwd not contained: ${options.cwd}`,
        }),
      );
    }
  }
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT;
  if (timeoutMs > MAX_TIMEOUT) {
    return err(
      new AppError({
        code: "issue.process.validation",
        message: `timeoutMs max ${MAX_TIMEOUT}`,
      }),
    );
  }
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;
  if (maxBytes > MAX_BYTES_CAP) {
    return err(
      new AppError({
        code: "issue.process.validation",
        message: `maxBytes max ${MAX_BYTES_CAP}`,
      }),
    );
  }
  try {
    const { spawn } = await import("node:child_process");
    return await new Promise<Result<ProcessResult, AppError>>((resolve) => {
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      const proc = spawn(command, [...args], {
        shell: false,
        cwd: options?.cwd ?? process.cwd(),
      });
      const timer = setTimeout(() => {
        timedOut = true;
        proc.kill("SIGTERM");
      }, timeoutMs);
      proc.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
        if (Buffer.byteLength(stdout, "utf8") > maxBytes) {
          stdout = stdout.slice(0, maxBytes);
        }
      });
      proc.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8");
        if (Buffer.byteLength(stderr, "utf8") > maxBytes) {
          stderr = stderr.slice(0, maxBytes);
        }
      });
      proc.on("error", (e) => {
        clearTimeout(timer);
        resolve(
          err(
            new AppError({
              code: "issue.process.not-contained",
              message: `spawn failed: ${(e as Error).message}`,
              cause: e,
            }),
          ),
        );
      });
      proc.on("close", (code) => {
        clearTimeout(timer);
        // truncate
        if (Buffer.byteLength(stdout, "utf8") > maxBytes)
          stdout = stdout.slice(0, maxBytes);
        if (Buffer.byteLength(stderr, "utf8") > maxBytes)
          stderr = stderr.slice(0, maxBytes);
        logger.info("process.audit", {
          tool: "execProcess",
          command,
          args: args.join(" "),
          exitCode: code ?? 0,
          timedOut,
        });
        resolve(
          ok({
            exitCode: code ?? 0,
            stdout: stdout.slice(0, maxBytes),
            stderr: stderr.slice(0, maxBytes),
            timedOut,
          }),
        );
      });
    });
  } catch (e) {
    return err(
      new AppError({
        code: "issue.process.validation",
        message: `exec failed: ${(e as Error).message}`,
        cause: e,
      }),
    );
  }
}
