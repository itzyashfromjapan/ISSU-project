# ISSU — Phase 1: Implementation Tasks

**Phase:** 1 — Foundation
**Status:** APPROVED (plan approved 2026-08-08)

This file breaks Phase 1 into milestones and tasks. Tasks are ordered; each has
concrete acceptance criteria. This file will be updated as work progresses
(checking off milestones), but the milestone *intent* is frozen for the phase.

Legend: `[ ]` pending · `[x]` done (at implementation time).

---

## Milestone M0 — Plan Review and Freeze

| # | Task | Acceptance criteria |
| --- | --- | --- |
| M0-1 | [x] Review README / ARCHITECTURE / SPECIFICATION / TASKS / DECISIONS against `../BLUEPRINT.md`. | No contradictions; §9 non-goals respected; all 21 topics covered (index in README §5). |
| M0-2 | [x] Approve the plan. | Plan marked APPROVED in this file; implementation may begin. |

### M0 Approval Record

- **M0-1 — PASSED (2026-08-08):** Final audit verified all five Phase 1
  documents are internally consistent and consistent with `../BLUEPRINT.md`;
  no contradictions; §9 non-goals respected; all 21 topics covered.
- **M0-2 — APPROVED (2026-08-08):** Phase 1 plan formally approved. The plan
  is now marked APPROVED in this file, in README/ARCHITECTURE/SPECIFICATION
  (status headers), and in the DECISIONS decision log (D1–D14 → Approved).
  Implementation (M1+) may begin only upon instruction.

## Milestone M1 — Package Scaffold

| # | Task | Acceptance criteria |
| --- | --- | --- |
| M1-1 | [x] Create `package.json` (`@issue/foundation`, `private: true`, engines `>=22.9.0`, `bin: issue → dist/cli/main.js`, scripts per ARCHITECTURE §7, exact-pinned deps). | `npm install` succeeds; `npm pkg get` reflects the spec. |
| M1-2 | [x] Create `tsconfig.json` + `tsconfig.build.json` per SPECIFICATION §7. | `npm run typecheck` passes on empty skeleton. |
| M1-3 | [x] Create `.gitignore` (node_modules, dist, coverage, `.env*` except `.env.example`, logs) and `.editorconfig`, `.node-version`. | Files present and consistent with policy. |
| M1-4 | [x] Create `src/index.ts` and `src/version.ts` with the §2 contract signatures (initially typed stubs). | Contract compiles; barrel exports only public API. |
| M1-5 | [x] Create `.github/workflows/ci.yml` at repository root. | CI runs install → check → build → audit; green on main. |

### M1 Implementation Record (2026-08-08)

- **M1-1 — PASS:** `package.json` created; `npm install` exit 0 (20 packages, 0
  vulnerabilities, lockfile generated). `npm pkg get` confirms name
  `@issue/foundation`, `private: true`, engines `>=22.9.0`,
  `bin.issue → ./dist/cli/main.js`, `type: module`, all scripts per
  ARCHITECTURE §7, exact-pinned deps (runtime: pino `10.3.1`; dev:
  `@types/node` `24.13.3`, `tsx` `4.23.11`, `typescript` `5.9.3`).
  Supporting: `.npmrc` (`save-exact=true`) added to enforce DECISIONS §D2.
- **M1-2 — PASS:** `tsconfig.json` + `tsconfig.build.json` per SPECIFICATION
  §7 (strict set, NodeNext, ES2022, rootDir/outDir/excludes on build config).
  `npm run typecheck` exit 0.
- **M1-3 — PASS:** `.gitignore` (node_modules, dist, coverage, `.env`/`.env.*`
  except `.env.example`, `*.log`/`logs/`), `.editorconfig`, `.node-version`
  (`24`, per DECISIONS §D14) created.
- **M1-4 — PASS:** `src/index.ts` (full §2 contract as typed stubs) +
  `src/version.ts` (`0.1.0`). `npm run build` exit 0; `dist/index.d.ts`
  matches SPECIFICATION §2; runtime export surface verified (no internal
  modules exported). Stubs throw explicit "not implemented until milestone
  Mx" errors.
- **M1-5 — PASS (not yet executed):** `.github/workflows/ci.yml` at repo root
  created. Runs the pipeline available at M1: install → typecheck → build →
  audit. `check` (lint/format/test) is added at M2 when those tools exist; per
  the M1-5 mandate, later-milestone checks are not claimed or run before they
  are implemented. The workflow executes once the phase is committed/pushed.

