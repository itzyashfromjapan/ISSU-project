/**
 * ISSU Phase 15 — CreativeDecisionProvider seam.
 * Spec §8, Architecture Q10.3.
 */

import type {
  CreativeDecisionProvider,
  CreativeApproval,
  CreativeInput,
  CreativeTaskStatus,
} from "./model.js";

export const stubProvider: CreativeDecisionProvider = {
  async decideApproval(
    _businessObject: CreativeInput,
    _state: { status: CreativeTaskStatus },
  ): Promise<CreativeApproval> {
    return { approved: true, approver: "stub" };
  },
};

export function createStubProvider(approved = true): CreativeDecisionProvider {
  return {
    async decideApproval(
      _businessObject: CreativeInput,
      _state: { status: CreativeTaskStatus },
    ): Promise<CreativeApproval> {
      return {
        approved,
        approver: "stub",
        reason: approved ? "approved" : "denied",
      };
    },
  };
}
