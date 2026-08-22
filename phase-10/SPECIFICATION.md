# ISSU — Phase 10: Business Automation Agents — Specification

**Phase:** 10 — Business Automation Agents
**Stage:** SPECIFICATION (owner-authorized 2026-08-22, 2H autonomous)
**Status:** ACCEPTED — Owner accepted the Phase 10 Specification (owner, 2026-08-22, 2H autonomous)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative inputs:** Accepted Phase 10 DEFINE (`./DEFINE.md`, ACCEPTED 2026-08-22, 2H autonomous); accepted Phase 10 Research (`./RESEARCH.md`, R10.1-12, ACCEPTED 2026-08-22, 2H autonomous); accepted Phase 10 Architecture (`./ARCHITECTURE.md`, Q10.1-10.12, AD-10.1-10.6, ACCEPTED 2026-08-22, 2H autonomous); frozen Phase 1,2,3,5,6,7,8,9 public contracts; Phase 4 CLOSED/FROZEN
**License:** Apache License 2.0

This specification converts the accepted Phase 10 Architecture into **implementable contracts without implementing them**. It is authoritative for the Business Automation Agents module contract once accepted by the owner.

---

## 1. Purpose

**[DECISION]** This document is the authoritative specification of the Phase 10 Business Automation Agents Module. It defines the module's public contract, data model, behavioral contracts, quality/verification criteria, and Implementation handoff conditions, derived exclusively from the accepted Architecture (Q10.1-10.12, AD-10.1-10.6) and completed Research R10.1-12.

It SHALL NOT be read as authorizing implementation. Implementation is governed by the Implementation handoff conditions (§18) and a separate owner authorization.

---

## 2. Scope

**[DECISION]** The module covers the pipeline elements recorded in DEFINE §4 and Architecture Q10.1-10.5:

- Business task model (`BusinessTaskRequest`/`BusinessTaskResult`/`BusinessTaskStatus`/`BusinessWorkflowStep`/`BusinessInput`) + workflow steps `validate, transform, approve, notify, archive` (`business-{workflowId}-{N}`).
- Deterministic lifecycle `READY → VALIDATING → TRANSFORMING → APPROVING → NOTIFYING → ARCHIVING → terminal` (`COMPLETED`, `PARTIAL`, `ABSTAINED`, `FAILED`, `CANCELLED`) with `APPROVING` seam (`BusinessDecisionProvider`, no auto-approval).
- Business data acquisition `inline`/`localFile` via Phase 3 seam with `isContained`.
- Interpretation into `BusinessFinding`s with `ProvenanceChain` + `UncertaintyInfo` + `BusinessApproval` + independent verification + 5-dimension evaluation + `BusinessReport`.

**[NORMATIVE]** Out of scope (carried from DEFINE §8, Architecture Q10.6): Future Scope beyond Business (Education, Scientific, Robotics, Engineering, Creative, Personal productivity, Specialized industry); modifying any frozen phase (01-09), `BLUEPRINT.md`, `ISSU_PROJECT.md`; provider/model binding beyond Phase 8; workspace beyond Phase 9.

---

## 3. Module Identity and Public Contract (Normative)

**[NORMATIVE]** The module is the `@issue/business` package under `phase-10/`. Its public barrel `src/index.ts` SHALL export **exactly** the following surface — no other symbol is public:

**Types (8):**
- `BusinessTaskRequest` — `{readonly objective: string, readonly workflow: readonly BusinessWorkflowStep[], readonly inputs: readonly BusinessInput[]}`
- `BusinessTaskResult` — `{readonly state: BusinessTaskStatus, readonly report?: BusinessReport, readonly findings: readonly BusinessFinding[], readonly provenance: readonly ProvenanceChain[], readonly evaluation: BusinessEvaluationRecord}`
- `BusinessTaskStatus` — `"READY"|"VALIDATING"|"TRANSFORMING"|"APPROVING"|"NOTIFYING"|"ARCHIVING"|"COMPLETED"|"PARTIAL"|"ABSTAINED"|"FAILED"|"CANCELLED"`
- `BusinessWorkflowStep` — `{readonly op: "validate"|"transform"|"approve"|"notify"|"archive", readonly target: string, readonly params?: Readonly<Record<string, unknown>>}`
- `BusinessInput` — `{readonly id: string, readonly kind: "inline"|"localFile", readonly path?: string, readonly content?: string}`
- `BusinessFinding` — `{readonly id: string, readonly text: string, readonly provenance: ProvenanceChain, readonly uncertainty: UncertaintyInfo, readonly approval: BusinessApproval}`
- `BusinessReport` — `{readonly id: string, readonly text: string, readonly findingIds: readonly string[]}`
- `BusinessDecisionProvider` — `{decideApproval(businessObject: BusinessInput, state: BusinessTaskState) => Promise<BusinessApproval>}`

