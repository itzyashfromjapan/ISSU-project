/**
 * ISSU Phase 12 — Scientific Automation Agents: public barrel (§3).
 * Exposes exactly the §3 public surface: 8 types + 1 function.
 * Every other symbol is internal (§3 NORMATIVE) and SHALL NOT be imported.
 */

export type {
  ScientificTaskRequest,
  ScientificTaskResult,
  ScientificTaskStatus,
  ScientificWorkflowStep,
  ScientificInput,
  ScientificFinding,
  ScientificReport,
  ScientificDecisionProvider,
  ScientificApproval,
  ScientificEvaluationRecord,
  ScientificTaskState,
} from "./internal/model.js";
export { runScientificTask } from "./internal/machine.js";
export { createStubProvider, stubProvider } from "./internal/provider.js";
export { VERSION } from "./version.js";
