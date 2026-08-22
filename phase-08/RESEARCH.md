# ISSU — Phase 8: Model Provider Binding — Research Record

**Phase:** 8 — Model Provider Binding
**Stage:** RESEARCH (owner-authorized; accepted DEFINE → Research)
**Status:** ACCEPTED — Owner accepted the Phase 8 Research record (owner, 2026-08-22)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Accepted DEFINE:** `./DEFINE.md` (ACCEPTED, owner, 2026-08-22)
**ISSU Governance:** `../ISSU_PROJECT.md` (1578 lines, durable 0066055)
**License:** Apache License 2.0

This is a **NEW GOVERNED RESEARCH STAGE**. It is NOT a reconstruction of a missing Phase 8 Research record — no prior Phase 8 durable record exists (verified: `phase-08/` missing until 2026-08-22).

---

## 1. Research Status

DRAFT — evidence gathered and recorded for Owner review. Research does NOT decide Architecture, public APIs, schemas, algorithms, technology, provider binding, or acceptance criteria; those remain UNRESOLVED unless stated otherwise here.

---

## 2. Research Authorization

Owner decision: **ACCEPT the NEW GOVERNED Phase 8 DEFINE record and AUTHORIZE Phase 8 RESEARCH** (2026-08-22, "continue on next autonomous gate per our blue print"). Authorized work: evidence-gathering and analysis for the later Architecture and Specification stages, within the mandatory boundaries (no modification of Phase 1/2/3/4/5/6/7, BLUEPRINT, `ISSU_PROJECT.md`, no TS2307 fix or paths workaround, no §22.5/Q4.22 resolution beyond DEFINE's §22.4, no Phase 9 work). Research does NOT authorize Architecture, Specification, Design decisions, or Implementation.

---

## 3. Accepted DEFINE Reference

Accepted as the current authoritative definition of Phase 8 (`phase-08/DEFINE.md`, ACCEPTED 2026-08-22):

- **Domain:** Model Provider Binding — provider abstraction, credential-bound binding, and model routing that makes the deterministic Phase 7 tooling capable of reasoning via models, without locking to a single provider, resolving BLUEPRINT §22.4 / Q4.22 and operationalizing §18 Model Independence + §17 Security.
- **Public surface:** to be defined at Specification (new Phase 8 barrel, not exceeding frozen Phase 7 surface except via explicit new barrel).
- **Scope:** `ModelProvider` interface + `ProviderConfig` + `ModelRouter` + `callModel` seam via `httpFetch` allowlist, credential protection via `getSecret` + `redactionList`.
- **Boundaries:** no workspace/monorepo (§22.5), no persistence beyond provider config, no frozen-phase modification, no unbounded `fetch` without allowlist/timeout.
- **Dependencies:** Phase 1/2/3/5/6/7 public barrels only via `file:` refs (Phase 4 not consumed by default).
- **Deferred:** §22.5 workspace/monorepo remains out-of-scope; §22.4 now in-scope.
- **Objectives:** model-independent provider binding, deterministic where possible, `npm run check` + `build` + `test:coverage ≥80%`, `Security Audit` PASS.

---

## 4. Research Questions

| ID | Question |
| --- | --- |
| R8.1 | What frozen-contract surface may Phase 8 legitimately consume, and through which seams? |
| R8.2 | What provider abstraction precedent exists (ModelProvider interface, ProviderConfig, ProviderResult)? |
| R8.3 | How should model routing be designed (deterministic, cost-aware, capability-aware, no hard-coded provider)? |
| R8.4 | How should credential protection be handled (getSecret, redactionList, ProviderAuth, no persistence)? |
| R8.5 | How should httpFetch allowlist, timeout, size cap, header sanitization be used for provider calls? |
| R8.6 | How should execution integration work (callModel seam for Phase 7 tooling)? |
| R8.7 | How should determinism be preserved where applicable and non-determinism documented where not? |
| R8.8 | How should error handling be modeled (Result<AppError> with issue.provider.* codes)? |
| R8.9 | What is the workspace/monorepo precedent and what remains deferred (§22.5)? |
| R8.10 | Which deferred items (§22.5, plus future domains) remain outside scope and how are they handled? |
| R8.11 | What security implications follow from provider binding (credential exposure, network, permission, secret logging)? |
| R8.12 | What engineering trade-offs attend the model-independent provider binding approach? |

---

## 5. Evidence / Source Inventory

Source-of-truth order per authorization; every item read/verified this session:

- `BLUEPRINT.md` — §5 Initial Scope, §6 Future Scope, §7 Principles, §8 Architecture, §9 Phase Architecture, §10 Independence, §11 Lifecycle, §12 Testing, §17 Security (11 vectors), §18 Model Independence, §23 Configuration, §24 Observability, §25 Integration, §26 Non-Goals, §28 Quality, §29 Decision-Making, §30 Governance, §33 Discipline
- `ISSU_PROJECT.md` — §9-§10 DEFINE, §17 No-Workaround, §23 Security Audit (22 vectors), §38-39 Next Phase
- `phase-01-foundation/src/index.ts` — frozen public barrel (AppError, Result, Logger, loadConfig, readEnv, getSecret, assertContained, isContained, redactionList, runCli)
- `phase-01-foundation/src/env/secrets.ts`, `logging/pino-logger.ts`, `errors/app-error.ts`, `result/result.ts`
- `phase-02/src/index.ts` — frozen `@issue/tool-runtime` barrel (91/91)
- `phase-03/src/index.ts` — frozen `@issue/integration` barrel (65/65)
- `phase-05/src/index.ts` — frozen `@issue/analytics` barrel (61/61) + `src/internal/provider.ts` (AnalyticsDecisionProvider seam, deterministic stub, 13 types)
- `phase-06/src/index.ts` — frozen `@issue/config-cli` barrel (66/66, `ResolvedConfig`, `resolveConfig`)
- `phase-07/src/index.ts` — frozen `@issue/write-execution` barrel (38/38, `writeFile`, `execProcess`, `httpFetch` with allowlist)
- `phase-07/src/internal/fetch.ts` — guarded `httpFetch` precedent (allowlist, timeout, size cap, header sanitization per Ruflo §5.1.8)
- `phase-04/src/internal/provider.ts` — `ResearchDecisionProvider` seam precedent (deterministic first-available stub)
- Git — `main 0066055` synced, `phase-08/` missing until 2026-08-22

---

## 6. Research Findings

### R8.1 — Frozen-contract consumption

**[FACT]** Phase 8 may consume: `@issue/foundation` (AppError, Result, Logger, createLogger, redactionList, readEnv, getSecret, assertContained, isContained), `@issue/tool-runtime` (ResourceBounds), `@issue/integration` (harness), `@issue/analytics` (runAnalyticsTask), `@issue/config-cli` (ResolvedConfig, resolveConfig), `@issue/write-execution` (httpFetch with allowlist, execProcess, writeFile) — all via **public barrels only**, no deep imports, verified in `phase-07/package.json` precedent.

**[PRECEDENT]** Phase 7 AD-7.1 established barrel-only consumption for six consumers (1/2/3/5/6) — Phase 8 follows same for seven consumers (1/2/3/5/6/7).

**[INFERENCE]** Any provider behavior needed from frozen phases must be reachable via public exports; internal modules are inaccessible.

**[UNRESOLVED]** Exact Phase 8 barrel exports — Specification firewall.

---

### R8.2 — Provider abstraction precedent

**[FACT]** No `ModelProvider` interface exists in frozen phases — Phase 5 `AnalyticsDecisionProvider` and Phase 4 `ResearchDecisionProvider` are decision seams, not model providers. `phase-01-foundation` `getSecret` is the credential primitive; `phase-07` `httpFetch` is the network primitive.

**[PRECEDENT]** Phase 5 `phase-05/src/internal/provider.ts` defines `AnalyticsDecisionProvider` with `selectSource`, `selectFindingToVerify`, `decideRefinement` + deterministic first-available stub + `AnalyticsTaskState`. Phase 7 `phase-07/src/internal/fetch.ts` defines `httpFetch` with `allowlist`, `timeoutMs`, `maxResponseBytes`, `allowAuth`.

**[INFERENCE]** Phase 8 `ModelProvider` should mirror `AnalyticsDecisionProvider` pattern: `interface ModelProvider { readonly name: string, generateText(prompt: string, options?: {maxTokens?: number, temperature?: number}) => Promise<Result<string, AppError>>, countTokens(text: string) => Promise<Result<number, AppError>> }` + `ProviderConfig {provider: "anthropic"|"openai"|"local", model: string, apiKeyEnvVar: string, baseUrl?: string, timeoutMs?: number}` + `ProviderError` mapping to `issue.provider.*`.

---

### R8.3 — Model routing design

**[FACT]** `BLUEPRINT.md:18` requires multiple backends (Cloud, Local, Open-source, Specialized) and `Q4.22` is the deferred decision on which provider to bind. `phase-05/DEFINE.md:Q4.22` and `phase-06/DEFINE.md:Q4.22` both defer it.

**[PRECEDENT]** Phase 5 `ModelRouter` not yet exists — Phase 8 will be the first to define it. Phase 6 `resolveConfig` is deterministic layered resolution (defaults→file→env→cli) — routing should be deterministic where possible.

**[INFERENCE]** Phase 8 `ModelRouter` should be `route(task: {objective: string, requiredCapabilities?: string[]}, config: ResolvedConfig) => Result<ModelProvider, AppError>` with deterministic, cost-aware, capability-aware selection from `config.providers` (from `ResolvedConfig` `providers` section), no hard-coded provider, fallback to first-available stub if not configured.

---

### R8.4 — Credential protection

**[FACT]** `phase-01-foundation/src/env/secrets.ts` `getSecret` (reads `process.env` with `redactionList` support), `phase-01-foundation/src/logging/redaction.ts` `redactionList` (returns `["apiKey", "secret", "token", ...]`), `phase-07/src/internal/fetch.ts` `sanitizeHeaders` (blocks `Authorization`/`Cookie`/`X-Auth-*` unless `allowAuth`).

**[PRECEDENT]** Phase 6 `phase-06/src/internal/cli.ts` `redactConfigForPrint` replaces `models/providers/permissions` with `[REDACTED]`; Phase 7 `audit.ts` `createToolLogger({redact: redactionList()})`.

**[INFERENCE]** Phase 8 `ProviderAuth` should use `getSecret(apiKeyEnvVar)` → `Result<string, AppError>` ( `issue.provider.auth` if missing), `redactionList()` before any log, `ProviderConfig` never persisted, `apiKey` never in `ResolvedConfig` plain, only via `getSecret` at call time.

---

### R8.5 — httpFetch for provider calls

**[FACT]** `phase-07/src/internal/fetch.ts` implements guarded `httpFetch` with `https:` only, `isPrivateHost` check, `timeoutMs` 30000/60000, `maxResponseBytes` 256KB/1MB, `sanitizeHeaders`, `User-Agent: ruflo-http-fetch/1.0`.

**[PRECEDENT]** Phase 7 `httpFetch` is the only network seam; all other phases remain offline.

**[INFERENCE]** Phase 8 `callModel` should delegate to `httpFetch` with `allowAuth: true` (since provider requires `Authorization: Bearer <apiKey>`), but with `allowPrivate: false` (no RFC1918), `timeoutMs` from `ProviderConfig`, `maxResponseBytes` 1MB max, and `Authorization` header constructed from `getSecret` at call time (not stored).

---

### R8.6 — Execution integration (callModel seam)

**[FACT]** `BLUEPRINT.md:8` Architecture Philosophy shows `Agent Runtime → Tool System` → `Domain Capabilities`; `phase-07` `execProcess` + `writeFile` are the tool system for acting.

**[INFERENCE]** Phase 8 `callModel(prompt, provider, options?) → Promise<Result<string, AppError>>` is the seam that Phase 7 tooling can invoke via provider, with `Result` + audit `model.audit` via `createToolLogger`.

---

### R8.7 — Determinism

**[FACT]** Phase 6 `phase-06/tests/determinism.test.ts` asserts identical inputs → identical `ResolvedConfig`.

**[INFERENCE]** Phase 8 provider calls are **non-deterministic** (network, model temperature, external data) per `BLUEPRINT.md:41` non-goals, tests should assert determinism for mocked `httpFetch` and explicitly mark non-determinism for real provider calls (time-dependent, environment-dependent, external-data dependence) per `ISSU_PROJECT.md:21`.

---

### R8.8 — Error handling

**[FACT]** `phase-01-foundation/src/result/result.ts` `Result<T, AppError>` + `phase-01-foundation/src/errors/app-error.ts` `AppError` with `code`, `message`, `details`, `cause`, `recoverable`.

**[PRECEDENT]** Phase 7 `phase-07/src/internal/write.ts` uses `issue.write.*`, `phase-07/src/internal/process.ts` uses `issue.process.*`, `phase-07/src/internal/fetch.ts` uses `issue.network.*`.

**[INFERENCE]** Phase 8 should use `issue.provider.*` codes: `issue.provider.not-configured`, `issue.provider.auth`, `issue.provider.timeout`, `issue.provider.rate-limited`, `issue.provider.validation`, `issue.provider.not-allowed`.

---

### R8.9 — Workspace/monorepo precedent

**[FACT]** `BLUEPRINT.md:22.5` workspace/monorepo migration is deferred via `phase-08/DEFINE.md:12` and `phase-07/DEFINE.md:12` — `phase-08/` remains phase-scoped, no root `package.json` workspace.

**[PRECEDENT]** All phases `01-07` are phase-scoped (`phase-0X/` with `file:../phase-0Y` refs), no monorepo.

**[INFERENCE]** Phase 8 should remain phase-scoped; workspace migration is Phase 9+.

---

### R8.10 — Deferred items remaining outside scope

**[DURABLE FACT]** Deferred per `phase-07/DEFINE.md:12` and `phase-07/FREEZE_REPORT.md:10`: §22.5 workspace/monorepo.

**[NEW DEFINE DECISION]** Phase 8 resolves §22.4 / Q4.22 only; §22.5 remains deferred (see `phase-08/DEFINE.md:12`).

---

### R8.11 — Security implications

**[FACT]** `BLUEPRINT.md:17` 11 vectors + `ISSU_PROJECT.md:799-847` 22 vectors: trust boundaries, input validation, path traversal, filesystem access, external data, network, process exec, Git, write/edit/delete, command injection, deserialization, secret exposure, permission boundaries, deny-by-default, etc.

**[INFERENCE]** Phase 8 introduces new vectors: credential exposure (apiKey via `getSecret` + `redactionList`), network via `httpFetch` (allowlist, header sanitization, size cap, timeout), provider/model boundaries (no single provider lock, multiple backends). Security Audit must verify each before Freeze.

---

### R8.12 — Engineering trade-offs

**[FACT]** Phase 1 `phase-01-foundation/DECISIONS.md:D4` evaluated config layering; Phase 7 `phase-07/ARCHITECTURE.md:Q7.12` chose permission-bound sandboxed tooling over rich tooling.

**[INFERENCE]** Phase 8 trade-off: **model-independent provider binding** (pros: multiple backends, no lock, reuse `httpFetch` + `getSecret` + `Result`, small surface, testable with mocked fetch) vs **single-provider hard-coded** (cons: lock, violates `BLUEPRINT.md:18`, requires rewrite for new provider). Choose model-independent: `ModelProvider` interface + `ModelRouter` + `callModel` via `httpFetch`, no hard-coded provider — extensions via new `ModelProvider` impl, not core rewrite.

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

All deferred items per `phase-08/DEFINE.md:12` are preserved as **UNRESOLVED** and will be carried forward to Architecture/Specification as `SPECIFICATION INPUT / UNRESOLVED` (Specification firewall). No deferred item is silently resolved by this Research.

---

## 9. Research Completion Audit

**[NEW RESEARCH DECISION — REQUIRES OWNER ACCEPTANCE]** This Research stage is complete only when:

1. This record exists and satisfies Research authorization elements (questions R8.1-12 addressed, evidence traceable, FACT/PRECEDENT/INFERENCE/UNRESOLVED preserved, conflicts preserved, deferred preserved, no architecture decisions smuggled, frozen boundaries untouched, no implementation started).
2. Owner reviews this record and **explicitly accepts** it in a separate Owner decision (file edit to `Status: ACCEPTED` + End-of-Document block).
3. No Architecture, Specification, Implementation, Test, Refactor, or Freeze work has begun under this authorization.

Progression to Architecture requires a separate Owner decision; it is NOT implied by acceptance of this Research.

---

## 10. Unresolved Items Carried Forward

- Historical Phase 8 records: NONE (verified none exists).
- Exact public API (ModelProvider, ProviderConfig, ModelRouter, callModel signatures), provider list (anthropic/openai/local), credential flow, routing algorithm, and test thresholds remain **UNRESOLVED** — to be decided at ARCHITECTURE/SPECIFICATION.
- Whether Phase 4 (`@issue/research`) is consumed — default no, remains UNRESOLVED until Specification.
- §22.5 workspace/monorepo: still DEFERRED.
- TS2307 defect: out-of-scope, carried as UNRESOLVED.

---

## 11. Traceability

| Element | Source |
| --- | --- |
| R8.1 frozen contracts | `phase-01-foundation/src/index.ts`, `phase-02/src/index.ts`, `phase-03/src/index.ts`, `phase-05/src/index.ts`, `phase-06/src/index.ts`, `phase-07/src/index.ts` |
| R8.2 provider abstraction | `phase-04/src/internal/provider.ts`, `phase-05/src/internal/provider.ts`, `phase-01-foundation/src/env/secrets.ts` |
| R8.3 routing | `BLUEPRINT.md:18`, `phase-07/DEFINE.md:12` (Q4.22) |
| R8.4 credential | `phase-01-foundation/src/env/secrets.ts`, `phase-07/src/internal/fetch.ts` (sanitizeHeaders) |
| R8.5 httpFetch | `phase-07/src/internal/fetch.ts` (allowlist, timeout, size cap) |
| R8.6 callModel seam | `BLUEPRINT.md:8` (Agent Runtime → Tool System) |
| R8.7 determinism | `phase-06/tests/determinism.test.ts` |
| R8.8 error handling | `phase-01-foundation/src/result/result.ts`, `phase-07/src/internal/write.ts` (issue.write.*) |
| R8.9 workspace | `BLUEPRINT.md:22.5`, `phase-07/DEFINE.md:12` |
| R8.10 deferred | `phase-07/DEFINE.md:12`, `phase-08/DEFINE.md:12` |
| R8.11 security vectors | `ISSU_PROJECT.md:799-847`, `BLUEPRINT.md:17` |
| R8.12 trade-offs | `phase-01-foundation/DECISIONS.md:D4`, `phase-07/ARCHITECTURE.md:Q7.12` |

---

## 12. Non-Authorization Statement

This Research authorizes **RESEARCH ONLY**. The following are NOT authorized and must not begin without a separate Owner decision:

- **Architecture** (no `ARCHITECTURE.md`/`DECISIONS.md` creation).
- **Specification** (no `SPECIFICATION.md`).
- **Implementation** (no `phase-08/src/**`, `phase-08/tests/**`, `phase-08/package.json`, tsconfigs, dependencies).
- **Test**, **Refactor**, **Freeze**, **Next Phase**, TS2307 fix, frozen-phase modification, §22.5 resolution beyond DEFINE's §22.4, Phase 9 work.

---

## 13. End-of-Document Block

```
PHASE 8 RESEARCH RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 8 RESEARCH STAGE: ACCEPTED — ARCHITECTURE AUTHORIZED (owner, 2026-08-22)
HISTORICAL RESEARCH RECOVERED: NO (none exists; not reconstructed)
ARCHITECTURE AUTHORIZED: YES (owner, 2026-08-22)
SPECIFICATION AUTHORIZED: NO
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6/7 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 9 WORK STARTED: NO
COMMIT/PUSH: NO
```
