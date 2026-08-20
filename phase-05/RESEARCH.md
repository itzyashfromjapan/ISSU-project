# ISSU — Phase 5: Data and Analytics Agents — Research Record

**Phase:** 5 — Data and Analytics Agents
**Stage:** RESEARCH (owner-authorized; accepted DEFINE → Research)
**Status:** DRAFT — awaiting Research-stage acceptance
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Accepted DEFINE:** `./DEFINE.md` (ACCEPTED, owner, 2026-08-20)
**License:** Apache License 2.0

This is a **NEW GOVERNED RESEARCH STAGE**. It is NOT a reconstruction of the
missing 2026-08-15 Phase 5 Research record, which is NOT RECOVERABLE from
authoritative durable sources.

---

## 1. Research Status

DRAFT — evidence gathered and recorded for Owner review. Research does not
decide Architecture, public APIs, schemas, algorithms, technology, provider
binding, or acceptance criteria; those remain UNRESOLVED unless stated
otherwise here.

---

## 2. Research Authorization

Owner decision: **ACCEPT the NEW GOVERNED Phase 5 DEFINE record and AUTHORIZE
Phase 5 RESEARCH** (2026-08-20). Authorized work: evidence-gathering and
analysis for the later Architecture and Specification stages, within the
mandatory boundaries (no modification of Phase 1/2/3/4, BLUEPRINT, Phase 5
`src/**`/`tests/**`/`package.json`/tsconfig/dependencies, no TS2307 fix or
paths workaround, no §22.1–§22.5/§22.3/Q4.22 resolution, no Phase 6 work).
Research does NOT authorize Architecture, Specification, Design decisions, or
Implementation.

---

## 3. Accepted DEFINE Reference

Accepted as the current authoritative definition of Phase 5
(`phase-05/DEFINE.md`, ACCEPTED 2026-08-20):

- **Domain:** Data and Analytics Agents; deterministic analytics-agent core.
- **Public surface (as defined by DEFINE):** exactly `runAnalyticsTask` + 13
  public types.
- **Scope:** acquisition (inline | localFile) → preparation (parse, filter,
  derive, select, limit) → computation (count, sum, mean, min, max, describe)
  → interpretation (findings with ProvenanceChain + UncertaintyInfo) →
  verification → 5-dimension evaluation → verified-only reporting.
- **Boundaries:** no external/network acquisition, no CLI/config schema, no
  write/edit/delete/process tooling, no persistence, no provider/model binding,
  no default consumption of Phase 4.
- **Dependencies:** Phase 1/2/3 public barrels only (`file:` refs).
- **Deferred:** §17 UNRESOLVED items, §22.1–§22.5, Q4.22.

---

## 4. Research Questions

| ID | Question |
| --- | --- |
| R5.1 | What frozen-contract surface may Phase 5 legitimately consume, and through which seams? |
| R5.2 | What deterministic execution / bounded-loop precedent exists for a Phase 5 lifecycle? |
| R5.3 | How should data acquisition be bounded given external/network acquisition is out of scope? |
| R5.4 | How should determinism and reproducibility be established and preserved? |
| R5.5 | How should abstention vs. partial vs. failure vs. cancellation be distinguished? |
| R5.6 | How should provenance and structural verification be modeled for a deterministic core? |
| R5.7 | How should uncertainty/confidence be recorded absent model-based calibration? |
| R5.8 | How should quality evaluation be structured without weights/thresholds? |
| R5.9 | What is the provider/model seam precedent, and what remains deferred (Q4.22)? |
| R5.10 | Which deferred items (§17, §22.x, Q4.22) remain outside scope and how are they handled? |
| R5.11 | What security/trust implications follow from the acquisition and consumption boundaries? |
| R5.12 | What engineering trade-offs attend the deterministic, model-free approach? |

---

## 5. Evidence / Source Inventory

Source-of-truth order per authorization; every item read/verified this session.

