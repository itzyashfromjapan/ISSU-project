# ISSU — Phase 4: Research Agent Module — Specification

**Phase:** 4 — Research Agent Module
**Stage:** SPECIFICATION (owner-authorized 2026-08-15)
**Status:** Draft — awaiting Specification acceptance
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative inputs:** Accepted `./ARCHITECTURE.md` (immutable during this stage); accepted `./DECISIONS.md` (AD-4.1–AD-4.6); completed Research Q1–Q7 (audited PASS); frozen Phase 1/2/3 public contracts; Phase 4 Specification-stage definition
**License:** Apache License 2.0

This specification converts the accepted Phase 4 Architecture into
**implementable contracts without implementing them**. It is authoritative for
the Research Agent Module contract once accepted by the owner.

---

## 1. Purpose

**[DECISION]** This document is the authoritative specification of the Phase 4
Research Agent Module. It defines the module's public contract, data model,
behavioral contracts, quality/verification criteria, and Implementation handoff
conditions, derived exclusively from the accepted Architecture (Q4.1–Q4.26) and
completed Research Q1–Q7.

It SHALL NOT be read as authorizing implementation. Implementation is governed
by the Implementation handoff conditions (§18) and a separate owner
authorization.

---

## 2. Scope

**[DECISION]** This specification covers, in order:

1. Module identity and public contract (§3–§4).
2. Frozen-contract consumption (§5).
3. Module boundary and non-goals (§6–§7).
4. Data model (§8).
5. Evidence/source model (§9).
6. Citation/support model (§10).
7. Research-task lifecycle (§11).
8. Behavioral contracts (§12).
9. Failure semantics (§13).
10. Security/privacy (§14).
11. Determinism/reproducibility (§15).
12. Evaluation/quality (§16).
13. Acceptance criteria (§17).
14. Implementation handoff (§18).
15. Deferred items (§19).
16. Unresolved questions (§20).

**[FACT]** Every item delegated to Specification by Architecture §19 is resolved
here or explicitly carried as UNRESOLVED (§20). No item outside that delegation
is finalized.

---

## 3. Module Identity

**[DECISION]** The Phase 4 module is:

- **Name:** Research Agent Module.
- **Folder:** `phase-04/`.
- **Package name:** `@issue/research` (finalized here from Architecture Q4.1
  candidate; consistent with the `@issue/<phase-name>` convention and Phase 3
  `DECISIONS.md` D3.1 precedent).
- **Version:** follows the repo-wide `VERSION` convention (Phase 1 `VERSION`).

**[FACT]** Rationale: Architecture Q4.1 selected the `@issue/<phase-name>`
naming convention (`@issue/research` candidate) and left the exact package name
to Specification. This resolves that delegation.

**[INFERENCE]** The package name follows the frozen Phase 1/2/3 naming precedent
(`@issue/foundation`, `@issue/tool-runtime`, `@issue/integration`).

---

## 4. Public Contract

**[DECISION]** The module's public surface is exposed through a single public
barrel. The following exports are the **authoritative public contract**:

| Export                              | Kind      | Responsibility                                                                                                      |
| ----------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| `VERSION`                           | const     | Module version constant.                                                                                            |
| `runResearchTask(request, options)` | function  | Main orchestrator entry point: drives a research task through the §11 lifecycle and returns a `ResearchTaskResult`. |
| `ResearchTaskRequest`               | type      | Authorized research task input (§8.1).                                                                              |
| `ResearchTaskOptions`               | type      | Runtime options: logging, provider seam, abort signal (§12.1).                                                            |
| `ResearchTaskResult`                | type      | Terminal research outcome: report, claims, evidence, evaluation record, abstention status (§8.6).                   |
| `Claim`                             | type      | Atomic claim record (§8.2).                                                                                         |
| `EvidenceLink`                      | type      | Claim-to-evidence mapping (§8.3).                                                                                   |
| `SourceReference`                   | type      | Source provenance record (§8.4).                                                                                    |
| `CredibilityProfile`                | type      | Multidimensional source evaluation record (§8.5).                                                                   |
| `ConflictRecord`                    | type      | Cross-document contradiction/gap record (§8.7).                                                                     |
| `EvaluationRecord`                  | type      | Per-dimension quality evaluation record (§8.8).                                                                     |
| `ResearchDecisionProvider`          | interface | Provider seam for research decision points (§12.4).                                                                 |
| `ResearchTaskStatus`                | type      | Research-task lifecycle state (§11).                                                                                |
| `SupportClass`                      | type      | Non-binary claim support classification (§10.2).                                                                    |

**[DECISION]** Every other symbol is internal and SHALL NOT be imported by
consumers (consistent with the barrel-only precedent, Phase 2 §17.3).

**[ACKNOWLEDGED REFINEMENT (F1)]** `ResearchDecisionProvider` is an **additional
Phase 4 abstraction** (research decision points: source selection, claim
verification ordering). The frozen Phase 2 `DecisionProvider` seam
(`selectAction`/`assess`) remains **unchanged** and is consumed barrel-only
(§5); real model/provider binding stays **deferred** (§19.4; Q4.22; D3.2). This
is an intentional specification-level refinement of Architecture Q4.22, not a
modification of the frozen contract.

**[UNRESOLVED]** Exact parameter types of `runResearchTask` beyond the §8 data
model are refined at Implementation under the constraints in §18. This is not a
new delegation; it is the mechanical expansion of the contracts defined here.

---

## 5. Frozen-Contract Consumption

**[DECISION]** Phase 4 consumes the frozen public surfaces **barrel-only**:

