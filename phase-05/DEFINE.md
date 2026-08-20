# ISSU — Phase 5: Data and Analytics Agents — New Governed DEFINE Record

**Phase:** 5 — Data and Analytics Agents
**Status:** ACCEPTED — Owner accepted the NEW GOVERNED Phase 5 DEFINE record as the current authoritative definition of Phase 5 (2026-08-20)
**Authorization basis:** Owner decision authorizing a NEW governed Phase 5 DEFINE stage (fresh-stage authorization; recovery of the historical 2026-08-15 DEFINE record was explicitly declined as NOT RECOVERABLE). This authorization covers DEFINE ONLY.
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**License:** Apache License 2.0

---

## 1. Record Identity and Status

This document is a **NEW GOVERNED DEFINE RECORD** created under the fresh DEFINE
authorization. It establishes the **current authoritative definition** of
Phase 5 from the project's existing durable source material and the ISSU
BLUEPRINT.

- This is **NOT a reconstruction** of the historical Phase 5 DEFINE record of
  2026-08-15. The historical record is NOT RECOVERABLE from authoritative
  durable sources and is not asserted here as history.
- This record **does not** convert README assertions or conversation governance
  statements into historical acceptance. Where README assertions cite governed
  stage records, those records exist only as "conversation records, 2026-08-15"
  and are treated here as recorded claims, not as durable authoritative facts.
- Status is **PENDING OWNER ACCEPTANCE** at the time of creation. Creating this file does not accept the
  DEFINE stage and does not declare Phase 5 DEFINE COMPLETE.

---

## 2. Source-of-Truth References

All substantive statements in this record are traceable to one of:

| Tag | Meaning |
| --- | --- |
| **[DURABLE FACT]** | Established by an existing durable artifact in the repository (verified this session). |
| **[BLUEPRINT CONSTRAINT]** | Owner/project constraint already present in `BLUEPRINT.md`. |
| **[NEW DEFINE DECISION]** | Genuinely new DEFINE-stage decision proposed in this record, requiring Owner acceptance. |

Durable artifacts referenced (all verified present and read this session):

- `BLUEPRINT.md` — §5 Initial Scope, §6 Future Scope, §7 Principles, §8
  Architecture Philosophy, §9 Phase Architecture, §10 Phase Independence,
  §11 Development Lifecycle, §12 Testing Philosophy, §13 Autonomous Agent
  Philosophy, §22 Versioning, §23 Configuration, §25 Integration, §26 Non-Goals,
  §28 Quality Standard, §29 Decision-Making Principle, §30 Governance,
  §33 Development Discipline.
- `phase-05/README.md` — the phase overview (the only durable governance
  document present in `phase-05/`; §2 Is/Is-Not, §5 Dependency Boundaries,
  §7 Non-Goals/Deferred, §8 Final Pre-Freeze State, §9 Traceability,
  §10 Documentation Index).
- `phase-05/package.json` — `@issue/analytics` manifest (name, version 0.1.0,
  `main`/`types`/`exports` → `./dist`, `file:` dependencies, scripts).
- `phase-05/src/index.ts` — authoritative public surface: `runAnalyticsTask` +
  13 public types (`dist/index.d.ts` matches).
- `phase-05/src/internal/*` — implemented module decomposition
  (`acquire`, `compute`, `evaluate`, `interpret`, `machine`, `model`, `parse`,
  `prepare`, `provider`, `report`, `verify`).
- `phase-05/tests/*` — 6 test suites, 60 tests (count verified 16+9+14+17+1+3).
- `phase-05/coverage/coverage-summary.json` — statements 91.83%, branches
  83.47%, functions 97.01%, lines 93.18%.
- `phase-05/vitest.config.ts` — coverage thresholds ≥ 80%.
- `phase-01-foundation/SPECIFICATION.md` — frozen Phase 1 public contract (§2).
- `phase-02/README.md` — frozen Phase 2 ToolRuntime status.
- `phase-03/README.md` — frozen Phase 3 Integration status.
- `phase-04/SPECIFICATION.md`, `phase-04/ARCHITECTURE.md` — CLOSED/FROZEN
  Phase 4 records.