1. **`BLUEPRINT.md`** — §5, §6, §7, §8, §9, §10, §11, §12, §13, §18, §22, §23,
   §25, §26, §28, §29, §30, §33.
2. **`phase-05/DEFINE.md`** (ACCEPTED) — full record.
3. **Frozen contracts:**
   - `phase-01-foundation/SPECIFICATION.md` — §2 public contract (VERSION,
     AppError, Result, config, env/secrets, Logger, path containment
     `assertContained`/`isContained`, runCli).
   - `phase-02/SPECIFICATION.md` — §1–§4 (ToolRuntime, nine-state machine,
     read-only `readFile`/`listDirectory`, deny-by-default, `DecisionProvider`
     with `selectAction`/`assess`, bounded correction `RETRY → ADVANCE →
     EXHAUST`, deterministic execution rule §3.3).
   - `phase-03/SPECIFICATION.md` — §2 (barrel-only consumption), §3 (frozen
     Phase 2 contract: 20 types + 3 functions, nine-state machine, bounds,
     `D-BOUNDS`), §4 (integration steps, deterministic provider stubs only),
     §5 (explicitly prohibited list), §6 (deferred decisions).
4. **Phase 4 CLOSED/FROZEN precedent:**
   - `phase-04/ARCHITECTURE.md` — Research Q1–Q7 (audited PASS 2026-08-14),
     decision labels (FACT / INFERENCE / RESEARCH EVIDENCE / ARCHITECTURE
     DECISION / UNRESOLVED), Q4.1–Q4.26 format, Q4.22 (provider seam deferred).
   - `phase-04/DECISIONS.md` — AD-4.1…AD-4.6 decision format (barrel-only
     consumption precedent AD-4.1).
   - `phase-04/SPECIFICATION.md` — stage status/acceptance conventions.
5. **Existing Phase 5 implementation/tests (observable evidence ONLY — NOT
   proof of historical acceptance):**
   - `phase-05/src/index.ts` — public barrel (exactly `runAnalyticsTask` +
     13 types).
   - `phase-05/src/internal/machine.ts` — orchestrator; lifecycle states;
     `PLAN_OPERATIONS` set; `providerPickNext` selection-with-validation;
     terminal-state derivation.
   - `phase-05/src/internal/model.ts` — statuses, ACTIVE/TERMINAL sets, public
     data model.
   - `phase-05/src/internal/acquire.ts` — inline/localFile acquisition via
     `@issue/integration` seam.
   - `phase-05/src/internal/compute.ts` — bounded operations; `undefined`
     shortfall on no numeric values.
   - `phase-05/src/internal/prepare.ts` — parse/filter transforms recorded.
   - `phase-05/src/internal/parse.ts` — CSV-style deterministic parsing.
   - `phase-05/src/internal/interpret.ts` — findings + provenance chains +
     uncertainty.
   - `phase-05/src/internal/verify.ts` — structural chain verification.
   - `phase-05/src/internal/evaluate.ts` — 5-dimension scoring.
   - `phase-05/src/internal/report.ts` — verified-only reporting.
   - `phase-05/src/internal/provider.ts` — `AnalyticsDecisionProvider` seam +
     deterministic stub.
   - `phase-05/tests/*` — public-api (16), lifecycle (9), compute (14),
     internal.unit (17), determinism (1), seam.integration (3) = 60.
   - `phase-05/vitest.config.ts` — coverage thresholds ≥ 80% per dimension.
   - `phase-05/coverage/coverage-summary.json` — statements 91.83%, branches
     83.47%, functions 97.01%, lines 93.18%.
   - `phase-05/README.md` — recorded claims (see §16 conflicts).
6. **External research:** not required for any research question; provider
   binding and external-data policy remain deferred (§17 UNRESOLVED; Q4.22).

---

## 6. Findings

### R5.1 — Frozen-contract consumption surface and seams

