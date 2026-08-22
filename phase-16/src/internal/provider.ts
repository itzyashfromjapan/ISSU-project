/**
 * ISSU Phase 16 — ProductivityDecisionProvider seam.
 * Spec §8, Architecture Q10.3.
 */

import type {
  ProductivityDecisionProvider,
  ProductivityApproval,
  ProductivityInput,
  ProductivityTaskStatus,
} from "./model.js";

export const stubProvider: ProductivityDecisionProvider = {
  async decideApproval(
    _businessObject: ProductivityInput,
    _state: { status: ProductivityTaskStatus },
  ): Promise<ProductivityApproval> {
    return { approved: true, approver: "stub" };
  },
};

export function createStubProvider(
  approved = true,
): ProductivityDecisionProvider {
  return {
    async decideApproval(
      _businessObject: ProductivityInput,
      _state: { status: ProductivityTaskStatus },
    ): Promise<ProductivityApproval> {
      return {
        approved,
        approver: "stub",
        reason: approved ? "approved" : "denied",
      };
    },
  };
}
