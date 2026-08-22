# ISSU — Phase 6: Configuration & CLI — Specification

**Phase:** 6 — Configuration & CLI
**Stage:** SPECIFICATION (owner-authorized 2026-08-22)
**Status:** ACCEPTED — Owner accepted the Phase 6 Specification (owner, 2026-08-22)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative inputs:** Accepted Phase 6 DEFINE (`./DEFINE.md`, ACCEPTED 2026-08-22); accepted Phase 6 Research (`./RESEARCH.md`, R6.1-12, ACCEPTED 2026-08-22); accepted Phase 6 Architecture (`./ARCHITECTURE.md`, Q6.1-6.12, AD-6.1-6.8, ACCEPTED 2026-08-22); frozen Phase 1,2,3,5 public contracts; Phase 4 CLOSED/FROZEN
**License:** Apache License 2.0

This specification converts the accepted Phase 6 Architecture into **implementable contracts without implementing them**. It is authoritative for the Configuration & CLI module contract once accepted by the owner.

---

## 1. Purpose

**[DECISION]** This document is the authoritative specification of the Phase 6 Configuration & CLI Module. It defines the module's public contract, data model, behavioral contracts, quality/verification criteria, and Implementation handoff conditions, derived exclusively from the accepted Architecture (Q6.1-6.12, AD-6.1-6.8) and completed Research R6.1-12.

It SHALL NOT be read as authorizing implementation. Implementation is governed by the Implementation handoff conditions (§18) and a separate owner authorization.

---

## 2. Scope

**[DECISION]** The module covers the pipeline elements recorded in DEFINE §4 and Architecture Q6.1-6.4:

- Configuration schema + layered resolution (defaults → file (JSONC) → env → CLI) with `Result<ResolvedConfig, AppError>` and `ConfigProvenance`.
- CLI: `issue --help`, `issue config --show`, `issue run [--tool-runtime|--analytics]` via typed `CliArgs` + `parseArgs`.
- Observability: structured logs via `Logger` + `redactionList()`.
- Provenance `ConfigProvenance` + independent `verifyConfig`.

**[NORMATIVE]** Out of scope (carried from DEFINE §8, Architecture Q6.9): `§22.3` write/edit/delete, process execution, Git/network tooling; `§22.4/Q4.22` provider/model binding; `§22.5` workspace/monorepo; persistence beyond config reads; Phase 4 default consumption.

---

## 3. Module Identity and Public Contract (Normative)

**[NORMATIVE]** The module is the `@issue/config-cli` package under `phase-06/`. Its public barrel `src/index.ts` SHALL export **exactly** the following surface — no other symbol is public:

**Types (6):**
- `ConfigSchema` — readonly, versioned (`version: "1.0.0"`), optional sections `models?`, `providers?`, `tools?`, `permissions?`, `memory?`, `agent?`, `project?`, `logging?`, `performance?` (each `readonly` record, extensible)
- `ResolvedConfig` — readonly, fully resolved, `readonly version`, `readonly logging: {level: LogLevel}`, `readonly provenance: ConfigProvenance` + all schema sections resolved with defaults
- `ConfigProvenance = readonly ConfigProvenanceEntry[]` where `ConfigProvenanceEntry = {readonly source: "defaults"|"file"|"env"|"cli", readonly key: string, readonly value: unknown, readonly redacted: boolean}`
- `ConfigSource = "defaults"|"file"|"env"|"cli"`
- `CliArgs = {readonly command: "help"|"config:show"|"run", readonly runTarget?: "tool-runtime"|"analytics", readonly configPath?: string, readonly verbose?: boolean}`
- `CliResult = {readonly exitCode: 0|1|2, readonly stdout: string, readonly stderr: string}`

**Functions (3):**
- `resolveConfig(layers: {defaults: ConfigSchema, fileContent?: string, env?: EnvSnapshot, cli?: Partial<ConfigSchema>}) => Result<ResolvedConfig, AppError>`
- `parseArgs(argv: readonly string[]) => Result<CliArgs, AppError>`
- `runCli(argv: readonly string[], options?: {env?: EnvSnapshot, logger?: Logger}) => Promise<CliResult>`

**[NORMATIVE]** Every other symbol is internal (`§17.3`) and SHALL NOT be imported by consumers. `src/index.ts` is the sole barrel; `src/internal/*` is private.

---

## 4. Frozen-Contract Consumption (Normative)

**[NORMATIVE]** Phase 6 consumes exactly four frozen packages **through public barrels only** via `file:` refs (to be recorded in `package.json`):

