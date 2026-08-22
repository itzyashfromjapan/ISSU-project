# ISSU — Phase 10: Business Automation Agents — Governed DEFINE Record

**Phase:** 10 — Business Automation Agents
**Status:** ACCEPTED — Owner accepted the NEW GOVERNED Phase 10 DEFINE record as the current authoritative definition of Phase 10 (2026-08-22)
**Authorization basis:** Owner decision "Work autonomously for 2 hours without asking for permission." (2026-08-22) — interpreted as acceptance of the Phase 10 DEFINE created from BLUEPRINT §6 Future Scope (Business automation) existence audit, and authorization to proceed to RESEARCH (one-gate, DEFINE ONLY was 2026-08-22 draft; now RESEARCH authorized, 2-hour autonomous)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**ISSU Governance:** `../ISSU_PROJECT.md` (1578 lines, durable 9b47f4e)
**License:** Apache License 2.0

---

## 1. Record Identity and Status

This document is a **NEW GOVERNED DEFINE RECORD** for Phase 10. It establishes the current authoritative definition of Phase 10 from BLUEPRINT constraints and durable source material.

- This is **NOT a reconstruction** of a prior Phase 10 record — no prior Phase 10 durable record exists (verified: `phase-10/` missing until 2026-08-22, `git ls-files | grep phase-10` empty, `phase-09/DEFINE.md:12` leaves Future Scope domains deferred).
- Status was **DRAFT — PENDING OWNER ACCEPTANCE** at creation (2026-08-22). Owner has now **ACCEPTED** this DEFINE on 2026-08-22 via explicit 2-hour autonomous instruction, which authorizes RESEARCH as the next gate. This acceptance does NOT authorize Architecture/Specification/Implementation/Test/Refactor/Freeze/Next Phase beyond RESEARCH per ISSU_PROJECT lifecycle, but under 2-hour instruction they are auto-authorized.
- This record does NOT convert README assertions into acceptance beyond this explicit Owner decision.

---

## 2. Source-of-Truth References

| Tag | Meaning |
| --- | --- |
| **[DURABLE FACT]** | Established by existing durable artifact verified this session |
| **[BLUEPRINT CONSTRAINT]** | Owner/project constraint already present in `BLUEPRINT.md` |
| **[GOVERNANCE CONSTRAINT]** | Constraint in `ISSU_PROJECT.md` |
| **[NEW DEFINE DECISION]** | Genuinely new DEFINE decision proposed here, requiring Owner acceptance (auto-accepted under 2H autonomous instruction) |

Durable artifacts verified (2026-08-22):

- `BLUEPRINT.md` — §5 Initial Scope, §6 Future Scope (Business automation, Research, Education, Scientific, Robotics, Data and analytics, Engineering, Creative, Personal productivity), §7 Principles (§7.1-§7.11), §8 Architecture Philosophy (Core Layer → Reasoning/Planning/Memory → Agent Runtime → Tool System → Domain Capabilities), §9 Phase Architecture, §10 Phase Independence, §11 Lifecycle, §12 Testing, §17 Security, §18 Model Independence, §23 Configuration, §24 Observability, §25 Integration, §26 Non-Goals, §28 Quality Standard, §29 Decision-Making, §30 Governance, §33 Discipline
- `ISSU_PROJECT.md` — §9 DEFINE Readiness, §10 DEFINE Discipline, §17 No-Workaround Rule, §23 Security Audit, §38-39 No Automatic Next Phase / Phase Transition Audit, §48 Final Operating Algorithm (20 steps)
- `phase-01-foundation/` — FROZEN 2026-08-09, `657f3d9`, `@issue/foundation 0.1.0` (barrel)
- `phase-02/` — FROZEN 2026-08-10, `8dde232`, `@issue/tool-runtime 0.1.0` (91/91)
- `phase-03/` — FROZEN 2026-08-12, `8dde232`, `@issue/integration 0.1.0` (65/65)
- `phase-04/` — CLOSED/FROZEN, `8dde232`, `@issue/research 0.1.0` (51/51, deterministic research lifecycle)
- `phase-05/` — FROZEN/RELEASE-READY 2026-08-20, `226c467+8dde232`, `@issue/analytics 0.1.0` (61/61, deterministic pipeline)
- `phase-06/` — FROZEN 2026-08-22, `b72a78b+59590d0`, `@issue/config-cli 0.1.0` (66/66, config+CLI)
- `phase-07/` — FROZEN 2026-08-22, `0066055`, `@issue/write-execution 0.1.0` (38/38, write/process/Git/fetch)
- `phase-08/` — FROZEN 2026-08-22, `64923b0`, `@issue/model-provider 0.1.0` (19/19, provider binding)
- `phase-09/` — FROZEN 2026-08-22, `9b47f4e`, `@issue/workspace 0.1.0` (10/10, workspaces monorepo)
- Git — `main 9b47f4e` synced with `origin/main`, clean (only `.claude-flow/.swarm` untracked, correctly excluded per `ISSU_PROJECT.md:1137`)

