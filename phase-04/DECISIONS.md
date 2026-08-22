# ISSU — Phase 4: Research Agent Module — Architecture Decisions

**Phase:** 4 — Research Agent Module
**Stage:** ARCHITECTURE (owner-authorized 2026-08-14; `phase-03/TASKS.md:749-762`)
**Status:** Draft — records the architectural decisions made in
`./ARCHITECTURE.md`; decisions become **Approved** at Architecture acceptance and
**Frozen** at the Phase 4 phase freeze
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative specification:** `./ARCHITECTURE.md`
**License:** Apache License 2.0

This file records the **genuinely non-obvious architectural decisions** made by
the Phase 4 ARCHITECTURE stage. Per BLUEPRINT §7.11 (Learn While Building) and
§30 (major architectural decisions are documented), each decision includes
Decision, Context, Evidence, Alternatives, Rationale, Consequences, and Status.
Decision IDs are stable references used across the Phase 4 documents.

No decision here contradicts the frozen Phase 1, Phase 2, or Phase 3 contracts,
which remain authoritative. No decision resolves a deferred §22 item (§22.1–
§22.5, Phase 3 D3.2) without separate Owner authorization.

---

## AD-4.1 — Phase 4 consumes frozen contracts barrel-only

- **Decision:** Phase 4 consumes Phase 1 (`@issue/foundation`), Phase 2
  (`@issue/tool-runtime`), and Phase 3 (`@issue/integration`) **only through
  their public package barrels**, with zero deep imports. (`ARCHITECTURE.md`
  §3, Q4.2.)
- **Context:** Phase 3 established barrel-only consumption as its integration
  rule and recorded it in the P4-1 contract assertions (Phase 3
  `ARCHITECTURE.md` §27, §31). Phase 4 now consumes three frozen phases.
- **Evidence:** FACT — Phase 3 public barrels and 14 P4-1 assertions; INFERENCE —
  a future Research module may reasonably consume frozen contracts through
  public surfaces (Research Q5/Q6/Q7 architecture inputs).
- **Alternatives:** (1) deep imports of internal modules; (2) reimplementing
  frozen behavior in Phase 4.
- **Rationale:** Preserves phase isolation, contract stability, and the
  frozen-phase integrity precedent. Deep imports would expose internal (private)
  modules that are explicitly not public surface (Phase 2 §17.3).
- **Consequences:** Any behavior needed from a frozen phase must be reachable via
  its public exports; internal modules are inaccessible.
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-4.2 — Phase 4 does not modify Phase 3 (isolation)

- **Decision:** Phase 4 SHALL NOT modify any frozen Phase 1, Phase 2, or Phase 3
  artifact. All research-specific capabilities are built as separate Phase 4
  components. A perceived need to modify a frozen phase is recorded as an
  incompatibility, not implemented. (`ARCHITECTURE.md` §3.8, Q4.4.)
- **Context:** Phase 3 is CLOSED and FROZEN (`phase-03/TASKS.md` Phase 4
  records); Research classified every candidate research capability **C**
  (implementable without modifying Phase 3).
- **Evidence:** FACT — freeze records and Research compatibility matrices
  (Q4, Q5, Q6, Q7); no candidate was classified B (demonstrably incompatible).
- **Alternatives:** (1) extend Phase 3 to add research capabilities; (2) modify
  a frozen contract to enable a research flow.
- **Rationale:** Frozen-phase integrity and governance. The Research
  compatibility classification (C) means no modification is required.
- **Consequences:** Phase 4 carries its own capability stack; any future
  incompatibility is recorded and escalated to Owner, never modified in place.
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-4.3 — Layered hallucination-prevention architecture

- **Decision:** Phase 4 uses a **layered defense** against hallucination:
  retrieval grounding → claim-to-evidence attribution → faithfulness checking →
  citation verification → confidence/abstention signaling. No single mechanism
  is the sole mitigation. (`ARCHITECTURE.md` Q4.16, Q4.17.)
- **Context:** External evidence establishes that hallucination is a
  "mathematically permanent property" of LLMs and no single technique eliminates
  it; layered defense is documented as the robust approach.
- **Evidence:** RESEARCH EVIDENCE — Q6: layered defense (RAG + web search +
  guardrails + self-verification) pushes accuracy past 95%; citation verification
  prevents fabricated-file, out-of-range, and missing-evidence failure modes;
  faithfulness checking; confidence scoring; abstention.
- **Alternatives:** (1) single mechanism (e.g., RAG alone); (2) no reliability
  layer; (3) full-text verification of every claim with no sampling.
- **Rationale:** External evidence (Q6 §3.1–§3.11) rejects single-mechanism and
  no-layer approaches; layers mitigate different failure modes.
- **Consequences:** Multiple components cooperate; which layers are mandatory,
  their order, configuration, and thresholds are Specification decisions (not
  decided here).
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-4.4 — Multi-dimensional source credibility model

