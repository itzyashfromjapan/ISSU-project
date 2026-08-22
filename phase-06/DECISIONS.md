# ISSU — Phase 6: Configuration & CLI — Architecture Decisions

**Phase:** 6 — Configuration & CLI
**Stage:** ARCHITECTURE (owner-authorized 2026-08-22)
**Status:** Draft — records the architectural decisions made in `./ARCHITECTURE.md`; decisions become **Approved** at Architecture acceptance and **Frozen** at the Phase 6 phase freeze
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative specification:** `./ARCHITECTURE.md`
**License:** Apache License 2.0

This file records the **genuinely non-obvious architectural decisions** made by the Phase 6 ARCHITECTURE stage. Per BLUEPRINT §7.11 and §30, each decision includes Decision, Context, Evidence, Alternatives, Rationale, Consequences, and Status. Decision IDs are stable references used across the Phase 6 documents.

No decision here contradicts the frozen Phase 1,2,3,5 contracts, which remain authoritative. No decision resolves a deferred §22.3/§22.4/§22.5 or Q4.22 without separate Owner authorization beyond DEFINE's 22.1/22.2.

---

## AD-6.1 — Phase 6 consumes frozen contracts barrel-only

- **Decision:** Phase 6 consumes Phase 1 (`@issue/foundation`), Phase 2 (`@issue/tool-runtime`), Phase 3 (`@issue/integration`), and Phase 5 (`@issue/analytics`) **only through their public package barrels**, with zero deep imports. `localFile` config reads delegate to `isContained` + `readFile` via Phase 3 seam; direct Phase 2 consumption is limited to types and `runTask` dispatch via public barrel.
- **Context:** Phase 3 established barrel-only consumption as integration rule (P4-1 assertions, `phase-03/ARCHITECTURE.md:27,31`); Phase 5 AD-5.1 affirmed it for four consumers. Phase 6 now consumes four frozen phases.
- **Evidence:** FACT — Phase 3 `ARCHITECTURE.md:3.1-3.4`; PRECEDENT — Phase 5 AD-5.1 (`phase-05/DECISIONS.md:AD-5.1`); R6.1.
- **Alternatives:** (1) deep imports of internal modules; (2) reimplementing frozen behavior in Phase 6.
- **Rationale:** Preserves phase isolation, contract stability, and frozen-phase integrity. Deep imports would expose private modules not part of public surface.
- **Consequences:** Any behavior needed from frozen phase must be reachable via public exports; internal modules inaccessible.
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-6.2 — Pure `resolveConfig(layers)` layered resolution

- **Decision:** Configuration resolution is a pure function `resolveConfig({defaults, file, env, cli}) → Result<ResolvedConfig, AppError>` with deterministic layered merging (defaults → file (JSONC) → env → CLI), using Phase 1 `jsonc.ts`, `readEnv`, `getSecret`, and `Result` validation. No I/O inside `resolveConfig` except the file read which is performed before the call and passed as `fileContent`.
- **Context:** Phase 1 `loadConfig` precedent provides layered resolution; Phase 5 determinism requires identical inputs → identical results.
- **Evidence:** FACT — `phase-01-foundation/src/config/load.ts`; R6.2; PRECEDENT — Phase 5 R6.2 deterministic precedent.
- **Alternatives:** (1) single-source (env only); (2) imperative config mutation with side effects.
- **Rationale:** Purity enables determinism, testability, and reproducibility 1; side-effectful resolution would couple to filesystem/time.
- **Consequences:** `ResolvedConfig` is readonly and versioned; provenance can be attached per field.
- **Status:** Draft.

---

## AD-6.3 — Minimal CLI: `--help`, `config --show`, `run` only

- **Decision:** CLI exposes exactly three invocable forms: `issue --help`, `issue config --show`, `issue run [--tool-runtime|--analytics]`. Unknown args → `issue.cli.unknown-argument`. No `exec`, `write`, `git`, `fetch`.
- **Context:** DEFINE §8 out-of-scope §22.3 write/exec/Git/network; Phase 1 `cli/args.ts` pattern is minimal, zero-dep.
- **Evidence:** FACT — `phase-01-foundation/src/cli/args.ts`; DEFINE §8; R6.4.
- **Alternatives:** (1) Rich CLI with `exec`/`write`/`git` subcommands; (2) No CLI (defer again).
- **Rationale:** Minimal surface is secure by default, preserves read-only guarantee, and respects `BLUEPRINT.md:178-183` reliability over complexity. Rich CLI would violate frozen boundaries and introduce command injection risk.
- **Consequences:** CLI is deterministic and easily tested; extensions require future phase and Owner authorization.
- **Status:** Draft.

---

## AD-6.4 — Reuse `Logger` + `redactionList()` for observability