- `@issue/foundation: "file:../phase-01-foundation"` — `loadConfig` pattern, `readEnv`/`getSecret`, `Logger`/`createLogger`/`redactionList`, `Result`/`AppError`, `assertContained`/`isContained`, `runCli` pattern
- `@issue/tool-runtime: "file:../phase-02"` — `runTask` + types for `issue run --tool-runtime`
- `@issue/integration: "file:../phase-03"` — `runIntegrationTask` for config file `localFile` reads (via `assertContained`)
- `@issue/analytics: "file:../phase-05"` — `runAnalyticsTask` for `issue run --analytics`

Phase 4 `@issue/research` is NOT consumed by default. No deep imports (`@issue/*/internal` or `src` paths), no `require`, no new runtime dep beyond frozen packages + `pino` via foundation + Node.js stdlib.

---

## 5. Module Boundary and Non-Goals

**[NORMATIVE]** Boundary per Architecture §4: `config/` (schema, resolve, validate, provenance, verify), `cli/` (args, main, print, dispatch), `observability/` (logger, progress). No other top-level internal directory.

**[NORMATIVE]** Non-goals (prohibited): write/edit/delete, `child_process`, `fetch`, Git operations, provider binding, workspace migration, persistence beyond config reads, Phase 4 default consumption, `@issue/foundation` `main/types/exports` modification.

---

## 6. Data Model — ConfigSchema

**[NORMATIVE]** `ConfigSchema` SHALL be:

```ts
export type ConfigSchema = {
  readonly version: "1.0.0";
  readonly models?: Readonly<Record<string, unknown>>;
  readonly providers?: Readonly<Record<string, unknown>>;
  readonly tools?: Readonly<Record<string, unknown>>;
  readonly permissions?: Readonly<Record<string, unknown>>;
  readonly memory?: Readonly<Record<string, unknown>>;
  readonly agent?: Readonly<Record<string, unknown>>;
  readonly project?: Readonly<Record<string, unknown>>;
  readonly logging?: Readonly<{level?: LogLevel}>;
  readonly performance?: Readonly<Record<string, unknown>>;
};
```

`version` is fixed `"1.0.0"`; all sections are optional, `readonly`, and extensible via `Record<string, unknown>` (no `any`). `logging.level` is `LogLevel` from `@issue/foundation` (`"debug"|"info"|"warn"|"error"`).

---

## 7. Data Model — ResolvedConfig

**[NORMATIVE]** `ResolvedConfig` is the output of `resolveConfig`:

```ts
export type ResolvedConfig = {
  readonly version: "1.0.0";
  readonly models: Readonly<Record<string, unknown>>;
  readonly providers: Readonly<Record<string, unknown>>;
  readonly tools: Readonly<Record<string, unknown>>;
  readonly permissions: Readonly<Record<string, unknown>>;
  readonly memory: Readonly<Record<string, unknown>>;
  readonly agent: Readonly<Record<string, unknown>>;
  readonly project: Readonly<Record<string, unknown>>;
  readonly logging: {readonly level: LogLevel};
  readonly performance: Readonly<Record<string, unknown>>;
  readonly provenance: ConfigProvenance;
};
```

Every section is fully resolved with defaults (empty `readonly {}` if not provided, `logging.level` defaults to `"info"`).

---

## 8. Data Model — CliArgs

**[NORMATIVE]** `CliArgs` discriminated by `command`:

- `command: "help"` — `issue --help` or `issue -h` or unknown command with help fallback; no other fields
- `command: "config:show"` — `issue config --show [--config <path>] [--verbose]`
- `command: "run"` — `issue run [--tool-runtime|--analytics] [--config <path>] [--verbose]`; `runTarget` defaults to `"analytics"` if not specified; `configPath` is optional, validated via `isContained(cwd, configPath)` if provided

`parseArgs` SHALL be pure (`string[] → Result`) and SHALL return `issue.cli.unknown-argument` for unknown flags/commands, `issue.cli.missing-required` for missing required `run` args.

---

## 9. Behavioral Contract — resolveConfig

**[NORMATIVE]** `resolveConfig(layers)` SHALL:

1. Parse `fileContent` (if provided) as JSONC via `phase-01-foundation/src/config/jsonc.ts` (strip comments, trailing commas); if parse fails → `err(AppError{issue.config.validation, message})`.
2. Merge layers in order `defaults → file → env → cli` via `mergeConfigLayers` semantics (later overrides earlier, shallow per section, no array merge).
3. Validate: `version` must be `"1.0.0"`; `logging.level` must be `LogLevel`; no unknown top-level keys beyond `ConfigSchema`; if validation fails → `err(AppError{issue.config.validation})`.
4. Construct `provenance` as `readonly` array tracking the last source per key (`redacted: true` if key is `models`/`providers`/`permissions` secret-like).
5. Return `ok(frozen ResolvedConfig)` with `Object.freeze` on top-level and each section (determinism).

