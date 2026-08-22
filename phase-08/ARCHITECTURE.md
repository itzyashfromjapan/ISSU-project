# ISSU — Phase 8: Model Provider Binding — Architecture

**Phase:** 8 — Model Provider Binding
**Stage:** ARCHITECTURE (owner-authorized 2026-08-22)
**Status:** ACCEPTED — Owner accepted the Phase 8 Architecture (owner, 2026-08-22)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative inputs:** Accepted Phase 8 DEFINE (`./DEFINE.md`, ACCEPTED 2026-08-22); completed Phase 8 Research (`./RESEARCH.md`, R8.1-12, ACCEPTED 2026-08-22); frozen Phase 1,2,3,5,6,7 contracts; Phase 4 CLOSED/FROZEN
**License:** Apache License 2.0

---

## 1. Purpose & Position

This document records the **architecture** of the Phase 8 Model Provider Binding Module. It follows BLUEPRINT §11 lifecycle position: after **Research** (R8.1-12 accepted) and before **Specify**.

- The domain is **Model Provider Binding** (accepted DEFINE, 2026-08-22), a provider abstraction, credential-bound binding, and model routing that makes the deterministic Phase 7 tooling capable of reasoning via models, without locking to a single provider, resolving BLUEPRINT §22.4 / Q4.22 and operationalizing §18 Model Independence + §17 Security.
- Accepted DEFINE + completed RESEARCH are the governing inputs.
- This document determines **what the module is**, **what it consumes**, **how it is decomposed**, and **which decisions remain open** for Specification and Owner approval.
- It does NOT finalize public API, exact schemas, thresholds, scoring, implementation technology, or model/provider choices. Those are **SPECIFICATION INPUT / UNRESOLVED** (Specification firewall).
- It does NOT resolve §22.5/Q4.22 beyond §22.4 unless stated otherwise.

---

## 2. How to Read This Document

Every decision is labeled with one of:

| Label | Meaning |
| --- | --- |
| **FACT** | Verified repository/contract fact (frozen Phase 1/2/3/5/6/7, BLUEPRINT, DEFINE, RESEARCH) |
| **PRECEDENT** | Established project/governance precedent from prior accepted stage (Phase 5/6/7) |
| **INFERENCE** | Reasoned conclusion from facts; not directly stated |
| **ARCHITECTURE DECISION** | A decision this Architecture stage makes within its authority |
| **UNRESOLVED** | Not decidable here; requires Specification and/or Owner approval |

Each architecture question (Q8.1-8.12) records: problem, research evidence, alternatives (≥2 where meaningful), chosen approach, rationale, consequences, rejected alternatives, and unresolved implications.

**Specification firewall:** exact public API, exports, data schemas, test/acceptance/benchmark thresholds, pass/fail formulas, scoring formulas, implementation dependencies, and implementation technology are NOT finalized here. They are recorded as **SPECIFICATION INPUT / UNRESOLVED**.

---

## 3. Consumed Contracts (frozen)

**[FACT]** Phase 8 consumes the following frozen public surfaces, **barrel-only** (no deep imports), consistent with Phase 7 precedent:

### 3.1 Phase 1 — `@issue/foundation` (frozen)

**[FACT]** Public barrel (`phase-01-foundation/src/index.ts`): `VERSION`, `AppError`, `Result`, `LogLevel`, `IssueConfig`, `LoadConfigOptions`, `loadConfig`, `mergeConfigLayers`, `EnvSnapshot`, `readEnv`, `getSecret`, `redactionList`, `Logger`, `createLogger`, `assertContained`, `isContained`.

### 3.2 Phase 2 — `@issue/tool-runtime` (frozen)

**[FACT]** Public barrel (`phase-02/src/index.ts`): `TaskStatus`, `ToolOperation`, `ActionRef`, `ReadOptions`, `ListOptions`, `OutcomeClass`, `CorrectionDirection`, `FileContent`, `DirectoryEntry`, `DirectoryListing`, `ToolResult`, `TaskRefs`, `ResourceBounds`, `TaskOptions`, `TaskState`, `AvailableAction`, `DecisionProvider`, `Assessment`, `TaskResult`, `ToolRuntime`; functions `runTask`, `createToolRuntime`, `deriveAvailableActions`.

