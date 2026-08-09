# ISSU — Phase 1: Foundation Architecture

**Phase:** 1 — Foundation
**Status:** APPROVED (plan approved 2026-08-08)

---

## 1. Architectural Context

BLUEPRINT §8 describes a conceptual modular platform (Core, Reasoning,
Planning, Memory, Agent Runtime, Tool System, Domain Capabilities). Phase 1 does
**not** implement any of those layers. It implements the engineering substrate
they will later be built upon:

* Configuration mechanism
* Environment / secret handling
* Logging / observability foundation
* Error-handling foundation
* CLI entry-point foundation
* Build / lint / test / format toolchain
* Documentation set

The concrete platform layers are out of scope and will be architected during
their own phases.

---

## 2. Guiding Principles Applied (from BLUEPRINT)

* **§7.3 Independent Development** — Phase 1 is self-contained; it depends only
  on the Node.js runtime and its own declared dependencies.
* **§7.4 Interface-Based Integration** — The phase's public surface is a set of
  typed contracts (SPECIFICATION §2). Future phases depend on those contracts,
  not on internal files.
* **§7.7 Reliability Over Unnecessary Complexity** — Smallest architecture that
  works; no premature abstraction; no placeholder subsystems for future layers.
* **§7.8 Security by Default** — Secrets, redaction, and path containment are
  first-class from day one.
* **§7.10 Open-Source Quality** — Code written as if public contributors will
  read and review it.
* **§11 Lifecycle** — This phase follows Define → Architect → Specify →
  Implement → Test → Review → Refactor → Document → Freeze.

---

## 3. Technology Summary

| Concern | Selection | Full rationale |
| --- | --- | --- |
| Language | TypeScript | DECISIONS §D1 |
| Runtime | Node.js (LTS) | DECISIONS §D1 |
| Package manager | npm | DECISIONS §D2 |
| Test framework | Vitest | DECISIONS §D8 |
| Linter / formatter | ESLint (flat config) / Prettier | DECISIONS §D9 |
| Compiler | `tsc` (build) + `tsx` (dev) | DECISIONS §D10 |
| CLI parsing | `node:util.parseArgs` (zero-dep) | DECISIONS §D11 |
| Logging | pino behind an internal facade | DECISIONS §D6 |

Node.js is selected as the primary runtime because ISSU's long-term needs —
filesystem, terminal/process control, Git, CLI, networking — are all native,
well-served Node capabilities, and the evaluation (DECISIONS §D1) concluded it
is appropriate over Rust, Go, and Python for this project's constraints.

---

## 4. Package Layout and Boundary

Phase 1 is **one npm package** scoped to the phase directory. This enforces
phase independence (BLUEPRINT §10): there is no monorepo root package that
couples phases together. Each future phase will likewise be its own package;
integration happens later through adapters/contracts, not workspace coupling.

* Package name (codename placeholder): `@issue/foundation`
* Node engine: `>=22.9.0` (development on current LTS; see DECISIONS §D14)
* `private: true` — no publishing in Phase 1 (DECISIONS §D2)

### Why not a monorepo in Phase 1

A workspaces monorepo would create a shared root manifest and shared toolchain
configuration *before* any second consumer exists. That is premature coupling.
When Phase 2 needs Phase 1, we evaluate the integration strategy then
(npm link, publishing, or a workspace) as a documented decision.

---

## 5. Module Design (`src/`)

Each module has a single responsibility and exposes a typed, public contract.
Internals are not exported from the package barrel.

### 5.1 `src/index.ts` — Public contract (barrel)

The **only** way future phases import Phase 1. Re-exports the typed contracts
below. Any change to this surface is a breaking change requiring a DECISIONS
entry (SPECIFICATION §2, §10).

### 5.2 `src/version.ts`

Single source of truth for the package version at runtime
(`--version` output).

### 5.3 `src/config/` — Configuration mechanism

* `defaults.ts` — built-in default values.
* `jsonc.ts` — tiny JSONC (comments + trailing commas) parser, zero-dependency.
* `load.ts` — locate and read the config file.
* `resolve.ts` — merge precedence layers into a validated, typed config object.

See SPECIFICATION §3 for precedence and format.

### 5.4 `src/env/` — Environment and secrets

* `env.ts` — typed access to `process.env` for documented `ISSU_` variables.
* `secrets.ts` — secret retrieval; maintains the canonical redaction list.

See SPECIFICATION §4.

### 5.5 `src/logging/` — Observability foundation

* `logger.ts` — the `Logger` interface (the contract).
* `pino-logger.ts` — pino-backed implementation of that interface.
* `redaction.ts` — redaction of secrets from all sinks.

The interface is owned by ISSU; the implementation is replaceable. See
SPECIFICATION §5 and DECISIONS §D6.

### 5.6 `src/errors/` — Error-handling foundation

* `app-error.ts` — `AppError` base class.
* `codes.ts` — error code registry (SPECIFICATION §6).
* `guards.ts` — `isAppError`, `toError` normalization helpers.
* `normalize.ts` — unknown → `AppError` conversion for top-level handling.

### 5.7 `src/result/result.ts` — `Result<T, E>`

Small, dependency-free algebraic result type for expected failure paths
(`ok`, `err`, `isOk`, `isErr`, `match`, `unwrap`). See SPECIFICATION §6.

### 5.8 `src/paths/contain.ts` — Path containment primitive

Security foundation: validates that a resolved path stays within a configured
root (anti path-traversal). This is a foundation security utility, **not** a
filesystem tool (which is a later-phase tool).

