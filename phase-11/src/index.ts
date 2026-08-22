/**
 * ISSU Phase 11 — Education Automation Agents: public barrel (§3).
 * Exposes exactly the §3 public surface: 8 types + 1 function.
 * Every other symbol is internal (§3 NORMATIVE) and SHALL NOT be imported.
 */

export type {
  EducationTaskRequest,
  EducationTaskResult,
  EducationTaskStatus,
  EducationWorkflowStep,
  EducationInput,
  EducationFinding,
  EducationReport,
  EducationDecisionProvider,
  EducationApproval,
  EducationEvaluationRecord,
  EducationTaskState,
} from "./internal/model.js";
export { runEducationTask } from "./internal/machine.js";
export { createStubProvider, stubProvider } from "./internal/provider.js";
export { VERSION } from "./version.js";
