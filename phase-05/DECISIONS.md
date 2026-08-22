# ISSU - Phase 5: Analytics Agent Module - Architecture Decisions

**Phase:** 5 - Analytics Agent Module
**Stage:** ARCHITECTURE (owner-authorized 2026-08-20)
**Status:** FROZEN - decisions frozen at the Phase 5 phase freeze recorded in README (Owner, 2026-08-20). This header historically read 'Draft - records the architectural decisions made in
`./ARCHITECTURE.md`; decisions become **Approved** at Architecture acceptance and
**Frozen** at the Phase 5 phase freeze
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative specification:** `./ARCHITECTURE.md`
**License:** Apache License 2.0

This file records the **genuinely non-obvious architectural decisions** made by
the Phase 5 ARCHITECTURE stage. Per BLUEPRINT §7.11 (Learn While Building) and
§30 (major architectural decisions are documented), each decision includes
Decision, Context, Evidence, Alternatives, Rationale, Consequences, and Status.
Decision IDs are stable references used across the Phase 5 documents.

No decision here contradicts the frozen Phase 1, Phase 2, Phase 3, or Phase 4
contracts, which remain authoritative. No decision resolves a deferred item
(DEFINE §17, BLUEPRINT §22.1-§22.5, Q4.22) without separate Owner authorization.

---

## AD-5.1 - Phase 5 consumes frozen contracts barrel-only

- **Decision:** Phase 5 consumes Phase 1 (`@issue/foundation`), Phase 2
  (`@issue/tool-runtime`), and Phase 3 (`@issue/integration`) **only through
  their public package barrels**, with zero deep imports. `localFile` reads
  delegate to the Phase 3 deterministic read seam; direct Phase 2 consumption is
  limited to types through the public barrel. (`ARCHITECTURE.md` §3, Q5.2.)
- **Context:** Phase 3 established barrel-only consumption as its integration
  rule; Phase 4 affirmed it (AD-4.1). Phase 5 now consumes three frozen phases.
- **Evidence:** FACT - Phase 3 `SPECIFICATION.md:39-46`; PRECEDENT - Phase 4
  AD-4.1 (`phase-04/DECISIONS.md:30-46`); R5.1.
- **Alternatives:** (1) deep imports of internal modules; (2) reimplementing
  frozen behavior in Phase 5.
- **Rationale:** Preserves phase isolation, contract stability, and the
  frozen-phase integrity precedent. Deep imports would expose internal (private)
  modules that are explicitly not public surface.
- **Consequences:** Any behavior needed from a frozen phase must be reachable via
  its public exports; internal modules are inaccessible.
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-5.2 - Phase 5 does not modify any frozen phase (isolation)

- **Decision:** Phase 5 SHALL NOT modify any frozen Phase 1, Phase 2, Phase 3, or
  Phase 4 artifact, nor the BLUEPRINT. All analytics-specific capabilities are
  built as separate Phase 5 components. A perceived need to modify a frozen phase
  is recorded as an incompatibility, not implemented. Phase 4 is CLOSED/FROZEN and
  is not consumed by Phase 5 by default. (`ARCHITECTURE.md` §4.5, Q5.4.)
- **Context:** Phases 3 and 4 are CLOSED and FROZEN; DEFINE §8 lists Phase 4
  consumption as out of scope by default.
- **Evidence:** FACT - DEFINE §8; R5.1; governance records.
- **Alternatives:** (1) extend a frozen phase to add analytics capabilities;
  (2) modify a frozen contract to enable a Phase 5 flow.
- **Rationale:** Frozen-phase integrity and governance.
- **Consequences:** Any perceived need to modify a frozen phase becomes an
  incompatibility record (§4.5, §20) with a Phase 5 alternative, never a
  modification.
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-5.3 - Deterministic core with a decision-provider seam

