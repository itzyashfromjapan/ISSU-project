/**
 * ISSU Phase 10 — Business Automation Agents: deterministic lifecycle machine.
 * Spec §8, Architecture Q10.2.
 */

import type {
  BusinessTaskRequest,
  BusinessTaskResult,
  BusinessTaskStatus,
} from "./model.js";
import type { BusinessDecisionProvider } from "./model.js";
import type { Logger } from "@issue/foundation";
import { createLogger, redactionList } from "@issue/foundation";
import { stubProvider } from "./provider.js";

export async function runBusinessTask(
  request: BusinessTaskRequest,
  options?: {
    logger?: Logger;
    provider?: BusinessDecisionProvider;
    signal?: AbortSignal;
  },
): Promise<BusinessTaskResult> {
  const logger =
    options?.logger ?? createLogger({ level: "info", redact: redactionList() });
  const provider = options?.provider ?? stubProvider;
  const signal = options?.signal;

  // Validate objective
  if (!request.objective || request.objective.trim() === "") {
    return {
      state: "FAILED",
      findings: [],
      provenance: [],
      evaluation: {
        dimensions: {
          correctness: 0,
          completeness: 0,
          provenance: 0,
          confidenceUncertainty: 0,
          reproducibility: 1,
        },
        method: "automated",
      },
    };
  }
  if (!request.workflow || request.workflow.length === 0) {
    return {
      state: "FAILED",
      findings: [],
      provenance: [],
      evaluation: {
        dimensions: {
          correctness: 0,
          completeness: 0,
          provenance: 0,
          confidenceUncertainty: 0,
          reproducibility: 1,
        },
        method: "automated",
      },
    };
  }
  if (signal?.aborted) {
    return {
      state: "CANCELLED",
      findings: [],
      provenance: [],
      evaluation: {
        dimensions: {
          correctness: 0,
          completeness: 0,
          provenance: 0,
          confidenceUncertainty: 0,
          reproducibility: 1,
        },
        method: "automated",
      },
    };
  }

  // VALIDATING: check inputs
  const validInputs = request.inputs.filter((inp) => {
    if (inp.kind === "inline")
      return inp.content !== undefined && inp.content.trim() !== "";
    if (inp.kind === "localFile") return inp.path !== undefined;
    return false;
  });
  if (validInputs.length === 0) {
    logger.info("business.audit", {
      objective: request.objective,
      state: "ABSTAINED",
    });
    return {
      state: "ABSTAINED",
      findings: [],
      provenance: [],
      evaluation: {
        dimensions: {
          correctness: 1,
          completeness: 0,
          provenance: 0,
          confidenceUncertainty: 1,
          reproducibility: 1,
        },
        method: "automated",
      },
    };
  }

  // TRANSFORMING: deterministic transform (no-op, just count)
  const transformed = validInputs.map((inp) => ({
    ...inp,
    content: inp.content ?? `transformed-${inp.id}`,
  }));

  // APPROVING: via BusinessDecisionProvider
  const approvals = await Promise.all(
    transformed.map((inp) =>
      provider.decideApproval(inp, {
        status: "APPROVING" as BusinessTaskStatus,
      }),
    ),
  );
  const allApproved = approvals.every((a) => a.approved);
  const partial = !allApproved;

  // NOTIFYING & ARCHIVING: deterministically create findings
  const findings = transformed.map((inp, idx) => ({
    id: `finding-${idx}`,
    text: `Business finding for ${inp.id}: ${request.objective}`,
    provenance: {
      id: `prov-${idx}`,
      sourceIds: [inp.id],
      steps: [
        {
          kind: "business",
          ref: `business-${request.workflow[0]?.target ?? "workflow"}-${idx}`,
          description: `step ${request.workflow[0]?.op ?? "validate"}`,
        },
      ],
    },
    uncertainty: { confidence: 0.9, calibrated: false, method: "stub" },
    approval: approvals[idx] ?? { approved: true, approver: "stub" },
  }));

  const provenance = findings.map((f) => f.provenance);
  const report = {
    id: "report-0",
    text: `Business report for ${request.objective}: ${findings.length} findings, approved=${allApproved}`,
    findingIds: findings.map((f) => f.id),
  };

  // Verify: every finding has provenance + approval
  const verified = findings.every(
    (f) => f.provenance && f.approval && f.approval.approver,
  );
  if (!verified) {
    return {
      state: "FAILED",
      findings: [],
      provenance: [],
      evaluation: {
        dimensions: {
          correctness: 0,
          completeness: 0,
          provenance: 0,
          confidenceUncertainty: 0,
          reproducibility: 1,
        },
        method: "automated",
      },
    };
  }

  const state: BusinessTaskStatus = partial ? "PARTIAL" : "COMPLETED";
  logger.info("business.audit", {
    objective: request.objective,
    state,
    findings: findings.length,
  });

  return {
    state,
    ...(state === "COMPLETED" || state === "PARTIAL" ? { report } : {}),
    findings,
    provenance,
    evaluation: {
      dimensions: {
        correctness: 1,
        completeness: 1,
        provenance: 1,
        confidenceUncertainty: 0.9,
        reproducibility: 1,
      },
      method: "automated",
    },
  };
}
