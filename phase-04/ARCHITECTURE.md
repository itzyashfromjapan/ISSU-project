# ISSU — Phase 4: Research Agent Module — Architecture

**Phase:** 4 — Research Agent Module
**Stage:** ARCHITECTURE (owner-authorized 2026-08-14; `phase-03/TASKS.md:749-762`)
**Status:** Draft — awaiting Architecture-stage acceptance
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative inputs:** Completed Phase 4 Research Q1–Q7 (audited PASS, 2026-08-14); frozen Phase 1, Phase 2, Phase 3 contracts; Phase 4 architect-stage definition
**License:** Apache License 2.0

---

## 1. Purpose & Position

This document records the **architecture** of the Phase 4 Research Agent Module.
It follows the BLUEPRINT §11 lifecycle position: after **Research** (Q1–Q7
completed) and before **Specify**.

- The domain is **Research Agent Module** (owner-approved; `phase-03/TASKS.md`
  Domain Decision Record, 2026-08-12).
- Research Q1–Q7 are the primary research input (audited PASS).
- This document determines **what the module is**, **what it consumes**, **how it
  is decomposed**, and **which decisions remain open** for Specification and
  Owner approval.
- It does **not** finalize the public API, exact schemas, thresholds, scoring
  formulas, implementation technology, or model/provider choices. Those are
  **SPECIFICATION INPUT / UNRESOLVED** (Specification firewall).

---

## 2. How to Read This Document

Every decision in this document is labeled with one of:

| Label                     | Meaning                                                                           |
| ------------------------- | --------------------------------------------------------------------------------- |
| **FACT**                  | Verified repository/contract fact (frozen Phase 1/2/3, TASKS records, BLUEPRINT). |
| **INFERENCE**             | Reasoned conclusion from facts; not directly stated anywhere.                     |
| **RESEARCH EVIDENCE**     | External evidence from completed Research Q1–Q7.                                  |
| **ARCHITECTURE DECISION** | A decision this Architecture stage makes within its authority.                    |
| **UNRESOLVED**            | Not decidable here; requires Specification and/or Owner approval.                 |

Each architecture question (Q4.1–Q4.26) records: **problem**, **research
evidence**, **alternatives** (≥2 where meaningful), **chosen approach**,
**rationale**, **consequences**, **rejected alternatives**, and **unresolved
implications**.

**Specification firewall:** exact public API, exports, data schemas, test/
acceptance/benchmark thresholds, pass/fail formulas, scoring formulas,
implementation dependencies, and implementation technology are **not finalized
here**. They are recorded as **SPECIFICATION INPUT / UNRESOLVED**.

---

## 3. Consumed Contracts (frozen)

**[FACT]** Phase 4 consumes the following frozen public surfaces, **barrel-only**
(no deep imports), consistent with the Phase 3 precedent and the 14 P4-1
contract assertions (Phase 3 `ARCHITECTURE.md` §31).

### 3.1 Phase 1 — `@issue/foundation` (frozen)

**[FACT]** Public barrel (`phase-01-foundation/src/index.ts`): `VERSION`,
`AppError`/`AppErrorJson`/`AppErrorParams`, `isAppError`/`toError`,
`Result`/`ok`/`err`/`isOk`/`isErr`/`match`, `LogLevel`,
`IssueConfig`/`LoadConfigOptions`/`loadConfig`/`mergeConfigLayers`,
`EnvSource`/`EnvSnapshot`/`readEnv`/`getSecret`/`redactionList`,
`Logger`/`LoggerOptions`/`createLogger`, `assertContained`/`isContained`,
`runCli`.

### 3.2 Phase 2 — `@issue/tool-runtime` (frozen)

**[FACT]** Public barrel (`phase-02/src/index.ts`): `TaskStatus` (9-state),
`ToolOperation` (`"readFile"` | `"listDirectory"`), `ActionRef`, `ReadOptions`,
`ListOptions`, `OutcomeClass`, `CorrectionDirection`, `FileContent`,
`DirectoryEntry`, `DirectoryListing`, `ToolResult`, `TaskRefs`,
`ResourceBounds`, `TaskOptions`, `TaskState`, `AvailableAction`,
`DecisionProvider`, `Assessment`, `TaskResult`, `ToolRuntime`;
functions `runTask`, `createToolRuntime`, `deriveAvailableActions`.

### 3.3 Phase 3 — `@issue/integration` (frozen, CLOSED)

**[FACT]** Public barrel (`phase-03/src/index.ts`): `DEFAULT_BOUNDS`,
`runIntegrationTask`, `HarnessRecord`, `IntegrationTaskRequest`,
`IntegrationTaskResult`, `createDeterministicProviderStub`,
`DeterministicProviderStubConfig`, `DeterministicStubTable`,
`isFailedToolResult`, `translateToolError`, `FailedToolResult`,
`ToolErrorDetails`.

---

## 4. Frozen Contract Integration

**[FACT / INFERENCE]** This section records what Phase 3 provides, what Phase 4
consumes, what it cannot obtain, what must remain isolated, and whether any
capability requires modifying Phase 3.

### 4.1 What Phase 3 provides to Phase 4

**[FACT]** Phase 3 provides a **deterministic integration seam**: bounded,
deterministic task execution of filesystem read/list tasks against an
authorized root, through `runIntegrationTask` + `createDeterministicProviderStub`

- `DEFAULT_BOUNDS`, with Phase 1 `Result`/`AppError`-compatible error
  representation (`translateToolError`, `isFailedToolResult`) and AD-1 structural
  translation (Phase 3 `ARCHITECTURE.md` §28–§34).

### 4.2 What Phase 4 consumes

**[INFERENCE]** Phase 4 consumes Phase 1 primitives (logging, Result/AppError
error discipline, config, path containment) and Phase 3's deterministic
integration seam where relevant to research-task execution. Phase 4's
research-specific capabilities (retrieval, credibility, claim/evidence,
citation, synthesis, evaluation) are **new Phase 4 components** and consume the
frozen barrels through public surfaces only.

### 4.3 What Phase 4 cannot obtain from Phase 3

