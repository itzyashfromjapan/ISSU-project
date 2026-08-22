/**
 * ISSU Phase 10 — Business Automation Agents: public data model.
 * Spec §6, §7, Architecture Q10.1.
 */

import type { ProvenanceChain, UncertaintyInfo } from "@issue/analytics";

export type BusinessTaskStatus =
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

export type BusinessWorkflowStep = {
  readonly op: "validate" | "transform" | "approve" | "notify" | "archive";
  readonly target: string;
  readonly params?: Readonly<Record<string, unknown>>;
};

export type BusinessInputKind = "inline" | "localFile";

export type BusinessInput = {
  readonly id: string;
  readonly kind: BusinessInputKind;
  readonly path?: string;
  readonly content?: string;
};

export type BusinessApproval = {
  readonly approved: boolean;
  readonly approver: string;
  readonly reason?: string;
};

export type BusinessFinding = {
  readonly id: string;
  readonly text: string;
  readonly provenance: ProvenanceChain;
  readonly uncertainty: UncertaintyInfo;
  readonly approval: BusinessApproval;
};

export type BusinessReport = {
  readonly id: string;
  readonly text: string;
  readonly findingIds: readonly string[];
};

export type BusinessEvaluationRecord = {
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

export type BusinessTaskRequest = {
  readonly objective: string;
  readonly workflow: readonly BusinessWorkflowStep[];
  readonly inputs: readonly BusinessInput[];
};

export type BusinessTaskResult = {
  readonly state: BusinessTaskStatus;
  readonly report?: BusinessReport;
  readonly findings: readonly BusinessFinding[];
  readonly provenance: readonly ProvenanceChain[];
  readonly evaluation: BusinessEvaluationRecord;
};

export type BusinessDecisionProvider = {
  decideApproval(
    businessObject: BusinessInput,
    state: { status: BusinessTaskStatus },
  ): Promise<BusinessApproval>;
};

export type BusinessTaskState = {
  readonly status: BusinessTaskStatus;
};