| Frozen package                  | Consumed surface                                                                                                                            | Purpose                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `@issue/foundation` (Phase 1)   | `Logger`, `Result`/`ok`/`err`/`isOk`/`isErr`/`match`, `AppError`, `isAppError`, `toError`, `assertContained`/`isContained`, `redactionList` | Logging; error discipline; path containment; redaction.                                 |
| `@issue/tool-runtime` (Phase 2) | `DecisionProvider`, `ActionRef`, `ToolOperation`, `ToolResult`, `OutcomeClass`, `TaskStatus` (type-only reference)                          | Provider seam types; read/list tool result types.                                       |
| `@issue/integration` (Phase 3)  | `runIntegrationTask`, `createDeterministicProviderStub`, `DEFAULT_BOUNDS`, `translateToolError`, `isFailedToolResult`                       | Deterministic integration seam for bounded read/list execution; AD-1 error translation. |

**[NORMATIVE]** Phase 4 SHALL:

- Import frozen packages **only** through their public package barrels
  (`@issue/foundation`, `@issue/tool-runtime`, `@issue/integration`).
- Perform **zero deep imports** of any internal module of Phase 1/2/3.
- Never reimplement frozen behavior; only compose it through public surfaces.

**[NORMATIVE]** Allowed dependencies are limited to the three frozen packages and
the Node.js standard library. No additional runtime dependency may be introduced
without separate owner authorization. (AD-4.1.)

---

## 6. Module Boundary

**[DECISION]** The Research Agent Module is responsible for executing **research
tasks**: planning and query refinement, external evidence retrieval, source
evaluation, evidence-grounded synthesis, citational traceability,
contradiction/gap handling, reliability mechanisms, and multi-dimensional
quality evaluation — within ISSU's governed boundaries (Architecture §5).

The module consumes the frozen Phase 3 integration seam for bounded filesystem
read/list execution when a research task requires it (Architecture Q4.5).

---

## 7. Non-Goals

**[NON-GOAL]** Phase 4 SHALL NOT include (carried from Architecture §6):

- CLI / end-user entry point (§22.1 — deferred).
- Configuration-file schema (§22.2 — deferred).
- Write/edit/delete filesystem mutation, process execution, Git (§22.3 —
  deferred).
- Model-provider binding (§22.4 — deferred; Q4.22).
- Workspace/monorepo adoption (§22.5 — deferred).
- Memory subsystem / cross-run persistence (Phase 2 §19.2).
- Multi-agent systems / agent roles (Phase 2 §19.10).
- Generalized planning engine (Phase 2 §19.9); research planning is bounded to
  the §11 lifecycle.
- Plugin framework / dynamic module loading (Phase 2 §19.8).
- Code generation / modification (Phase 2 §19.7).
- Performance benchmarking infrastructure (Phase 2 §19.15).
- Publishing / distribution (Phase 2 §19.12).

**[NORMATIVE]** Resolving any deferred item requires a separate owner
authorization and a Phase 4 `DECISIONS.md` entry (§19).

---

## 8. Data Model

This section finalizes the data structures delegated by Architecture §19 and
Q4.10–Q4.12. For every field: name, type, meaning, required/optional, invariants,
validation constraints.

### 8.1 ResearchTaskRequest

**[DECISION]**

| Field           | Type                                                     | Meaning                                                                  | Req                                 | Invariants / validation                                                                       |
| --------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `prompt`        | `string`                                                 | Research question/objective (non-empty).                                 | required                            | Trimmed length ≥ 1. Used as the research goal; never used to derive tool actions outside §12. |
| `refs`          | `TaskRefs` (Phase 2)                                     | Optional frozen read/list targets when the task requires tool execution. | optional                            | If present, must pass Phase 2 containment semantics.                                          |
| `includeHidden` | `boolean`                                                | Default for any `listDirectory` in scope.                                | optional (default `false`)          | —                                                                                             |
| `bounds`        | `ResourceBounds` (Phase 2) or `DEFAULT_BOUNDS` (Phase 3) | Execution resource bounds.                                               | optional (default `DEFAULT_BOUNDS`) | Must satisfy Phase 2 §12 invariants.                                                          |
| `sources`       | `SourceSelector`                                         | Retrieval scope/filtering intent.                                        | optional                            | Validated against §9 policies.                                                                |

**[UNRESOLVED]** `SourceSelector` exact shape is a §20 item (retrieval scope
policies); a structural default (no external retrieval) is defined in §9.

### 8.2 Claim

**[DECISION]**

| Field        | Type                  | Meaning                                        | Req                      | Invariants / validation                                            |
| ------------ | --------------------- | ---------------------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| `id`         | `string`              | Stable claim identifier.                       | required                 | Unique within a task result.                                       |
| `text`       | `string`              | Atomic claim text.                             | required                 | Non-empty; represents one verifiable statement.                    |
| `support`    | `SupportClass`        | Support classification (§10.2).                | required                 | One of the §10.2 values.                                           |
| `confidence` | `number \| undefined` | Confidence signal alongside the claim (§12.8). | optional                 | If present, in [0,1]. Not a correctness guarantee (§12.8).         |
| `abstained`  | `boolean`             | True if claim-level abstention applies.        | optional (default false) | When true, `support` SHALL be `UNCERTAIN`.                         |
| `sources`    | `SourceReference[]`   | Supporting/contradicting source references.    | required                 | At least one; empty array permitted only when `abstained` is true. |

**[NORMATIVE]** Claims are atomic: each `Claim` encodes exactly one verifiable
statement (Architecture Q4.10; Research Q5/Q7 atomic-fact decomposition).

### 8.3 EvidenceLink

**[DECISION]**

| Field      | Type                      | Meaning                                                   | Req      | Invariants / validation                          |
| ---------- | ------------------------- | --------------------------------------------------------- | -------- | ------------------------------------------------ |
| `claimId`  | `string`                  | Claim this link attaches to.                              | required | References an existing `Claim.id`.               |
| `sourceId` | `string`                  | Source reference id.                                      | required | References an existing `SourceReference.id`.     |
| `location` | `string`                  | Evidence location pointer (passage/span/page marker).     | optional | When absent, attribution is document-level only. |
| `kind`     | `"direct" \| "secondary"` | Whether evidence is direct or via an intermediary source. | required | —                                                |
| `strength` | `SupportClass`            | Strength of this single link.                             | required | §10.2 values.                                    |

