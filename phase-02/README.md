# ISSU — Phase 2: ToolRuntime (Read-Only Filesystem Task Execution)

**Phase:** 2 — ToolRuntime (deterministic read-only filesystem task execution)
**Status:** FROZEN — P4 (implementation), P5 (tests), and P6 (documentation) complete and signed off; P7 (verification/freeze) complete; phase accepted
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**License:** Apache License 2.0

---

## 1. Purpose

This folder holds Phase 2: the **ToolRuntime** — a deterministic task runner
over a read-only filesystem, driven by a frozen nine-state machine. Its sole
capability is reading files and listing directories, with deny-by-default
containment, bounded correction/verification/retry semantics, structured
observability with secret/content redaction, and a model-independent
`DecisionProvider` contract.

Phase 2's responsibility, architecture, and specification are **formalized at
milestone P0** in `SPECIFICATION.md` — the authoritative Phase 2 specification
(BLUEPRINT §36 precedent: "the exact Phase 1 architecture ... will be defined at
the beginning of Phase 1", applied to Phase 2). `README.md` is the phase overview
and package plan; `TASKS.md` is the milestone task breakdown.

## 2. What Phase 2 Is and Is Not

**Implemented (P4/P5, documented at P6):**

* A complete, tested library package (`@issue/tool-runtime`) under `src/` with
  the frozen §17 public barrel (20 types + 3 functions: `runTask`,
  `createToolRuntime`, `deriveAvailableActions`).
* The nine-state TaskMachine with the 18 legal transitions, terminal closure,
  cancellation, deterministic correction (`RETRY → ADVANCE → EXHAUST`) and
  verification.
* Read-only filesystem capability (`readFile`, `listDirectory`) with strict
  UTF-8 validation, bounded/chunked reads, unambiguous `includeHidden`, and
  deny-by-default containment built on Phase 1 primitives.
* Structured observability with secret/content redaction via the Phase 1
  `Logger` contract.
* A P5 test suite (91 tests) covering every §16 deterministic validation
  scenario (V1–V18), with a coverage gate ≥ 80%.

**Not implemented, and not implied by this phase:**

* No agent/tool/model/memory feature exists. Phase 2 never talks to a model —
  the `DecisionProvider` is an injected consumer-supplied interface.
* No write/edit/delete, execute/process, Git, network, CLI, config-schema,
  plugin, or planning-engine capability (see `SPECIFICATION.md` §19 and
  `ARCHITECTURE.md` §18).
* Phase 2 must not consume Phase 1 internals — only the frozen public barrel
  (ARCHITECTURE §11 hand-off contract).

**Status note:** P7 (verification and freeze) is complete and accepted
(2026-08-10); **Phase 2 is FROZEN**. P8 has not started.

## 3. Package Plan

`package.json` for Phase 2 (per `SPECIFICATION.md` §20):

```json
{
  "name": "@issue/tool-runtime",
  "version": "0.1.0",
  "description": "ISSU Phase 2 — ToolRuntime: deterministic read-only filesystem task execution.",
  "private": true,
  "type": "module",
  "license": "Apache-2.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "engines": { "node": ">=22.9.0" },
  "scripts": {
    "check": "npm run typecheck && npm run lint && npm run format:check && npm test",
    "typecheck": "tsc --noEmit",
    "build": "tsc -p tsconfig.build.json",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "dependencies": {
    "@issue/foundation": "file:../phase-01-foundation"
  }
}
```

* `private: true` — no publishing (Phase 1 DECISIONS §D2/D3; SPECIFICATION §9.12).
* Node engine mirrors Phase 1 (DECISIONS §D14).
* Package name `@issue/tool-runtime` is owner-authorized and recorded as
  Phase 2 decision D1 (DECISIONS §D1; SPECIFICATION §20.1).
* Toolchain mirrors Phase 1 as conventions, not coupling: `tsc` build, `tsx` dev,
  Vitest with a ≥ 80% coverage gate, ESLint 9, Prettier.
* Folder layout mirrors Phase 1: `src/`, `tests/`, plus this documentation set.

## 4. Integration with Phase 1 — LINK (D3 resolution)

Recorded in `phase-01-foundation/DECISIONS.md` → **D3 resolution (2026-08-09)**:
Phase 2 consumes Phase 1 through a **reproducible local path dependency**:

```json
"@issue/foundation": "file:../phase-01-foundation"
```

Mechanics and constraints:

* **Barrel only:** imports go through the package name
  (`import { ... } from "@issue/foundation"`). Phase 1's `exports` map exposes
  only `.`, so deep imports (`@issue/foundation/dist/...` or internal module
  paths) are blocked at the Node resolver.
* **Frozen surface:** the consumable contract is exactly the frozen 18-symbol
  §2 surface (`src/index.ts` → `dist/index.js`, `dist/index.d.ts`). Phase 2 must
  not import Phase 1 `tests/`, `examples/`, or internal module files.
* **Reproducible:** `npm install` resolves the local path and records it in the
  lockfile; no global npm state. Global `npm link` is a developer convenience
  only, never the canonical mechanism.
* **No publishing introduced:** Phase 1 remains `private: true`.
* **Revisitable:** if future phases create a genuine need for a workspace or
  published distribution, D3 can be revisited.

## 5. Documentation Index

| Document | Purpose |
| --- | --- |
| `README.md` | This file — phase overview, package plan, integration record. |
| `SPECIFICATION.md` | Authoritative Phase 2 specification (frozen; sole normative authority). |
| `ARCHITECTURE.md` | Phase 2 architecture (drafted at P6) — descriptive, never overrides the specification. |
| `DECISIONS.md` | Phase 2 decision record (D1 approved; D-BOUNDS documented; signed off at P6). |
| `TASKS.md` | Phase 2 milestones and acceptance criteria (P0–P7). |

## 6. How to Review This Phase

1. Read `../BLUEPRINT.md` §7, §9, §10, §11.
2. Read `phase-01-foundation/DECISIONS.md` → D3 resolution.
3. Read `phase-02/TASKS.md` — the milestone plan.
4. Read `phase-02/ARCHITECTURE.md` for the implemented architecture, then
   `phase-02/SPECIFICATION.md` for the normative contract.

## 7. License

Licensed under the Apache License, Version 2.0. See `../LICENSE`.
