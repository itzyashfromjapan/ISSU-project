/**
 * ISSU Phase 13 — RoboticsDecisionProvider seam.
 * Spec §8, Architecture Q10.3.
 */

import type {
  RoboticsDecisionProvider,
  RoboticsApproval,
  RoboticsInput,
  RoboticsTaskStatus,
} from "./model.js";

export const stubProvider: RoboticsDecisionProvider = {
  async decideApproval(
    _businessObject: RoboticsInput,
    _state: { status: RoboticsTaskStatus },
  ): Promise<RoboticsApproval> {
    return { approved: true, approver: "stub" };
  },
};

export function createStubProvider(approved = true): RoboticsDecisionProvider {
  return {
    async decideApproval(
      _businessObject: RoboticsInput,
      _state: { status: RoboticsTaskStatus },
    ): Promise<RoboticsApproval> {
      return {
        approved,
        approver: "stub",
        reason: approved ? "approved" : "denied",
      };
    },
  };
}