**[NORMATIVE]** Claim-level traceability with evidence-location pointers is the
target (Architecture Q4.11; Research Q2 VISA / Q5). A claim may have multiple
`EvidenceLink`s (multi-source attribution, Architecture Q4.13).

### 8.4 SourceReference

**[DECISION]**

| Field          | Type                                | Meaning                       | Req      | Invariants / validation          |
| -------------- | ----------------------------------- | ----------------------------- | -------- | -------------------------------- |
| `id`           | `string`                            | Stable source identifier.     | required | Unique within a task result.     |
| `title`        | `string`                            | Source title.                 | required | Non-empty.                       |
| `organization` | `string \| undefined`               | Publishing organization.      | optional | —                                |
| `authors`      | `string[]`                          | Author names.                 | optional | —                                |
| `publishedAt`  | `string \| undefined`               | Publication date (ISO 8601).  | optional | If present, valid ISO 8601 date. |
| `url`          | `string \| undefined`               | Source URL.                   | optional | If present, valid absolute URL.  |
| `role`         | `"primary" \| "secondary"`          | Source role metadata (§10.3). | required | —                                |
| `freshness`    | `"current" \| "stale" \| "unknown"` | Freshness signal (§12.6).     | required | —                                |
| `credibility`  | `CredibilityProfile`                | Multidimensional evaluation.  | required | §8.5.                            |

### 8.5 CredibilityProfile

**[DECISION]**

| Field            | Type                                   | Meaning                             | Req      | Invariants / validation                                 |
| ---------------- | -------------------------------------- | ----------------------------------- | -------- | ------------------------------------------------------- |
| `sourceId`       | `string`                               | Source this profile evaluates.      | required | References existing `SourceReference.id`.               |
| `dimensions`     | `Record<CredibilityDimension, number>` | Per-dimension scores.               | required | Each value in [0,1]; keys from the fixed dimension set. |
| `dimensionNotes` | `Record<CredibilityDimension, string>` | Human-readable basis per dimension. | optional | —                                                       |

**[DECISION]** `CredibilityDimension` is the fixed set: `expertise`,
`trustworthiness`, `bias`, `transparency`, `date`, `provenance` (Architecture
Q4.9; Research Q2 Sources 10–11). No single composite reputation score is
defined (AD-4.4).

**[UNRESOLVED]** Weighting of dimensions into any combined signal is a §20 item;
the profile is per-dimension by design.

### 8.6 ResearchTaskResult

**[DECISION]**

| Field        | Type                  | Meaning                           | Req                      | Invariants / validation                                     |
| ------------ | --------------------- | --------------------------------- | ------------------------ | ----------------------------------------------------------- |
| `state`      | `ResearchTaskStatus`  | Terminal lifecycle state (§11).   | required                 | SHALL be a terminal status.                                 |
| `report`     | `string \| undefined` | Synthesized report text.          | optional                 | Absent only when `state.status` is `FAILED` or `CANCELLED`. |
| `claims`     | `Claim[]`             | Atomic claims produced.           | required                 | May be empty only when the task failed/aborted or abstained (§12.9). |
| `evidence`   | `EvidenceLink[]`      | Claim-to-evidence mappings.       | required                 | Every link references an existing claim and source.         |
| `sources`    | `SourceReference[]`   | Sources retrieved/evaluated.      | required                 | May be empty for failed/aborted tasks.                      |
| `conflicts`  | `ConflictRecord[]`    | Contradiction/gap records.        | required                 | Empty array when none detected.                             |
| `evaluation` | `EvaluationRecord`    | Per-dimension quality evaluation. | required                 | §8.8.                                                       |
| `abstained`  | `boolean`             | Whole-task abstention flag.       | optional (default false) | When true, `state.status` SHALL be `PARTIAL` (§11).         |

**[NORMATIVE]** A task that abstains (§12.9) terminates `PARTIAL` with
`abstained: true` and an empty `claims` array; empty `claims` is therefore also
permitted under abstention, in addition to the failed/aborted cases above.

### 8.7 ConflictRecord

**[DECISION]**

| Field         | Type                                        | Meaning                              | Req      | Invariants / validation                   |
| ------------- | ------------------------------------------- | ------------------------------------ | -------- | ----------------------------------------- |
| `id`          | `string`                                    | Stable conflict identifier.          | required | Unique within a task result.              |
| `kind`        | `"contradiction" \| "gap" \| "weak-signal"` | Conflict/gap type.                   | required | —                                         |
| `claimIds`    | `string[]`                                  | Claims involved.                     | required | At least one; references existing claims. |
| `sourceIds`   | `string[]`                                  | Sources involved.                    | required | At least one.                             |
| `description` | `string`                                    | Human-readable conflict description. | required | Non-empty.                                |

**[NORMATIVE]** Contradictions are surfaced explicitly, never silently flattened
(Architecture Q4.13; Research Q5 CAMS / Q6 Datadog distinction).

### 8.8 EvaluationRecord

**[DECISION]**

| Field            | Type                                  | Meaning                 | Req      | Invariants / validation                       |
| ---------------- | ------------------------------------- | ----------------------- | -------- | --------------------------------------------- |
| `dimensions`     | `Record<EvaluationDimension, number>` | Per-dimension scores.   | required | Each value in [0,1]; keys from the fixed set. |
| `dimensionNotes` | `Record<EvaluationDimension, string>` | Basis per dimension.    | optional | —                                             |
| `method`         | `"automated" \| "human" \| "hybrid"`  | Evaluation method used. | required | —                                             |

