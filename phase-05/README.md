# ISSU — Phase 5: Data and Analytics Agents

**Phase:** 5 — Data and Analytics Agents
**Status:** FROZEN / RELEASE-READY — Phase 5 completed and accepted by the
Owner (2026-08-20). DEFINE / RESEARCH / ARCHITECTURE / DECISIONS /
SPECIFICATION / IMPLEMENTATION / TEST / REFACTOR / DOCUMENTATION / FREEZE
**COMPLETE**; all verification gates **PASS** (typecheck, lint, format:check,
61/61 tests, coverage ≥ 80%, build, `npm run check`); first-release artifact
(`dist/`) built and validated; publishing explicitly excluded.
**Phase 5 is FROZEN.**
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**License:** Apache License 2.0

---

## 1. Purpose

Phase 5 implements a deterministic **data and analytics agent** core
(`@issue/analytics`, `phase-05/`) that translates the COMPLETE Phase 5
SPECIFICATION into a governed data-acquisition-to-report pipeline. It consumes
the frozen Phase 1/2/3 packages through their public barrels only, adds no new
dependency, and deliberately does **not** consume Phase 4 (`@issue/research`,
CLOSED/FROZEN). The core is deterministic and model-free; no provider is bound.

## 2. What Phase 5 Is and Is Not

**In scope (implemented, per SPECIFICATION §2–§12):**

* Public surface: `runAnalyticsTask` plus exactly the 13 public types
  (`AnalyticsTaskRequest`, `AnalyticsTaskOptions`, `AnalyticsTaskResult`,
  `AnalyticsTaskStatus`, `DataSourceRef`, `DatasetRef`, `TransformRecord`,
  `AnalyticalFinding`, `AnalyticalReport`, `ProvenanceChain`, `UncertaintyInfo`,
  `AnalyticsEvaluationRecord`, `AnalyticsDecisionProvider`). No other symbol is
  exported (`src/index.ts`).
* Deterministic lifecycle from acquisition to report (§4) with the `REPLANNING`
  state defined but never entered.
* Data acquisition for `inline` and `localFile` sources (§5); `localFile`
  content is read through the frozen Phase 3 integration seam.
* CSV-style normalization, `filter` transforms (producing derived datasets
  `derived-{datasetId}-{N}`), and analytical computation: `count`, `sum`,
  `mean`, `min`, `max`, `describe` (§5).
* Interpretation of computed results into `AnalyticalFinding`s, each carrying a
  `ProvenanceChain` (§7) and `UncertaintyInfo` (§8).
* Independent structural verification of every finding (§6).
* Fixed 5-dimension quality evaluation: `correctness`, `completeness`,
  `provenance`, `confidenceUncertainty`, `reproducibility` (§10).
* Analytical reporting that references verified findings only (§11).

**Explicitly not in scope (prohibited / non-goals, SPECIFICATION §13):**

* External/network data acquisition, CLI, configuration schema, write/edit/
  delete and process-execution tooling, persistence, and provider/model binding.
* Consuming Phase 4 (`@issue/research`) by default (SPECIFICATION §15).

## 3. Behavior Summary (as verified by TEST)

* **Lifecycle (§4):** `READY → PLANNING → ACQUIRING → PREPARING → ANALYZING →
  INTERPRETING → VERIFYING → EVALUATING →` terminal. Terminals: `COMPLETED`,
  `PARTIAL`, `ABSTAINED`, `FAILED`, `CANCELLED`. Every run terminates.
* **Abstention (§9):** no data sources, or all datasets empty after
  preparation, yields the distinct terminal `ABSTAINED` with `abstained: true`,
  empty findings, and an abstention report.
* **Partial results:** plan shortfalls (missing dataset, non-numeric field, no
  numeric fields for `describe`, empty explicit plan) yield `PARTIAL`; produced
  and verified work is still reported.
* **Failure (§13 precedent):** invalid request/source/plan, acquisition failure
  (unreadable local file), an unknown source/finding id returned by a provider,
  or any unrecoverable error yields `FAILED` with no report.
* **Cancellation:** an aborted signal yields `CANCELLED` with no report.
* **Uncertainty (§8):** `calibrated: false`, `method: "deterministic-core"` —
  no calibration is asserted.