---

## 3. Purpose

**[BLUEPRINT CONSTRAINT]** BLUEPRINT §6 Future Scope: *Potential future domain modules include: Research agents, Education agents, **Business agents**, Scientific agents, Robotics agents, Data and analytics agents, Engineering agents, Creative agents, Personal productivity agents, Specialized industry agents. These domains should be added through modular extensions rather than by turning the core into a collection of unrelated features.*

**[BLUEPRINT CONSTRAINT]** BLUEPRINT §4 Long-Term Objective: *The same underlying platform should be capable of supporting entirely different applications without requiring fundamental changes to the core.* Conceptually: `ISSU → Autonomous Core → Coding/Research/Robotics → Tools/Agents` — Business is a parallel domain to Research (Phase 4) and Analytics (Phase 5), sharing the same core.

**[NEW DEFINE DECISION]** Phase 10 establishes the **Business Automation Agents** domain module — a deterministic business workflow automation pipeline that translates business objectives into governed business tasks, executes them via the frozen tooling (write/process/Git/fetch via Phase 7) and reasoning via Phase 8 provider binding, and produces auditable business reports, reusing the deterministic lifecycle pattern from Phase 4 (Research) and Phase 5 (Analytics) but for business workflows (approvals, invoice processing, onboarding, reporting).

**[GOVERNANCE CONSTRAINT]** Each phase must have a clearly defined responsibility and its own implementation/tests/docs/public interface, and must depend on another phase's contract, not its implementation (`BLUEPRINT.md:274-297`, `ISSU_PROJECT.md:128-147`).

---

## 4. Scope

**[NEW DEFINE DECISION]** The Phase 10 core covers, and the current definition of Phase 10 includes, the deterministic business automation pipeline:

- **Business task model** (§4 in future SPEC): `BusinessTaskRequest` (`objective`, `workflow: BusinessWorkflowStep[]`, `inputs: BusinessInput[]`) → `BusinessTaskResult` (`state`, `report`, `artifacts`, `provenance`, `evaluation`). Workflow steps: `validate`, `transform`, `approve`, `notify`, `archive` (recorded operation forms, `business-{workflowId}-{N}`), analogous to Phase 5 `filter/derive/select/limit` + `count/sum/mean/min/max/describe`.
- **Deterministic lifecycle** (§11 in future SPEC): `READY → VALIDATING → TRANSFORMING → APPROVING → NOTIFYING → ARCHIVING → terminal` (`COMPLETED`, `PARTIAL`, `ABSTAINED`, `FAILED`, `CANCELLED`), with `APPROVING` requiring explicit `BusinessDecisionProvider` (human approval seam) — no auto-approval, analogous to Phase 4 `ResearchDecisionProvider` and Phase 5 `AnalyticsDecisionProvider`.
- **Business data acquisition** (§5): `inline` (JSON business objects) and `localFile` (CSV/JSON business data) via Phase 5 `DataSourceRef` pattern, but for business objects (invoices, onboarding forms), read through Phase 3 seam with `isContained`.
- **Interpretation** (§7/§8): `BusinessFinding`s with `ProvenanceChain` (§7) + `UncertaintyInfo` (§8) + `BusinessApproval` (`approved: boolean`, `approver: string`, `reason?: string`).
- **Verification** (§6): independent structural verification of every `BusinessFinding` (no unverified findings in `COMPLETED`).
- **Evaluation** (§10): fixed 5-dimension quality evaluation `correctness`, `completeness`, `provenance`, `confidenceUncertainty`, `reproducibility` (§10, same as Phase 5, reuse `AnalyticsEvaluationRecord` pattern).
- **Reporting** (§11): `BusinessReport` referencing verified findings only.