- **FACT:** Phase 3 established barrel-only consumption as an integration rule:
  `@issue/foundation`, `@issue/tool-runtime`, `@issue/integration` are consumed
  only via their public barrels; deep imports SHALL NOT be used
  (`phase-03/SPECIFICATION.md:39-46`).
- **FACT:** Phase 1 public contract includes error/`Result` handling, `Logger`,
  config/env/secrets, and path-containment primitives (`assertContained` /
  `isContained`) (`phase-01-foundation/SPECIFICATION.md:27-103`).
- **FACT:** Phase 2 public contract is exactly 20 types + 3 functions
  (`runTask`, `createToolRuntime`, `deriveAvailableActions`), with deterministic
  execution: only the `DecisionProvider` may involve a model
  (`phase-02/SPECIFICATION.md:48-130`; `phase-03/SPECIFICATION.md:57-62`).
- **PRECEDENT:** Phase 4 consumes frozen Phase 1/2/3 barrel-only (AD-4.1,
  `phase-04/DECISIONS.md:30-46`).
- **OBSERVED:** Phase 5 implementation imports `AppError`/`isOk`/`Logger` from
  `@issue/foundation`, `ResourceBounds` from `@issue/tool-runtime`, and
  `DEFAULT_BOUNDS`/`createDeterministicProviderStub`/`runIntegrationTask` from
  `@issue/integration` — all via barrel (`phase-05/src/internal/machine.ts:11-12`,
  `model.ts:12-13`, `acquire.ts:10-16`). Observable evidence, not acceptance.
- **INFERENCE:** A Phase 5 Architecture should adopt barrel-only consumption
  and confine any model involvement to a provider seam, consistent with Phase
  1/2/3 contracts and the Phase 4 precedent. **UNRESOLVED:** whether Phase 5
  needs any Phase 2 direct consumption beyond types (see R5.3).

### R5.2 — Deterministic execution / bounded-loop precedent

- **FACT:** Phase 2 defines a frozen nine-state machine with legal transitions
  and terminal closure; nondeterminism is confined to `DecisionProvider`
  methods (`phase-02/SPECIFICATION.md:48-130`).
- **FACT:** Phase 3 mandates deterministic provider stubs; no model, provider,
  or SDK involved (`phase-03/SPECIFICATION.md:87-93`).
- **PRECEDENT:** Phase 4 lifecycle defines a bounded research-task loop
  (plan → retrieve → evaluate → refine → synthesize) with a deterministic core
  and a `ResearchDecisionProvider` seam (`phase-04/ARCHITECTURE.md:250`).
- **OBSERVED:** Phase 5 orchestrator drives `READY → PLANNING → ACQUIRING →
  PREPARING → ANALYZING → INTERPRETING → VERIFYING → EVALUATING → terminal`,
  with `REPLANNING` defined but never entered; every run terminates
  (`phase-05/src/internal/machine.ts:1-9,244-374`; `model.ts:18-56`).
- **INFERENCE:** The bounded-loop pattern (deterministic core + injected
  decision seam + guaranteed termination) is the established project pattern
  for domain modules. **UNRESOLVED:** whether Phase 5 must define explicit
  resource bounds (see R5.4), and whether `REPLANNING` should exist at all.

### R5.3 — Data acquisition boundary

- **FACT:** External/network data acquisition is out of scope (DEFINE §8;
  `phase-05/DEFINE.md`; `phase-05/README.md:45-49`).
- **FACT:** Phase 3 provides a deterministic, read-only integration seam with
  `DEFAULT_BOUNDS` and bounded resource limits (`phase-03/SPECIFICATION.md`;
  `phase-02/SPECIFICATION.md:48-130`).
- **OBSERVED:** Phase 5 acquires `inline` content directly and `localFile`
  content through `runIntegrationTask` with `createDeterministicProviderStub`
  and `DEFAULT_BOUNDS`; a missing file fails acquisition (non-recoverable)
  (`phase-05/src/internal/acquire.ts:36-117`).
