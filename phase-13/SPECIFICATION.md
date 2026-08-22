# ISSU — Phase 13: Robotics Automation Agents — Specification

**Phase:** 10 — Robotics Automation Agents
**Stage:** SPECIFICATION (owner-authorized 2026-08-22, 2H autonomous)
**Status:** ACCEPTED — Owner accepted the Phase 13 Specification (owner, 2026-08-22, 2H autonomous)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative inputs:** Accepted Phase 13 DEFINE (`./DEFINE.md`, ACCEPTED 2026-08-22, 2H autonomous); accepted Phase 13 Research (`./RESEARCH.md`, R10.1-12, ACCEPTED 2026-08-22, 2H autonomous); accepted Phase 13 Architecture (`./ARCHITECTURE.md`, Q10.1-10.12, AD-10.1-10.6, ACCEPTED 2026-08-22, 2H autonomous); frozen Phase 1,2,3,5,6,7,8,9 public contracts; Phase 4 CLOSED/FROZEN
**License:** Apache License 2.0

This specification converts the accepted Phase 13 Architecture into **implementable contracts without implementing them**. It is authoritative for the Robotics Automation Agents module contract once accepted by the owner.

---

## 1. Purpose

**[DECISION]** This document is the authoritative specification of the Phase 13 Robotics Automation Agents Module. It defines the module's public contract, data model, behavioral contracts, quality/verification criteria, and Implementation handoff conditions, derived exclusively from the accepted Architecture (Q10.1-10.12, AD-10.1-10.6) and completed Research R10.1-12.

It SHALL NOT be read as authorizing implementation. Implementation is governed by the Implementation handoff conditions (§18) and a separate owner authorization.

---

## 2. Scope

**[DECISION]** The module covers the pipeline elements recorded in DEFINE §4 and Architecture Q10.1-10.5:

- Robotics task model (`RoboticsTaskRequest`/`RoboticsTaskResult`/`RoboticsTaskStatus`/`RoboticsWorkflowStep`/`RoboticsInput`) + workflow steps `validate, transform, approve, notify, archive` (`Robotics-{workflowId}-{N}`).
- Deterministic lifecycle `READY → VALIDATING → TRANSFORMING → APPROVING → NOTIFYING → ARCHIVING → terminal` (`COMPLETED`, `PARTIAL`, `ABSTAINED`, `FAILED`, `CANCELLED`) with `APPROVING` seam (`RoboticsDecisionProvider`, no auto-approval).
- Robotics data acquisition `inline`/`localFile` via Phase 3 seam with `isContained`.
- Interpretation into `RoboticsFinding`s with `ProvenanceChain` + `UncertaintyInfo` + `RoboticsApproval` + independent verification + 5-dimension evaluation + `RoboticsReport`.

**[NORMATIVE]** Out of scope (carried from DEFINE §8, Architecture Q10.6): Future Scope beyond Robotics (Robotics, Robotics, Robotics, Engineering, Creative, Personal productivity, Specialized industry); modifying any frozen phase (01-09), `BLUEPRINT.md`, `ISSU_PROJECT.md`; provider/model binding beyond Phase 8; workspace beyond Phase 9.

---

## 3. Module Identity and Public Contract (Normative)

**[NORMATIVE]** The module is the `@issue/Robotics` package under `phase-10/`. Its public barrel `src/index.ts` SHALL export **exactly** the following surface — no other symbol is public:

**Types (8):**
- `RoboticsTaskRequest` — `{readonly objective: string, readonly workflow: readonly RoboticsWorkflowStep[], readonly inputs: readonly RoboticsInput[]}`
- `RoboticsTaskResult` — `{readonly state: RoboticsTaskStatus, readonly report?: RoboticsReport, readonly findings: readonly RoboticsFinding[], readonly provenance: readonly ProvenanceChain[], readonly evaluation: RoboticsEvaluationRecord}`
- `RoboticsTaskStatus` — `"READY"|"VALIDATING"|"TRANSFORMING"|"APPROVING"|"NOTIFYING"|"ARCHIVING"|"COMPLETED"|"PARTIAL"|"ABSTAINED"|"FAILED"|"CANCELLED"`
- `RoboticsWorkflowStep` — `{readonly op: "validate"|"transform"|"approve"|"notify"|"archive", readonly target: string, readonly params?: Readonly<Record<string, unknown>>}`
- `RoboticsInput` — `{readonly id: string, readonly kind: "inline"|"localFile", readonly path?: string, readonly content?: string}`
- `RoboticsFinding` — `{readonly id: string, readonly text: string, readonly provenance: ProvenanceChain, readonly uncertainty: UncertaintyInfo, readonly approval: RoboticsApproval}`
- `RoboticsReport` — `{readonly id: string, readonly text: string, readonly findingIds: readonly string[]}`
- `RoboticsDecisionProvider` — `{decideApproval(RoboticsObject: RoboticsInput, state: RoboticsTaskState) => Promise<RoboticsApproval>}`