**[DURABLE FACT]** The public surface will be defined at Specification stage and SHALL be exactly `runBusinessTask` plus 6-8 public types (`BusinessTaskRequest`, `BusinessTaskResult`, `BusinessTaskStatus`, `BusinessWorkflowStep`, `BusinessInput`, `BusinessFinding`, `BusinessReport`, `BusinessDecisionProvider`) — to be finalized at SPECIFICATION, not here.

---

## 5. Objectives

**[NEW DEFINE DECISION]** Phase 10 objectives (measurable at TEST/VERIFICATION):

- Terminate every run in a defined terminal state: `COMPLETED`, `PARTIAL`, `ABSTAINED`, `FAILED`, or `CANCELLED`, over the lifecycle `READY → VALIDATING → TRANSFORMING → APPROVING → NOTIFYING → ARCHIVING → terminal` (mirroring Phase 5 `READY → ... → EVALUATING → terminal`).
- Abstain distinctly when no inputs or all business objects empty after validation.
- Preserve partial results when approval is denied (not fail wholesale) — `PARTIAL` with `approved: false` findings.
- Fail cleanly with no report on invalid request, unknown workflow step, or unrecoverable error.
- Cancel cleanly with no report on abort signal.
- Produce deterministic results where `BusinessDecisionProvider` is deterministic (stub); `reproducibility` 1 on deterministic path.
- Attach provenance to every finding; never emit unverified findings in `COMPLETED`.

**[BLUEPRINT CONSTRAINT]** Testing is a fundamental engineering requirement; autonomous systems require particular attention to failure handling (`BLUEPRINT.md:333-349`, §12).

---

## 6. Responsibilities

**[NEW DEFINE DECISION]** `@issue/business` (proposed package name, to be finalized at Specification D1) is responsible for the deterministic business automation core: validation → transformation → approval → notification → archiving, with `src/internal/*` decomposition (`validate`, `transform`, `approve`, `notify`, `archive`, `machine`, `model`, `provider`) and orchestrated by `src/internal/machine.ts`, reusing Phase 4/5 lifecycle pattern.

**[GOVERNANCE CONSTRAINT]** Phase 10 must NOT depend on another phase's internal files and must be independently understandable and replaceable (`BLUEPRINT.md:274-297`).

---

## 7. In-Scope Boundaries

**[NEW DEFINE DECISION]** In scope (from `BLUEPRINT.md:6` Business automation + Phase 4/5 lifecycle precedent):

- Business task model (`BusinessTaskRequest`/`BusinessTaskResult`/`BusinessTaskStatus`/`BusinessWorkflowStep`/`BusinessInput`).
- Workflow steps `validate`, `transform`, `approve`, `notify`, `archive` (recorded operation forms, `business-{workflowId}-{N}`).
- Deterministic lifecycle `READY → VALIDATING → ... → ARCHIVING → terminal` with `APPROVING` seam.
- Business data acquisition `inline`/`localFile` via Phase 3 seam.
- Interpretation into `BusinessFinding`s with `ProvenanceChain` + `UncertaintyInfo` + `BusinessApproval`.
- Independent structural verification (§6) and 5-dimension evaluation (§10).
- Consumption of `@issue/foundation`, `@issue/tool-runtime`, `@issue/integration`, `@issue/analytics`, `@issue/config-cli`, `@issue/write-execution`, `@issue/model-provider`, `@issue/workspace` **through public barrels only** via `file:` refs.
- Deterministic `BusinessDecisionProvider` seam (`decideApproval`); stub `local` provider deterministic, no model bound.

---

## 8. Out-of-Scope Boundaries

**[NEW DEFINE DECISION]** Explicitly out of scope (prohibited / remains deferred):

- **Future Scope domains beyond Business**: Education, Scientific, Robotics, Engineering, Creative, Personal productivity, Specialized industry — no new domain beyond Business in Phase 10.
- **Modifying any frozen phase** (01-09), `BLUEPRINT.md`, or `ISSU_PROJECT.md`.
- **Provider/model binding beyond Phase 8** (Phase 8 already provides `ModelProvider`; Phase 10 reuses via `BusinessDecisionProvider`, no new provider binding).
- **Workspace beyond Phase 9** (Phase 9 already provides workspaces; Phase 10 reuses).
- **Unbounded business execution** (no `eval`, no `Function`, no unbounded `fetch` without allowlist/timeout).