- **INFERENCE:** For Architecture, the acquisition boundary can be
  "inline | localFile only, read-only, deny-by-default" backed by the Phase 3
  seam; any broader acquisition requires separate Owner authorization.
  **UNRESOLVED:** file-size/content limits for inline sources; whether
  `bounds` should be enforced by the core (currently accepted-but-unconsumed —
  see §16 conflict).

### R5.4 — Determinism and reproducibility

- **FACT:** Phase 2 deterministic execution rule: identical options +
  identical provider decisions + identical FS state ⇒ identical transitions
  and terminal (`phase-02/SPECIFICATION.md:69-79`).
- **FACT:** No Phase 5 model/provider is bound; the default provider is a
  deterministic stub (`phase-05/src/internal/provider.ts:48-80`).
- **OBSERVED:** Phase 5 test asserts identical inputs produce identical results
  (`phase-05/tests/determinism.test.ts:4-6`); evaluation scores
  `reproducibility = 1` on the deterministic path
  (`phase-05/src/internal/evaluate.ts:59-61`).
- **INFERENCE:** Determinism follows from: no model, no clock, no randomness in
  control flow; provider decisions fully specified by the request; and
  deterministic parse/compute. **UNRESOLVED:** reproducibility level to claim
  (§17 UNRESOLVED item); whether determinism is guaranteed across Node.js
  versions/builds.

### R5.5 — Abstention vs. partial vs. failure vs. cancellation

- **FACT:** Phase 2 defines outcome classes and a correction ordering
  (`RETRY → ADVANCE → EXHAUST`) for bounded recovery
  (`phase-02/SPECIFICATION.md:57-62`).
- **PRECEDENT:** Phase 4 defines abstention as a first-class outcome distinct
  from failure (`phase-04/ARCHITECTURE.md:236-242`, Q4.16–Q4.19).
- **OBSERVED:** Phase 5 distinguishes `ABSTAINED` (no sources, or all datasets
  empty) from `FAILED` (invalid request/source/plan, acquisition failure,
  unknown provider id, unrecoverable error), from `PARTIAL` (plan shortfall,
  produced+verified work still reported), and from `CANCELLED` (aborted signal,
  no report) (`phase-05/src/internal/machine.ts:46-92,244-374`;
  `phase-05/README.md:53-65`).
- **INFERENCE:** The "abstain rather than fabricate" principle is the project
  pattern for insufficient-data outcomes; a deterministic core cannot "correct"
  its way out of a data deficit. **UNRESOLVED:** the §9/§17 abstention
  criteria for "contradictory / below-reliability-threshold" conditions (not a
  capability of a deterministic core); whether `PARTIAL` needs an explicit
  reason field.

### R5.6 — Provenance and structural verification

- **FACT:** Phase 4 establishes layered hallucination prevention: grounding,
  faithfulness, citation verification, confidence, abstention
  (`phase-04/ARCHITECTURE.md:205-206`, Q4.16–Q4.19).
- **OBSERVED:** Phase 5 builds a `ProvenanceChain` per finding (root `sourceIds`
  → recorded `parse`/`filter` transforms → producing computation), verifies
  each chain resolves structurally, and never emits unverified findings in a
  `COMPLETED` result (`phase-05/src/internal/interpret.ts:64-123`;
  `verify.ts:48-57`; `machine.ts:328-336`).
- **INFERENCE:** For a deterministic core, verification is structural
  (chain-resolvability), not semantic/LLM-judged. **UNRESOLVED:** provenance
  granularity (§17 UNRESOLVED); whether derived dataset contents should be
  re-verified against their transform definitions (currently structural only).

### R5.7 — Uncertainty / confidence without model-based calibration

- **FACT:** Phase 4 treats confidence calibration as a model-backed concern
  with a deterministic default (no calibration asserted)
  (`phase-04/ARCHITECTURE.md:236-238`).
