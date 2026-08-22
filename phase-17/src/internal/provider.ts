/**
 * ISSU Phase 17 — IndustryDecisionProvider seam.
 * Spec §8, Architecture Q10.3.
 */

import type {
  IndustryDecisionProvider,
  IndustryApproval,
  IndustryInput,
  IndustryTaskStatus,
} from "./model.js";

export const stubProvider: IndustryDecisionProvider = {
  async decideApproval(
    _businessObject: IndustryInput,
    _state: { status: IndustryTaskStatus },
  ): Promise<IndustryApproval> {
    return { approved: true, approver: "stub" };
  },
};

export function createStubProvider(approved = true): IndustryDecisionProvider {
  return {
    async decideApproval(
      _businessObject: IndustryInput,
      _state: { status: IndustryTaskStatus },
    ): Promise<IndustryApproval> {
      return {
        approved,
        approver: "stub",
        reason: approved ? "approved" : "denied",
      };
    },
  };
}
