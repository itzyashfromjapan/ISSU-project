/**
 * ISSU Phase 5 — Data and Analytics Agents: provider seam (§16) and the
 * deterministic stub.
 *
 * The provider seam is an architectural boundary (ARCHITECTURE §13): analytics
 * decision points are resolved through this interface. No model/provider is
 * bound (§16); model binding remains deferred (§22.4; Q4.22).
 */

import type {
  AnalyticalFinding,
  AnalyticsTaskStatus,
  DataSourceRef,
} from "./model.js";

/** Lifecycle context passed to every analytics decision point. */
export type AnalyticsTaskState = { readonly status: AnalyticsTaskStatus };

/** Refinement proposal surfaced to the provider at a REPLANNING decision. */
export interface RefinementOption {
  readonly id: string;
  readonly description: string;
}

/**
 * Analytics decision-point seam (§16). The deterministic core consults the
 * provider for source priority and finding-verification ordering, mirroring
 * the frozen Phase 4 `ResearchDecisionProvider` pattern. `decideRefinement`
 * is the REPLANNING decision: the deterministic core has no refinement
 * capability and never enters REPLANNING (Phase 4 §11 precedent), so the
 * default stub rejects it.
 */
export interface AnalyticsDecisionProvider {
  /** Which data source to acquire next (source priority). */
  selectSource(
    available: readonly DataSourceRef[],
    state: AnalyticsTaskState,
  ): Promise<DataSourceRef>;
  /** Which finding to verify next (verification ordering). */
  selectFindingToVerify(
    findings: readonly AnalyticalFinding[],
    state: AnalyticsTaskState,
  ): Promise<AnalyticalFinding>;
  /** Which refinement proposal to apply (REPLANNING). */
  decideRefinement(
    refinements: readonly RefinementOption[],
    state: AnalyticsTaskState,
  ): Promise<RefinementOption>;
}

/**
 * Deterministic analytics provider stub (§16), consistent with the Phase 3
 * `createDeterministicProviderStub` and Phase 4 stub patterns. Baseline
 * policies are "first-available" selection. Deterministic, model-free, no
 * provider SDK, no network access.
 */
export function createDeterministicAnalyticsProviderStub(): AnalyticsDecisionProvider {
  return {
    async selectSource(available): Promise<DataSourceRef> {
      const first = available[0];
      if (first === undefined) {
        throw new Error(
          "Deterministic analytics provider stub: selectSource requires a non-empty available set",
        );
      }
      return first;
    },
    async selectFindingToVerify(findings): Promise<AnalyticalFinding> {
      const first = findings[0];
      if (first === undefined) {
        throw new Error(
          "Deterministic analytics provider stub: selectFindingToVerify requires a non-empty findings set",
        );
      }
      return first;
    },
    async decideRefinement(_refinements): Promise<RefinementOption> {
      throw new Error(
        "Deterministic analytics provider stub: the deterministic core has no refinement capability; REPLANNING is never entered",
      );
    },
  };
}
