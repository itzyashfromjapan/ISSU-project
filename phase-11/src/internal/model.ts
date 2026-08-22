/**
 * ISSU Phase 11 — Education Automation Agents: public data model.
 * Spec §6, §7, Architecture Q10.1.
 */

import type { ProvenanceChain, UncertaintyInfo } from "@issue/analytics";

export type EducationTaskStatus =
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

export type EducationWorkflowStep = {
  readonly op: "validate" | "transform" | "approve" | "notify" | "archive";
  readonly target: string;
  readonly params?: Readonly<Record<string, unknown>>;
};

export type EducationInputKind = "inline" | "localFile";

export type EducationInput = {
  readonly id: string;
  readonly kind: EducationInputKind;
  readonly path?: string;
  readonly content?: string;
};

export type EducationApproval = {
  readonly approved: boolean;
  readonly approver: string;
  readonly reason?: string;
};

export type EducationFinding = {
  readonly id: string;
  readonly text: string;
  readonly provenance: ProvenanceChain;
  readonly uncertainty: UncertaintyInfo;
  readonly approval: EducationApproval;
};

export type EducationReport = {
  readonly id: string;
  readonly text: string;
  readonly findingIds: readonly string[];
};

export type EducationEvaluationRecord = {
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

export type EducationTaskRequest = {
  readonly objective: string;
  readonly workflow: readonly EducationWorkflowStep[];
  readonly inputs: readonly EducationInput[];
};

export type EducationTaskResult = {
  readonly state: EducationTaskStatus;
  readonly report?: EducationReport;
  readonly findings: readonly EducationFinding[];
  readonly provenance: readonly ProvenanceChain[];
  readonly evaluation: EducationEvaluationRecord;
};

export type EducationDecisionProvider = {
  decideApproval(
    businessObject: EducationInput,
    state: { status: EducationTaskStatus },
  ): Promise<EducationApproval>;
};

export type EducationTaskState = {
  readonly status: EducationTaskStatus;
};