**Types (additional, re-exported from frozen Phase 4/5 for completeness, but counted as part of 8):** `ProvenanceChain`, `UncertaintyInfo`, `RoboticsApproval` (`{readonly approved: boolean, readonly approver: string, readonly reason?: string}`), `RoboticsEvaluationRecord` (5-dimension), `RoboticsTaskState`.

**Function (1):**
- `runRoboticsTask(request: RoboticsTaskRequest, options?: {logger?: Logger, provider?: RoboticsDecisionProvider, signal?: AbortSignal}) => Promise<RoboticsTaskResult>`

**[NORMATIVE]** Every other symbol is internal (`§17.3`) and SHALL NOT be imported by consumers. `src/index.ts` is the sole barrel; `src/internal/*` is private.

---

## 4. Frozen-Contract Consumption (Normative)

**[NORMATIVE]** Phase 13 consumes exactly **zero** frozen packages as runtime `dependencies` for the Robotics domain itself, but for audit purposes it **references** all nine frozen public barrels via `file:` refs in its `devDependencies` (to be recorded in `phase-10/package.json` at Implementation):

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

**[NORMATIVE]** Non-goals (prohibited): Future Scope beyond Robotics, modifying any frozen phase, `eval`/`Function`, `tsconfig` paths workaround.

---

## 6. Data Model — RoboticsTaskRequest

**[NORMATIVE]** `RoboticsTaskRequest` SHALL be:

```ts
type RoboticsTaskRequest = {
  readonly objective: string;
  readonly workflow: readonly RoboticsWorkflowStep[];
  readonly inputs: readonly RoboticsInput[];
};
type RoboticsWorkflowStep = {
  readonly op: "validate" | "transform" | "approve" | "notify" | "archive";
  readonly target: string; // Robotics object id or workflowId
  readonly params?: Readonly<Record<string, unknown>>;
};
type RoboticsInput = {
  readonly id: string;
  readonly kind: "inline" | "localFile";
  readonly path?: string; // required iff kind === "localFile"
  readonly content?: string; // required iff kind === "inline"
};
```

`objective` non-empty, `workflow` non-empty, `inputs` may be empty (then `ABSTAINED`).

---

## 7. Data Model — RoboticsFinding

**[NORMATIVE]** `RoboticsFinding` SHALL be:

```ts
type RoboticsFinding = {
  readonly id: string;
  readonly text: string;
  readonly provenance: ProvenanceChain;
  readonly uncertainty: UncertaintyInfo;
  readonly approval: RoboticsApproval;
};
type RoboticsApproval = {
  readonly approved: boolean;
  readonly approver: string;
  readonly reason?: string;
};
```

`ProvenanceChain` is from `phase-04/src/internal/model.ts` (`id`, `sourceIds`, `steps`), `UncertaintyInfo` from `phase-05/src/internal/model.ts` (`confidence`, `calibrated`, `method`, `note`).

---

## 8. Behavioral Contract — runRoboticsTask

**[NORMATIVE]** `runRoboticsTask(request, options?) → Promise<RoboticsTaskResult>` SHALL:

1. Validate `request.objective` non-empty → if empty → `FAILED` (no report, `findings: []`, `evaluation` with `correctness: 0`).
2. Validate `request.workflow` non-empty → if empty → `FAILED`.
3. Lifecycle `READY → VALIDATING → TRANSFORMING → APPROVING → NOTIFYING → ARCHIVING → terminal`:
   - `VALIDATING`: acquire `RoboticsInput` `inline`/`localFile` via `isContained(cwd, path)` + `readFile` (Phase 3 seam) → if no inputs or all empty after validation → `ABSTAINED` (no report).
   - `TRANSFORMING`: apply `transform` steps (`Robotics-{workflowId}-{N}`) deterministically (no model).
   - `APPROVING`: `RoboticsDecisionProvider.decideApproval(RoboticsObject, state)` → if `!approved` → `PARTIAL` (with `approved: false` findings, no `COMPLETED`).
   - `NOTIFYING`: via `writeFile` + `Logger` with `redactionList` (no actual email/Slack, just `notify.audit` log).
   - `ARCHIVING`: via `writeFile` with `isContained` + `allowWrite` + audit (if `allowWrite` not provided, archiving is no-op but still `COMPLETED` if prior steps succeeded).
