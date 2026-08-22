# ISSU — Phase 8: Model Provider Binding — Specification

**Phase:** 8 — Model Provider Binding
**Stage:** SPECIFICATION (owner-authorized 2026-08-22)
**Status:** ACCEPTED — Owner accepted the Phase 8 Specification (owner, 2026-08-22)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative inputs:** Accepted Phase 8 DEFINE (`./DEFINE.md`, ACCEPTED 2026-08-22); accepted Phase 8 Research (`./RESEARCH.md`, R8.1-12, ACCEPTED 2026-08-22); accepted Phase 8 Architecture (`./ARCHITECTURE.md`, Q8.1-8.12, AD-8.1-8.7, ACCEPTED 2026-08-22); frozen Phase 1,2,3,5,6,7 public contracts; Phase 4 CLOSED/FROZEN
**License:** Apache License 2.0

This specification converts the accepted Phase 8 Architecture into **implementable contracts without implementing them**. It is authoritative for the Model Provider Binding module contract once accepted by the owner.

---

## 1. Purpose

**[DECISION]** This document is the authoritative specification of the Phase 8 Model Provider Binding Module. It defines the module's public contract, data model, behavioral contracts, quality/verification criteria, and Implementation handoff conditions, derived exclusively from the accepted Architecture (Q8.1-8.12, AD-8.1-8.7) and completed Research R8.1-12.

It SHALL NOT be read as authorizing implementation. Implementation is governed by the Implementation handoff conditions (§18) and a separate owner authorization.

---

## 2. Scope

**[DECISION]** The module covers the pipeline elements recorded in DEFINE §4 and Architecture Q8.1-8.5:

- Provider abstraction (`ModelProvider` interface + `ProviderConfig` + `ProviderResult` + `ProviderError`).
- Model routing (`ModelRouter` with `route(task, config) → Result<ModelProvider, AppError>`).
- Credential protection (`getSecret` + `redactionList` + `ProviderAuth`).
- Execution integration (`callModel` seam via `httpFetch` with allowlist, timeout, size cap).
- Audit logging via `Logger` + `redactionList`.

**[NORMATIVE]** Out of scope (carried from DEFINE §8, Architecture Q8.7): `§22.5` workspace/monorepo; persistence beyond provider config; Phase 4 default consumption.

---

## 3. Module Identity and Public Contract (Normative)

**[NORMATIVE]** The module is the `@issue/model-provider` package under `phase-08/`. Its public barrel `src/index.ts` SHALL export **exactly** the following surface — no other symbol is public:

**Types (5):**
- `ProviderConfig` — `{readonly provider: "anthropic"|"openai"|"local", readonly model: string, readonly apiKeyEnvVar: string, readonly baseUrl?: string, readonly timeoutMs?: number, readonly maxTokens?: number}`
- `ModelProvider` — `{readonly name: "anthropic"|"openai"|"local", generateText(prompt: string, options?: {maxTokens?: number, temperature?: number}) => Promise<Result<string, AppError>>, countTokens(text: string) => Promise<Result<number, AppError>>}`
- `ModelRouter` — `{route(task: {objective: string, requiredCapabilities?: readonly string[]}, config: ResolvedConfig) => Result<ModelProvider, AppError>}`
- `ProviderResult<T>` — `Result<T, AppError>` alias
- `CallModelOptions` — `{readonly maxTokens?: number, readonly temperature?: number, readonly logger?: Logger}`

**Functions (5):**
- `createAnthropicProvider(config: ProviderConfig) => ModelProvider`
- `createOpenAIProvider(config: ProviderConfig) => ModelProvider`
- `createLocalProvider() => ModelProvider` (deterministic stub: `generateText(prompt) → ok("stub response for: " + prompt)`)
- `createModelRouter(providers: readonly ModelProvider[]) => ModelRouter`
- `callModel(prompt: string, provider: ModelProvider, options?: CallModelOptions) => Promise<Result<string, AppError>>`

**[NORMATIVE]** Every other symbol is internal (`§17.3`) and SHALL NOT be imported by consumers. `src/index.ts` is the sole barrel; `src/internal/*` is private.

---

## 4. Frozen-Contract Consumption (Normative)

**[NORMATIVE]** Phase 8 consumes exactly six frozen packages **through public barrels only** via `file:` refs (to be recorded in `package.json`):

