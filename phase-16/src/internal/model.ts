/**
 * ISSU Phase 16 — Productivity Automation Agents: public data model.
 * Spec §6, §7, Architecture Q10.1.
 */

import type { ProvenanceChain, UncertaintyInfo } from "@issue/analytics";

export type ProductivityTaskStatus =
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

export type ProductivityWorkflowStep = {
  readonly op: "validate" | "transform" | "approve" | "notify" | "archive";
  readonly target: string;
  readonly params?: Readonly<Record<string, unknown>>;
};

export type ProductivityInputKind = "inline" | "localFile";

export type ProductivityInput = {
  readonly id: string;
  readonly kind: ProductivityInputKind;
  readonly path?: string;
  readonly content?: string;
};

export type ProductivityApproval = {
  readonly approved: boolean;
  readonly approver: string;
  readonly reason?: string;
};

export type ProductivityFinding = {
  readonly id: string;
  readonly text: string;
  readonly provenance: ProvenanceChain;
  readonly uncertainty: UncertaintyInfo;
  readonly approval: ProductivityApproval;
};

export type ProductivityReport = {
  readonly id: string;
  readonly text: string;
  readonly findingIds: readonly string[];
};

export type ProductivityEvaluationRecord = {
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

export type ProductivityTaskRequest = {
  readonly objective: string;
  readonly workflow: readonly ProductivityWorkflowStep[];
  readonly inputs: readonly ProductivityInput[];
};

export type ProductivityTaskResult = {
  readonly state: ProductivityTaskStatus;
  readonly report?: ProductivityReport;
  readonly findings: readonly ProductivityFinding[];
  readonly provenance: readonly ProvenanceChain[];
  readonly evaluation: ProductivityEvaluationRecord;
};

export type ProductivityDecisionProvider = {
  decideApproval(
    businessObject: ProductivityInput,
    state: { status: ProductivityTaskStatus },
  ): Promise<ProductivityApproval>;
};

export type ProductivityTaskState = {
  readonly status: ProductivityTaskStatus;
};
