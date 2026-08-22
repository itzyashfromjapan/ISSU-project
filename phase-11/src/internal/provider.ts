/**
 * ISSU Phase 11 — EducationDecisionProvider seam.
 * Spec §8, Architecture Q10.3.
 */

import type {
  EducationDecisionProvider,
  EducationApproval,
  EducationInput,
  EducationTaskStatus,
} from "./model.js";

export const stubProvider: EducationDecisionProvider = {
  async decideApproval(
    _businessObject: EducationInput,
    _state: { status: EducationTaskStatus },
  ): Promise<EducationApproval> {
    return { approved: true, approver: "stub" };
  },
};

export function createStubProvider(approved = true): EducationDecisionProvider {
  return {
    async decideApproval(
      _businessObject: EducationInput,
      _state: { status: EducationTaskStatus },
    ): Promise<EducationApproval> {
      return {
        approved,
        approver: "stub",
        reason: approved ? "approved" : "denied",
      };
    },
  };
}