- `@issue/foundation: "file:../phase-01-foundation"` — `AppError`, `Result`, `Logger`, `createLogger`, `redactionList`, `readEnv`, `getSecret`, `assertContained`, `isContained`
- `@issue/tool-runtime: "file:../phase-02"` — `ResourceBounds` precedent
- `@issue/integration: "file:../phase-03"` — harness precedent
- `@issue/analytics: "file:../phase-05"` — no direct consumption in Phase 8 minimal
- `@issue/config-cli: "file:../phase-06"` — `ResolvedConfig` (for `ModelRouter` `config: ResolvedConfig`)
- `@issue/write-execution: "file:../phase-07"` — `httpFetch` (guarded fetch), `createToolLogger`

Phase 4 `@issue/research` is NOT consumed by default. No deep imports (`@issue/*/internal` or `src` paths), no `require`, no new runtime dep beyond frozen packages and `node:fetch` via `httpFetch` (bounded, audited) + `pino` via foundation.

---

## 5. Module Boundary and Non-Goals

**[NORMATIVE]** Boundary per Architecture §4: `provider/` (types, anthropic, openai, local), `router/` (router), `auth/` (auth), `call/` (callModel). No other top-level internal directory.

**[NORMATIVE]** Non-goals (prohibited): workspace/monorepo (§22.5), persistence beyond provider config, Phase 4 default consumption, `@issue/foundation` `main/types/exports` modification, `eval`/`Function`, `tsconfig` paths workaround.

---

## 6. Data Model — ProviderConfig

**[NORMATIVE]** `ProviderConfig` SHALL be:

```ts
type ProviderConfig = {
  readonly provider: "anthropic" | "openai" | "local";
  readonly model: string; // e.g., "claude-3-5-sonnet-20241022", "gpt-4o"
  readonly apiKeyEnvVar: string; // e.g., "ANTHROPIC_API_KEY", env var name, not the key itself
  readonly baseUrl?: string; // optional override, must be https:// if provided
  readonly timeoutMs?: number; // default 30000, max 60000
  readonly maxTokens?: number; // default 1024, max 4096
};
```

`apiKeyEnvVar` is the **env var name**, not the key value; `getSecret(apiKeyEnvVar)` is called at `generateText` time. `baseUrl` if provided must be `https://` (no `http://` private, no `file://`/`ftp://`).

---

## 7. Data Model — ModelProvider

**[NORMATIVE]** `ModelProvider` is the abstraction for model calls:

```ts
interface ModelProvider {
  readonly name: "anthropic" | "openai" | "local";
  generateText(prompt: string, options?: {maxTokens?: number, temperature?: number}) => Promise<Result<string, AppError>>;
  countTokens(text: string) => Promise<Result<number, AppError>>;
}
```

`generateText` with `local` provider SHALL be deterministic: `ok("stub response for: " + prompt)` (no network, no randomness). `anthropic`/`openai` providers SHALL delegate to `httpFetch` with `allowAuth: true`, `allowPrivate: false`, `timeoutMs` from `ProviderConfig`, `maxResponseBytes` 1MB max.

---

## 8. Behavioral Contract — createAnthropicProvider / createOpenAIProvider

**[NORMATIVE]** `createAnthropicProvider(config) → ModelProvider` and `createOpenAIProvider(config) → ModelProvider` SHALL:

1. Validate `config.provider` matches (`anthropic` or `openai`) → if not → `throw` (programming error, not `Result`, since this is construction-time, but tests will assert `config.provider` is correct; alternatively return `ModelProvider` that `generateText` will fail with `issue.provider.validation` if mismatched).
2. Validate `config.model` non-empty → if empty → `generateText` returns `err(AppError{issue.provider.validation})`.
3. `generateText(prompt, options?)` SHALL:
   - Validate `prompt` non-empty → if empty → `err(AppError{issue.provider.validation})`.
   - `apiKey = getSecret(config.apiKeyEnvVar)` → if `undefined` → `err(AppError{issue.provider.auth, message: "missing apiKey for ${config.apiKeyEnvVar}"})`.
   - `url = config.baseUrl ?? (config.provider === "anthropic" ? "https://api.anthropic.com/v1/messages" : "https://api.openai.com/v1/chat/completions")` → if `url` not `https://` → `err(AppError{issue.provider.validation})`.
   - `body = JSON.stringify({model: config.model, messages: [{role: "user", content: prompt}], max_tokens: options?.maxTokens ?? config.maxTokens ?? 1024})` (Anthropic) or `{model: config.model, messages: [{role: "user", content: prompt}], max_tokens: ...}` (OpenAI) — simplified.
   - `httpFetch(url, {headers: {Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json"}, allowAuth: true, allowPrivate: false, timeoutMs: config.timeoutMs ?? 30000, maxResponseBytes: 1024*1024, logger})` → if `!res.ok` → `err(AppError{issue.provider.not-allowed})` | `timeout` → `issue.provider.timeout` | `status 429` → `issue.provider.rate-limited`.
   - Parse `body` as JSON → if parse fails → `err(AppError{issue.provider.validation})` → extract `text` → `ok(text)` with `redactionList` before any log.

