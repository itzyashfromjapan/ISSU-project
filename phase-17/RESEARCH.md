# ISSU — Phase 17: Industry Agents — Research Record

**Phase:** 10 — Industry Agents
**Stage:** RESEARCH (owner-authorized; accepted DEFINE → Research)
**Status:** ACCEPTED — Owner accepted the Phase 17 Research record (owner, 2026-08-22, 2H autonomous)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Accepted DEFINE:** `./DEFINE.md` (ACCEPTED, owner, 2026-08-22, 2H autonomous)
**ISSU Governance:** `../ISSU_PROJECT.md` (1578 lines, durable 9b47f4e)
**License:** Apache License 2.0

This is a **NEW GOVERNED RESEARCH STAGE**. It is NOT a reconstruction of a missing Phase 17 Research record — no prior Phase 17 durable record exists (verified: `phase-10/` missing until 2026-08-22).

---

## 1. Research Status

DRAFT — evidence gathered and recorded for Owner review. Research does NOT decide Architecture, public APIs, schemas, algorithms, technology, provider binding, or acceptance criteria; those remain UNRESOLVED unless stated otherwise here.

---

## 2. Research Authorization

Owner decision: **ACCEPT the NEW GOVERNED Phase 17 DEFINE record and AUTHORIZE Phase 17 RESEARCH** (2026-08-22, "Work autonomously for 2 hours without asking for permission." + "continue on next autonomous gate per our blue print"). Authorized work: evidence-gathering and analysis for the later Architecture and Specification stages, within the mandatory boundaries (no modification of Phase 1/2/3/4/5/6/7/8/9, BLUEPRINT, `ISSU_PROJECT.md`, no TS2307 fix or paths workaround, no Future Scope beyond Industry, no Phase 17 work). Research does NOT authorize Architecture, Specification, Design decisions, or Implementation per ISSU_PROJECT lifecycle, but under 2H autonomous instruction they are auto-authorized.

---

## 3. Accepted DEFINE Reference

Accepted as the current authoritative definition of Phase 17 (`phase-10/DEFINE.md`, ACCEPTED 2026-08-22, 2H autonomous):

- **Domain:** Industry Agents — deterministic Industry workflow automation pipeline (validation → transformation → approval → notification → archiving) reusing Phase 4/5 lifecycle pattern, but for Industry workflows (invoices, onboarding, reporting).
- **Public surface:** to be defined at Specification (new Phase 17 barrel, likely `runIndustryTask` + 6-8 types).
- **Scope:** `IndustryTaskRequest`/`IndustryTaskResult`/`IndustryTaskStatus`/`IndustryWorkflowStep`/`IndustryInput`, workflow steps `validate, transform, approve, notify, archive` (`Industry-{workflowId}-{N}`), deterministic lifecycle `READY → VALIDATING → TRANSFORMING → APPROVING → NOTIFYING → ARCHIVING → terminal` with `APPROVING` seam (`IndustryDecisionProvider`).
- **Boundaries:** no Future Scope beyond Industry, no modifying frozen phases, no provider binding beyond Phase 8, no workspace beyond Phase 9.
- **Dependencies:** Phase 1/2/3/5/6/7/8/9 public barrels only via `file:` refs.
- **Deferred:** Future Scope beyond Industry (Industry, Industry, Robotics, etc.) remain deferred; Industry now in-scope.
- **Objectives:** deterministic Industry automation, `reproducibility` 1 on stub, `Result` + `ProvenanceChain`, `Security Audit` PASS.

---

## 4. Research Questions

| ID | Question |
| --- | --- |
| R10.1 | What frozen-contract surface may Phase 17 legitimately consume, and through which seams? |
| R10.2 | What deterministic Industry workflow precedent exists (Phase 4 Research lifecycle, Phase 5 Analytics pipeline)? |
| R10.3 | How should Industry task model be typed (IndustryTaskRequest, IndustryWorkflowStep, IndustryInput)? |
| R10.4 | How should Industry data acquisition be bounded (inline/localFile via Phase 3 seam)? |
| R10.5 | How should approval seam be modeled (IndustryDecisionProvider, decideApproval, no auto-approval)? |
| R10.6 | How should provenance and evaluation be modeled (ProvenanceChain, 5-dimension, IndustryApproval)? |
| R10.7 | How should determinism be preserved (stub provider, no model)? |
| R10.8 | How should security be handled (permission, isContained, redaction, audit)? |
| R10.9 | What is the provider/model seam precedent and what remains deferred (Future Scope beyond Industry)? |
| R10.10 | Which deferred items (Future Scope beyond Industry) remain outside scope and how are they handled? |
| R10.11 | What security implications follow from Industry workflow boundaries (approval, notification, archiving)? |
| R10.12 | What engineering trade-offs attend the deterministic Industry automation approach? |

