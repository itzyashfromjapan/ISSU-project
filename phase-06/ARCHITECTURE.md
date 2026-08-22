# ISSU — Phase 6: Configuration & CLI — Architecture

**Phase:** 6 — Configuration & CLI
**Stage:** ARCHITECTURE (owner-authorized 2026-08-22)
**Status:** ACCEPTED — Owner accepted the Phase 6 Architecture (owner, 2026-08-22)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative inputs:** Accepted Phase 6 DEFINE (`./DEFINE.md`, ACCEPTED 2026-08-22); completed Phase 6 Research (`./RESEARCH.md`, R6.1-12, ACCEPTED 2026-08-22); frozen Phase 1,2,3,5 contracts; Phase 4 CLOSED/FROZEN
**License:** Apache License 2.0

---

## 1. Purpose & Position

This document records the **architecture** of the Phase 6 Configuration & CLI Module. It follows BLUEPRINT §11 lifecycle position: after **Research** (R6.1-12 accepted) and before **Specify**.

- The domain is **Configuration & CLI** (accepted DEFINE, 2026-08-22), a centralized config + minimal CLI that makes the deterministic Phase 2/3/5 pipelines invocable/observable via public barrels, without modifying frozen phases.
- Accepted DEFINE + completed RESEARCH are the governing inputs.
- This document determines **what the module is**, **what it consumes**, **how it is decomposed**, and **which decisions remain open** for Specification and Owner approval.
- It does NOT finalize public API, exact schemas, thresholds, scoring, implementation technology, or model/provider choices. Those are **SPECIFICATION INPUT / UNRESOLVED** (Specification firewall).
- It does NOT resolve any §22.3/§22.4/§22.5/Q4.22 unless stated otherwise.

---

## 2. How to Read This Document

Every decision is labeled with one of:

| Label | Meaning |
| --- | --- |
| **FACT** | Verified repository/contract fact (frozen Phase 1/2/3/5, BLUEPRINT, DEFINE, RESEARCH) |
| **PRECEDENT** | Established project/governance precedent from prior accepted stage (Phase 2/3/5) |
| **INFERENCE** | Reasoned conclusion from facts; not directly stated |
| **ARCHITECTURE DECISION** | A decision this Architecture stage makes within its authority |
| **UNRESOLVED** | Not decidable here; requires Specification and/or Owner approval |

Each architecture question (Q6.1-6.12) records: problem, research evidence, alternatives (≥2 where meaningful), chosen approach, rationale, consequences, rejected alternatives, and unresolved implications.

**Specification firewall:** exact public API, exports, data schemas, test/acceptance/benchmark thresholds, pass/fail formulas, scoring formulas, implementation dependencies, and implementation technology are NOT finalized here. They are recorded as **SPECIFICATION INPUT / UNRESOLVED**.

---

## 3. Consumed Contracts (frozen)

**[FACT]** Phase 6 consumes the following frozen public surfaces, **barrel-only** (no deep imports), consistent with Phase 5 precedent and P7-2 boundary audit:

### 3.1 Phase 1 — `@issue/foundation` (frozen)

**[FACT]** Public barrel (`phase-01-foundation/src/index.ts`): `VERSION`, `AppError`/`AppErrorJson`/`AppErrorParams`, `isAppError`/`toError`, `Result`/`ok`/`err`/`isOk`/`isErr`/`match`, `LogLevel`, `IssueConfig`/`LoadConfigOptions`/`loadConfig`/`mergeConfigLayers`, `EnvSource`/`EnvSnapshot`/`readEnv`/`getSecret`/`redactionList`, `Logger`/`LoggerOptions`/`createLogger`, `assertContained`/`isContained`, `runCli`.

### 3.2 Phase 2 — `@issue/tool-runtime` (frozen)

**[FACT]** Public barrel (`phase-02/src/index.ts`): `TaskStatus` (9-state), `ToolOperation`, `ActionRef`, `ReadOptions`, `ListOptions`, `OutcomeClass`, `CorrectionDirection`, `FileContent`, `DirectoryEntry`, `DirectoryListing`, `ToolResult`, `TaskRefs`, `ResourceBounds`, `TaskOptions`, `TaskState`, `AvailableAction`, `DecisionProvider`, `Assessment`, `TaskResult`, `ToolRuntime`; functions `runTask`, `createToolRuntime`, `deriveAvailableActions`.

