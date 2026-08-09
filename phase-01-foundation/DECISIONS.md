# ISSU — Phase 1: Engineering Decisions

**Phase:** 1 — Foundation
**Status:** APPROVED (plan approved 2026-08-08)

This file records the engineering decisions for Phase 1 and, critically, the
reasons behind them. Per BLUEPRINT §7.11 (Learn While Building) and §30
(major architectural decisions are documented), every non-obvious choice
includes context, rationale, alternatives considered, and consequences.

Decision IDs are stable references used across the other documents.

---

## Technology Evaluation — TypeScript + Node.js

> Requirement: evaluate TypeScript + Node.js as the default recommendation, do
> not select blindly, and document the reasoning.

### What ISSU will eventually need

From BLUEPRINT §5 and §14: filesystem, terminal/process control, Git/CLI
interaction, networking/web, configuration, JSON handling, process spawning,
and a long-lived interactive platform. These are the deciding capabilities.

### Suitability assessment

| Criterion (BLUEPRINT §19) | TypeScript + Node.js |
| --- | --- |
| Reliability | Very high for I/O-heavy, event-driven systems; mature error/async model. |
| Performance | Excellent for I/O and orchestration; not for CPU-bound numeric loops (future domain modules needing that can be subprocesses/FFI — BLUEPRINT §7.9). |
| Maintainability | Strong: static typing, interfaces as first-class (aligns with §7.4), modular ESM. |
| Ecosystem maturity | Filesystem, child_process, net, http, Git bindings, CLI tooling, TS SDKs for every major model provider. |
| Developer experience | Fast iteration, watch-mode, Vitest, excellent diagnostics. |
| Security | Mature sandbox/audit tooling (`npm audit`), typed inputs reduce injection class errors; process boundaries available. |
| Extensibility | Dynamic loading, subprocess isolation, and package modularity support §7.9. |
| Community | One of the largest contributor pools — aligns with §20 open-source goals. |
| Long-term viability | LTS cadence, active ecosystem, Node continues to add built-ins (e.g., `--env-file`, `parseArgs`, type stripping). |

### Alternatives considered

* **Rust / Go** — superior raw performance and distribution (single binaries),
  but slower iteration, smaller contributor pool, and more boilerplate for the
  agent/tool/CLI space ISSU is entering. Not chosen for Phase 1.
* **Python** — strong for AI/ML ecosystem, but weaker for distribution of
  desktop-style CLI/process-control platforms, packaging is a long-standing
  pain point, and typing is secondary. Not chosen.

### Conclusion (D1)

**Select TypeScript + Node.js.** Rationale: it directly and natively covers
every near-term capability ISSU needs (filesystem, terminal, Git, CLI,
networking, processes), its typing discipline matches the interface-based
architecture philosophy (§7.4), the ecosystem is mature for CLI/tool
development, and the contributor pool supports the open-source strategy (§20).
Trade-off accepted: CPU-bound workloads, if they ever arise, are isolated into
subprocesses or native modules rather than changing the platform language.

Node's long-term support matters: engines `>=22.9.0`, development on current
LTS. See D14.

---

## D1 — Language and Runtime

* **Decision:** TypeScript on Node.js LTS (`engines >= 22.9.0`, dev on current
  LTS per D14).
* **Context/Rationale:** see evaluation above.
* **Consequences:** TS compiles via `tsc` to `dist/`; dev/test via `tsx`; strict
  mode enforced (SPECIFICATION §7).

## D2 — Package Management

* **Decision:** npm (bundled with Node), committed `package-lock.json`, exact
  version pinning (`save-exact`), `private: true`.
* **Alternatives:** pnpm (faster, stricter), yarn, Bun.
* **Rationale:** npm is the zero-friction, universally understood default for an
  open-source project (BLUEPRINT §20); its strictness deficiencies are covered
  by our dependency policy (D12). A stricter manager can be adopted later
  without architecture change.
* **Consequences:** contributors need no extra tool install; exact pins + audit
  cover supply-chain concerns in Phase 1. Exact pinning is enforced via
  `.npmrc` (`save-exact=true`) added at M1.

## D3 — Single Package, No Monorepo (Yet)

* **Decision:** Phase 1 is one self-contained npm package under
  `phase-01-foundation/`. No root workspace.
* **Alternatives:** npm/pnpm workspaces monorepo now.
* **Rationale:** there is no second consumer yet; a monorepo would create
  premature coupling and shared tooling before integration exists. This honors
  phase independence (BLUEPRINT §10).
* **Consequences:** the phase-integration mechanism (link / publish / workspace)
  is deliberately deferred to a later decision, when a second phase exists.

## D4 — Configuration Approach

* **Decision:** layered config (defaults < `issue.config.json` JSONC < `ISSU_*`
  env < CLI flags), validated and typed; config schema limited to the Phase 1
  keys (SPECIFICATION §3).