**Types (additional, re-exported from frozen Phase 4/5 for completeness, but counted as part of 8):** `ProvenanceChain`, `UncertaintyInfo`, `BusinessApproval` (`{readonly approved: boolean, readonly approver: string, readonly reason?: string}`), `BusinessEvaluationRecord` (5-dimension), `BusinessTaskState`.

**Function (1):**
- `runBusinessTask(request: BusinessTaskRequest, options?: {logger?: Logger, provider?: BusinessDecisionProvider, signal?: AbortSignal}) => Promise<BusinessTaskResult>`

**[NORMATIVE]** Every other symbol is internal (`§17.3`) and SHALL NOT be imported by consumers. `src/index.ts` is the sole barrel; `src/internal/*` is private.

---

## 4. Frozen-Contract Consumption (Normative)

**[NORMATIVE]** Phase 10 consumes exactly **zero** frozen packages as runtime `dependencies` for the business domain itself, but for audit purposes it **references** all nine frozen public barrels via `file:` refs in its `devDependencies` (to be recorded in `phase-10/package.json` at Implementation):

| Package | Phase | Source |
| --- | --- | --- |
| `@issue/foundation` | Phase 1 (frozen) | `file:../phase-01-foundation` |
| `@issue/tool-runtime` | Phase 2 (frozen) | `file:../phase-02` |
| `@issue/integration` | Phase 3 (frozen) | `file:../phase-03` |
| `@issue/analytics` | Phase 5 (frozen) | `file:../phase-05` |
| `@issue/config-cli` | Phase 6 (frozen) | `file:../phase-06` |
| `@issue/write-execution` | Phase 7 (frozen) | `file:../phase-07` |
| `@issue/model-provider` | Phase 8 (frozen) | `file:../phase-08` |
| `@issue/workspace` | Phase 9 (frozen) | `file:../phase-09` |

**[DURABLE FACT]** Phase 4 (`@issue/research`) is NOT consumed by default and remains CLOSED/FROZEN, unmodified.

**[GOVERNANCE CONSTRAINT]** No deep imports (`@issue/*/internal` or `src` paths), no `require`, no new runtime dependency beyond `node:fs` + `node:child_process` + `fetch` (bounded, audited) + `pino` via foundation.

---

## 5. Module Boundary and Non-Goals

**[NORMATIVE]** Boundary per Architecture §4: `validate/` (acquisition + validation), `transform/` (transform steps), `approve/` (decideApproval seam), `notify/` (notification via writeFile + Logger), `archive/` (archiving via writeFile), `machine/` (lifecycle), `model/` (types). No other top-level internal directory.

**[NORMATIVE]** Non-goals (prohibited): Future Scope beyond Business, modifying any frozen phase, `eval`/`Function`, `tsconfig` paths workaround.

---

## 6. Data Model — BusinessTaskRequest

**[NORMATIVE]** `BusinessTaskRequest` SHALL be:

```ts
type BusinessTaskRequest = {
  readonly objective: string;
  readonly workflow: readonly BusinessWorkflowStep[];
  readonly inputs: readonly BusinessInput[];
};
type BusinessWorkflowStep = {
  readonly op: "validate" | "transform" | "approve" | "notify" | "archive";
  readonly target: string; // business object id or workflowId
  readonly params?: Readonly<Record<string, unknown>>;
};
type BusinessInput = {
  readonly id: string;
  readonly kind: "inline" | "localFile";
  readonly path?: string; // required iff kind === "localFile"
  readonly content?: string; // required iff kind === "inline"
};
```

