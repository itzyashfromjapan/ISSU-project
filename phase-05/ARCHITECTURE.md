# ISSU - Phase 5: Analytics Agent Module - Architecture

**Phase:** 5 - Analytics Agent Module
**Stage:** ARCHITECTURE (owner-authorized 2026-08-20)
**Status:** Draft - awaiting Architecture-stage acceptance
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative inputs:** Accepted Phase 5 DEFINE (`./DEFINE.md`, ACCEPTED
2026-08-20); completed Phase 5 Research (`./RESEARCH.md`, R5.1-R5.12, audited
and ACCEPTED by Owner 2026-08-20); frozen Phase 1, Phase 2, Phase 3 contracts;
Phase 4 CLOSED/FROZEN precedent (`phase-04/ARCHITECTURE.md`,
`phase-04/DECISIONS.md`).
**License:** Apache License 2.0

---

## 1. Purpose & Position

This document records the **architecture** of the Phase 5 Analytics Agent
Module. It follows the BLUEPRINT lifecycle position: after **Research**
(R5.1-R5.12 accepted) and before **Specify**.

- The domain is **Analytics Agent Module** (accepted DEFINE, 2026-08-20), a
  deterministic data-acquisition-to-report pipeline over the frozen Phase 1/2/3
  public barrels, exposed as `@issue/analytics` (`DEFINE.md` §4; `README.md:12-19`).
- Accepted DEFINE + completed RESEARCH are the governing inputs to this stage.
- This document determines **what the module is**, **what it consumes**, **how it
  is decomposed**, and **which decisions remain open** for Specification and
  Owner approval.
- It does **not** finalize the public API, exact schemas, thresholds, scoring
  formulas, implementation technology, or model/provider choices. Those are
  **SPECIFICATION INPUT / UNRESOLVED** (Specification firewall).
- It does **not** resolve any Research-stage unresolved question (U1-U14), any
  §17 deferred item, §22.1-§22.5, or Q4.22 unless stated otherwise.
- It does **not** resolve the repo-wide `@issue/foundation` TS2307 problem nor
  any consumer-side workaround; TS2307 is a frozen-contract environment
  constraint recorded as UNRESOLVED.

---

## 2. How to Read This Document

Every decision in this document is labeled with one of:

| Label | Meaning |
| --- | --- |
| **FACT** | Verified repository/contract fact (frozen Phase 1/2/3/4, BLUEPRINT, DEFINE, RESEARCH). Facts drawn from the existing Phase 5 implementation are marked "observable evidence" and are **not** treated as acceptance of that implementation. |
| **PRECEDENT** | Established project/governance precedent from a prior accepted stage (Phase 2, Phase 3, Phase 4 records). |
| **INFERENCE** | Reasoned conclusion from facts; not directly stated anywhere. |
| **ARCHITECTURE DECISION** | A decision this Architecture stage makes within its authority. |
| **UNRESOLVED** | Not decidable here; requires Specification and/or Owner approval. |

Each architecture question (Q5.1-Q5.22) records: **problem**, **research
evidence**, **alternatives** (>=2 where meaningful), **chosen approach**,
**rationale**, **consequences**, **rejected alternatives**, and **unresolved
implications**.

**Specification firewall:** exact public API, exports, data schemas, test/
acceptance/benchmark thresholds, pass/fail formulas, scoring formulas,
implementation dependencies, and implementation technology are **not finalized
here**. They are recorded as **SPECIFICATION INPUT / UNRESOLVED**.

---

## 3. Consumed Contracts (frozen)

**[FACT]** Phase 5 consumes the following frozen public surfaces, **barrel-only**
(no deep imports), consistent with the Phase 3 integration rule and the Phase 4
precedent (AD-4.1). The Phase 5 implementation's actual barrel imports are
observable evidence (`phase-05/src/internal/machine.ts:11-12`,
`model.ts:12-13`, `acquire.ts:10-16`); they are not acceptance.

### 3.1 Phase 1 - `@issue/foundation` (frozen)

**[FACT]** Public barrel (`phase-01-foundation/src/index.ts`): `VERSION`,
`AppError`/`AppErrorJson`/`AppErrorParams`, `isAppError`/`toError`,
`Result`/`ok`/`err`/`isOk`/`isErr`/`match`, `LogLevel`,
`IssueConfig`/`LoadConfigOptions`/`loadConfig`/`mergeConfigLayers`,
`EnvSource`/`EnvSnapshot`/`readEnv`/`getSecret`/`redactionList`,
`Logger`/`LoggerOptions`/`createLogger`, `assertContained`/`isContained`,
`runCli` (`phase-01-foundation/SPECIFICATION.md:27-103`).

### 3.2 Phase 2 - `@issue/tool-runtime` (frozen)

**[FACT]** Public barrel (`phase-02/src/index.ts`): `TaskStatus` (9-state),
`ToolOperation` (`"readFile"` | `"listDirectory"`), `ActionRef`, `ReadOptions`,
`ListOptions`, `OutcomeClass`, `CorrectionDirection`, `FileContent`,
`DirectoryEntry`, `DirectoryListing`, `ToolResult`, `TaskRefs`,
`ResourceBounds`, `TaskOptions`, `TaskState`, `AvailableAction`,
`DecisionProvider`, `Assessment`, `TaskResult`, `ToolRuntime`;
functions `runTask`, `createToolRuntime`, `deriveAvailableActions`
(`phase-02/SPECIFICATION.md:48-130`). Exactly 20 types + 3 functions.

### 3.3 Phase 3 - `@issue/integration` (frozen, CLOSED)

**[FACT]** Public barrel (`phase-03/src/index.ts`): `DEFAULT_BOUNDS`,
`runIntegrationTask`, `HarnessRecord`, `IntegrationTaskRequest`,
`IntegrationTaskResult`, `createDeterministicProviderStub`,
`DeterministicProviderStubConfig`, `DeterministicStubTable`,
`isFailedToolResult`, `translateToolError`, `FailedToolResult`,
`ToolErrorDetails`.

### 3.4 Phase 4 - `@issue/research` (CLOSED/FROZEN)

**[FACT]** Phase 4 is CLOSED and FROZEN and is **not** consumed by Phase 5 by
default (`DEFINE.md` §8; `README.md:110-111`). Phase 4 does not provide a
data-acquisition/analytics capability consumed here.

---

## 4. Frozen Contract Integration

**[FACT / INFERENCE]** This section records what Phase 3 provides, what Phase 5
consumes, what it cannot obtain, what must remain isolated, and whether any
capability requires modifying a frozen phase.

### 4.1 What Phase 3 provides to Phase 5