**[NORMATIVE]** Determinism: identical `layers` → identical `ResolvedConfig` (including `provenance` order). `reproducibility` 1 on deterministic path (no `Date.now`, no `random`).

**[NORMATIVE]** No I/O inside `resolveConfig`; `fileContent` is passed in, not read. File reads are performed by `runCli` before calling `resolveConfig` and are guarded by `assertContained(cwd, configPath)`.

---

## 10. Behavioral Contract — parseArgs

**[NORMATIVE]** `parseArgs(argv)` SHALL:

- Be pure, no I/O, no `process.env`, no `process.argv` mutation.
- Recognize: `--help`/`-h` → `help`; `config --show` → `config:show`; `run` → `run` (with `--tool-runtime`/`--analytics`, `--config <path>`, `--verbose`).
- Return `issue.cli.unknown-argument` for any unknown token not in the grammar.
- Return `issue.cli.missing-required` if `run` is given without a valid target (but default is `analytics`, so not missing).

---

## 11. Behavioral Contract — runCli

**[NORMATIVE]** `runCli(argv, options?) → Promise<CliResult>` SHALL:

1. `parseArgs(argv)` → if `err` → return `{exitCode: 1, stdout: "", stderr: error.message}` (no throw).
2. If `command: "help"` → return `{exitCode: 0, stdout: helpText, stderr: ""}` where `helpText` lists `issue --help`, `issue config --show`, `issue run` with descriptions.
3. Otherwise, determine `configPath` (from `cli` or default `./issu.config.jsonc` if exists), check `isContained(process.cwd(), configPath)` if `configPath` provided → if not contained → `err(AppError{issue.config.not-contained})` → exit 1.
4. Read `configPath` (if exists) via `readFile` through Phase 3 seam (no direct `fs`); if not found → treat as `fileContent: undefined` (not an error); if read fails with `notFound`/`tooLarge` → exit 1 with `issue.config.not-found`/`tooLarge`.
5. `resolveConfig({defaults, fileContent, env: options.env ?? readEnv(), cli: cliConfig})` → if `err` → exit 1.
6. If `command: "config:show"` → `verifyConfig(provenance)` → if fails → exit 1; otherwise print `JSON.stringify(resolvedConfig, null, 2)` with secrets redacted via `redactionList()` → exit 0.
7. If `command: "run"` → `verifyConfig` then dispatch: if `runTarget: "tool-runtime"` → `runTask` with minimal `TaskRefs`; if `"analytics"` → `runAnalyticsTask` with inline empty sources (no network) → print `Result` via `print.ts` → exit 0 on `COMPLETED`, 1 on `FAILED`/`ABSTAINED`, 2 on `CANCELLED`.

**[NORMATIVE]** All fallible steps use `Result`; no `throw` beyond `AppError` creation. `Logger` is used with `redact: redactionList()` for `cli.invoked`, `config.resolved`, `run.dispatched`.

---

## 12. Provenance and Verification

**[NORMATIVE]** `ConfigProvenance` tracks per-key last source. `verifyConfig(provenance: ConfigProvenance) → Result<true, AppError>` SHALL verify: every entry's `source` is in `{"defaults","file","env","cli"}`; every `key` is in `ConfigSchema`; no entry has `value: undefined` when `redacted: false` (except defaults). If verification fails → `err(AppError{issue.config.validation})`. `runCli` SHALL call `verifyConfig` before any `config:show` or `run` dispatch; `COMPLETED` SHALL never be returned with unverified provenance.

---

## 13. Observability

**[NORMATIVE]** `observability/logger.ts` SHALL export `createCliLogger(level: LogLevel) => Logger` wrapping `createLogger({level, redact: redactionList()})`. `progress.ts` SHALL export `logProgress(logger, event: "cli.invoked"|"config.resolved"|"run.dispatched"|"run.completed", ctx: Record<string, unknown>)` with `ctx` containing `runId` (nanoid via `phase-01-foundation` precedent? No — use `Math.random`? Actually use deterministic `runId: "cli-"+Date.now()` but `Date.now` is not deterministic — so use `process.hrtime`? Instead use `ctx: {argv, configSource}` without time). No new dep.

---

## 14. Error Handling

**[NORMATIVE]** Every fallible public function returns `Result`. Error codes:

