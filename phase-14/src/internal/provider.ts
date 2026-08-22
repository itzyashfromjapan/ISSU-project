/**
 * ISSU Phase 14 — EngineeringDecisionProvider seam.
 * Spec §8, Architecture Q10.3.
 */

import type {
  EngineeringDecisionProvider,
  EngineeringApproval,
  EngineeringInput,
  EngineeringTaskStatus,
} from "./model.js";

export const stubProvider: EngineeringDecisionProvider = {
  async decideApproval(
    _businessObject: EngineeringInput,
    _state: { status: EngineeringTaskStatus },
  ): Promise<EngineeringApproval> {
    return { approved: true, approver: "stub" };
  },
};

export function createStubProvider(
  approved = true,
): EngineeringDecisionProvider {
  return {
    async decideApproval(
      _businessObject: EngineeringInput,
      _state: { status: EngineeringTaskStatus },
    ): Promise<EngineeringApproval> {
      return {
        approved,
        approver: "stub",
        reason: approved ? "approved" : "denied",
      };
    },
  };
}