- **OBSERVED:** Phase 5 records `UncertaintyInfo` with `calibrated: false`,
  `method: "deterministic-core"`, and a note that no calibration is asserted
  (`phase-05/src/internal/interpret.ts:56-62`; `evaluate.ts:55-57`).
- **INFERENCE:** A deterministic core can surface uncertainty honestly only as
  "not established" (calibrated: false); no confidence value should be implied.
  **UNRESOLVED:** confidence calibration method (§17 UNRESOLVED).

### R5.8 — Quality evaluation without weights/thresholds

- **FACT:** Phase 4 uses multi-dimensional research-quality evaluation rather
  than a single scalar (`phase-04/ARCHITECTURE.md:206`, Q4.20).
- **OBSERVED:** Phase 5 scores a fixed 5-dimension set (correctness,
  completeness, provenance, confidenceUncertainty, reproducibility) in [0,1]
  from deterministic signals with per-dimension basis notes; weights/thresholds
  are NOT applied (§17 UNRESOLVED) (`phase-05/src/internal/evaluate.ts:33-77`;
  `phase-05/README.md:68-70`).
- **INFERENCE:** Multi-dimensional, per-dimension-scored evaluation with
  explicit basis notes is the pattern; combining dimensions into a single
  score requires §17 resolution. **UNRESOLVED:** coverage-threshold value,
  weights, thresholds (§17).

### R5.9 — Provider/model seam and Q4.22

- **FACT:** Phase 2 `DecisionProvider` is the only permitted model seam; Phase 4
  carries Q4.22 (provider/model binding) as deferred
  (`phase-02/SPECIFICATION.md:57-62`; `phase-04/ARCHITECTURE.md:207-208`,
  `:242`).
- **OBSERVED:** Phase 5 defines an `AnalyticsDecisionProvider` seam (source
  priority, finding-verification order, REPLANNING refinement) with a
  deterministic first-available stub; no model/provider is bound
  (`phase-05/src/internal/provider.ts:33-80`).
- **INFERENCE:** The seam-first, bind-later pattern (Phase 2/4 precedent) is
  appropriate; Q4.22 remains deferred and must NOT be resolved here.
  **UNRESOLVED:** whether the Phase 5 seam shape (three methods) is the right
  one — that is an Architecture-stage question.

### R5.10 — Deferred items and their handling

- **FACT:** §17 UNRESOLVED items: evaluation weights/thresholds; persistence;
  external-data policy; Phase 4 consumption; confidence calibration method;
  provenance granularity; reproducibility level; coverage-threshold value
  (`phase-05/README.md:134-139`).
- **FACT:** BLUEPRINT §22.1–§22.5 deferred (CLI; config schema; write/edit/
  delete + process execution + Git/network; model-provider binding; workspace/
  monorepo migration); Q4.22 provider/model binding deferred
  (`phase-05/README.md:140-144`).
- **INFERENCE:** None of these may be resolved in Research; Research records
  them as constraints for Architecture/Specification (which also must not
  resolve them without separate Owner authorization).

### R5.11 — Security/trust implications

- **FACT:** Phase 2 is deny-by-default read-only filesystem capability with
  path containment (`phase-01-foundation/SPECIFICATION.md:84-88`;
  `phase-02/SPECIFICATION.md:57-62`); Phase 3 prohibits write/execute/Git/
  network tooling (`phase-03/SPECIFICATION.md:105-130`); BLUEPRINT §17 lists
  permission boundaries, sandboxing, credential protection, untrusted input.
- **OBSERVED:** Phase 5 has no CLI, no config schema, no write/process/network
  tooling, no persistence, no provider SDK; `localFile` acquisition delegates
  to the Phase 3 read seam (`phase-05/src/internal/acquire.ts:74-83`).
- **INFERENCE:** The trust boundary is "Phase 5 consumes only inline content
  and read-only local files through a deny-by-default seam; no external input
  path exists by default." **UNRESOLVED:** whether path containment should be
  explicitly re-checked at the Phase 5 layer or delegated to the Phase 3 seam.

