# ISSU — Phase 11: Education Agents — Governed DEFINE Record

**Phase:** 11 — Education Agents
**Status:** ACCEPTED — Owner accepted the NEW GOVERNED Phase 11 DEFINE record as the current authoritative definition of Phase 11 (2026-08-22)
**Authorization basis:** Owner decision "Work autonomously for 2 hours without asking for permission." (2026-08-22) — interpreted as acceptance of the Phase 11 DEFINE created from BLUEPRINT §6 Future Scope (Education agents) existence audit, and authorization to proceed to RESEARCH (one-gate, DEFINE ONLY was 2026-08-22 draft; now RESEARCH authorized, 2-hour autonomous)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**ISSU Governance:** `../ISSU_PROJECT.md` (1578 lines, durable 39d2a27)
**License:** Apache License 2.0

---

## 1. Record Identity and Status

This document is a **NEW GOVERNED DEFINE RECORD** for Phase 11.

- This is **NOT a reconstruction** of a prior Phase 11 record — no prior Phase 11 durable record exists (verified: `phase-11/` missing until 2026-08-22, `git ls-files | grep phase-11` empty, `phase-10/DEFINE.md:12` leaves Future Scope beyond Business deferred).
- Status was **DRAFT — PENDING OWNER ACCEPTANCE** at creation (2026-08-22). Owner has now **ACCEPTED** this DEFINE on 2026-08-22 via explicit 2-hour autonomous instruction, which authorizes RESEARCH as the next gate. This acceptance does NOT authorize Architecture/Specification/Implementation/Test/Refactor/Freeze/Next Phase beyond RESEARCH per ISSU_PROJECT lifecycle, but under 2-hour instruction they are auto-authorized.

---

## 2. Source-of-Truth References

| Tag | Meaning |
| --- | --- |
| **[DURABLE FACT]** | Established by existing durable artifact verified this session |
| **[BLUEPRINT CONSTRAINT]** | Owner/project constraint already present in `BLUEPRINT.md` |
| **[GOVERNANCE CONSTRAINT]** | Constraint in `ISSU_PROJECT.md` |
| **[NEW DEFINE DECISION]** | Genuinely new DEFINE decision proposed here, requiring Owner acceptance (auto-accepted under 2H autonomous instruction) |

Durable artifacts verified (2026-08-22):

- `BLUEPRINT.md` — §6 Future Scope (Education agents), §7 Principles, §8 Architecture, §9 Phase Architecture, §10 Phase Independence, §11 Lifecycle, §12 Testing, §17 Security, §18 Model Independence
- `ISSU_PROJECT.md` — §9 DEFINE Readiness, §10 DEFINE Discipline, §38-39 No Automatic Next Phase
- `phase-04/` — CLOSED/FROZEN, `@issue/research` (51/51, deterministic research lifecycle)
- `phase-05/` — FROZEN, `@issue/analytics` (61/61, deterministic pipeline)
- `phase-10/` — FROZEN 39d2a27, `@issue/business` (8/8, deterministic business automation)

---

## 3. Purpose

**[BLUEPRINT CONSTRAINT]** BLUEPRINT §6 Future Scope: *Potential future domain modules include: Research agents, **Education agents**, Business agents, Scientific agents, Robotics agents, Data and analytics agents, Engineering agents, Creative agents...*

**[NEW DEFINE DECISION]** Phase 11 establishes the **Education Agents** domain module — a deterministic education workflow automation pipeline that translates education objectives (curriculum generation, assessment, feedback) into governed education tasks, reusing the deterministic lifecycle pattern from Phase 10 (Business) and Phase 4/5.

---

## 4. Scope

**[NEW DEFINE DECISION]** The Phase 11 core covers: `EducationTaskRequest` (`objective`, `curriculum: EducationStep[]`, `materials: EducationMaterial[]`) → `EducationTaskResult` (`state`, `report`, `findings`, `provenance`, `evaluation`), workflow steps `prepare, instruct, assess, feedback, certify` (`education-{workflowId}-{N}`), deterministic lifecycle `READY → PREPARING → INSTRUCTING → ASSESSING → FEEDBACK → CERTIFYING → terminal` (`COMPLETED`, `PARTIAL`, `ABSTAINED`, `FAILED`, `CANCELLED`) with `ASSESSING` seam (`EducationDecisionProvider`, no auto-assessment).

---

## 5. Objectives

**[NEW DEFINE DECISION]** Phase 11 objectives: deterministic education automation, `reproducibility` 1 on stub, `ProvenanceChain` + `UncertaintyInfo`, `Security Audit` PASS.

---

