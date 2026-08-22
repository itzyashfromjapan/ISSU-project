# ISSU — Phase 6: Configuration & CLI — Research Record

**Phase:** 6 — Configuration & CLI
**Stage:** RESEARCH (owner-authorized; accepted DEFINE → Research)
**Status:** ACCEPTED — Owner accepted the Phase 6 Research record (owner, 2026-08-22)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Accepted DEFINE:** `./DEFINE.md` (ACCEPTED, owner, 2026-08-22)
**ISSU Governance:** `../ISSU_PROJECT.md` (1578 lines, durable 8dde232)
**License:** Apache License 2.0

This is a **NEW GOVERNED RESEARCH STAGE**. It is NOT a reconstruction of a missing Phase 6 Research record — no prior Phase 6 durable record exists (verified: `phase-06/` missing until 2026-08-22).

---

## 1. Research Status

DRAFT — evidence gathered and recorded for Owner review. Research does NOT decide Architecture, public APIs, schemas, algorithms, technology, provider binding, or acceptance criteria; those remain UNRESOLVED unless stated otherwise here.

---

## 2. Research Authorization

Owner decision: **ACCEPT the NEW GOVERNED Phase 6 DEFINE record and AUTHORIZE Phase 6 RESEARCH** (2026-08-22, "Continue. You are working in the right direction."). Authorized work: evidence-gathering and analysis for the later Architecture and Specification stages, within the mandatory boundaries (no modification of Phase 1/2/3/4/5, BLUEPRINT, `ISSU_PROJECT.md`, no TS2307 fix or paths workaround, no §22.3/§22.4/§22.5/Q4.22 resolution beyond DEFINE's 22.1/22.2, no Phase 7 work). Research does NOT authorize Architecture, Specification, Design decisions, or Implementation.

---

## 3. Accepted DEFINE Reference

Accepted as the current authoritative definition of Phase 6 (`phase-06/DEFINE.md`, ACCEPTED 2026-08-22):

- **Domain:** Configuration & CLI — centralized configuration schema + CLI entry-point that makes frozen Phase 2/3/5 pipelines invocable/observable, addressing BLUEPRINT §22.1 CLI and §22.2 configuration schema (§23/§24).
- **Public surface:** to be defined at Specification (new Phase 6 barrel, not exceeding frozen Phase 5 surface except via explicit new barrel).
- **Scope:** config schema + layered resolution (defaults→file→env→CLI) reusing Phase 1 `loadConfig` precedent + JSONC; CLI `issue` bin (`--help`, `config --show`, `run`) via Phase 1 `cli/args` pattern, read-only dispatch to frozen barrels; observability via Phase 1 `Logger` + Phase 2 redaction.
- **Boundaries:** no write/edit/delete/process/Git/network (§22.3), no provider/model binding (§22.4/Q4.22), no workspace migration (§22.5), no persistence beyond config reads, no frozen-phase modification.
- **Dependencies:** Phase 1/2/3/5 public barrels only via `file:` refs (Phase 4 not consumed by default).
- **Deferred:** 22.3, 22.4, 22.5, Q4.22, domain beyond config/CLI remain out-of-scope; 22.1/22.2 now in-scope.
- **Objectives:** deterministic resolution, single `issue` CLI passes `check/build/test:coverage ≥80%`, respects frozen boundaries, passes Security Audit per `ISSU_PROJECT.md:799-847`.

---

## 4. Research Questions

| ID | Question |
| --- | --- |
| R6.1 | What frozen-contract surface may Phase 6 legitimately consume, and through which seams? |
| R6.2 | What deterministic configuration resolution precedent exists for a Phase 6 lifecycle? |
| R6.3 | How should configuration schema be typed/validated while preserving phase independence? |
| R6.4 | How should CLI be bounded given write/edit/delete and process/Git/network are out of scope? |
| R6.5 | How should observability be wired without new dependencies? |
| R6.6 | How should determinism and reproducibility be established for config resolution? |
| R6.7 | How should provenance/verification be modeled for config/CLI? |
| R6.8 | How should security/trust be handled for config file reads and CLI args? |
| R6.9 | What is the provider/model seam precedent, and what remains deferred (Q4.22)? |
| R6.10 | Which deferred items (§22.3/§22.4/§22.5, Q4.22) remain outside scope and how are they handled? |
| R6.11 | What security implications follow from CLI/config boundaries? |
| R6.12 | What engineering trade-offs attend the centralized config + minimal CLI approach? |

---

## 5. Evidence / Source Inventory

Source-of-truth order per authorization; every item read/verified this session:

- `BLUEPRINT.md` — §5 Initial Scope, §6 Future Scope, §7 Principles, §8 Architecture, §9 Phase Architecture, §10 Independence, §11 Lifecycle, §12 Testing, §17 Security, §23 Configuration, §24 Observability, §25 Integration, §26 Non-Goals, §28 Quality, §29 Decision-Making, §30 Governance, §33 Discipline
- `ISSU_PROJECT.md` — §9-§10 DEFINE, §23 Security Audit, §38-39 Next Phase
- `phase-01-foundation/src/index.ts` — frozen public barrel (VERSION, AppError, Result, Logger, loadConfig, readEnv, getSecret, assertContained, runCli)
- `phase-01-foundation/src/config/load.ts`, `defaults.ts`, `resolve.ts`, `jsonc.ts` — layered resolution precedent (defaults → file → env → CLI)
- `phase-01-foundation/src/cli/args.ts`, `main.ts`, `print.ts` — CLI pattern precedent (minimal, zero-dep, typed args, help, exit codes)
- `phase-01-foundation/src/logging/logger.ts`, `pino-logger.ts`, `redaction.ts` — Logger contract + redactionList
- `phase-02/src/index.ts` — frozen `@issue/tool-runtime` barrel (20 types + 3 functions, read-only FS)
- `phase-03/src/index.ts`, `src/internal/harness.ts` — frozen integration harness + stub
- `phase-05/src/index.ts`, `src/internal/provider.ts`, `src/internal/model.ts` — frozen `@issue/analytics` barrel + AnalyticsDecisionProvider seam (no binding)
- `phase-05/DEFINE.md` + `phase-05/RESEARCH.md` (R5.1-12) — research precedent and deferred lists
- `phase-02/TASKS.md` P7-2 boundary audit, `phase-03/TASKS.md` P4-1 assertions — barrel-only precedent
- Git — `main 8dde232` synced, clean (only `.claude-flow/.swarm` untracked)

---

## 6. Research Findings

### R6.1 — Frozen-contract consumption

**[FACT]** Phase 6 may consume: `@issue/foundation` (loadConfig, readEnv, getSecret, Logger, assertContained, runCli, Result/AppError), `@issue/tool-runtime` (runTask, createToolRuntime, TaskStatus, ToolOperation, FileContent, DirectoryListing, TaskResult, DecisionProvider), `@issue/integration` (harness, stub), `@issue/analytics` (runAnalyticsTask + 13 types) — all via **public barrels only**, no deep imports (`@issue/*/internal`), no `require`, verified in `phase-05/package.json` precedent and `phase-02/TASKS.md` P7-2 audit.

**[PRECEDENT]** Phase 3 established barrel-only consumption as integration rule (P4-1 assertions, `phase-03/ARCHITECTURE.md:27,31`); Phase 4 AD-4.1 and Phase 5 AD-5.1 affirmed it for three and four consumers respectively. Phase 6 follows same.

**[INFERENCE]** Any config/CLI behavior needed from frozen phases must be reachable via public exports; internal modules are inaccessible by design — this preserves frozen-phase integrity and avoids TS2307 workaround.

**[UNRESOLVED]** Exact Phase 6 barrel exports (new types/functions) — Specification firewall; not decided here.

---

### R6.2 — Deterministic resolution precedent

**[FACT]** Phase 1 `phase-01-foundation/src/config/load.ts` implements deterministic layered resolution: `defaults → file (JSONC) → env → CLI`, with `mergeConfigLayers` and `Result<AppError>` validation. Phase 5 `phase-05/src/internal/machine.ts` implements deterministic lifecycle `READY→PLANNING→ACQUIRING→PREPARING→ANALYZING→INTERPRETING→VERIFYING→EVALUATING→terminal` with identical inputs → identical results, `reproducibility` 1 on default path.

**[PRECEDENT]** Phase 5 DEFINE §5 objectives: deterministic results, `reproducibility` scores 1 on deterministic default path (`phase-05/README.md:71-72`). Phase 6 should mirror this for config resolution: identical (defaults+file+env+CLI) → identical resolved config.

**[INFERENCE]** Phase 6 does not need a new state machine; it needs a pure function `resolveConfig(layers) → Result<ResolvedConfig, AppError>` plus a CLI dispatch that is itself deterministic (no random, no time-dependent behavior).

---

### R6.3 — Configuration schema typing/validation

**[FACT]** Phase 1 `phase-01-foundation/src/config/defaults.ts` defines typed defaults; `jsonc.ts` parses JSONC; `resolve.ts` validates and merges. `Result<T,E>` + `AppError` (`issue.config.*`, `issue.cli.*`) are the error contract.

**[PRECEDENT]** Phase 5 `phase-05/src/internal/model.ts` defines 13 public types with `readonly` modifiers, `ProvenanceChain`, `UncertaintyInfo` — typed, versioned, no mutation.

**[INFERENCE]** Phase 6 schema should be: `ConfigSchema` (Zod-like but using `typescript` types + manual validation to avoid new dep), `ResolvedConfig` (readonly, versioned), `ConfigSource` discriminated union (`defaults|file|env|cli`), validation via `Result<ResolvedConfig, AppError>` with `issue.config.validation` code, preserving `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`.

**[UNRESOLVED]** Exact schema fields (e.g., `models`, `providers`, `tools`, `permissions`, `memory`, `agent`, `project`, `logging`, `performance` per BLUEPRINT §23), file format (JSONC vs YAML vs TOML) — Architecture/Specification decision.

---

### R6.4 — CLI bounding (no write/exec/network)

**[FACT]** Phase 1 `phase-01-foundation/src/cli/args.ts` parses `string[]` → typed `Args` with no side effects; `main.ts`/`print.ts` handle help and exit codes (0 success, 1 validation, 2 runtime). `phase-01-foundation/src/paths/contain.ts` provides `isContained/assertContained`.

**[FACT]** Out-of-scope per DEFINE §8: no `fs.write`, `child_process`, `fetch`, `Git` — read-only invocation only (Phase 2 `readFile`/`listDirectory` precedent).

**[INFERENCE]** Phase 6 CLI should: parse args → resolve config → dispatch to frozen barrels (`runTask` for `issue run --tool-runtime`, `runAnalyticsTask` for `issue run --analytics`) → print `Result` via `print.ts` pattern → exit. No shell-out, no file writes, no network. `localFile` reads for config file use `isContained` check against cwd (security).

---

### R6.5 — Observability wiring without new deps

**[FACT]** Phase 1 `phase-01-foundation/src/logging/pino-logger.ts` implements `Logger` via `pino 10.3.1`; `phase-02/src/internal/observability.ts:1,14` reuses `createLogger({redact: redactionList()})`.

**[PRECEDENT]** Phase 2 and 5 log `state.transition`, `action.selection`, `tool.execution`, `assessment`, `run.completion` with structured `ctx` (runId, status, attempts) and redaction.

**[INFERENCE]** Phase 6 should reuse `Logger` contract: `logger.info({configSource}, "config.resolved")`, `logger.info({args}, "cli.invoked")`, `logger.error({error}, "cli.failed")`, with `redactionList()` (secrets, file content). No new library; `pino` via foundation only.

---

### R6.6 — Determinism and reproducibility

**[FACT]** Phase 5 `phase-05/tests/determinism.test.ts` asserts identical inputs → identical results, `reproducibility` 1.

**[INFERENCE]** Phase 6 config resolution is pure: `resolveConfig(defaults, fileContent, envSnapshot, cliArgs)` is deterministic if `fileContent` and `envSnapshot` are captured deterministically (no `Date.now`, no `Math.random`, no filesystem ordering dependency beyond `isContained` check). Tests should assert determinism via repeated resolution with same inputs.

**[UNRESOLVED]** Whether `env` snapshot includes `process.env` ordering normalization — Specification decision.

---

### R6.7 — Provenance/verification for config/CLI

**[FACT]** Phase 5 attaches `ProvenanceChain` to every `AnalyticalFinding` and verifies via `phase-05/src/internal/verify.ts` (independent structural verification, no model).

**[INFERENCE]** Phase 6 should attach `ConfigProvenance` to resolved config: `[{source: "defaults"|"file"|"env"|"cli", key, value, redacted: boolean}]`, and verify via `verifyConfig(provenance) → Result<true, AppError>` that no unverified source contributed to `COMPLETED` result. This mirrors Phase 5 provenance without copying its implementation.

**[UNRESOLVED]** Granularity (per-field vs per-source) — Specification decision.

---

### R6.8 — Security/trust for config reads and CLI args

**[FACT]** `phase-01-foundation/src/env/secrets.ts` + `getSecret` + `redactionList` handle secrets; `phase-01-foundation/src/paths/contain.ts` enforces `isContained` for `localFile`.

**[PRECEDENT]** Phase 2 `phase-02/src/internal/runtime.ts:48,53` enforces `isContained(root, target)` before every read; Phase 5 `phase-05/src/internal/acquire.ts` delegates `localFile` to Phase 3 seam which enforces same.

**[INFERENCE]** Phase 6 config file reads must use `isContained(cwd, configPath)` and `assertContained` before `readFile`; CLI args must be validated via `Result` (no `eval`, no `Function`, no dynamic import); secrets from `env` must be redacted in logs via `redactionList()`; no credential persistence.

---

### R6.9 — Provider/model seam precedent

**[FACT]** Phase 4 `phase-04/src/internal/provider.ts` + `phase-05/src/internal/provider.ts` define `*DecisionProvider` seams (`selectSource`, `selectFindingToVerify`, `decideRefinement`) with deterministic first-available stub, no model bound. `phase-05/README.md:100-103` confirms "No model/provider is bound (Q4.22 DEFERRED)."

**[PRECEDENT]** Phase 5 AD-5.2: no modification of frozen phases for provider binding; Phase 4 `phase-04/DECISIONS.md:AD-4.6` similar.

**[INFERENCE]** Phase 6 should define `ConfigDecisionProvider` seam for future model-based config suggestions, but default stub must be deterministic (no model). Q4.22 remains deferred — no `provider` bound in `package.json`, no API key handling beyond `getSecret` redaction.

---

### R6.10 — Deferred items remaining outside scope

**[DURABLE FACT]** Deferred per `phase-05/DEFINE.md:289-301` and `phase-05/README.md:134-144`: §22.3 write/edit/delete/process/Git/network, §22.4 model-provider binding, §22.5 workspace/monorepo, Q4.22, SPEC §17 items (weights/thresholds, persistence, external-data policy, Phase 4 consumption, confidence calibration, provenance granularity, reproducibility level, coverage threshold).

**[NEW DEFINE DECISION]** Phase 6 resolves §22.1 CLI + §22.2 config schema only; §22.3/§22.4/§22.5/Q4.22 remain deferred (see `phase-06/DEFINE.md:12`).

**[INFERENCE]** Any Phase 6 attempt to implement write/exec/Git/network or bind a provider would violate DEFINE §8 and require separate Owner authorization — must be flagged as WORKAROUND if attempted.

---

### R6.11 — Security implications (CLI/config boundaries)

**[FACT]** `ISSU_PROJECT.md:799-847` lists 22 security vectors: trust boundaries, input validation, path traversal, filesystem access, local-file access, external data, network, process exec, Git, write/edit/delete, command injection, deserialization, secret exposure, sensitive logging, error leakage, provider/model, permission boundaries, deny-by-default, failure behavior, dependency risks, config risks, security-sensitive tests.

**[INFERENCE]** Phase 6 introduces new vectors: config file path traversal (mitigated by `isContained`), CLI args injection (mitigated by typed `Result` validation, no `eval`), secret exposure via `config --show` (mitigated by redaction before print), and dependency risk (mitigated by `file:` deps only, no new runtime deps). Security Audit must verify each before Freeze.

---

### R6.12 — Engineering trade-offs (centralized config + minimal CLI)

**[FACT]** Phase 1 `phase-01-foundation/DECISIONS.md:D4` evaluated config layering (defaults→file→env→CLI) vs single-source; chose layered for 12-factor and local override.

**[PRECEDENT]** Phase 5 `phase-05/ARCHITECTURE.md:Q5.12` trade-off: deterministic model-free vs model-augmented — chose deterministic for reproducibility.

**[INFERENCE]** Phase 6 trade-off: **centralized typed config + minimal CLI** (pros: deterministic, testable, no shell-out, reuses Phase 1 patterns, small surface) vs **rich CLI with subcommands/plugins** (cons: complexity, premature abstraction, violates minimalism `BLUEPRINT.md:178-183`). Choose minimal: `issue --help`, `issue config --show`, `issue run [--tool-runtime|--analytics]` only — extensions via future phases, not hidden complexity.

---

## 7. Evidence Classification Legend

Every finding above is tagged:

- **FACT** — verified durable artifact or frozen contract
- **PRECEDENT** — established project governance precedent from prior accepted stage
- **INFERENCE** — reasoned conclusion from facts; not directly stated
- **UNRESOLVED** — requires Architecture/Specification + Owner approval

No inference is treated as fact; no implementation behavior is treated as requirement.

---

## 8. Deferred/Non-Goal Handling

All deferred items per `phase-06/DEFINE.md:12` are preserved as **UNRESOLVED** and will be carried forward to Architecture/Specification as `SPECIFICATION INPUT / UNRESOLVED` (Specification firewall). No deferred item is silently resolved by this Research.

---

## 9. Research Completion Audit

**[NEW RESEARCH DECISION — REQUIRES OWNER ACCEPTANCE]** This Research stage is complete only when:

1. This record exists and satisfies Research authorization elements (questions R6.1-12 addressed, evidence traceable, FACT/PRECEDENT/INFERENCE/UNRESOLVED preserved, conflicts preserved, deferred preserved, no architecture decisions smuggled, frozen boundaries untouched, no implementation started).
2. Owner reviews this record and **explicitly accepts** it in a separate Owner decision (file edit to `Status: ACCEPTED` + End-of-Document block).
3. No Architecture, Specification, Implementation, Test, Refactor, or Freeze work has begun under this authorization.

Progression to Architecture requires a separate Owner decision; it is NOT implied by acceptance of this Research.

---

## 10. Unresolved Items Carried Forward

- Historical Phase 6 records: NONE (verified none exists).
- Config schema exact fields/format/validation codes: UNRESOLVED (Architecture/Specification).
- CLI surface beyond `--help`/`config --show`/`run`: UNRESOLVED.
- Whether Phase 4 (`@issue/research`) is consumed by CLI: default no (per Phase 5 precedent), but remains UNRESOLVED until Specification.
- Q4.22 provider binding: still DEFERRED.
- TS2307 defect: out-of-scope, carried as UNRESOLVED.

---

## 11. Traceability

| Element | Source |
| --- | --- |
| R6.1 frozen contracts | `phase-01-foundation/src/index.ts`, `phase-02/src/index.ts`, `phase-03/src/index.ts`, `phase-05/src/index.ts` |
| R6.2 deterministic precedent | `phase-01-foundation/src/config/load.ts`, `phase-05/src/internal/machine.ts` |
| R6.3 schema typing | `phase-01-foundation/src/config/defaults.ts`, `phase-05/src/internal/model.ts` |
| R6.4 CLI bounding | `phase-01-foundation/src/cli/args.ts`, `DEFINE.md:8` out-of-scope |
| R6.5 observability | `phase-01-foundation/src/logging/pino-logger.ts`, `phase-02/src/internal/observability.ts` |
| R6.6 determinism | `phase-05/tests/determinism.test.ts` |
| R6.7 provenance | `phase-05/src/internal/verify.ts`, `phase-05/src/internal/model.ts:ProvenanceChain` |
| R6.8 security | `phase-01-foundation/src/paths/contain.ts`, `phase-01-foundation/src/env/secrets.ts` |
| R6.9 provider seam | `phase-04/src/internal/provider.ts`, `phase-05/src/internal/provider.ts`, `phase-05/README.md:100-103` |
| R6.10 deferred | `phase-05/DEFINE.md:289-301`, `phase-06/DEFINE.md:12` |
| R6.11 security vectors | `ISSU_PROJECT.md:799-847`, `BLUEPRINT.md:17` |
| R6.12 trade-offs | `phase-01-foundation/DECISIONS.md:D4`, `phase-05/ARCHITECTURE.md:Q5.12` |

---

## 12. Non-Authorization Statement

This Research authorizes **RESEARCH ONLY**. The following are NOT authorized and must not begin without a separate Owner decision:

- **Architecture** (no `ARCHITECTURE.md`/`DECISIONS.md` creation).
- **Specification** (no `SPECIFICATION.md`).
- **Implementation** (no `phase-06/src/**`, `tests/**`, `package.json`, tsconfigs, dependencies).
- **Test**, **Refactor**, **Freeze**, **Next Phase**, TS2307 fix, frozen-phase modification, §22.3/§22.4/§22.5/Q4.22 resolution beyond DEFINE's 22.1/22.2, Phase 7 work.

---

## 13. End-of-Document Block

```
PHASE 6 RESEARCH RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 6 RESEARCH STAGE: ACCEPTED — ARCHITECTURE AUTHORIZED (owner, 2026-08-22)
HISTORICAL RESEARCH RECOVERED: NO (none exists; not reconstructed)
ARCHITECTURE AUTHORIZED: YES (owner, 2026-08-22)
SPECIFICATION AUTHORIZED: NO
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 7 WORK STARTED: NO
COMMIT/PUSH: NO
```