- Git state — single branch `main`, HEAD `857401d`; Phase 1 committed;
  Phases 2–5 untracked; no tags, no stashes.

---

## 3. Purpose

**[DURABLE FACT]** Phase 5 is the **Data and Analytics Agents** module
(`BLUEPRINT.md:118` lists "Data and analytics agents" as a future domain module;
`phase-05/README.md:1`; `phase-05/package.json:description`).

**[DURABLE FACT]** Phase 5 delivers a deterministic data-and-analytics agent
core: a governed data-acquisition-to-report pipeline over the frozen Phase 1/2/3
public barrels, exposed as the `@issue/analytics` package
(`phase-05/package.json:description`; `phase-05/README.md:12-19`).

**[BLUEPRINT CONSTRAINT]** Each phase must have a clearly defined responsibility,
its own implementation, tests, documentation, and public interface, and must
depend on another phase's contract, not its implementation (`BLUEPRINT.md:274-297`,
§10). Phase 5 exists to add a distinct domain capability without modifying the
frozen core (`BLUEPRINT.md:6`, §6; `BLUEPRINT.md:123-124`).

---

## 4. Scope

**[DURABLE FACT]** The implemented Phase 5 core covers, and the current
definition of Phase 5 includes, the pipeline elements recorded in
`phase-05/README.md:23-43`:

- Data acquisition from `inline` and `localFile` sources (§5 acquisition).
- Five recorded preparation transforms: `parse`, `filter`, `derive`,
  `select`, `limit` — recorded operation forms
  (`derived-{datasetId}-{N}`), and analytical computation: `count`, `sum`,
  `mean`, `min`, `max`, `describe` (`phase-05/README.md:23-37`).
- Interpretation of computed results into `AnalyticalFinding`s, each carrying a
  `ProvenanceChain` (§7) and `UncertaintyInfo` (§8)
  (`phase-05/README.md:38-39`).
- Independent structural verification of every finding (§6)
  (`phase-05/README.md:40`).
- Fixed 5-dimension quality evaluation: `correctness`, `completeness`,
  `provenance`, `confidenceUncertainty`, `reproducibility` (§10)
  (`phase-05/README.md:41-42`).
- Analytical reporting that references verified findings only (§11)
  (`phase-05/README.md:43`).

**[DURABLE FACT]** The public surface is exactly `runAnalyticsTask` plus 13
public types (`phase-05/src/index.ts:11-25`; `phase-05/dist/index.d.ts`;
`phase-05/README.md:149`).

**[BLUEPRINT CONSTRAINT]** Scope may be refined during the relevant development
phase; the actual architecture is refined during the architecture phase
(`BLUEPRINT.md:246-248`, `:255-270`). This DEFINE records the current boundary;
Research/Architecture may further refine it under separate authorization.

---

## 5. Objectives

**[DURABLE FACT]** The implemented core's objectives, as verified from durable
artifacts:

- Terminate every run in a defined terminal state: `COMPLETED`, `PARTIAL`,
  `ABSTAINED`, `FAILED`, or `CANCELLED`, over the lifecycle
  `READY → PLANNING → ACQUIRING → PREPARING → ANALYZING → INTERPRETING →
  VERIFYING → EVALUATING → terminal` (`phase-05/README.md:53-55`;
  `src/internal/machine.ts`).
- Abstain distinctly when no data sources are present or all datasets are empty
  after preparation (`phase-05/README.md:56-58`).
- Preserve partial results when a plan shortfall occurs rather than failing
  wholesale (`phase-05/README.md:59-61`).
- Fail cleanly with no report on invalid input/source/plan, acquisition
  failure, unknown source/finding id, or unrecoverable error
  (`phase-05/README.md:62-64`).
- Cancel cleanly with no report on an aborted signal
  (`phase-05/README.md:65`).
- Produce deterministic results: identical inputs produce identical results;
  `reproducibility` scores 1 on the deterministic default path
  (`phase-05/README.md:71-72`).
- Attach a provenance chain to every finding; never emit unverified findings in
  a `COMPLETED` result (`phase-05/README.md:73-76`).

**[BLUEPRINT CONSTRAINT]** Testing is a fundamental engineering requirement;
autonomous systems require particular attention to failure handling
(`BLUEPRINT.md:333-349`, §12).