**[FACT]** Phase 3 provides a **deterministic integration seam**: bounded,
deterministic task execution of filesystem read/list tasks against an
authorized root, through `runIntegrationTask` + `createDeterministicProviderStub`
with `DEFAULT_BOUNDS`, Phase 1 `Result`/`AppError`-compatible error
representation (`translateToolError`, `isFailedToolResult`), and
deterministic provider stubs (no model/provider/SDK involved)
(`phase-03/SPECIFICATION.md:87-93`).

### 4.2 What Phase 5 consumes

**[INFERENCE]** Phase 5 consumes Phase 1 primitives (logging, `Result`/`AppError`
error discipline, path containment) and Phase 3's deterministic read seam for
`localFile` acquisition. Phase 5's analytics-specific capabilities (preparation
transforms, analytical computation, interpretation/provenance, verification,
evaluation, reporting) are **new Phase 5 components** and consume the frozen
barrels through public surfaces only. Direct Phase 2 consumption is limited to
types through the public barrel.

### 4.3 What Phase 5 cannot obtain from frozen contracts

**[FACT]** Phase 3 explicitly prohibits (Phase 3 `SPECIFICATION.md`): CLI,
config-file schema, write/edit/delete/fs mutation, process execution, Git,
network/web access, model-provider binding, memory/cross-run persistence,
multi-agent, planning engine, plugin framework, code generation, benchmarking,
publishing. Phase 5's domain (data acquisition from inline/localFile content,
preparation, analytical computation, provenance, verification, evaluation) is
not provided by any frozen phase and must be designed from scratch as Phase 5
components.

### 4.4 What must remain isolated

**[NORMATIVE]** Phase 5 **SHALL NOT modify** any frozen Phase 1, Phase 2, Phase
3, or Phase 4 artifact, nor the BLUEPRINT. Phases 3 and 4 remain CLOSED and
FROZEN. Phase 5 SHALL consume frozen contracts through public barrels only.

### 4.5 Does any capability require modifying a frozen phase?

**[ARCHITECTURE DECISION]** **No.** Every Phase 5 capability identified by the
accepted DEFINE and Research (acquisition, preparation transforms,
computation, interpretation, provenance, verification, evaluation, reporting,
decision-provider seam) is implementable as a **separate Phase 5 component**
without modifying any frozen phase (R5.1, R5.3). Where a capability would
_require_ frozen-phase modification, Phase 5 SHALL **not** modify; it SHALL
record the incompatibility, why it exists, the candidate Phase 5 alternative,
and the unresolved status (§20).

**[UNRESOLVED]** None currently identified. If Specification discovers one, it
must be recorded in §20 before any resolution.

---

## 5. Module Boundary

**[ARCHITECTURE DECISION]** Phase 5 - Analytics Agent Module is the module that
performs **deterministic analytical tasks**: data acquisition from inline and
localFile content, recorded preparation transforms, analytical computation,
interpretation into provenance-bearing findings, structural verification,
multi-dimensional quality evaluation, and verified-only analytical reporting -
within ISSU's governed boundaries.

- Folder `phase-05/`, name "Analytics Agent Module"; package name
  `@issue/analytics` (existing `phase-05/package.json`; FACT). Consistent with
  the `@issue/<phase-name>` convention (Phase 3 `DECISIONS.md` D3.1 precedent).
- The module's public surface is exactly `runAnalyticsTask` plus 13 public
  types (`DEFINE.md` §4; `src/index.ts:11-25`; `dist/index.d.ts`).

**[UNRESOLVED]** Exact exports, signatures, and public surface details are
Specification decisions.

---

## 6. Non-Goals

**[NON-GOAL]** Phase 5 does **not** include, in this stage:

- CLI / end-user entry point (§22.1) - deferred, requires separate authorization.
- Configuration-file schema (§22.2) - deferred.
- Write/edit/delete filesystem mutation, process execution, Git/network tooling
  (§22.3) - deferred; external/network data acquisition is out of scope
  (`DEFINE.md` §8).
- Provider/model binding (§22.4, Q4.22) - deferred.
- Workspace/monorepo adoption (§22.5) - deferred.
- Persistence / cross-run memory - out of scope (`DEFINE.md` §8).
- Consuming Phase 4 by default - Phase 4 remains CLOSED/FROZEN, unmodified.
- Multi-agent systems, generalized planning engine, plugin framework, code
  generation, publishing - deferred/not authorized.
- Model-backed semantic quality judgment, confidence calibration, plan
  refinement, or reprocessing - not capabilities of a deterministic core (R5.5,
  R5.7, R5.12); any such capability requires §17/Q4.22 resolution and separate
  Owner authorization.

**[UNRESOLVED]** Whether any non-goal becomes a Phase 5 capability requires
explicit Owner authorization and a DECISIONS entry.

---

## 7. Component Architecture

**[ARCHITECTURE DECISION]** Phase 5 is decomposed into the following logical
components. This is a **structural decomposition**; exact module layout,
packaging, and file organization are SPECIFICATION INPUT. The observed Phase 5
implementation decomposes along these lines (`src/internal/*`), which is
consistent evidence but not acceptance.

| Component | Responsibility | Key inputs | Key outputs | Frozen-contract consumption |
| --- | --- | --- | --- | --- |
| **Analytics Task Orchestrator** | Drives the task lifecycle (§9); validates request/source/plan; orders phases; terminates every run in a defined outcome | analytics request, plan | task result with outcome | Phase 1 `Result`/`AppError`, `Logger` |
| **Acquisition** | Acquire source content from `inline` and `localFile` only; deny-by-default; read-only | source selectors | acquired dataset content | Phase 3 `runIntegrationTask`/`createDeterministicProviderStub`/`DEFAULT_BOUNDS` (localFile); Phase 1 path containment |
| **Preparation** | Apply recorded transforms: `parse`, `filter`, `derive`, `select`, `limit`; produce derived datasets | acquired content, plan transforms | prepared datasets | Phase 1 primitives |
| **Analytical Computation** | Compute `count`, `sum`, `mean`, `min`, `max`, `describe` deterministically | prepared datasets, plan computations | computed results | - |
| **Interpretation & Provenance** | Interpret results into `AnalyticalFinding`s; attach a `ProvenanceChain` per finding; record `UncertaintyInfo` | computed results | findings with provenance | - |
| **Verification** | Independently verify each finding's provenance chain resolves structurally | findings, provenance chains | verified findings | - |
| **Evaluation** | Score the fixed 5-dimension set from deterministic signals with per-dimension basis notes | verified findings | evaluation record per dimension | - |
| **Reporting** | Compose the analytical report referencing verified findings only | verified findings | report | - |
| **Decision Provider / Model Seam** | Model/provider integration seam behind the `AnalyticsDecisionProvider` contract | decisions requested by orchestrator | decisions | Phase 2 `DecisionProvider` contract shape; Phase 3 deterministic-stub pattern |

**[INFERENCE]** The components are **logical**, not mandated as separate files or
packages. The exact module layout is a Specification decision.

