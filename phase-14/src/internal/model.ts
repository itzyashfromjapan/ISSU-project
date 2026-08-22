/**
 * ISSU Phase 14 — Engineering Automation Agents: public data model.
 * Spec §6, §7, Architecture Q10.1.
 */

import type { ProvenanceChain, UncertaintyInfo } from "@issue/analytics";

export type EngineeringTaskStatus =
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

export type EngineeringWorkflowStep = {
  readonly op: "validate" | "transform" | "approve" | "notify" | "archive";
  readonly target: string;
  readonly params?: Readonly<Record<string, unknown>>;
};

export type EngineeringInputKind = "inline" | "localFile";

export type EngineeringInput = {
  readonly id: string;
  readonly kind: EngineeringInputKind;
  readonly path?: string;
  readonly content?: string;
};

export type EngineeringApproval = {
  readonly approved: boolean;
  readonly approver: string;
  readonly reason?: string;
};

export type EngineeringFinding = {
  readonly id: string;
  readonly text: string;
  readonly provenance: ProvenanceChain;
  readonly uncertainty: UncertaintyInfo;
  readonly approval: EngineeringApproval;
};

export type EngineeringReport = {
  readonly id: string;
  readonly text: string;
  readonly findingIds: readonly string[];
};

export type EngineeringEvaluationRecord = {
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

export type EngineeringTaskRequest = {
  readonly objective: string;
  readonly workflow: readonly EngineeringWorkflowStep[];
  readonly inputs: readonly EngineeringInput[];
};

export type EngineeringTaskResult = {
  readonly state: EngineeringTaskStatus;
  readonly report?: EngineeringReport;
  readonly findings: readonly EngineeringFinding[];
  readonly provenance: readonly ProvenanceChain[];
  readonly evaluation: EngineeringEvaluationRecord;
};

export type EngineeringDecisionProvider = {
  decideApproval(
    businessObject: EngineeringInput,
    state: { status: EngineeringTaskStatus },
  ): Promise<EngineeringApproval>;
};

export type EngineeringTaskState = {
  readonly status: EngineeringTaskStatus;
};
