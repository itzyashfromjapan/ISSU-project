# ISSU — Phase 11: Education Agents — Architecture

**Phase:** 10 — Education Agents
**Stage:** ARCHITECTURE (owner-authorized 2026-08-22, 2H autonomous)
**Status:** ACCEPTED — Owner accepted the Phase 11 Architecture (owner, 2026-08-22, 2H autonomous)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative inputs:** Accepted Phase 11 DEFINE (`./DEFINE.md`, ACCEPTED 2026-08-22); completed Phase 11 Research (`./RESEARCH.md`, R10.1-12, ACCEPTED 2026-08-22, 2H autonomous); frozen Phase 1,2,3,5,6,7,8,9 contracts; Phase 4 CLOSED/FROZEN
**License:** Apache License 2.0

---

## 1. Purpose & Position

This document records the **architecture** of the Phase 11 Education Agents Module. It follows BLUEPRINT §11 lifecycle position: after **Research** (R10.1-12 accepted) and before **Specify**.

- The domain is **Education Agents** (accepted DEFINE, 2026-08-22, 2H autonomous), a deterministic Education workflow automation pipeline (validation → transformation → approval → notification → archiving) reusing Phase 4/5 lifecycle pattern, but for Education workflows (invoices, onboarding, reporting), with `EducationDecisionProvider` seam for `APPROVING` (no auto-approval).
- Accepted DEFINE + completed RESEARCH are the governing inputs.
- This document determines **what the module is**, **what it consumes**, **how it is decomposed**, and **which decisions remain open** for Specification and Owner approval.
- It does NOT finalize public API, exact schemas, thresholds, scoring, implementation technology, or model/provider choices. Those are **SPECIFICATION INPUT / UNRESOLVED** (Specification firewall).
- It does NOT resolve Future Scope beyond Education unless stated otherwise.

---

## 2. How to Read This Document

Every decision is labeled with one of:

| Label | Meaning |
| --- | --- |
| **FACT** | Verified repository/contract fact (frozen Phase 1/2/3/5/6/7/8/9, BLUEPRINT, DEFINE, RESEARCH) |
| **PRECEDENT** | Established project/governance precedent from prior accepted stage (Phase 4/5/6/7/8) |
| **INFERENCE** | Reasoned conclusion from facts; not directly stated |
| **ARCHITECTURE DECISION** | A decision this Architecture stage makes within its authority |
| **UNRESOLVED** | Not decidable here; requires Specification and/or Owner approval |

Each architecture question (Q10.1-10.12) records: problem, research evidence, alternatives (≥2 where meaningful), chosen approach, rationale, consequences, rejected alternatives, and unresolved implications.

**Specification firewall:** exact public API, exports, data schemas, test/acceptance/benchmark thresholds, pass/fail formulas, scoring formulas, implementation dependencies, and implementation technology are NOT finalized here. They are recorded as **SPECIFICATION INPUT / UNRESOLVED**.

---

## 3. Consumed Contracts (frozen)

**[FACT]** Phase 11 consumes the following frozen public surfaces, **barrel-only** (no deep imports), consistent with Phase 9 precedent:

### 3.1 Phase 1 — `@issue/foundation` (frozen)

**[FACT]** Public barrel (`phase-01-foundation/src/index.ts`): `VERSION`, `AppError`, `Result`, `LogLevel`, `IssueConfig`, `LoadConfigOptions`, `loadConfig`, `mergeConfigLayers`, `EnvSnapshot`, `readEnv`, `getSecret`, `redactionList`, `Logger`, `createLogger`, `assertContained`, `isContained`.

### 3.2 Phase 2 — `@issue/tool-runtime` (frozen)

**[FACT]** Public barrel (`phase-02/src/index.ts`): `TaskStatus`, `ToolOperation`, `ActionRef`, `ReadOptions`, `ListOptions`, `OutcomeClass`, `CorrectionDirection`, `FileContent`, `DirectoryEntry`, `DirectoryListing`, `ToolResult`, `TaskRefs`, `ResourceBounds`, `TaskOptions`, `TaskState`, `AvailableAction`, `DecisionProvider`, `Assessment`, `TaskResult`, `ToolRuntime`; functions `runTask`, `createToolRuntime`, `deriveAvailableActions`.

