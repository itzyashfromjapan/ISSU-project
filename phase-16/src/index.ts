/**
 * ISSU Phase 16 — Productivity Automation Agents: public barrel (§3).
 * Exposes exactly the §3 public surface: 8 types + 1 function.
 * Every other symbol is internal (§3 NORMATIVE) and SHALL NOT be imported.
 */

export type {
  ProductivityTaskRequest,
  ProductivityTaskResult,
  ProductivityTaskStatus,
  ProductivityWorkflowStep,
  ProductivityInput,
  ProductivityFinding,
  ProductivityReport,
  ProductivityDecisionProvider,
  ProductivityApproval,
  ProductivityEvaluationRecord,
  ProductivityTaskState,
} from "./internal/model.js";
export { runProductivityTask } from "./internal/machine.js";
export { createStubProvider, stubProvider } from "./internal/provider.js";
export { VERSION } from "./version.js";
