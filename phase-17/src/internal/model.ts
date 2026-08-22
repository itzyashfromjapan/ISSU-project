/**
 * ISSU Phase 17 — Industry Automation Agents: public data model.
 * Spec §6, §7, Architecture Q10.1.
 */

import type { ProvenanceChain, UncertaintyInfo } from "@issue/analytics";

export type IndustryTaskStatus =
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

export type IndustryWorkflowStep = {
  readonly op: "validate" | "transform" | "approve" | "notify" | "archive";
  readonly target: string;
  readonly params?: Readonly<Record<string, unknown>>;
};

export type IndustryInputKind = "inline" | "localFile";

export type IndustryInput = {
  readonly id: string;
  readonly kind: IndustryInputKind;
  readonly path?: string;
  readonly content?: string;
};

export type IndustryApproval = {
  readonly approved: boolean;
  readonly approver: string;
  readonly reason?: string;
};

export type IndustryFinding = {
  readonly id: string;
  readonly text: string;
  readonly provenance: ProvenanceChain;
  readonly uncertainty: UncertaintyInfo;
  readonly approval: IndustryApproval;
};

export type IndustryReport = {
  readonly id: string;
  readonly text: string;
  readonly findingIds: readonly string[];
};

export type IndustryEvaluationRecord = {
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

export type IndustryTaskRequest = {
  readonly objective: string;
  readonly workflow: readonly IndustryWorkflowStep[];
  readonly inputs: readonly IndustryInput[];
};

export type IndustryTaskResult = {
  readonly state: IndustryTaskStatus;
  readonly report?: IndustryReport;
  readonly findings: readonly IndustryFinding[];
  readonly provenance: readonly ProvenanceChain[];
  readonly evaluation: IndustryEvaluationRecord;
};

export type IndustryDecisionProvider = {
  decideApproval(
    businessObject: IndustryInput,
    state: { status: IndustryTaskStatus },
  ): Promise<IndustryApproval>;
};

export type IndustryTaskState = {
  readonly status: IndustryTaskStatus;
};
