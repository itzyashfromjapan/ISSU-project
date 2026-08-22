/**
 * ISSU Phase 4 — Research: deterministic orchestrator (`runResearchTask`, §12.1).
 *
 * Drives the §11 lifecycle: `READY → PLANNING → RETRIEVING → EVALUATING_SOURCES
 * → SYNTHESIZING → VERIFYING → EVALUATING → terminal`. REPLANNING is a defined
 * transition (§11) that the deterministic core never enters: it has no external
 * retrieval provider and no query-refinement capability, so a replan could not
 * add evidence. Failure semantics follow §13.
 */

import { AppError, isOk } from "@issue/foundation";
import type { Logger } from "@issue/foundation";
import { DEFAULT_BOUNDS } from "@issue/integration";
import { produceClaimsAndEvidence, verifyClaims } from "./claims.js";
import { detectConflicts } from "./conflicts.js";
import { buildEvaluationRecord, buildSourceReferences } from "./evaluate.js";
import type { EvaluationInput } from "./evaluate.js";
import type {
  Claim,
  EvaluationRecord,
  ResearchTaskOptions,
  ResearchTaskRequest,
  ResearchTaskResult,
  ResearchTaskStatus,
} from "./model.js";
import { createDeterministicResearchProviderStub } from "./provider.js";
import type { ResearchDecisionProvider } from "./provider.js";
import { deriveRoot, expandRefs, retrieveSources } from "./retrieval.js";
import { synthesizeReport } from "./synthesize.js";

function emptyEvaluation(state: ResearchTaskStatus): EvaluationRecord {
  return buildEvaluationRecord({
    state,
    claims: [],
    evidence: [],
    sources: [],
    conflicts: [],
    abstained: false,
    requestedTargets: 0,
    retrievedTargets: 0,
    report: undefined,
  });
}

function failedOrCancelledResult(
  state: Extract<ResearchTaskStatus, "FAILED" | "CANCELLED">,
): ResearchTaskResult {
  return {
    state,
    claims: [],
    evidence: [],
    sources: [],
    conflicts: [],
    evaluation: emptyEvaluation(state),
  };
}

function abstentionResult(requestedTargets: number): ResearchTaskResult {
  const report =
    "The research task abstained: no evidence was retrieved (no refs provided or " +
    "no claims could be grounded). No claims were synthesized rather than " +
    "fabricating from insufficient evidence (§12.9).";
  return {
    state: "PARTIAL",
    report,
    claims: [],
    evidence: [],
    sources: [],
    conflicts: [],
    evaluation: buildEvaluationRecord({
      state: "PARTIAL",
      claims: [],
      evidence: [],
      sources: [],
      conflicts: [],
      abstained: true,
      requestedTargets,
      retrievedTargets: 0,
      report,
    }),
    abstained: true,
  };
}

function validateRequest(request: ResearchTaskRequest): AppError | undefined {
  if (request === null || typeof request !== "object") {
    return new AppError({
      code: "issue.usage",
      message: "research task request must be an object",
      recoverable: false,
    });
  }
  if (
    typeof request.prompt !== "string" ||
    request.prompt.trim().length === 0
  ) {
    return new AppError({
      code: "issue.usage",
      message: "research task request requires a non-empty prompt",
      recoverable: false,
    });
  }
  const refs = request.refs;
  if (refs !== undefined) {
    if (typeof refs !== "object" || refs === null) {
      return new AppError({
        code: "issue.usage",
        message: "refs must be a TaskRefs object",
        recoverable: false,
      });
    }
    if (!Array.isArray(refs.files) || !Array.isArray(refs.directories)) {
      return new AppError({
        code: "issue.usage",
        message: "refs.files and refs.directories must be arrays",
        recoverable: false,
      });
    }
  }
  return undefined;
}

/**
 * Deterministic research task (§12.1). Guarantees a terminal `state.status`
 * (§11) and an internally consistent result (§8 cross-reference invariants).
 */