* **Evaluation (§10):** `method: "automated"`; each of the 5 dimensions is
  scored in `[0,1]` from deterministic signals. Weights/thresholds are
  SPECIFICATION §17 UNRESOLVED and are not applied.
* **Determinism (§6):** identical inputs produce identical results;
  `reproducibility` scores 1 on the deterministic default path.
* **Provenance (§7):** every finding carries a chain from its root `sourceIds`
  through recorded `parse`/`filter` transforms to its producing computation.
  No transform step is silently dropped; unverified findings are never emitted
  in a `COMPLETED` result.

## 4. Usage Boundaries

```ts
import { runAnalyticsTask } from "@issue/analytics";

const result = await runAnalyticsTask({
  objective: "Summarize scores.",
  sources: [
    { id: "s1", name: "scores", kind: "inline", content: "name,score\na,10\nb,20" },
    // or { id: "f1", name: "data.csv", kind: "localFile", path: "..." }
  ],
  plan: [
    { op: "filter", dataset: "s1", field: "region", equals: "north" },
    { op: "sum", dataset: "derived-s1-1", field: "score" },
  ],
});
// result.state ∈ terminal set; result.findings/provenance/uncertainty/evaluation/report
```

* `AnalyticsTaskOptions` accepts `logger`, `signal`, `provider`, and `bounds`
  (the last is accepted but **not consumed** by the deterministic core, which
  has no retry/correction loop — documented in `src/internal/machine.ts`).
* `AnalyticsDecisionProvider` is the §16 seam; a deterministic first-available
  stub is used by default. **No model/provider is bound** (Q4.22 DEFERRED).
* Local files are read through the frozen Phase 3 seam with `DEFAULT_BOUNDS`;
  a missing file fails acquisition (non-recoverable).

## 5. Dependency / Integration Boundaries

* Consumed packages (public barrels only): `@issue/foundation` (Phase 1),
  `@issue/tool-runtime` (Phase 2), `@issue/integration` (Phase 3). All via
  `file:` references in `package.json`.
* **No `@issue/research`** — Phase 4 is NOT consumed by default (SPECIFICATION
  §15) and remains CLOSED/FROZEN, unmodified.
* No deep imports (`@issue/*/internal` or `src` paths), no `require`, no new
  runtime dependency beyond the frozen packages and the Node.js standard
  library (verified by TEST).

## 6. Verification / Refactor Status (recorded)

* **TEST = PASS** (2026-08-15): all 15 verification criteria PASS; 60/60 tests
  across 6 files; coverage statements 91.83% / branches 83.47% / functions
  97.01% / lines 93.18% (gate ≥ 80% each); typecheck, eslint, prettier, build,
  and `npm audit` (0 vulnerabilities) all pass.
* **REFACTOR = COMPLETE** (2026-08-15): internal-only quality changes to
  `src/internal/machine.ts` (hoisted plan-op constant, deduplicated provider
  selection via a shared helper, removed a redundant result wrapper) and
  `src/internal/parse.ts` (hoisted literal regexes). Public API, behavior, and
  invariants preserved; all gates re-verified.
* **TEST non-blocking findings** were reviewed during REFACTOR and left
  unchanged: `bounds` accepted-but-unconsumed (contract-preserving);
  "contradictory / below-reliability-threshold" abstention criteria remain
  SPECIFICATION §9/§17 UNRESOLVED (not a capability of the deterministic
  core); `provenance` and `correctness` dimension scores coincide numerically
  by design (basis notes differ).
* **FREEZE / RELEASE PREPARATION = COMPLETE** (2026-08-20): §16 AD-1
  conformance fix (`src/internal/acquire.ts` — seam-originated errors via
  `isFailedToolResult`/`translateToolError`) and §16 verification test added;
  Owner-authorized Phase 1 manifest repair (`phase-01-foundation/package.json`
  `main`/`types`/`exports` → existing `dist/index.js`/`index.d.ts`). All gates
  re-verified: typecheck PASS, lint PASS, format:check PASS, **61/61 tests**
  (6 files), coverage statements 91.17% / branches 82.92% / functions 97.01% /
  lines 92.45% (gate ≥ 80% each), build PASS (`dist/` regenerated and
  validated), `npm run check` PASS. No workaround introduced; Phase 2/3/4 and
  `BLUEPRINT.md` untouched; nothing committed or pushed.