---

## 8. Design Principles

**[ARCHITECTURE DECISION]** Phase 5 architecture follows these principles:

1. **Barrel-only consumption** - frozen contracts through public barrels only
   (AD-5.1; R5.1).
2. **Frozen-phase integrity** - never modify a frozen phase; record
   incompatibilities instead (AD-5.2; R5.1).
3. **Deterministic core, seam for model** - control flow is model-free,
   clock-free, randomness-free; any model involvement is confined to the
   decision-provider seam (AD-5.3; R5.2, R5.4).
4. **Deny-by-default acquisition** - only `inline | localFile`, read-only,
   through the Phase 3 seam (AD-5.4; R5.3, R5.11).
5. **Honest five-outcome model** - abstain distinctly rather than fabricate;
   partial work preserved; failure/cancellation produce no report (AD-5.5;
   R5.5).
6. **Structural traceability** - every finding carries a resolvable provenance
   chain; only verified findings are reported (AD-5.6; R5.6).
7. **Multi-dimensional evaluation, no scalar composite** - per-dimension scores
   with explicit basis notes; combining or weighting is deferred (§17; AD-5.7;
   R5.8).
8. **Confidence-aware honesty** - uncertainty surfaced as "not established"
   (calibrated: false); no implied confidence (R5.7).
9. **Deferred items stay deferred** - §17 items, §22.1-§22.5, Q4.22 unchanged;
   resolution requires Owner authorization (AD-5.8; R5.10).

---

## 9. Analytics Task Lifecycle

**[ARCHITECTURE DECISION]** The orchestrator drives a task through the lifecycle:
`READY -> PLANNING -> ACQUIRING -> PREPARING -> ANALYZING -> INTERPRETING ->
VERIFYING -> EVALUATING -> terminal`, where terminal is exactly one of
`COMPLETED`, `PARTIAL`, `ABSTAINED`, `FAILED`, or `CANCELLED` (R5.2, R5.5;
observed implementation `src/internal/machine.ts`).

- The lifecycle is **bounded** to the analytics task; it is not a generalized
  planning engine (Phase 2 §19.9 fact).
- Every run **terminates**; there is no unbounded loop (R5.2).
- `REPLANNING` is defined in the observed implementation but never entered
  (R5.2). Whether the state should exist at all is **UNRESOLVED** (§20).
- Terminal semantics: `COMPLETED` (all plan items processed; findings verified);
  `PARTIAL` (plan shortfall; produced+verified work still reported); `ABSTAINED`
  (no sources, or all datasets empty - distinct from failure); `FAILED`
  (invalid request/source/plan, acquisition failure, unknown id, unrecoverable
  error - no report); `CANCELLED` (aborted signal - no report) (R5.5;
  `README.md:53-65`).

---

## 10. Architecture Questions - Module Identity & Contract Consumption (Q5.1-Q5.4)

### Q5.1 - Module identity and naming

- **Problem:** What is the Phase 5 module called and located?
- **Classification:** FACT (existing identity) / ARCHITECTURE DECISION (affirm)
- **Research evidence:** R5.1; `phase-05/package.json` (package `@issue/analytics`,
  v0.1.0); `phase-05/README.md:12-19`; DEFINE §4.
- **Alternatives:** (a) keep folder `phase-05/` + package `@issue/analytics`;
  (b) rename package to a capability name.
- **Chosen approach:** (a) folder `phase-05/`, name "Analytics Agent Module";
  package name `@issue/analytics` consistent with the `@issue/<phase-name>`
  convention (Phase 3 D3.1 precedent).
- **Rationale:** Existing durable identity; consistent with Phase 1/2/3/4 naming.
- **Consequences:** Folder and naming fixed at the phase level; change requires a
  DECISIONS entry.
- **Rejected alternatives:** (b) contradicts the existing durable identity.
- **Unresolved implications:** Exact public exports/signatures are Specification
  decisions.

### Q5.2 - What Phase 5 consumes from frozen contracts

- **Problem:** How does Phase 5 use Phase 1/2/3?
- **Classification:** FACT (barrel rule) / PRECEDENT (Phase 4 AD-4.1) /
  ARCHITECTURE DECISION (barrel-only)
- **Research evidence:** R5.1; `phase-03/SPECIFICATION.md:39-46`;
  `phase-04/DECISIONS.md:30-46` (AD-4.1).
- **Alternatives:** (a) barrel-only public consumption; (b) deep imports of
  internal modules; (c) copy/reimplement frozen behavior.
- **Chosen approach:** (a) barrel-only consumption of Phase 1, Phase 2, and
  Phase 3 through their public package barrels. Zero deep imports. Direct Phase 2
  consumption limited to types through the public barrel; file reads delegate to
  the Phase 3 deterministic read seam.
- **Rationale:** Matches the frozen Phase 3 integration rule and the Phase 4
  precedent (AD-4.1); preserves phase isolation and contract stability.
- **Consequences:** Internal Phase 2/3 modules are inaccessible; any needed
  behavior must come through public functions.
- **Rejected alternatives:** (b) violates the frozen consumption rule; (c)
  duplicates and risks drift from frozen behavior.
- **Unresolved implications:** Exact symbol map is a Specification decision.

### Q5.3 - What Phase 5 cannot obtain from frozen contracts

- **Problem:** Which capabilities must Phase 5 build itself?
- **Classification:** FACT / INFERENCE
- **Research evidence:** R5.1, R5.3; Phase 3 prohibition list (Phase 3
  `SPECIFICATION.md`); DEFINE §7-§8.
- **Alternatives:** N/A (established fact; no meaningful alternatives).
- **Chosen approach:** Phase 5 must design from scratch: acquisition of inline
  and localFile content, preparation transforms (`parse`, `filter`, `derive`,
  `select`, `limit`), analytical computation (`count`, `sum`, `mean`, `min`,
  `max`, `describe`), interpretation/provenance, verification, evaluation, and
  reporting. Phase 5 SHALL NOT rely on any frozen-phase capability that does not
  exist.
- **Rationale:** The frozen phases provide integration and tooling primitives,
  not analytics domain capabilities (R5.1, R5.3).
- **Consequences:** All analytics-specific capabilities are new Phase 5 work.
- **Rejected alternatives:** None.
- **Unresolved implications:** None.

### Q5.4 - Frozen-phase isolation (including Phase 4)

- **Problem:** Must any Phase 5 capability modify a frozen phase?
- **Classification:** ARCHITECTURE DECISION (no) / UNRESOLVED (future)
- **Research evidence:** R5.1; Phase 4 CLOSED/FROZEN (`README.md:110-111`);
  DEFINE §8.
- **Alternatives:** (a) build all Phase 5 capabilities in Phase 5, never modify
  Phase 1/2/3/4; (b) extend a frozen phase.