**[DECISION]** `EvaluationDimension` is the fixed set (Architecture Q4.20;
Research Q7): `factualCorrectness`, `claimSupport`, `citationAccuracy`,
`citationCompleteness`, `sourceQuality`, `traceability`, `contradictionHandling`,
`uncertainty`, `calibration`, `abstention`, `recallCompleteness`,
`reasoningQuality`, `reportQuality`, `humanAssessment`, `reproducibility`,
`freshness`, `costLatency`, `failureTolerance`.

**[NORMATIVE]** `humanAssessment` is a scored dimension (0 if no human review was
performed, in [0,1] when human evaluation contributed), reconciled against
AD-4.6/Q4.20. The `method` field records whether the evaluation run was
automated, human, or hybrid; it does not replace the dimension. The human-review
escalation workflow is defined in §12.12.

**[NORMATIVE]** No single scalar composite is the sole success criterion
(AD-4.6; Research Q7). §16 defines how the dimensions are used in evaluation.

---

## 9. Evidence / Source Model

**[DECISION]** The module treats all externally retrieved content as **untrusted
input** (Architecture Q4.24; Research Q6 §3.13).

- Retrieval is a distinct component with explicit source selection/filtering
  (Architecture Q4.8).
- Sources are evaluated multidimensionally into `CredibilityProfile`s (AD-4.4).
- Provenance is mandatory: every claim maps to evidence via `EvidenceLink` and
  `SourceReference` (AD-4.5).
- Evidence integrity: retrieved content is validated before grounding; content
  that fails validation is excluded from evidence (Architecture Q4.24).

**[DECISION]** Default retrieval scope is **no external retrieval** unless a
`SourceSelector` is provided. This preserves determinism by default (AD-4.6,
§15) and avoids silent network dependence.

**[UNRESOLVED]** Concrete web search provider(s), API, query protocol, and rate
limits remain a §20 item and are NOT resolved here (consistent with the deferred
model/provider category; §19.4 and Q4.7).

---

## 10. Citation / Support Model

### 10.1 Citation representation

**[DECISION]** Citations are **inline numbered markers** `[n]` referencing
`SourceReference`s (Architecture Q4.12; Research Q5). Markers are resolved
against the task result's `sources` array. Citation style beyond the marker
mechanism (e.g., bibliographic formatting) is a §20 item.

### 10.2 Support classification

**[DECISION]** Claim support uses the non-binary **4-class** scheme
(AD-4.5; Research Q5 SemanticCite):

| Label                 | Meaning                                         |
| --------------------- | ----------------------------------------------- |
| `SUPPORTED`           | Evidence directly supports the claim.           |
| `PARTIALLY_SUPPORTED` | Evidence supports part of the claim.            |
| `UNSUPPORTED`         | No supporting evidence; contradicted or absent. |
| `UNCERTAIN`           | Evidence is ambiguous or insufficient.          |

Binary SUPPORTS/REFUTES classification is rejected (Research Q5 §1; AD-4.5).

### 10.3 Source-role metadata

**[DECISION]** Each `SourceReference.role` is `primary` (original data/direct
evidence) or `secondary` (interpretation/synthesis). Roles are recorded as
metadata; they are not by themselves a correctness determination (Research Q5).

### 10.4 Claim/evidence rules

**[NORMATIVE]** For every claim:

- `claim.sources` SHALL reference at least one source unless `claim.abstained`
  is true.
- Every `EvidenceLink` SHALL be consistent with the claim's `support`
  classification (a `SUPPORTED` claim SHALL have at least one direct
  `strength` link).
- Contradictory evidence SHALL be surfaced as a `ConflictRecord`, not removed
  (Q4.13).

---

## 11. Research-Task Lifecycle

**[DECISION]** The module drives a research task through a **research-specific
lifecycle** (Architecture Q4.6; the frozen Phase 2 nine-state machine is NOT
extended or reused; this is a Phase 4 type):

```
READY → PLANNING → RETRIEVING → EVALUATING_SOURCES → SYNTHESIZING →
VERIFYING → EVALUATING → (REPLANNING loop) → COMPLETED | PARTIAL | FAILED | CANCELLED
```

**[DECISION]** `ResearchTaskStatus` values:

- `READY`, `PLANNING`, `RETRIEVING`, `EVALUATING_SOURCES`, `SYNTHESIZING`,
  `VERIFYING`, `EVALUATING` — active states.
- `REPLANNING` — refinement loop (query refinement, gap-driven re-planning;
  returns to `RETRIEVING`).
- `COMPLETED`, `PARTIAL`, `FAILED`, `CANCELLED` — terminal states.

**[NORMATIVE]**

- `COMPLETED`: report + claims + evidence + evaluation produced; abstention
  false.
- `PARTIAL`: task completed with abstention or unresolved items; `abstained`
  true or unresolved claims remain (Architecture Q4.19).
- `FAILED`: terminal failure; no usable report (Architecture Q4.19 failure
  semantics; §13).
- `CANCELLED`: aborted by caller.
- Active states SHALL NOT be terminal; the lifecycle SHALL NOT skip, reorder, or
  invent transitions; any disallowed transition is an internal error (§13).

**[INFERENCE]** A research-specific lifecycle is warranted because research-task
semantics (plan/retrieve/synthesize/verify) differ from the frozen Phase 2
filesystem read/list task machine; reusing the Phase 2 machine would misrepresent
research states.

---

## 12. Behavioral Contracts

### 12.1 Orchestration (`runResearchTask`)

**[DECISION]** `runResearchTask(request, options)`:

- **Inputs:** `ResearchTaskRequest`; `ResearchTaskOptions` (logger, provider
  seam, abort signal).
