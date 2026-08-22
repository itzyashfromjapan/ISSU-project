import { isAbsolute } from "node:path";
import type {
  ActionRef,
  Assessment,
  DecisionProvider,
  OutcomeClass,
  ResourceBounds,
  TaskOptions,
} from "../index.js";
import { isValidOutcomeClass } from "./constants.js";

export function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function validateOptions(options: TaskOptions): void {
  if (options === null || typeof options !== "object") {
    throw new Error("TaskOptions must be an object");
  }
  const bounds = options.bounds;
  if (bounds === null || typeof bounds !== "object") {
    throw new Error("TaskOptions.bounds must be an object");
  }
  const bounded: Array<[string, number]> = [
    ["maxRetries", bounds.maxRetries],
    ["maxCorrections", bounds.maxCorrections],
    ["maxVerifications", bounds.maxVerifications],
    ["maxBytesPerRead", bounds.maxBytesPerRead],
    ["chunkSize", bounds.chunkSize],
  ];
  for (const [name, value] of bounded) {
    if (!isPositiveInt(value)) {
      throw new Error(`TaskOptions.bounds.${name} must be a positive integer`);
    }
  }
  if (bounds.chunkSize > bounds.maxBytesPerRead) {
    throw new Error(
      "TaskOptions.bounds.chunkSize must be less than or equal to maxBytesPerRead",
    );
  }
  if (typeof options.root !== "string" || options.root.length === 0) {
    throw new Error("TaskOptions.root must be a non-empty string");
  }
  if (!isAbsolute(options.root)) {
    throw new Error("TaskOptions.root must be an absolute path");
  }
  const refs = options.refs;
  if (refs === null || typeof refs !== "object") {
    throw new Error("TaskOptions.refs must be an object");
  }
  if (!Array.isArray(refs.files) || !Array.isArray(refs.directories)) {
    throw new Error(
      "TaskOptions.refs.files and TaskOptions.refs.directories must be arrays",
    );
  }
  for (const ref of refs.files) {
    if (typeof ref !== "string" || ref.length === 0) {
      throw new Error(
        "TaskOptions.refs.files entries must be non-empty strings",
      );
    }
  }
  for (const ref of refs.directories) {
    if (typeof ref !== "string" || ref.length === 0) {
      throw new Error(
        "TaskOptions.refs.directories entries must be non-empty strings",
      );
    }
  }
}

export function validateProvider(provider: DecisionProvider): void {
  if (provider === null || typeof provider !== "object") {
    throw new Error("DecisionProvider must be an object");
  }
  if (typeof (provider as DecisionProvider).selectAction !== "function") {
    throw new Error("DecisionProvider.selectAction must be a function");
  }
  if (typeof (provider as DecisionProvider).assess !== "function") {
    throw new Error("DecisionProvider.assess must be a function");
  }
}

export type ParsedAction =
  | { kind: "readFile"; target: string; maxBytes: number; chunkSize: number }
  | { kind: "listDirectory"; target: string; includeHidden: boolean };

export function parseActionRef(
  ref: ActionRef,
  bounds: ResourceBounds,
): ParsedAction | undefined {
  if (ref === null || typeof ref !== "object") return undefined;
  const operation = (ref as Partial<ActionRef>).operation;
  if (operation !== "readFile" && operation !== "listDirectory") {
    return undefined;
  }
  const target = (ref as Partial<ActionRef>).target;
  if (typeof target !== "string" || target.length === 0) return undefined;
  if (operation === "readFile") {
    const read = (ref as Partial<ActionRef>).read;
    if (read === undefined || read === null || typeof read !== "object") {
      return undefined;
    }
    const chunkSize = read.chunkSize ?? bounds.chunkSize;
    if (!isPositiveInt(chunkSize)) return undefined;
    if (chunkSize > bounds.chunkSize) return undefined;
    const maxBytes = Math.min(
      read.maxBytes ?? bounds.maxBytesPerRead,
      bounds.maxBytesPerRead,
    );
    if (!isPositiveInt(maxBytes)) return undefined;
    return { kind: "readFile", target, maxBytes, chunkSize };
  }
  const list = (ref as Partial<ActionRef>).list;
  if (list === undefined || list === null || typeof list !== "object") {
    return undefined;
  }
  const includeHidden = list.includeHidden ?? false;
  if (typeof includeHidden !== "boolean") return undefined;
  return { kind: "listDirectory", target, includeHidden };
}

export function parseAssessment(
  value: unknown,
): { classification: OutcomeClass } | null {
  if (value === null || typeof value !== "object") return null;
  const keys = Object.keys(value);
  if (keys.some((key) => key !== "classification")) return null;
  const classification = (value as Assessment).classification;
  if (!isValidOutcomeClass(classification)) return null;
  return { classification };
}

export function sameActionRef(a: ActionRef, b: ActionRef): boolean {
  if (a.operation !== b.operation || a.target !== b.target) return false;
  if (a.operation === "readFile") {
    return (
      a.read?.maxBytes === b.read?.maxBytes &&
      a.read?.chunkSize === b.read?.chunkSize
    );
  }
  return a.list?.includeHidden === b.list?.includeHidden;
}
