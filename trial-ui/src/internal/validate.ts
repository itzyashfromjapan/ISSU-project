/**
 * ISSU v0.2 Trial UI — fail-closed input validation.
 * UI-supplied tasks are inline-only, size-capped, and control-char-free.
 * localFile inputs are rejected outright (no filesystem reads from the UI).
 */

import type { Result } from "@issue/foundation";
import { AppError } from "@issue/foundation";
import { err, ok } from "@issue/foundation";

export type TrialInput = {
  readonly id: string;
  readonly kind: "inline";
  readonly content: string;
};

export type TrialRequest = {
  readonly domain: string;
  readonly objective: string;
  readonly inputs: readonly TrialInput[];
  readonly correlationId?: string;
};

const MAX_OBJECTIVE = 200;
const MAX_INPUTS = 10;
const MAX_CONTENT = 4000;

function bad(message: string): Result<never, AppError> {
  return err(new AppError({ code: "issue.trial.validation", message }));
}

function hasControlChars(s: string): boolean {
  return /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(s);
}

export function parseRunInput(
  body: unknown,
): Result<TrialRequest & { workflow: unknown }, AppError> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return bad("request body must be a JSON object");
  }
  const rec = body as Record<string, unknown>;

  const domain = rec["domain"];
  if (typeof domain !== "string" || domain.trim() === "")
    return bad("domain is required");

  const rawObjective = rec["objective"];
  if (typeof rawObjective !== "string") return bad("objective is required");
  const objective = rawObjective.trim();
  if (objective.length === 0) return bad("objective must not be empty");
  if (objective.length > MAX_OBJECTIVE)
    return bad(`objective exceeds ${MAX_OBJECTIVE} characters`);
  if (hasControlChars(objective))
    return bad("objective contains control characters");

  // Inputs: optional; inline-only; hard size caps.
  const rawInputs = rec["inputs"] ?? [];
  if (!Array.isArray(rawInputs)) return bad("inputs must be an array");
  if (rawInputs.length > MAX_INPUTS)
    return bad(`too many inputs (max ${MAX_INPUTS})`);
  const inputs: TrialInput[] = [];
  for (const raw of rawInputs) {
    if (typeof raw !== "object" || raw === null)
      return bad("each input must be an object");
    const r = raw as Record<string, unknown>;
    if (r["kind"] !== undefined && r["kind"] !== "inline") {
      return bad("only inline inputs are allowed in the trial UI");
    }
    const id = typeof r["id"] === "string" ? r["id"].trim() : "";
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(id))
      return bad("input id must match [A-Za-z0-9_-]{1,40}");
    const content = typeof r["content"] === "string" ? r["content"] : "";
    if (content.trim() === "")
      return bad(`input ${id} content must not be empty`);
    if (content.length > MAX_CONTENT)
      return bad(`input ${id} exceeds ${MAX_CONTENT} characters`);
    if (hasControlChars(content))
      return bad(`input ${id} contains control characters`);
    inputs.push({ id, kind: "inline", content });
  }

  let correlationId: string | undefined;
  const rawCorr = rec["correlationId"];
  if (rawCorr !== undefined && rawCorr !== null) {
    if (typeof rawCorr !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(rawCorr)) {
      return bad("correlationId must match [A-Za-z0-9_-]{1,64}");
    }
    correlationId = rawCorr;
  }

  return ok({
    domain,
    objective,
    inputs,
    ...(correlationId !== undefined ? { correlationId } : {}),
    // Default deterministic workflow injected for the eight domain machines.
    workflow: [
      { op: "validate", target: "trial" },
      { op: "approve", target: "trial" },
    ],
  });
}