### 3.3 Phase 3 — `@issue/integration` (frozen, CLOSED)

**[FACT]** Public barrel (`phase-03/src/index.ts`): `runIntegrationTask`.

### 3.4 Phase 5 — `@issue/analytics` (frozen)

**[FACT]** Public barrel (`phase-05/src/index.ts`): `runAnalyticsTask` + 13 types, deterministic pipeline `READY → PLANNING → ACQUIRING → PREPARING → ANALYZING → INTERPRETING → VERIFYING → EVALUATING → terminal`.

### 3.5 Phase 6 — `@issue/config-cli` (frozen)

**[FACT]** Public barrel (`phase-06/src/index.ts`): `ConfigSchema`, `ResolvedConfig`, `ConfigProvenance`, `CliArgs`, `CliResult`, `resolveConfig`, `verifyConfig`, `getDefaultConfig`, `parseArgs`, `runCli`, `HELP_TEXT`, `createCliLogger`.

### 3.6 Phase 7 — `@issue/write-execution` (frozen)

**[FACT]** Public barrel (`phase-07/src/index.ts`): `writeFile`, `editFile`, `deleteFile`, `execProcess`, `gitStatus`, `gitDiff`, `gitCommit`, `gitBranch`, `httpFetch`, `createToolLogger`.

### 3.7 Phase 8 — `@issue/model-provider` (frozen)

**[FACT]** Public barrel (`phase-08/src/index.ts`): `ProviderConfig`, `ModelProvider`, `ModelRouter`, `createAnthropicProvider`, `createOpenAIProvider`, `createLocalProvider`, `createModelRouter`, `callModel`, `getProviderAuth`.

### 3.8 Phase 9 — `@issue/workspace` (frozen)

**[FACT]** Public barrel (`phase-09/src/index.ts`): `WorkspaceConfig`, `CheckAllResult`, `getWorkspaceConfig`, `verifyWorkspaces`, `runCheckAll`, `createWorkspaceLogger`.

### 3.9 Phase 4 — `@issue/research` (CLOSED/FROZEN, NOT consumed)

**[FACT]** Phase 4 (`@issue/research`) is NOT consumed by default per `phase-10/DEFINE.md:11` and Phase 9 precedent.

---

## 4. Module Decomposition

**[ARCHITECTURE DECISION]** Phase 11 is decomposed into exactly six internal modules, plus the public barrel:

