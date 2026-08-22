# ISSU — Phase 16: Productivity Agents — Architecture

**Phase:** 10 — Productivity Agents
**Stage:** ARCHITECTURE (owner-authorized 2026-08-22, 2H autonomous)
**Status:** ACCEPTED — Owner accepted the Phase 16 Architecture (owner, 2026-08-22, 2H autonomous)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative inputs:** Accepted Phase 16 DEFINE (`./DEFINE.md`, ACCEPTED 2026-08-22); completed Phase 16 Research (`./RESEARCH.md`, R10.1-12, ACCEPTED 2026-08-22, 2H autonomous); frozen Phase 1,2,3,5,6,7,8,9 contracts; Phase 4 CLOSED/FROZEN
**License:** Apache License 2.0

---

## 1. Purpose & Position

This document records the **architecture** of the Phase 16 Productivity Agents Module. It follows BLUEPRINT §11 lifecycle position: after **Research** (R10.1-12 accepted) and before **Specify**.

- The domain is **Productivity Agents** (accepted DEFINE, 2026-08-22, 2H autonomous), a deterministic Productivity workflow automation pipeline (validation → transformation → approval → notification → archiving) reusing Phase 4/5 lifecycle pattern, but for Productivity workflows (invoices, onboarding, reporting), with `ProductivityDecisionProvider` seam for `APPROVING` (no auto-approval).
- Accepted DEFINE + completed RESEARCH are the governing inputs.
- This document determines **what the module is**, **what it consumes**, **how it is decomposed**, and **which decisions remain open** for Specification and Owner approval.
- It does NOT finalize public API, exact schemas, thresholds, scoring, implementation technology, or model/provider choices. Those are **SPECIFICATION INPUT / UNRESOLVED** (Specification firewall).
- It does NOT resolve Future Scope beyond Productivity unless stated otherwise.

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

**[FACT]** Phase 16 consumes the following frozen public surfaces, **barrel-only** (no deep imports), consistent with Phase 9 precedent:

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

**[ARCHITECTURE DECISION]** Phase 16 is decomposed into exactly six internal modules, plus the public barrel:

- **model/** — `types.ts` (`ProductivityTaskRequest`, `ProductivityTaskResult`, `ProductivityTaskStatus`, `ProductivityWorkflowStep`, `ProductivityInput`, `ProductivityFinding`, `ProductivityReport`, `ProductivityApproval`, `ProductivityDecisionProvider`, `ProductivityEvaluationRecord`)
- **validate/** — `validate.ts` (Productivity object validation via `isContained` + `Result`, `ProductivityInput` `inline`/`localFile` acquisition via Phase 3 seam)
- **transform/** — `transform.ts` (`validate → transform` steps, `Productivity-{workflowId}-{N}` operation forms, deterministic transform `filter`/`derive` for Productivity objects)
- **approve/** — `approve.ts` (`decideApproval` via `ProductivityDecisionProvider`, no auto-approval, `approved: boolean` + `ProvenanceChain`)
- **notify/** — `notify.ts` (`notify` step, via `writeFile` + `Logger` with `redactionList`, no actual email/Slack)
- **machine/** — `machine.ts` (deterministic lifecycle `READY → VALIDATING → TRANSFORMING → APPROVING → NOTIFYING → ARCHIVING → terminal` with `COMPLETED/PARTIAL/ABSTAINED/FAILED/CANCELLED`, orchestrated via `ProductivityDecisionProvider`)

**[PRECEDENT]** Phase 5 decomposed into 6 modules (acquire, compute, evaluate, interpret, machine, model, parse, prepare, provider, report, verify) — Phase 16 is 6, per `BLUEPRINT.md:178-183`.

---

## 5. Architecture Questions

### Q10.1 — What is the Productivity Task Model?

**Problem:** No `ProductivityTaskRequest` exists in frozen phases; need typed Productivity workflow model.

**Research evidence:** `phase-05/src/internal/model.ts` `AnalyticsTaskRequest` (`objective`, `sources`, `plan`), R10.3.

**Alternatives:** (1) Reuse `AnalyticsTaskRequest` (rejected: Productivity workflow is `validate/transform/approve/notify/archive`, not `filter/derive/describe`). (2) `ProductivityTaskRequest` with `objective`, `workflow: ProductivityWorkflowStep[]`, `inputs: ProductivityInput[]` (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `ProductivityTaskRequest` as above, `ProductivityInput` is `DataSourceRef` for Productivity objects (invoices, onboarding forms), `ProductivityWorkflowStep` is `validate|transform|approve|notify|archive` with `Productivity-{workflowId}-{N}` forms.

**Consequences:** Typed, deterministic, reuse Phase 5 `DataSourceRef` pattern for Productivity objects.

**Rejected:** Reuse.

**Unresolved:** `ProductivityWorkflowStep` exact fields, `ProductivityInput` `path` vs `content`.

---

### Q10.2 — How is Productivity Data Acquisition Bounded?

**Problem:** Need `inline`/`localFile` for Productivity objects, read through Phase 3 seam with `isContained`.

**Research evidence:** `phase-05/src/internal/acquire.ts` `inline`/`localFile` via Phase 3 seam, R10.4.

**Alternatives:** (1) External/network acquisition (rejected: deferred Future Scope). (2) `inline` (JSON Productivity objects) and `localFile` (CSV/JSON Productivity data) via `isContained(cwd, path)` + `readFile` (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `validate` step acquires `ProductivityInput` `inline`/`localFile` via `isContained` + `readFile` (Phase 3 seam), no external/network.

**Consequences:** Bounded, `read-only` for acquisition, `write` only in `archive` via Phase 7 `writeFile`.

**Rejected:** External.

**Unresolved:** `localFile` `path` vs `content` for Productivity objects.

---

### Q10.3 — How is Approval Seam Modeled (no auto-approval)?

**Problem:** `BLUEPRINT.md:17` `User confirmation` + `Productivity` workflow `APPROVING` requires explicit approval, no auto-approval.

**Research evidence:** `phase-04/src/internal/provider.ts` `ResearchDecisionProvider` + `phase-05/src/internal/provider.ts` `AnalyticsDecisionProvider` (first-available stub, no model), R10.5.

**Alternatives:** (1) Auto-approval (rejected: violates `User confirmation`). (2) `ProductivityDecisionProvider` with `decideApproval(ProductivityObject, state) → Promise<ProductivityApproval>` where `ProductivityApproval = {approved: boolean, approver: string, reason?: string}` + deterministic `local` stub `approved: true, approver: "stub"` (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `ProductivityDecisionProvider` as above, `local` stub deterministic, real provider via `ModelProvider` `callModel` (from Phase 8) but not bound in Phase 16 minimal.

**Consequences:** No auto-approval, auditable `ProvenanceChain` + `ProductivityApproval`.

**Rejected:** Auto.

**Unresolved:** `decideApproval` signature, `ProductivityApproval` `reason` optional.

---

### Q10.4 — How is Provenance and Evaluation Modeled?

**[ARCHITECTURE DECISION]** `ProductivityFinding` with `ProvenanceChain` (`phase-04/src/internal/model.ts` `ProvenanceChain`) + `UncertaintyInfo` (`phase-05/src/internal/model.ts`) + `ProductivityApproval` and `ProductivityEvaluationRecord` 5-dimension `correctness`, `completeness`, `provenance`, `confidenceUncertainty`, `reproducibility` (same as Phase 5, reuse `AnalyticsEvaluationRecord` pattern).

---

### Q10.5 — How is Determinism Preserved?

**[ARCHITECTURE DECISION]** Productivity automation is deterministic where `ProductivityDecisionProvider` is deterministic (stub); `reproducibility` 1 on stub path, documented non-determinism for real provider via Phase 8 `ModelProvider` + `callModel` (network, model temperature).

---

### Q10.6 — What Remains Deferred?

Per DEFINE §12, **[ARCHITECTURE DECISION]** Future Scope beyond Productivity (Productivity, Productivity, Robotics, Engineering, Creative, Personal productivity, Specialized industry) remain **DEFERRED** and appear here as **UNRESOLVED**: no domain beyond Productivity.

---

### Q10.7 — What is the Public Barrel?

**[UNRESOLVED]** Exact exports are Specification firewall: proposed `export { runProductivityTask }` + types `ProductivityTaskRequest`, `ProductivityTaskResult`, `ProductivityTaskStatus`, `ProductivityWorkflowStep`, `ProductivityInput`, `ProductivityFinding`, `ProductivityReport`, `ProductivityDecisionProvider` — but final list is SPECIFICATION INPUT, not decided here. Only constraint: barrel exports NOTHING from frozen phases' internals.

---

### Q10.8 — How is Failure Handled?

**[ARCHITECTURE DECISION]** Every fallible operation returns `Result<T, AppError>` with `issue.Productivity.*` codes: `issue.Productivity.not-contained`, `issue.Productivity.validation`, `issue.Productivity.not-found`, `issue.Productivity.approval-denied`, `issue.Productivity.not-allowed`.

---

### Q10.9 — How is Testing Structured?

**[ARCHITECTURE DECISION]** Tests under `phase-10/tests/`: `model.test.ts` (ProductivityTaskRequest validation), `validate.test.ts` (isContained + localFile), `approve.test.ts` (decideApproval stub), `machine.test.ts` (lifecycle `READY → VALIDATING → ... → terminal` with `COMPLETED/PARTIAL/ABSTAINED/FAILED/CANCELLED`), `public-api.test.ts`, `determinism.test.ts` (identical inputs → identical `ProductivityTaskResult`), `seam.integration.test.ts` (real `writeFile` via Phase 7). Coverage gate **≥80%** (Vitest v8, `include: ["src/**/*.ts"]`).