**[FACT]** Phase 3 explicitly prohibits (Phase 3 `SPECIFICATION.md` §5): CLI,
config-file schema, write/edit/delete/fs mutation, process execution, Git,
network/web access, model-provider binding, memory/cross-run persistence,
multi-agent, planning engine, plugin framework, code generation, benchmarking,
publishing. These are **Phase 3 facts**, not Phase 4 prohibitions (Research Q4,
Q5, Q6, Q7 compatibility analysis; ROOT methodology rule #3).

### 4.4 What must remain isolated

**[NORMATIVE]** Phase 4 **SHALL NOT modify** any frozen Phase 1, Phase 2, or
Phase 3 artifact, nor the BLUEPRINT. Phase 3 remains CLOSED and FROZEN
(`phase-03/TASKS.md` Phase 4 records). Phase 4 SHALL consume frozen contracts
through public barrels only.

### 4.5 Does any capability require modifying Phase 3?

**[ARCHITECTURE DECISION]** **No.** Every candidate Phase 4 capability identified
by Research Q1–Q7 (web retrieval, source credibility, claim-to-evidence
attribution, citation/traceability, contradiction/gap detection, synthesis,
hallucination mitigation, multi-dimensional evaluation, human review) is
implementable as a **separate Phase 4 component** without modifying Phase 3.
Research classified all such candidates **C** (potentially implementable without
modifying Phase 3). Where a capability would _require_ Phase 3 modification
(e.g., a capability inside Phase 3's deterministic seams), Phase 4 SHALL **not**
modify Phase 3; it SHALL record the incompatibility, why it exists, the candidate
Phase 4 alternative, and the unresolved status.

**[UNRESOLVED]** None currently identified. If Specification discovers one, it
must be recorded in §20 (Unresolved Questions Register) before any resolution.

---

## 5. Module Boundary

**[ARCHITECTURE DECISION]** Phase 4 — Research Agent Module is the module that
performs **research tasks**: planning and query refinement, external evidence
retrieval, source evaluation, evidence-grounded synthesis, citational
traceability, contradiction/gap handling, reliability mechanisms, and
multi-dimensional quality evaluation — within ISSU's governed boundaries.

- Folder `phase-04/`, name "Research Agent Module"; package name follows the
  `@issue/<phase-name>` convention (`@issue/research` candidate; confirmed at
  Specification). Consistent with Phase 3 `DECISIONS.md` D3.1 precedent.

**[UNRESOLVED]** Exact package name, exports, and public surface are
Specification decisions.

---

## 6. Non-Goals

**[NON-GOAL]** Phase 4 does **not** include, in this stage:

- CLI / end-user entry point (§22.1) — deferred, requires separate authorization.
- Write/edit/delete filesystem mutation, process execution, Git (§22.3) — Phase 3
  fact; Phase 4 research work is read-oriented evidence retrieval and analysis,
  not filesystem mutation.
- Memory subsystem / cross-run persistence — Phase 2 §19.2 fact; retained as
  deferred unless separately authorized.
- Multi-agent systems / agent roles (§19.10) — retained as deferred.
- Generalized planning engine as a first-class subsystem (§19.9) — research
  planning is bounded to the research-task lifecycle, not a general engine.
- Plugin framework / dynamic module loading (§19.8) — deferred.
- Code generation / modification (§19.7) — deferred.
- Performance benchmarking infrastructure (§19.15) — deferred.
- Publishing / distribution (§19.12) — not authorized.

**[UNRESOLVED]** Whether any of the above becomes a Phase 4 capability requires
explicit Owner authorization and a DECISIONS entry.

---

## 7. Component Architecture

**[ARCHITECTURE DECISION]** Phase 4 is decomposed into the following logical
components. This is a **structural decomposition**; exact module layout,
packaging, and file organization are SPECIFICATION INPUT.

| Component                          | Responsibility                                                                                                         | Key inputs                                    | Key outputs                                          | Frozen-contract consumption                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| **Research Task Orchestrator**     | Drives the research-task lifecycle (§9); coordinates retrieval, evaluation, synthesis, verification                    | research request, task plan                   | research outcome, task records                       | Phase 1 `Logger`, `Result`/`AppError`                                     |
| **Retrieval & Evidence Access**    | External evidence retrieval and source access (Q4.7, Q4.8)                                                             | queries, source selectors                     | retrieved source set, evidence locations             | Phase 1 primitives (boundaries); no Phase 3 network capability exists     |
| **Source Evaluation**              | Multidimensional credibility assessment (Q4.9)                                                                         | retrieved sources, metadata                   | credibility profile per source, quality signals      | Phase 1 primitives                                                        |
| **Claim & Evidence Model**         | Atomic claim representation and claim-to-evidence mapping (Q4.10, Q4.11)                                               | research outputs, sources                     | claims, evidence links, support classification       | Phase 1 `Result`/`AppError`; Phase 2 `ToolResult`/`OutcomeClass` patterns |
| **Citation & Traceability**        | Inline citation markers, source references, traceability (Q4.12)                                                       | claims, evidence links                        | citation markers, source reference records           | —                                                                         |
| **Contradiction & Gap Detection**  | Cross-document conflict detection, gap/weak-signal identification (Q4.13, Q4.14)                                       | claims, evidence links                        | conflict/gap records                                 | —                                                                         |
| **Synthesis**                      | Evidence-grounded synthesis and report composition (Q4.15)                                                             | claims, evidence, credibility profiles        | synthesized report text                              | —                                                                         |
| **Reliability & Verification**     | Layered hallucination prevention: grounding, faithfulness, citation verification, confidence, abstention (Q4.16–Q4.19) | claims, evidence, sources                     | verification results, confidence, abstention signals | —                                                                         |
| **Quality Evaluation**             | Multi-dimensional research-quality evaluation (Q4.20)                                                                  | research outcome, claims, evidence, citations | evaluation record per dimension                      | —                                                                         |
| **Human Review & Escalation**      | Human-in-the-loop escalation and review workflow (Q4.21)                                                               | evaluation records, confidence signals        | review decisions                                     | —                                                                         |
| **Decision Provider / Model Seam** | Model/provider integration seam behind the `DecisionProvider` contract (Q4.22)                                         | decisions requested by orchestrator           | decisions                                            | Phase 2 `DecisionProvider`; Phase 3 stub pattern                          |

**[RESEARCH EVIDENCE]** This decomposition derives from Research Q1 (research
tasks: planning, retrieval, source evaluation, synthesis, contradiction/gap
detection, citational generation, report composition), Q4 (candidate scope
boundaries), Q5 (citation/sourcing), Q6 (hallucination prevention layers), and
Q7 (multi-dimensional success evaluation).

**[INFERENCE]** The components are **logical**, not mandated as separate files or
packages. The exact module layout is a Specification decision.

---

## 8. Design Principles

**[ARCHITECTURE DECISION]** Phase 4 architecture follows these principles:

1. **Barrel-only consumption** — frozen contracts through public barrels only
   (AD-4.1).
2. **Frozen-phase integrity** — never modify a frozen phase; record
   incompatibilities instead (AD-4.2).
3. **Layered reliability** — multiple complementary mechanisms, not a single
   mitigation (AD-4.3; Q6).
4. **Multidimensional assessment** — credibility and quality are evaluated across
   dimensions, not single scores (AD-4.4, AD-4.6; Q2, Q7).
5. **Traceability** — claims map to specific evidence locations; citations are
   verifiable (AD-4.5; Q5, Q7).
6. **Confidence-aware honesty** — represent uncertainty and abstain when evidence
   is insufficient (Q4.18, Q4.19; Q6, Q7).
7. **Security by design** — retrieved content is untrusted input; explicit threat
   model (Q4.24; Q6 §3.13).
8. **Deterministic seams preserved** — where frozen deterministic behavior
   applies, it is used; reproducibility is a design target (Q4.23; Q7).
9. **Deferred items stay deferred** — §22.1–§22.5 unchanged (D3.2); resolution
   requires Owner authorization (Q4.26).

---

## 9. Research Task Lifecycle

**[ARCHITECTURE DECISION]** The module drives a research task through a lifecycle
that mirrors the external-evidence research process (OpenAI Academy Q1; Deep
Research Q1): **plan → retrieve → evaluate sources → refine → synthesize →
verify → evaluate → (escalate/abstain) → report**.

- The lifecycle is **bounded** to the research task; it is not a generalized
  planning engine (Phase 2 §19.9 fact; §6 non-goal).
- Terminal outcomes include: **completed report with verified claims**,
  **partial result with abstention/unresolved items**, or **failed/aborted**
  task. Exact outcome set and statuses are SPECIFICATION INPUT.

**[UNRESOLVED]** Whether the orchestrator reuses the frozen Phase 2 nine-state
`TaskStatus` machine or defines a research-specific state model is a
Specification decision. Phase 4 SHALL NOT extend or modify the frozen Phase 2
state machine; any research-specific status model is a Phase 4 type, not a Phase 2
modification.

---

## 10. Architecture Questions — Module Identity & Contract Consumption (Q4.1–Q4.5)

### Q4.1 — Module identity and naming

- **Problem:** What is the Phase 4 module called and located?
- **Classification:** FACT (domain) / ARCHITECTURE DECISION (naming) /
  UNRESOLVED (package name)
- **Research evidence:** N/A (domain decision from Owner).
- **Alternatives:** (a) `phase-04/` folder + package `@issue/research`;
  (b) `phase-04/` folder + capability name `@issue/research-agent`;
  (c) no separate module (rejected: owner approved a Research Agent Module).
- **Chosen approach:** (a) folder `phase-04/`, name "Research Agent Module";
  package name follows `@issue/<phase-name>` convention (`@issue/research`
  candidate).
- **Rationale:** Consistent with Phase 1 `@issue/foundation`, Phase 2
  `@issue/tool-runtime`, Phase 3 `@issue/integration` (Phase 3 DECISIONS D3.1).
- **Consequences:** Folder and naming fixed at the phase level; change requires a
  DECISIONS entry.
- **Rejected alternatives:** (b) name collides with capability focus; (c)
  contradicts the Owner-approved domain.
- **Unresolved implications:** Exact package name confirmed at Specification.

### Q4.2 — What Phase 4 consumes from frozen contracts

- **Problem:** How does Phase 4 use Phase 1/2/3?
- **Classification:** FACT (barrels) / ARCHITECTURE DECISION (barrel-only)
- **Research evidence:** Research Q5/Q6/Q7: Phase 3 barrel-only consumption is a
  FACT; inference that Phase 4 may reasonably consume frozen contracts through
  public surfaces; UNRESOLVED whether mandatory. This Architecture stage resolves
  it.
- **Alternatives:** (a) barrel-only public consumption; (b) deep imports of
  internal modules; (c) copy/reimplement frozen behavior.
- **Chosen approach:** (a) barrel-only consumption of Phase 1, Phase 2, and
  Phase 3 through their public package barrels. Zero deep imports.
- **Rationale:** Matches the frozen Phase 3 precedent (Phase 3 `ARCHITECTURE.md`
  §27, §31) and the P4-1 contract assertions; preserves phase isolation and
  contract stability.
- **Consequences:** Internal Phase 2/3 modules are inaccessible; any needed
  behavior must come through public functions.
- **Rejected alternatives:** (b) violates the frozen consumption rule; (c)
  duplicates and risks drift from frozen behavior.
- **Unresolved implications:** None.

### Q4.3 — What Phase 4 cannot obtain from frozen contracts

- **Problem:** Which capabilities must Phase 4 build itself?
- **Classification:** FACT / INFERENCE
- **Research evidence:** Q4: web search, model binding, CLI are absent from
  Phase 3; Phase 3 prohibitions are Phase 3 facts, not Phase 4 prohibitions.
- **Alternatives:** N/A (established fact; no meaningful alternatives).
- **Chosen approach:** Phase 4 must design from scratch: web/network retrieval,
  source credibility, claim/evidence, citation, synthesis, contradiction/gap,
  reliability, and evaluation. Phase 4 SHALL NOT rely on any Phase 3 capability
  that does not exist.
- **Rationale:** Phase 3's frozen scope is integration between Phase 1/2, not
  research capabilities (Q4, Q5, Q6, Q7 compatibility matrices; none classified
  A).
- **Consequences:** All research-specific capabilities are new Phase 4 work.
- **Rejected alternatives:** None.
- **Unresolved implications:** None.

### Q4.4 — Phase 3 isolation

- **Problem:** Must any Phase 4 capability modify Phase 3?
- **Classification:** ARCHITECTURE DECISION (no) / UNRESOLVED (future)
- **Research evidence:** Q4/Q5/Q6/Q7: all research candidates classified C —
  implementable as separate Phase 4 modules without modifying Phase 3.
- **Alternatives:** (a) build all research capabilities in Phase 4, never modify
  Phase 3; (b) extend Phase 3.
- **Chosen approach:** (a). Phase 3 remains CLOSED and FROZEN.
- **Rationale:** Frozen-phase integrity; Research classification; governance
  records (`phase-03/TASKS.md` Phase 4 records).
- **Consequences:** Any perceived need to modify Phase 3 becomes an
  incompatibility record (§4.5) with a Phase 4 alternative, never a modification.
- **Rejected alternatives:** (b) violates the freeze.
- **Unresolved implications:** If Specification finds a genuine requirement to
  modify Phase 3, it SHALL be recorded as an incompatibility (§4.5, §20) and
  escalated to Owner; no modification occurs.

### Q4.5 — Research-task execution via the Phase 3 deterministic seam

- **Problem:** Does the module use Phase 3's `runIntegrationTask`/
  `createDeterministicProviderStub`/`DEFAULT_BOUNDS`?
- **Classification:** FACT (seam exists) / INFERENCE (relevance) / UNRESOLVED
  (exact use)
- **Research evidence:** Q4: Phase 3 provides deterministic integration seam;
  P4-1 contract assertions bound Phase 4 integration.
- **Alternatives:** (a) use Phase 3 deterministic seam for in-scope read/list
  task execution; (b) bypass Phase 3 and call Phase 2 `runTask` directly; (c) no
  deterministic task execution in Phase 4.
- **Chosen approach:** Where the module performs bounded filesystem read/list
  task execution, it SHALL prefer the Phase 3 public seam (barrel-only). Direct
  Phase 2 consumption remains available through the public barrel if the Phase 3
  seam does not cover a required flow; both are allowed as long as barrel-only.
- **Rationale:** Reuse of the frozen integration layer; avoids reimplementation;
  preserves deterministic semantics (Phase 3 §29–§31).
- **Consequences:** Phase 4 depends on Phase 3's public barrel for these flows.
- **Rejected alternatives:** (b) unnecessary when Phase 3 covers it; (c) loses
  deterministic guarantees.
- **Unresolved implications:** Exact invocation flow is SPECIFICATION INPUT.

---

## 11. Architecture Questions — Research Capabilities (Q4.6–Q4.15)

### Q4.6 — Research task lifecycle and orchestration

- **Problem:** What lifecycle does the orchestrator drive?
- **Classification:** ARCHITECTURE DECISION (lifecycle) / UNRESOLVED (state
  model)
- **Research evidence:** Q1: multi-step planning, searching, evaluating,
  refining, synthesis (OpenAI FAQ/Academy); Q7: trajectory vs outcome metrics,
  process awareness (Galileo, MiroEval).
- **Alternatives:** (a) linear pipeline plan→retrieve→evaluate→synthesize→
  verify→evaluate→report; (b) cyclical loop with query refinement and
  re-planning; (c) no explicit lifecycle.
- **Chosen approach:** (b) cyclic loop with explicit refinement stages, bounded
  by the task plan and by resource/safety bounds.
- **Rationale:** External evidence (Q1 Sources 1–2) describes research as a
  cyclical process; query refinement and gap detection are core (Q4).
- **Consequences:** Orchestrator must support re-planning and refinement; bounded
  by explicit resource bounds.
- **Rejected alternatives:** (a) insufficient for refinement; (c) no evidence
  base.
- **Unresolved implications:** Exact status model, bounds, and stopping criteria
  are SPECIFICATION INPUT (thresholds are Specification firewall).

### Q4.7 — Retrieval and external evidence access

- **Problem:** How does the module access external evidence?
- **Classification:** ARCHITECTURE DECISION (capability exists) / UNRESOLVED
  (mechanism, provider, API)
- **Research evidence:** Q1: web search/source retrieval is core to deep
  research; Q4: web retrieval is a CANDIDATE capability; risks include
  hallucinations, prompt injection, privacy, bias (Source 3); Q6: evidence
  poisoning and semantic DDoS threat vectors.
- **Alternatives:** (a) external web retrieval with explicit source selection and
  filtering; (b) retrieval limited to a curated/authorized corpus; (c) no
  external retrieval.
- **Chosen approach:** (a) external retrieval is in scope, with explicit source
  selection, filtering, and threat-model treatment. Exact provider, API, and
  query protocol are UNRESOLVED / SPECIFICATION INPUT.
- **Rationale:** External evidence strongly supports retrieval as core research
  capability (Q1 Sources 1, 4, 5); Phase 3 network prohibition is not a Phase 4
  prohibition (Q4).
- **Consequences:** Phase 4 introduces network/retrieval capability; requires
  security, privacy, and safety treatment (Q4 Source 3).
- **Rejected alternatives:** (b) insufficient for open research tasks (Q6
  multi-source evidence, 62.3% cross-file); (c) contradicts research-domain
  purpose.
- **Unresolved implications:** Web search provider(s), API, scope of retrievable
  sources, rate limits, retention — Owner/Architecture/Specification decisions.

### Q4.8 — Source selection and filtering

- **Problem:** How are sources selected and filtered for retrieval?
- **Classification:** ARCHITECTURE DECISION (selection is a component) /
  UNRESOLVED (exact policy)
- **Research evidence:** Q1: source selection and traceability are explicit
  parts of deep research; Q4: source selection questions raised; Q5:
  primary/secondary source distinction; Q6: source quality and relevance.
- **Alternatives:** (a) explicit selection/filtering stage with metadata;
  (b) implicit selection; (c) no filtering.
- **Chosen approach:** (a) explicit source-selection/filtering component.
- **Rationale:** Provenance and traceability require explicit selection
  (Q1 Source 1; Q2 Source 8; Q5).
- **Consequences:** Selection policy and filters are Specification decisions.
- **Rejected alternatives:** (b)/(c) undermine traceability.
- **Unresolved implications:** Selection criteria, filters, and primary/secondary
  weighting are UNRESOLVED.

### Q4.9 — Source credibility model

- **Problem:** What credibility model is used for source evaluation?
- **Classification:** ARCHITECTURE DECISION (multidimensional) / UNRESOLVED
  (weights, dimensions, thresholds)
- **Research evidence:** Q2: web credibility is multidimensional (Metzger —
  Source 10); expertise and trustworthiness are key dimensions (Source 11);
  no single reputation score.
- **Alternatives:** (a) multidimensional credibility assessment (expertise,
  trustworthiness, bias, transparency, date, provenance); (b) single reputation
  score; (c) no credibility model.
- **Chosen approach:** (a) multidimensional credibility model; the exact
  dimensions, weighting, and thresholds are Specification decisions.
- **Rationale:** External evidence explicitly rejects unitary scores (Q2
  Sources 10–11).
- **Consequences:** Credibility profiles are first-class Phase 4 records; feed
  synthesis and evaluation.
- **Rejected alternatives:** (b) contradicts external evidence; (c) undermines
  reliability.
- **Unresolved implications:** Exact dimension set, weighting scheme, threshold
  values, and any composite scoring are UNRESOLVED / SPECIFICATION INPUT.

### Q4.10 — Claim representation

- **Problem:** How are claims represented?
- **Classification:** ARCHITECTURE DECISION (atomic claims) / UNRESOLVED (schema)
- **Research evidence:** Q5: claim decomposition (PaperTrail, CAMS, SemanticCite);
  atomic-fact decomposition (Q7: FACTScore, LongDocFACTScore); Q7: 4-class
  support classification.
- **Alternatives:** (a) atomic-claim decomposition with evidence mapping and
  support classification; (b) whole-passage claims; (c) no claim model.
- **Chosen approach:** (a) claims are decomposed into atomic units, each mapped
  to evidence with a support classification.
- **Rationale:** External evidence (Q5, Q7) consistently supports atomic claim
  decomposition and nuanced classification over binary/coarse approaches.
- **Consequences:** Claim/evidence records are a core Phase 4 data structure;
  exact schema is SPECIFICATION INPUT.
- **Rejected alternatives:** (b) too coarse for verification; (c) no reliability
  basis.
- **Unresolved implications:** Claim granularity (sentence/passage), coverage
  metric, and exact record schema are UNRESOLVED.

### Q4.11 — Evidence mapping / attribution granularity

- **Problem:** At what granularity are claims linked to evidence?
- **Classification:** ARCHITECTURE DECISION (claim-level traceability) /
  UNRESOLVED (granularity balance)
- **Research evidence:** Q5: document-level citations may be insufficient;
  stronger attribution connects statements to evidence locations (VISA Source 8);
  inline markers; claim-level traceability recommended; Q6: span-level detection.
- **Alternatives:** (a) claim/passage-level attribution to specific evidence
  locations; (b) document-level attribution only; (c) no attribution.
- **Chosen approach:** (a) claim-level traceability with evidence-location
  pointers is the architectural target; the exact granularity balance is
  UNRESOLVED (Q5 trade-off 1).
- **Rationale:** External evidence (Q2 Source 8, Q5) shows document-level
  attribution is insufficient for precise verification.
- **Consequences:** Traceability infrastructure is required (Q7 architecture
  input: "evaluation requires traceability infrastructure").
- **Rejected alternatives:** (b) insufficient (VISA); (c) no verification basis.
- **Unresolved implications:** Optimal granularity balance is an unresolved
  trade-off (Q5 §8.1).

### Q4.12 — Citation architecture

- **Problem:** How are citations generated and represented?
- **Classification:** ARCHITECTURE DECISION (citation capability, marker
  pattern) / UNRESOLVED (schema, style, classification scheme)
- **Research evidence:** Q5: inline numbered markers are a candidate pattern;
  4-class support classification (Supported/Partially Supported/Unsupported/
  Uncertain) captures nuance binary misses; binary classification rejected;
  citation error rates 10–25%; retracted papers continue to be cited.
- **Alternatives:** (a) inline citation markers with a nuanced support
  classification and source-reference records; (b) document-level bibliographic
  citations only; (c) no citation system.
- **Chosen approach:** (a) citations are traceable inline markers backed by
  source-reference records, with a non-binary support classification.
- **Rationale:** External evidence (Q5) rejects binary classification and
  citation-only guarantees; traceability is core.
- **Consequences:** Citation verification (Q4.17) is required; citation schema,
  marker style, and classification labels are SPECIFICATION INPUT.
- **Rejected alternatives:** (b) insufficient; (c) contradicts research purpose.
- **Unresolved implications:** Exact marker style, schema, classification depth
  (4-class vs other), and citation-density thresholds are UNRESOLVED.

### Q4.13 — Contradiction detection

- **Problem:** How are contradictory sources handled?
- **Classification:** ARCHITECTURE DECISION (surface conflicts) / UNRESOLVED
  (representation)
- **Research evidence:** Q5: CAMS cross-document claim clustering with conflict
  detection; Q6: contradictions vs unsupported claims distinction (Datadog);
  multi-source attribution; Q7: contradiction handling dimension.
- **Alternatives:** (a) explicit conflict detection and surfacing, distinguishing
  contradictions from unsupported claims; (b) flatten/silently deduplicate;
  (c) no detection.
- **Chosen approach:** (a) explicit contradiction detection and surfacing; how
  conflicts are represented/weighted is UNRESOLVED.
- **Rationale:** External evidence (Q5, Q6, Q7) documents the failure mode of
  silently flattening contradictory evidence; CAMS and LLM-as-judge distinguish
  contradictions from unsupported claims.
- **Consequences:** Conflict records feed evaluation and reliability.
- **Rejected alternatives:** (b) is a documented failure mode (Q6 failure 6);
  (c) no basis.
- **Unresolved implications:** Representation, weighting, and balance policy for
  conflicts are UNRESOLVED.

### Q4.14 — Gap / weak-signal detection

- **Problem:** Is gap/weak-signal detection part of the module?
- **Classification:** ARCHITECTURE DECISION (candidate capability) / UNRESOLVED
  (mechanism)
- **Research evidence:** Q1: research can identify gaps, contradictions, weak
  signals (OpenAI Academy); Q7: research recall/completeness dimension.
- **Alternatives:** (a) include gap/weak-signal identification as a component;
  (b) exclude; (c) defer.
- **Chosen approach:** (a) include as a candidate component; mechanism and
  stopping criteria are UNRESOLVED.
- **Rationale:** External evidence (Q1 Source 2) places gap identification in the
  research process; Q7 premature-stopping/under-retrieval failure mode.
- **Consequences:** Adds to orchestrator refinement loop.
- **Rejected alternatives:** (b) reduces completeness; (c) acceptable but loses
  refinement capability.
- **Unresolved implications:** Stopping criteria, recall/precision balance, and
  thresholds are UNRESOLVED / Specification firewall.

### Q4.15 — Synthesis

- **Problem:** How is information synthesized?
- **Classification:** ARCHITECTURE DECISION (evidence-grounded synthesis) /
  UNRESOLVED (technique)
- **Research evidence:** Q1: evidence-grounded synthesis is core (DeepResearch
  Bench, FINDER); Q5: quote-then-answer grounding reduces hallucination; Q6:
  two-pass grounding technique.
- **Alternatives:** (a) evidence-grounded synthesis with quote-then-answer
  grounding and citation commitment before generation; (b) direct generation;
  (c) no synthesis (concatenation).
- **Chosen approach:** (a) evidence-grounded synthesis; quote-then-answer is a
  candidate technique.
- **Rationale:** External evidence (Q5, Q6) supports grounding synthesis in
  retrieved evidence to reduce hallucination.
- **Consequences:** Synthesis depends on claim/evidence records.
- **Rejected alternatives:** (b) increases hallucination risk; (c) not research
  synthesis.
- **Unresolved implications:** Exact synthesis technique, template, and output
  format are SPECIFICATION INPUT.

---

## 12. Architecture Questions — Reliability & Verification (Q4.16–Q4.19)

### Q4.16 — Hallucination prevention (layered defense)

- **Problem:** What reliability architecture prevents/mitigates hallucination?
- **Classification:** ARCHITECTURE DECISION (layered) / UNRESOLVED (config,
  thresholds)
- **Research evidence:** Q6: no single technique eliminates hallucination;
  layered defense (RAG + web search + guardrails + self-verification) pushes
  accuracy past 95%; citation verification prevents observed failure modes;
  faithfulness checking; confidence scoring; abstention behavior.
- **Alternatives:** (a) layered defense: retrieval grounding → claim-to-evidence
  attribution → faithfulness checking → citation verification → confidence/
  abstention; (b) single mechanism; (c) no reliability layer.
- **Chosen approach:** (a) layered defense across retrieval, claim/evidence,
  verification, and confidence/abstention.
- **Rationale:** External evidence (Q6) shows no single technique suffices and
  layered defense is most robust.
- **Consequences:** Multiple components cooperate; layers are individually
  optional/configurable at Specification.
- **Rejected alternatives:** (b) contradicts evidence; (c) no reliability basis.
- **Unresolved implications:** Which layers are mandatory, their order,
  configuration, and thresholds are UNRESOLVED / Specification firewall.

### Q4.17 — Citation verification

- **Problem:** How are citations verified against sources?
- **Classification:** ARCHITECTURE DECISION (verification component) / UNRESOLVED
  (mechanism, automation split)
- **Research evidence:** Q5: combined automated + manual verification; citation
  error rates; Q6: citation verification prevents fabricated-file/out-of-range/
  missing-evidence failure modes; full-text verification; Q7: citation accuracy
  via statement-source support checking.
- **Alternatives:** (a) citation verification against original sources, including
  content-level (claim-supports-citation) checks; (b) format-level bibliographic
  checks only; (c) no verification.
- **Chosen approach:** (a) citation verification is a required component;
  full-text vs sampled, and automation split, are UNRESOLVED.
- **Rationale:** External evidence (Q6, Q7) shows verification is necessary and
  format checks insufficient.
- **Consequences:** Verification feeds evaluation and reliability layers.
- **Rejected alternatives:** (b) insufficient (retrospective format checking
  insufficient, Q6); (c) contradicts evidence.
- **Unresolved implications:** Verification depth/automation split and cost/
  coverage trade-off are UNRESOLVED (Q5 §8.8, Q6 §5.2).

### Q4.18 — Uncertainty / confidence representation

- **Problem:** How is confidence/uncertainty represented?
- **Classification:** ARCHITECTURE DECISION (confidence alongside claims) /
  UNRESOLVED (calibration, scoring)
- **Research evidence:** Q6: uncertainty quantification correlates with
  hallucination; calibrated confidence not automatic; ECE/Brier; Q7: uncertainty
  representation and calibration dimensions; hedging failure mode.
- **Alternatives:** (a) confidence/uncertainty signals represented alongside
  claims and used for prioritization; (b) no confidence representation; (c)
  scalar confidence only.
- **Chosen approach:** (a) confidence/uncertainty signals are represented
  alongside claims; exact scoring and calibration are UNRESOLVED.
- **Rationale:** External evidence (Q6, Q7) supports confidence-aware reliability
  and HITL prioritization; calibration is not automatic.
- **Consequences:** Confidence signals drive escalation/abstention.
- **Rejected alternatives:** (b) no prioritization basis; (c) insufficient for
  calibration.
- **Unresolved implications:** Scoring formula, calibration method, and any
  thresholds are UNRESOLVED / Specification firewall.

### Q4.19 — Abstention when evidence insufficient

- **Problem:** Does the module abstain when evidence is insufficient?
- **Classification:** ARCHITECTURE DECISION (abstention signal) / UNRESOLVED
  (rate, criteria)
- **Research evidence:** Q6: abstention behavior (ARate ≈ 0.25–0.35) aligned with
  evidence insufficiency; Q7: abstention/refusal dimension; premature stopping
  vs appropriate stopping (DeepSearchQA).
- **Alternatives:** (a) explicit abstention/unresolved outcome when evidence is
  insufficient; (b) always produce a best-effort answer; (c) no distinct
  abstention state.
- **Chosen approach:** (a) abstention is a distinct terminal outcome alongside
  completion; the abstention criteria/rate are UNRESOLVED.
- **Rationale:** External evidence (Q6, Q7) supports abstention over
  hallucination; documented "LLMs hallucinate with certainty" failure.
- **Consequences:** Task results may be partial/unresolved; affects evaluation.
- **Rejected alternatives:** (b) increases hallucination risk; (c) loses the
  signal.
- **Unresolved implications:** Abstention criteria, target rate, and how abstention
  is reported are UNRESOLVED / Specification firewall.

---

## 13. Architecture Questions — Evaluation & Human Review (Q4.20–Q4.21)

### Q4.20 — Quality evaluation framework

- **Problem:** How is research quality evaluated?
- **Classification:** ARCHITECTURE DECISION (multi-dimensional) / UNRESOLVED
  (metrics, weights, thresholds)
- **Research evidence:** Q7: no single scalar metric suffices; multi-dimensional
  evaluation (factual correctness, claim support, citation accuracy/completeness,
  source quality/relevance, traceability, contradiction handling, uncertainty,
  calibration, abstention, recall, reasoning quality, report quality, human
  assessment, reproducibility, freshness, cost, failure tolerance); ReportBench,
  DeepResearch Bench, DeepSearchQA, DR-Arena, Arize.
- **Alternatives:** (a) multi-dimensional evaluation framework with per-dimension
  records; (b) single scalar composite; (c) task-completion only.
- **Chosen approach:** (a) multi-dimensional evaluation framework; no single
  scalar metric is the sole success criterion.
- **Rationale:** External evidence (Q7) explicitly rejects single-score and
  task-completion-only evaluation.
- **Consequences:** Evaluation records are structured per dimension; exact metric
  set, weighting, thresholds, and scoring formulas are UNRESOLVED / Specification
  firewall.
- **Rejected alternatives:** (b)/(c) explicitly rejected by evidence (Q7 §8).
- **Unresolved implications:** Weighting, thresholds, pass/fail criteria, scoring
  formula, and evaluation environment (static/dynamic) are UNRESOLVED.

### Q4.21 — Human review and escalation

- **Problem:** How is human review integrated?
- **Classification:** ARCHITECTURE DECISION (HITL escalation) / UNRESOLVED
  (workflow)
- **Research evidence:** Q4: human review is a candidate process (DeepResearch
  Bench II, MIRAGE); Q5: combined automated + manual verification; Q6:
  HITL prioritization based on automated confidence most effective; Q7: human
  evaluation (static + live) as a success dimension.
- **Alternatives:** (a) human-in-the-loop escalation prioritized by confidence/
  evaluation signals; (b) fully automated only; (c) mandatory full human review.
- **Chosen approach:** (a) HITL escalation is a component; escalation criteria
  and workflow are UNRESOLVED.
- **Rationale:** External evidence (Q4, Q5, Q6, Q7) supports HITL escalation,
  prioritized by automated signals, not full review.
- **Consequences:** Evaluation/confidence signals drive escalation; workflow and
  review records are Specification decisions.
- **Rejected alternatives:** (b) contradicts evidence for high-stakes review; (c)
  inefficient (Q6 §5.5).
- **Unresolved implications:** Escalation criteria, review workflow, and any human
  evaluation gates are UNRESOLVED.

---

## 14. Architecture Questions — Seams, Security, Extension (Q4.22–Q4.26)

### Q4.22 — Decision Provider / model binding seam

- **Problem:** How does the module integrate model/provider decisions?
- **Classification:** FACT (seam) / ARCHITECTURE DECISION (seam retained) /
  UNRESOLVED (binding)
- **Research evidence:** Q4: model/provider binding is D (requires Architecture/
  Owner decision); Phase 3 deterministic stub pattern; Q6: model-based judgment
  (LLM-as-judge) is a candidate; §22.4 deferred.
- **Alternatives:** (a) retain the `DecisionProvider` seam (Phase 2 contract) and
  Phase 3 deterministic-stub pattern, deferring real model binding; (b) bind a
  model/provider in Phase 4 now; (c) no provider seam.
- **Chosen approach:** (a) retain the frozen `DecisionProvider` seam and the
  deterministic-stub pattern; real model/provider binding remains **deferred**
  (§22.4, D3.2) and requires separate Owner authorization.
- **Rationale:** §22.4 remains deferred; Phase 3 uses deterministic stubs; model
  binding is D (Q4). Keeping the seam allows later binding without contract
  change.
- **Consequences:** Phase 4 operates deterministically by default; model binding
  is a future authorized decision.
- **Rejected alternatives:** (b) unauthorized (D3.2); (c) loses the seam.
- **Unresolved implications:** Whether/when to authorize model binding is an Owner
  decision; provider selection and safety mitigations are UNRESOLVED.

### Q4.23 — Deterministic execution and reproducibility

- **Problem:** How are deterministic execution and reproducibility preserved?
- **Classification:** ARCHITECTURE DECISION (deterministic seams preserved) /
  UNRESOLVED (environment)
- **Research evidence:** Q7: RetroSearch frozen-content environment for
  reproducible results; pass@k consistency; reproducibility/auditability
  dimension; Galileo reliability drop across runs.
- **Alternatives:** (a) preserve deterministic seams where feasible and design
  for reproducible evaluation (frozen/captured environments); (b) no
  determinism/reproducibility constraints; (c) require full multi-run
  consistency.
- **Chosen approach:** (a) Phase 4 preserves deterministic seams where feasible
  (frozen contracts, deterministic provider pattern) and designs for reproducible
  evaluation; exact environment/stability approach is UNRESOLVED.
- **Rationale:** External evidence (Q7) supports reproducibility and auditability;
  Galileo shows single-run metrics overstate reliability.
- **Consequences:** Evaluation must consider run-to-run consistency; frozen
  content environment is a candidate, not a requirement.
- **Rejected alternatives:** (b) undermines auditability; (c) over-constrained,
  pass@k requirement UNRESOLVED.
- **Unresolved implications:** Reproducibility level, environment stability, and
  pass@k requirement are UNRESOLVED.

### Q4.24 — Security and threat model

- **Problem:** What security/threat model applies to external evidence?
- **Classification:** ARCHITECTURE DECISION (threat model required) /
  UNRESOLVED (mechanisms)
- **Research evidence:** Q4 Source 3: deep research introduces risks (prompt
  injection, privacy, bias, model autonomy); Q6: evidence poisoning and semantic
  DDoS threat vectors; retrieved content may contain injected prompts;
  external databases may include incomplete/unsafe information.
- **Alternatives:** (a) explicit security/threat model: treat retrieved content as
  untrusted input, validate before grounding, mitigate prompt injection/
  evidence poisoning; (b) no threat treatment; (c) quarantine external content
  entirely.
- **Chosen approach:** (a) explicit threat model; retrieved content is treated as
  untrusted input with validation before grounding.
- **Rationale:** External evidence (Q4 Source 3, Q6 §3.13) documents verified
  threat vectors.
- **Consequences:** Security mechanisms are Specification decisions; threat model
  is architectural.
- **Rejected alternatives:** (b) ignores documented threats; (c) removes research
  capability.
- **Unresolved implications:** Exact mitigations, validation depth, and
  sandboxing are UNRESOLVED / Specification firewall.

### Q4.25 — Privacy and data handling

- **Problem:** How are privacy and data retention handled?
- **Classification:** ARCHITECTURE DECISION (privacy treatment required) /
  UNRESOLVED (policy)
- **Research evidence:** Q4 Source 3: privacy risks from web queries; data
  retention questions; Q6: external databases may include unsafe information.
- **Alternatives:** (a) explicit privacy/retention treatment for queries,
  retrieved content, and evidence records; (b) no treatment; (c) prohibit all
  external queries.
- **Chosen approach:** (a) privacy and data-retention treatment is required;
  exact policy is UNRESOLVED / Specification + Owner.
- **Rationale:** External evidence (Q4 Source 3) identifies privacy risk.
- **Consequences:** Retention, redaction, and disclosure rules are Specification
  decisions.
- **Rejected alternatives:** (b) ignores documented risk; (c) removes capability.
- **Unresolved implications:** Retention policy, redaction, and any PII handling
  are UNRESOLVED.

### Q4.26 — Future extension points and governance

- **Problem:** What is reserved for later phases and what remains deferred?
- **Classification:** FACT / ARCHITECTURE DECISION / UNRESOLVED
- **Research evidence:** Q4, Q5, Q6, Q7 architecture inputs: Phase 3
  barrel-only consumption; §22.1–§22.5 deferrals; model/provider binding D.
- **Alternatives:** (a) explicit extension-point inventory with governance gate
  (Owner authorization + DECISIONS entry); (b) implicit; (c) none.
- **Chosen approach:** (a) explicit extension points (§16) with the governance
  rule that each deferred item requires separate Owner authorization and a Phase
  4 DECISIONS entry.
- **Rationale:** Consistent with Phase 3 governance (D3.2); the deferrals are
  carried forward unchanged.
- **Consequences:** No deferred item is resolved by Architecture; Specification
  and Owner gates are required.
- **Rejected alternatives:** (b)/(c) undermine governance.
- **Unresolved implications:** Which deferred items later phases resolve is
  UNRESOLVED; each is a future Owner decision.

---

## 15. Decision Summary Matrix

**[ARCHITECTURE DECISION]** Summary of the architecture decisions in this
document (full reasoning in each question and in `DECISIONS.md`):

| ID    | Question                    | Decision                                                          | Classification                       |
| ----- | --------------------------- | ----------------------------------------------------------------- | ------------------------------------ |
| Q4.1  | Module identity/naming      | `phase-04/`, "Research Agent Module", `@issue/research` candidate | DECISION + UNRESOLVED (package name) |
| Q4.2  | Consumption                 | barrel-only through public surfaces                               | DECISION                             |
| Q4.3  | Unobtainable capabilities   | build research capabilities from scratch                          | FACT/INFERENCE                       |
| Q4.4  | Phase 3 isolation           | never modify frozen phases                                        | DECISION                             |
| Q4.5  | Deterministic seam          | prefer Phase 3 public seam; Phase 2 barrel fallback               | DECISION + UNRESOLVED                |
| Q4.6  | Lifecycle                   | cyclic with refinement, bounded                                   | DECISION + UNRESOLVED                |
| Q4.7  | Retrieval                   | external retrieval in scope                                       | DECISION + UNRESOLVED                |
| Q4.8  | Source selection            | explicit selection/filtering                                      | DECISION + UNRESOLVED                |
| Q4.9  | Credibility                 | multidimensional                                                  | DECISION + UNRESOLVED                |
| Q4.10 | Claim representation        | atomic claims                                                     | DECISION + UNRESOLVED                |
| Q4.11 | Evidence granularity        | claim-level traceability                                          | DECISION + UNRESOLVED                |
| Q4.12 | Citation                    | inline markers + non-binary support                               | DECISION + UNRESOLVED                |
| Q4.13 | Contradiction               | surface conflicts explicitly                                      | DECISION + UNRESOLVED                |
| Q4.14 | Gap detection               | candidate component                                               | DECISION + UNRESOLVED                |
| Q4.15 | Synthesis                   | evidence-grounded                                                 | DECISION + UNRESOLVED                |
| Q4.16 | Hallucination               | layered defense                                                   | DECISION + UNRESOLVED                |
| Q4.17 | Citation verification       | required component                                                | DECISION + UNRESOLVED                |
| Q4.18 | Confidence                  | represented alongside claims                                      | DECISION + UNRESOLVED                |
| Q4.19 | Abstention                  | distinct terminal outcome                                         | DECISION + UNRESOLVED                |
| Q4.20 | Evaluation                  | multi-dimensional                                                 | DECISION + UNRESOLVED                |
| Q4.21 | Human review                | HITL escalation                                                   | DECISION + UNRESOLVED                |
| Q4.22 | Provider seam               | seam retained; binding deferred                                   | DECISION + UNRESOLVED                |
| Q4.23 | Determinism/reproducibility | seams preserved; reproducibility target                           | DECISION + UNRESOLVED                |
| Q4.24 | Security                    | explicit threat model; content untrusted                          | DECISION + UNRESOLVED                |
| Q4.25 | Privacy                     | treatment required                                                | DECISION + UNRESOLVED                |
| Q4.26 | Extension/governance        | explicit inventory + governance gate                              | DECISION + UNRESOLVED                |

**[INFERENCE]** All decisions are structural/scope decisions. No Specification-
finalized decision (API, schema, threshold, scoring formula, technology) is made
here.

---

## 16. Deferred Decisions

**[FACT / DEFERRED]** Carried forward unchanged from Phase 2 §22 (Phase 3
`SPECIFICATION.md` §6; Phase 3 `DECISIONS.md` D3.2):

- §22.1 CLI / end-user entry point — deferred.
- §22.2 configuration-file schema — deferred.
- §22.3 write/execute/Git/network tooling — deferred (Phase 4's network use is a
  separate research capability, not the deferred tooling category).
- §22.4 model-provider binding — deferred (Q4.22).
- §22.5 workspace/monorepo adoption — deferred.

**[NORMATIVE]** None is resolved by this Architecture stage. Resolving any
requires separate Owner authorization and a Phase 4 DECISIONS entry.

---

## 17. Future Extension Points

**[EXTENSION]** Reserved for later phases / future authorization:

- CLI / end-user entry point (§22.1).
- Configuration-file schema (§22.2).
- Write/execute/Git tooling (§22.3).
- Model/provider binding behind the `DecisionProvider` seam (§22.4).
- Workspace/monorepo adoption (§22.5).
- Memory subsystem / cross-run persistence (Phase 2 §19.2).
- Multi-agent systems / agent roles (Phase 2 §19.10).
- Plugin framework / dynamic module loading (Phase 2 §19.8).
- Code generation (Phase 2 §19.7).
- Performance benchmarking infrastructure (Phase 2 §19.15).
- Publishing / distribution (Phase 2 §19.12).

---

## 18. Conformance & Validation

**[NORMATIVE]** Phase 4 Architecture conforms when:

- Every architecture question (Q4.1–Q4.26) is recorded with labels
  (FACT/INFERENCE/RESEARCH EVIDENCE/ARCHITECTURE DECISION/UNRESOLVED).
- No Specification-finalized decision (API, schema, threshold, scoring formula,
  technology) is made here.
- No frozen Phase 1/2/3 artifact is modified; Phase 3 remains CLOSED and FROZEN.
- Barrel-only consumption is stated and enforced.
- Deferred items remain deferred.
- The Specification firewall and implementation firewall are respected.

---

## 19. Specification Inputs (firewall)

**[RECOMMENDATION / UNRESOLVED]** The following are **NOT finalized here**; they
are recorded as Specification inputs from Research Q1–Q7 and this Architecture:

- **Public API surface** — exact exports, function signatures, entry points.
- **Data schemas** — claim record, evidence link, source-reference record,
  credibility profile, conflict record, evaluation record.
- **Citation schema and style** — marker format, classification labels
  (candidate 4-class: Supported/Partially Supported/Unsupported/Uncertain),
  source-role metadata (primary/secondary).
- **Thresholds and criteria** — test thresholds, acceptance criteria, benchmark
  thresholds, pass/fail formulas, scoring formulas, evaluation weights,
  abstention criteria, recall/precision balance, citation-density limits,
  confidence calibration targets.
- **Retrieval technology** — web search provider(s), API, query protocol,
  retrieval scope, rate limits.
- **Implementation technology** — model/provider selection (when authorized),
  dependency choices, packaging, tooling.
- **Evaluation environment** — static/dynamic/hybrid, reproducibility level,
  pass@k consistency requirement.
- **Human-review workflow** — escalation criteria, review gates, human evaluation
  process (static + live).

**[NORMATIVE]** No threshold, pass/fail formula, scoring formula, or benchmark
value is established by this Architecture stage. Research Q1–Q7 explicitly
deferred all of these to Specification and Owner approval.

---

## 20. Unresolved Questions Register

**[UNRESOLVED]** Consolidated open questions requiring Specification and/or Owner
approval:

1. Exact public API and exports.
2. Claim/evidence/source/citation/credibility/conflict/evaluation schemas.
3. Citation granularity balance (Q4.11; Q5 §8.1).
4. Classification scheme depth (4-class vs expanded; Q4.12).
5. Citation-density threshold (Q4.12; Q5 §8.6).
6. Multi-source attribution distribution (Q4.13; Q5 §8.7).
7. Verification depth and automation split (Q4.17; Q5 §8.8).
8. Confidence scoring and calibration method (Q4.18).
9. Abstention criteria and target rate (Q4.19).
10. Quality-evaluation metric set, weights, thresholds, scoring formulas
    (Q4.20).
11. Automated vs human evaluation split (Q4.20/Q4.21; Q7 §12.4).
12. Evaluation environment: static/dynamic/hybrid (Q4.23; Q7 §12.5).
13. Reproducibility level and pass@k requirement (Q4.23; Q7 §12.8).
14. Source-freshness mechanism (retractions, corrections, age decay) — Q5 §8.4,
    Q6 §3.12.
15. Primary/secondary source weighting — Q5 §8.5.
16. Web search provider/API/scope/rate limits — Q4.7, Q4.8.
17. Privacy/retention policy — Q4.25.
18. Model/provider binding authorization — Q4.22 (§22.4, D3.2).
19. Cost/latency budget and failure-tolerance level — Q7 §12.9–12.10.
20. Whether any scalar composite score is meaningful — Q7 §12.12.
21. Security mitigations detail (prompt injection, evidence poisoning, semantic
    DDoS) — Q4.24, Q6 §3.13.
22. Contradiction representation/weighting — Q4.13; Q5 §8.10.
23. Whether the frozen Phase 2 nine-state machine is reused for research-task
    orchestration — Q4.6.
24. Any incompatibility discovered at Specification (§4.5) — to be recorded here.

---

## 21. Architecture-stage Status

**[STATUS]**

```
PHASE 4 ARCHITECTURE:
ACCEPTED (owner, 2026-08-15)

ARCHITECTURE DECISIONS MADE: Q4.1–Q4.26 (structural scope; see each)
SPECIFICATION-FINALIZED DECISIONS: NONE (firewall respected)
DEFERRED ITEMS RESOLVED: NONE (§22.1–§22.5 unchanged; D3.2)
FROZEN PHASE 1/2/3 MODIFIED: NO
BLUEPRINT MODIFIED: NO
SOURCE/TEST/CONFIGURATION ARTIFACTS CREATED: YES (phase-04/src, tests, configuration — deterministic core)
DIAGRAMS CREATED: NO
ARCHITECTURE ARTIFACTS CREATED: phase-04/ARCHITECTURE.md, phase-04/DECISIONS.md
COMMIT/PUSH: NO

OPEN REQUIREMENTS BEFORE SPECIFY:
- Owner/Architecture acceptance of this document
- Owner decision on deferred items §22.1–§22.5 if any to be resolved
- Owner decision on model/provider binding (Q4.22) if to be resolved
- Specification stage to finalize API, schemas, thresholds, scoring, technology
```

---

## 22. End-of-Document Block

```
PHASE 4 ARCHITECTURE: ACCEPTED
SPECIFICATION AUTHORIZED: YES (owner, 2026-08-15)
IMPLEMENTATION AUTHORIZED: YES (owner, 2026-08-15; deterministic core)
IMPLEMENTATION ACCEPTED: YES (owner, 2026-08-15; deterministic core)
SOURCE/TEST/CONFIGURATION ARTIFACTS CREATED: YES (phase-04/src, tests, configuration — deterministic core)
DIAGRAMS CREATED: NO
PHASE 1/2/3 MODIFIED: NO
BLUEPRINT MODIFIED: NO
COMMIT/PUSH: NO
```
