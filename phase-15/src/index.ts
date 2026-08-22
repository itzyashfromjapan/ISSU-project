/**
 * ISSU Phase 15 — Creative Automation Agents: public barrel (§3).
 * Exposes exactly the §3 public surface: 8 types + 1 function.
 * Every other symbol is internal (§3 NORMATIVE) and SHALL NOT be imported.
 */

export type {
  CreativeTaskRequest,
  CreativeTaskResult,
  CreativeTaskStatus,
  CreativeWorkflowStep,
  CreativeInput,
  CreativeFinding,
  CreativeReport,
  CreativeDecisionProvider,
  CreativeApproval,
  CreativeEvaluationRecord,
  CreativeTaskState,
} from "./internal/model.js";
export { runCreativeTask } from "./internal/machine.js";
export { createStubProvider, stubProvider } from "./internal/provider.js";
export { VERSION } from "./version.js";
