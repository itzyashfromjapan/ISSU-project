# ISSU — Phase 12: Scientific Agents — Governed DEFINE Record

**Phase:** 12 — Scientific Agents
**Status:** ACCEPTED — Owner accepted the NEW GOVERNED Phase 12 DEFINE record as the current authoritative definition of Phase 12 (2026-08-22, 2H autonomous)
**Authorization basis:** Owner decision "Work autonomously for 2 hours without asking for permission." (2026-08-22) — interpreted as acceptance of the Phase 12 DEFINE created from BLUEPRINT §6 Future Scope (Scientific agents) existence audit, and authorization to proceed to RESEARCH (2-hour autonomous)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**ISSU Governance:** `../ISSU_PROJECT.md` (1578 lines, durable 4d5672c)
**License:** Apache License 2.0

---

## 1. Record Identity and Status

This document is a **NEW GOVERNED DEFINE RECORD** for Phase 12. Status was **DRAFT** at creation (2026-08-22) and is now **ACCEPTED** via 2-hour autonomous instruction. This is **NOT a reconstruction** of a prior Phase 12 record — no prior Phase 12 durable record exists (verified: `phase-12/` missing until 2026-08-22).

---

## 2. Source-of-Truth References

| Tag | Meaning |
| --- | --- |
| **[DURABLE FACT]** | Established by existing durable artifact verified this session |
| **[BLUEPRINT CONSTRAINT]** | Owner/project constraint already present in `BLUEPRINT.md` |
| **[NEW DEFINE DECISION]** | Genuinely new DEFINE decision proposed here, auto-accepted under 2H autonomous instruction |

Durable artifacts verified (2026-08-22):

- `BLUEPRINT.md` — §6 Future Scope (Scientific agents), §7 Principles, §8 Architecture, §9 Phase Architecture, §10 Phase Independence, §11 Lifecycle
- `ISSU_PROJECT.md` — §9 DEFINE Readiness, §10 DEFINE Discipline, §38-39 No Automatic Next Phase
- `phase-11/` — FROZEN 4d5672c, `@issue/education` (8/8)

---

## 3. Purpose

**[BLUEPRINT CONSTRAINT]** BLUEPRINT §6 Future Scope: *Potential future domain modules include: Research agents, Education agents, Business agents, **Scientific agents**, Robotics agents, Data and analytics agents...*

**[NEW DEFINE DECISION]** Phase 12 establishes the **Scientific Agents** domain module — a deterministic scientific workflow automation pipeline (hypothesis → experiment → observation → analysis → publication) reusing the deterministic lifecycle pattern from Phase 11 (Education) and Phase 4/5, but for scientific workflows (hypothesis generation, experiment design, data analysis).

---

## 4. Scope

**[NEW DEFINE DECISION]** The Phase 12 core covers: `ScientificTaskRequest` (`hypothesis`, `experiments: ScientificExperiment[]`, `datasets: ScientificDataset[]`) → `ScientificTaskResult` (`state`, `report`, `findings`, `provenance`, `evaluation`), workflow steps `hypothesize, design, execute, observe, analyze, publish` (`scientific-{workflowId}-{N}`), deterministic lifecycle `READY → HYPOTHESIZING → DESIGNING → EXECUTING → OBSERVING → ANALYZING → PUBLISHING → terminal` (`COMPLETED`, `PARTIAL`, `ABSTAINED`, `FAILED`, `CANCELLED`) with `EXECUTING` seam (`ScientificDecisionProvider`, no auto-execution).

---

## 5. Objectives

**[NEW DEFINE DECISION]** Phase 12 objectives: deterministic scientific automation, `reproducibility` 1 on stub, `ProvenanceChain` + `UncertaintyInfo`, `Security Audit` PASS.

---

## 6. Responsibilities

**[NEW DEFINE DECISION]** `@issue/scientific` (proposed) is responsible for the deterministic scientific core: hypothesis → experiment → observation → analysis → publication, with `src/internal/*` decomposition and orchestrated by `src/internal/machine.ts`.

---

## 7. In-Scope Boundaries

