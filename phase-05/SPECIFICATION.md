# ISSU - Phase 5: Analytics Agent Module - Specification

**Phase:** 5 - Analytics Agent Module
**Stage:** SPECIFICATION (owner-authorized 2026-08-20)
**Status:** ACCEPTED / FROZEN - README records Phase 5 FROZEN / RELEASE-READY (Owner, 2026-08-20). This stage header historically read 'Draft - awaiting Specification-stage acceptance'; reconciled 2026-08-22 under Owner authorization D4 using that durable acceptance record plus same-session re-verification.
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative inputs:** Accepted Phase 5 DEFINE (`./DEFINE.md`, ACCEPTED
2026-08-20); accepted Phase 5 Research (`./RESEARCH.md`, R5.1-R5.12, ACCEPTED
2026-08-20); accepted Phase 5 Architecture (`./ARCHITECTURE.md` Q5.1-Q5.22,
AD-5.1-AD-5.8, CREATED 2026-08-20); frozen Phase 1/2/3 contracts; Phase 4
CLOSED/FROZEN precedent.
**License:** Apache License 2.0

---

## 1. Purpose

This document specifies the **contractual behavior and measurable requirements**
of the Phase 5 Analytics Agent Module: a deterministic data-acquisition-to-report
pipeline over the frozen Phase 1/2/3 public barrels, exposed as `@issue/analytics`
(DEFINE §4). It translates the accepted Architecture decisions (Q5.1-Q5.22,
AD-5.1-AD-5.8) into a precise, testable Specification.

It does **not** implement, test, or modify anything. Where the accepted
Architecture leaves an item unresolved or deferred, this Specification carries it
forward explicitly (SS20); it does not silently resolve it.

---

## 2. Scope

**[DECISION]** The module covers the pipeline elements recorded in DEFINE §4 and
Architecture Q5.5-Q5.17:

- Data acquisition from `inline` and `localFile` sources only (Q5.6).
- Five preparation transforms: `parse`, `filter`, `derive`, `select`, `limit`
  (recorded operation forms; `derived-{datasetId}-{N}`), and analytical
  computation: `count`, `sum`, `mean`, `min`, `max`, `describe` (Q5.7, Q5.8).
- Interpretation of computed results into `AnalyticalFinding`s, each carrying a
  `ProvenanceChain` and `UncertaintyInfo` (Q5.9, Q5.10).
- Independent structural verification of every finding (Q5.11).
- Fixed 5-dimension quality evaluation: `correctness`, `completeness`,
  `provenance`, `confidenceUncertainty`, `reproducibility` (Q5.15).
- Analytical reporting that references verified findings only (Q5.17).
- A deterministic core with a decision-provider seam; deterministic
  first-available stub by default; no model/provider bound (Q5.18).

**[NORMATIVE]** Out of scope (carried from DEFINE §8, Architecture Q5.19-Q5.22):
external/network data acquisition; CLI and configuration schema; write/edit/
delete and process-execution tooling; persistence; provider/model binding;
consuming Phase 4 by default; model-backed capabilities; any deferred §17 /
§22.1-§22.5 / Q4.22 item.

---

## 3. Module Identity

**[DECISION]**

| Attribute | Value |
| --- | --- |
| Folder | `phase-05/` |
| Module name | Analytics Agent Module |
| Package name | `@issue/analytics` (existing `phase-05/package.json`) |
| Public surface | `runAnalyticsTask` + 13 public types (DEFINE §4) |

**[FACT]** Package `@issue/analytics` v0.1.0 depends on the frozen packages via
`file:` references (`phase-05/package.json`).

---

## 4. Public Contract

**[DECISION]** The module's public surface is exposed through a single public
barrel (`phase-05/src/index.ts`). The following exports are the **authoritative
public contract**:

| Export | Kind | Responsibility |
| --- | --- | --- |
| `runAnalyticsTask(request, options?)` | function | Main orchestrator entry point: drives a task through the §9 lifecycle and returns a `Promise<AnalyticsTaskResult>`. |
| `AnalyticsTaskRequest` | type | Authorized analytics task input (§8.1). |
| `AnalyticsTaskOptions` | type | Runtime options: bounds, logging, provider seam, abort signal (§8.2). |
| `AnalyticsTaskResult` | type | Terminal analytics outcome: state, report, findings, provenance, uncertainty, evaluation (§8.7). |
| `AnalyticsTaskStatus` | type | Analytics-task lifecycle state (§9). |
| `DataSourceRef` | type | Data source reference (`inline` | `localFile`) (§8.3). |
| `DatasetRef` | type | Prepared tabular dataset reference (§8.4). |
| `TransformRecord` | type | Recorded preparation transform (§8.5). |
| `AnalyticalFinding` | type | Interpreted finding with provenance + uncertainty (§8.6). |
| `AnalyticalReport` | type | Analytical report referencing verified findings (§8.8). |
| `ProvenanceChain` | type | Per-finding provenance chain (§8.9). |
| `UncertaintyInfo` | type | Uncertainty record (§8.10). |
| `AnalyticsEvaluationRecord` | type | Fixed 5-dimension evaluation record (§8.11). |
| `AnalyticsDecisionProvider` | interface | Provider seam for analytics decision points (§10.8). |