## Milestone M2 — Quality Toolchain

| # | Task | Acceptance criteria |
| --- | --- | --- |
| M2-1 | [x] Configure ESLint 9 flat config (`eslint.config.js`) with `typescript-eslint` recommended; strict rules; no unused vars. | `npm run lint` passes; a deliberately bad file fails. |
| M2-2 | [x] Configure Prettier (`prettier.config.mjs`); consistent style. | `npm run format` is idempotent; `format:check` passes. |
| M2-3 | [x] Configure Vitest (`vitest.config.ts`) with coverage provider and gate ≥ 80%. | `npm test` and `npm run test:coverage` work; gate enforces threshold. |
| M2-4 | [x] Wire `npm run check` to run typecheck + lint + format:check + test. | `check` fails on any single failure; passes when all pass. |

### M2 Implementation Record (2026-08-08)

- **M2-1 — PASS:** `eslint.config.js` (flat config) added. ESLint `9.39.5` +
  `typescript-eslint` `8.66.0` (per DECISIONS §D9); preset
  `tseslint.configs.recommended` plus an explicit `no-unused-vars` rule
  (`args: 'all'`, `_`-prefixed args/vars ignored, `caughtErrors: 'all'`).
  Ignores: `dist/**`, `coverage/**`, `node_modules/**`, `package-lock.json`.
  Verified: `npm run lint` exit 0; a deliberately bad file (`lint-bad.tmp.ts`)
  fails with `@typescript-eslint/no-unused-vars` (exit 1). Both `lint` and
  `lint:fix` wired in `package.json` (scripts pre-existed from M1, now active).
- **M2-2 — PASS:** `prettier.config.mjs` (printWidth 80, tabWidth 2, semi,
  double quotes, trailingComma 'all', LF) + `.prettierignore` (node_modules,
  dist, coverage, package-lock.json, `*.md` — docs excluded from formatting
  churn, so the README/ARCHITECTURE/SPECIFICATION/TASKS/DECISIONS stay stable).
  Prettier `3.9.6` added. Verified: `npm run format` applied canonical
  formatting to `src/*` (long signatures wrapped) and the new config/test
  files; a second `format` produced no changes (idempotent); a deliberately
  bad file (`format-bad.tmp.ts`) fails `format:check` (exit 1), then
  `prettier --write` fixes it and `format:check` passes.
- **M2-3 — PASS:** `vitest.config.ts` + Vitest `4.1.10` /
  `@vitest/coverage-v8` `4.1.10`. Coverage: provider v8, `include:
  ['src/**/*.ts']`, threshold gate ≥ 80% on lines, statements, functions, and
  branches. Tests added under `tests/`: `version.test.ts` (VERSION = `0.1.0`)
  and `contract.test.ts` (public export surface — exactly the 18 §2 runtime
  symbols — and the documented M1 stub behavior: each stub throws a
  "not implemented until Phase 1 milestone Mx" error). Result: 19/19 tests
  pass; coverage 95.23% statements, 100% branches, 94.44% functions, 95.23%
  lines (all ≥ 80%). The single uncovered line is `AppError.toJSON`, which is
  unreachable at M2 because its constructor deliberately throws until M5.
- **M2-4 — PASS:** `check` runs `typecheck && lint && format:check && test`.
  Verified `npm run check` exit 0 on a clean tree and exit 1 (at the lint
  stage) with a deliberately bad file present. CI
  (`.github/workflows/ci.yml`) now runs the full M2 gate: install → typecheck →
  lint → format:check → test:coverage (gate) → build → audit.
- **Toolchain summary:** devDependencies pinned exactly (per DECISIONS §D2):
  `eslint` `9.39.5`, `typescript-eslint` `8.66.0`, `prettier` `3.9.6`, `vitest`
  `4.1.10`, `@vitest/coverage-v8` `4.1.10`. `npm install` exit 0; `npm audit
  --audit-level=high` → 0 vulnerabilities; `npm run build` exit 0.

### M2 Final Audit Record (2026-08-08)

**Verdict: M2 ACCEPTED.** Final read-only audit re-verified the actual
repository state (not the implementation report alone):