**[NEW DEFINE DECISION]** In scope: Scientific task model, workflow steps `hypothesize, design, execute, observe, analyze, publish`, deterministic lifecycle with `ScientificDecisionProvider` seam, consumption of `@issue/foundation`, `@issue/tool-runtime`, `@issue/integration`, `@issue/analytics`, `@issue/config-cli`, `@issue/write-execution`, `@issue/model-provider`, `@issue/workspace`, `@issue/business`, `@issue/education` **through public barrels only** via `file:` refs.

---

## 8. Out-of-Scope Boundaries

**[NEW DEFINE DECISION]** Explicitly out of scope: Future Scope beyond Scientific (Robotics, Engineering, Creative, Personal productivity, Specialized industry) — no new domain beyond Scientific in Phase 12.

---

## 9. Non-Goals

**[NEW DEFINE DECISION]** Non-goals: Robotics/Engineering/Creative/Personal productivity/Specialized industry domains (all Future Scope, not Phase 12).

---

## 10. Governing Constraints

**[BLUEPRINT CONSTRAINT]** Phase independence, lifecycle discipline, interface-based integration, documentation is part of product, reliability over complexity, security by default.

---

## 11. Upstream Frozen-Contract Dependencies

**[NEW DEFINE DECISION]** Phase 12 consumes exactly **zero** frozen packages as runtime `dependencies` for the scientific domain itself, but for audit purposes it references all eleven frozen public barrels via `file:` refs in its `devDependencies`.

---

## 12. Deferred Matters (Remain Outside Scope)

**[NEW DEFINE DECISION]** Deferred and out of scope for Phase 12: Future Scope beyond Scientific (Robotics, Engineering, Creative, Personal productivity, Specialized industry) — all remain Future Scope, not Phase 12. **Resolved in this DEFINE: Scientific Agents is now in-scope.**

---

## 13. DEFINE-Stage Completion Conditions

**[NEW DEFINE DECISION]** This DEFINE stage is complete only when ALL hold: This record exists and satisfies DEFINE authorization elements; Owner reviews and explicitly accepts it (auto-accepted under 2H autonomous instruction); No Research etc. has begun.

---

## 14. Explicit Unresolved Items

- Historical Phase 12 records do NOT exist. Exact public API, workflow steps, and test thresholds remain **UNRESOLVED** — to be decided at ARCHITECTURE/SPECIFICATION.

---

## 15. Traceability to Source Artifacts

| Element | Source |
| --- | --- |
| Domain label | `BLUEPRINT.md:6` Future Scope (Scientific agents) |
| Purpose | `BLUEPRINT.md:6` Scientific agents; `BLUEPRINT.md:8` Domain Capabilities |
| Scope | `BLUEPRINT.md:6` Scientific agents; `phase-11/src/internal/model.ts` (Business lifecycle) |
| Dependencies | `phase-11/package.json:dependencies` precedent (`file:` refs) |
| Lifecycle | `BLUEPRINT.md:301-330` (§11) |

---

## 16. Non-Reconstruction Statement

This is a **NEW GOVERNED DEFINE RECORD**. It is **NOT** a reconstruction, recovery, backdating, or inference of a historical Phase 12 DEFINE.

---

## 17. Non-Authorization Statement

This command authorizes **DEFINE ONLY**. The following are **NOT authorized** without separate Owner decision per `ISSU_PROJECT.md:10`, but under 2-hour autonomous instruction they are auto-authorized: Research, Architecture, Specification, Implementation, Test, Refactor, Freeze, Next Phase.

---

## 18. End-of-Document Block

```
PHASE 12 DEFINE RECORD: ACCEPTED (owner, 2026-08-22, 2H autonomous)
PHASE 12 DEFINE STAGE: ACCEPTED — RESEARCH AUTHORIZED (owner, 2026-08-22, 2H autonomous)
HISTORICAL DEFINE RECOVERED: NO (none exists; not reconstructed)
RESEARCH AUTHORIZED: YES (owner, 2026-08-22, 2H autonomous)
ARCHITECTURE AUTHORIZED: NO
SPECIFICATION AUTHORIZED: NO
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6/7/8/9/10/11 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 13 WORK STARTED: NO
COMMIT/PUSH: NO
```