- **Chosen approach:** (a). Phase 3 and Phase 4 remain CLOSED and FROZEN; Phase 5
  does not consume Phase 4 by default.
- **Rationale:** Frozen-phase integrity; DEFINE §8; governance records.
- **Consequences:** Any perceived need to modify a frozen phase becomes an
  incompatibility record (§4.5, §20) with a Phase 5 alternative, never a
  modification.
- **Rejected alternatives:** (b) violates the freeze.
- **Unresolved implications:** If Specification finds a genuine requirement to
  modify a frozen phase, it SHALL be recorded as an incompatibility and escalated
  to Owner; no modification occurs.

---

## 11. Architecture Questions - Core Pipeline & Domain (Q5.5-Q5.10)

### Q5.5 - Analytics task lifecycle

- **Problem:** What lifecycle does the orchestrator drive?
- **Classification:** ARCHITECTURE DECISION (lifecycle) / UNRESOLVED (REPLANNING)
- **Research evidence:** R5.2 (bounded-loop precedent, Phase 2 nine-state machine
  and Phase 4 lifecycle); R5.5.
- **Alternatives:** (a) linear pipeline READY->PLANNING->ACQUIRING->PREPARING->
  ANALYZING->INTERPRETING->VERIFYING->EVALUATING->terminal; (b) cyclic with
  refinement/REPLANNING; (c) no explicit lifecycle.
- **Chosen approach:** (a) the recorded eight-stage pipeline with defined
  terminal outcomes; every run terminates.
- **Rationale:** Matches the accepted DEFINE scope and the observed implementation
  contract (R5.2); keeps the core deterministic and bounded.
- **Consequences:** Orchestrator must validate request/source/plan up front and
  guarantee termination.
- **Rejected alternatives:** (b) adds a REPLANNING state whose existence is
  unresolved (R5.2); (c) contradicts the recorded lifecycle.
- **Unresolved implications:** Whether `REPLANNING` should exist at all, and the
  exact state model, are SPECIFICATION INPUT / UNRESOLVED (§20 U2).

### Q5.6 - Data acquisition boundary

- **Problem:** What sources may Phase 5 acquire data from?
- **Classification:** FACT (out-of-scope network) / ARCHITECTURE DECISION
  (inline|localFile, read-only, deny-by-default) / UNRESOLVED (limits, bounds
  enforcement)
- **Research evidence:** R5.3 (Phase 3 read seam, `DEFAULT_BOUNDS`); R5.11;
  DEFINE §8 (external/network out of scope).
- **Alternatives:** (a) `inline` content directly + `localFile` content through
  the Phase 3 deterministic read seam, deny-by-default; (b) any external/network
  acquisition; (c) no acquisition beyond inline.
- **Chosen approach:** (a). Acquisition is `inline | localFile` only, read-only,
  deny-by-default; `localFile` reads delegate to the Phase 3 seam with
  `createDeterministicProviderStub` and `DEFAULT_BOUNDS`; a missing file fails
  acquisition (non-recoverable).
- **Rationale:** Matches DEFINE §4/§7/§8; reuses the frozen deterministic read
  seam; preserves the trust boundary (R5.11).
- **Consequences:** Phase 5 depends on Phase 3's public barrel for localFile
  reads; broader acquisition requires separate Owner authorization.
- **Rejected alternatives:** (b) out of scope (DEFINE §8, §22.3); (c) drops the
  recorded `localFile` capability (DEFINE §4).
- **Unresolved implications:** File-size/content limits for inline sources, and
  whether `bounds` should be enforced by the core (currently
  accepted-but-unconsumed - §20 U1), are UNRESOLVED.

### Q5.7 - Preparation transform model

- **Problem:** How are acquired datasets transformed before computation?
- **Classification:** ARCHITECTURE DECISION (transform set) / UNRESOLVED
  (transform schema)
- **Research evidence:** R5.3; DEFINE §4 (recorded transforms `parse`, `filter`,
  `derive`, `select`, `limit`; `derived-{datasetId}-{N}` naming).
- **Alternatives:** (a) fixed recorded transform set operating on derived
  datasets; (b) arbitrary/programmatic transforms; (c) no preparation stage.
- **Chosen approach:** (a) the recorded transform set, each transform producing a
  new derived dataset, chained toward analysis.
- **Rationale:** Matches the accepted DEFINE §4 scope and recorded operation
  forms; keeps preparation deterministic and auditable.
- **Consequences:** Preparation is bounded to the recorded transform set;
  additional transforms require DECISIONS + DEFINE refinement.
- **Rejected alternatives:** (b) exceeds DEFINE scope; (c) contradicts the
  recorded pipeline (DEFINE §4).
- **Unresolved implications:** Exact transform schema/parameters are SPECIFICATION
  INPUT.

### Q5.8 - Analytical computation model

- **Problem:** What computations does Phase 5 support?
- **Classification:** ARCHITECTURE DECISION (operation set) / UNRESOLVED
  (formulas)
- **Research evidence:** R5.4 (deterministic computation); DEFINE §4 (`count`,
  `sum`, `mean`, `min`, `max`, `describe`).
- **Alternatives:** (a) fixed deterministic operation set; (b) extensible
  user-defined computations; (c) no computation stage.
- **Chosen approach:** (a) the recorded operation set, computed deterministically
  from prepared datasets.
- **Rationale:** Matches DEFINE §4; deterministic math preserves the determinism
  contract (R5.4).
- **Consequences:** Computation is bounded to the recorded operation set.
- **Rejected alternatives:** (b) exceeds scope; (c) contradicts the pipeline.
- **Unresolved implications:** Exact computation schemas/formulas and numeric
  precision are SPECIFICATION INPUT.

### Q5.9 - Interpretation and provenance

- **Problem:** How are computed results turned into findings, and how is each
  finding traceable?
- **Classification:** ARCHITECTURE DECISION (provenance-bearing findings) /
  UNRESOLVED (provenance granularity)
- **Research evidence:** R5.6 (structural provenance chain per finding; root
  sourceIds -> recorded parse/filter transforms -> producing computation);
  R5.7; DEFINE §4/§5.
- **Alternatives:** (a) every finding carries a `ProvenanceChain` from root
  sources through recorded transforms to the producing computation; (b) findings
  without provenance; (c) coarse dataset-level provenance only.
- **Chosen approach:** (a). Findings are atomic and provenance-bearing;
  `UncertaintyInfo` is recorded alongside with `calibrated: false`.
- **Rationale:** Structural traceability is the deterministic-core analogue of
  evidence grounding (R5.6); DEFINE §5 requires provenance on every finding.
- **Consequences:** Every finding must be resolvable to source evidence;
  provenance granularity details remain open.
- **Rejected alternatives:** (b) violates DEFINE §5; (c) loses finding-level
  traceability (R5.6).