- **M2-1 — PASS (re-verified):** `eslint .` exit 0 on the clean tree; a
  deliberately invalid file (`lint-bad.audit.tmp.ts`, unused var) produced
  `@typescript-eslint/no-unused-vars` and exit 1; file removed; lint green
  again. ESLint 9 flat config + `typescript-eslint` recommended + strict
  `no-unused-vars`; correct ignores; no rule disabling, no escape hatches.
- **M2-2 — PASS (re-verified):** `npm run format` ran twice — every file
  `(unchanged)` (idempotent); `format:check` exit 0. A reversible formatting
  violation in `tests/version.test.ts` made `format:check` exit 1; restoring
  the file made it exit 0 again. `.prettierignore` excludes `*.md`
  (intentional: hand-curated docs stay stable; no doc formatting mandate
  exists — accepted at audit).
- **M2-3 — PASS (re-verified):** `npm test` 2 files / 19 tests passed, exit 0.
  `npm run test:coverage` (v8 provider, `include: ['src/**/*.ts']`,
  thresholds ≥ 80 on lines/statements/functions/branches) reported statements
  95.23% (20/21), branches 100% (0/0), functions 94.44% (17/18), lines 95.23%
  (20/21), exit 0 — machine output from Vitest v8.
- **M2-4 — PASS (re-verified):** `check` = `typecheck && lint && format:check
  && test` (order matches ARCHITECTURE §7). Clean tree exit 0; a deliberate
  type error in a temporary test file stopped the gate at typecheck (exit 2);
  file removed; `check` green again.
- **Coverage gate reality test — PASS:** adding a temporary un-executed
  `src/__audit_gate_probe__.ts` dropped coverage to lines 66.66% / statements
  64.51% / branches 0% and `test:coverage` **failed** (exit 1, explicit
  "does not meet global threshold" errors); probe removed; coverage back to
  95%+, exit 0.
- **M1 regression — PASS:** typecheck/build exit 0; `dist/index.d.ts` matches
  SPECIFICATION §2; VERSION `0.1.0`; no new public exports (surface test locks
  exactly 18 runtime symbols).
- **Phase boundary — PASS:** `src/` contains only `index.ts` and
  `version.ts`; grep for forbidden capabilities (agent/LLM/model/memory/tool/
  git/browser/network/process/...) → zero hits.
- **Dependencies — PASS:** all M2 deps exact-pinned dev deps, permitted by
  DECISIONS (D8/D9); `.npmrc` `save-exact=true`; TypeScript still `5.9.3`
  (D10); `npm audit --audit-level=high` → 0 vulnerabilities.
- **CI — PASS (local) / NOT VERIFIED (remote):** YAML parses (GitHub YAML 1.2
  `on:` key valid; PyYAML 1.1 boolean quirk is a parser artifact, not a
  workflow defect); workflow runs install → typecheck → lint → format:check →
  test:coverage (gate) → build → audit. Remote execution has **not** run:
  `.github/` and `phase-01-foundation/` are still untracked/uncommitted and
  `origin/main` contains only `BLUEPRINT.md` + `LICENSE` (same documented
  exception carried from M1).
- **No blocking findings.** INFO only: `version.ts` (single covered `const`)
  is not listed in the v8 per-file table — the machine totals are unaffected.

## Milestone M3 — Configuration

| # | Task | Acceptance criteria |
| --- | --- | --- |
| M3-1 | [x] Implement `src/config/jsonc.ts` (comments + trailing commas; zero deps). | Tests: parses comments/commas; rejects malformed input with `issue.config.parse`. |
| M3-2 | [x] Implement `src/config/defaults.ts`, `load.ts`, `resolve.ts`. | Tests: precedence (defaults < file < env < flags), discovery order (§3.3), invalid values → `issue.config.invalid` with actionable message. |
| M3-3 | [x] Implement `readEnv` / `getSecret` / `redactionList` in `src/env/`. | Tests: `ISSU_` snapshot typing; secret detection convention; no secret leaks into any return that is logged. |
| M3-4 | [x] Enforce "no secrets in config file". | Config containing a secret-like key fails validation with `issue.config.invalid`. |

### M3 Implementation Record (2026-08-08)

- **M3-1 — PASS:** `src/config/jsonc.ts` — zero-dependency JSONC parser (line +
  block comments, trailing commas, string/escape-safe; strict rejection of
  malformed input including `[,]`), malformed input → `issue.config.parse`
  with line/column + excerpt. 18 tests.