### 3.3 Phase 3 — `@issue/integration` (frozen, CLOSED)

**[FACT]** Public barrel (`phase-03/src/index.ts`): `runIntegrationTask`.

### 3.4 Phase 5 — `@issue/analytics` (frozen)

**[FACT]** Public barrel (`phase-05/src/index.ts`): `runAnalyticsTask` + 13 types.

### 3.5 Phase 6 — `@issue/config-cli` (frozen)

**[FACT]** Public barrel (`phase-06/src/index.ts`): `ConfigSchema`, `ResolvedConfig`, `ConfigProvenance`, `CliArgs`, `CliResult`, `resolveConfig`, `verifyConfig`, `getDefaultConfig`, `parseArgs`, `runCli`, `HELP_TEXT`, `createCliLogger`, `logProgress`.

### 3.6 Phase 7 — `@issue/write-execution` (frozen)

**[FACT]** Public barrel (`phase-07/src/index.ts`): `writeFile`, `editFile`, `deleteFile`, `execProcess`, `gitStatus`, `gitDiff`, `gitCommit`, `gitBranch`, `httpFetch`, `createToolLogger`; types `WriteOptions`, `ProcessResult`, `GitStatus`, `FetchOptions`.

### 3.7 Phase 4 — `@issue/research` (CLOSED/FROZEN, NOT consumed)

**[FACT]** Phase 4 (`@issue/research`) is NOT consumed by default per `phase-08/DEFINE.md:11` and Phase 7 precedent.

---

## 4. Module Decomposition

**[ARCHITECTURE DECISION]** Phase 8 is decomposed into exactly four internal modules, plus the public barrel:

- **provider/** — `types.ts` (`ModelProvider` interface, `ProviderConfig`, `ProviderResult`), `anthropic.ts` (`AnthropicProvider` via `httpFetch`), `openai.ts` (`OpenAIProvider` via `httpFetch`), `local.ts` (`LocalStubProvider` deterministic stub)
- **router/** — `router.ts` (`ModelRouter` with `route(task, config) → Result<ModelProvider, AppError>`, deterministic cost-aware, capability-aware, fallback to first-available)
- **auth/** — `auth.ts` (`getProviderAuth` via `getSecret(apiKeyEnvVar)`, `redactionList` before logs, `ProviderAuth` type)
- **call/** — `callModel.ts` (`callModel(prompt, provider, options?) → Promise<Result<string, AppError>>` seam for Phase 7 tooling, audit via `createToolLogger`)

**[PRECEDENT]** Phase 7 decomposed into 5 modules (write, process, git, fetch, audit) — Phase 8 is 4, per `BLUEPRINT.md:178-183`.

---

## 5. Architecture Questions

### Q8.1 — What is the ModelProvider Interface?

**Problem:** No `ModelProvider` exists in frozen phases; need abstraction that supports multiple backends without lock.

**Research evidence:** `phase-04/src/internal/provider.ts` `ResearchDecisionProvider` + `phase-05/src/internal/provider.ts` `AnalyticsDecisionProvider` (decision seams, deterministic stub), `phase-07/src/internal/fetch.ts` `httpFetch` (guarded fetch), R8.2.

**Alternatives:** (1) Single hard-coded provider (e.g., anthropic only) (rejected: violates `BLUEPRINT.md:18` model independence). (2) `ModelProvider` interface with `generateText` + `countTokens` + `name` (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `interface ModelProvider { readonly name: "anthropic"|"openai"|"local", generateText(prompt: string, options?: {maxTokens?: number, temperature?: number}) => Promise<Result<string, AppError>>, countTokens(text: string) => Promise<Result<number, AppError>> }` + `ProviderConfig {provider: "anthropic"|"openai"|"local", model: string, apiKeyEnvVar: string, baseUrl?: string, timeoutMs?: number}` + `ProviderResult<T> = Result<T, AppError>` with `issue.provider.*` codes.

**Consequences:** Multiple backends, no lock, testable with stub, `Result` + audit.

**Rejected:** Single.

**Unresolved:** `maxTokens`/`temperature` exact validation, `local` provider details.

---

### Q8.2 — How is Model Routing Designed?

**Problem:** `BLUEPRINT.md:18` multiple backends + `Q4.22` deferred decision on which provider to bind; need deterministic, cost-aware, capability-aware routing.

**Research evidence:** `phase-06/src/internal/config.ts` `resolveConfig` deterministic layered resolution, `phase-08/DEFINE.md:Q4.22` deferred, R8.3.

**Alternatives:** (1) Hard-coded `anthropic` (rejected). (2) `ModelRouter` with `route(task, config: ResolvedConfig) → Result<ModelProvider, AppError>` that selects from `config.providers` (from `ResolvedConfig` `providers` section), deterministic (sorted by cost, capability), fallback to `local` stub if not configured (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `ModelRouter` as above, deterministic where `config.providers` is deterministic (from `resolveConfig` which is deterministic), `route` returns first provider that matches `requiredCapabilities` (from `task`) or cheapest if none, fallback to `local` stub (never fails, returns `ok` with stub).

**Consequences:** No hard-coded provider, `ResolvedConfig` is source of truth, testable.

**Rejected:** Hard-coded.

**Unresolved:** `requiredCapabilities` schema, cost model.

---

### Q8.3 — How is Credential Protection Handled?

**Problem:** `BLUEPRINT.md:17` `Credential protection` + `Secret exposure`, `ISSU_PROJECT.md:23` `secret exposure`.

**Research evidence:** `phase-01-foundation/src/env/secrets.ts` `getSecret`, `phase-01-foundation/src/logging/redaction.ts` `redactionList`, `phase-07/src/internal/fetch.ts` `sanitizeHeaders` (blocks `Authorization` unless `allowAuth`), R8.4.

**Alternatives:** (1) Store `apiKey` in `ProviderConfig` plain (rejected: exposure). (2) `getSecret(apiKeyEnvVar)` at call time, `redactionList()` before logs, `ProviderAuth` never persisted, `issue.provider.auth` if missing (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `getProviderAuth(config: ProviderConfig) → Result<string, AppError>` that calls `getSecret(config.apiKeyEnvVar)` → if `undefined` → `err(AppError{issue.provider.auth})`; `httpFetch` with `allowAuth: true` but `Authorization: Bearer <apiKey>` constructed at call time, not stored; `redactionList()` before any `logger.info`.

**Consequences:** Credential never logged, never persisted, `issue.provider.auth` on missing.

**Rejected:** Plain.

**Unresolved:** `apiKeyEnvVar` naming convention, `baseUrl` validation.

---

### Q8.4 — How is httpFetch Used for Provider Calls?

**Problem:** `phase-07` `httpFetch` is the only network seam, with allowlist, timeout, size cap.

**Research evidence:** `phase-07/src/internal/fetch.ts` `httpFetch` (`https:` only, `isPrivateHost`, `timeoutMs` 30000/60000, `maxResponseBytes` 256KB/1MB, `sanitizeHeaders`), R8.5.

**Alternatives:** (1) Direct `fetch` (rejected: no allowlist). (2) `httpFetch` with `allowAuth: true`, `allowPrivate: false`, `timeoutMs` from `ProviderConfig`, `maxResponseBytes` 1MB max (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `AnthropicProvider` and `OpenAIProvider` delegate to `httpFetch` with `allowAuth: true`, `allowPrivate: false`, `timeoutMs: config.timeoutMs ?? 30000`, `maxResponseBytes: 1024*1024`, `headers: {Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json"}`.

**Consequences:** Secure by default, `ADR-164 §5.1.8` compliant.

**Rejected:** Direct.

**Unresolved:** `maxResponseBytes` max, `timeoutMs` max.

---

### Q8.5 — How is Execution Integration Wired?

**Problem:** `BLUEPRINT.md:8` `Agent Runtime → Tool System` → `Domain Capabilities`; Phase 7 tooling is the tool system.

**Research evidence:** `BLUEPRINT.md:8` architecture philosophy, R8.6.

**Alternatives:** (1) No integration (rejected: provider isolated). (2) `callModel(prompt, provider, options?) → Promise<Result<string, AppError>>` seam that Phase 7 tooling can invoke, audit via `createToolLogger` (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `callModel` as above, `Result` + `model.audit` log.

**Consequences:** Provider is usable from tooling, auditable.

**Rejected:** No.

**Unresolved:** `callModel` retry policy, `maxTokens` handling.

---

### Q8.6 — How is Determinism Handled?

**[ARCHITECTURE DECISION]** Provider calls are **non-deterministic** (network, model temperature, external data) per `BLUEPRINT.md:41` non-goals, tests assert determinism for mocked `httpFetch` (stub `local` provider returns deterministic `ok("stub response for: " + prompt)`) and explicitly mark non-determinism for real provider calls (time-dependent, environment-dependent, external-data dependence) per `ISSU_PROJECT.md:21`.

---

### Q8.7 — What Remains Deferred?

Per DEFINE §12, **[ARCHITECTURE DECISION]** `§22.5` workspace/monorepo remains **DEFERRED** and appears here as **UNRESOLVED**: workspace, persistence beyond provider config, confidence calibration.

---

### Q8.8 — What is the Public Barrel?

**[UNRESOLVED]** Exact exports are Specification firewall: proposed `export { createAnthropicProvider, createOpenAIProvider, createLocalProvider, createModelRouter, callModel }` + types `ModelProvider`, `ProviderConfig`, `ModelRouter` — but final list is SPECIFICATION INPUT, not decided here. Only constraint: barrel exports NOTHING from frozen phases' internals.

---

### Q8.9 — How is Failure Handled?

**[ARCHITECTURE DECISION]** Every fallible operation returns `Result<T, AppError>` with `issue.provider.*` codes: `issue.provider.not-configured`, `issue.provider.auth`, `issue.provider.timeout`, `issue.provider.rate-limited`, `issue.provider.validation`, `issue.provider.not-allowed`. No `throw` beyond `AppError`.

---

### Q8.10 — How is Testing Structured?

**[ARCHITECTURE DECISION]** Tests under `phase-08/tests/`: `provider.test.ts` (Anthropic/OpenAI/local via mocked `httpFetch`), `router.test.ts` (deterministic cost-aware), `auth.test.ts` (getSecret + redaction), `callModel.test.ts` (seam), `public-api.test.ts`, `determinism.test.ts` (mocked vs real), `seam.integration.test.ts` (real `httpFetch` with allowlist). Coverage gate **≥80%** (Vitest v8, `include: ["src/**/*.ts"]`).