### 5.9 `src/cli/` — Entry point foundation

* `main.ts` — shebang entry; wires config + logging + errors; calls `runCli()`
  and maps the returned exit code onto `process.exitCode` (SPECIFICATION §6.4).
* `args.ts` — `node:util.parseArgs`-based flag parsing (SPECIFICATION §2).
* `print.ts` — `--help` / `--version` text generation.

The CLI is a thin, generic shell: `--help`, `--version`, `--config`,
`--log-level`, `--no-color`, exit-code mapping. Subcommands are reserved for
future phases and are **not** implemented.

---

## 6. Test Structure (`tests/`)

Per BLUEPRINT §9, tests live under a dedicated `tests/` directory at package
root, mirroring the `src/` tree:

```text
tests/
├── config/
├── env/
├── logging/
├── errors/
├── result/
├── paths/
├── cli/
└── helpers/
```

* Unit tests for every public contract and every non-trivial internal.
* `tests/cli/` contains integration-style tests that spawn the built CLI binary
  (`node dist/cli/main.js`) and assert exit codes/output (SPECIFICATION §8).
* `tests/helpers/build-dist.global-setup.ts` (a Vitest `globalSetup`) builds
  `dist/` via `tsconfig.build.json` before the suite, so `tests/cli/` can spawn
  the built binary from a plain `npm test`.
* No test file depends on files outside `phase-01-foundation/`.
* Coverage is collected with `@vitest/coverage-v8`; gate ≥ 80% overall.

---

## 7. Development Scripts (`package.json`)

| Script | Behavior |
| --- | --- |
| `npm run check` | Single gate: typecheck + lint + format-check + test. |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | `tsc -p tsconfig.build.json` → `dist/` |
| `npm test` | Vitest run |
| `npm run test:watch` | Vitest watch |
| `npm run test:coverage` | Vitest with coverage |
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run clean` | Remove `dist/`, `coverage/` |
| `npm run dev` | `tsx watch src/cli/main.ts` |
| `npm run demo` | Run examples against `src/` via `tsx` |

`npm run check` is the command CI and contributors must pass before merge.

---

## 8. Dependency Philosophy (summary)

See DECISIONS §D12 for the full policy. Rules that shape this architecture:

1. Prefer Node.js built-ins (`node:util`, `node:path`, `node:fs`, `node:url`).
2. Runtime dependencies are limited to justified foundations (pino only,
   wrapped behind a replaceable interface).
3. Exact version pinning; lockfile committed; `npm audit` enforced in CI.
4. No transitive bloat: review lockfile diff on every dependency change.
5. Dev dependencies (ESLint, Prettier, Vitest, tsx, TS) never ship at runtime.

---

## 9. Security Architecture

* **Secrets:** never logged, never in errors, never in config files; env-first;
  redaction list propagated to every log sink (SPECIFICATION §4).
* **Config:** JSONC file is optional and developer-authored; secrets are
  forbidden in it (validation error).
* **Errors:** error codes are stable and machine-readable; error messages never
  embed secret values.
* **Paths:** `src/paths/contain.ts` prevents traversal in any future use.
* **Supply chain:** pinned deps, lockfile, `npm audit` in CI, minimal dep count.
* **Safe defaults:** logging level defaults to `info` (not `debug`); CLI refuses
  unknown flags (exit 2); errors fail loudly rather than silently degrading.
* **No privileged execution:** the foundation never elevates privileges.

Full security posture is out of scope for Phase 1 implementation beyond these
foundations (permission boundaries, sandboxing, tool authorization belong to
the tool/agent phases).

---

## 10. Developer Experience

* `npm run check` gives a single, fast, reproducible quality gate.
* `npm run dev` provides watch-mode CLI iteration.
* `examples/` demonstrate each contract in isolation.
* Helpful errors: `AppError` messages are actionable; CLI errors print usage
  hints; unknown flags explain themselves.
* `.editorconfig`, Prettier, and ESLint are zero-config for contributors.
* `.node-version` pins the Node LTS for all contributors.
* Rich, plain-English documentation at every level.

---

## 11. Phase Boundaries

### In scope

* Package scaffold, toolchain (build/lint/test/format), CI pipeline.
* Config mechanism, env/secret handling, logging facade, error foundation,
  `Result` type, path containment, CLI shell.
* Five planning/design documents + `examples/`.

### Explicitly out of scope

The full list is in SPECIFICATION §9. Architecture-level note: **nothing** in
Phase 1 creates, invokes, or models an agent, a model, a tool, or memory. The
`src/` modules are generic infrastructure only; no "ISSU feature" exists yet.

### Hand-off contract for future phases

Future phases consume:
* The typed exports of `src/index.ts` (SPECIFICATION §2).
* The documented conventions (DECISIONS.md) — as guidance, not code coupling.
* The error-code namespace convention (`issue.*`, `issue.<domain>.*`).

They do **not** consume: `tests/`, `examples/`, internal module files, or
toolchain configuration. Integration mechanics (publishing/linking) are a
future decision, not a Phase 1 deliverable.

---

## 12. Consistency With the Blueprint

* Folder and lifecycle follow BLUEPRINT §9 and §11.
* Independence and interface rules follow §10 and §7.4.
* Foundation-only scope follows §7.1 and the Phase 1 mandate in §36.
* Security-by-default follows §7.8 and §17 (progressive security development).
* Open-source quality follows §7.10 and §20.