- **M3-2 — PASS:** `src/config/defaults.ts` (`DEFAULT_CONFIG`,
  `LOG_LEVELS`), `src/config/load.ts` (`loadConfig`: §3.3 discovery — explicit
  path/`ISSU_CONFIG`/`issue.config.json` in cwd/no file; precedence defaults <
  file < env < flags; typed `issue.config.notfound`/`parse`/`invalid`),
  `src/config/resolve.ts` (`mergeConfigLayers`, file/env coercion,
  validation, secret scan). Precedence verified for all layer combinations;
  discovery order verified.
- **M3-3 — PASS:** `src/env/env.ts` (`readEnv` — ISSU_ snapshot),
  `src/env/secrets.ts` (`getSecret`, `redactionList`, §4.2 token-based secret
  detection). No secret values leak into errors or returned structures.
- **M3-4 — PASS:** `assertNoSecretsInConfig` rejects secret-like keys anywhere
  in the config file with `issue.config.invalid`, actionable key-path message,
  never the secret value.
- **Public contract — PASS:** the five M3 symbols (`loadConfig`,
  `mergeConfigLayers`, `readEnv`, `getSecret`, `redactionList`) are wired into
  the §2 barrel (`src/index.ts`) as re-exports of the implementations; the
  obsolete M3 stub-throw expectations were removed from `tests/contract.test.ts`
  and replaced with real contract assertions; the runtime export surface is
  still exactly the 18 approved §2 symbols; `dist/index.d.ts` matches §2.
- **Gate — PASS:** typecheck, lint, format:check, 118 tests, coverage
  (94.61% statements / 90.04% branches / 95.34% functions / 94.67% lines) all
  ≥ 80%, `npm run check` exit 0, `npm run build` exit 0, `npm audit` 0
  vulnerabilities.
- **Note:** final M3 acceptance is pending the separate read-only M3 re-audit;
  M4 has not started.

## Milestone M4 — Logging

| # | Task | Acceptance criteria |
| --- | --- | --- |
| M4-1 | [x] Define `Logger` interface and `LogLevel` in `src/logging/logger.ts`. | Interface matches SPECIFICATION §2; exported. |
| M4-2 | [x] Implement pino-backed `createLogger` + `redaction.ts`. | Tests: level thresholds; JSON-lines shape; TTY pretty; `child()`; redaction applied in **all** modes (no secret substring anywhere in output). |
| M4-3 | [x] Wire config/env → logger creation in one factory used by CLI. | `ISSU_LOG_LEVEL` and config `logLevel`/`redact` take effect. |

### M4 Implementation Record (2026-08-09)

- **M4-1 — PASS:** `src/logging/logger.ts` — `Logger` interface
  (trace/debug/info/warn/error/fatal with `(msg: string, ctx?: object)` +
  `child(bindings)`), `LogLevel`, `LoggerOptions`; matches SPEC §2; exported.
- **M4-2 — PASS:** `src/logging/redaction.ts` — added `redactRecord`
  (recursive: key matching the list → its value replaced with `[REDACTED]`;
  every string value run through substring `redactValues`). New
  `src/logging/pino-logger.ts` — public `createLogger` (§2 contract),
  `createPinoLogger` (injectable stream + `logPretty`), buffering destination
  sink that applies redaction in **every** mode. pino options: `level`
  threshold, `base: {}` (drops pid/hostname), `formatters.level` → string level
  label, giving the §5.2 JSON-lines shape `{ level, time, msg, ctx }`. Pretty
  output is a zero-dependency human-readable line (no `pino-pretty`, per D12).
  Redaction is applied at the sink so no secret substring can appear in any
  mode; `child()` inherits the threshold and emits bindings top-level.
  21 tests in `tests/logging/` cover level thresholds, JSON-lines shape, TTY
  pretty, `child()`, and redaction in all modes.
- **M4-3 — PASS:** `createLoggerFromConfig(config, source?, stream?)` — single
  factory (for the CLI, M6) combining config `redact` + auto-detected secret
  values (`redactionList`, §4.2), `config.logLevel` (which already absorbs
  `ISSU_LOG_LEVEL` via M3), and `config.logPretty`.
