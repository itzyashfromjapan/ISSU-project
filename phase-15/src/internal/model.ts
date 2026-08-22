/**
 * ISSU Phase 15 — Creative Automation Agents: public data model.
 * Spec §6, §7, Architecture Q10.1.
 */

import type { ProvenanceChain, UncertaintyInfo } from "@issue/analytics";

export type CreativeTaskStatus =
  | "READY"
  | "VALIDATING"
  | "TRANSFORMING"
  | "APPROVING"
  | "NOTIFYING"
  | "ARCHIVING"
  | "COMPLETED"
  | "PARTIAL"
  | "ABSTAINED"
  | "FAILED"
  | "CANCELLED";

export type CreativeWorkflowStep = {
  readonly op: "validate" | "transform" | "approve" | "notify" | "archive";
  readonly target: string;
  readonly params?: Readonly<Record<string, unknown>>;
};

export type CreativeInputKind = "inline" | "localFile";

export type CreativeInput = {
  readonly id: string;
  readonly kind: CreativeInputKind;
  readonly path?: string;
  readonly content?: string;
};

export type CreativeApproval = {
  readonly approved: boolean;
  readonly approver: string;
  readonly reason?: string;
};

export type CreativeFinding = {
  readonly id: string;
  readonly text: string;
  readonly provenance: ProvenanceChain;
  readonly uncertainty: UncertaintyInfo;
  readonly approval: CreativeApproval;
};

export type CreativeReport = {
  readonly id: string;
  readonly text: string;
  readonly findingIds: readonly string[];
};

export type CreativeEvaluationRecord = {
  readonly dimensions: Record<
    | "correctness"
    | "completeness"
    | "provenance"
    | "confidenceUncertainty"
    | "reproducibility",
    number
  >;
  readonly method: "automated" | "human" | "hybrid";
};

export type CreativeTaskRequest = {
  readonly objective: string;
  readonly workflow: readonly CreativeWorkflowStep[];
  readonly inputs: readonly CreativeInput[];
};

export type CreativeTaskResult = {
  readonly state: CreativeTaskStatus;
  readonly report?: CreativeReport;
  readonly findings: readonly CreativeFinding[];
  readonly provenance: readonly ProvenanceChain[];
  readonly evaluation: CreativeEvaluationRecord;
};

export type CreativeDecisionProvider = {
  decideApproval(
    businessObject: CreativeInput,
    state: { status: CreativeTaskStatus },
  ): Promise<CreativeApproval>;
};

export type CreativeTaskState = {
  readonly status: CreativeTaskStatus;
};