- **Unresolved implications:** Provenance granularity (§17 UNRESOLVED, §20 U7) is
  SPECIFICATION INPUT.

### Q5.10 - Uncertainty representation

- **Problem:** How does a deterministic core represent uncertainty?
- **Classification:** ARCHITECTURE DECISION (honest not-established) /
  UNRESOLVED (calibration method)
- **Research evidence:** R5.7 (Phase 4 precedent: no calibration asserted for
  deterministic default; observed `UncertaintyInfo` with `calibrated: false`,
  `method: "deterministic-core"`).
- **Alternatives:** (a) record `calibrated: false` with no implied confidence;
  (b) assert an uncalibrated confidence value; (c) omit uncertainty entirely.
- **Chosen approach:** (a). Uncertainty is surfaced honestly as "not
  established"; no confidence value is implied.
- **Rationale:** A deterministic core cannot calibrate confidence (R5.7);
  fabricating confidence contradicts the honesty principle (AD-5.5).
- **Consequences:** Downstream consumers must treat uncertainty as uncalibrated.
- **Rejected alternatives:** (b) implies false precision; (c) hides uncertainty.
- **Unresolved implications:** Confidence calibration method (§17, §20 U8) is
  deferred - requires model backing and Owner authorization.

---

## 12. Architecture Questions - Reliability & Verification (Q5.11-Q5.14)

### Q5.11 - Structural verification

- **Problem:** How does Phase 5 verify findings?
- **Classification:** ARCHITECTURE DECISION (structural, separate pass) /
  UNRESOLVED (depth)
- **Research evidence:** R5.6 (each provenance chain verified to resolve
  structurally; unverified findings never emitted in a `COMPLETED` result);
  DEFINE §4/§5.
- **Alternatives:** (a) independent structural verification pass (chain
  resolvability); (b) semantic/LLM-judged verification; (c) no verification.
- **Chosen approach:** (a). Verification is a separate pass that checks each
  finding's provenance chain resolves structurally; findings that fail are never
  emitted in a `COMPLETED` result.
- **Rationale:** For a deterministic core, verification is structural, not
  semantic (R5.6); DEFINE §5 requires verified-only reporting.
- **Consequences:** Verification cannot judge semantic quality; that is out of
  scope for a deterministic core (R5.12).
- **Rejected alternatives:** (b) requires model backing and §17 resolution; (c)
  violates DEFINE §5.
- **Unresolved implications:** Verification depth (structural-only vs
  re-verification of derived contents, §20 U9) is UNRESOLVED.

### Q5.12 - Five-outcome terminal model

- **Problem:** How does Phase 5 represent terminal states?
- **Classification:** ARCHITECTURE DECISION (five outcomes) / UNRESOLVED
  (PARTIAL reason field)
- **Research evidence:** R5.5 (ABSTAINED distinct from FAILED, PARTIAL preserves
  work, CANCELLED no report); Phase 4 precedent (abstention first-class);
  DEFINE §5.
- **Alternatives:** (a) five distinct outcomes (COMPLETED/PARTIAL/ABSTAINED/
  FAILED/CANCELLED); (b) collapse abstention/partial into failure; (c) fewer
  outcomes.
- **Chosen approach:** (a). Abstention is distinct from failure; partial work is
  preserved and reported; failure and cancellation produce no report.
- **Rationale:** "Abstain rather than fabricate" is the project pattern (R5.5);
  DEFINE §5 records each outcome's semantics.
- **Consequences:** Consumers must handle five outcome classes distinctly.
- **Rejected alternatives:** (b) loses the abstention/partial distinction (R5.5);
  (c) contradicts DEFINE §5.
- **Unresolved implications:** Whether `PARTIAL` needs an explicit reason field
  (§20 U5) is UNRESOLVED.

### Q5.13 - Determinism contract

- **Problem:** What determinism does Phase 5 guarantee?
- **Classification:** ARCHITECTURE DECISION (deterministic core) / UNRESOLVED
  (reproducibility level, cross-version)
- **Research evidence:** R5.4 (no model, no clock, no randomness in control flow;
  provider decisions fully specified; deterministic parse/compute); Phase 2
  deterministic execution rule (`phase-02/SPECIFICATION.md:69-79`).
- **Alternatives:** (a) guarantee identical inputs + identical provider decisions
  + identical FS state => identical result; (b) best-effort determinism; (c) no
  determinism guarantee.
- **Chosen approach:** (a). The core is deterministic: control flow is
  model-free, clock-free, and randomness-free; provider decisions fully
  determined by the request.
- **Rationale:** Matches Phase 2's frozen deterministic rule and the recorded
  objective (DEFINE §5; `reproducibility` scores 1 on the deterministic default
  path).
- **Consequences:** No model-backed behavior may enter the control flow; the seam
  is the only permitted model location.
- **Rejected alternatives:** (b) weakens the contract; (c) contradicts DEFINE §5.
- **Unresolved implications:** Reproducibility level to claim (§17, §20 U10) and
  cross-Node-version/build guarantees (§20 U14) are UNRESOLVED.

### Q5.14 - Reliability posture (bounded recovery)

- **Problem:** How does Phase 5 handle shortfalls and unrecoverable states?
- **Classification:** ARCHITECTURE DECISION (no retry/correction loop; PARTIAL on
  shortfall) / UNRESOLVED (bounds enforcement)
- **Research evidence:** R5.2, R5.5, R5.12 (no retry/correction loop; plan
  shortfall => PARTIAL; missing file => FAILED); Phase 2 `RETRY -> ADVANCE ->
  EXHAUST` correction ordering is a Phase 2 concern, not a Phase 5 capability.
- **Alternatives:** (a) no correction loop; plan shortfall => PARTIAL preserving
  produced+verified work; (b) retry/correction loop; (c) fail wholesale on any
  shortfall.
- **Chosen approach:** (a). The core cannot "correct" its way out of a plan
  deficit; it reports PARTIAL rather than failing wholesale.
- **Rationale:** Deterministic-core limitation recorded in R5.12; DEFINE §5
  requires preserving partial results.
- **Consequences:** Plan quality is the caller's responsibility (R5.12); the core
  validates structure, not optimality.
- **Rejected alternatives:** (b) needs model-backed refinement (§17/Q4.22); (c)
  contradicts DEFINE §5.
- **Unresolved implications:** Whether `bounds` should be enforced by the core
  (§20 U1) and whether `REPLANNING` should exist (§20 U2) are UNRESOLVED.

---

## 13. Architecture Questions - Evaluation & Reporting (Q5.15-Q5.17)

### Q5.15 - Multi-dimensional quality evaluation

- **Problem:** How does Phase 5 evaluate analytical quality?
- **Classification:** ARCHITECTURE DECISION (fixed 5-dimension, per-dimension
  [0,1], basis notes) / UNRESOLVED (weights/thresholds)