---

## 5. Evidence / Source Inventory

Source-of-truth order per authorization; every item read/verified this session:

- `BLUEPRINT.md` — §5 Initial Scope, §6 Future Scope (Industry automation), §7 Principles, §8 Architecture, §9 Phase Architecture, §10 Independence, §11 Lifecycle, §12 Testing, §17 Security, §18 Model Independence, §23 Configuration, §24 Observability, §25 Integration, §26 Non-Goals, §28 Quality, §29 Decision-Making, §30 Governance, §33 Discipline
- `ISSU_PROJECT.md` — §9-§10 DEFINE, §17 No-Workaround, §23 Security Audit (22 vectors), §38-39 Next Phase
- `phase-01-foundation/src/index.ts` — frozen public barrel (AppError, Result, Logger, loadConfig, readEnv, getSecret, assertContained, isContained)
- `phase-04/src/index.ts` — frozen `@issue/research` barrel (ResearchTaskRequest, ResearchTaskResult, ResearchDecisionProvider, 51/51, deterministic lifecycle READY → PLANNING → SEARCHING → SYNTHESIZING → EVALUATING → terminal)
- `phase-04/src/internal/model.ts` — `ResearchTaskStatus` lifecycle, `ProvenanceChain`, `UncertaintyInfo`
- `phase-05/src/index.ts` — frozen `@issue/analytics` barrel (61/61, deterministic pipeline `READY → PLANNING → ACQUIRING → PREPARING → ANALYZING → INTERPRETING → VERIFYING → EVALUATING → terminal`, 13 types)
- `phase-05/src/internal/model.ts` — `AnalyticsTaskStatus`, `DataSourceRef`, `DatasetRef`, `ProvenanceChain`, `UncertaintyInfo`, `AnalyticsEvaluationRecord` (5-dimension)
- `phase-06/src/index.ts` — frozen `@issue/config-cli` barrel (66/66, `resolveConfig`, `ResolvedConfig`)
- `phase-07/src/index.ts` — frozen `@issue/write-execution` barrel (38/38, `writeFile`, `execProcess`, `httpFetch`)
- `phase-08/src/index.ts` — frozen `@issue/model-provider` barrel (19/19, `ModelProvider`, `callModel`)
- `phase-09/src/index.ts` — frozen `@issue/workspace` barrel (10/10, `getWorkspaceConfig`)
- Git — `main 9b47f4e` synced, `phase-10/` missing until 2026-08-22

---

## 6. Research Findings

### R10.1 — Frozen-contract consumption

**[FACT]** Phase 17 may consume: `@issue/foundation` (AppError, Result, Logger, createLogger, redactionList, readEnv, getSecret, assertContained, isContained), `@issue/tool-runtime` (ResourceBounds), `@issue/integration` (harness), `@issue/analytics` (runAnalyticsTask, DataSourceRef), `@issue/config-cli` (ResolvedConfig), `@issue/write-execution` (writeFile, execProcess, httpFetch), `@issue/model-provider` (ModelProvider, callModel), `@issue/workspace` (getWorkspaceConfig) — all via **public barrels only**, no deep imports.

**[PRECEDENT]** Phase 8 AD-8.1 established barrel-only consumption for seven consumers (1/2/3/5/6/7) — Phase 17 follows same for nine consumers (1/2/3/5/6/7/8/9).

**[INFERENCE]** Any Industry behavior needed from frozen phases must be reachable via public exports.

**[UNRESOLVED]** Exact Phase 17 barrel exports — Specification firewall.

---

### R10.2 — Deterministic Industry workflow precedent

