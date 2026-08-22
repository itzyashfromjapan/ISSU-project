/**
 * ISSU Phase 4 — Research: provider seam (§12.4) and the deterministic stub.
 *
 * [ACKNOWLEDGED REFINEMENT (F1)] `ResearchDecisionProvider` is an ADDITIONAL
 * Phase 4 abstraction, NOT a replacement for the frozen Phase 2
 * `DecisionProvider` seam. The frozen seam (`selectAction`/`assess`) is
 * consumed unchanged through the Phase 3 barrel.
 */

import type {
  Claim,
  EvidenceLink,
  SourceReference,
  ResearchTaskStatus,
  SupportClass,
} from "./model.js";

/** Lifecycle context passed to every research decision point (§12.4). */
export type ResearchTaskState = { readonly status: ResearchTaskStatus };

/**
 * Research decision-point seam (§12.4). Research-specific decisions (source
 * priority, claim verification ordering, claim assessment) are resolved
 * through this interface. No model/provider is bound (§12.4 NORMATIVE);
 * model binding remains deferred (§22.4; Q4.22; D3.2).
 */
export interface ResearchDecisionProvider {
  /** Which candidate source to prioritize (source selection). */
  selectSource(
    available: readonly SourceReference[],
    state: ResearchTaskState,
  ): Promise<SourceReference>;
  /** Which claim to verify next (verification ordering). */
  selectClaimToVerify(
    claims: readonly Claim[],
    state: ResearchTaskState,
  ): Promise<Claim>;
  /** Deterministic assessment of a claim against its evidence. */
  assess(
    claim: Claim,
    evidence: readonly EvidenceLink[],
    state: ResearchTaskState,
  ): Promise<{ readonly support: SupportClass }>;
}

/**
 * Deterministic research provider stub (§12.4), consistent with the Phase 3
 * `createDeterministicProviderStub` pattern. Baseline policies are
 * "first-available" selection and "first-claim" verification ordering. This
 * stub is deterministic, model-free, and contains no provider SDK or network
 * access.
 */
export function createDeterministicResearchProviderStub(): ResearchDecisionProvider {
  return {
    async selectSource(available): Promise<SourceReference> {
      const first = available[0];
      if (first === undefined) {
        throw new Error(
          "Deterministic research provider stub: selectSource requires a non-empty available set",
        );
      }
      return first;
    },
    async selectClaimToVerify(claims): Promise<Claim> {
      const first = claims[0];
      if (first === undefined) {
        throw new Error(
          "Deterministic research provider stub: selectClaimToVerify requires a non-empty claims set",
        );
      }
      return first;
    },
    async assess(claim, evidence): Promise<{ readonly support: SupportClass }> {
      const links = evidence.filter((link) => link.claimId === claim.id);
      if (links.length === 0) {
        return { support: "UNCERTAIN" };
      }
      if (links.some((link) => link.kind === "direct")) {
        return { support: "SUPPORTED" };
      }
      return { support: "PARTIALLY_SUPPORTED" };
    },
  };
}