- **model/** — `types.ts` (`EducationTaskRequest`, `EducationTaskResult`, `EducationTaskStatus`, `EducationWorkflowStep`, `EducationInput`, `EducationFinding`, `EducationReport`, `EducationApproval`, `EducationDecisionProvider`, `EducationEvaluationRecord`)
- **validate/** — `validate.ts` (Education object validation via `isContained` + `Result`, `EducationInput` `inline`/`localFile` acquisition via Phase 3 seam)
- **transform/** — `transform.ts` (`validate → transform` steps, `Education-{workflowId}-{N}` operation forms, deterministic transform `filter`/`derive` for Education objects)
- **approve/** — `approve.ts` (`decideApproval` via `EducationDecisionProvider`, no auto-approval, `approved: boolean` + `ProvenanceChain`)
- **notify/** — `notify.ts` (`notify` step, via `writeFile` + `Logger` with `redactionList`, no actual email/Slack)
- **machine/** — `machine.ts` (deterministic lifecycle `READY → VALIDATING → TRANSFORMING → APPROVING → NOTIFYING → ARCHIVING → terminal` with `COMPLETED/PARTIAL/ABSTAINED/FAILED/CANCELLED`, orchestrated via `EducationDecisionProvider`)

**[PRECEDENT]** Phase 5 decomposed into 6 modules (acquire, compute, evaluate, interpret, machine, model, parse, prepare, provider, report, verify) — Phase 11 is 6, per `BLUEPRINT.md:178-183`.

---

## 5. Architecture Questions

### Q10.1 — What is the Education Task Model?

**Problem:** No `EducationTaskRequest` exists in frozen phases; need typed Education workflow model.

**Research evidence:** `phase-05/src/internal/model.ts` `AnalyticsTaskRequest` (`objective`, `sources`, `plan`), R10.3.

**Alternatives:** (1) Reuse `AnalyticsTaskRequest` (rejected: Education workflow is `validate/transform/approve/notify/archive`, not `filter/derive/describe`). (2) `EducationTaskRequest` with `objective`, `workflow: EducationWorkflowStep[]`, `inputs: EducationInput[]` (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `EducationTaskRequest` as above, `EducationInput` is `DataSourceRef` for Education objects (invoices, onboarding forms), `EducationWorkflowStep` is `validate|transform|approve|notify|archive` with `Education-{workflowId}-{N}` forms.

**Consequences:** Typed, deterministic, reuse Phase 5 `DataSourceRef` pattern for Education objects.

**Rejected:** Reuse.

**Unresolved:** `EducationWorkflowStep` exact fields, `EducationInput` `path` vs `content`.

---

### Q10.2 — How is Education Data Acquisition Bounded?

**Problem:** Need `inline`/`localFile` for Education objects, read through Phase 3 seam with `isContained`.

**Research evidence:** `phase-05/src/internal/acquire.ts` `inline`/`localFile` via Phase 3 seam, R10.4.

**Alternatives:** (1) External/network acquisition (rejected: deferred Future Scope). (2) `inline` (JSON Education objects) and `localFile` (CSV/JSON Education data) via `isContained(cwd, path)` + `readFile` (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `validate` step acquires `EducationInput` `inline`/`localFile` via `isContained` + `readFile` (Phase 3 seam), no external/network.

**Consequences:** Bounded, `read-only` for acquisition, `write` only in `archive` via Phase 7 `writeFile`.

**Rejected:** External.

**Unresolved:** `localFile` `path` vs `content` for Education objects.

---

### Q10.3 — How is Approval Seam Modeled (no auto-approval)?

**Problem:** `BLUEPRINT.md:17` `User confirmation` + `Education` workflow `APPROVING` requires explicit approval, no auto-approval.

**Research evidence:** `phase-04/src/internal/provider.ts` `ResearchDecisionProvider` + `phase-05/src/internal/provider.ts` `AnalyticsDecisionProvider` (first-available stub, no model), R10.5.

**Alternatives:** (1) Auto-approval (rejected: violates `User confirmation`). (2) `EducationDecisionProvider` with `decideApproval(EducationObject, state) → Promise<EducationApproval>` where `EducationApproval = {approved: boolean, approver: string, reason?: string}` + deterministic `local` stub `approved: true, approver: "stub"` (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `EducationDecisionProvider` as above, `local` stub deterministic, real provider via `ModelProvider` `callModel` (from Phase 8) but not bound in Phase 11 minimal.

**Consequences:** No auto-approval, auditable `ProvenanceChain` + `EducationApproval`.

**Rejected:** Auto.

**Unresolved:** `decideApproval` signature, `EducationApproval` `reason` optional.

---

### Q10.4 — How is Provenance and Evaluation Modeled?

**[ARCHITECTURE DECISION]** `EducationFinding` with `ProvenanceChain` (`phase-04/src/internal/model.ts` `ProvenanceChain`) + `UncertaintyInfo` (`phase-05/src/internal/model.ts`) + `EducationApproval` and `EducationEvaluationRecord` 5-dimension `correctness`, `completeness`, `provenance`, `confidenceUncertainty`, `reproducibility` (same as Phase 5, reuse `AnalyticsEvaluationRecord` pattern).

---

### Q10.5 — How is Determinism Preserved?

**[ARCHITECTURE DECISION]** Education automation is deterministic where `EducationDecisionProvider` is deterministic (stub); `reproducibility` 1 on stub path, documented non-determinism for real provider via Phase 8 `ModelProvider` + `callModel` (network, model temperature).

---

### Q10.6 — What Remains Deferred?

Per DEFINE §12, **[ARCHITECTURE DECISION]** Future Scope beyond Education (Education, Scientific, Robotics, Engineering, Creative, Personal productivity, Specialized industry) remain **DEFERRED** and appear here as **UNRESOLVED**: no domain beyond Education.

---

### Q10.7 — What is the Public Barrel?

**[UNRESOLVED]** Exact exports are Specification firewall: proposed `export { runEducationTask }` + types `EducationTaskRequest`, `EducationTaskResult`, `EducationTaskStatus`, `EducationWorkflowStep`, `EducationInput`, `EducationFinding`, `EducationReport`, `EducationDecisionProvider` — but final list is SPECIFICATION INPUT, not decided here. Only constraint: barrel exports NOTHING from frozen phases' internals.

---

### Q10.8 — How is Failure Handled?

**[ARCHITECTURE DECISION]** Every fallible operation returns `Result<T, AppError>` with `issue.Education.*` codes: `issue.Education.not-contained`, `issue.Education.validation`, `issue.Education.not-found`, `issue.Education.approval-denied`, `issue.Education.not-allowed`.

---

### Q10.9 — How is Testing Structured?

**[ARCHITECTURE DECISION]** Tests under `phase-10/tests/`: `model.test.ts` (EducationTaskRequest validation), `validate.test.ts` (isContained + localFile), `approve.test.ts` (decideApproval stub), `machine.test.ts` (lifecycle `READY → VALIDATING → ... → terminal` with `COMPLETED/PARTIAL/ABSTAINED/FAILED/CANCELLED`), `public-api.test.ts`, `determinism.test.ts` (identical inputs → identical `EducationTaskResult`), `seam.integration.test.ts` (real `writeFile` via Phase 7). Coverage gate **≥80%** (Vitest v8, `include: ["src/**/*.ts"]`).

