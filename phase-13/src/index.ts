/**
 * ISSU Phase 13 — Robotics Automation Agents: public barrel (§3).
 * Exposes exactly the §3 public surface: 8 types + 1 function.
 * Every other symbol is internal (§3 NORMATIVE) and SHALL NOT be imported.
 */

export type {
  RoboticsTaskRequest,
  RoboticsTaskResult,
  RoboticsTaskStatus,
  RoboticsWorkflowStep,
  RoboticsInput,
  RoboticsFinding,
  RoboticsReport,
  RoboticsDecisionProvider,
  RoboticsApproval,
  RoboticsEvaluationRecord,
  RoboticsTaskState,
} from "./internal/model.js";
export { runRoboticsTask } from "./internal/machine.js";
export { createStubProvider, stubProvider } from "./internal/provider.js";
export { VERSION } from "./version.js";
