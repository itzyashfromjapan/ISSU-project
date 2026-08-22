# ISSU — Phase 6: Configuration & CLI

**Phase:** 6 — Configuration & CLI
**Status:** FROZEN — Phase 6 completed and accepted by the Owner (2026-08-22). DEFINE / RESEARCH / ARCHITECTURE / DECISIONS / SPECIFICATION / IMPLEMENTATION / TEST / BUILD / SECURITY AUDIT / GOVERNANCE AUDIT / INTEGRITY AUDIT / FREEZE-READINESS **COMPLETE**; all verification gates **PASS** (typecheck, lint, format:check, 66/66 tests, coverage 88.46%/82.94%/89.47%/90.26% ≥80%, build, `npm run check`); `dist/` built and validated; publishing explicitly excluded. **Phase 6 is FROZEN.**
**Frozen commit:** `b72a78b` → `HEAD` (this freeze)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**License:** Apache License 2.0

---

## 1. Purpose

Phase 6 implements the **Configuration & CLI** foundation (`@issue/config-cli`, `phase-06/`) that makes the frozen Phase 2/3/5 deterministic pipelines invocable and observable from the terminal, without modifying any frozen phase. It directly resolves **BLUEPRINT §22.1 (CLI) and §22.2 (configuration schema)** and operationalizes **§23 Configuration** and **§24 Observability** for the existing codebase.

Phase 6 consumes the frozen Phase 1, 2, 3, 5 public barrels only (barrel-only, `file:` refs), and deliberately does **not** consume Phase 4 (`@issue/research`, CLOSED/FROZEN) by default.

---

## 2. What Phase 6 Is and Is Not

**In scope (implemented, per SPECIFICATION §3):**

- Public surface: `resolveConfig`, `verifyConfig`, `getDefaultConfig`, `parseArgs`, `runCli`, `createCliLogger`, `logProgress`, `HELP_TEXT`, `VERSION` — 6 types (`ConfigSchema`, `ResolvedConfig`, `ConfigProvenance`, `ConfigProvenanceEntry`, `ConfigSource`, `LogLevel`, `CliArgs`, `CliResult`) + 3 core functions — barrel-enforced (`src/index.ts`).
- Deterministic layered resolution: `defaults → file (JSONC) → env → cli` (pure `resolveConfig`), with `isContained` guard and `Result<AppError>` validation.
- CLI: `issue --help`, `issue config --show [--config <path>] [--verbose]`, `issue run [--tool-runtime|--analytics] [--config <path>] [--verbose]` — read-only dispatch to frozen `runTask`/`runAnalyticsTask` only; no `child_process`, `fs.write`, `fetch`, Git.
- Observability: structured logs via `createLogger({redact: redactionList()})` (`cli.invoked`, `config.resolved`, `run.dispatched`, `run.completed`) with redaction.
- Provenance `ConfigProvenance` per-field + independent `verifyConfig`.

**Explicitly not in scope (prohibited / deferred, SPECIFICATION §5, DEFINE §8/12):**

- `§22.3` write/edit/delete, process execution, Git/network tooling
- `§22.4/Q4.22` provider/model binding (seam only, no binding)
- `§22.5` workspace/monorepo migration
- Persistence beyond config reads; Phase 4 default consumption
- Modifying any frozen phase, `BLUEPRINT.md`, `ISSU_PROJECT.md`

---

## 3. Behavior Summary (as verified by TEST)

- **Config resolution (§9):** `resolveConfig` is pure, deterministic, strips `//` and `/* */` JSONC comments and trailing commas, validates `version: "1.0.0"` and `logging.level`, merges shallow, tracks `provenance` sorted by key, redacts `models/providers/permissions`, freezes output — identical inputs → identical output (`reproducibility` 1).
- **CLI (§10/§11):** `parseArgs` is pure (`string[] → Result<CliArgs>`), recognizes `help`/`config:show`/`run` with `--config`, `--verbose`, `--tool-runtime`/`--analytics`, `--help`/`-h`; unknown → `issue.cli.unknown-argument`, missing `--config` value → `issue.cli.missing-required`. `runCli` validates `isContained`, reads `configPath` via `node:fs/promises` read-only, calls `resolveConfig` → `verifyConfig` → dispatches read-only to frozen barrels → exit `0` (COMPLETED), `1` (FAILED/ABSTAINED/validation), `2` (CANCELLED).
- **Provenance/Verification (§12):** `verifyConfig` checks `source ∈ {defaults,file,env,cli}` and `key ∈ ConfigSchema` and non-undefined value when not redacted.
- **Observability (§13):** `createCliLogger` wraps `createLogger({level, redact: redactionList()})`; `logProgress` logs `cli.invoked`, `config.resolved`, `run.dispatched`, `run.completed` with structured `ctx`.

---

## 4. Package Plan

`package.json` for Phase 6 (per SPECIFICATION §4):

```json
{
  "name": "@issue/config-cli",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": { "issue": "./dist/cli/main.js" },
  "dependencies": {
    "@issue/analytics": "file:../phase-05",
    "@issue/foundation": "file:../phase-01-foundation",
    "@issue/integration": "file:../phase-03",
    "@issue/tool-runtime": "file:../phase-02"
  }
}
```

No deep imports (`@issue/*/internal`), no `require`, no new runtime dep beyond frozen packages + `pino` via foundation + `node:fs` stdlib (read-only).

---

## 5. Dependency Boundaries

Phase 6 consumes exactly four frozen packages through public barrels only, via `file:` refs:

- `@issue/foundation` — `Result`/`AppError`, `isContained`/`assertContained`, `readEnv`/`getSecret`, `Logger`/`createLogger`/`redactionList`, `LogLevel`
- `@issue/tool-runtime` — `runTask` + `TaskOptions`/`ResourceBounds` (for `issue run --tool-runtime`)
- `@issue/integration` — not directly used in Phase 6 minimal (config file read via `node:fs` with `isContained`, but harness pattern preserved)
- `@issue/analytics` — `runAnalyticsTask` (for `issue run --analytics`)

Phase 4 (`@issue/research`) is **not** consumed by default and remains CLOSED/FROZEN, unmodified.

---

## 6. Verification Gates (as run this session)

- `npm run typecheck` — **PASS** (no `TS2307` workaround, `main/types/exports` correct)
- `npm run lint` — **PASS** (0 errors, `no-restricted-imports` would fail on deep imports)
- `npm run format:check` — **PASS**
- `npm test` — **PASS** `66/66` tests (5 files: public-api 3, config 14, cli 20, determinism 2, seam.integration 3, branch-coverage 24)
- `npm run test:coverage` — **PASS** `88.46% stmts / 82.94% branches / 89.47% funcs / 90.26% lines` (thresholds 80%; branches now 82.94% after branch-coverage tests)
- `npm run build` — **PASS** (`dist/` generated, `dist/index.d.ts` matches barrel)
- `npm audit --audit-level=high` — 0 vulnerabilities (via `npm install` audit)
- `grep -R "child_process|fs.*write|fetch|eval"` in `src/` — 0 hits (security audit PASS)

---

## 7. Non-Goals and Deferred Items

- **Resolved in this phase (now implemented):** `§22.1` CLI and `§22.2` configuration schema are no longer deferred.
- **Still deferred (not in Phase 6):** `§22.3` write/edit/delete, process execution, Git/network tooling; `§22.4/Q4.22` model-provider binding; `§22.5` workspace/monorepo; persistence beyond config reads; Phase 4 default consumption; confidence calibration, provenance granularity beyond per-field.
- **Carried as UNRESOLVED (§15):** exact help text wording, exit code mapping for `CANCELLED`, env ordering normalization, file path resolution (cwd vs project root), provenance granularity, log level per command.

---

## 8. Final Pre-Freeze State

- `DEFINE.md` **ACCEPTED 2026-08-22** (Phase 6 BLOCKED resolved via BLUEPRINT §23/§24)
- `RESEARCH.md` **ACCEPTED 2026-08-22** (R6.1-12, provenance/verification, security, trade-offs)
- `ARCHITECTURE.md` **ACCEPTED 2026-08-22** (Q6.1-6.12, AD-6.1-6.8)
- `SPECIFICATION.md` **ACCEPTED 2026-08-22** (6 types + 3 functions, behavioral contracts §9-§16)
- `DECISIONS.md` **Draft** (AD-6.1-6.8, awaiting freeze)
- `src/` **IMPLEMENTED** (pure `resolveConfig`/`parseArgs`/`runCli`, provenance/verification, observability)
- `tests/` **66/66 PASS**
- `dist/` **built** (`tsc -p tsconfig.build.json`)
- `package.json` **barrel-only** deps, `bin: issue` → `dist/cli/main.js`

Governance: `ISSU_PROJECT.md` §23 Security Audit PASS, §24 Governance Audit PASS (no frozen-phase modification, deferred preserved), §25 Integrity Audit PASS (git status clean except `phase-06/` untracked, correctly not yet staged), §27 Freeze-Readiness pending Owner Freeze acceptance.

---

## 9. Traceability

| Element | Source |
| --- | --- |
| Purpose (CLI + config) | `BLUEPRINT.md:559-575` (§23/§24); `phase-06/DEFINE.md:3` |
| Scope (read-only invocation) | `phase-06/SPECIFICATION.md:2`; `phase-02/SPECIFICATION.md` read-only FS |
| Public surface | `src/index.ts` (6 types + 3 funcs) |
| Dependencies / boundaries | `package.json:dependencies` (`file:` refs); `phase-06/DEFINE.md:11` |
| Non-goals / deferred | `BLUEPRINT.md:616-628`; `phase-06/DEFINE.md:12` |
| Lifecycle / governance | `BLUEPRINT.md:301-330` (§11); `ISSU_PROJECT.md:9,10` |
| Security vectors | `ISSU_PROJECT.md:799-847`; `BLUEPRINT.md:17` |
| Deferred §22.1/§22.2 resolved | `BLUEPRINT.md:23` + `phase-05/DEFINE.md:289` |

---

## 10. Documentation Index

| Document | Purpose |
| --- | --- |
| `README.md` | This file — phase overview and topic index. |
| `DEFINE.md` | Phase 6 governed DEFINE (ACCEPTED 2026-08-22). |
| `RESEARCH.md` | Research R6.1-12 (ACCEPTED 2026-08-22). |
| `ARCHITECTURE.md` | Architecture Q6.1-6.12 + AD-6.1-6.8 (ACCEPTED 2026-08-22). |
| `DECISIONS.md` | Architecture decisions AD-6.1-6.8 (Draft). |
| `SPECIFICATION.md` | Normative contracts §3-§21 (ACCEPTED 2026-08-22). |
| `src/index.ts` | Public barrel (6 types + 3 funcs). |
| `src/internal/config.ts` | Config schema + resolution + provenance/verification. |
| `src/internal/cli.ts` | CLI args + runCli + help. |
| `src/internal/observability.ts` | Logger + progress. |
| `src/cli/main.ts` | Bin entry `issue`. |
| `tests/` | 66 tests (public-api, config, cli, determinism, seam.integration, branch-coverage). |

---

## 11. License

Licensed under the Apache License, Version 2.0. See `../LICENSE`.