---

## 6. Decisions Summary

| ID | Decision | Status |
| --- | --- | --- |
| AD-10.1 | Consume frozen contracts barrel-only (1/2/3/5/6/7/8/9) | Draft |
| AD-10.2 | EducationTaskRequest with workflow + inputs | Draft |
| AD-10.3 | Education data acquisition inline/localFile via isContained | Draft |
| AD-10.4 | EducationDecisionProvider with decideApproval, no auto-approval | Draft |
| AD-10.5 | EducationFinding with ProvenanceChain + EducationApproval | Draft |
| AD-10.6 | Future Scope beyond Education remains DEFERRED | Draft |

All decisions become **Approved** at Architecture acceptance and **Frozen** at Phase 11 freeze.

---

## 7. Specification Firewall

Exact public API, exports, data schemas, test/acceptance/benchmark thresholds, pass/fail formulas, scoring formulas, implementation dependencies, and implementation technology are **NOT finalized here**. They are recorded as **SPECIFICATION INPUT / UNRESOLVED** and will be decided at Specification with Owner approval.

---

## 8. Security Considerations

Architecture preserves `ISSU_PROJECT.md:799-847` vectors: path traversal via `isContained`, no `eval`/`Function`, permission deny-by-default, audit logs via `Logger` + `redactionList`, credential protection via `getSecret`. Detailed verification at Security Audit (post-implementation).

---

## 9. End-of-Document Block

```
Phase 11 ARCHITECTURE RECORD: ACCEPTED (owner, 2026-08-22, 2H autonomous)
Phase 11 ARCHITECTURE STAGE: ACCEPTED — SPECIFICATION AUTHORIZED (owner, 2026-08-22, 2H autonomous)
SPECIFICATION AUTHORIZED: YES (owner, 2026-08-22, 2H autonomous)
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6/7/8/9 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 11 WORK STARTED: NO
COMMIT/PUSH: NO
```