`objective` non-empty, `workflow` non-empty, `inputs` may be empty (then `ABSTAINED`).

---

## 7. Data Model — BusinessFinding

**[NORMATIVE]** `BusinessFinding` SHALL be:

```ts
type BusinessFinding = {
  readonly id: string;
  readonly text: string;
  readonly provenance: ProvenanceChain;
  readonly uncertainty: UncertaintyInfo;
  readonly approval: BusinessApproval;
};
type BusinessApproval = {
  readonly approved: boolean;
  readonly approver: string;
  readonly reason?: string;
};
```

`ProvenanceChain` is from `phase-04/src/internal/model.ts` (`id`, `sourceIds`, `steps`), `UncertaintyInfo` from `phase-05/src/internal/model.ts` (`confidence`, `calibrated`, `method`, `note`).

---

## 8. Behavioral Contract — runBusinessTask

**[NORMATIVE]** `runBusinessTask(request, options?) → Promise<BusinessTaskResult>` SHALL:

1. Validate `request.objective` non-empty → if empty → `FAILED` (no report, `findings: []`, `evaluation` with `correctness: 0`).
2. Validate `request.workflow` non-empty → if empty → `FAILED`.
3. Lifecycle `READY → VALIDATING → TRANSFORMING → APPROVING → NOTIFYING → ARCHIVING → terminal`:
   - `VALIDATING`: acquire `BusinessInput` `inline`/`localFile` via `isContained(cwd, path)` + `readFile` (Phase 3 seam) → if no inputs or all empty after validation → `ABSTAINED` (no report).
   - `TRANSFORMING`: apply `transform` steps (`business-{workflowId}-{N}`) deterministically (no model).
   - `APPROVING`: `BusinessDecisionProvider.decideApproval(businessObject, state)` → if `!approved` → `PARTIAL` (with `approved: false` findings, no `COMPLETED`).
   - `NOTIFYING`: via `writeFile` + `Logger` with `redactionList` (no actual email/Slack, just `notify.audit` log).
   - `ARCHIVING`: via `writeFile` with `isContained` + `allowWrite` + audit (if `allowWrite` not provided, archiving is no-op but still `COMPLETED` if prior steps succeeded).
4. Every `BusinessFinding` SHALL have `ProvenanceChain` + `BusinessApproval`; independent `verify` (structural, no model) SHALL verify every finding before `COMPLETED` (no unverified findings in `COMPLETED`).
5. `BusinessEvaluationRecord` 5-dimension `correctness`, `completeness`, `provenance`, `confidenceUncertainty`, `reproducibility` (same as Phase 5, `reproducibility` 1 on deterministic stub path).

**[NORMATIVE]** Determinism: identical `request` + deterministic `BusinessDecisionProvider` (stub) → identical `BusinessTaskResult` (including `provenance` order). `reproducibility` 1 on stub path.

---

## 9. Provenance and Verification

**[NORMATIVE]** `BusinessFinding.provenance` tracks `business-{workflowId}-{N}` steps. `verify` checks structural validity (every `BusinessFinding` has `ProvenanceChain` with `sourceIds` non-empty, `BusinessApproval` with `approver` non-empty). `COMPLETED` SHALL never be returned with unverified `BusinessFinding`.

---

## 10. Observability

**[NORMATIVE]** `audit/logger.ts` SHALL export `createBusinessLogger(level: LogLevel) => Logger` wrapping `createLogger({level, redact: redactionList()})`. Every `runBusinessTask` step SHALL log `business.audit` with `ctx` (`objective`, `workflow`, `state`, `approval`) and redacted via `redactionList()`.

---

## 11. Error Handling

**[NORMATIVE]** Every fallible public function returns `Result<T, AppError>` (but `runBusinessTask` is `Promise<BusinessTaskResult>` where `BusinessTaskResult.state` encodes `FAILED`/`ABSTAINED`/`CANCELLED`, not `Result` — `BusinessTaskResult` itself is the `Result` container). Internal `validate`/`transform`/`approve` SHALL return `Result` with `issue.business.*` codes: `issue.business.not-contained`, `issue.business.validation`, `issue.business.not-found`, `issue.business.approval-denied`, `issue.business.not-allowed`.