- `issue.config.validation` — schema/validation failure
- `issue.config.not-found` — config file not found when explicitly required (but default missing is not error)
- `issue.config.not-contained` — path traversal (`!isContained`)
- `issue.config.too-large` — file tooLarge via tool seam
- `issue.cli.unknown-argument` — unknown flag/command
- `issue.cli.missing-required` — missing required arg

`AppError` fields: `code`, `message`, `details?: unknown`, `cause?: unknown`. No `throw` of raw `Error`.

---

## 15. Security Requirements

**[NORMATIVE]** Per `ISSU_PROJECT.md:799-847` and `BLUEPRINT.md:17`:

- Path traversal: every `configPath` validated via `isContained`/`assertContained` before `readFile`; `listDirectory` not used.
- No `fs.write`, `child_process`, `fetch`, `Git` in `src/` (grep must be 0 hits).
- No `eval`, `Function`, dynamic `import`.
- Secrets: `getSecret` + `redactionList()` before any log/print; `config --show` redacts secrets; no persistence.
- Provider/model: seam only, no binding, no API key handling.
- Permission boundaries: CLI runs with caller's permissions, no elevation, deny-by-default on `not-contained`.
- Failure behavior: `Result` with explicit `issue.*` codes, no error leakage of secrets/content.

---

## 16. Determinism and Reproducibility

**[NORMATIVE]** `resolveConfig` and `parseArgs` are pure and deterministic. Tests SHALL assert: `resolveConfig` called twice with identical `layers` → `deepEqual` `ok` values (including `provenance` order). `reproducibility` level is 1 on deterministic path (no `Date.now`, `random`, filesystem ordering). `runCli` dispatch to `runTask`/`runAnalyticsTask` inherits their determinism (Phase 5 determinism).

---

## 17. Public API and Contract Audit

Before Freeze, `src/index.ts` barrel + `dist/index.d.ts` + `package.json:exports` SHALL be verified to match this §3 surface exactly (6 types + 3 functions). No internal `src/internal/*` shall be exported.

---

## 18. Implementation Handoff Conditions

Implementation is **NOT authorized** until:

1. This Specification is **accepted** by Owner (Status → ACCEPTED + End-block).
2. `ISSU_PROJECT.md:574-611` Implementation Readiness Audit passes (Blueprint, accepted DEFINE, RESEARCH, ARCHITECTURE, DECISIONS, SPECIFICATION read; scope inventory with AUTHORIZED/UNAUTHORIZED classification; frozen dependencies, public contract, test obligations, config/dependency restrictions, generated artifacts, security boundaries verified).
3. Separate Owner **implementation authorization** is given (DEFINE covers DEFINE ONLY; RESEARCH covers RESEARCH ONLY; ARCHITECTURE covers ARCHITECTURE ONLY; SPECIFICATION covers SPECIFICATION ONLY).

---

## 19. Quality and Verification Gates

**[NORMATIVE]** Implementation SHALL pass:

- `npm run typecheck` (no `TS2307` workaround via `tsconfig` paths; `main/types/exports` must be correct)
- `npm run lint` (0 errors, `no-restricted-imports` for deep imports)
- `npm run format:check` (Prettier)
- `npm test` (Vitest, all tests PASS)
- `npm run test:coverage` (provider v8, `include: ["src/**/*.ts"]`, thresholds **≥80%** on lines, statements, functions, branches — same as Phase 5 `vitest.config.ts` precedent)
- `npm run build` (`tsc -p tsconfig.build.json`, `dist/` generated, `dist/index.d.ts` matches barrel)
- `npm audit --audit-level=high` (0 vulnerabilities)
- Security Audit per §15 (grep 0 hits for `child_process|fs.write|fetch|eval`)
- Public API audit per §17

---

## 20. Unresolved Items Carried Forward

All UNRESOLVED from Architecture Q6.10 remain UNRESOLVED here until Specification acceptance: exact help text wording, exit code mapping for `CANCELLED` vs `FAILED`, env ordering normalization, file path resolution (cwd vs project root), provenance granularity, log level per command, progress event schema.

No UNRESOLVED is silently resolved as a requirement; it remains UNRESOLVED until explicitly decided at Specification acceptance.

---

## 21. End-of-Document Block

```
PHASE 6 SPECIFICATION RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 6 SPECIFICATION STAGE: ACCEPTED — IMPLEMENTATION AUTHORIZED (owner, 2026-08-22)
IMPLEMENTATION AUTHORIZED: YES (owner, 2026-08-22)
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 7 WORK STARTED: NO
COMMIT/PUSH: NO
```