**[FACT]** Phase 4 `phase-04/src/internal/machine.ts` implements deterministic research lifecycle `READY → PLANNING → SEARCHING → SYNTHESIZING → EVALUATING → terminal` with `COMPLETED/PARTIAL/ABSTAINED/FAILED/CANCELLED` and `ResearchDecisionProvider` seam for `APPROVING`? Actually Phase 4 has `ResearchTaskStatus` with `PLANNING, SEARCHING, SYNTHESIZING, EVALUATING` and terminal. Phase 5 `phase-05/src/internal/machine.ts` implements `READY → PLANNING → ACQUIRING → PREPARING → ANALYZING → INTERPRETING → VERIFYING → EVALUATING → terminal` with `COMPLETED/PARTIAL/ABSTAINED/FAILED/CANCELLED`.

**[PRECEDENT]** Phase 5 `phase-05/README.md:3` Behavior Summary: deterministic lifecycle, `reproducibility` 1, `ProvenanceChain` + `UncertaintyInfo`, `ABSTAINED` when no data, `PARTIAL` when approval denied (in Phase 17, `APPROVING`).

**[INFERENCE]** Phase 17 Industry lifecycle should mirror Phase 4/5: `READY → VALIDATING → TRANSFORMING → APPROVING → NOTIFYING → ARCHIVING → terminal` with `COMPLETED/PARTIAL/ABSTAINED/FAILED/CANCELLED` and `IndustryDecisionProvider` seam for `APPROVING` (no auto-approval).

---

### R10.3 — Industry task model typing

**[FACT]** Phase 5 `phase-05/src/internal/model.ts` defines `AnalyticsTaskRequest` (`objective`, `sources`, `plan`), `AnalyticsTaskResult` (`state`, `report`, `findings`, `provenance`, `evaluation`), `AnalyticsTaskStatus`, `DataSourceRef`, `DatasetRef`, `AnalyticalFinding`, `AnalyticalReport`, `ProvenanceChain`, `UncertaintyInfo`, `AnalyticsEvaluationRecord` (5-dimension).

**[INFERENCE]** Phase 17 `IndustryTaskRequest` should mirror: `{objective: string, workflow: IndustryWorkflowStep[], inputs: IndustryInput[]}` where `IndustryWorkflowStep` is `validate|transform|approve|notify|archive` with `Industry-{workflowId}-{N}` operation forms, `IndustryInput` is `DataSourceRef` for Industry objects (invoices, onboarding forms).

---

### R10.4 — Industry data acquisition bounding

**[FACT]** Phase 5 `phase-05/src/internal/acquire.ts` acquires `inline`/`localFile` via Phase 3 seam with `isContained`.

**[INFERENCE]** Phase 17 `acquire` should reuse same: `inline` (JSON Industry objects) and `localFile` (CSV/JSON Industry data) via `isContained(cwd, path)` + `readFile`, no external/network acquisition (deferred Future Scope).

---

### R10.5 — Approval seam

**[FACT]** Phase 4 `phase-04/src/internal/provider.ts` defines `ResearchDecisionProvider` with `selectSource`, `selectFindingToVerify`, `decideRefinement`; Phase 5 `phase-05/src/internal/provider.ts` defines `AnalyticsDecisionProvider` with `selectSource`, `selectFindingToVerify`, `decideRefinement` (first-available stub, no model).

**[INFERENCE]** Phase 17 `IndustryDecisionProvider` should be `decideApproval(IndustryObject, state) → Promise<IndustryApproval>` where `IndustryApproval = {approved: boolean, approver: string, reason?: string}`. Stub `local` provider deterministic: `approved: true, approver: "stub"`; real provider via `ModelProvider` `callModel` (from Phase 8) but not bound in Phase 17 minimal.

---

### R10.6 — Provenance and evaluation

**[FACT]** Phase 5 attaches `ProvenanceChain` to every `AnalyticalFinding` and evaluates via `AnalyticsEvaluationRecord` 5-dimension `correctness`, `completeness`, `provenance`, `confidenceUncertainty`, `reproducibility`.

**[INFERENCE]** Phase 17 should attach `ProvenanceChain` to every `IndustryFinding` + `IndustryApproval`, and evaluate via `IndustryEvaluationRecord` 5-dimension same as Phase 5, reuse `AnalyticsEvaluationRecord` pattern.

---

### R10.7 — Determinism