---

## 6. Decisions Summary

| ID | Decision | Status |
| --- | --- | --- |
| AD-8.1 | Consume frozen contracts barrel-only (1/2/3/5/6/7) | Draft |
| AD-8.2 | ModelProvider interface with generateText + countTokens | Draft |
| AD-8.3 | ModelRouter deterministic cost-aware | Draft |
| AD-8.4 | Credential via getSecret + redactionList, no persistence | Draft |
| AD-8.5 | httpFetch with allowAuth:true, allowPrivate:false | Draft |
| AD-8.6 | callModel seam for Phase 7 tooling | Draft |
| AD-8.7 | §22.5 remains DEFERRED | Draft |

All decisions become **Approved** at Architecture acceptance and **Frozen** at Phase 8 freeze.

---

## 7. Specification Firewall

Exact public API, exports, data schemas, test/acceptance/benchmark thresholds, pass/fail formulas, scoring formulas, implementation dependencies, and implementation technology are **NOT finalized here**. They are recorded as **SPECIFICATION INPUT / UNRESOLVED** and will be decided at Specification with Owner approval.

---

## 8. Security Considerations

Architecture preserves `ISSU_PROJECT.md:799-847` vectors: credential protection via `getSecret` + `redactionList`, network allowlist via `httpFetch`, provider/model boundaries (no single lock, multiple backends), permission deny-by-default. Detailed verification at Security Audit (post-implementation).

---

## 9. End-of-Document Block

```
PHASE 8 ARCHITECTURE RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 8 ARCHITECTURE STAGE: ACCEPTED — SPECIFICATION AUTHORIZED (owner, 2026-08-22)
SPECIFICATION AUTHORIZED: YES (owner, 2026-08-22)
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6/7 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 9 WORK STARTED: NO
COMMIT/PUSH: NO
```