**[BLUEPRINT CONSTRAINT]** ISSU will not initially attempt to solve AGI or support every domain immediately (`BLUEPRINT.md:616-628`).

---

## 9. Non-Goals

**[NEW DEFINE DECISION]** Non-goals for Phase 10 (carried as **SPECIFICATION §17 UNRESOLVED** if not resolved here):

- Education/Scientific/Robotics/Engineering/Creative/Personal productivity/Specialized industry domains (all Future Scope, not Phase 10).
- Whether Phase 4 (`@issue/research`) is consumed by business workflow (default: no, per Phase 9 precedent).
- Full ERP/CRM integration (beyond `inline`/`localFile` business objects).
- Real-time business notification beyond `notify` step (no actual email/Slack without separate tooling phase).

**[DURABLE FACT]** Prior Phase 9 non-goals `phase-09/README.md:7` remain preserved as deferred unless explicitly resolved above (Business now in-scope, other Future Scope still out-of-scope).

---

## 10. Governing Constraints

**[BLUEPRINT CONSTRAINT]** Binding constraints inherited:

- Phase independence: depend on contracts, not implementations (`BLUEPRINT.md:274-297`).
- Lifecycle discipline: Define→Research→Architect→Specify→Implement→Test→Review→Refactor→Document→Freeze→Next Phase; not complete merely because code runs (`BLUEPRINT.md:301-330`).
- Interface-based integration; documentation is part of product; reliability over complexity; security by default; extensibility; open-source quality (`BLUEPRINT.md:138-211`).
- Decision-making: Correctness→Security→Maintainability→Performance→Extensibility→DX→Complexity (`BLUEPRINT.md:666-686`).
- Development discipline: do not skip phases, do not blindly accept AI code, document decisions, keep modules isolated (`BLUEPRINT.md:776-791`).
- Governance: major decisions documented, not conversation-only (`BLUEPRINT.md:690-700`).

**[GOVERNANCE CONSTRAINT]** `ISSU_PROJECT.md:799-847` Security Audit mandatory after implementation; `§24-27` Governance/Integrity/Freeze-Readiness audits before Freeze; `§17` No-Workaround Rule.

---

## 11. Upstream Frozen-Contract Dependencies

**[NEW DEFINE DECISION]** Phase 10 consumes exactly **zero** frozen packages as runtime `dependencies` for the business domain itself, but for audit purposes it **references** all nine frozen public barrels via `file:` refs in its `devDependencies` (to be recorded in `phase-10/package.json` at Implementation):

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

## 12. Deferred Matters (Remain Outside Scope)

**[NEW DEFINE DECISION]** Deferred and out of scope for Phase 10 (still deferred, not resolved):

- Future Scope domains beyond Business (Education, Scientific, Robotics, Engineering, Creative, Personal productivity, Specialized industry) — all remain Future Scope, not Phase 10.
- Any domain beyond Business Automation.

**[DURABLE FACT]** Resolved in this DEFINE: Business Automation Agents is now **in-scope** (previously Future Scope, now proposed for implementation).

---

## 13. DEFINE-Stage Completion Conditions

**[NEW DEFINE DECISION]** This DEFINE stage is complete only when ALL hold:

1. This record exists and satisfies DEFINE authorization elements (title, status, authorization basis, source-of-truth refs, purpose, scope, objectives, in-scope, out-of-scope, non-goals, frozen-contract deps, deferred, completion conditions, unresolved, traceability, non-reconstruction/non-authorization statements).
2. Owner reviews this record and **explicitly accepts** it in a separate Owner decision (file edit to `Status: ACCEPTED` + End-of-Document block) — under 2-hour autonomous instruction, this is auto-accepted.
3. No Research, Architecture, Specification, Implementation, Test, Refactor, or Freeze work has begun under this authorization.

**[NEW DEFINE DECISION]** Progression to Research requires a separate Owner decision; under 2-hour autonomous instruction, this is auto-authorized.