* **Alternatives:** full schema system (Zod), YAML, dot-prop config managers.
* **Rationale:** layered precedence is the minimal mechanism future phases need;
  a small hand-rolled JSONC parser keeps runtime deps at zero (D12). Zod-style
  validation is deferred until config complexity justifies it.
* **Consequences:** future phases extend the schema; the loader mechanism is
  stable. Reserved future namespaces are not modeled now (§9).

## D5 — Environment and Secret Handling

* **Decision:** secrets live only in the process environment; dev uses Node's
  built-in `--env-file-if-exists` (no `dotenv` dependency); `.env.example`
  documents names; `.env*` gitignored; global redaction list (D6).
* **Alternatives:** dotenv runtime, secret manager SDKs, config-file secrets.
* **Rationale:** Node ≥22.9 provides env-file loading natively (zero-dep);
  environment-first keeps secrets out of the repo and out of config files.
  Secret managers belong to deployment phases, not foundation.
* **Consequences:** no secret can appear in logs/config/errors; Phase 1
  declares no required secrets, so `getSecret` returns `undefined` for a
  missing variable. The `issue.env.missing` code is reserved for future
  required-secret enforcement.

## D6 — Logging

* **Decision:** a small, ISSU-owned `Logger` interface implemented over **pino**.
* **Alternatives:** Winston, pino directly everywhere, hand-rolled logger.
* **Rationale:** pino is tiny (near-zero transitive deps), extremely fast, JSON
  native, and has robust redaction — a professional base. But consumers depend
  on our `Logger` interface, not pino, so the implementation stays replaceable
  (§7.4).
* **Consequences:** one justified runtime dependency; redaction is enforced at
  the sink and unit-tested (SPECIFICATION §5.3).

## D7 — Error Handling

* **Decision:** typed `AppError` hierarchy (codes, cause, recoverable, details)
  for exceptional failures **plus** a `Result<T, E>` type for expected
  failure paths; top-level normalization in the CLI.
* **Alternatives:** exceptions-only, FP-only (`Either` via a library), string
  errors.
* **Rationale:** autonomous systems cannot assume success (BLUEPRINT §12);
  `Result` makes expected failures explicit and exhaustive, while `AppError`
  carries rich, serializable, redactable context for the exceptional path.
  Zero-dependency `Result` avoids an FP library.
* **Consequences:** fallible public functions return `Result`; throwing is
  reserved for exceptional cases; stable exit-code map (0/1/2).

## D8 — Testing Framework

* **Decision:** Vitest (with `@vitest/coverage-v8`).
* **Alternatives:** Jest, Node's built-in `node:test`.
* **Rationale:** Vitest is TypeScript-native (no separate compile step), fast,
  has first-class watch + coverage, and a modern DX. Jest adds a transform
  layer for a TS-first project. `node:test` is viable but weaker for coverage
  gating and mocking ergonomics.
* **Consequences:** coverage gate ≥ 80% (SPECIFICATION §8); tests run in CI.

## D9 — Linting and Formatting

* **Decision:** ESLint 9 flat config + `typescript-eslint` (recommended, strict)
  + Prettier for formatting.
* **Alternatives:** Biome, dprint.
* **Rationale:** ESLint + Prettier is the dominant, best-understood combination
  for open-source contributors (BLUEPRINT §20); Biome remains a promising
  single-tool alternative we will re-evaluate if tooling consolidation becomes
  worthwhile.
* **Consequences:** `npm run lint`/`format`; both in the `check` gate.

## D10 — TypeScript / Compiler Configuration

* **Decision:** `tsc` for builds (`tsconfig.build.json` → `dist/`), `tsx` for
  dev/demo, strict compiler flags (SPECIFICATION §7).
* **Alternatives:** ts-node, Node native type-stripping, esbuild/tsup bundling.
* **Rationale:** strict `tsc` output is the most conservative, dependency-light
  build and gives `.d.ts` declarations for free (important for future phases
  consuming the contract). `tsx` is the lowest-friction dev runner. Native type
  stripping (Node 24+) is noted for re-evaluation.
* **Consequences:** ESM `NodeNext` module strategy; build artifacts are plain
  JS + declarations.
* **Version pin (M1):** TypeScript is pinned `5.9.3` — the mature, stable
  compiler with full support for the SPECIFICATION §7 flag set. The native 7.x
  compiler is deferred for re-evaluation alongside native type stripping
  (Node 24+), per this decision's re-evaluation note.

## D11 — CLI Entry-Point Strategy

* **Decision:** zero-dependency CLI shell using `node:util.parseArgs`, a thin
  `runCli` returning an exit code, bin `issue` → `dist/cli/main.js`. Generic
  flags only (`--help`, `--version`, `--config`, `--log-level`, `--no-color`).
* **Alternatives:** commander/oclip, yargs.
* **Rationale:** `parseArgs` is stable and covers every flag Phase 1 needs; a
  dependency is unjustified until real subcommands arrive (future phases).
  Returning an exit code keeps the CLI testable and framework-agnostic.