### R5.12 — Engineering trade-offs (deterministic model-free approach)

- **FACT:** The deterministic approach trades expressiveness/adaptivity for
  predictability, verifiability, and reproducibility (BLUEPRINT §7.7 Reliability
  Over Unnecessary Complexity).
- **OBSERVED:** The Phase 5 core is model-free, has no retry/correction loop,
  and cannot recover from plan shortfalls beyond reporting `PARTIAL`
  (`phase-05/src/internal/machine.ts:297-345`; `phase-05/README.md:97-99`).
- **INFERENCE:** For Architecture, this implies: (a) plan quality is the
  caller's responsibility (the core validates structure, not optimality);
  (b) quality signals are limited to structural/deterministic dimensions;
  (c) the provider seam is the future upgrade point for model-backed
  behavior. **UNRESOLVED:** whether any model-backed capability (e.g., plan
  refinement) is ever in scope — requires Owner authorization and §17/Q4.22
  resolution.

---

## 7. Fact vs. Precedent vs. Inference Classification

| Finding | Classification |
| --- | --- |
| R5.1 barrel-only consumption rule (Phase 1/2/3) | FACT |
| R5.1 Phase 4 barrel-only consumption | PRECEDENT |
| R5.2 nine-state deterministic machine (Phase 2) | FACT |
| R5.2 bounded-loop domain pattern | PRECEDENT |
| R5.2 Phase 5 lifecycle as observed | OBSERVED (implementation artifact, not acceptance) |
| R5.3 external/network acquisition out of scope | FACT (accepted DEFINE) |
| R5.3 localFile via Phase 3 seam | FACT (contract) + OBSERVED (implementation) |
| R5.4 determinism rule (Phase 2 §3.3) | FACT |
| R5.5 abstention ≠ failure | PRECEDENT (Phase 4) + OBSERVED (Phase 5) |
| R5.6 structural verification pattern | INFERENCE (derived from OBSERVED + PRECEDENT) |
| R5.7 calibrated: false uncertainty | OBSERVED |
| R5.8 multi-dim evaluation | PRECEDENT (Phase 4) + OBSERVED (Phase 5) |
| R5.9 seam-first bind-later | PRECEDENT (Phase 2/4) |
| R5.10 deferred items stay deferred | FACT |
| R5.11 deny-by-default read-only trust boundary | FACT (Phase 2) + INFERENCE (Phase 5 application) |
| R5.12 deterministic trade-off | INFERENCE + OBSERVED |

---

## 8. Engineering Trade-offs

1. **Determinism vs. adaptivity:** deterministic core is predictable,
   testable, reproducible, but cannot adapt plans or recover from shortfalls
   beyond `PARTIAL`. (INFERENCE)
2. **Simplicity vs. capability:** minimal operation set (count/sum/mean/min/
   max/describe + filter) is simple, verifiable, and sufficient for the DEFINE
   scope, but not general-purpose analytics. (OBSERVED + INFERENCE)
3. **Structural vs. semantic verification:** structural chain verification is
   cheap, deterministic, and free of LLM cost, but does not judge whether a
   finding is semantically correct. (INFERENCE)
4. **Barrel-only consumption:** preserves frozen-phase integrity at the cost of
   not reaching internal utilities. (FACT + PRECEDENT)
5. **No calibration:** honest but limits confidence-based decisions; any future
   calibration requires model involvement (deferred). (OBSERVED + INFERENCE)

---

## 9. Security / Trust Implications

- Trust boundary = inline content + read-only local files via a deny-by-default
  seam; no CLI, config schema, write/process/Git/network tooling, persistence,
  or provider SDK (FACT §R5.11).
- A missing local file is a non-recoverable acquisition failure, not a silent
  empty result (OBSERVED).
- No untrusted code execution; no credential handling beyond Phase 1's
  redaction primitives if a `Logger` is supplied (FACT).