### 3.3 Phase 3 — `@issue/integration` (frozen, CLOSED)

**[FACT]** Public barrel (`phase-03/src/index.ts`): `runIntegrationTask`, `IntegrationTaskResult`, harness + stub types (`HarnessOptions`, `StubDecisionProvider`). Consumed only as read seam for `localFile` acquisition and for CLI `issue run --integration` dispatch.

### 3.4 Phase 5 — `@issue/analytics` (frozen)

**[FACT]** Public barrel (`phase-05/src/index.ts`): `runAnalyticsTask` + 13 types (`AnalyticsTaskRequest`, `AnalyticsTaskOptions`, `AnalyticsTaskResult`, `AnalyticsTaskStatus`, `DataSourceRef`, `DatasetRef`, `TransformRecord`, `AnalyticalFinding`, `AnalyticalReport`, `ProvenanceChain`, `UncertaintyInfo`, `AnalyticsEvaluationRecord`, `AnalyticsDecisionProvider`). Consumed only for `issue run --analytics` dispatch.

### 3.5 Phase 4 — `@issue/research` (CLOSED/FROZEN, NOT consumed)

**[FACT]** Phase 4 (`@issue/research`) is NOT consumed by default per `phase-06/DEFINE.md:11` and Phase 5 precedent. No `file:` ref to `phase-04/` in Phase 6.

---

## 4. Module Decomposition

**[ARCHITECTURE DECISION]** Phase 6 is decomposed into exactly three internal modules, plus the public barrel:

- **config/** — `schema.ts` (types), `resolve.ts` (pure `resolveConfig(layers) → Result<ResolvedConfig, AppError>`), `validate.ts` (field validators), `provenance.ts` (`ConfigProvenance` construction), `verify.ts` (independent structural verification of resolved config). Reuses Phase 1 `jsonc.ts` for file parsing and `readEnv`/`getSecret` for env.
- **cli/** — `args.ts` (typed `CliArgs` + `parseArgs(string[]) → Result<CliArgs, AppError>`), `main.ts` (dispatch), `print.ts` (help + result printing), `dispatch.ts` (routes to `runTask`/`runAnalyticsTask` via public barrels). No `child_process`, no `fs.write`.
- **observability/** — `logger.ts` (wraps `createLogger({redact: redactionList()})`), `progress.ts` (task progress events). Reuses Phase 2 `observability.ts` pattern.

**[PRECEDENT]** Phase 5 decomposed into `acquire`, `compute`, `evaluate`, `interpret`, `machine`, `model`, `parse`, `prepare`, `provider`, `report`, `verify` — 11 modules; Phase 6 is intentionally minimal (3) per `BLUEPRINT.md:178-183` reliability over complexity.

---

## 5. Architecture Questions

### Q6.1 — What is the Configuration Schema Shape?

**Problem:** §23 requires centralized, understandable, extensible config for models/providers/tools/permissions/memory/agent/project/logging/performance, but exact fields are UNRESOLVED at DEFINE.

**Research evidence:** `phase-01-foundation/src/config/defaults.ts` (typed defaults), `phase-05/src/internal/model.ts` (13 readonly types).

**Alternatives:** (1) Flat `Record<string, unknown>` (rejected: no typing, no validation). (2) Versioned typed `ConfigSchema` with `ResolvedConfig` (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `ConfigSchema` is a versioned, readonly, typed record: `{ version: "1.0.0", models?, providers?, tools?, permissions?, memory?, agent?, project?, logging?, performance? }` where each section is `readonly` and validated via `Result`. `ResolvedConfig` is the frozen output of `resolveConfig`. Exact fields are **SPECIFICATION INPUT / UNRESOLVED** (firewall) — this decision sets the shape, not the field list.

**Consequences:** Deterministic, testable, extensible; future fields added as optional without breaking.

**Rejected:** Flat untyped.

**Unresolved implications:** Field-level provenance granularity, JSONC vs YAML file format.

---

### Q6.2 — How is Configuration Resolution Layered?

**Problem:** Need deterministic resolution of defaults→file→env→CLI without new deps.

**Research evidence:** `phase-01-foundation/src/config/load.ts` (`loadConfig`, `mergeConfigLayers`), R6.2 deterministic precedent.

**Alternatives:** (1) Single source (env only) (rejected: not 12-factor). (2) Layered pure function `resolveConfig(layers)` (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `resolveConfig({defaults, file?, env?, cli?}) → Result<ResolvedConfig, AppError>` is pure, deterministic, no I/O except file read via `assertContained` + `readFile` seam; `file` is JSONC parsed via `phase-01-foundation/src/config/jsonc.ts`; `env` is `EnvSnapshot` from `readEnv`; `cli` is `CliArgs`.

**Consequences:** Identical inputs → identical output; `reproducibility` 1; testable with captured snapshots.

**Rejected:** Single-source.

**Unresolved:** Env ordering normalization, file path resolution (cwd vs project root).

---

### Q6.3 — How is CLI Bounded?

**Problem:** §22.1 CLI is in-scope, but §22.3 write/exec/Git/network is out-of-scope.

**Research evidence:** `phase-01-foundation/src/cli/args.ts` (typed, no side effects), `phase-02/runtime.ts` (deny-by-default `isContained`), R6.4.

**Alternatives:** (1) Rich CLI with `exec`, `write`, `git` subcommands (rejected: violates DEFINE §8). (2) Minimal read-only CLI: `issue --help`, `issue config --show`, `issue run [--tool-runtime|--analytics]` (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** CLI exposes exactly three invocable forms: `--help` (prints help, exit 0), `config --show` (resolves config, prints with redaction, exit 0 or 1 on validation), `run` (dispatches to frozen barrels, prints `Result`, exit 0/1/2). No other subcommand is valid; unknown args → `issue.cli.unknown-argument` error. No `child_process`, no `fs.write`, no `fetch`.

**Consequences:** Minimal surface, secure by default, frozen boundaries intact.

**Rejected:** Rich.

**Unresolved:** Help text exact wording, exit code mapping for `CANCELLED` vs `FAILED`.

---

### Q6.4 — How is Observability Wired?

**Problem:** §24 requires logs, activity, errors, decisions, progress, but no new logging lib.

**Research evidence:** `phase-01-foundation/src/logging/pino-logger.ts` (`pino`), `phase-02/src/internal/observability.ts`.

**Alternatives:** (1) New logger (rejected: new dep). (2) Reuse `Logger` contract + `redactionList()` (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `observability/logger.ts` wraps `createLogger({level: resolvedConfig.logging.level, redact: redactionList()})`; `progress.ts` emits `cli.invoked`, `config.resolved`, `run.dispatched`, `run.completed` with structured `ctx` (cliArgs, configSource, runId, status, attempts); secrets/content redacted.

**Consequences:** No new dep, consistent with Phase 2/5 logging, security-preserving.

**Rejected:** New.

**Unresolved:** Log level per command, progress event schema.

---

### Q6.5 — How is Determinism Preserved?

See R6.2; **[ARCHITECTURE DECISION]** `resolveConfig` is pure; `parseArgs` is pure (`string[] → Result`); `dispatch` is deterministic given `ResolvedConfig` and frozen barrel outputs (Phase 5 determinism preserved). Tests will assert `resolveConfig` determinism via repeated calls.

---

### Q6.6 — How is Provenance/Verification Modeled?

**[ARCHITECTURE DECISION]** `ConfigProvenance = readonly {source: "defaults"|"file"|"env"|"cli", key: string, value: unknown, redacted: boolean}[]` attached to `ResolvedConfig`; `verifyConfig(provenance) → Result<true, AppError>` checks that every field's last source is allowed and that no unverified source contributed to `COMPLETED` config. Mirrors Phase 5 `ProvenanceChain` + `verify.ts` without copying.

---

### Q6.7 — How are Secrets Handled?

**[ARCHITECTURE DECISION]** Secrets from `env` via `getSecret` + `readEnv`; `config --show` redacts via `redactionList()` before `print.ts`; no persistence, no logging of raw secrets; `issue.config.secret-exposure` error if `config --show` attempts to print unredacted secret without `--allow-secrets` (which does not exist — so never).

---

### Q6.8 — How are Frozen Boundaries Enforced?

**[ARCHITECTURE DECISION]** Build-time: `eslint` rule `no-restricted-imports` bans `from "@issue/foundation/dist/*"` and `from "@issue/*/internal"`; `tsconfig` `paths` not used (no workaround). Runtime: `isContained` for config file reads; `Result` for CLI validation; `package.json` `file:` refs only.