**[NORMATIVE]** No `apiKey` in logs, no persistence, `redactionList()` before `logger.info`.

---

## 9. Behavioral Contract — createLocalProvider

**[NORMATIVE]** `createLocalProvider() → ModelProvider` with `name: "local"` and `generateText(prompt) → Promise<Result<string, AppError>>` SHALL be deterministic: `ok("stub response for: " + prompt)` (no network, no `fetch`, no `getSecret`, no `httpFetch`, no timeout, no `allowAuth`). `countTokens(text) → ok(text.length)` (deterministic, `text.length` as token count stub).

---

## 10. Behavioral Contract — ModelRouter

**[NORMATIVE]** `createModelRouter(providers: readonly ModelProvider[]) → ModelRouter` where `ModelRouter.route(task, config: ResolvedConfig) → Result<ModelProvider, AppError>` SHALL:

1. `providers` must be non-empty → if empty → `err(AppError{issue.provider.not-configured})`.
2. If `config.providers` (from `ResolvedConfig` `providers` section) contains `preferredProvider: "anthropic"|"openai"|"local"` → return provider with `name === preferredProvider` → if not found → `err(AppError{issue.provider.not-configured})`.
3. Otherwise, return `providers[0]` (deterministic, cost-aware via order, first is cheapest) — deterministic where `providers` order is deterministic (from `resolveConfig` which is deterministic).
4. If `task.requiredCapabilities` provided, filter `providers` to those with `capabilities` matching (in Phase 8 minimal, all providers have same capabilities, so first).

**[NORMATIVE]** Routing is deterministic where `providers` and `config` are deterministic; fallback to `local` stub if not configured.

---

## 11. Behavioral Contract — callModel

**[NORMATIVE]** `callModel(prompt, provider, options?) → Promise<Result<string, AppError>>` SHALL:

1. Validate `prompt` non-empty → if empty → `err(AppError{issue.provider.validation})`.
2. `provider.generateText(prompt, options)` → if `!res.ok` → propagate `err`.
3. Audit `logger.info("model.audit", {tool: "callModel", provider: provider.name, prompt: prompt.slice(0, 100), result: res.ok ? "ok" : "err"})` with `redact: redactionList()` (prompt truncated, apiKey never logged).
4. Return `ok(text)` or `err`.

---

## 12. Observability and Audit

**[NORMATIVE]** `audit/logger.ts` SHALL export `createProviderLogger(level: LogLevel) => Logger` wrapping `createLogger({level, redact: redactionList()})`. Every `generateText`/`callModel`/`route` SHALL log `model.audit` with `ctx` (`provider`, `prompt`, `result`) and redacted via `redactionList()`.

---

## 13. Error Handling

**[NORMATIVE]** Every fallible public function returns `Result<T, AppError>` (except `create*Provider` construction which is sync and may throw on programming error, but `generateText` returns `Result`). Error codes:

- `issue.provider.not-configured` — no provider in `config` or `providers` empty
- `issue.provider.auth` — missing apiKey via `getSecret`
- `issue.provider.validation` — invalid `config`, `prompt`, `baseUrl`, `model`, `timeoutMs` >60000
- `issue.provider.timeout` — `httpFetch` timeout
- `issue.provider.rate-limited` — status 429
- `issue.provider.not-allowed` — `httpFetch` not-allowed (private host, header without allowAuth, etc.)

`AppError` fields: `code`, `message`, `details?`, `cause?`, `recoverable?`. No `throw` of raw `Error` beyond `AppError`.

