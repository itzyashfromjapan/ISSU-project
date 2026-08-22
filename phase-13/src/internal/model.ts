/**
 * ISSU Phase 13 — Robotics Automation Agents: public data model.
 * Spec §6, §7, Architecture Q10.1.
 */

import type { ProvenanceChain, UncertaintyInfo } from "@issue/analytics";

export type RoboticsTaskStatus =
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

export type RoboticsWorkflowStep = {
  readonly op: "validate" | "transform" | "approve" | "notify" | "archive";
  readonly target: string;
  readonly params?: Readonly<Record<string, unknown>>;
};

export type RoboticsInputKind = "inline" | "localFile";

export type RoboticsInput = {
  readonly id: string;
  readonly kind: RoboticsInputKind;
  readonly path?: string;
  readonly content?: string;
};

export type RoboticsApproval = {
  readonly approved: boolean;
  readonly approver: string;
  readonly reason?: string;
};

export type RoboticsFinding = {
  readonly id: string;
  readonly text: string;
  readonly provenance: ProvenanceChain;
  readonly uncertainty: UncertaintyInfo;
  readonly approval: RoboticsApproval;
};

export type RoboticsReport = {
  readonly id: string;
  readonly text: string;
  readonly findingIds: readonly string[];
};

export type RoboticsEvaluationRecord = {
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

export type RoboticsTaskRequest = {
  readonly objective: string;
  readonly workflow: readonly RoboticsWorkflowStep[];
  readonly inputs: readonly RoboticsInput[];
};

export type RoboticsTaskResult = {
  readonly state: RoboticsTaskStatus;
  readonly report?: RoboticsReport;
  readonly findings: readonly RoboticsFinding[];
  readonly provenance: readonly ProvenanceChain[];
  readonly evaluation: RoboticsEvaluationRecord;
};

export type RoboticsDecisionProvider = {
  decideApproval(
    businessObject: RoboticsInput,
    state: { status: RoboticsTaskStatus },
  ): Promise<RoboticsApproval>;
};

export type RoboticsTaskState = {
  readonly status: RoboticsTaskStatus;
};