- **Research evidence:** R5.8 (per-dimension scores from deterministic signals
  with basis notes; weights/thresholds NOT applied - §17); Phase 4 precedent
  (multi-dimensional evaluation, no single scalar).
- **Alternatives:** (a) fixed 5-dimension evaluation (correctness, completeness,
  provenance, confidenceUncertainty, reproducibility) with per-dimension scores
  and explicit basis notes; (b) single composite scalar; (c) no evaluation.
- **Chosen approach:** (a). Each dimension is scored in [0,1] from deterministic
  signals with per-dimension basis notes; no weights or thresholds are applied.
- **Rationale:** Matches Phase 4 precedent and R5.8; combining dimensions into a
  single score requires §17 resolution.
- **Consequences:** Evaluation is transparent (basis notes) and does not assert a
  composite quality number.
- **Rejected alternatives:** (b) requires §17 weights/thresholds resolution; (c)
  contradicts DEFINE §4/§5.
- **Unresolved implications:** Coverage-threshold value, weights, and thresholds
  (§17, §20 U6) are UNRESOLVED.

### Q5.16 - Verification-evaluation separation

- **Problem:** Are verification and evaluation separate concerns?
- **Classification:** ARCHITECTURE DECISION (separate passes)
- **Research evidence:** R5.6, R5.8 (verification checks chain resolvability;
  evaluation scores quality dimensions); DEFINE §4.
- **Alternatives:** (a) separate passes: verification (structural) then
  evaluation (multi-dimensional); (b) merged single pass; (c) evaluation only.
- **Chosen approach:** (a). Verification and evaluation are distinct phases of the
  lifecycle.
- **Rationale:** They answer different questions (can this finding be traced vs
  how good is the result); separation keeps each honest (R5.6, R5.8).
- **Consequences:** A finding can be structurally verified yet score low on
  quality dimensions.
- **Rejected alternatives:** (b) conflates the two concerns; (c) skips
  verification, violating DEFINE §5.
- **Unresolved implications:** None.

### Q5.17 - Reporting

- **Problem:** What does the analytical report contain?
- **Classification:** ARCHITECTURE DECISION (verified findings only) /
  UNRESOLVED (report schema)
- **Research evidence:** R5.6 (never emit unverified findings in a COMPLETED
  result); DEFINE §4 (reporting references verified findings only) / §5.
- **Alternatives:** (a) report references verified findings only, with
  traceability to sources; (b) report may include unverified findings; (c) no
  report.
- **Chosen approach:** (a). The report is composed from verified findings only and
  maintains traceability to source evidence.
- **Rationale:** Verified-only reporting is the reporting-half of the structural
  verification guarantee (R5.6); DEFINE §4.
- **Consequences:** A COMPLETED result's report contains only verifiable findings.
- **Rejected alternatives:** (b) breaks the verification guarantee; (c)
  contradicts DEFINE §4.
- **Unresolved implications:** Exact report schema/format is SPECIFICATION INPUT.

---

## 14. Architecture Questions - Seams, Security, Extension (Q5.18-Q5.22)

### Q5.18 - Decision provider / model seam

- **Problem:** Where may a model participate in Phase 5?
- **Classification:** FACT (seam-first precedent) / ARCHITECTURE DECISION (seam
  retained; binding deferred) / UNRESOLVED (seam shape)
- **Research evidence:** R5.9 (Phase 2 `DecisionProvider` is the only permitted
  model seam; Phase 4 carries Q4.22 deferred; observed `AnalyticsDecisionProvider`
  with three methods and a deterministic first-available stub).
- **Alternatives:** (a) retain a decision-provider seam with a deterministic
  default stub, no model bound; (b) hard-wire model calls into the core; (c) no
  seam.
- **Chosen approach:** (a). Model involvement is confined to the seam; the default
  provider is a deterministic first-available stub; no model/provider is bound.
- **Rationale:** Seam-first, bind-later is the Phase 2/4 precedent (R5.9); keeps
  the core deterministic (AD-5.3).
- **Consequences:** Future model-backed behavior requires implementing the seam,
  plus §17/Q4.22 resolution and Owner authorization.
- **Rejected alternatives:** (b) violates the determinism contract; (c) removes
  the future upgrade point (R5.12).
- **Unresolved implications:** Whether the three-method seam shape is correct
  (R5.9, §20 U3), and Q4.22 provider/model binding (deferred), are UNRESOLVED.

### Q5.19 - Security and trust boundary

- **Problem:** What is the trust boundary for Phase 5 input?
- **Classification:** FACT / ARCHITECTURE DECISION (deny-by-default, no external
  path) / UNRESOLVED (path containment re-check)
- **Research evidence:** R5.11 (no CLI, no config schema, no write/process/
  network tooling, no persistence, no provider SDK; localFile via Phase 3 read
  seam); DEFINE §8; Phase 1 path-containment primitives.
- **Alternatives:** (a) consume only inline content and read-only local files
  through a deny-by-default seam; no external input path by default; (b) any
  broader acquisition; (c) additional network/process capabilities.
- **Chosen approach:** (a). Inline content is caller-supplied data; localFile
  reads delegate to the Phase 3 read seam (read-only, bounded); there is no
  external input path by default.
- **Rationale:** Phase 2 deny-by-default and Phase 3 prohibitions are frozen
  facts (R5.11); DEFINE §8.
- **Consequences:** Content is treated as untrusted input processed by
  deterministic, auditable transforms.
- **Rejected alternatives:** (b)/(c) out of scope (§22.3, DEFINE §8).
- **Unresolved implications:** Whether path containment should be explicitly
  re-checked at the Phase 5 layer or delegated to the Phase 3 seam (§20 U13) is
  UNRESOLVED.

### Q5.20 - Determinism and reproducibility scope

- **Problem:** How far does the reproducibility guarantee extend?
- **Classification:** ARCHITECTURE DECISION (deterministic default path) /
  UNRESOLVED (level, cross-version)
- **Research evidence:** R5.4 (no model, no clock, no randomness; `reproducibility`
  scores 1 on the deterministic path); Phase 2 deterministic rule.
- **Alternatives:** (a) claim reproducibility for the deterministic default path;
  (b) claim bit-for-bit reproducibility across all environments; (c) no claim.
- **Chosen approach:** (a). Reproducibility is guaranteed for the deterministic
  default path under identical inputs, provider decisions, and FS state.
- **Rationale:** Matches DEFINE §5 and the determinism contract (R5.4).
- **Consequences:** Broader reproducibility claims require explicit resolution of
  the reproducibility level (§17, §20 U10).
- **Rejected alternatives:** (b) unverified across Node versions/builds (§20 U14);
  (c) contradicts DEFINE §5.
