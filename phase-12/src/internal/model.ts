/**
 * ISSU Phase 12 — Scientific Automation Agents: public data model.
 * Spec §6, §7, Architecture Q10.1.
 */

import type { ProvenanceChain, UncertaintyInfo } from "@issue/analytics";

export type ScientificTaskStatus =
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

export type ScientificWorkflowStep = {
  readonly op: "validate" | "transform" | "approve" | "notify" | "archive";
  readonly target: string;
  readonly params?: Readonly<Record<string, unknown>>;
};

export type ScientificInputKind = "inline" | "localFile";

export type ScientificInput = {
  readonly id: string;
  readonly kind: ScientificInputKind;
  readonly path?: string;
  readonly content?: string;
};

export type ScientificApproval = {
  readonly approved: boolean;
  readonly approver: string;
  readonly reason?: string;
};

export type ScientificFinding = {
  readonly id: string;
  readonly text: string;
  readonly provenance: ProvenanceChain;
  readonly uncertainty: UncertaintyInfo;
  readonly approval: ScientificApproval;
};

export type ScientificReport = {
  readonly id: string;
  readonly text: string;
  readonly findingIds: readonly string[];
};

export type ScientificEvaluationRecord = {
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

export type ScientificTaskRequest = {
  readonly objective: string;
  readonly workflow: readonly ScientificWorkflowStep[];
  readonly inputs: readonly ScientificInput[];
};

export type ScientificTaskResult = {
  readonly state: ScientificTaskStatus;
  readonly report?: ScientificReport;
  readonly findings: readonly ScientificFinding[];
  readonly provenance: readonly ProvenanceChain[];
  readonly evaluation: ScientificEvaluationRecord;
};

export type ScientificDecisionProvider = {
  decideApproval(
    businessObject: ScientificInput,
    state: { status: ScientificTaskStatus },
  ): Promise<ScientificApproval>;
};

export type ScientificTaskState = {
  readonly status: ScientificTaskStatus;
};