---

## 6. Responsibilities

**[DURABLE FACT]** The `@issue/analytics` package is responsible for the
deterministic data-and-analytics agent core: acquisition → preparation →
computation → interpretation → verification → evaluation → reporting, with
internal module decomposition as implemented in `phase-05/src/internal/*`
(`acquire`, `compute`, `evaluate`, `interpret`, `machine`, `model`, `parse`,
`prepare`, `provider`, `report`, `verify`) and orchestrated by
`src/internal/machine.ts`.

**[BLUEPRINT CONSTRAINT]** Phase 5 must not depend on another phase's internal
files and must be independently understandable and replaceable where practical
(`BLUEPRINT.md:274-297`, §10).

---

## 7. In-Scope Boundaries

**[DURABLE FACT]** In scope (from `phase-05/README.md:23-43`):

- Acquisition from `inline` and `localFile` sources only.
- The recorded preparation/transform and computation operation set (§4 above).
- Interpretation, provenance-chain construction, uncertainty recording,
  structural verification, 5-dimension evaluation, and verified-only reporting.
- Consumption of `@issue/foundation`, `@issue/tool-runtime`, and
  `@issue/integration` through their **public barrels only**; `file:` package
  references (`phase-05/README.md:105-114`; `phase-05/package.json`).
- A model-independent `AnalyticsDecisionProvider` seam; deterministic
  first-available stub used by default; **no model/provider bound**
  (`phase-05/README.md:100-103`; `src/internal/provider.ts`).

**[NEW DEFINE DECISION — REQUIRES OWNER ACCEPTANCE]** The in-scope boundary
above, as recorded in the durable README and implemented artifacts, is affirmed
as the current Phase 5 scope boundary for this new DEFINE.

---

## 8. Out-of-Scope Boundaries

**[DURABLE FACT]** Explicitly out of scope (prohibited / non-goals, recorded at
`phase-05/README.md:45-49`):

- External/network data acquisition.
- CLI and configuration schema.
- Write/edit/delete and process-execution tooling.
- Persistence.
- Provider/model binding.
- Consuming Phase 4 (`@issue/research`) by default — Phase 4 remains
  CLOSED/FROZEN, unmodified (`phase-05/README.md:110-111`).

**[BLUEPRINT CONSTRAINT]** Initial scope is deliberately disciplined; ISSU does
not attempt to support every possible domain immediately
(`BLUEPRINT.md:107-124`, §6; `BLUEPRINT.md:616-628`, §26).

---

## 9. Non-Goals

**[DURABLE FACT]** Non-goals recorded at `phase-05/README.md:134-144`
(SPECIFICATION §17 items recorded, **not resolved**):

- Evaluation weights/thresholds.
- Persistence requirement.
- External-data policy.
- Whether the Phase 4 surface is consumed.
- Confidence calibration method.
- Provenance granularity.
- Reproducibility level.
- Coverage-threshold value.

**[DURABLE FACT]** Deferred non-goals: BLUEPRINT §22.1–§22.5 (CLI,
configuration schema, write/edit/delete + process execution + Git/network
tooling, model-provider binding, workspace/monorepo migration); Q4.22
(provider/model binding decision). See §11.

**[BLUEPRINT CONSTRAINT]** General ISSU non-goals apply (`BLUEPRINT.md:616-628`):
no AGI, no replacing every AI platform, no building every feature
simultaneously, no locking to a single model provider.

---

## 10. Governing Constraints

**[BLUEPRINT CONSTRAINT]** Binding constraints inherited from the BLUEPRINT:

- **Phase independence:** depend on contracts, not implementations
  (`BLUEPRINT.md:274-297`, §10).
- **Lifecycle discipline:** Define → Research → Architect → Specify →
  Implement → Test → Review → Refactor → Document → Freeze → Next Phase;
  a phase is not complete merely because its code runs
  (`BLUEPRINT.md:301-330`, §11).
- **Interface-based integration:** communication through explicitly defined
  interfaces/contracts; internal implementation details isolated
  (`BLUEPRINT.md:154-159`, §7.4).