- **Public contract — PASS:** `src/index.ts` re-exports real `createLogger` +
  `Logger`/`LoggerOptions`/`LogLevel` from `src/logging/`; the M4 stub-throw
  expectation was removed from `tests/contract.test.ts` and replaced with a
  real shape assertion; the runtime export surface is still exactly the 18
  approved §2 symbols; `dist/index.d.ts` matches §2 and exposes no pino types
  through the barrel (pino remains private per SPEC §5.4 / DECISIONS D6).
- **Gate — PASS:** typecheck, lint, format:check, 139 tests, coverage (94.26%
  statements / 88.71% branches / 96.87% functions / 95.07% lines) all ≥ 80%,
  `npm run build` exit 0.
- **Note:** a sink pitfall surfaced during implementation — pino probes
  `stream.emit('message', …)` on destination streams; the sink's internal
  `emit` method collided with that protocol and was renamed `flushLine`.

## Milestone M5 — Error Foundation

| # | Task | Acceptance criteria |
| --- | --- | --- |
| M5-1 | [x] Implement `AppError`, `codes.ts`, `isAppError`, `toError` in `src/errors/`. | Tests: shape, `toJSON`, guards, cause chaining, normalization of unknown values. |
| M5-2 | [x] Implement `Result<T,E>` and helpers in `src/result/result.ts`. | Tests: ok/err/match semantics; type-level exhaustive matching. |
| M5-3 | [x] Implement `src/paths/contain.ts` (`assertContained`, `isContained`). | Tests: containment, traversal (`../`), absolute escape, symlink resolution. |

### M5 Implementation Record (2026-08-09)

- **M5-1 — PASS:** `src/errors/` implemented per ARCHITECTURE §5.6 —
  `app-error.ts` (`AppError` with `code`/`recoverable` (default `true`)/
  optional `cause`/`details`, `toJSON()` — structured and `JSON.stringify`-
  stable), `codes.ts` (normative registry `ERROR_CODES` = the 8 SPEC §6.3
  codes + `RESERVED_ERROR_CODE_NAMESPACES` = `issue.tool/agent/model/memory/
  network`), `guards.ts` (`isAppError`; `toError` — passes `AppError`/`Error`
  through unchanged, normalizes any other thrown value into an
  `issue.internal` `AppError` tagged by type only, so raw non-Error values
  are never embedded in messages or `toJSON` output), `normalize.ts`
  (`toAppError`: unknown → `AppError` for top-level handling), and
  `index.ts` module barrel. Tests cover shape, `toJSON`, guards, cause
  chaining, and normalization of unknown values (strings, numbers, null,
  undefined, objects, arrays, functions), including a no-secret-leak check
  on `toError`.
- **M5-2 — PASS:** `src/result/result.ts` — `Result<T, E = AppError>`,
  `ok`, `err`, `isOk`, `isErr`, `match`, and `unwrap` (throws the `err`
  payload). Type-level exhaustive matching is verified with `expectTypeOf`
  narrowing assertions plus `@ts-expect-error` fixtures proving the
  discriminated-union variants reject cross-branch property access.
- **M5-3 — PASS:** `src/paths/contain.ts` — canonical (realpath-based)
  containment, not a naive string prefix check. `isContained` resolves
  symlinks on both root and target and rejects `../` traversal, sibling
  roots, absolute escapes, and escapes through symlinks/junctions; targets
  that do not exist yet are canonicalized by resolving the deepest existing
  ancestor. `assertContained` returns the normalized `resolve(target)` and
  throws `issue.path.escape` (`recoverable=false`) with `{ root, target }`
  details. Tests (incl. symlink/junction cases, green on win32) cover
  containment, traversal, absolute escape, and symlink resolution.
- **M3 integration — PASS:** `src/config/config-error.ts` now constructs
  real `AppError` instances (D15 resolved); `configError`/`isConfigError`/
  `toAppError` keep their behavior — identity pass-through of config errors,
  contextual `issue.internal` wrapping of unexpected `Error`s, cause/details
  propagation, and no raw non-Error values embedded in wrapping messages.
  M3 error objects are now `instanceof AppError` and carry `toJSON()`; all
  existing M3 config/env tests pass unchanged (one strengthened to assert
  `instanceof AppError`).