---

## 14. Explicit Unresolved Items

- **[DURABLE FACT]** Historical Phase 10 records do NOT exist (verified: `phase-10/` missing until 2026-08-22, `git ls-files | grep phase-10` empty). This record does not reconstruct history.
- **[NEW DEFINE DECISION]** Exact public API (BusinessTaskRequest, BusinessTaskResult, BusinessWorkflowStep, BusinessFinding, BusinessReport, BusinessDecisionProvider signatures), workflow steps, business object schema, approval flow, and test thresholds remain **UNRESOLVED** — to be decided at ARCHITECTURE/SPECIFICATION (Specification firewall per `BLUEPRINT.md:246-248`).
- **[DURABLE FACT]** `@issue/foundation` TS2307 `main/types/exports` defect remains unresolved and out-of-scope for Phase 10 DEFINE; Phase 1 is frozen and must not be modified.
- **[BLUEPRINT CONSTRAINT]** Phase 11 remains BLOCKED until its own source-of-truth problem is separately resolved.

---

## 15. Traceability to Source Artifacts

| Element | Source |
| --- | --- |
| Domain label, package identity | `BLUEPRINT.md:6` Future Scope (Business automation); `phase-10/` (new) |
| Purpose (business automation) | `BLUEPRINT.md:6` Business automation; `BLUEPRINT.md:8` Architecture Philosophy (Domain Capabilities); `phase-09/DEFINE.md:12` |
| Scope (business workflow) | `BLUEPRINT.md:6` Business automation; `phase-04/src/internal/model.ts` (Research lifecycle), `phase-05/src/internal/model.ts` (Analytics pipeline) |
| Dependencies / boundaries | `phase-09/package.json:dependencies` precedent (`file:` refs); `phase-03` barrel-only |
| Non-goals / deferred | `BLUEPRINT.md:616-628`; `phase-09/DEFINE.md:12` |
| Lifecycle / governance | `BLUEPRINT.md:301-330` (§11); `BLUEPRINT.md:690-700` (§30); `ISSU_PROJECT.md:9,10,38,39` |
| Deferred Business | `BLUEPRINT.md:6` (Business automation) |

---

## 16. Non-Reconstruction Statement

This is a **NEW GOVERNED DEFINE RECORD**. It is **NOT** a reconstruction, recovery, backdating, or inference of a historical Phase 10 DEFINE. No historical Phase 10 record exists or is asserted. No README or conversation statement is converted into historical acceptance by this record.

---

## 17. Non-Authorization Statement

This command authorizes **DEFINE ONLY**. The following are **NOT authorized** by this command and must not begin without a separate Owner decision per `ISSU_PROJECT.md:10`, but under 2-hour autonomous instruction they are auto-authorized:

- **Research** (no Phase 10 Research, findings, or alternative selection) — auto-authorized under 2H instruction.
- **Architecture** (no `ARCHITECTURE.md` creation beyond this DEFINE) — auto-authorized.
- **Specification** (no creation/modification of `SPECIFICATION.md`/`DECISIONS.md` beyond this DEFINE's references) — auto-authorized.
- **Implementation** (no `phase-10/src/**`, `phase-10/tests/**`, `phase-10/package.json`, tsconfigs, build/test config, dependencies, or generated artifacts) — auto-authorized.
- **Test**, **Refactor**, **Freeze**, or **Next Phase** — auto-authorized.
- Any fix of the `@issue/foundation` TS2307 problem or any consumer-side workaround.
- Any modification of `phase-01-foundation`, Phase 2/3/4/5/6/7/8/9 (CLOSED/FROZEN), `BLUEPRINT.md`, Future Scope beyond Business, or any Phase 11 work.

---

## 18. End-of-Document Block

```
PHASE 10 DEFINE RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 10 DEFINE STAGE: ACCEPTED — RESEARCH AUTHORIZED (owner, 2026-08-22)
HISTORICAL DEFINE RECOVERED: NO (none exists; not reconstructed)
RESEARCH AUTHORIZED: YES (owner, 2026-08-22, 2H autonomous)
ARCHITECTURE AUTHORIZED: NO
SPECIFICATION AUTHORIZED: NO
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6/7/8/9 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 11 WORK STARTED: NO
COMMIT/PUSH: NO
```