- **UNRESOLVED:** explicit re-application of path containment at the Phase 5
  layer vs. reliance on the Phase 3 seam.

---

## 10. Determinism / Reproducibility Implications

- Determinism is achievable without a model or clock in control flow
  (FACT §R5.4).
- Reproducibility scoring = 1 on the deterministic path (OBSERVED).
- **Architecture implication:** the core must define the exact inputs to the
  deterministic function (request + provider decisions) so identical inputs
  yield identical results; provider must be documented as part of the
  determinism contract.
- **UNRESOLVED:** reproducibility level to claim; cross-version determinism.

---

## 11. Lifecycle / Bounded-Loop Implications

- A defined status set with explicit terminals (COMPLETED / PARTIAL /
  ABSTAINED / FAILED / CANCELLED) guarantees every run terminates (OBSERVED).
- The Phase 2/4 precedent confines any model decision to an injected seam and
  keeps the core loop deterministic (PRECEDENT).
- **Architecture implication:** the lifecycle must be finite and well-formed;
  `REPLANNING` may remain defined-but-unreachable or be reconsidered.
- **UNRESOLVED:** whether explicit resource bounds should be enforced (see
  §16 conflict re: `bounds`).

---

## 12. Verification / Evaluation Implications

- Verification is an independent structural pass; it never regenerates
  findings and never fabricates evidence (OBSERVED).
- Evaluation scores a fixed dimension set in [0,1] with basis notes; combining
  into one scalar requires §17 weights/thresholds (OBSERVED).
- **Architecture implication:** verification and evaluation must remain
  separable passes over the interpreted findings; evaluation must not feed back
  into verification (loop-closure question).
- **UNRESOLVED:** §17 weights/thresholds; coverage-threshold value;
  whether evaluation should influence the terminal state.

---

## 13. Provenance / Uncertainty / Abstention / Failure / Cancellation Implications

- Provenance chains ground every finding; unverified findings never appear in a
  COMPLETED result (OBSERVED).
- Uncertainty is honest-but-empty (calibrated: false); no confidence implied
  (OBSERVED).
- Abstention is distinct from failure; partial preserves produced+verified
  work; cancellation yields no report (OBSERVED).
- **Architecture implication:** these five outcomes must each be first-class in
  the result model; nothing may silently convert one into another.
- **UNRESOLVED:** §9 "contradictory / below-reliability-threshold" abstention
  criteria; provenance granularity.

---

## 14. Frozen-Contract Consumption Implications

- Barrel-only, file: deps, no deep imports, no new runtime dependency beyond
  frozen packages + Node stdlib (FACT; accepted DEFINE §11).
- Phase 4 not consumed by default; Phase 4 CLOSED/FROZEN (FACT).
- **Architecture implication:** every Phase 5 consumption point must map to a
  frozen public symbol; no Phase 1/2/3 modification; TS2307 (Phase 1 manifest
  defect) remains unresolved and must NOT be worked around (FACT).

---

## 15. Deferred-Item Handling

All §17 UNRESOLVED items, §22.1–§22.5, and Q4.22 remain deferred and outside
Research/Architecture/Specification authority. They are recorded, not resolved.
(FACT)

---

## 16. Unresolved Questions

| ID | Unresolved question | Owner of resolution |
| --- | --- | --- |
| U1 | Should the Phase 5 core enforce `bounds` (currently accepted-but-unconsumed)? | Architecture / Specification |
| U2 | Should `REPLANNING` exist if the deterministic core never enters it? | Architecture |
| U3 | Is the 3-method `AnalyticsDecisionProvider` seam the right shape? | Architecture |
| U4 | Provenance granularity level | §17 UNRESOLVED |
| U5 | Confidence calibration method | §17 UNRESOLVED |
| U6 | Reproducibility level to claim | §17 UNRESOLVED |
| U7 | Evaluation weights/thresholds | §17 UNRESOLVED |
| U8 | Coverage-threshold value | §17 UNRESOLVED |
| U9 | External-data policy (any future acquisition beyond inline/localFile) | Owner / §17 |
| U10 | Whether Phase 4 surface is ever consumed | Owner / §17 |
| U11 | Persistence requirement | §17 UNRESOLVED |
| U12 | Path-containment re-check at Phase 5 layer vs. delegation to seam | Architecture |
| U13 | Cross-version / cross-environment determinism guarantee | §17 UNRESOLVED |
| U14 | Whether PARTIAL requires an explicit reason field | Architecture / Specification |