- **Public contract — PASS:** the M5 stub-throw expectations were removed
  from `tests/contract.test.ts` and replaced with real contract assertions
  (`AppError`/`isAppError`/`toError`/`ok`/`err`/`isOk`/`isErr`/`match`/
  `assertContained`/`isContained` through the barrel); `runCli` remains the
  only stub (M6). Runtime export surface is still exactly the 18 approved §2
  symbols; `dist/index.d.ts` matches SPEC §2.
- **Gate — PASS:** typecheck, lint, format:check, 186 tests, coverage
  (94.5% statements / 89.26% branches / 98.59% functions / 95.35% lines) all
  ≥ 80%, `npm run build` exit 0, `npm audit --audit-level=high` → 0
  vulnerabilities.
- **Security — PASS:** `toError` never leaks raw values; no secret values
  appear in any new error message or cause chain; no path traversal/symlink
  escapes; no reserved code namespace allocated (`issue.tool/agent/model/
  memory/network` appear only as the spec-mandated reserved-namespace list
  in `codes.ts`).
- **Note:** final M5 acceptance is pending the separate read-only M5
  re-audit; M6 has not started.

## Milestone M6 — CLI Entry Point

| # | Task | Acceptance criteria |
| --- | --- | --- |
| M6-1 | [x] Implement `src/cli/args.ts` via `node:util.parseArgs` (allow `--help`, `--version`, `--config`, `--log-level`, `--no-color`; reject unknown flags). | Unknown flag → `issue.cli.unknownflag` → exit 2. |
| M6-2 | [x] Implement `src/cli/main.ts` (`runCli`) wiring logging + config + errors; shebang; top-level normalization. | `runCli` returns 0/1/2 per §6.4; one log line on failure; no raw stack to user. |
| M6-3 | [x] Add `bin/` mapping; verify built CLI. | `node dist/cli/main.js --help`, `--version` work; bad `--config` path → exit 2. |

### M6 Implementation Record (2026-08-09)

- **M6-1 — PASS:** `src/cli/args.ts` — `node:util.parseArgs` with exactly the
  five generic flags (`--help`, `--version`, `--config`, `--log-level`,
  `--no-color`), `allowPositionals: false` (no subcommands in Phase 1, §9).
  Error mapping verified against Node runtime codes (empirically checked on
  Node 24): `ERR_PARSE_ARGS_UNKNOWN_OPTION` → `issue.cli.unknownflag`;
  `ERR_PARSE_ARGS_INVALID_OPTION_VALUE` and
  `ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL` → `issue.usage`; duplicate flags are
  last-wins (Node semantics, no error). `--log-level` is validated against
  `LOG_LEVELS` → invalid value throws `issue.usage`. All errors are
  `AppError` (`recoverable=false`) with a `Run "issue --help" for usage.`
  suffix.
- **M6-2 — PASS:** `src/cli/main.ts` (shebang `#!/usr/bin/env node`) +
  `src/cli/print.ts` (`printHelp`/`printVersion`). `runCli(argv): Promise<number>`
  is the real §2 implementation, re-exported from the barrel
  (`src/index.ts` replaces the M5 stub). Flow: parse → `--help`/`--version`
  short-circuit to stdout/exit 0 → `loadConfig({ cwd, configPath })` →
  `createLoggerFromConfig` (config + env redaction + stderr stream, §5.3) →
  `logger.debug("cli invoked", …)` → 0. Exit mapping (§6.4):
  `issue.internal` → 1, every other code (usage/cli/config/env) → 2. Any
  throw is normalized with `toAppError`; failures emit exactly **one** plain
  `error[<code>]: <message>` line to stderr (no raw stack). `--log-level`
  overrides the config layer (highest precedence §3.2); `--no-color` forces
  `logPretty=false` (Phase 1 output is uncolored; accepted for
  forward-compat). A `runCliWith` internal (injectable cwd/stdout/stderr) is
  exported for in-process tests only; the bin entry (`node dist/cli/main.js`)
  detects the main module via `pathToFileURL(process.argv[1]) ===
  import.meta.url` and maps the result to `process.exitCode`.