---

### Q6.9 — What Remains Deferred?

Per DEFINE §12, **[ARCHITECTURE DECISION]** §22.3/§22.4/§22.5/Q4.22 remain **DEFERRED** and appear here as **UNRESOLVED**: write/exec/Git/network tooling, provider binding, workspace, persistence, Phase 4 consumption, confidence calibration. No decision here resolves them.

---

### Q6.10 — What is the Public Barrel?

**[UNRESOLVED]** Exact exports are Specification firewall: proposed `export { resolveConfig, parseArgs, runCli }` + types `ConfigSchema`, `ResolvedConfig`, `ConfigProvenance`, `CliArgs`, `CliResult` — but final list is SPECIFICATION INPUT, not decided here. Only constraint: barrel exports NOTHING from frozen phases' internals.

---

### Q6.11 — How is Failure Handled?

**[ARCHITECTURE DECISION]** Every fallible operation returns `Result<T, AppError>` with `issue.config.*` or `issue.cli.*` codes: `issue.config.validation`, `issue.config.not-found`, `issue.config.not-contained`, `issue.cli.unknown-argument`, `issue.cli.missing-required`. `main.ts` maps `Result` to exit codes (0 success, 1 validation, 2 runtime).

---

### Q6.12 — How is Testing Structured?

**[ARCHITECTURE DECISION]** Tests under `phase-06/tests/`: `config.resolve.test.ts` (determinism, provenance, redaction), `cli.args.test.ts` (parse, help, unknown, validation), `cli.dispatch.test.ts` (stubbed barrel dispatch), `public-api.test.ts` (barrel surface), `determinism.test.ts` (repeated config resolution), integration `seam.integration.test.ts` (config file read via harness). Coverage gate ≥80% (Vitest, same as Phase 5).

---

## 6. Decisions Summary

| ID | Decision | Status |
| --- | --- | --- |
| AD-6.1 | Consume frozen contracts barrel-only (1/2/3/5) | Draft |
| AD-6.2 | Pure `resolveConfig(layers)` layered resolution | Draft |
| AD-6.3 | Minimal CLI: `--help`, `config --show`, `run` only | Draft |
| AD-6.4 | Reuse `Logger` + `redactionList()` for observability | Draft |
| AD-6.5 | Provenance `ConfigProvenance` + `verifyConfig` | Draft |
| AD-6.6 | Secrets via `getSecret` + redaction, no persistence | Draft |
| AD-6.7 | Frozen boundary enforcement via eslint + `isContained` | Draft |
| AD-6.8 | §22.3/§22.4/§22.5/Q4.22 remain DEFERRED | Draft |

All decisions become **Approved** at Architecture acceptance and **Frozen** at Phase 6 freeze.

---

## 7. Specification Firewall

Exact public API, exports, data schemas, test/acceptance/benchmark thresholds, pass/fail formulas, scoring formulas, implementation dependencies, and implementation technology are **NOT finalized here**. They are recorded as **SPECIFICATION INPUT / UNRESOLVED** and will be decided at Specification with Owner approval.

---

## 8. Security Considerations

Architecture preserves `ISSU_PROJECT.md:799-847` vectors: path traversal via `isContained`, no write/exec/network, provider seam not bound, redaction, deny-by-default, `Result` error handling. Detailed verification at Security Audit (post-implementation).

---

## 9. End-of-Document Block

```
PHASE 6 ARCHITECTURE RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 6 ARCHITECTURE STAGE: ACCEPTED — SPECIFICATION AUTHORIZED (owner, 2026-08-22)
SPECIFICATION AUTHORIZED: YES (owner, 2026-08-22)
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 7 WORK STARTED: NO
COMMIT/PUSH: NO
```