---

## 17. Architecture Implications (informational only — NOT decisions)

1. Adopt barrel-only consumption of Phase 1/2/3 with a documented symbol map.
2. Confine any model involvement to a provider seam; keep the core loop
   deterministic.
3. Define acquisition boundary as inline | localFile only, read-only,
   deny-by-default, via the Phase 3 seam.
4. Define the deterministic contract (request + provider decisions → identical
   result).
5. Model the five outcomes (COMPLETED / PARTIAL / ABSTAINED / FAILED /
   CANCELLED) as first-class.
6. Keep verification and evaluation as separate passes.
7. Keep §17 / §22.x / Q4.22 deferred.

These are research-informed candidate directions for Architecture to consider
and decide within its own authority; none is decided here.

---

## 18. Specification Implications (informational only — Specification NOT written)

- Public contract shape (runAnalyticsTask + 13 types) is bounded by the
  accepted DEFINE.
- Any Specification decision on U1–U14 must not silently resolve §17 items.
- Specification must not introduce CLI, config schema, persistence, write/
  execute/network tooling, provider binding, or Phase 4 consumption.
- Specification acceptance criteria must be measurable and consistent with the
  deterministic core's capabilities (no model-backed quality claims).

---

## 19. Research-to-DEFINE Traceability

| DEFINE element | Research finding |
| --- | --- |
| Scope (acquisition→report pipeline) | R5.1, R5.3, R5.6 |
| Lifecycle / outcomes | R5.2, R5.5 |
| Determinism | R5.4 |
| Uncertainty | R5.7 |
| Evaluation | R5.8 |
| Provider seam / Q4.22 | R5.9 |
| Deferred items | R5.10 |
| Security boundary | R5.11 |
| Trade-offs | R5.12 |
| Frozen-contract dependencies | R5.1, R5.14 |

---

## 20. Research Completion Assessment

- **Questions addressed:** all 12 research questions (R5.1–R5.12) addressed
  with traceable evidence.
- **Evidence traceable:** every finding cites source artifact/location.
- **FACT / PRECEDENT / INFERENCE distinguished:** yes (§7).
- **Prohibited decisions made:** NONE. No Architecture decision, public API,
  schema, algorithm, technology, provider binding, or acceptance criterion was
  decided; all candidate directions are recorded as implications/unresolved.
- **Deferred items:** remain deferred.
- **Frozen boundaries:** untouched (Phase 1/2/3/4, BLUEPRINT, Phase 5
  src/tests/config/package.json).
- **Durable RESEARCH.md:** exists (this file).
- **Conflicts preserved:** README "TEST = PASS" claim conflicts with the
  currently failing `npm run check` (TS2307); recorded, not resolved (§16
  conflict note; see §16 U-list). README's governed-stage citations remain
  conversation records, not durable acceptance.

---

## End-of-Document Block

```
PHASE 5 RESEARCH RECORD: CREATED (draft)
PHASE 5 RESEARCH STAGE: PENDING OWNER ACCEPTANCE
HISTORICAL RESEARCH RECOVERED: NO (NOT RECOVERABLE; not reconstructed)
ARCHITECTURE AUTHORIZED: NO
SPECIFICATION AUTHORIZED: NO
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 5 src/tests/package.json/tsconfig/dependencies MODIFIED: NO
PHASE 6 WORK STARTED: NO
TS2307 FIX / PATHS WORKAROUND: NO
COMMIT/PUSH: NO
```