- **M6-3 — PASS:** `bin.issue → dist/cli/main.js` (wired at M1) verified on the
  built CLI: `--help` exit 0 + usage text; `--version` exit 0 + `issue 0.1.0`;
  `--bogus` exit 2 + `error[issue.cli.unknownflag]`; `--config does-not-exist.json`
  exit 2 + `error[issue.config.notfound]`; `--log-level debug` exit 0 + a
  structured debug JSON line on stderr. `tests/cli/cli.test.ts` spawns the
  **built** binary (SPEC §8 suite 7); a vitest `globalSetup`
  (`tests/helpers/build-dist.global-setup.ts`) builds `dist/` before the suite
  so `npm test`/`npm run check` can spawn it without a manual `npm run build`.
- **Public contract — PASS:** the M6 stub-throw expectation was removed from
  `tests/contract.test.ts` and replaced with a real behavioral assertion
  (`runCli` resolves to 0 for `--version` and 2 for an unknown flag through the
  barrel). Runtime export surface is still exactly the 18 approved §2 symbols;
  `dist/index.d.ts` matches SPEC §2; pino types stay private.
- **Gate — PASS:** typecheck, lint, format:check, 217 tests (20 files,
  including `tests/cli/{args,main,cli}.test.ts`), coverage (94.24% statements /
  89.05% branches / 96.38% functions / 94.97% lines) all ≥ 80%, `npm run
  build` exit 0. The only uncovered code in `src/cli/` is the `isMainEntry`
  direct-run guard (exercised by the spawned binary, not by in-process v8
  coverage) and one non-executable line in `args.ts`.

## Milestone M7 — Examples and Docs

| # | Task | Acceptance criteria |
| --- | --- | --- |
| M7-1 | [x] Create `examples/quickstart.ts` and `examples/logging-demo.ts`. | `npm run demo` runs them without error against `src/`. |
| M7-2 | [x] Finalize the five planning docs to match the implemented reality. | Docs agree with code; §2 contract documented exactly. |

### M7 Implementation Record (2026-08-09)

- **M7-1 — PASS:** `examples/quickstart.ts` (walkthrough of the §2 public
  contract: `loadConfig` discovery/precedence + `Result` expected-failure
  handling, `createLogger` level thresholds + JSON-lines, `readEnv`/`getSecret`/
  `redactionList` + redaction of a secret **value** via the sink, `AppError`
  shape/`isAppError`/`toError`/`toJSON`, `ok`/`err`/`isOk`/`isErr`/`match`,
  `isContained`/`assertContained`) and `examples/logging-demo.ts` (level
  thresholds, `child()` top-level bindings, key-based redaction of
  `password`/`token`). Both import **only** the public barrel
  (`../src/index.js`), never internal modules. `package.json` `demo` now runs
  `tsx examples/quickstart.ts && tsx examples/logging-demo.ts` (ARCHITECTURE §7:
  "Run examples against `src/` via `tsx`"). `npm run demo` exit 0; output
  verified (see below). Examples are typechecked/linted/formatted with the rest
  of the tree (`tsconfig.json` includes `examples/**/*`; `eslint .`; Prettier)
  but excluded from the build (`tsconfig.build.json`) and from coverage
  (`include: ["src/**/*.ts"]`).
