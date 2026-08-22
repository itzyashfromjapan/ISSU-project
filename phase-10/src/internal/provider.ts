/**
 * ISSU Phase 10 — BusinessDecisionProvider seam.
 * Spec §8, Architecture Q10.3.
 */

import type {
  BusinessDecisionProvider,
  BusinessApproval,
  BusinessInput,
  BusinessTaskStatus,
} from "./model.js";

export const stubProvider: BusinessDecisionProvider = {
  async decideApproval(
    _businessObject: BusinessInput,
    _state: { status: BusinessTaskStatus },
  ): Promise<BusinessApproval> {
    return { approved: true, approver: "stub" };
  },
};

export function createStubProvider(approved = true): BusinessDecisionProvider {
  return {
    async decideApproval(
      _businessObject: BusinessInput,
      _state: { status: BusinessTaskStatus },
    ): Promise<BusinessApproval> {
      return {
        approved,
        approver: "stub",
        reason: approved ? "approved" : "denied",
      };
    },
  };
}