- **Decision:** Source evaluation uses a **multidimensional credibility model**
  (e.g., expertise, trustworthiness, bias, transparency, date, provenance), not
  a single reputation score. (`ARCHITECTURE.md` Q4.9.)
- **Context:** The module must evaluate external sources it retrieves; Research
  Q2 established that web credibility is multidimensional.
- **Evidence:** RESEARCH EVIDENCE — Q2: Metzger (Source 10) shows web credibility
  is multidimensional; expertise and trustworthiness are key dimensions (Source
  11); Q6: source quality and evidence poisoning awareness.
- **Alternatives:** (1) single reputation score; (2) no credibility model;
  (3) binary trustworthy/untrustworthy.
- **Rationale:** External evidence explicitly rejects unitary reputation scores.
  A multidimensional profile feeds synthesis and evaluation.
- **Consequences:** Credibility profiles are first-class Phase 4 records; exact
  dimensions, weights, and thresholds are Specification decisions.
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-4.5 — Non-binary claim support classification and claim-level traceability

- **Decision:** Claims are decomposed into atomic units, each mapped to specific
  evidence locations and classified with a **non-binary support scheme**
  (candidate 4-class: Supported / Partially Supported / Unsupported / Uncertain).
  Binary SUPPORTS/REFUTES classification is rejected. (`ARCHITECTURE.md`
  Q4.10–Q4.12.)
- **Context:** Research Q5 and Q7 show binary classification forces complex
  relationships into oversimplified dichotomies and that document-level citations
  are insufficient for precise verification.
- **Evidence:** RESEARCH EVIDENCE — Q5: SemanticCite 4-class taxonomy; VISA
  evidence-location attribution; PaperTrail claim-evidence mapping; Q7:
  atomic-fact decomposition (FACTScore, LongDocFACTScore), statement-source
  support checking.
- **Alternatives:** (1) binary SUPPORTS/REFUTES; (2) document-level attribution
  only; (3) no claim/evidence model.
- **Rationale:** External evidence (Q5 §1, §2; Q7) supports atomic claims,
  nuanced classification, and claim-level traceability; binary and
  document-level approaches are documented as insufficient.
- **Consequences:** Claim/evidence/citation records become core Phase 4 data
  structures; exact schemas, granularity, and classification labels are
  Specification decisions.
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-4.6 — Multi-dimensional research-quality evaluation

- **Decision:** Research quality is evaluated across **multiple complementary
  dimensions** (factual correctness, claim support, citation accuracy and
  completeness, source quality/relevance, traceability, contradiction handling,
  uncertainty/calibration, abstention, recall/completeness, reasoning quality,
  report quality, human assessment, reproducibility, freshness, cost/latency,
  failure tolerance). No single scalar metric is the sole success criterion.
  (`ARCHITECTURE.md` Q4.20.)
- **Context:** Research Q7 established that successful research-task completion is
  multi-dimensional and that single-score evaluation is explicitly rejected by
  external evidence.
- **Evidence:** RESEARCH EVIDENCE — Q7: ReportBench, DeepResearch Bench, Arize,
  Galileo, MiroEval; "Quality should not be treated as a single score" (Arize);
  "No single metric is sufficient on its own" (Algolia).
- **Alternatives:** (1) single scalar composite; (2) task-completion only;
  (3) ROUGE-style automatic factuality metrics.
- **Rationale:** External evidence (Q7 §8) rejects single-scalar, completion-only,
  and ROUGE-based evaluation. Multi-dimensional evaluation distinguishes the
  documented failure modes (fluent-but-unsupported, well-cited-but-inaccurate,
  etc.).
- **Consequences:** Evaluation records are structured per dimension; exact metric
  set, weights, thresholds, scoring formulas, and evaluation environment are
  Specification/Owner decisions (Specification firewall).
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-4.7 — Research-specific lifecycle state model (Phase 4 type)

- **Decision:** Phase 4 drives research tasks through a **research-specific
  lifecycle** (§11 of `SPECIFICATION.md`): `READY → PLANNING → RETRIEVING →
EVALUATING_SOURCES → SYNTHESIZING → VERIFYING → EVALUATING → (REPLANNING) →
COMPLETED | PARTIAL | FAILED | CANCELLED`. The frozen Phase 2 nine-state
  `TaskStatus` machine is **not** reused, extended, or modified; the
  research-specific status model is a **Phase 4 type**. (Architecture §9, Q4.6;
  this resolves the Architecture-delegated decision.)
- **Context:** Architecture §9 and Q4.6 left "whether the orchestrator reuses the
  frozen Phase 2 nine-state machine or defines a research-specific state model"
  as an explicit SPECIFICATION decision, and mandated Phase 4 SHALL NOT extend or
  modify the frozen Phase 2 state machine.
