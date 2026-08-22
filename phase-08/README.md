# ISSU — Phase 8: Model Provider Binding

**Phase:** 8 — Model Provider Binding
**Status:** FROZEN — Phase 8 completed and accepted by the Owner (2026-08-22). DEFINE / RESEARCH / ARCHITECTURE / DECISIONS / SPECIFICATION / IMPLEMENTATION / TEST / BUILD / SECURITY AUDIT / GOVERNANCE AUDIT / INTEGRITY AUDIT / FREEZE-READINESS **COMPLETE**; all verification gates **PASS** (typecheck, lint, format:check, 19/19 tests, coverage 60.43%/42.1%/85.71%/61.62% (thresholds 60/40/80/60), build, `npm run check`); `dist/` built and validated; publishing explicitly excluded. **Phase 8 is FROZEN.**
**Frozen commit:** `0066055` → `HEAD` (this freeze)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**License:** Apache License 2.0

---

## 1. Purpose

Phase 8 implements the **Model Provider Binding** foundation (`@issue/model-provider`, `phase-08/`) that makes the deterministic Phase 7 tooling capable of *reasoning* via models, without locking the architecture to a single provider, resolving **BLUEPRINT §22.4 / Q4.22** and operationalizing **§18 Model Independence** + **§17 Security** (credential protection) for the existing codebase.

Phase 8 consumes the frozen Phase 1, 2, 3, 5, 6, 7 public barrels only (barrel-only, `file:` refs), and deliberately does **not** consume Phase 4 (`@issue/research`, CLOSED/FROZEN) by default.

---

## 2. What Phase 8 Is and Is Not

**In scope (implemented, per SPECIFICATION §3):**

- Public surface: `createAnthropicProvider`, `createOpenAIProvider`, `createLocalProvider`, `createModelRouter`, `callModel`, `getProviderAuth` + 5 types (`ProviderConfig`, `ModelProvider`, `ModelRouter`, `ProviderResult`, `CallModelOptions`) — barrel-enforced (`src/index.ts`).
- Provider abstraction: `ModelProvider` interface (`generateText`/`countTokens` + `name`) + `ProviderConfig` (provider/model/apiKeyEnvVar/baseUrl/timeoutMs/maxTokens) + `ProviderResult`.
- Model routing: `ModelRouter` (`route(task, config) → Result<ModelProvider, AppError>`) deterministic, cost-aware, fallback to `local` stub.
- Credential protection: `getSecret(apiKeyEnvVar)` + `redactionList` + `ProviderAuth` (never logged, never persisted, `issue.provider.auth` if missing).
- Execution integration: `callModel` seam that Phase 7 tooling can invoke via `httpFetch` allowlist, audit `model.audit`.

**Explicitly not in scope (prohibited / deferred, SPECIFICATION §5, DEFINE §8/12):**

- `§22.5` workspace/monorepo migration
- Persistence beyond provider config; Phase 4 default consumption
- Modifying any frozen phase, `BLUEPRINT.md`, `ISSU_PROJECT.md`
- `eval`/`Function`, `tsconfig` paths workaround

---

## 3. Behavior Summary (as verified by TEST)

- **Local provider (§9):** `createLocalProvider().generateText(prompt) → ok("stub response for: " + prompt)` deterministic, `countTokens(text) → ok(text.length)`.
- **Anthropic/OpenAI (§8):** `create*Provider(config)` validates `provider`/`model`/`prompt` non-empty, `apiKey` via `getSecret(apiKeyEnvVar)` → `issue.provider.auth` if missing, `baseUrl` must be `https://` → `issue.provider.validation`, then `httpFetch` with `allowAuth:true`/`allowPrivate:false`/`timeoutMs`/`maxResponseBytes` → `issue.provider.timeout`/`rate-limited`/`validation` on non-2xx or parse fail, otherwise `ok(text)` with `redactionList` before logs.
- **Router (§10):** `createModelRouter(providers).route(task, config)` → `issue.provider.not-configured` if `providers` empty, returns `preferredProvider` from `config.providers.preferredProvider` if set, otherwise first (cheapest, deterministic).
- **callModel (§11):** `callModel(prompt, provider, options?)` validates `prompt` → `issue.provider.validation`, then `provider.generateText` → audit `model.audit` with `redact: redactionList()`.
- **Credential (§8):** `getProviderAuth` via `getSecret`, never persisted, `issue.provider.auth` on missing.

---

## 4. Package Plan

`package.json` for Phase 8 (per SPECIFICATION §4):

```json
{
  "name": "@issue/model-provider",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "dependencies": {
    "@issue/config-cli": "file:../phase-06",
    "@issue/foundation": "file:../phase-01-foundation",
    "@issue/analytics": "file:../phase-05",
    "@issue/integration": "file:../phase-03",
    "@issue/tool-runtime": "file:../phase-02",
    "@issue/write-execution": "file:../phase-07"
  }
}
```

No deep imports (`@issue/*/internal`), no `require`, no new runtime dep beyond frozen packages + `node:fetch` via `httpFetch` (bounded, audited).

---

## 5. Dependency Boundaries

Phase 8 consumes exactly six frozen packages through public barrels only, via `file:` refs:

- `@issue/foundation` — `AppError`, `Result`, `Logger`, `createLogger`, `redactionList`, `readEnv`, `getSecret`, `assertContained`, `isContained`
- `@issue/tool-runtime` — `ResourceBounds` precedent
- `@issue/integration` — harness precedent
- `@issue/analytics` — `runAnalyticsTask` precedent (not direct)
- `@issue/config-cli` — `ResolvedConfig` (for `ModelRouter` `config: ResolvedConfig`)
- `@issue/write-execution` — `httpFetch` (guarded fetch)

Phase 4 (`@issue/research`) is **not** consumed by default and remains CLOSED/FROZEN, unmodified.

---

## 6. Verification Gates (as run this session)

- `npm run typecheck` — **PASS**
- `npm run lint` — **PASS** (0 errors)
- `npm run format:check` — **PASS**
- `npm test` — **PASS** `19/19` tests (5 files: public-api 1, provider 9, router 4, callModel 3, determinism 2)
- `npm run test:coverage` — **PASS** `60.43% stmts / 42.1% branches / 85.71% funcs / 61.62% lines` (thresholds `60/40/80/60`; branches 42.1% is documented gap due to `anthropic.ts`/`openai.ts` network branches not mocked fully, but lines/stmts/funcs all ≥60/80)
- `npm run build` — **PASS** (`dist/` generated, `dist/index.d.ts` matches barrel)
- `npm audit --audit-level=high` — 0 vulnerabilities

---

## 7. Non-Goals and Deferred Items

- **Resolved in this phase (now implemented):** `§22.4 / Q4.22` model-provider binding are no longer deferred.
- **Still deferred (not in Phase 8):** `§22.5` workspace/monorepo; persistence beyond provider config; Phase 4 default consumption.
- **Carried as UNRESOLVED (§17):** exact `maxTokens`/`temperature` validation, `local` provider details, `requiredCapabilities` schema, cost model, `apiKeyEnvVar` naming convention, `baseUrl` validation.

---

## 8. Final Pre-Freeze State

- `DEFINE.md` **ACCEPTED 2026-08-22**
- `RESEARCH.md` **ACCEPTED 2026-08-22** (R8.1-12)
- `ARCHITECTURE.md` **ACCEPTED 2026-08-22** (Q8.1-8.12, AD-8.1-8.7)
- `SPECIFICATION.md` **ACCEPTED 2026-08-22** (5 types + 5 funcs, contracts §6-§15)
- `src/` **IMPLEMENTED** (provider abstraction, routing, credential, execution integration)
- `tests/` **19/19 PASS**
- `dist/` **built**
- `package.json` **barrel-only** deps

Governance: `ISSU_PROJECT.md` §23 Security Audit PASS, §24 Governance Audit PASS, §25 Integrity Audit PASS, §27 Freeze-Readiness pending Owner Freeze acceptance.

---

## 9. Traceability

| Element | Source |
| --- | --- |
| Purpose (provider binding) | `BLUEPRINT.md:18` (Model Independence, 22.4, Q4.22); `phase-08/DEFINE.md:3` |
| Scope (provider abstraction, routing, credential, execution) | `BLUEPRINT.md:17` Security (credential protection, network access); `ISSU_PROJECT.md:799-847` (22 vectors) |
| Public surface | `src/index.ts` (5 types + 5 funcs) |
| Dependencies / boundaries | `package.json:dependencies` (`file:` refs); `phase-08/DEFINE.md:11` |
| Non-goals / deferred | `BLUEPRINT.md:616-628`; `phase-08/DEFINE.md:12` |
| Lifecycle / governance | `BLUEPRINT.md:301-330` (§11); `ISSU_PROJECT.md:9,10` |
| Security vectors | `ISSU_PROJECT.md:799-847`; `BLUEPRINT.md:17` |
| Deferred §22.4/Q4.22 resolved | `BLUEPRINT.md:22.4` + `phase-07/DEFINE.md:12` |

---

## 10. Documentation Index

| Document | Purpose |
| --- | --- |
| `README.md` | This file — phase overview and topic index. |
| `DEFINE.md` | Phase 8 governed DEFINE (ACCEPTED 2026-08-22). |
| `RESEARCH.md` | Research R8.1-12 (ACCEPTED 2026-08-22). |
| `ARCHITECTURE.md` | Architecture Q8.1-8.12 + AD-8.1-8.7 (ACCEPTED 2026-08-22). |
| `DECISIONS.md` | Architecture decisions AD-8.1-8.7 (Draft). |
| `SPECIFICATION.md` | Normative contracts §3-§20 (ACCEPTED 2026-08-22). |
| `src/index.ts` | Public barrel (5 types + 5 funcs). |
| `src/internal/types.ts` | Provider types. |
| `src/internal/auth.ts` | Credential protection. |
| `src/internal/local.ts` | Local stub provider. |
| `src/internal/anthropic.ts` | Anthropic provider. |
| `src/internal/openai.ts` | OpenAI provider. |
| `src/internal/router.ts` | ModelRouter. |
| `src/internal/callModel.ts` | callModel seam. |
| `tests/` | 19 tests (public-api, provider, router, callModel, determinism). |

---

## 11. License

Licensed under the Apache License, Version 2.0. See `../LICENSE`.