- **Outputs:** `ResearchTaskResult` (terminal state guaranteed).
- **Behavior:** drives the §11 lifecycle; coordinates retrieval, source
  evaluation, claim/evidence production, synthesis, verification, and
  evaluation; records each behavior's outputs into the §8 data model.
- **Invariants:** the returned `state.status` SHALL be terminal; the result
  SHALL be internally consistent (§8 cross-reference invariants).
- **Failure:** any unrecoverable error maps to `FAILED` with a Phase 1
  `AppError`-compatible error via `translateToolError`/`isFailedToolResult`
  where the failure originates in the Phase 3 seam (§13).

### 12.2 Retrieval / source handling

**[DECISION]** Retrieval:

- **Inputs:** query/refinement directives, `SourceSelector` (if any).
- **Outputs:** candidate `SourceReference`s (untrusted, unvalidated).
- **Behavior:** executes the §9 default scope; applies selection/filtering;
  produces source metadata.
- **Failure:** retrieval errors are recorded; on unrecoverable retrieval failure
  the task FAILs or abstains per §13/§12.9.
- **Observable result:** `ResearchTaskResult.sources`.

### 12.3 Credibility behavior

**[DECISION]** Source evaluation:

- **Inputs:** candidate sources + metadata.
- **Outputs:** `CredibilityProfile` per source.
- **Behavior:** evaluates the fixed dimensions (§8.5); no composite score.
- **Failure:** a source that cannot be evaluated receives an all-`unknown`-grade
  profile and is flagged; it may be excluded from grounding if it fails the
  evidence-validation gate (§9, §12.13).
- **Observable result:** `SourceReference.credibility`.

### 12.4 Provider seam

**[DECISION]** Research decision points (e.g., which source to prioritize,
which claim to verify next) are resolved through a **`ResearchDecisionProvider`
seam**:

- `selectSource(available, state)`, `selectClaimToVerify(claims, state)`,
  `assess(claim, evidence, state)` — deterministic contract.
- Default behavior uses a **deterministic stub** consistent with the Phase 3
  `createDeterministicProviderStub` pattern (Architecture Q4.22; Phase 3 §30).

**[ACKNOWLEDGED REFINEMENT (F1)]** `ResearchDecisionProvider` is an additional
Phase 4 abstraction, not a replacement for the frozen Phase 2 `DecisionProvider`.
The frozen seam (`selectAction`/`assess`) is unchanged and remains the model
integration contract; `ResearchDecisionProvider` handles research-specific
decision points (source priority, claim verification ordering) that the frozen
tool-action contract does not express. Both operate deterministically by default
and both leave model/provider binding deferred (§19.4; Q4.22; D3.2).

**[NORMATIVE]** No model/provider is bound. Concrete model binding remains
deferred (§19.4; Q4.22; D3.2). The seam exists to allow later binding without
contract change.

**[UNRESOLVED]** Whether/when to authorize real model binding is an Owner
decision (§20).

### 12.5 Claim/evidence behavior

**[DECISION]** Claim production and evidence mapping:

- **Inputs:** research outputs, validated evidence.
- **Outputs:** `Claim[]` + `EvidenceLink[]`.
- **Behavior:** decomposes output into atomic claims; maps each to evidence with
  a support classification and evidence-location pointers (AD-4.5).
- **Failure:** claims without evidence are classified `UNSUPPORTED` or
  `UNCERTAIN`, or trigger abstention (§12.9). Fabricated/unverifiable citations
  are rejected (§13).
- **Observable result:** `ResearchTaskResult.claims` / `.evidence`.

### 12.6 Citation / traceability / freshness behavior

**[DECISION]**

- Citations are inline markers (§10.1).
- Freshness is tracked per source (`current`/`stale`/`unknown`); retractions and
  corrections are surfaced as `ConflictRecord`s where detectable (Research Q5
  §8.4, Q6 §3.12). Freshness checks depend on external service availability;
  when unavailable, freshness is `unknown` and the evidence remains usable but
  flagged.

**[UNRESOLVED]** Freshness checking authority/frequency is a §20 item.

### 12.7 Contradiction / gap handling

**[DECISION]**

- **Inputs:** claims + evidence across sources.
- **Outputs:** `ConflictRecord[]`.
- **Behavior:** detects cross-document contradictions, gaps, and weak signals;
  distinguishes contradictions from unsupported claims (Research Q6 Datadog;
  Q5 CAMS); surfaces rather than flattens (Q4.13).
- **Failure:** contradictory evidence SHALL NOT be silently dropped (§10.4).

### 12.8 Confidence / uncertainty behavior

**[DECISION]**

- Each claim carries an optional `confidence` in [0,1] (§8.2).
- Confidence is a **signal for prioritization and escalation**, not a
  correctness guarantee (Research Q6: calibration not automatic; Q7 hedging
  failure).
- Calibration is not assumed; confident-but-wrong claims remain possible and are
  caught by verification (§12.5, §13) and evaluation (§16).

**[UNRESOLVED]** Confidence scoring formula and calibration method are a §20
item.

### 12.9 Abstention behavior

**[DECISION]**

- When evidence is insufficient to support a claim, the module **abstains**
  rather than hallucinating: the claim is classified `UNCERTAIN` with
  `abstained: true`, or the whole task terminates `PARTIAL` (Architecture
  Q4.19; Research Q6 abstention / Q7 abstention dimension).
- Abstention is a distinct terminal outcome, not a failure.
- Premature stopping (under-retrieval) is treated as a gap signal (`ConflictRecord
kind = "gap"`) rather than silent completion (Research Q7 DeepSearchQA).

**[UNRESOLVED]** Target abstention rate and exact stopping criteria are §20
items; no numeric threshold is set here.

### 12.10 Synthesis behavior

**[DECISION]**