* **Consequences:** no command framework in Phase 1; subcommands are explicitly
  reserved for later phases (§9).

## D12 — Dependency Philosophy

* **Decision:** policy: (1) prefer Node built-ins; (2) runtime deps only where
  justified (Phase 1: pino); (3) exact pins + committed lockfile; (4) `npm
  audit` in CI; (5) review lockfile diffs; (6) dev deps never ship.
* **Alternatives:** permissive dependency adoption.
* **Rationale:** BLUEPRINT §33.8 (avoid unnecessary dependencies) and §7.8
  (security by default). Every dependency is a supply-chain and maintenance
  risk; the policy makes additions a conscious act.
* **Consequences:** small lockfile; dependency additions require justification
  in DECISIONS.md.

## D13 — Developer Experience Tooling

* **Decision:** `npm run check` single gate; `npm run dev` (tsx watch);
  `examples/`; `.editorconfig`; `.node-version`; helpful `AppError` messages.
* **Rationale:** BLUEPRINT §19 (developer experience) and §20 (approachable for
  new contributors).
* **Consequences:** a clear contributor path: install → run `check` → run
  `demo`.

## D14 — Node Version Policy

* **Decision:** `engines >= 22.9.0`; development targets current Active LTS
  (24), pinned via `.node-version`. Feature notes: `parseArgs` (20+),
  `--env-file-if-exists` (22.9+), native type stripping (24).
* **Rationale:** LTS cadence provides reliability and long support windows
  (BLUEPRINT §19). The 22.9 floor gives built-in `--env-file-if-exists`
  support, removing the need for a `dotenv` dependency (D5).
* **Consequences:** CI pins the same LTS; contributors using older Node are
  told the supported floor.

## D15 — Temporary Configuration Error Mechanism (M3)

* **Decision:** Until M5 implements the real `AppError` class (SPECIFICATION
  §2/§6), M3 configuration failures are produced by a temporary factory
  (`src/config/config-error.ts` — `configError` / `isConfigError` /
  `toAppError`) that returns **AppError-shaped** `Error` objects carrying
  `code`, `recoverable`, `cause`, and `details`, with `name: "AppError"`.
  The mechanism is confined to internal config/env modules; it is never part
  of the public barrel.
* **Context/Rationale:** M3 must classify failures with the normative codes
  `issue.config.parse` / `issue.config.invalid` / `issue.config.notfound`
  and return them through `Result<IssueConfig, AppError>` (SPECIFICATION
  §2, §6.3). The real `AppError` class is an M5 deliverable and is still a
  throwing stub at M3, so M3 needs a temporary shape that satisfies the typed
  contract without prematurely implementing the M5 error foundation
  (SPECIFICATION §9).
* **Alternatives:** throwing generic `Error`s (loses the typed `code`
  contract); implementing the full `AppError` class now (premature M5 work,
  §9 boundary violation); duplicating the shape inline in every module.
* **Consequences:** M3 error objects are `instanceof Error` but **not**
  `instanceof AppError`, and have no `toJSON()` — a documented, temporary
  deviation. `toAppError` passes recognized config errors through unchanged
  and wraps any unexpected error as `issue.internal` (`recoverable=false`).
  **M5 must replace this mechanism with the real `AppError` implementation
  and update the internal callers**; until then D15 is the contract for
  config-error shape.
- **Resolved at M5 (2026-08-09):** `src/config/config-error.ts` now
  constructs real `AppError` instances from `src/errors/app-error.ts`; M3
  error objects are now `instanceof AppError` and carry `toJSON()`. The
  internal marker/`isConfigError`/`toAppError` pass-through semantics are
  preserved unchanged, so no M3 behavior changed.

---

## Decision Log

| ID | Decision | Status |
| --- | --- | --- |
| D1 | TypeScript + Node.js | Approved |
| D2 | npm, exact pins, private | Approved |
| D3 | Single package, no monorepo | Approved |
| D4 | Layered config, JSONC, typed | Approved |
| D5 | Env-first secrets, native env-file | Approved |
| D6 | Logger interface over pino | Approved |
| D7 | AppError + Result | Approved |
| D8 | Vitest | Approved |
| D9 | ESLint 9 flat + Prettier | Approved |
| D10 | tsc build + tsx dev | Approved |
| D11 | parseArgs CLI shell | Approved |
| D12 | Dependency philosophy | Approved |
| D13 | DX tooling | Approved |
| D14 | Node version policy | Approved |
| D15 | Temporary config error mechanism (until M5) | Approved |

Status becomes **Approved** at M0-2 and **Frozen** at phase freeze. Later
phases may propose new decisions; changing a frozen decision requires a
documented revisit.

**M0-2 approval record (2026-08-08):** All decisions D1–D14 are formally
**Approved** via the Phase 1 plan approval. They become **Frozen** at phase
freeze.

**M3 record (2026-08-08):** D15 added to record the temporary configuration
error mechanism used until M5 implements the real `AppError` class; it was
identified as a missing decision during the M3 final audit.
