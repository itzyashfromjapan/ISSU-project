/**
 * ISSU Phase 7 — File write/edit/delete tooling.
 * Spec §8-§10, Architecture Q7.1-Q7.2.
 */

import type { Result } from "@issue/foundation";
import { AppError } from "@issue/foundation";
import { err, ok } from "@issue/foundation";
import { isContained } from "@issue/foundation";
import type { WriteOptions, EditOptions, DeleteOptions } from "./audit.js";
import { createToolLogger } from "./audit.js";

const DEFAULT_MAX_WRITE = 1024 * 1024; // 1 MiB
const MAX_WRITE_CAP = 5 * 1024 * 1024; // 5 MiB

export async function writeFile(
  target: string,
  content: string,
  options?: WriteOptions,
): Promise<Result<{ bytesWritten: number }, AppError>> {
  const logger = options?.logger ?? createToolLogger("info");
  const cwd = process.cwd();
  let contained = false;
  try {
    contained = isContained(cwd, target);
  } catch {
    contained = false;
  }
  if (!contained) {
    return err(
      new AppError({
        code: "issue.write.not-contained",
        message: `target not contained in cwd: ${target}`,
      }),
    );
  }
  if (options?.allowWrite !== true) {
    return err(
      new AppError({
        code: "issue.write.permission-denied",
        message: `write permission denied for: ${target}`,
      }),
    );
  }
  const maxBytes = options?.maxBytesPerWrite ?? DEFAULT_MAX_WRITE;
  if (maxBytes > MAX_WRITE_CAP) {
    return err(
      new AppError({
        code: "issue.write.validation",
        message: `maxBytesPerWrite max ${MAX_WRITE_CAP}`,
      }),
    );
  }
  const bytes = Buffer.byteLength(content, "utf8");
  if (bytes > maxBytes) {
    return err(
      new AppError({
        code: "issue.write.too-large",
        message: `content too large: ${bytes} > ${maxBytes}`,
      }),
    );
  }
  try {
    const { writeFile: fsWrite } = await import("node:fs/promises");
    await fsWrite(target, content, "utf8");
    logger.info("write.audit", {
      tool: "writeFile",
      target,
      bytesWritten: bytes,
      permission: options?.allowWrite,
    });
    return ok({ bytesWritten: bytes });
  } catch (e) {
    return err(
      new AppError({
        code: "issue.write.not-contained",
        message: `write failed: ${(e as Error).message}`,
        cause: e,
      }),
    );
  }
}

export async function editFile(
  target: string,
  oldString: string,
  newString: string,
  options?: EditOptions,
): Promise<Result<{ replaced: boolean }, AppError>> {
  const logger = options?.logger ?? createToolLogger("info");
  const cwd = process.cwd();
  let contained = false;
  try {
    contained = isContained(cwd, target);
  } catch {
    contained = false;
  }
  if (!contained) {
    return err(
      new AppError({
        code: "issue.write.not-contained",
        message: `target not contained in cwd: ${target}`,
      }),
    );
  }
  if (options?.allowWrite !== true) {
    return err(
      new AppError({
        code: "issue.write.permission-denied",
        message: `edit permission denied for: ${target}`,
      }),
    );
  }
  if (oldString === newString) {
    return err(
      new AppError({
        code: "issue.edit.noop",
        message: "oldString and newString are identical",
      }),
    );
  }
  try {
    const { readFile } = await import("node:fs/promises");
    const content = await readFile(target, "utf8");
    if (!content.includes(oldString)) {
      return err(
        new AppError({
          code: "issue.edit.not-found",
          message: "oldString not found in content",
        }),
      );
    }
    const count = content.split(oldString).length - 1;
    if (count > 1) {
      return err(
        new AppError({
          code: "issue.edit.multiple-matches",
          message: "oldString matched multiple times, provide more context",
        }),
      );
    }
    const newContent = content.replace(oldString, newString);
    const { writeFile: fsWrite } = await import("node:fs/promises");
    await fsWrite(target, newContent, "utf8");
    logger.info("edit.audit", {
      tool: "editFile",
      target,
      permission: options?.allowWrite,
    });
    return ok({ replaced: true });
  } catch (e) {
    if (e instanceof AppError) return err(e);
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return err(
        new AppError({
          code: "issue.edit.not-found",
          message: `file not found: ${target}`,
          cause: e,
        }),
      );
    }
    return err(
      new AppError({
        code: "issue.write.not-contained",
        message: `edit failed: ${(e as Error).message}`,
        cause: e,
      }),
    );
  }
}

export async function deleteFile(
  target: string,
  options?: DeleteOptions,
): Promise<Result<{ deleted: boolean }, AppError>> {
  const logger = options?.logger ?? createToolLogger("info");
  const cwd = process.cwd();
  let contained = false;
  try {
    contained = isContained(cwd, target);
  } catch {
    contained = false;
  }
  if (!contained) {
    return err(
      new AppError({
        code: "issue.write.not-contained",
        message: `target not contained in cwd: ${target}`,
      }),
    );
  }
  if (options?.allowWrite !== true) {
    return err(
      new AppError({
        code: "issue.write.permission-denied",
        message: `delete permission denied for: ${target}`,
      }),
    );
  }
  try {
    const { unlink } = await import("node:fs/promises");
    await unlink(target);
    logger.info("delete.audit", {
      tool: "deleteFile",
      target,
      permission: options?.allowWrite,
    });
    return ok({ deleted: true });
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return err(
        new AppError({
          code: "issue.delete.not-found",
          message: `file not found: ${target}`,
          cause: e,
        }),
      );
    }
    return err(
      new AppError({
        code: "issue.write.not-contained",
        message: `delete failed: ${(e as Error).message}`,
        cause: e,
      }),
    );
  }
}