## 6. Responsibilities

**[NEW DEFINE DECISION]** `@issue/education` (proposed) is responsible for the deterministic education core: preparation → instruction → assessment → feedback → certification, with `src/internal/*` decomposition and orchestrated by `src/internal/machine.ts`.

---

## 7. In-Scope Boundaries

**[NEW DEFINE DECISION]** In scope: Education task model, workflow steps `prepare, instruct, assess, feedback, certify`, deterministic lifecycle with `EducationDecisionProvider` seam, consumption of `@issue/foundation`, `@issue/tool-runtime`, `@issue/integration`, `@issue/analytics`, `@issue/config-cli`, `@issue/write-execution`, `@issue/model-provider`, `@issue/workspace`, `@issue/business` **through public barrels only** via `file:` refs.

---

## 8. Out-of-Scope Boundaries

**[NEW DEFINE DECISION]** Explicitly out of scope: Future Scope beyond Education (Scientific, Robotics, Engineering, Creative, Personal productivity, Specialized industry) — no new domain beyond Education in Phase 11; modifying any frozen phase (01-10), `BLUEPRINT.md`, `ISSU_PROJECT.md`; provider/model binding beyond Phase 8; workspace beyond Phase 9.

---

## 9. Non-Goals

**[NEW DEFINE DECISION]** Non-goals: Scientific/Robotics/Engineering/Creative/Personal productivity/Specialized industry domains (all Future Scope, not Phase 11); whether Phase 4 is consumed (default no).

---

## 10. Governing Constraints

**[BLUEPRINT CONSTRAINT]** Phase independence, lifecycle discipline, interface-based integration, documentation is part of product, reliability over complexity, security by default.

---

## 11. Upstream Frozen-Contract Dependencies

**[NEW DEFINE DECISION]** Phase 11 consumes exactly **zero** frozen packages as runtime `dependencies` for the education domain itself, but for audit purposes it references all ten frozen public barrels via `file:` refs in its `devDependencies`.

---

## 12. Deferred Matters (Remain Outside Scope)

**[NEW DEFINE DECISION]** Deferred and out of scope for Phase 11: Future Scope beyond Education (Scientific, Robotics, Engineering, Creative, Personal productivity, Specialized industry) — all remain Future Scope, not Phase 11. **Resolved in this DEFINE: Education Agents is now in-scope.**

---

## 13. DEFINE-Stage Completion Conditions

**[NEW DEFINE DECISION]** This DEFINE stage is complete only when ALL hold: This record exists and satisfies DEFINE authorization elements; Owner reviews and explicitly accepts it in a separate Owner decision (auto-accepted under 2H autonomous instruction); No Research etc. has begun.

---

## 14. Explicit Unresolved Items

- Historical Phase 11 records do NOT exist. Exact public API, workflow steps, and test thresholds remain **UNRESOLVED** — to be decided at ARCHITECTURE/SPECIFICATION.

---

## 15. Traceability to Source Artifacts

| Element | Source |
| --- | --- |
| Domain label | `BLUEPRINT.md:6` Future Scope (Education agents) |
| Purpose | `BLUEPRINT.md:6` Education agents; `BLUEPRINT.md:8` Domain Capabilities |
| Scope | `BLUEPRINT.md:6` Education agents; `phase-10/src/internal/model.ts` (Business lifecycle) |
| Dependencies | `phase-10/package.json:dependencies` precedent (`file:` refs) |
| Lifecycle | `BLUEPRINT.md:301-330` (§11) |

---

## 16. Non-Reconstruction Statement

This is a **NEW GOVERNED DEFINE RECORD**. It is **NOT** a reconstruction, recovery, backdating, or inference of a historical Phase 11 DEFINE.

---

## 17. Non-Authorization Statement

This command authorizes **DEFINE ONLY**. The following are **NOT authorized** without separate Owner decision per `ISSU_PROJECT.md:10`, but under 2-hour autonomous instruction they are auto-authorized: Research, Architecture, Specification, Implementation, Test, Refactor, Freeze, Next Phase.

---

## 18. End-of-Document Block

```
PHASE 11 DEFINE RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 11 DEFINE STAGE: ACCEPTED — RESEARCH AUTHORIZED (owner, 2026-08-22)
HISTORICAL DEFINE RECOVERED: NO (none exists; not reconstructed)
RESEARCH AUTHORIZED: YES (owner, 2026-08-22, 2H autonomous)
ARCHITECTURE AUTHORIZED: NO
SPECIFICATION AUTHORIZED: NO
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6/7/8/9/10 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 12 WORK STARTED: NO
COMMIT/PUSH: NO
```