- **Unresolved implications:** Reproducibility level and cross-version guarantees
  are UNRESOLVED (§20 U10, U14).

### Q5.21 - Engineering trade-off posture

- **Problem:** What does the deterministic, model-free approach trade away?
- **Classification:** FACT / INFERENCE / ARCHITECTURE DECISION (posture)
- **Research evidence:** R5.12 (expressiveness/adaptivity traded for
  predictability, verifiability, reproducibility; no retry/correction loop; plan
  quality is the caller's responsibility; quality signals are structural-only;
  the seam is the future upgrade point); BLUEPRINT §7.7 Reliability Over
  Unnecessary Complexity.
- **Alternatives:** (a) deterministic core with the seam as the only model
  location; (b) model-backed core; (c) hybrid.
- **Chosen approach:** (a). Phase 5 accepts the deterministic trade-off by
  design: bounded scope, structural quality signals, caller-owned plan quality,
  seam as the designated upgrade point.
- **Rationale:** Recorded in R5.12; BLUEPRINT §7.7 precedent; DEFINE §4/§5.
- **Consequences:** Some capabilities (semantic quality judgment, plan
  refinement) are intentionally out of scope until §17/Q4.22 resolution and
  Owner authorization.
- **Rejected alternatives:** (b)/(c) require model binding and §17/Q4.22
  resolution - not authorized.
- **Unresolved implications:** Whether any model-backed capability is ever in
  scope (R5.12, §20 U12) is UNRESOLVED.

### Q5.22 - Deferred items and extension governance

- **Problem:** How are deferred items handled?
- **Classification:** FACT / ARCHITECTURE DECISION (stay deferred)
- **Research evidence:** R5.10 (DEFINE §17 UNRESOLVED items; BLUEPRINT
  §22.1-§22.5; Q4.22); Phase 4 D3.2 precedent.
- **Alternatives:** (a) keep all deferred items deferred; (b) resolve one or more
  here.
- **Chosen approach:** (a). DEFINE §17 items (evaluation weights/thresholds;
  persistence; external-data policy; Phase 4 consumption; confidence calibration;
  provenance granularity; reproducibility level; coverage-threshold value),
  BLUEPRINT §22.1-§22.5, and Q4.22 remain deferred and unchanged.
- **Rationale:** Resolution requires separate Owner authorization per governance
  (R5.10; D3.2 precedent).
- **Consequences:** Specification must not silently resolve any deferred item;
  conflicts surfaced (§20).
- **Rejected alternatives:** (b) exceeds Architecture authority.
- **Unresolved implications:** Any future resolution requires a DECISIONS entry
  and Owner authorization.

---

## 15. Decision Summary Matrix

**[ARCHITECTURE DECISION]** Summary of the architecture decisions in this
document (full reasoning in each question and in `DECISIONS.md`):

| ID | Question | Decision | Classification |
| --- | --- | --- | --- |
| Q5.1 | Module identity/naming | `phase-05/`, "Analytics Agent Module", `@issue/analytics` | DECISION (affirm) + UNRESOLVED (exports) |
| Q5.2 | Consumption | barrel-only through public surfaces; localFile via Phase 3 seam | DECISION |
| Q5.3 | Unobtainable capabilities | build analytics capabilities from scratch | FACT/INFERENCE |
| Q5.4 | Frozen-phase isolation | never modify frozen phases; Phase 4 not consumed by default | DECISION |
| Q5.5 | Lifecycle | recorded eight-stage pipeline; guaranteed termination | DECISION + UNRESOLVED (REPLANNING) |
| Q5.6 | Acquisition boundary | inline | localFile, read-only, deny-by-default via Phase 3 seam | DECISION + UNRESOLVED |
| Q5.7 | Preparation transforms | recorded transform set (parse/filter/derive/select/limit) | DECISION + UNRESOLVED |
| Q5.8 | Computation | recorded operation set (count/sum/mean/min/max/describe) | DECISION + UNRESOLVED |
| Q5.9 | Interpretation/provenance | provenance-bearing findings; UncertaintyInfo calibrated:false | DECISION + UNRESOLVED |
| Q5.10 | Uncertainty | honest not-established; no implied confidence | DECISION + UNRESOLVED |
| Q5.11 | Verification | structural, separate pass; verified-only emission | DECISION + UNRESOLVED |
| Q5.12 | Outcomes | five distinct terminal outcomes; abstain != fail | DECISION + UNRESOLVED |
| Q5.13 | Determinism | identical inputs + provider decisions + FS state => identical result | DECISION + UNRESOLVED |
| Q5.14 | Reliability | no retry/correction loop; PARTIAL on shortfall | DECISION + UNRESOLVED |
| Q5.15 | Evaluation | fixed 5-dimension, per-dimension [0,1], basis notes | DECISION + UNRESOLVED |
| Q5.16 | Verification-evaluation | separate passes | DECISION |
| Q5.17 | Reporting | verified findings only | DECISION + UNRESOLVED |
| Q5.18 | Provider seam | seam retained; binding deferred | DECISION + UNRESOLVED |
| Q5.19 | Security | deny-by-default; no external input path | DECISION + UNRESOLVED |
| Q5.20 | Reproducibility | guaranteed for deterministic default path | DECISION + UNRESOLVED |
| Q5.21 | Trade-off posture | deterministic core; seam = upgrade point | DECISION + UNRESOLVED |
| Q5.22 | Deferred items | stay deferred | DECISION |

**[INFERENCE]** All decisions are structural/scope decisions. No Specification-
finalized decision (API, schema, threshold, scoring formula, technology) is made
here.

---

## 16. Deferred Decisions

**[FACT / DEFERRED]** Carried forward unchanged from DEFINE §17, BLUEPRINT §22
(Phase 3 D3.2 precedent):

- DEFINE §17 items: evaluation weights/thresholds; persistence; external-data
  policy; Phase 4 consumption; confidence calibration method; provenance
  granularity; reproducibility level; coverage-threshold value.
- §22.1 CLI / end-user entry point - deferred.
- §22.2 configuration-file schema - deferred.
- §22.3 write/execute/Git/network tooling - deferred (external/network data
  acquisition remains out of Phase 5 scope).
- §22.4 model-provider binding - deferred (Q5.18; Q4.22).
- §22.5 workspace/monorepo adoption - deferred.

**[NORMATIVE]** None is resolved by this Architecture stage. Resolving any
requires separate Owner authorization and a Phase 5 DECISIONS entry.

---

## 17. Future Extension Points

**[EXTENSION]** Reserved for later phases / future authorization:

- CLI / end-user entry point (§22.1).
- Configuration-file schema (§22.2).
- Write/execute/Git/network tooling and external data acquisition (§22.3).
- Model/provider binding behind the `AnalyticsDecisionProvider` seam (§22.4,
  Q4.22).