export async function runResearchTask(
  request: ResearchTaskRequest,
  options?: ResearchTaskOptions,
): Promise<ResearchTaskResult> {
  const logger: Logger | undefined = options?.logger;
  const signal: AbortSignal | undefined = options?.signal;
  const provider: ResearchDecisionProvider =
    options?.provider ?? createDeterministicResearchProviderStub();

  if (signal?.aborted === true) {
    logger?.warn("research: task cancelled before start");
    return failedOrCancelledResult("CANCELLED");
  }

  const validationError = validateRequest(request);
  if (validationError !== undefined) {
    logger?.error("research: invalid request", {
      code: validationError.code,
      message: validationError.message,
    });
    return failedOrCancelledResult("FAILED");
  }

  const refs = request.refs;
  const bounds = request.bounds ?? DEFAULT_BOUNDS;
  const includeHidden = request.includeHidden ?? false;

  if (
    refs === undefined ||
    (refs.files.length === 0 && refs.directories.length === 0)
  ) {
    logger?.warn("research: no refs provided; abstaining (no retrieval scope)");
    return abstentionResult(0);
  }

  const root = deriveRoot(refs);
  const requestedTargets = expandRefs(refs).length;

  try {
    const retrieval = await retrieveSources(
      root,
      refs,
      bounds,
      includeHidden,
      signal,
      logger,
    );
    if (!isOk(retrieval)) {
      logger?.error("research: retrieval failed at harness layer", {
        code: retrieval.error.code,
        message: retrieval.error.message,
      });
      return failedOrCancelledResult("FAILED");
    }
    const outcome = retrieval.value;
    if (outcome.cancelled) {
      logger?.warn("research: task cancelled during retrieval");
      return failedOrCancelledResult("CANCELLED");
    }
    if (outcome.failures.length > 0) {
      const failure = outcome.failures[0] as (typeof outcome.failures)[number];
      logger?.error("research: non-recoverable retrieval failure", {
        target: failure.target,
        code: failure.error.code,
      });
      return failedOrCancelledResult("FAILED");
    }

    const sources = buildSourceReferences(outcome.sources);
    const contents = new Map<string, string>();
    for (let i = 0; i < outcome.sources.length; i++) {
      const retrieved = outcome.sources[i];
      const source = sources[i];
      if (retrieved !== undefined && source !== undefined) {
        contents.set(source.id, retrieved.content);
      }
    }

    const produced = produceClaimsAndEvidence(sources, contents);
    const sourceIds = new Set(sources.map((source) => source.id));
    const verified = verifyClaims(
      produced.claims,
      produced.evidence,
      sourceIds,
    );

    const claims: Claim[] = [];
    for (const claim of verified) {
      const assessment = await provider.assess(claim, produced.evidence, {
        status: "VERIFYING",
      });
      claims.push({ ...claim, support: assessment.support });
    }

    const conflicts = detectConflicts(claims);
    const hasUnresolved = claims.some(
      (claim) =>
        claim.support === "UNSUPPORTED" || claim.support === "UNCERTAIN",
    );
    const abstained = claims.length === 0;
    const state: ResearchTaskStatus =
      abstained || hasUnresolved ? "PARTIAL" : "COMPLETED";

    const report = synthesizeReport(claims, sources, abstained);

    const evaluationInput: EvaluationInput = {
      state,
      claims,
      evidence: produced.evidence,
      sources,
      conflicts,
      abstained,
      requestedTargets,
      retrievedTargets: outcome.sources.length,
      report,
    };
    const evaluation = buildEvaluationRecord(evaluationInput);

    const result: ResearchTaskResult = {
      state,
      report,
      claims,
      evidence: produced.evidence,
      sources,
      conflicts,
      evaluation,
      ...(abstained ? { abstained: true } : {}),
    };
    return result;
  } catch (error) {
    logger?.error("research: unrecoverable error during task", {
      message: error instanceof Error ? error.message : String(error),
    });
    return failedOrCancelledResult("FAILED");
  }
}