- **Decision:** Observability reuses Phase 1 `Logger` contract (`createLogger({redact: redactionList()})`) and Phase 2 `observability.ts` pattern for structured logs (`cli.invoked`, `config.resolved`, `run.dispatched`, `run.completed`) with redaction.
- **Context:** BLUEPRINT §24 requires logs, activity, errors, progress; no new logging library should be introduced.
- **Evidence:** FACT — `phase-01-foundation/src/logging/pino-logger.ts`, `phase-02/src/internal/observability.ts:1,14`; R6.5.
- **Alternatives:** (1) New logger (e.g., winston); (2) Console.log directly.
- **Rationale:** No new dep, consistent with prior phases, security-preserving via redaction.
- **Consequences:** Logs are structured, redacted, and testable via `pino` test helper.
- **Status:** Draft.

---

## AD-6.5 — Provenance `ConfigProvenance` + `verifyConfig`

- **Decision:** Every resolved field carries `ConfigProvenance` (`readonly {source, key, value, redacted}[]`); `verifyConfig(provenance)` independently verifies that the last source for each key is allowed and that no unverified source contributed.
- **Context:** Phase 5 `ProvenanceChain` + `verify.ts` provides precedent for attaching provenance to findings.
- **Evidence:** FACT — `phase-05/src/internal/model.ts:ProvenanceChain`, `phase-05/src/internal/verify.ts`; R6.7.
- **Alternatives:** (1) No provenance; (2) Per-source provenance without verification.
- **Rationale:** Enables auditability and deterministic verification without model; mirrors Phase 5 without copying.
- **Consequences:** `ResolvedConfig` is always verifiable; `config --show` can display provenance with redaction.
- **Status:** Draft.

---

## AD-6.6 — Secrets via `getSecret` + redaction, no persistence

- **Decision:** Secrets are obtained via `getSecret`/`readEnv` and redacted via `redactionList()` before any log or `config --show` print; no credential persistence, no file write of secrets; `issue.config.secret-exposure` not reachable because `--allow-secrets` does not exist.
- **Context:** Phase 1 `env/secrets.ts` + `redaction.ts` provide the contract; security audit requires no secret exposure.
- **Evidence:** FACT — `phase-01-foundation/src/env/secrets.ts`, `phase-01-foundation/src/logging/redaction.ts`; R6.8.
- **Alternatives:** (1) Persist secrets to file; (2) Log raw secrets for debugging.
- **Rationale:** Security by default; aligns with `ISSU_PROJECT.md:817-819` secret exposure vector.
- **Consequences:** Secrets never appear in logs or `config --show` output; safe failure mode.
- **Status:** Draft.

---

## AD-6.7 — Frozen boundary enforcement via eslint + `isContained`

- **Decision:** Build-time enforcement: `eslint` `no-restricted-imports` bans `from "@issue/foundation/dist/*"` and `from "@issue/*/internal"`; runtime enforcement: `isContained`/`assertContained` for every config file read; `package.json` `file:` refs only.
- **Context:** Phase 2 P7-2 boundary audit and Phase 5 `package.json` precedent; `ISSU_PROJECT.md:799-847` path traversal vector.
- **Evidence:** FACT — `phase-02/TASKS.md: P7-2`, `phase-05/package.json: file:../phase-02`; R6.8.
- **Alternatives:** (1) No enforcement; (2) `tsconfig` paths workaround (rejected per `ISSU_PROJECT.md:17` No-Workaround Rule).
- **Rationale:** Preserves frozen-phase integrity and prevents TS2307 workaround via paths.
- **Consequences:** Any deep import or path escape fails lint or throws `issue.config.not-contained`.
- **Status:** Draft.

---

## AD-6.8 — §22.3/§22.4/§22.5/Q4.22 remain DEFERRED

- **Decision:** No decision here resolves §22.3 write/edit/delete/process/Git/network tooling, §22.4 model-provider binding, §22.5 workspace/monorepo migration, or Q4.22 provider binding beyond the seam. They remain **DEFERRED** and appear as **UNRESOLVED** in Architecture Q6.9.
- **Context:** DEFINE §12 explicitly defers them; prior phases' deferred lists preserved.
- **Evidence:** FACT — `phase-06/DEFINE.md:12`; R6.10.
- **Alternatives:** (1) Resolve them now (rejected: requires separate Owner authorization, would expand scope).
- **Rationale:** Keeps Phase 6 scope disciplined; avoids scope creep and aligns with `BLUEPRINT.md:616-628` non-goals.
- **Consequences:** Future phases can address them without Phase 6 being blocked.
- **Status:** Draft.

---

## Status Summary

All 8 decisions are **Draft** — awaiting Architecture acceptance. At Architecture acceptance they become **Approved**; at Phase 6 freeze they become **Frozen**.
