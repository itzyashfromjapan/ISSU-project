import { realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { AppError } from "../errors/app-error.js";

export function assertContained(root: string, target: string): string {
  if (!isContained(root, target)) {
    throw new AppError({
      code: "issue.path.escape",
      message: `Path containment violation: "${target}" is not contained within root "${root}".`,
      recoverable: false,
      details: { root, target },
    });
  }
  return resolve(target);
}

export function isContained(root: string, target: string): boolean {
  const canonicalRoot = canonicalize(root);
  const canonicalTarget = canonicalize(target);
  return isWithin(canonicalRoot, canonicalTarget);
}

function isWithin(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function canonicalize(path: string): string {
  const absolute = resolve(path);
  const real = realPathOrNull(absolute);
  if (real !== undefined) return real;
  let current = absolute;
  const tail: string[] = [];
  for (;;) {
    tail.unshift(basename(current));
    current = dirname(current);
    const ancestorReal = realPathOrNull(current);
    if (ancestorReal !== undefined) {
      return resolve(ancestorReal, ...tail);
    }
  }
}

function realPathOrNull(path: string): string | undefined {
  try {
    return realpathSync(path);
  } catch (error) {
    if (isMissingError(error)) return undefined;
    throw error;
  }
}

function isMissingError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    ((error as NodeJS.ErrnoException).code === "ENOENT" ||
      (error as NodeJS.ErrnoException).code === "ENOTDIR")
  );
}
