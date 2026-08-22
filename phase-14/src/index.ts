/**
 * ISSU Phase 14 — Engineering Automation Agents: public barrel (§3).
 * Exposes exactly the §3 public surface: 8 types + 1 function.
 * Every other symbol is internal (§3 NORMATIVE) and SHALL NOT be imported.
 */

export type {
  EngineeringTaskRequest,
  EngineeringTaskResult,
  EngineeringTaskStatus,
  EngineeringWorkflowStep,
  EngineeringInput,
  EngineeringFinding,
  EngineeringReport,
  EngineeringDecisionProvider,
  EngineeringApproval,
  EngineeringEvaluationRecord,
  EngineeringTaskState,
} from "./internal/model.js";
export { runEngineeringTask } from "./internal/machine.js";
export { createStubProvider, stubProvider } from "./internal/provider.js";
export { VERSION } from "./version.js";