- **Decision:** The Phase 5 core is deterministic: control flow is model-free,
  clock-free, and randomness-free. Any model involvement is confined to the
  `AnalyticsDecisionProvider` seam, which defaults to a deterministic
  first-available stub; no model/provider is bound. (`ARCHITECTURE.md` §8, Q5.13,
  Q5.18, Q5.21.)
- **Context:** Phase 2 confines nondeterminism to `DecisionProvider` methods;
  Phase 4 retains a seam with binding deferred (Q4.22). The observed Phase 5
  implementation defines a three-method seam with a deterministic default stub
  (observable evidence, not acceptance).
- **Evidence:** FACT - `phase-02/SPECIFICATION.md:57-62,69-79`; PRECEDENT -
  Phase 4 Q4.22; R5.2, R5.4, R5.9.
- **Alternatives:** (1) hard-wire model calls into the core; (2) no seam.
- **Rationale:** Preserves the determinism contract (identical inputs + provider
  decisions + FS state => identical result); seam-first, bind-later is the
  established pattern and the designated future upgrade point (R5.12).
- **Consequences:** No model-backed behavior may enter control flow; future model
  capabilities require implementing the seam plus §17/Q4.22 resolution and Owner
  authorization.
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-5.4 - Acquisition boundary: inline | localFile, read-only, deny-by-default

- **Decision:** Phase 5 acquires data from `inline` and `localFile` sources only,
  read-only and deny-by-default. `inline` content is caller-supplied;
  `localFile` reads delegate to the Phase 3 deterministic read seam with
  `createDeterministicProviderStub` and `DEFAULT_BOUNDS`; a missing file fails
  acquisition (non-recoverable). Broader acquisition requires separate Owner
  authorization. (`ARCHITECTURE.md` Q5.6, Q5.19.)
- **Context:** External/network data acquisition is out of scope (DEFINE §8);
  Phase 3 provides a deterministic, read-only integration seam.
- **Evidence:** FACT - DEFINE §4/§7/§8; R5.3, R5.11.
- **Alternatives:** (1) any external/network acquisition; (2) no acquisition
  beyond inline.
- **Rationale:** Reuses the frozen deterministic read seam; preserves the trust
  boundary (no external input path by default); matches the recorded scope.
- **Consequences:** Phase 5 depends on Phase 3's public barrel for localFile
  reads; broader acquisition is out of scope until separately authorized.
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-5.5 - Five-outcome terminal model with abstention distinct from failure

- **Decision:** Phase 5 terminates every run in exactly one of `COMPLETED`,
  `PARTIAL`, `ABSTAINED`, `FAILED`, or `CANCELLED`. Abstention is distinct from
  failure; partial work is preserved and reported; failure and cancellation
  produce no report. (`ARCHITECTURE.md` §9, Q5.12.)
- **Context:** Phase 4 precedent treats abstention as first-class; "abstain
  rather than fabricate" is the project pattern for insufficient-data outcomes.
  DEFINE §5 records each outcome's semantics.
- **Evidence:** PRECEDENT - Phase 4 `ARCHITECTURE.md:236-242`; FACT - DEFINE §5;
  R5.5.
- **Alternatives:** (1) collapse abstention/partial into failure; (2) fewer
  outcomes.
- **Rationale:** A deterministic core cannot "correct" its way out of a data
  deficit; abstention and partial-preservation are the honest outcomes (R5.5).
- **Consequences:** Consumers must handle five outcome classes distinctly.
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-5.6 - Provenance-chain structural verification and verified-only reporting

- **Decision:** Every finding carries a `ProvenanceChain` from root source ids
  through recorded transforms to the producing computation. Verification is a
  separate structural pass that checks each chain resolves; findings that fail
  are never emitted in a `COMPLETED` result, and the report references verified
  findings only. (`ARCHITECTURE.md` Q5.9, Q5.11, Q5.17.)
- **Context:** DEFINE §5 requires provenance on every finding and verified-only
  reporting; Phase 4 establishes layered hallucination prevention as a model-
  adjacent concern, but a deterministic core verifies structurally.
