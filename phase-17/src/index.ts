/**
 * ISSU Phase 17 — Industry Automation Agents: public barrel (§3).
 * Exposes exactly the §3 public surface: 8 types + 1 function.
 * Every other symbol is internal (§3 NORMATIVE) and SHALL NOT be imported.
 */

export type {
  IndustryTaskRequest,
  IndustryTaskResult,
  IndustryTaskStatus,
  IndustryWorkflowStep,
  IndustryInput,
  IndustryFinding,
  IndustryReport,
  IndustryDecisionProvider,
  IndustryApproval,
  IndustryEvaluationRecord,
  IndustryTaskState,
} from "./internal/model.js";
export { runIndustryTask } from "./internal/machine.js";
export { createStubProvider, stubProvider } from "./internal/provider.js";
export { VERSION } from "./version.js";
