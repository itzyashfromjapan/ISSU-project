# ISSU — Phase 16: Productivity Automation Agents — Architecture Decisions

**Phase:** 10 — Productivity Automation Agents
**Stage:** ARCHITECTURE (owner-authorized 2026-08-22, 2H autonomous)
**Status:** Draft — records the architectural decisions made in `./ARCHITECTURE.md`; decisions become **Approved** at Architecture acceptance and **Frozen** at the Phase 16 phase freeze
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative specification:** `./ARCHITECTURE.md`
**License:** Apache License 2.0

This file records the **genuinely non-obvious architectural decisions** made by the Phase 16 ARCHITECTURE stage. Per BLUEPRINT §7.11 and §30, each decision includes Decision, Context, Evidence, Alternatives, Rationale, Consequences, and Status. Decision IDs are stable references used across the Phase 16 documents.

No decision here contradicts the frozen Phase 1,2,3,5,6,7,8,9 contracts, which remain authoritative. No decision resolves a Future Scope domain beyond Productivity without separate Owner authorization.

---

## AD-10.1 — Phase 16 consumes frozen contracts barrel-only

- **Decision:** Phase 16 consumes Phase 1 (`@issue/foundation`), Phase 2 (`@issue/tool-runtime`), Phase 3 (`@issue/integration`), Phase 5 (`@issue/analytics`), Phase 6 (`@issue/config-cli`), Phase 7 (`@issue/write-execution`), Phase 8 (`@issue/model-provider`), and Phase 9 (`@issue/workspace`) **only through their public package barrels**, with zero deep imports.
- **Context:** Phase 9 AD-9.1 established barrel-only consumption for eight consumers (1/2/3/5/6/7/8) — Phase 16 now consumes nine.
- **Evidence:** FACT — Phase 9 `ARCHITECTURE.md:3.1-3.8`; PRECEDENT — Phase 9 AD-9.1 (`phase-09/DECISIONS.md:AD-9.1`); R10.1.
- **Alternatives:** (1) deep imports of internal modules; (2) reimplementing frozen behavior in Phase 16.
- **Rationale:** Preserves phase isolation, contract stability, and frozen-phase integrity.
- **Consequences:** Any behavior needed from frozen phase must be reachable via public exports.
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-10.2 — ProductivityTaskRequest with workflow + inputs

- **Decision:** `ProductivityTaskRequest` with `objective`, `workflow: ProductivityWorkflowStep[]`, `inputs: ProductivityInput[]` where `ProductivityWorkflowStep` is `validate|transform|approve|notify|archive` with `Productivity-{workflowId}-{N}` forms and `ProductivityInput` is `DataSourceRef` for Productivity objects (invoices, onboarding forms).
- **Context:** No `ProductivityTaskRequest` exists in frozen phases; need typed Productivity workflow model, per `BLUEPRINT.md:6` Productivity automation.
- **Evidence:** FACT — `phase-05/src/internal/model.ts` `AnalyticsTaskRequest`; R10.3.
- **Alternatives:** (1) Reuse `AnalyticsTaskRequest` (rejected: Productivity workflow is `validate/transform/approve/notify/archive`, not `filter/derive/describe`).
- **Rationale:** Typed, deterministic, reuse Phase 5 `DataSourceRef` pattern for Productivity objects.
- **Consequences:** Productivity workflow is typed and deterministic.
- **Status:** Draft.

---

## AD-10.3 — Productivity data acquisition inline/localFile via isContained

- **Decision:** Productivity data acquisition `inline` (JSON Productivity objects) and `localFile` (CSV/JSON Productivity data) via `isContained(cwd, path)` + `readFile` (Phase 3 seam), no external/network.
- **Context:** `phase-05/src/internal/acquire.ts` `inline`/`localFile` via Phase 3 seam, R10.4, `BLUEPRINT.md:6` Productivity automation.
- **Evidence:** FACT — `phase-05/src/internal/acquire.ts` `inline`/`localFile` via Phase 3 seam; R10.4.
- **Alternatives:** (1) External/network acquisition (rejected: deferred Future Scope).
- **Rationale:** Bounded, `read-only` for acquisition, `write` only in `archive` via Phase 7 `writeFile`.
- **Consequences:** Productivity data is bounded and secure.
- **Status:** Draft.

---

## AD-10.4 — ProductivityDecisionProvider with decideApproval, no auto-approval

- **Decision:** `ProductivityDecisionProvider` with `decideApproval(ProductivityObject, state) → Promise<ProductivityApproval>` where `ProductivityApproval = {approved: boolean, approver: string, reason?: string}` + deterministic `local` stub `approved: true, approver: "stub"`.
- **Context:** `BLUEPRINT.md:17` `User confirmation` + Productivity workflow `APPROVING` requires explicit approval, no auto-approval, per `ISSU_PROJECT.md:23` `permission boundaries`.
- **Evidence:** FACT — `phase-04/src/internal/provider.ts` `ResearchDecisionProvider` + `phase-05/src/internal/provider.ts` `AnalyticsDecisionProvider` (first-available stub, no model); R10.5.
- **Alternatives:** (1) Auto-approval (rejected: violates `User confirmation`).
- **Rationale:** No auto-approval, auditable `ProvenanceChain` + `ProductivityApproval`.
- **Consequences:** Productivity approval is explicit and auditable.
- **Status:** Draft.

---

## AD-10.5 — ProductivityFinding with ProvenanceChain + ProductivityApproval

- **Decision:** `ProductivityFinding` with `ProvenanceChain` (`phase-04/src/internal/model.ts`) + `UncertaintyInfo` (`phase-05/src/internal/model.ts`) + `ProductivityApproval` and `ProductivityEvaluationRecord` 5-dimension `correctness`, `completeness`, `provenance`, `confidenceUncertainty`, `reproducibility` (same as Phase 5, reuse `AnalyticsEvaluationRecord` pattern).
- **Context:** Phase 5 attaches `ProvenanceChain` to every `AnalyticalFinding` and evaluates via `AnalyticsEvaluationRecord` 5-dimension.
- **Evidence:** FACT — `phase-05/src/internal/model.ts` `ProvenanceChain`, `AnalyticsEvaluationRecord`; R10.6.
- **Alternatives:** (1) No provenance (rejected: not auditable).
- **Rationale:** Productivity finding is auditable and evaluable.
- **Consequences:** Productivity report is verifiable.
- **Status:** Draft.

---

## AD-10.6 — Future Scope beyond Productivity remains DEFERRED

- **Decision:** No decision here resolves Future Scope beyond Productivity (Productivity, Productivity, Robotics, Engineering, Creative, Personal productivity, Specialized industry). They remain **DEFERRED** and appear as **UNRESOLVED** in Architecture Q10.6.
- **Context:** `phase-10/DEFINE.md:12` explicitly defers them.
- **Evidence:** FACT — `phase-10/DEFINE.md:12`; R10.10.
- **Alternatives:** (1) Resolve them now (rejected: requires separate Owner authorization).
- **Rationale:** Keeps Phase 16 scope disciplined.
- **Consequences:** Future phase can address domains without Phase 16 being blocked.
- **Status:** Draft.

---

## Status Summary

All 6 decisions are **Draft** — awaiting Architecture acceptance. At Architecture acceptance they become **Approved**; at Phase 16 freeze they become **Frozen**.