4. Every `RoboticsFinding` SHALL have `ProvenanceChain` + `RoboticsApproval`; independent `verify` (structural, no model) SHALL verify every finding before `COMPLETED` (no unverified findings in `COMPLETED`).
5. `RoboticsEvaluationRecord` 5-dimension `correctness`, `completeness`, `provenance`, `confidenceUncertainty`, `reproducibility` (same as Phase 5, `reproducibility` 1 on deterministic stub path).

**[NORMATIVE]** Determinism: identical `request` + deterministic `RoboticsDecisionProvider` (stub) → identical `RoboticsTaskResult` (including `provenance` order). `reproducibility` 1 on stub path.

---

## 9. Provenance and Verification

**[NORMATIVE]** `RoboticsFinding.provenance` tracks `Robotics-{workflowId}-{N}` steps. `verify` checks structural validity (every `RoboticsFinding` has `ProvenanceChain` with `sourceIds` non-empty, `RoboticsApproval` with `approver` non-empty). `COMPLETED` SHALL never be returned with unverified `RoboticsFinding`.

---

## 10. Observability

**[NORMATIVE]** `audit/logger.ts` SHALL export `createRoboticsLogger(level: LogLevel) => Logger` wrapping `createLogger({level, redact: redactionList()})`. Every `runRoboticsTask` step SHALL log `Robotics.audit` with `ctx` (`objective`, `workflow`, `state`, `approval`) and redacted via `redactionList()`.

---

## 11. Error Handling

**[NORMATIVE]** Every fallible public function returns `Result<T, AppError>` (but `runRoboticsTask` is `Promise<RoboticsTaskResult>` where `RoboticsTaskResult.state` encodes `FAILED`/`ABSTAINED`/`CANCELLED`, not `Result` — `RoboticsTaskResult` itself is the `Result` container). Internal `validate`/`transform`/`approve` SHALL return `Result` with `issue.Robotics.*` codes: `issue.Robotics.not-contained`, `issue.Robotics.validation`, `issue.Robotics.not-found`, `issue.Robotics.approval-denied`, `issue.Robotics.not-allowed`.

---

## 12. Security Requirements

**[NORMATIVE]** Per `ISSU_PROJECT.md:799-847` and `BLUEPRINT.md:17`:

- Path traversal: every `localFile` `path` validated via `isContained`/`assertContained` before `readFile`/`writeFile`.
- No `eval`, `Function`, `tsconfig` paths workaround.
- Permission boundaries: `RoboticsDecisionProvider` seam (no auto-approval, `decideApproval` required).
- Audit logs: `Robotics.audit` with `redactionList()`.
- Credential protection: `getSecret` (no file persistence).

---

## 13. Determinism and Reproducibility

**[NORMATIVE]** `runRoboticsTask` with identical `request` + deterministic `RoboticsDecisionProvider` (stub) → identical `RoboticsTaskResult` (including `provenance` order). `reproducibility` 1 on deterministic path. `RoboticsDecisionProvider` via Phase 8 `ModelProvider` is **non-deterministic** (network, model temperature) per `BLUEPRINT.md:41` non-goals, tests assert determinism for mocked `RoboticsDecisionProvider` and explicitly mark non-determinism for real provider.

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

All UNRESOLVED from Architecture Q10.7 remain UNRESOLVED here until Specification acceptance: exact `RoboticsWorkflowStep` fields, `RoboticsInput` `path` vs `content`, `RoboticsApproval` `reason` optional, `RoboticsEvaluationRecord` thresholds.

No UNRESOLVED is silently resolved as a requirement; it remains UNRESOLVED until explicitly decided at Specification acceptance.

---

## 18. End-of-Document Block

```
Phase 13 SPECIFICATION RECORD: ACCEPTED (owner, 2026-08-22, 2H autonomous)
Phase 13 SPECIFICATION STAGE: ACCEPTED — IMPLEMENTATION AUTHORIZED (owner, 2026-08-22, 2H autonomous)
IMPLEMENTATION AUTHORIZED: YES (owner, 2026-08-22, 2H autonomous)
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6/7/8/9 MODIFIED: NO
BLUEPRINT MODIFIED: NO
Phase 13 WORK STARTED: NO
COMMIT/PUSH: NO
```