- **Evidence:** FACT — Architecture §9 (delegation), Q4.6 (unresolved implication);
  RESEARCH EVIDENCE — Q1/Q7: research is a cyclic plan/retrieve/evaluate/refine/
  synthesize/verify process distinct from a bounded filesystem read/list task.
- **Alternatives:** (1) reuse the frozen Phase 2 `TaskStatus` machine; (2) extend
  the Phase 2 machine with research states; (3) no explicit lifecycle.
- **Rationale:** Research-task semantics (retrieval, source evaluation, synthesis,
  abstention) differ from Phase 2 tool-execution semantics; reusing or extending
  the frozen machine would either misrepresent research states or violate the
  frozen-contract boundary (AD-4.1, AD-4.2).
- **Consequences:** `ResearchTaskStatus` is a Phase 4 public type (§4); the module
  maps tool-seam outcomes into the research lifecycle at its boundary; the frozen
  Phase 2 machine remains unchanged.
- **Status:** Specification decision (AD-4.7); awaiting Specification acceptance.

---

## AD-4.8 — Determinism-by-default retrieval scope

- **Decision:** Phase 4 retrieval defaults to **no external retrieval** unless a
  `SourceSelector` is explicitly provided in the task request. External retrieval,
  when enabled, is a deliberate per-task choice that may introduce
  non-determinism, which is recorded as an evaluation limitation. (§9, §15 of
  `SPECIFICATION.md`.)
- **Context:** Architecture Q4.7 placed external retrieval in scope with an
  explicit provider seam but deferred mechanism; the Specification-stage
  definition requires deterministic seams and reproducibility to be specified
  without resolving provider binding (Q4.22, D3.2).
- **Evidence:** FACT — Architecture Q4.7/Q4.22 (seam, deferral), Q4.23
  (determinism); RESEARCH EVIDENCE — Q7 (reproducibility is an evaluation
  dimension; dynamic environments complicate consistent evaluation).
- **Alternatives:** (1) external retrieval always on; (2) retrieval on by default
  with opt-out; (3) no external retrieval capability.
- **Rationale:** Defaults preserve determinism and reproducibility on the default
  path and avoid silent network dependence (consistent with Phase 3's network
  prohibition being a Phase 3 boundary, not a Phase 4 one); opt-in retrieval keeps
  the capability available while making non-determinism an explicit choice.
- **Consequences:** The default research path is deterministic; enabling retrieval
  is an explicit request; retrieval provider/API/rate limits remain unresolved
  (§20 of `SPECIFICATION.md`).
- **Status:** Specification decision (AD-4.8); awaiting Specification acceptance.

---

## Decision Log

| ID     | Decision                                                           | Status                                       |
| ------ | ------------------------------------------------------------------ | -------------------------------------------- |
| AD-4.1 | Phase 4 consumes frozen contracts barrel-only                      | Draft (awaiting acceptance)                  |
| AD-4.2 | Phase 4 does not modify Phase 3 (isolation)                        | Draft (awaiting acceptance)                  |
| AD-4.3 | Layered hallucination-prevention architecture                      | Draft (awaiting acceptance)                  |
| AD-4.4 | Multi-dimensional source credibility model                         | Draft (awaiting acceptance)                  |
| AD-4.5 | Non-binary claim support classification + claim-level traceability | Draft (awaiting acceptance)                  |
| AD-4.6 | Multi-dimensional research-quality evaluation                      | Draft (awaiting acceptance)                  |
| AD-4.7 | Research-specific lifecycle state model (Phase 4 type)             | Specification decision (awaiting acceptance) |
| AD-4.8 | Determinism-by-default retrieval scope                             | Specification decision (awaiting acceptance) |

Status becomes **Approved** at Architecture-stage acceptance and **Frozen** at
the Phase 4 phase freeze. Later phases may propose new decisions; changing a
frozen decision requires a documented revisit. AD-4.7 and AD-4.8 were added by
the Specification stage per the DECISIONS.md rule (genuinely new, non-obvious,
required to make the Specification authoritative) and do not modify AD-4.1–AD-4.6.

---

## End-of-Document Block

```
PHASE 4 ARCHITECTURE: ACCEPTED
PHASE 4 SPECIFICATION: ACCEPTED (AD-4.7, AD-4.8 added by Specification stage)
SPECIFICATION AUTHORIZED: YES (owner, 2026-08-15)
IMPLEMENTATION AUTHORIZED: YES (owner, 2026-08-15; deterministic core)
IMPLEMENTATION ACCEPTED: YES (owner, 2026-08-15; deterministic core)
SOURCE/TEST/CONFIGURATION ARTIFACTS CREATED: YES (phase-04/src, tests, configuration — deterministic core)
DIAGRAMS CREATED: NO
PHASE 1/2/3 MODIFIED: NO
BLUEPRINT MODIFIED: NO
COMMIT/PUSH: NO
```