## 7. Non-Goals and Deferred Items

* **SPECIFICATION §17 UNRESOLVED (recorded, not resolved):** evaluation
  weights/thresholds; persistence requirement; external-data policy; whether
  the Phase 4 surface is consumed; confidence calibration method; provenance
  granularity; reproducibility level; coverage-threshold value.
* **BLUEPRINT §22.1–§22.5 DEFERRED:** CLI (22.1); configuration schema (22.2);
  write/edit/delete, process execution, Git/network tooling (22.3); model-provider
  binding (22.4); workspace/monorepo migration (22.5).
* **Q4.22 DEFERRED:** provider/model binding not decided; only the
  `AnalyticsDecisionProvider` seam is defined.

## 8. Final Freeze State

Phase 5 is fully implemented, tested (PASS), refactored (COMPLETE),
verification-complete, and **FROZEN / RELEASE-READY** (accepted 2026-08-20).
The first-release artifact (`dist/`) is built and validated; publishing is
explicitly excluded. Phase 4 remains CLOSED/FROZEN and was not modified.
Phase 2/3 sources, tests, specifications, and contracts were not modified; the
sole Phase 1 change is the Owner-authorized manifest repair to
`phase-01-foundation/package.json` (`main`/`types`/`exports` → existing
`dist/index.js`/`index.d.ts`). `BLUEPRINT.md` was not modified. Nothing has
been committed or pushed.

## 9. Traceability

| Claim / element | Source record |
| --- | --- |
| Scope, non-goals, deferred items | Phase 5 DEFINE/RESEARCH/ARCHITECTURE/SPECIFICATION governed records (2026-08-15); BLUEPRINT §22 |
| Public surface, lifecycle, abstention, evaluation, reporting | COMPLETE Phase 5 SPECIFICATION (§2–§12); accepted ARCHITECTURE |
| Implementation | `src/index.ts`, `src/internal/*`, `package.json`, `tests/*` |
| Behavior verification | Phase 5 TEST report — PASS (15 criteria) |
| Quality gates | TEST + REFACTOR gate runs (typecheck, lint, format, 60/60 tests, coverage ≥ 80, build, audit 0) |
| Internal refactor | Phase 5 REFACTOR report — COMPLETE (`machine.ts`, `parse.ts`) |
| Freeze / Release | Owner acceptance (2026-08-20); FROZEN / RELEASE-READY; gate evidence (61/61 tests, coverage ≥ 80, build); release artifact `dist/`; §16 AD-1 fix |
| Frozen boundaries | Phase 4 CLOSED/FROZEN; Phase 2/3 and `BLUEPRINT.md` unchanged; Phase 1 contracts unchanged (sole change: Owner-authorized manifest repair) |

## 10. Documentation Index

| Document | Purpose |
| --- | --- |
| `README.md` | This file — phase overview, status, behavior, usage, boundaries. |
| Governed stage records | DEFINE / RESEARCH / ARCHITECTURE / SPECIFICATION / IMPLEMENTATION / TEST / REFACTOR / DOCUMENTATION reports (conversation records, 2026-08-15) — normative basis. |
| `src/index.ts` | Authoritative public surface (exactly `runAnalyticsTask` + 13 types). |
| `tests/` | Test suites (6 files, 61 tests) plus coverage configuration in `vitest.config.ts`. |

## 11. Quick Start

```text
npm install
npm run check          # typecheck + lint + format-check + test (single gate)
npm run test:coverage  # test + coverage gate (≥ 80%)
npm run build          # tsc -p tsconfig.build.json → dist/
```

## 12. How to Review This Phase

1. Read `../BLUEPRINT.md` (lifecycle §11; governance §30/§33; deferred §22).
2. Read the governed Phase 5 records (DEFINE → RESEARCH → ARCHITECTURE →
   SPECIFICATION → IMPLEMENTATION → TEST → REFACTOR).
3. Read `src/index.ts` and `tests/`; run `npm run check`.

## 13. License

Licensed under the Apache License, Version 2.0. See `../LICENSE`.