**[DECISION]** Every other symbol is internal and SHALL NOT be imported by
consumers (barrel-only precedent, Phase 2 §17.3). Supporting structural types
referenced by the public types (`DatasetRecord`, `FieldValue`,
`AnalyticsPlanStep`, `AnalyticsEvaluationDimension`, `EvaluationMethod`) are
emitted from the internal model module so declaration emit stays valid; they are
**not** re-exported from the public barrel.

**[ACKNOWLEDGED REFINEMENT]** `AnalyticsDecisionProvider` is a **Phase 5-specific
abstraction** (source priority, finding-verification ordering, refinement
decision). The frozen Phase 2 `DecisionProvider` seam (`selectAction`/`assess`)
remains **unchanged** and is consumed barrel-only (§5); real model/provider
binding stays **deferred** (§20 #11; Q4.22; D3.2). Whether the three-method seam
shape is correct remains UNRESOLVED (§20 #3).

**[UNRESOLVED]** Exact function-signature parameter refinement beyond the §8 data
model is a mechanical expansion of the contracts defined here and is delegated
to Implementation under §18 constraints.

---

## 5. Frozen-Contract Consumption

**[DECISION]** Phase 5 consumes the frozen public surfaces **barrel-only**:

| Frozen package | Consumed surface | Purpose |
| --- | --- | --- |
| `@issue/foundation` (Phase 1) | `AppError`, `Result`/`ok`/`err`/`isOk`/`isErr`/`match`, `Logger`/`LoggerOptions`, `assertContained`/`isContained` (as needed) | Error discipline; logging; path containment. |
| `@issue/tool-runtime` (Phase 2) | `ResourceBounds` (type-only), `TaskStatus`/`ToolResult`/`OutcomeClass` (type-only reference where the Phase 3 seam surfaces them) | Bounds and tool-result typing at the acquisition boundary. |
| `@issue/integration` (Phase 3) | `runIntegrationTask`, `createDeterministicProviderStub`, `DEFAULT_BOUNDS`, `translateToolError`, `isFailedToolResult` | Deterministic read seam for `localFile` acquisition. |

**[NORMATIVE]** Phase 5 SHALL:

- Import frozen packages **only** through their public package barrels
  (`@issue/foundation`, `@issue/tool-runtime`, `@issue/integration`).
- Perform **zero deep imports** of any internal module of Phase 1/2/3.
- Never reimplement frozen behavior; only compose it through public surfaces.
- Not consume Phase 4 by default (DEFINE §8; Architecture Q5.4).

**[NORMATIVE]** Allowed dependencies are limited to the three frozen packages and
the Node.js standard library. No additional runtime dependency may be introduced
without separate owner authorization (AD-5.1).

---

## 6. Module Boundary

**[DECISION]** The Analytics Agent Module is responsible for executing
**analytics tasks**: data acquisition from inline and localFile content, recorded
preparation transforms, analytical computation, interpretation into
provenance-bearing findings, structural verification, multi-dimensional quality
evaluation, and verified-only analytical reporting - within ISSU's governed
boundaries (Architecture §5).

The module consumes the frozen Phase 3 integration seam for bounded filesystem
read execution when a `localFile` source requires it (Architecture Q5.6).

---

## 7. Non-Goals

**[NON-GOAL]** Phase 5 SHALL NOT include (carried from Architecture §6, DEFINE
§8):

- CLI / end-user entry point (§22.1 - deferred).
- Configuration-file schema (§22.2 - deferred).
- Write/edit/delete filesystem mutation, process execution, Git/network tooling,
  and external/network data acquisition (§22.3 - deferred; DEFINE §8).
- Provider/model binding (§22.4 - deferred; Q4.22).
- Workspace/monorepo adoption (§22.5 - deferred).
- Persistence / cross-run memory (DEFINE §8).
- Consuming Phase 4 by default (DEFINE §8).
- Multi-agent systems, generalized planning engine, plugin framework, code
  generation, publishing.
- Model-backed capabilities: semantic quality judgment, confidence calibration,
  plan refinement, reprocessing (Architecture Q5.21; §17/Q4.22 resolution
  required).

**[UNRESOLVED]** Whether any non-goal becomes a Phase 5 capability requires
explicit Owner authorization and a DECISIONS entry.

---

## 8. Data Model

This section finalizes the data structures delegated by Architecture §19. For
every field: name, type, meaning, required/optional, invariants, validation
constraints. All types are `readonly` at the type level.

### 8.1 AnalyticsTaskRequest

**[DECISION]**

| Field | Type | Meaning | Req | Invariants / validation |
| --- | --- | --- | --- | --- |
| `objective` | `string` | Analytics task objective. | required | Trimmed length >= 1. Used as the goal; never used to derive tool actions outside the pipeline. |
| `sources` | `readonly DataSourceRef[]` | Data sources to acquire. | required | Array. Each element validated per §8.3. Empty array => abstention (§10.3). |
| `plan` | `readonly AnalyticsPlanStep[]` | Optional explicit plan. | optional | If present, each step validated per §8.12. Absent => default plan (§10.5). |

### 8.2 AnalyticsTaskOptions

**[DECISION]**

| Field | Type | Meaning | Req | Invariants / validation |
| --- | --- | --- | --- | --- |
| `bounds` | `ResourceBounds` (Phase 2) or `DEFAULT_BOUNDS` (Phase 3) | Execution resource bounds. | optional | Must satisfy Phase 2 invariants. Enforcement by the core is UNRESOLVED (§20 #1). |
| `logger` | `Logger` (Phase 1) | Optional logger. | optional | Consumed barrel-only. |
| `provider` | `AnalyticsDecisionProvider` | Decision-point seam. | optional (default deterministic stub) | §10.8. |
| `signal` | `AbortSignal` | Caller abort signal. | optional | Abort semantics per §10.2. |

### 8.3 DataSourceRef

**[DECISION]**

| Field | Type | Meaning | Req | Invariants / validation |
| --- | --- | --- | --- | --- |
| `id` | `string` | Stable source identifier. | required | Non-empty; unique within a request. |
| `name` | `string` | Human-readable source name. | required | Non-empty. |
| `kind` | `"inline" \| "localFile"` | Acquisition kind. | required | One of the two allowed kinds. Unknown kind => invalid request. |
| `path` | `string` | Filesystem path. | required iff `kind === "localFile"` | Non-empty; resolved and read through the Phase 3 seam (read-only). |
| `content` | `string` | Inline content. | required iff `kind === "inline"` | Caller-supplied; treated as untrusted input. |

**[NORMATIVE]** Acquisition kinds are exactly `inline | localFile` (Architecture
Q5.6). No other kind exists.

### 8.4 DatasetRef

**[DECISION]**

| Field | Type | Meaning | Req | Invariants / validation |
| --- | --- | --- | --- | --- |
| `id` | `string` | Stable dataset identifier. | required | Root dataset id equals its source id; derived id follows `derived-{datasetId}-{N}`. |
| `name` | `string` | Dataset name (inherited from source). | required | Non-empty. |
| `sourceIds` | `readonly string[]` | Root source ids this dataset derives from. | required | Every id references an acquired source. |
| `records` | `readonly DatasetRecord[]` | Prepared tabular records. | required | Each record per §8.13. |

### 8.5 TransformRecord

**[DECISION]**

| Field | Type | Meaning | Req | Invariants / validation |
| --- | --- | --- | --- | --- |
| `id` | `string` | Stable transform identifier (`transform-{N}`). | required | Unique within a task. |
| `kind` | `string` | Transform kind (`parse` | `filter`; `derive`/`select`/`limit` reserved per DEFINE §4). | required | Recorded operation form. |
| `inputDatasetIds` | `readonly string[]` | Input dataset ids. | required | Empty for `parse` (source -> root). |
| `outputDatasetId` | `string` | Produced dataset id. | required | References an existing dataset. |
| `description` | `string` | Human-readable transform description. | required | Non-empty. |

**[NORMATIVE]** Every transformation is recorded as a `TransformRecord`; no
transform step silently disappears (Architecture Q5.7; observed evidence
`prepare.ts`).

### 8.6 AnalyticalFinding

**[DECISION]**

| Field | Type | Meaning | Req | Invariants / validation |
| --- | --- | --- | --- | --- |
| `id` | `string` | Stable finding identifier (`finding-{N}`). | required | Unique within a task result. |
| `text` | `string` | Human-readable finding text. | required | Non-empty. |
| `provenance` | `ProvenanceChain` | Per-finding provenance chain. | required | §8.9; must resolve structurally (§10.7). |
| `uncertainty` | `UncertaintyInfo` | Uncertainty record. | required | §8.10. |

### 8.7 AnalyticsTaskResult

**[DECISION]**

| Field | Type | Meaning | Req | Invariants / validation |
| --- | --- | --- | --- | --- |
| `state` | `AnalyticsTaskStatus` | Terminal lifecycle state. | required | SHALL be a terminal status (§9). |
| `report` | `AnalyticalReport` | Analytical report. | optional | Absent only when `state` is `FAILED` or `CANCELLED`. |
| `findings` | `readonly AnalyticalFinding[]` | Verified findings. | required | Empty only for `FAILED`/`CANCELLED`/`ABSTAINED`/empty-report paths. |
| `provenance` | `readonly ProvenanceChain[]` | Findings' provenance chains. | required | 1:1 with `findings`. |
| `uncertainty` | `readonly UncertaintyInfo[]` | Findings' uncertainty records. | required | 1:1 with `findings`. |
| `evaluation` | `AnalyticsEvaluationRecord` | Fixed 5-dimension evaluation. | required | §8.11. |
| `abstained` | `boolean` | Abstention flag. | optional (default false) | True iff `state === "ABSTAINED"`. |

### 8.8 AnalyticalReport

**[DECISION]**

| Field | Type | Meaning | Req | Invariants / validation |
| --- | --- | --- | --- | --- |
| `id` | `string` | Stable report identifier (`report-1`). | required | Non-empty. |
| `text` | `string` | Report text. | required | Composed from verified findings only; never introduces claims beyond findings. |
| `findingIds` | `readonly string[]` | Verified finding ids referenced. | required | Every id references a verified finding. |

### 8.9 ProvenanceChain

**[DECISION]**

| Field | Type | Meaning | Req | Invariants / validation |
| --- | --- | --- | --- | --- |
| `id` | `string` | Stable chain identifier (`chain-{N}`). | required | Unique within a task result. |
| `sourceIds` | `readonly string[]` | Root source ids. | required | Every id references an acquired source. |
| `steps` | `readonly { kind, ref, description?, field? }[]` | Recorded lineage: transforms then producing computation. | required | Each step: `kind` in {`parse`, `filter`} referencing a `TransformRecord.id`, or an operation kind in {`count`,`sum`,`mean`,`min`,`max`,`describe`} referencing an existing dataset (and, for numeric ops, an existing field). |

**[NORMATIVE]** Every finding carries a provenance chain that resolves
structurally to root sources, recorded transforms, and the producing computation
(Architecture Q5.9; AD-5.6). Provenance granularity is UNRESOLVED (§20 #7).

### 8.10 UncertaintyInfo

**[DECISION]**

| Field | Type | Meaning | Req | Invariants / validation |
| --- | --- | --- | --- | --- |
| `confidence` | `number` | Confidence value. | optional | If present, in [0,1]. NOT produced by the deterministic core (no calibration). |
| `calibrated` | `boolean` | Whether confidence is calibrated. | required | SHALL be `false` for the deterministic core; no calibration is asserted. |
| `method` | `string` | Method note (`"deterministic-core"`). | optional | Recorded honestly. |
| `note` | `string` | Human-readable note. | optional | Records that confidence is not established. |

**[NORMATIVE]** The deterministic core surfaces uncertainty honestly as "not
established" (`calibrated: false`); no confidence value is implied (Architecture
Q5.10). Confidence calibration method is UNRESOLVED (§20 #8).

### 8.11 AnalyticsEvaluationRecord

**[DECISION]**

| Field | Type | Meaning | Req | Invariants / validation |
| --- | --- | --- | --- | --- |
| `dimensions` | `Record<AnalyticsEvaluationDimension, number>` | Per-dimension scores. | required | Each value in [0,1]; keys from the fixed 5-dimension set. |
| `dimensionNotes` | `Record<AnalyticsEvaluationDimension, string>` | Basis note per dimension. | optional | Present for transparency. |
| `method` | `"automated" \| "human" \| "hybrid"` | Evaluation method. | required | Deterministic core uses `"automated"`. |

**[DECISION]** `AnalyticsEvaluationDimension` is the fixed set: `correctness`,
`completeness`, `provenance`, `confidenceUncertainty`, `reproducibility`
(Architecture Q5.15; AD-5.7). Each dimension is scored independently in [0,1]
from deterministic signals with a basis note. No single scalar composite is
defined; weights and thresholds are UNRESOLVED (§20 #6).

### 8.12 AnalyticsPlanStep

**[DECISION]** Plan steps are exactly:

| Step | Fields | Meaning |
| --- | --- | --- |
| `{ op: "filter", dataset, field, equals }` | `dataset` existing dataset id; `field` existing field; `equals` a `FieldValue` | Filter records where field equals value; produce derived dataset. |
| `{ op: "describe", dataset }` | `dataset` existing dataset id | Per-field descriptive statistics. |
| `{ op: "count", dataset }` | `dataset` existing dataset id | Count of records. |
| `{ op: "sum" \| "mean" \| "min" \| "max", dataset, field }` | `dataset` existing dataset id; `field` existing field | Scalar aggregate over numeric values. |

**[NORMATIVE]** Unknown operation or missing required field => invalid request
(§10.1). The operation set is exactly the recorded set (DEFINE §4; Architecture
Q5.8); no other operation may be added without DECISIONS + DEFINE refinement.

### 8.13 Supporting structural types

**[DECISION]**

- `FieldValue = string | number | boolean | null`.
- `DatasetRecord { id: string; fields: Readonly<Record<string, FieldValue>> }`.

These support the public types; they are internal and not re-exported from the
public barrel (§4).

---

## 9. Analytics Task Lifecycle

**[DECISION]** The orchestrator (`runAnalyticsTask`) drives a task through:
`READY -> PLANNING -> ACQUIRING -> PREPARING -> ANALYZING -> INTERPRETING ->
VERIFYING -> EVALUATING -> terminal`, where terminal is exactly one of
`COMPLETED`, `PARTIAL`, `ABSTAINED`, `FAILED`, or `CANCELLED` (Architecture Q5.5;
AD-5.5).

**[DECISION]** `AnalyticsTaskStatus` is the union of the nine active statuses
(`READY`, `PLANNING`, `ACQUIRING`, `PREPARING`, `ANALYZING`, `INTERPRETING`,
`VERIFYING`, `EVALUATING`, `REPLANNING`) and the five terminal statuses.

**[UNRESOLVED]** `REPLANNING` appears in the status type and is defined as a
transition in the observed implementation, but the deterministic core **never
enters** it (no refinement capability; the default stub rejects
`decideRefinement`). Whether the state should exist at all remains UNRESOLVED
(§20 #2); this Specification specifies no legal transition into `REPLANNING`.

**[NORMATIVE]** Terminal semantics:

| Status | Semantics |
| --- | --- |
| `COMPLETED` | All planned work units produced AND all findings verified AND at least one finding. |
| `PARTIAL` | Some planned work unit not produced, OR not all findings verified, OR zero findings produced. Produced+verified work is still reported. |
| `ABSTAINED` | No data sources provided, or all datasets empty after preparation. Distinct from failure; abstention report produced; no findings. |
| `FAILED` | Invalid request/source/plan; acquisition failure (incl. missing local file); provider returned unknown id; unrecoverable error. No report. |
| `CANCELLED` | Caller abort signal observed. No report. |

**[NORMATIVE]** Every run terminates; there is no unbounded loop (Architecture
Q5.5; Phase 2 deterministic execution rule precedent).

---

## 10. Behavioral Contracts

### 10.1 Request validation

**[DECISION]** `runAnalyticsTask` SHALL validate the request (§8.1, §8.12).
Invalid request (non-object, empty objective, missing/unknown sources, unknown
plan operation, missing required plan field) => terminal `FAILED` with no report
and an empty result set.

### 10.2 Cancellation

**[DECISION]** If the caller `signal` is already aborted when the task starts =>
`CANCELLED`. If the signal aborts during acquisition => `CANCELLED` (partial
acquisition is discarded; no report). Cancellation produces an empty result with
no report.

### 10.3 Abstention

**[DECISION]** If `request.sources` is empty, OR all datasets are empty after
preparation, the task terminates `ABSTAINED`: `abstained: true`, an abstention
report is produced, findings/provenance/uncertainty are empty, and no finding is
asserted (Architecture Q5.12; AD-5.5; DEFINE §5).

### 10.4 Acquisition

**[DECISION]** Acquisition SHALL:

- Acquire `inline` content directly from the request (caller-supplied,
  untrusted).
- Acquire `localFile` content through the Phase 3 deterministic read seam
  (`runIntegrationTask` with `createDeterministicProviderStub`, `DEFAULT_BOUNDS`,
  single-target read) (Architecture Q5.6; AD-5.4).
- Treat any non-recoverable target failure (including a missing local file) as a
  whole-acquisition failure => terminal `FAILED`.

**[NORMATIVE]** No external/network acquisition exists (DEFINE §8). Acquisition is
read-only and deny-by-default; no write/execute/network capability is available
to the core.

### 10.5 Preparation and plan

**[DECISION]** Preparation SHALL:

- Build one root `DatasetRef` per acquired source, recording a `parse`
  `TransformRecord` (observed evidence `prepare.ts`).
- Use `request.plan` if provided; otherwise use the default plan (one
  `describe` per dataset).
- Apply each `filter` step to produce a derived dataset (`derived-{datasetId}-{N}`)
  with a recorded `filter` `TransformRecord`.
- Record every transformation; never drop a transform silently.

**[NORMATIVE]** `derive`, `select`, `limit` are recorded operation forms (DEFINE
§4) reserved for future authorization; they are not active plan operations in
this Specification.

### 10.6 Computation

**[DECISION]** Each computation step (`count`, `sum`, `mean`, `min`, `max`,
`describe`) SHALL execute deterministically over the target dataset. A step that
cannot produce a result (no numeric values for the target field; no numeric
fields for `describe`; missing dataset) contributes no result and surfaces as a
plan shortfall (=> `PARTIAL` if any planned unit is unproduced).

### 10.7 Interpretation and verification

**[DECISION]** Interpretation SHALL convert each computed operation into one
`AnalyticalFinding` carrying a `ProvenanceChain` (root sources -> recorded
transforms -> producing computation) and `UncertaintyInfo` (calibrated: false).

**[DECISION]** Verification SHALL be an independent structural pass: each
finding's chain must resolve (sourceIds known; transform steps reference recorded
`TransformRecord`s; computation step references an existing dataset, and for
numeric ops an existing field). Findings that fail verification are excluded and
the shortfall surfaces as `PARTIAL` (Architecture Q5.11; AD-5.6).

**[NORMATIVE]** Only verified findings appear in a `COMPLETED` or `PARTIAL`
result, and the report references verified findings only (Architecture Q5.17).
Verification is structural, not semantic; it never regenerates findings and never
fabricates evidence. Verification depth is UNRESOLVED (§20 #9).

### 10.8 Provider seam

**[DECISION]** The deterministic core consults the `AnalyticsDecisionProvider`
for source priority and finding-verification ordering. The interface is:

| Method | Responsibility |
| --- | --- |
| `selectSource(available, state)` | Which data source to acquire next. |
| `selectFindingToVerify(findings, state)` | Which finding to verify next. |
| `decideRefinement(refinements, state)` | Refinement decision (REPLANNING). |

**[DECISION]** The default provider is a deterministic first-available stub:
`selectSource` returns `available[0]`; `selectFindingToVerify` returns
`findings[0]`; `decideRefinement` throws (the deterministic core has no
refinement capability and never enters REPLANNING). The stub is model-free, has
no provider SDK, and makes no network access (Architecture Q5.18; AD-5.3).

**[NORMATIVE]** If a provider returns an id not in the available set (for sources
or findings), the task terminates `FAILED` (non-recoverable; the core never
consumes a fabricated item).

### 10.9 Evaluation

**[DECISION]** Evaluation SHALL score the fixed 5-dimension set independently in
[0,1] from deterministic, observable signals with a per-dimension basis note.
Deterministic default-path signals recorded in DEFINE §4/§5/§10:

- `correctness` — fraction of interpreted findings that passed structural
  verification.
- `completeness` — fraction of planned work units (transforms + computations)
  that produced results.
- `provenance` — fraction of findings whose chains fully resolve.
- `confidenceUncertainty` — 0.5 with note that the deterministic core performs no
  model-based calibration (not established).
- `reproducibility` — 1 on the deterministic default path (identical inputs yield
  identical results).

**[NORMATIVE]** No weights, thresholds, pass/fail criteria, or scoring formulas
beyond the above signals are established here (UNRESOLVED; §20 #6). No single
scalar composite is produced (AD-5.7).

### 10.10 Reporting

**[DECISION]** The analytical report SHALL reference verified findings only, list
each finding's id and text, and never introduce claims beyond the findings. The
abstention report explains that no findings were produced rather than
fabricating from insufficient data. An empty report (no findings produced) is
distinct from abstention.

### 10.11 Determinism

**[DECISION]** The core SHALL be deterministic: control flow is model-free,
clock-free, and randomness-free; provider decisions fully determine ordering;
identical inputs + identical provider decisions + identical filesystem state =>
identical result (Architecture Q5.13; Phase 2 deterministic rule).

**[NORMATIVE]** `reproducibility` scores 1 on the deterministic default path.
Reproducibility level to claim and cross-Node-version/build guarantees are
UNRESOLVED (§20 #10, #14).

---

## 11. Provenance & Verification

**[DECISION]** Consolidated provenance/verification contracts (Architecture
Q5.9, Q5.11; AD-5.6):

1. Every finding carries a `ProvenanceChain` (§8.9).
2. Every chain resolves structurally before the finding is emitted.
3. Verification is an independent pass after interpretation (§10.7).
4. Only verified findings are reported (§10.10).
5. Verification never fabricates or regenerates evidence.

---

## 12. Uncertainty & Abstention

**[DECISION]** Consolidated uncertainty/abstention contracts (Architecture Q5.10,
Q5.12; AD-5.5):

1. Uncertainty is recorded per finding as `calibrated: false`; no confidence
   value is implied.
2. Abstention is a distinct terminal outcome from failure; it occurs only for
   insufficient data (empty sources, or all datasets empty).
3. Abstention produces a report stating no findings were fabricated; failure and
   cancellation produce no report.

---

## 13. Evaluation / Quality

**[DECISION]** Analytical quality is evaluated across the fixed
`AnalyticsEvaluationDimension` set (§8.11), each scored in [0,1] independently
(AD-5.7). No single scalar composite is defined.

**[NORMATIVE]** Evaluation SHALL NOT reduce to Phase 3 code-quality gates.
Phase 3's engineering gates (check, coverage >= 80%, build, audit,
`git diff --check`) apply to Phase 5's _own_ engineering-quality process at
Implementation (§18), but they are **not** analytical-quality criteria.

**[UNRESOLVED]** Weights, thresholds, pass/fail criteria, scoring formulas, and
any coverage-threshold value for the engineering gates are §20 / §17 items.

---

## 14. Security / Trust

**[DECISION]** Consolidated security/trust contracts (Architecture Q5.19; DEFINE
§8):

1. Inline content is caller-supplied untrusted input; localFile reads go through
   the read-only, deny-by-default Phase 3 seam.
2. No CLI, config schema, write/edit/delete, process execution, network access,
   persistence, or provider SDK exists in the core.
3. No external input path exists by default.
4. Error messages SHALL NOT embed content or secrets (Phase 1 `AppError`
   discipline; Phase 2 §13 principle).
5. Logging via the optional Phase 1 `Logger` is the only observability channel.

**[NORMATIVE]** These contracts are architectural (threat model). Whether path
containment is explicitly re-checked at the Phase 5 layer or delegated to the
Phase 3 seam is UNRESOLVED (§20 #13).

---

## 15. Determinism / Reproducibility

**[DECISION]** Phase 5 preserves deterministic behavior (§10.11):

- Default behavior uses the deterministic provider stub and the deterministic
  Phase 3 integration seam (AD-5.3, AD-5.4).
- Control flow is model-free, clock-free, and randomness-free.
- `reproducibility` is an evaluation dimension scored 1 on the deterministic
  default path.

**[UNRESOLVED]** Reproducibility level to claim, and whether determinism is
guaranteed across Node.js versions/builds, are §20 items (#10, #14).

---

## 16. Failure Semantics

**[DECISION]** Failures are classified as:

| Class | Meaning | Result |
| --- | --- | --- |
| `nonRecoverable` | Permanent (invalid request, acquisition failure, unknown provider id, unrecoverable error) | terminal `FAILED`, no report |
| `planShortfall` | Not a failure (produced work is still valid) | terminal `PARTIAL` (or `COMPLETED` when complete) |
| `evidenceInsufficient` | Not a failure | terminal `ABSTAINED` |
| `cancelled` | Caller abort | terminal `CANCELLED`, no report |

**[NORMATIVE]**

- Errors originating in the Phase 3 seam use Phase 3 `translateToolError` /
  `isFailedToolResult` to produce Phase 1 `AppError`-compatible errors
  (Architecture Q5.6; Phase 3 precedent).
- No retry/correction loop exists in the core (Architecture Q5.14; AD-5.5); plan
  shortfalls surface as `PARTIAL`, not recovery attempts.
- The frozen Phase 2 `OutcomeClass` set is referenced for tool-result
  classification where the Phase 3 seam is used.
- No error message embeds content or secrets (§14).

---

## 17. Acceptance Criteria

**[DECISION]** The Phase 5 Specification is acceptable when:

1. Every Architecture §19 input is resolved or explicitly carried as UNRESOLVED
   with reason (§20).
2. No accepted Architecture decision (Q5.1-Q5.22, AD-5.1-AD-5.8) is contradicted.
3. No deferred §17 / §22 item or Q4.22 is resolved (§19).
4. The public contract (§4) and data model (§8) are internally consistent and
   traceable to Architecture.
5. The §9 lifecycle and §10 behaviors are implementable without implementing
   them.
6. Research-stage unresolved questions (U1-U14) are carried with traceable
   disposition (§20), not silently resolved.
7. The TS2307 environment constraint is recorded, not fixed or worked around
   (§20 #16).
8. Conflicts preserved from prior stages (README "TEST = PASS" vs failing
   `npm run check`; `bounds` accepted-but-unconsumed) are recorded in §20, not
   silently resolved.

**[UNRESOLVED]** Exact analytical pass/fail thresholds and scoring formulas
remain §20/#6; their finalization SHALL be subject to owner acceptance.

---

## 18. Implementation Handoff

**[DECISION]** Implementation may be considered **authorized** only after ALL of:

1. Owner acceptance of this specification.
2. A separate, explicit Implementation authorization decision (per the Phase 4
   governance pattern; not inferred as automatic).
3. All §17 acceptance criteria verified.
4. Any §20 item required for implementation is resolved or explicitly deferred.
5. No deferred §17 / §22 item or Q4.22 has been resolved without separate
   authorization.

**[NORMATIVE]** Implementation SHALL then be governed by BLUEPRINT §33
discipline and the Phase 3-pattern engineering-quality gates (check, coverage,
build, audit, `git diff --check`) applied to Phase 5's own artifacts - not
imported as analytical-quality criteria (§13). Existing `phase-05/src`,
`phase-05/tests`, and configuration are **pre-existing observable artifacts**;
their modification, if any, is governed solely by a later explicit Implementation
authorization - NOT by this Specification.

---

## 19. Deferred Items

**[FACT / DEFERRED]** Carried forward unchanged from DEFINE §17, BLUEPRINT §22
(Phase 3 D3.2; Architecture §16):

- DEFINE §17 items: evaluation weights/thresholds; persistence; external-data
  policy; Phase 4 consumption; confidence calibration method; provenance
  granularity; reproducibility level; coverage-threshold value.
- §22.1 CLI / end-user entry point.
- §22.2 configuration-file schema.
- §22.3 write/execute/Git/network tooling (external/network data acquisition
  remains out of Phase 5 scope).
- §22.4 model-provider binding (Q4.22; §10.8).
- §22.5 workspace/monorepo adoption.

**[NORMATIVE]** None is resolved here. Resolving any requires a separate owner
authorization and a Phase 5 `DECISIONS.md` entry.

---

## 20. Unresolved Questions

**[UNRESOLVED]** Traceability of every Architecture §20 register item (U1-U16)
and each Architecture §19 input to its disposition here - **resolved** or
**carried unresolved with reason**:

| Item | Disposition | Where / reason |
| --- | --- | --- |
| U1 `bounds` enforcement by the core (accepted-but-unconsumed) | carried | §8.2, §20 #1 |
| U2 `REPLANNING` state existence | carried | §9, §20 #2 |
| U3 three-method `AnalyticsDecisionProvider` seam shape | carried | §4, §10.8, §20 #3 |
| U4 inline file-size/content limits | carried | §20 #4 |
| U5 `PARTIAL` explicit reason field | carried | §9, §20 #5 |
| U6 evaluation weights/thresholds/coverage value | carried | §10.9, §20 #6 |
| U7 provenance granularity | carried | §8.9, §20 #7 |
| U8 confidence calibration method | carried | §8.10, §20 #8 |
| U9 verification depth (structural-only vs content re-verification) | carried | §10.7, §20 #9 |
| U10 reproducibility level to claim | carried | §15, §20 #10 |
| U11 external-data policy | carried | §2, §19 (out of scope; §22.3) |
| U12 model-backed capability ever in scope | carried | §7, §20 #12 |
| U13 path containment re-check at Phase 5 layer vs Phase 3 seam | carried | §14, §20 #13 |
| U14 cross-Node-version/build determinism | carried | §15, §20 #14 |
| U15 persistence / Phase 4 consumption | carried | §2, §19 (out of scope; DEFINE §8) |
| U16 repo-wide `@issue/foundation` TS2307 | carried | §17 #7, §20 #16 (frozen-contract environment constraint; NOT fixed or worked around here) |
| Arch §19 Public API surface | resolved | §4 |
| Arch §19 Data schemas | resolved | §8 |
| Arch §19 Transform/computation schemas | resolved | §8.5, §8.12 |
| Arch §19 Thresholds and criteria | carried | §20 #4, #5, #6 |
| Arch §19 Reproducibility and verification depth | carried | §20 #9, #10 |
| Arch §19 Implementation technology | carried | §18, §20 (dependency choices, packaging, tooling deferred to a later authorized stage) |
| Arch §19 PARTIAL reason field / REPLANNING state | carried | §20 #2, #5 |
| Any incompatibility discovered at Specification (§4.5) | carried | none discovered; record any at Implementation |

**[UNRESOLVED]** Detailed disposition of carried items:

1. **`bounds` enforcement** (§8.2) - the option exists on the public surface
   (DEFINE §4) but is accepted-but-unconsumed by the observed implementation;
   whether the core must enforce bounds is UNRESOLVED (DEFINE §17).
2. **`REPLANNING` existence** (§9) - type union includes it; no legal transition
   specified; whether the state should exist at all is UNRESOLVED (Research U2).
3. **Provider seam shape** (§10.8) - three-method shape specified as observed;
   whether it is the right shape is UNRESOLVED (Research U3).
4. **Inline limits** (§8.3) - file-size/content limits for inline sources are
   UNRESOLVED (Research U4).
5. **`PARTIAL` reason field** (§9) - whether `PARTIAL` needs an explicit reason
   field is UNRESOLVED (Research U5).
6. **Weights/thresholds/scoring formulas** (§10.9) - DEFINE §17; Specification +
   Owner (Research U6).
7. **Provenance granularity** (§8.9) - DEFINE §17; UNRESOLVED (Research U7).
8. **Confidence calibration method** (§8.10) - requires model backing; DEFINE §17
   (Research U8).
9. **Verification depth** (§10.7) - structural-only vs re-verification of derived
   contents (Research U9).
10. **Reproducibility level** (§15) - DEFINE §17 (Research U10).
11. **External-data policy** (§2) - out of scope; §22.3; owner decision required
    (Research U11).
12. **Model-backed capability** (§7) - §17/Q4.22; owner decision required
    (Research U12).
13. **Path containment re-check** (§14) - Phase 5 layer vs Phase 3 seam delegation
    (Research U13).
14. **Cross-version determinism** (§15) - Node.js version/build guarantee
    (Research U14).
15. **Persistence / Phase 4 consumption** (§2) - out of scope; DEFINE §8; owner
    decision required (Research U15).
16. **TS2307** (§17 #7) - frozen `phase-01-foundation/package.json` lacks
    `main`/`types`/`exports`; repo-wide `npm run check` fails; this Specification
    neither fixes it nor adds a consumer-side workaround. It is an environment
    constraint to be escalated to the Owner separately (Research U16).

**Conflict notes (preserved, not resolved):** README "TEST = PASS" claim
(`README.md:118-132`) conflicts with the currently failing `npm run check`
(TS2307, U16); README's governed-stage citations (`README.md:146-171`) are
conversation records (2026-08-15), not durable acceptance; `bounds` is
accepted-but-unconsumed (U1).

---

## 21. Specification Status

```
PHASE 5 SPECIFICATION:
CREATED (draft) - pending Owner/Specification acceptance

ARCHITECTURE DECISIONS PRESERVED: Q5.1-Q5.22, AD-5.1-AD-5.8
ARCHITECTURE §19 INPUTS: resolved or carried unresolved (§20) - see verification
RESEARCH-STAGE UNRESOLVED ITEMS (U1-U14): carried forward (§20); NONE resolved
DEFERRED §17 / §22 ITEMS RESOLVED: NONE
Q4.22 / PROVIDER BINDING RESOLVED: NO
FROZEN PHASE 1/2/3/4 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 5 src/tests/package.json/tsconfig MODIFIED: NO
SOURCE/TEST/CONFIGURATION ARTIFACTS CREATED: NO (pre-existing, observable evidence only)
DIAGRAMS CREATED: NO
SPECIFICATION ARTIFACTS CREATED: phase-05/SPECIFICATION.md
TS2307 FIX OR WORKAROUND APPLIED: NO
COMMIT/PUSH: NO
```

---

## End-of-Document Block

```
PHASE 5 SPECIFICATION: CREATED (draft)
PHASE 5 SPECIFICATION STAGE: PENDING OWNER ACCEPTANCE
HISTORICAL SPECIFICATION RECOVERED: NO (NOT RECOVERABLE; not reconstructed)
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 5 src/tests/package.json/tsconfig MODIFIED: NO
TS2307 FIX OR WORKAROUND APPLIED: NO
PHASE 6 WORK STARTED: NO
COMMIT/PUSH: NO
```