- **M7-2 — PASS (docs finalized, no unsupported behavior documented):**
  - `ARCHITECTURE.md` §5.9 — fixed stale "calls `run()`" (implementation calls
    `runCli()` and maps the exit code onto `process.exitCode`); added
    `print.ts` (`--help`/`--version` text) to the module list. §6 — documented
    `tests/helpers/build-dist.global-setup.ts` (Vitest `globalSetup` that builds
    `dist/` so `tests/cli/` can spawn the built binary from `npm test`).
  - `README.md` — status line updated to "implementation M1–M6 complete, M7
    examples/docs"; §7 heading "Planned Repository Layout" → "Repository
    Layout"; CI line "will run" → "runs the Phase 1 pipeline (install →
    typecheck → lint → format:check → test:coverage → build → audit)"; §8
    "Quick Start (planned, after approval)" → "Quick Start" with the actual
    workflow (demo comment corrected to "run examples against src/ via tsx").
  - `SPECIFICATION.md` — **unchanged** (normative; verified the §2 contract and
    §8 suite 7 match the implemented reality exactly).
  - `DECISIONS.md` — **unchanged** (all recorded decisions match reality; no new
    non-obvious choice was introduced by M7).
  - `.env.example` — created (SPEC §4.2 / DECISIONS §D5 mandate it; it is listed
    in README §7's layout but was missing). Documents the `ISSU_` variable names
    and the secret-name convention with placeholders only; no real secrets.
  - No unsupported behavior is documented anywhere; every documented command and
    API matches the code.
- **Contract freeze — PASS:** the §2 surface is untouched by M7 (still exactly
  the 18 runtime symbols; `dist/index.d.ts` unchanged); M6 was not modified.
- **Gate — PASS:** typecheck, lint, format:check, 217 tests (20 files), coverage
  (94.24% statements / 89.05% branches / 96.38% functions / 94.97% lines) all ≥
  80%, `npm run build` exit 0, `npm audit --audit-level=high` → 0
  vulnerabilities, `npm run demo` exit 0 (quickstart + logging-demo, output
  verified: `resolved config`, `expected failure handled: rejected:
  issue.config.notfound`, redaction `"token":"[REDACTED]"` for both key-based
  and value-based redaction, `child()` top-level `requestId`), and the M6 CLI
  still behaves correctly (`node dist/cli/main.js --help`/`--version`/`--bogus`
  re-verified).

## Milestone M8 — Verification and Freeze

| # | Task | Acceptance criteria |
| --- | --- | --- |
| M8-1 | Full gate: `npm run check`, `npm run build`, `npm run test:coverage`, `npm audit`. | All green; coverage ≥ 80%. |
| M8-2 | SPECIFICATION §9 audit (grep-style + review): no agent/model/tool/memory/codebase/web/git/network code in `src/`; no reserved code namespaces allocated. | Clean audit report. |
| M8-3 | Contract freeze: public surface §2 finalized, tested, documented. | Any change would require a DECISIONS entry. |
| M8-4 | Role review (lead/architect) + phase acceptance. | Sign-off recorded; README status → FROZEN. |

### M8 Implementation Record (2026-08-09)

- **M8-1 — PASS:** full gate re-run as the M8 gate — `npm run check` exit 0
  (typecheck, lint, format:check, 217 tests / 20 files); `npm run build` exit
  0; `npm run test:coverage` 94.24% statements / 89.05% branches / 96.38%
  functions / 94.97% lines (all ≥ 80%); `npm audit --audit-level=high` 0
  vulnerabilities; built CLI `--version` / `--help` exit 0.
- **M8-2 — PASS (§9 audit):** grep + review of `src/` — no future-phase code
  (agent loops, memory, multi-agent, tool orchestration, codebase
  intelligence, web/browser, model routing/LLM, git/VCS, filesystem/terminal/
  network tools); config models only `logLevel` / `logPretty` / `redact` (no
  `models`/`tools`/`permissions`/`memory`/`agent` schemas); the five reserved
  namespaces exist only as a denylist (`src/errors/codes.ts`
  `RESERVED_ERROR_CODE_NAMESPACES`) and are test-enforced.
- **M8-3 — PASS (contract freeze):** `src/index.ts` exports exactly the 18 §2
  symbols; no internal modules exported; every §2 contract has tests; §2
  matches `dist/index.d.ts`.
- **Consistency checklist — 6/6 PASS:** after amending SPECIFICATION §4.2 and
  DECISIONS §D5, docs and code agree. **Drift found and fixed:** the docs
  claimed missing secrets produce `issue.env.missing`, but the frozen code
  returns `undefined` (Phase 1 declares no required secrets). Docs now state
  that; the code stays in the registry for future phases. No code or contract
  change.
- **M8-4 — PENDING:** role review (lead/architect) + phase acceptance sign-off
  required before README status → FROZEN.

---

## Completeness Checks

### Definitions of Done (cross-reference)

* Per-milestone acceptance criteria: TASKS above.
* Phase-level completion: SPECIFICATION §10.

### Consistency review checklist (used at M0 and M8)

- [x] No future-phase code present (§9).
- [x] No internal module exported from `src/index.ts`.
- [x] Reserved namespaces untouched (`issue.tool.*`, etc.).
- [x] README topic index (21 items) matches actual coverage.
- [x] DECISIONS.md records every non-obvious choice with alternatives.
- [x] Docs and code agree (no drift).

### Non-goal watchlist (grep at review time)

```text
agent loop, planning engine, memory, multi-agent, tool orchestration,
codebase intelligence, web search, model routing, LLM, prompt, git, browser
```

Any hit under `src/` (other than documentation text or test names) fails review.