- **Inputs:** validated claims, evidence, credibility profiles.
- **Outputs:** synthesized report text with inline citations.
- **Behavior:** evidence-grounded synthesis (Architecture Q4.15). Candidate
  technique: quote-then-answer grounding (Research Q5/Q6). Synthesis SHALL NOT
  introduce claims beyond the evidence set; new claims must be re-verified.
- **Failure:** synthesis that references unverified/unsupported evidence is
  rejected by verification (§12.5, §13) and evaluation (§16).

### 12.11 Evaluation behavior

**[DECISION]**

- **Inputs:** task result (report, claims, evidence, citations, sources,
  conflicts).
- **Outputs:** `EvaluationRecord` across the fixed dimension set (§8.8).
- **Behavior:** multi-dimensional evaluation (AD-4.6; Research Q7). Each
  dimension is scored independently in [0,1] with notes.
- **Failure:** evaluation failure does not invalidate the research result; it is
  recorded and the result carries an incomplete evaluation flag.

**[UNRESOLVED]** Dimension weights, pass/fail thresholds, and scoring formulas
are §20 items; no scalar composite is defined (§8.8).

### 12.12 Human review / escalation behavior

**[DECISION]**

- Human-in-the-loop escalation is a component (Architecture Q4.21; Research Q6
  HITL).
- Escalation is driven by confidence and evaluation signals (low confidence,
  contradictions, high-stakes flags); it is **not** mandatory full review
  (Research Q6 §5.5).
- Escalated items are surfaced for human decision; human decisions update the
  affected claims/conflicts/evaluation.

**[UNRESOLVED]** Exact escalation criteria, review workflow, and human evaluation
gates are a §20 item.

### 12.13 Security behavior

**[DECISION]**

- Retrieved content is untrusted; it is validated before grounding
  (Architecture Q4.24; Research Q6 §3.13: prompt injection, evidence poisoning,
  semantic DDoS).
- Evidence integrity: content failing validation is excluded; validation failure
  is logged.
- Redaction: `redactionList` (Phase 1) applies to any logged content.

**[UNRESOLVED]** Exact validation depth and sandboxing are §20 items.

### 12.14 Privacy / retention behavior

**[DECISION]**

- Queries, retrieved content, and evidence records are subject to a retention
  policy; no data is persisted across runs (no memory subsystem, Phase 2
  §19.2).
- Sensitive data in logs is redacted (Phase 1 `redactionList`).

**[UNRESOLVED]** The full retention/redaction policy is a §20 item (Architecture
Q4.25; Research Q4 Source 3 privacy risk).

---

## 13. Failure Semantics

**[DECISION]** Failures are classified as:

| Class                  | Meaning                 | Result                                         |
| ---------------------- | ----------------------- | ---------------------------------------------- |
| `recoverable`          | Retryable within bounds | retried per bounds; then escalation to failure |
| `nonRecoverable`       | Permanent               | terminal `FAILED`                              |
| `evidenceInsufficient` | Not a failure           | abstention (§12.9), terminal `PARTIAL`         |
| `cancelled`            | Caller abort            | terminal `CANCELLED`                           |

**[NORMATIVE]**

- Errors originating in the Phase 3 seam use Phase 3 `translateToolError` /
  `isFailedToolResult` to produce Phase 1 `AppError`-compatible errors
  (Architecture Q4.5; Phase 3 §28).
- The frozen Phase 2 `OutcomeClass` set (`success`, `invalidContent`,
  `notFound`, `accessDenied`, `tooLarge`, `invalidInput`, `executionError`,
  `internalError`) is referenced for tool-result classification where the Phase
  3 seam is used.
- No error message embeds content or secrets (Phase 2 §13 principle; Phase 1
  `AppError` discipline).

---

## 14. Security / Privacy

**[DECISION]** Consolidated security/privacy contracts (Architecture Q4.24,
Q4.25; §12.13–§12.14):

1. Untrusted-input model for retrieved content.
2. Validation before grounding; evidence integrity.
3. Redaction of logged content.
4. No cross-run persistence; no memory subsystem.
5. Privacy treatment for queries and retrieved content (retention policy — §20).

**[NORMATIVE]** These contracts are architectural (threat model) with mechanistic
details delegated to §20/Implementation.

---

## 15. Determinism / Reproducibility

**[DECISION]** Phase 4 preserves deterministic seams where feasible (Architecture
Q4.23; Research Q7):

- Default behavior uses the deterministic provider seam and the deterministic
  Phase 3 integration seam (AD-4.1, Q4.22).
- Default retrieval scope is no external retrieval (§9), keeping the default
  path deterministic.
- Where external retrieval is enabled, results may be non-deterministic; this is
  recorded as an evaluation limitation.
- Reproducibility is an evaluation dimension (`reproducibility` in §8.8).

**[UNRESOLVED]** Frozen evaluation environment (e.g., RetroSearch-style),
pass@k consistency requirement, and reproducibility level are §20 items.

---

## 16. Evaluation / Quality

**[DECISION]** Research quality is evaluated across the fixed `EvaluationDimension`
set (§8.8), each scored in [0,1] independently (AD-4.6). No single scalar
composite is defined.

**[NORMATIVE]**

- Evaluation SHALL NOT reduce to Phase 3 code-quality gates. Phase 3's gates
  (check, coverage ≥ 80%, build, audit, `git diff --check`) apply to Phase 4's
  _own_ quality process at Implementation, but they are **not** research-quality
  criteria. Research quality is judged by the §8.8 dimensions.
- The two metric families are kept distinct: (1) research-quality evaluation
  (this section); (2) engineering-quality gates (Implementation handoff, §18).

**[UNRESOLVED]** Weights, thresholds, pass/fail criteria, scoring formulas, and
the evaluation environment (static/dynamic/hybrid) are §20 items (Architecture
Q4.20; Research Q7).

---

## 17. Acceptance Criteria

**[DECISION]** The Phase 4 Specification is acceptable when:

1. Every Architecture §19 input is resolved or explicitly carried as UNRESOLVED
   with reason (§20).
2. No accepted Architecture decision (Q4.1–Q4.26, AD-4.1–AD-4.6) is contradicted.
3. No deferred §22 item is resolved (§19).
4. The public contract (§4) and data model (§8) are internally consistent and
   traceable to Architecture.
5. The §11 lifecycle and §12 behaviors are implementable without implementing
   them.
6. The two audit non-blocking findings (DECISIONS.md:52 stale `§3.8` ref →
   `§4.5`; ARCHITECTURE.md:122 untraceable "ROOT methodology rule #3" citation)
   are recorded for correction as part of acceptance documentation handling.

**[INFERENCE]** Acceptance criteria 1–5 follow directly from the completed
Specification-stage definition §H; criterion 6 preserves the owner-accepted audit
findings.

**[UNRESOLVED]** Exact research-quality pass/fail thresholds and scoring formulas
remain §20; their finalization SHALL be subject to owner acceptance of §20
resolution.

---

## 18. Implementation Handoff

**[DECISION]** Implementation may be considered **authorized** only after ALL of:

1. Owner acceptance of this specification.
2. A separate, explicit Implementation authorization decision (per the Phase 4
   governance pattern; not inferred as automatic).
3. All §17 acceptance criteria verified.
4. Any §20 item required for implementation is resolved or explicitly deferred.
5. No deferred §22 item has been resolved without separate authorization.

**[NORMATIVE]** Implementation SHALL then be governed by BLUEPRINT §33
discipline and, for the module's engineering quality, the Phase 3-pattern quality
gates (check, coverage, build, audit, `git diff --check`) — applied to Phase 4's
own artifacts, not imported as research-quality criteria (§16).

---

## 19. Deferred Items

**[FACT / DEFERRED]** Carried forward unchanged from Phase 2 §22 (Phase 3
`SPECIFICATION.md` §6; Phase 3 `DECISIONS.md` D3.2; Architecture §16):

- §22.1 CLI / end-user entry point.
- §22.2 configuration-file schema.
- §22.3 write/execute/Git/network tooling (Phase 4's _research_ network use is a
  separate capability under §9, not the deferred tooling category).
- §22.4 model-provider binding (Q4.22; §12.4).
- §22.5 workspace/monorepo adoption.

**[NORMATIVE]** None is resolved here. Resolving any requires a separate owner
authorization and a Phase 4 `DECISIONS.md` entry.

---

## 20. Unresolved Questions

**[UNRESOLVED]** Traceability of every Architecture §20 register item (and each
Architecture §19 input not resolved in this Specification) to its disposition
here — **resolved** or **carried unresolved with reason**. Item numbering
matches Architecture §20 where applicable:

| Arch §20 / §19 item                                                              | Disposition        | Where / reason                                                                                                      |
| -------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| 1. Exact public API and exports                                                  | resolved           | §4 (public contract)                                                                                                |
| 2. Claim/evidence/source/citation/credibility/conflict/evaluation schemas        | resolved           | §8–§10                                                                                                              |
| 3. Citation granularity balance (Q4.11; Q5 §8.1)                                 | carried            | §20 #12 — granularity target set (claim-level with evidence-location pointers); exact span policy unresolved        |
| 4. Classification scheme depth (4-class vs expanded; Q4.12)                      | resolved           | §10.2 — 4-class (`SUPPORTED`, `PARTIALLY_SUPPORTED`, `UNSUPPORTED`, `UNCERTAIN`)                                    |
| 5. Citation-density threshold (Q4.12; Q5 §8.6)                                   | carried            | §20 #3 — thresholds are Specification+Owner                                                                         |
| 6. Multi-source attribution distribution (Q4.13; Q5 §8.7)                        | carried            | §20 #13 — multi-source attribution supported; distribution policy unresolved                                        |
| 7. Verification depth and automation split (Q4.17; Q5 §8.8)                      | carried            | §20 #14                                                                                                             |
| 8. Confidence scoring and calibration method (Q4.18)                             | carried            | §20 #5                                                                                                              |
| 9. Abstention criteria and target rate (Q4.19)                                   | carried            | §20 #6                                                                                                              |
| 10. Quality-evaluation metric set, weights, thresholds, scoring formulas (Q4.20) | resolved           | metric set resolved (§8.8, incl. `humanAssessment` reconciled per F4); weights/thresholds/formulas carried (§20 #3) |
| 11. Automated vs human evaluation split (Q4.20/Q4.21; Q7 §12.4)                  | carried            | §20 #7                                                                                                              |
| 12. Evaluation environment: static/dynamic/hybrid (Q4.23; Q7 §12.5)              | carried            | §20 #4                                                                                                              |
| 13. Reproducibility level and pass@k requirement (Q4.23; Q7 §12.8)               | carried            | §20 #4                                                                                                              |
| 14. Source-freshness mechanism (Q5 §8.4, Q6 §3.12)                               | carried            | §20 #8                                                                                                              |
| 15. Primary/secondary source weighting (Q5 §8.5)                                 | carried            | §20 #15                                                                                                             |
| 16. Web search provider/API/scope/rate limits (Q4.7, Q4.8)                       | carried            | §20 #1                                                                                                              |
| 17. Privacy/retention policy (Q4.25)                                             | carried            | §20 #9                                                                                                              |
| 18. Model/provider binding authorization (Q4.22; §22.4, D3.2)                    | carried            | §20 #11                                                                                                             |
| 19. Cost/latency budget and failure-tolerance level (Q7 §12.9–12.10)             | carried            | §20 #16                                                                                                             |
| 20. Whether any scalar composite score is meaningful (Q7 §12.12)                 | resolved           | §8.8 — no single scalar composite is the sole criterion (AD-4.6); weights unresolved (§20 #3)                       |
| 21. Security mitigations detail (Q4.24, Q6 §3.13)                                | carried            | §20 #10                                                                                                             |
| 22. Contradiction representation/weighting (Q4.13; Q5 §8.10)                     | partially resolved | representation resolved (§8.7, §12.7); weighting carried (§20 #13)                                                  |
| 23. Whether frozen Phase 2 nine-state machine is reused (Q4.6)                   | resolved           | §11 — NO; research-specific lifecycle (Phase 4 type); retained for owner confirmation at acceptance                 |
| 24. Any incompatibility discovered at Specification (§4.5)                       | carried            | §20 #14 — none discovered; record any at Implementation                                                             |
| §19 Public API surface                                                           | resolved           | §4                                                                                                                  |
| §19 Data schemas                                                                 | resolved           | §8–§10                                                                                                              |
| §19 Citation schema and style                                                    | resolved           | §10 (marker pattern, 4-class labels, source-role metadata)                                                          |
| §19 Thresholds and criteria                                                      | carried            | §20 #3, #5, #6, #16 (Specification+Owner per Architecture §19 NORMATIVE)                                            |
| §19 Retrieval technology                                                         | carried            | §20 #1, #2                                                                                                          |
| §19 Implementation technology                                                    | carried            | §20 #11, §19 (dependency choices, packaging, tooling deferred)                                                      |
| §19 Evaluation environment                                                       | carried            | §20 #4                                                                                                              |
| §19 Human-review workflow                                                        | carried            | §20 #7                                                                                                              |

**[UNRESOLVED]** Detailed disposition of carried items:

1. **Retrieval provider(s)/API/query protocol/rate limits** (§9) — provider
   selection is deferred (model/provider category, §19.4; Q4.7).
2. **`SourceSelector` exact shape** (§8.1) — depends on item 1.
3. **Dimension weights / composite scoring / pass-fail thresholds / scoring
   formulas / citation-density threshold** (§8.8, §16) — Research Q7 and
   Architecture Q4.20 leave these to Specification + Owner; resolving requires
   owner acceptance of scoring semantics.
4. **Evaluation environment (static/dynamic/hybrid)** and **reproducibility
   level / pass@k requirement** (§15, §16) — Research Q7 §12.5/§12.8; no
   authoritative requirement.
5. **Confidence scoring formula / calibration method** (§12.8) — Research Q6
   documents calibration is not automatic; no ISSU-specific scheme established.
6. **Abstention target rate / stopping criteria / recall-precision balance**
   (§12.9) — Research Q6/Q7 document ranges, not requirements.
7. **Human review escalation criteria / workflow / gates / automated-vs-human
   evaluation split** (§12.12) — Research Q7 §12.4; no authoritative
   requirement.
8. **Freshness checking authority/frequency** (§12.6) — Research Q5 §8.4; no
   authoritative mechanism.
9. **Privacy/retention policy details** (§12.14) — Architecture Q4.25; owner
   decision required.
10. **Security mitigation details / validation depth / sandboxing** (§12.13) —
    Architecture Q4.24; no authoritative mechanism.
11. **Model/provider binding authorization** (§12.4) — §22.4, D3.2; owner
    decision required.
12. **Citation granularity span policy** (§10.1) — granularity target is
    claim-level with evidence-location pointers (Q4.11); exact span policy
    unresolved.
13. **Multi-source attribution distribution / contradiction weighting** (§8.3,
    §8.7) — multi-source attribution and explicit conflict surfacing resolved;
    distribution and weighting policies unresolved.
14. **Verification depth and automation split** (§12.5, §13) — verification
    component resolved; full-text vs sampled and automation split unresolved.
15. **Primary/secondary source weighting** (§10.3) — role metadata resolved;
    weighting policy unresolved.
16. **Cost/latency budget and failure-tolerance level** (§12.2, §13) — no
    authoritative budget; owner decision required.

---

## 21. Specification Status

```
PHASE 4 SPECIFICATION:
ACCEPTED (owner, 2026-08-15)

ARCHITECTURE DECISIONS PRESERVED: Q4.1–Q4.26, AD-4.1–AD-4.6
SPECIFICATION DECISIONS ADDED: AD-4.7, AD-4.8 (DECISIONS.md; AD-4.1–AD-4.6 unchanged)
AUDIT FINDINGS F1–F4: RESOLVED (F1 acknowledged refinement; F2 naming aligned; F3 cross-refs corrected; F4 humanAssessment reconciled)
ARCHITECTURE §19 INPUTS: resolved or carried unresolved (§20) — see verification
DEFERRED §22 ITEMS RESOLVED: NONE
FROZEN PHASE 1/2/3 MODIFIED: NO
BLUEPRINT MODIFIED: NO
SOURCE/TEST/CONFIGURATION ARTIFACTS CREATED: YES (phase-04/src, tests, configuration — deterministic core)
DIAGRAMS CREATED: NO
SPECIFICATION ARTIFACTS CREATED: phase-04/SPECIFICATION.md
IMPLEMENTATION AUTHORIZED: YES (owner, 2026-08-15; deterministic core)
IMPLEMENTATION ACCEPTED: YES (owner, 2026-08-15; deterministic core)
COMMIT/PUSH: NO
```

---

## End-of-Document Block

```
PHASE 4 SPECIFICATION: ACCEPTED
IMPLEMENTATION AUTHORIZED: YES (owner, 2026-08-15; deterministic core)
IMPLEMENTATION ACCEPTED: YES (owner, 2026-08-15; deterministic core)
SOURCE/TEST/CONFIGURATION ARTIFACTS CREATED: YES (phase-04/src, tests, configuration — deterministic core)
DIAGRAMS CREATED: NO
PHASE 1/2/3 MODIFIED: NO
BLUEPRINT MODIFIED: NO
COMMIT/PUSH: NO
```