- **Evidence:** FACT - DEFINE §4/§5; PRECEDENT - Phase 4 `ARCHITECTURE.md:205-206`;
  R5.6.
- **Alternatives:** (1) semantic/LLM-judged verification; (2) no verification.
- **Rationale:** For a deterministic core, verification is structural
  (chain-resolvability), not semantic; verification and evaluation are separate
  concerns (Q5.16).
- **Consequences:** Verification cannot judge semantic quality; that is out of
  scope for a deterministic core (R5.12).
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-5.7 - Multi-dimensional evaluation with no scalar composite

- **Decision:** Phase 5 evaluates quality across a fixed 5-dimension set
  (`correctness`, `completeness`, `provenance`, `confidenceUncertainty`,
  `reproducibility`), each scored in [0,1] from deterministic signals with
  per-dimension basis notes. No weights or thresholds are applied; no scalar
  composite score is produced. (`ARCHITECTURE.md` Q5.15.)
- **Context:** Phase 4 uses multi-dimensional evaluation rather than a single
  scalar; combining dimensions into one score requires §17 resolution (evaluation
  weights/thresholds remain deferred).
- **Evidence:** PRECEDENT - Phase 4 `ARCHITECTURE.md:206`; FACT - DEFINE §4/§5;
  R5.8.
- **Alternatives:** (1) single composite scalar; (2) no evaluation.
- **Rationale:** Transparency via basis notes; no implied composite quality;
  weights/thresholds are deferred to §17 resolution and Owner approval.
- **Consequences:** Evaluation is per-dimension and honest about what it does not
  assert.
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-5.8 - Deferred items remain deferred

- **Decision:** DEFINE §17 items (evaluation weights/thresholds; persistence;
  external-data policy; Phase 4 consumption; confidence calibration method;
  provenance granularity; reproducibility level; coverage-threshold value),
  BLUEPRINT §22.1-§22.5, and Q4.22 remain deferred and unchanged. Resolution
  requires separate Owner authorization and a Phase 5 DECISIONS entry.
  (`ARCHITECTURE.md` §16, Q5.22.)
- **Context:** The accepted DEFINE records these as unresolved; the BLUEPRINT
  defers them; Phase 3 D3.2 precedent keeps them unchanged across phases.
- **Evidence:** FACT - DEFINE §17; BLUEPRINT §22; PRECEDENT - Phase 3 D3.2; R5.10.
- **Alternatives:** (1) resolve one or more deferred items at this stage.
- **Rationale:** Exceeding Architecture authority without Owner authorization
  would violate governance; Specification must not silently resolve any deferred
  item either.
- **Consequences:** Specification records these as constraints; any future
  resolution requires Owner authorization.
- **Status:** Draft (awaiting Architecture acceptance).

---

## Decision Log

| ID | Decision | Status |
| --- | --- | --- |
| AD-5.1 | Barrel-only consumption of frozen contracts | Draft |
| AD-5.2 | No frozen-phase modification; Phase 4 not consumed by default | Draft |
| AD-5.3 | Deterministic core with decision-provider seam | Draft |
| AD-5.4 | Acquisition boundary inline | localFile, read-only, deny-by-default | Draft |
| AD-5.5 | Five-outcome terminal model; abstention distinct from failure | Draft |
| AD-5.6 | Provenance-chain structural verification; verified-only reporting | Draft |
| AD-5.7 | Multi-dimensional evaluation; no scalar composite | Draft |
| AD-5.8 | Deferred items remain deferred | Draft |

**[NORMATIVE]** No decision here resolves a deferred item (§17, §22.1-§22.5,
Q4.22). No decision finalizes a public API, schema, threshold, scoring formula,
or technology (Specification firewall).

---

## End-of-Document Block

```
PHASE 5 ARCHITECTURE DECISIONS: CREATED (draft)
PHASE 5 ARCHITECTURE STAGE: PENDING OWNER ACCEPTANCE
HISTORICAL ARCHITECTURE DECISIONS RECOVERED: NO (NOT RECOVERABLE; not reconstructed)
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