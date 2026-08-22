import { assertContained, isContained } from "@issue/foundation";
import { open, readdir } from "node:fs/promises";
import { TextDecoder } from "node:util";
import type {
  ActionRef,
  DirectoryEntry,
  OutcomeClass,
  ResourceBounds,
  ToolResult,
  ToolRuntime,
} from "../index.js";
import { errorResult, okResult, coerceActionRef } from "./results.js";
import { parseActionRef } from "./validate.js";

const STRICT_UTF8 = new TextDecoder("utf-8", { fatal: true });

function decodeUtf8Strict(buffer: Buffer): string | undefined {
  try {
    return STRICT_UTF8.decode(buffer);
  } catch {
    return undefined;
  }
}

function classifyFsError(error: unknown): OutcomeClass {
  if (typeof error === "object" && error !== null) {
    const code = (error as NodeJS.ErrnoException).code;
    if (typeof code === "string") {
      if (code === "ENOENT" || code === "ENOTDIR") return "notFound";
      return "executionError";
    }
  }
  return "internalError";
}

export function createToolRuntime(options: {
  root: string;
  bounds: ResourceBounds;
}): ToolRuntime {
  const root = options.root;
  const bounds = options.bounds;
  return {
    async execute(ref: ActionRef): Promise<ToolResult> {
      const parsed = parseActionRef(ref, bounds);
      if (parsed === undefined) {
        return errorResult(coerceActionRef(ref), "invalidInput", "readFile");
      }
      if (!isContained(root, parsed.target)) {
        return errorResult(ref, "accessDenied", parsed.kind);
      }
      let resolved: string;
      try {
        resolved = assertContained(root, parsed.target);
      } catch {
        return errorResult(ref, "accessDenied", parsed.kind);
      }
      try {
        if (parsed.kind === "readFile") {
          return await readFileAction(
            ref,
            resolved,
            parsed.maxBytes,
            parsed.chunkSize,
          );
        }
        return await listDirectoryAction(ref, resolved, parsed.includeHidden);
      } catch (error) {
        const classification = classifyFsError(error);
        return errorResult(ref, classification, parsed.kind);
      }
    },
  };
}

async function readFileAction(
  ref: ActionRef,
  target: string,
  maxBytes: number,
  chunkSize: number,
): Promise<ToolResult> {
  const handle = await open(target, "r");
  try {
    const stat = await handle.stat();
    if (stat.size > maxBytes) {
      return errorResult(ref, "tooLarge", "readFile");
    }
    const chunks: Buffer[] = [];
    let remaining = stat.size;
    let position = 0;
    while (remaining > 0) {
      const want = Math.min(chunkSize, remaining);
      const buffer = Buffer.alloc(want);
      const { bytesRead } = await handle.read(buffer, 0, want, position);
      if (bytesRead === 0) break;
      chunks.push(buffer.subarray(0, bytesRead));
      position += bytesRead;
      remaining -= bytesRead;
    }
    const content = Buffer.concat(chunks);
    const text = decodeUtf8Strict(content);
    if (text === undefined) {
      return errorResult(ref, "invalidContent", "readFile");
    }
    return okResult(ref, { text, bytesRead: content.length }, content.length);
  } finally {
    await handle.close().catch(() => undefined);
  }
}

async function listDirectoryAction(
  ref: ActionRef,
  target: string,
  includeHidden: boolean,
): Promise<ToolResult> {
  const dirents = await readdir(target, { withFileTypes: true });
  const entries: DirectoryEntry[] = dirents
    .filter((dirent) => dirent.name !== "." && dirent.name !== "..")
    .filter((dirent) => includeHidden || !dirent.name.startsWith("."))
    .map((dirent) => ({
      name: dirent.name,
      isDirectory: dirent.isDirectory(),
      isHidden: dirent.name.startsWith("."),
    }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return okResult(ref, { entries });
}