- Workspace/monorepo adoption (§22.5).
- Persistence / cross-run memory (DEFINE §8).
- Model-backed capabilities (plan refinement, semantic quality judgment,
  confidence calibration) - §17/Q4.22 resolution required.
- Phase 4 consumption (currently not consumed by default).
- Performance benchmarking infrastructure, publishing / distribution (Phase 2
  §19.12, §19.15).

---

## 18. Conformance & Validation

**[NORMATIVE]** Phase 5 Architecture conforms when:

- Every architecture question (Q5.1-Q5.22) is recorded with labels
  (FACT/PRECEDENT/INFERENCE/ARCHITECTURE DECISION/UNRESOLVED).
- No Specification-finalized decision (API, schema, threshold, scoring formula,
  technology) is made here.
- No frozen Phase 1/2/3/4 artifact is modified; Phases 3 and 4 remain CLOSED and
  FROZEN; BLUEPRINT is unmodified.
- Barrel-only consumption is stated and enforced.
- Deferred items remain deferred (§16).
- Research-stage unresolved questions (U1-U14) and §17 items are not resolved.
- The Specification firewall and implementation firewall are respected.
- The TS2307 environment constraint is not fixed or worked around here.

---

## 19. Specification Inputs (firewall)

**[RECOMMENDATION / UNRESOLVED]** The following are **NOT finalized here**; they
are recorded as Specification inputs from accepted DEFINE, Research R5.1-R5.12,
and this Architecture:

- **Public API surface** - exact exports, function signatures, entry points
  (bounded to `runAnalyticsTask` + 13 types by DEFINE §4).
- **Data schemas** - request, source selector, plan (transforms/computations),
  dataset, derived dataset, finding, provenance chain, uncertainty, evaluation
  record, report.
- **Transform/computation schemas** - parameter forms, `derived-{datasetId}-{N}`
  naming details.
- **Thresholds and criteria** - coverage thresholds, acceptance criteria,
  pass/fail formulas, evaluation weights, dimension thresholds, scoring formulas,
  bounds enforcement (DEFAULT_BOUNDS vs core-enforced limits).
- **Reproducibility and verification depth** - reproducibility level claimed,
  structural-only vs content re-verification.
- **Implementation technology** - packaging, dependency choices, tooling (within
  the frozen barrel-only constraint).
- **PARTIAL reason field / REPLANNING state** - whether these exist in the
  state model.

**[NORMATIVE]** No threshold, pass/fail formula, scoring formula, or benchmark
value is established by this Architecture stage.

---

## 20. Unresolved Questions Register

**[UNRESOLVED]** Consolidated open questions requiring Specification and/or Owner
approval (carried from Research §16 U1-U14 and this stage):

1. **U1** Whether `bounds` should be enforced by the core (currently
   accepted-but-unconsumed) - conflict noted in Research.
2. **U2** Whether the `REPLANNING` state should exist at all (R5.2, Q5.5).
3. **U3** Whether the three-method `AnalyticsDecisionProvider` seam shape is
   correct (R5.9, Q5.18).
4. **U4** File-size/content limits for inline sources (R5.3, Q5.6).
5. **U5** Whether `PARTIAL` needs an explicit reason field (R5.5, Q5.12).
6. **U6** Evaluation weights, thresholds, coverage-threshold value (§17; R5.8,
   Q5.15).
7. **U7** Provenance granularity (§17; R5.6, Q5.9).
8. **U8** Confidence calibration method (§17; R5.7, Q5.10).
9. **U9** Verification depth: structural-only vs re-verification of derived
   dataset contents (R5.6, Q5.11).
10. **U10** Reproducibility level to claim (§17; R5.4, Q5.20).
11. **U11** External-data policy (§17) - broader acquisition requires Owner
    authorization.
12. **U12** Whether any model-backed capability is ever in scope (§17/Q4.22;
    R5.12, Q5.21).
13. **U13** Whether path containment is explicitly re-checked at the Phase 5
    layer or delegated to the Phase 3 seam (R5.11, Q5.19).
14. **U14** Whether determinism is guaranteed across Node.js versions/builds
    (R5.4, Q5.20).
15. **U15** Persistence / Phase 4 consumption decisions (§17; DEFINE §8).
16. **U16** The repo-wide `@issue/foundation` TS2307 problem (frozen-contract
    environment constraint; NOT resolved or worked around here).
17. Any incompatibility discovered at Specification (§4.5) - to be recorded here.

**Conflict notes (preserved, not resolved):** README "TEST = PASS" claim
(`README.md:118-132`) conflicts with the currently failing `npm run check`
(TS2307); README's governed-stage citations (`README.md:146-171`) are
conversation records (2026-08-15), not durable acceptance; `bounds` is
accepted-but-unconsumed (U1).

---

## 21. Architecture-stage Status

**[STATUS]**

```
PHASE 5 ARCHITECTURE:
CREATED (draft) - pending Owner/Architecture acceptance

ARCHITECTURE DECISIONS MADE: Q5.1-Q5.22 (structural scope; see each)
SPECIFICATION-FINALIZED DECISIONS: NONE (firewall respected)
DEFERRED ITEMS RESOLVED: NONE (DEFINE §17, §22.1-§22.5, Q4.22 unchanged)
RESEARCH-STAGE UNRESOLVED ITEMS RESOLVED: NONE (U1-U14 carried forward)
FROZEN PHASE 1/2/3/4 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 5 src/tests/package.json/tsconfig MODIFIED: NO
SOURCE/TEST/CONFIGURATION ARTIFACTS CREATED: NO (pre-existing, observable evidence only)
DIAGRAMS CREATED: NO
ARCHITECTURE ARTIFACTS CREATED: phase-05/ARCHITECTURE.md, phase-05/DECISIONS.md
TS2307 FIX OR WORKAROUND APPLIED: NO
COMMIT/PUSH: NO

OPEN REQUIREMENTS BEFORE SPECIFY:
- Owner/Architecture acceptance of this document
- Owner decision on deferred items (§17, §22.1-§22.5) if any to be resolved
- Owner decision on model/provider binding (Q4.22) if to be resolved
- Specification stage to finalize API, schemas, thresholds, scoring, technology
```

---

## 22. End-of-Document Block

```
PHASE 5 ARCHITECTURE: CREATED (draft)
PHASE 5 ARCHITECTURE STAGE: PENDING OWNER ACCEPTANCE
HISTORICAL ARCHITECTURE RECOVERED: NO (NOT RECOVERABLE; not reconstructed)
SPECIFICATION AUTHORIZED: NO
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 5 src/tests/package.json/tsconfig MODIFIED: NO
TS2307 FIX OR WORKAROUND APPLIED: NO
PHASE 6 WORK STARTED: NO
COMMIT/PUSH: NO
```