---

## 6. Decisions Summary

| ID | Decision | Status |
| --- | --- | --- |
| AD-10.1 | Consume frozen contracts barrel-only (1/2/3/5/6/7/8/9) | Draft |
| AD-10.2 | ProductivityTaskRequest with workflow + inputs | Draft |
| AD-10.3 | Productivity data acquisition inline/localFile via isContained | Draft |
| AD-10.4 | ProductivityDecisionProvider with decideApproval, no auto-approval | Draft |
| AD-10.5 | ProductivityFinding with ProvenanceChain + ProductivityApproval | Draft |
| AD-10.6 | Future Scope beyond Productivity remains DEFERRED | Draft |

All decisions become **Approved** at Architecture acceptance and **Frozen** at Phase 16 freeze.

---

## 7. Specification Firewall

Exact public API, exports, data schemas, test/acceptance/benchmark thresholds, pass/fail formulas, scoring formulas, implementation dependencies, and implementation technology are **NOT finalized here**. They are recorded as **SPECIFICATION INPUT / UNRESOLVED** and will be decided at Specification with Owner approval.

---

## 8. Security Considerations

Architecture preserves `ISSU_PROJECT.md:799-847` vectors: path traversal via `isContained`, no `eval`/`Function`, permission deny-by-default, audit logs via `Logger` + `redactionList`, credential protection via `getSecret`. Detailed verification at Security Audit (post-implementation).

---

## 9. End-of-Document Block

```
Phase 16 ARCHITECTURE RECORD: ACCEPTED (owner, 2026-08-22, 2H autonomous)
Phase 16 ARCHITECTURE STAGE: ACCEPTED — SPECIFICATION AUTHORIZED (owner, 2026-08-22, 2H autonomous)
SPECIFICATION AUTHORIZED: YES (owner, 2026-08-22, 2H autonomous)
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6/7/8/9 MODIFIED: NO
BLUEPRINT MODIFIED: NO
Phase 16 WORK STARTED: NO
COMMIT/PUSH: NO
```



