import { isAbsolute, relative, resolve } from "node:path";
import type { AvailableAction, TaskOptions, TaskState } from "../index.js";
import { isPositiveInt } from "./validate.js";

function isWithinResolved(root: string, target: string): boolean {
  const rootResolved = resolve(root);
  const targetResolved = resolve(target);
  const rel = relative(rootResolved, targetResolved);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

export function deriveAvailableActions(
  state: TaskState,
  options: TaskOptions,
): AvailableAction[] {
  const bounds = options.bounds;
  const completedFiles = new Set(state.completed.files);
  const completedDirs = new Set(state.completed.directories);
  const actions: AvailableAction[] = [];
  const seenFiles = new Set<string>();
  const seenDirs = new Set<string>();

  for (const ref of options.refs.files) {
    if (typeof ref !== "string" || ref.length === 0) continue;
    if (seenFiles.has(ref)) continue;
    seenFiles.add(ref);
    if (completedFiles.has(ref)) continue;
    if (!isWithinResolved(options.root, ref)) continue;
    const maxBytes = bounds.maxBytesPerRead;
    const chunkSize = bounds.chunkSize;
    if (!isPositiveInt(maxBytes) || !isPositiveInt(chunkSize)) continue;
    if (chunkSize > maxBytes) continue;
    actions.push({
      ref: {
        operation: "readFile",
        target: ref,
        read: { maxBytes, chunkSize },
      },
    });
  }

  for (const ref of options.refs.directories) {
    if (typeof ref !== "string" || ref.length === 0) continue;
    if (seenDirs.has(ref)) continue;
    seenDirs.add(ref);
    if (completedDirs.has(ref)) continue;
    if (!isWithinResolved(options.root, ref)) continue;
    const includeHidden = options.includeHidden ?? false;
    actions.push({
      ref: {
        operation: "listDirectory",
        target: ref,
        list: { includeHidden },
      },
    });
  }

  return actions;
}