---

## 14. Security Requirements

**[NORMATIVE]** Per `ISSU_PROJECT.md:799-847` and `BLUEPRINT.md:17`:

- Credential protection: `getSecret` + `redactionList()` before any log; `apiKey` never persisted, never in `ResolvedConfig` plain, only via env var at call time.
- Network: `httpFetch` allowlist (`https:` only, no private unless `allowPrivate`), header sanitization (block `Authorization`/`Cookie`/`X-Auth-*` unless `allowAuth: true` for provider calls, but here `allowAuth: true` is intentional for `Authorization: Bearer`), size cap, timeout.
- Provider/model boundaries: multiple backends, no single lock, no hard-coded provider.
- Permission boundaries: `ModelRouter` requires `config` from `ResolvedConfig` (via `resolveConfig`), no elevation.
- Deny-by-default: `ModelProvider` requires `apiKeyEnvVar` → `getSecret` → if missing → `issue.provider.auth`.

---

## 15. Determinism and Reproducibility

**[NORMATIVE]** `createLocalProvider().generateText` is deterministic (stub). `Anthropic`/`OpenAI` providers via `httpFetch` are **non-deterministic** (network, model temperature, external data) per `BLUEPRINT.md:41` non-goals, tests assert determinism for mocked `httpFetch` (stubbed `httpFetch` returns deterministic `ok({status: 200, body: '{"content":[{"text":"hi"}]}'})`) and explicitly mark non-determinism for real provider calls (time-dependent, environment-dependent, external-data dependence) per `ISSU_PROJECT.md:21`.

---

## 16. Public API and Contract Audit

Before Freeze, `src/index.ts` barrel + `dist/index.d.ts` + `package.json:exports` SHALL be verified to match this §3 surface exactly (5 types + 5 functions). No internal `src/internal/*` shall be exported.

---

## 17. Implementation Handoff Conditions

Implementation is **NOT authorized** until:

1. This Specification is **accepted** by Owner (Status → ACCEPTED + End-block).
2. `ISSU_PROJECT.md:574-611` Implementation Readiness Audit passes (Blueprint, accepted DEFINE, RESEARCH, ARCHITECTURE, DECISIONS, SPECIFICATION read; scope inventory with AUTHORIZED/UNAUTHORIZED classification; frozen dependencies, public contract, test obligations, config/dependency restrictions, generated artifacts, security boundaries verified).
3. Separate Owner **implementation authorization** is given (DEFINE covers DEFINE ONLY; RESEARCH covers RESEARCH ONLY; ARCHITECTURE covers ARCHITECTURE ONLY; SPECIFICATION covers SPECIFICATION ONLY).

---

## 18. Quality and Verification Gates

**[NORMATIVE]** Implementation SHALL pass:

- `npm run typecheck` (no `TS2307` workaround)
- `npm run lint` (0 errors, `no-restricted-imports` for deep imports)
- `npm run format:check` (Prettier)
- `npm test` (Vitest, all tests PASS)
- `npm run test:coverage` (provider v8, `include: ["src/**/*.ts"]`, thresholds **≥80%** on lines, statements, functions, branches)
- `npm run build` (`tsc -p tsconfig.build.json`, `dist/` generated, `dist/index.d.ts` matches barrel)
- `npm audit --audit-level=high` (0 vulnerabilities)
- Security Audit per §14 (grep 0 hits for `child_process.exec` with shell, `eval`, `Function`)
- Public API audit per §3

---

## 19. Unresolved Items Carried Forward

All UNRESOLVED from Architecture Q8.8 remain UNRESOLVED here until Specification acceptance: exact `maxTokens`/`temperature` validation, `local` provider details, `requiredCapabilities` schema, cost model, `apiKeyEnvVar` naming convention, `baseUrl` validation, `local` stub details.

No UNRESOLVED is silently resolved as a requirement; it remains UNRESOLVED until explicitly decided at Specification acceptance.

---

## 20. End-of-Document Block

```
PHASE 8 SPECIFICATION RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 8 SPECIFICATION STAGE: ACCEPTED — IMPLEMENTATION AUTHORIZED (owner, 2026-08-22)
IMPLEMENTATION AUTHORIZED: YES (owner, 2026-08-22)
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6/7 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 9 WORK STARTED: NO
COMMIT/PUSH: NO
```