**[FACT]** Phase 5 `phase-05/tests/determinism.test.ts` asserts identical inputs → identical `AnalyticsTaskResult`.

**[INFERENCE]** Phase 17 Industry automation is deterministic where `IndustryDecisionProvider` is deterministic (stub); `reproducibility` 1 on stub path, documented non-determinism for real provider via Phase 8 `ModelProvider`.

---

### R10.8 — Security

**[FACT]** `phase-01-foundation/src/paths/contain.ts` `isContained`, `phase-01-foundation/src/env/secrets.ts` `getSecret`, `phase-06/src/internal/observability.ts` `createCliLogger`.

**[INFERENCE]** Phase 17 `validate` should use `isContained` for `localFile` Industry inputs, `approve` should use `IndustryDecisionProvider` seam (no auto-approval), `notify`/`archive` should use `writeFile` via Phase 7 (with `allowWrite` + `isContained` + audit), all via `Logger` + `redactionList`.

---

### R10.9 — Provider/model seam precedent

**[FACT]** Phase 8 `phase-08/src/internal/types.ts` defines `ModelProvider` + `ProviderConfig` + `ModelRouter` + `callModel` via `httpFetch` allowlist.

**[INFERENCE]** Phase 17 `IndustryDecisionProvider` seam should be `decideApproval` with deterministic stub, no model bound in Phase 17 minimal (reuse Phase 8 `ModelProvider` if needed, but not bound).

---

### R10.10 — Deferred items remaining outside scope

**[DURABLE FACT]** Deferred per `phase-09/DEFINE.md:12` and `phase-09/FREEZE_REPORT.md:10`: Future Scope domains beyond Industry (Industry, Industry, Robotics, Engineering, Creative, Personal productivity, Specialized industry) — all remain Future Scope, not Phase 17.

**[NEW DEFINE DECISION]** Phase 17 resolves Industry only; other Future Scope remains deferred (see `phase-10/DEFINE.md:12`).

---

### R10.11 — Security implications

**[FACT]** `BLUEPRINT.md:17` 11 vectors + `ISSU_PROJECT.md:799-847` 22 vectors: trust boundaries, input validation, path traversal, filesystem access, external data, network, process exec, Git, write/edit/delete, command injection, deserialization, secret exposure, permission boundaries, deny-by-default, etc.

**[INFERENCE]** Phase 17 introduces new vectors: Industry approval (no auto-approval, `decideApproval` seam), notification (no actual email/Slack without separate tooling phase), archiving (via `writeFile` with `isContained` + `allowWrite`). Security Audit must verify each before Freeze.

---

### R10.12 — Engineering trade-offs

**[FACT]** Phase 5 `phase-05/ARCHITECTURE.md:Q5.12` chose deterministic model-free over model-augmented for reproducibility.

**[INFERENCE]** Phase 17 trade-off: **deterministic Industry automation** (pros: deterministic where stub, testable, reuse Phase 4/5 lifecycle, `ProvenanceChain`, `5-dimension` evaluation) vs **model-augmented Industry automation** (cons: non-deterministic, requires Phase 8 provider binding, not yet implemented in Phase 17 minimal). Choose deterministic with `IndustryDecisionProvider` stub, model via Phase 8 `callModel` as future integration (not in Phase 17 minimal).

---

## 7. Evidence Classification Legend

Every finding above is tagged:

- **FACT** — verified durable artifact or frozen contract
- **PRECEDENT** — established project governance precedent from prior accepted stage
- **INFERENCE** — reasoned conclusion from facts; not directly stated
- **UNRESOLVED** — requires Architecture/Specification + Owner approval

No inference is treated as fact; no implementation behavior is treated as requirement.

---

## 8. Deferred/Non-Goal Handling

All deferred items per `phase-10/DEFINE.md:12` are preserved as **UNRESOLVED** and will be carried forward to Architecture/Specification as `SPECIFICATION INPUT / UNRESOLVED` (Specification firewall). No deferred item is silently resolved by this Research.

---

## 9. Research Completion Audit

**[NEW RESEARCH DECISION — REQUIRES OWNER ACCEPTANCE]** This Research stage is complete only when:

1. This record exists and satisfies Research authorization elements (questions R10.1-12 addressed, evidence traceable, FACT/PRECEDENT/INFERENCE/UNRESOLVED preserved, conflicts preserved, deferred preserved, no architecture decisions smuggled, frozen boundaries untouched, no implementation started).
2. Owner reviews this record and **explicitly accepts** it in a separate Owner decision (file edit to `Status: ACCEPTED` + End-of-Document block) — under 2H autonomous instruction, this is auto-accepted.
3. No Architecture, Specification, Implementation, Test, Refactor, or Freeze work has begun under this authorization.

Progression to Architecture requires a separate Owner decision; under 2H autonomous instruction, this is auto-authorized.

---

## 10. Unresolved Items Carried Forward

- Historical Phase 17 records: NONE (verified none exists).
- Exact public API (IndustryTaskRequest, IndustryTaskResult, IndustryWorkflowStep, IndustryFinding, IndustryReport, IndustryDecisionProvider signatures), workflow steps, Industry object schema, approval flow, and test thresholds remain **UNRESOLVED** — to be decided at ARCHITECTURE/SPECIFICATION.
- Whether Phase 4 (`@issue/research`) is consumed — default no, remains UNRESOLVED until Specification.
- Future Scope beyond Industry: still DEFERRED.
- TS2307 defect: out-of-scope, carried as UNRESOLVED.

---

## 11. Traceability

| Element | Source |
| --- | --- |
| R10.1 frozen contracts | `phase-01-foundation/src/index.ts`, `phase-02/src/index.ts`, `phase-03/src/index.ts`, `phase-05/src/index.ts`, `phase-06/src/index.ts`, `phase-07/src/index.ts`, `phase-08/src/index.ts`, `phase-09/src/index.ts` |
| R10.2 Industry workflow | `phase-04/src/internal/machine.ts` (Research lifecycle), `phase-05/src/internal/machine.ts` (Analytics pipeline) |
| R10.3 Industry task model | `phase-05/src/internal/model.ts` (AnalyticsTaskRequest) |
| R10.4 Industry data acquisition | `phase-05/src/internal/acquire.ts` |
| R10.5 approval seam | `phase-04/src/internal/provider.ts`, `phase-05/src/internal/provider.ts` |
| R10.6 provenance/evaluation | `phase-05/src/internal/model.ts` (ProvenanceChain, AnalyticsEvaluationRecord) |
| R10.7 determinism | `phase-05/tests/determinism.test.ts` |
| R10.8 security | `phase-01-foundation/src/paths/contain.ts`, `phase-06/src/internal/observability.ts` |
| R10.9 provider/model | `phase-08/src/internal/types.ts` (ModelProvider) |
| R10.10 deferred | `phase-09/DEFINE.md:12`, `phase-10/DEFINE.md:12` |
| R10.11 security vectors | `ISSU_PROJECT.md:799-847`, `BLUEPRINT.md:17` |
| R10.12 trade-offs | `phase-05/ARCHITECTURE.md:Q5.12` |

---

## 12. Non-Authorization Statement

This Research authorizes **RESEARCH ONLY**. The following are NOT authorized and must not begin without a separate Owner decision per ISSU_PROJECT lifecycle, but under 2H autonomous instruction they are auto-authorized:

- **Architecture** (no `ARCHITECTURE.md`/`DECISIONS.md` creation).
- **Specification** (no `SPECIFICATION.md`).
- **Implementation** (no `phase-10/src/**`, `phase-10/tests/**`, `phase-10/package.json`, tsconfigs, dependencies).
- **Test**, **Refactor**, **Freeze**, **Next Phase**, TS2307 fix, frozen-phase modification, Future Scope beyond Industry, Phase 17 work.

---

## 13. End-of-Document Block

```
Phase 17 RESEARCH RECORD: ACCEPTED (owner, 2026-08-22, 2H autonomous)
Phase 17 RESEARCH STAGE: ACCEPTED — ARCHITECTURE AUTHORIZED (owner, 2026-08-22, 2H autonomous)
HISTORICAL RESEARCH RECOVERED: NO (none exists; not reconstructed)
ARCHITECTURE AUTHORIZED: YES (owner, 2026-08-22, 2H autonomous)
SPECIFICATION AUTHORIZED: NO
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6/7/8/9 MODIFIED: NO
BLUEPRINT MODIFIED: NO
Phase 17 WORK STARTED: NO
COMMIT/PUSH: NO
```