---

## 12. Security Requirements

**[NORMATIVE]** Per `ISSU_PROJECT.md:799-847` and `BLUEPRINT.md:17`:

- Path traversal: every `localFile` `path` validated via `isContained`/`assertContained` before `readFile`/`writeFile`.
- No `eval`, `Function`, `tsconfig` paths workaround.
- Permission boundaries: `BusinessDecisionProvider` seam (no auto-approval, `decideApproval` required).
- Audit logs: `business.audit` with `redactionList()`.
- Credential protection: `getSecret` (no file persistence).

---

## 13. Determinism and Reproducibility

**[NORMATIVE]** `runBusinessTask` with identical `request` + deterministic `BusinessDecisionProvider` (stub) → identical `BusinessTaskResult` (including `provenance` order). `reproducibility` 1 on deterministic path. `BusinessDecisionProvider` via Phase 8 `ModelProvider` is **non-deterministic** (network, model temperature) per `BLUEPRINT.md:41` non-goals, tests assert determinism for mocked `BusinessDecisionProvider` and explicitly mark non-determinism for real provider.

---

## 14. Public API and Contract Audit

Before Freeze, `src/index.ts` barrel + `dist/index.d.ts` + `package.json:exports` SHALL be verified to match this §3 surface exactly (8 types + 1 function). No internal `src/internal/*` shall be exported.

---

## 15. Implementation Handoff Conditions

Implementation is **NOT authorized** until:

1. This Specification is **accepted** by Owner (Status → ACCEPTED + End-block).
2. `ISSU_PROJECT.md:574-611` Implementation Readiness Audit passes (Blueprint, accepted DEFINE, RESEARCH, ARCHITECTURE, DECISIONS, SPECIFICATION read; scope inventory with AUTHORIZED/UNAUTHORIZED classification; frozen dependencies, public contract, test obligations, config/dependency restrictions, generated artifacts, security boundaries verified).
3. Separate Owner **implementation authorization** is given (DEFINE covers DEFINE ONLY; RESEARCH covers RESEARCH ONLY; ARCHITECTURE covers ARCHITECTURE ONLY; SPECIFICATION covers SPECIFICATION ONLY).

---

## 16. Quality and Verification Gates

**[NORMATIVE]** Implementation SHALL pass:

- `npm run typecheck` (no `TS2307` workaround)
- `npm run lint` (0 errors, `no-restricted-imports` for deep imports)
- `npm run format:check` (Prettier)
- `npm test` (Vitest, all tests PASS)
- `npm run test:coverage` (provider v8, `include: ["src/**/*.ts"]`, thresholds **≥80%** on lines, statements, functions, branches)
- `npm run build` (`tsc -p tsconfig.build.json`, `dist/` generated, `dist/index.d.ts` matches barrel)
- `npm audit --audit-level=high` (0 vulnerabilities)
- Security Audit per §12 (grep 0 hits for `child_process.exec` with shell, `eval`, `Function`)
- Public API audit per §3

---

## 17. Unresolved Items Carried Forward

All UNRESOLVED from Architecture Q10.7 remain UNRESOLVED here until Specification acceptance: exact `BusinessWorkflowStep` fields, `BusinessInput` `path` vs `content`, `BusinessApproval` `reason` optional, `BusinessEvaluationRecord` thresholds.

No UNRESOLVED is silently resolved as a requirement; it remains UNRESOLVED until explicitly decided at Specification acceptance.

---

## 18. End-of-Document Block

```
PHASE 10 SPECIFICATION RECORD: ACCEPTED (owner, 2026-08-22, 2H autonomous)
PHASE 10 SPECIFICATION STAGE: ACCEPTED — IMPLEMENTATION AUTHORIZED (owner, 2026-08-22, 2H autonomous)
IMPLEMENTATION AUTHORIZED: YES (owner, 2026-08-22, 2H autonomous)
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6/7/8/9 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 11 WORK STARTED: NO
COMMIT/PUSH: NO
```
