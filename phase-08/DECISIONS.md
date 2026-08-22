# ISSU — Phase 8: Model Provider Binding — Architecture Decisions

**Phase:** 8 — Model Provider Binding
**Stage:** ARCHITECTURE (owner-authorized 2026-08-22)
**Status:** Draft — records the architectural decisions made in `./ARCHITECTURE.md`; decisions become **Approved** at Architecture acceptance and **Frozen** at the Phase 8 phase freeze
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative specification:** `./ARCHITECTURE.md`
**License:** Apache License 2.0

This file records the **genuinely non-obvious architectural decisions** made by the Phase 8 ARCHITECTURE stage. Per BLUEPRINT §7.11 and §30, each decision includes Decision, Context, Evidence, Alternatives, Rationale, Consequences, and Status. Decision IDs are stable references used across the Phase 8 documents.

No decision here contradicts the frozen Phase 1,2,3,5,6,7 contracts, which remain authoritative. No decision resolves a deferred §22.5 without separate Owner authorization beyond DEFINE's §22.4.

---

## AD-8.1 — Phase 8 consumes frozen contracts barrel-only

- **Decision:** Phase 8 consumes Phase 1 (`@issue/foundation`), Phase 2 (`@issue/tool-runtime`), Phase 3 (`@issue/integration`), Phase 5 (`@issue/analytics`), Phase 6 (`@issue/config-cli`), and Phase 7 (`@issue/write-execution`) **only through their public package barrels**, with zero deep imports.
- **Context:** Phase 7 AD-7.1 established barrel-only consumption for six consumers (1/2/3/5/6) — Phase 8 now consumes seven.
- **Evidence:** FACT — Phase 7 `ARCHITECTURE.md:3.1-3.6`; PRECEDENT — Phase 7 AD-7.1 (`phase-07/DECISIONS.md:AD-7.1`); R8.1.
- **Alternatives:** (1) deep imports of internal modules; (2) reimplementing frozen behavior in Phase 8.
- **Rationale:** Preserves phase isolation, contract stability, and frozen-phase integrity.
- **Consequences:** Any behavior needed from frozen phase must be reachable via public exports.
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-8.2 — ModelProvider interface with generateText + countTokens

- **Decision:** `ModelProvider` interface `generateText(prompt, options?) → Promise<Result<string, AppError>>` + `countTokens` + `name: "anthropic"|"openai"|"local"` with `ProviderConfig` (`provider`, `model`, `apiKeyEnvVar`, `baseUrl`, `timeoutMs`) and `ProviderResult` via `Result`.
- **Context:** No `ModelProvider` exists in frozen phases; need abstraction that supports multiple backends without lock, per `BLUEPRINT.md:18`.
- **Evidence:** FACT — No provider interface in frozen phases; PRECEDENT — Phase 5 `AnalyticsDecisionProvider`; R8.2.
- **Alternatives:** (1) Single hard-coded provider (anthropic only) (rejected: violates model independence).
- **Rationale:** Multiple backends, no lock, testable with stub, `Result` + audit.
- **Consequences:** `AnthropicProvider`/`OpenAIProvider` via `httpFetch`, `LocalStubProvider` deterministic.
- **Status:** Draft.

---

## AD-8.3 — ModelRouter deterministic cost-aware

- **Decision:** `ModelRouter` `route(task, config: ResolvedConfig) → Result<ModelProvider, AppError>` selects from `config.providers` (from `ResolvedConfig` `providers` section), deterministic (sorted by cost, capability), fallback to `local` stub if not configured.
- **Context:** `BLUEPRINT.md:18` multiple backends + `Q4.22` deferred decision on which provider to bind.
- **Evidence:** FACT — `BLUEPRINT.md:18`, `phase-08/DEFINE.md:Q4.22`; PRECEDENT — Phase 6 `resolveConfig` deterministic.
- **Alternatives:** (1) Hard-coded `anthropic` (rejected).
- **Rationale:** No hard-coded provider, `ResolvedConfig` is source of truth, testable.
- **Consequences:** Routing is deterministic where `config.providers` is deterministic.
- **Status:** Draft.

---

## AD-8.4 — Credential via getSecret + redactionList, no persistence

- **Decision:** `getProviderAuth(config) → Result<string, AppError>` calls `getSecret(config.apiKeyEnvVar)` → if `undefined` → `issue.provider.auth`; `httpFetch` with `allowAuth: true` but `Authorization: Bearer <apiKey>` constructed at call time, not stored; `redactionList()` before any `logger.info`.
- **Context:** `BLUEPRINT.md:17` `Credential protection` + `Secret exposure`, `ISSU_PROJECT.md:23` `secret exposure`.
- **Evidence:** FACT — `phase-01-foundation/src/env/secrets.ts` `getSecret`, `phase-01-foundation/src/logging/redaction.ts`; R8.4.
- **Alternatives:** (1) Store `apiKey` in `ProviderConfig` plain (rejected: exposure).
- **Rationale:** Credential never logged, never persisted, `issue.provider.auth` on missing.
- **Consequences:** Safe failure mode.
- **Status:** Draft.

---

## AD-8.5 — httpFetch with allowAuth:true, allowPrivate:false

- **Decision:** `AnthropicProvider` and `OpenAIProvider` delegate to `httpFetch` with `allowAuth: true`, `allowPrivate: false`, `timeoutMs: config.timeoutMs ?? 30000`, `maxResponseBytes: 1024*1024`, `headers: {Authorization: `Bearer ${apiKey}`}`.
- **Context:** `phase-07/src/internal/fetch.ts` `httpFetch` with `allowlist`, `timeoutMs`, `maxResponseBytes`, `sanitizeHeaders`, R8.5.
- **Evidence:** FACT — `phase-07/src/internal/fetch.ts` `httpFetch`; R8.5.
- **Alternatives:** (1) Direct `fetch` (rejected: no allowlist).
- **Rationale:** Secure by default, `ADR-164 §5.1.8` compliant.
- **Consequences:** `httpFetch` is the only network seam.
- **Status:** Draft.

---

## AD-8.6 — callModel seam for Phase 7 tooling

- **Decision:** `callModel(prompt, provider, options?) → Promise<Result<string, AppError>>` seam that Phase 7 tooling can invoke, audit via `createToolLogger`.
- **Context:** `BLUEPRINT.md:8` `Agent Runtime → Tool System` → `Domain Capabilities`; Phase 7 tooling is the tool system.
- **Evidence:** FACT — `BLUEPRINT.md:8`; R8.6.
- **Alternatives:** (1) No integration (rejected: provider isolated).
- **Rationale:** Provider is usable from tooling, auditable.
- **Consequences:** `callModel` with `Result` + `model.audit` log.
- **Status:** Draft.

---

## AD-8.7 — §22.5 remains DEFERRED

- **Decision:** No decision here resolves §22.5 workspace/monorepo migration. It remains **DEFERRED** and appears as **UNRESOLVED** in Architecture Q8.7.
- **Context:** `phase-08/DEFINE.md:12` explicitly defers it.
- **Evidence:** FACT — `phase-08/DEFINE.md:12`; R8.10.
- **Alternatives:** (1) Resolve it now (rejected: requires separate Owner authorization).
- **Rationale:** Keeps Phase 8 scope disciplined.
- **Consequences:** Future phase can address workspace without Phase 8 being blocked.
- **Status:** Draft.

---

## Status Summary

All 7 decisions are **Draft** — awaiting Architecture acceptance. At Architecture acceptance they become **Approved**; at Phase 8 freeze they become **Frozen**.
