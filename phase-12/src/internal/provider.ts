/**
 * ISSU Phase 12 — ScientificDecisionProvider seam.
 * Spec §8, Architecture Q10.3.
 */

import type {
  ScientificDecisionProvider,
  ScientificApproval,
  ScientificInput,
  ScientificTaskStatus,
} from "./model.js";

export const stubProvider: ScientificDecisionProvider = {
  async decideApproval(
    _businessObject: ScientificInput,
    _state: { status: ScientificTaskStatus },
  ): Promise<ScientificApproval> {
    return { approved: true, approver: "stub" };
  },
};

export function createStubProvider(
  approved = true,
): ScientificDecisionProvider {
  return {
    async decideApproval(
      _businessObject: ScientificInput,
      _state: { status: ScientificTaskStatus },
    ): Promise<ScientificApproval> {
      return {
        approved,
        approver: "stub",
        reason: approved ? "approved" : "denied",
      };
    },
  };
}