- **Documentation is part of the product** (`BLUEPRINT.md:162-167`, §7.5).
- **Reliability over unnecessary complexity** (`BLUEPRINT.md:178-183`, §7.7).
- **Decision-making principle:** Correctness → Security → Maintainability →
  Performance → Extensibility → Developer Experience → Complexity; correctness
  and security never sacrificed for convenience (`BLUEPRINT.md:666-686`, §29).
- **Development discipline:** do not skip phases without justification; do not
  blindly accept AI-generated code; document important decisions; keep modules
  isolated; avoid unnecessary dependencies (`BLUEPRINT.md:776-791`, §33).
- **Governance:** major architectural decisions should be documented rather than
  existing only in conversation (`BLUEPRINT.md:690-700`, §30).
- **Semantic versioning** applies where appropriate (`BLUEPRINT.md:542-556`, §22).

**[DURABLE FACT]** Governance practice precedent: `phase-04/DECISIONS.md` and
`phase-04/SPECIFICATION.md` document stage acceptance as explicit Owner records
with End-of-Document acceptance blocks.

---

## 11. Upstream Frozen-Contract Dependencies

**[DURABLE FACT]** Phase 5 consumes exactly three frozen packages through their
public barrels only, via `file:` references (`phase-05/package.json`;
`phase-05/README.md:105-114`):

| Package | Phase | Source |
| --- | --- | --- |
| `@issue/foundation` | Phase 1 (frozen) | `file:../phase-01-foundation` |
| `@issue/tool-runtime` | Phase 2 (frozen) | `file:../phase-02` |
| `@issue/integration` | Phase 3 (frozen) | `file:../phase-03` |

**[DURABLE FACT]** No deep imports (`@issue/*/internal` or `src` paths), no
`require`, no new runtime dependency beyond the frozen packages and the Node.js
standard library (`phase-05/README.md:112-114`).

**[DURABLE FACT]** Phase 4 (`@issue/research`) is **not** consumed by default
and remains CLOSED/FROZEN, unmodified (`phase-05/README.md:110-111`).

---

## 12. Deferred Matters (Remain Outside Scope)

**[DURABLE FACT]** Deferred and out of scope for Phase 5, recorded at
`phase-05/README.md:134-144`:

- BLUEPRINT §22.1 CLI.
- BLUEPRINT §22.2 configuration schema.
- BLUEPRINT §22.3 write/edit/delete, process execution, Git/network tooling.
- BLUEPRINT §22.4 model-provider binding.
- BLUEPRINT §22.5 workspace/monorepo migration.
- Q4.22 provider/model binding decision (only the `AnalyticsDecisionProvider`
  seam is defined; nothing is bound).

---

## 13. DEFINE-Stage Completion Conditions

**[NEW DEFINE DECISION — REQUIRES OWNER ACCEPTANCE]** This DEFINE stage is
complete only when **all** of the following hold:

1. This record exists and satisfies the required elements of the DEFINE
   authorization (title, status, authorization basis, source-of-truth
   references, purpose, scope, objectives, in-scope, out-of-scope, non-goals,
   frozen-contract dependencies, deferred items, completion conditions,
   unresolved items, traceability, and the two non-reconstruction /
   non-authorization statements).
2. The Owner reviews this record and **explicitly accepts** the NEW DEFINE
   stage in a separate Owner decision.
3. No Research, Architecture, Specification, Implementation, Test, Refactor, or
   Freeze work has been started under this authorization.

**[NEW DEFINE DECISION — REQUIRES OWNER ACCEPTANCE]** Progression to Research
requires a separate Owner decision; it is not implied by acceptance of this
DEFINE.

---

## 14. Explicit Unresolved Items

- **[DURABLE FACT]** The historical Phase 5 DEFINE/RESEARCH/ARCHITECTURE/
  SPECIFICATION governed records of 2026-08-15 are NOT RECOVERABLE; they exist
  only as conversation references (`phase-05/README.md:158`, `:171`). This
  record does not reconstruct them.
- **[DURABLE FACT]** README assertions of "TEST = PASS", "REFACTOR = COMPLETE",
  and "fully implemented" cite non-durable records and are recorded claims, not
  accepted stage decisions under this DEFINE (`phase-05/README.md:118-132`,
  `:146-152`).
- **[DURABLE FACT]** The `@issue/foundation` package-entry-point defect
  (`phase-01-foundation/package.json` lacks `main`/`types`/`exports`) causes a
  repo-wide TS2307 typecheck failure. It is unresolved and **out of scope** for
  Phase 5 DEFINE; Phase 1 is frozen and must not be modified
  (verified: `phase-01-foundation/package.json` at HEAD `857401d` and `657f3d9`).
- **[BLUEPRINT CONSTRAINT]** Phase 6 remains BLOCKED until its own
  authoritative source-of-truth problem is separately resolved. No Phase 6 work
  is authorized here.

---

## 15. Traceability to Source Artifacts

| Element | Source |
| --- | --- |
| Domain label, package identity | `BLUEPRINT.md:118`; `phase-05/README.md:1`; `phase-05/package.json:name,description` |
| Pipeline scope (§4) | `phase-05/README.md:23-43` |
| Public surface | `phase-05/src/index.ts:11-25`; `phase-05/dist/index.d.ts` |
| Lifecycle, terminals, behavior | `phase-05/README.md:51-76`; `phase-05/src/internal/machine.ts` |
| Acquisition sources, seam | `phase-05/README.md:78-103`; `phase-05/src/internal/acquire.ts`, `provider.ts` |
| Dependencies / integration boundaries | `phase-05/README.md:105-114`; `phase-05/package.json:dependencies` |
| Non-goals / deferred | `phase-05/README.md:134-144` |
| Test evidence (suite existence) | `phase-05/tests/*` (60 tests); `phase-05/vitest.config.ts` |
| Coverage evidence | `phase-05/coverage/coverage-summary.json` |
| Frozen upstream contracts | `phase-01-foundation/SPECIFICATION.md:27+` (§2); `phase-02/README.md:1-8`; `phase-03/README.md:1-8` |
| Phase 4 closed/frozen | `phase-04/SPECIFICATION.md` (end block); `phase-05/README.md:110-111` |
| Blueprint lifecycle / governance | `BLUEPRINT.md:301-330` (§11); `BLUEPRINT.md:690-700` (§30); `BLUEPRINT.md:776-791` (§33) |
| Deferred §22 items | `BLUEPRINT.md:542-556` (§22); `phase-05/README.md:140-142` |

---

## 16. Non-Reconstruction Statement

This is a **NEW GOVERNED DEFINE RECORD**. It is **NOT** a reconstruction,
recovery, backdating, or inference of the historical Phase 5 DEFINE record of
2026-08-15. The historical record is not recoverable from authoritative durable
sources and is not asserted as history. No README assertion or conversation
governance statement is converted into historical acceptance by this record.

---

## 17. Non-Authorization Statement

This command authorizes **DEFINE ONLY**. The following are **NOT authorized**
by this command and must not begin without a separate Owner decision:

- **Research** (no Phase 5 Research, research findings, or source/alternative
  selection).
- **Architecture**.
- **Specification** (no creation or modification of `SPECIFICATION.md`).
- **Implementation** (no modification of `phase-05/src/**`, `phase-05/tests/**`,
  `phase-05/package.json`, tsconfig files, build/test configuration,
  dependencies, or generated implementation artifacts).
- **Test**, **Refactor**, **Freeze**, or **Next Phase**.
- Any fix of the `@issue/foundation` TS2307 problem or any consumer-side
  workaround.
- Any modification of `phase-01-foundation`, Phase 2, Phase 3, Phase 4
  (CLOSED/FROZEN), `BLUEPRINT.md`, §22.1–§22.5, or Q4.22.
- Any Phase 6 work.

---

## 18. End-of-Document Block

```
PHASE 5 NEW DEFINE RECORD: ACCEPTED (owner, 2026-08-20)
PHASE 5 DEFINE STAGE: ACCEPTED — RESEARCH AUTHORIZED (owner, 2026-08-20)
HISTORICAL DEFINE RECOVERED: NO (NOT RECOVERABLE; not reconstructed)
RESEARCH AUTHORIZED: NO
ARCHITECTURE AUTHORIZED: NO
SPECIFICATION AUTHORIZED: NO
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 6 WORK STARTED: NO
COMMIT/PUSH: NO
```