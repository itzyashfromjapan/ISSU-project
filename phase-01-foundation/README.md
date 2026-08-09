# ISSU — Phase 1: Foundation

**Phase:** 1 — Foundation
**Status:** APPROVED (plan approved 2026-08-08; implementation M1–M6 complete, M7 examples/docs)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**License:** Apache License 2.0

---

## 1. Purpose

Phase 1 establishes the professional engineering foundation required for all
future ISSU development. It does **not** build any part of the autonomous
platform itself. It builds the *workshop* in which the platform will be built:
tooling, conventions, configuration, observability, and error handling.

Per BLUEPRINT §7.1 (Build Foundations, Not Features), Phase 1 is deliberately
free of agent functionality.

---

## 2. What This Phase Is

* A single, independently testable and replaceable Node.js + TypeScript package.
* The phase-scoped package for `phase-01-foundation`.
* Conventions and defaults that later phases inherit **as contracts**, not as
  implementation coupling.
* Foundation primitives:
  * Configuration loading (layered: defaults → file → env → CLI).
  * Environment variable and secret handling with logging redaction.
  * Structured logging foundation behind a replaceable interface.
  * Typed error-handling foundation (`AppError` hierarchy + `Result` type).
  * Minimal, zero-dependency CLI entry-point foundation.
  * A path-containment security primitive.
* Full build, lint, format, typecheck, and test pipeline.
* This documentation set (README / ARCHITECTURE / SPECIFICATION / TASKS / DECISIONS).

## 3. What This Phase Is Not

Phase 1 does **not** implement (see SPECIFICATION §9 for the full list):

* Agent loops, autonomous planning, or any LLM/model interaction.
* Memory systems, multi-agent systems, or model routing.
* Tool orchestration, codebase intelligence, or web research.
* Autonomous coding, Git operations, filesystem tools, or terminal tools.

---

## 4. Documentation Index

| Document | Purpose |
| --- | --- |
| `README.md` | This file — phase overview and topic index. |
| `ARCHITECTURE.md` | Architecture, module design, and phase boundaries. |
| `SPECIFICATION.md` | Precise requirements, contracts, and acceptance criteria. |
| `TASKS.md` | Milestone-based implementation task breakdown. |
| `DECISIONS.md` | Recorded engineering decisions, including the technology evaluation. |

---

## 5. Required Topic Coverage (Request Index)

The 21 planning topics requested for Phase 1 and where each is addressed:

| # | Topic | Primary location(s) |
| --- | --- | --- |
| 1 | Recommended language and runtime | DECISIONS §D1, ARCHITECTURE §3 |
| 2 | Package/dependency management | DECISIONS §D2, D12, ARCHITECTURE §4, §8 |
| 3 | Initial project structure | ARCHITECTURE §4, README §7 |
| 4 | Source structure | ARCHITECTURE §5 |
| 5 | Test structure | ARCHITECTURE §6, SPECIFICATION §8 |
| 6 | Configuration strategy | SPECIFICATION §3, DECISIONS §D4 |
| 7 | Env variable and secret handling | SPECIFICATION §4, DECISIONS §D5 |
| 8 | Logging foundation | SPECIFICATION §5, DECISIONS §D6 |
| 9 | Error-handling foundation | SPECIFICATION §6, DECISIONS §D7 |
| 10 | Development scripts | ARCHITECTURE §7 |
| 11 | Formatting and linting | DECISIONS §D9, ARCHITECTURE §7 |
| 12 | Testing framework | DECISIONS §D8 |
| 13 | TypeScript/compiler configuration | DECISIONS §D10, SPECIFICATION §7 |
| 14 | CLI/application entry-point strategy | SPECIFICATION §2, DECISIONS §D11 |
| 15 | Dependency philosophy | DECISIONS §D12, ARCHITECTURE §8 |
| 16 | Security considerations | ARCHITECTURE §9, SPECIFICATION §4 |
| 17 | Developer experience | ARCHITECTURE §10 |
| 18 | Phase 1 boundaries | ARCHITECTURE §11, SPECIFICATION §9 |
| 19 | What Phase 1 must NOT implement | SPECIFICATION §9 |
| 20 | How Phase 1 will be tested | SPECIFICATION §8, TASKS |
| 21 | How Phase 1 will be considered complete | SPECIFICATION §10, TASKS → M8 + Completeness Checks |

---

## 6. Phase Independence

Phase 1 follows BLUEPRINT §10. It is independently:

* **Understood** — complete, self-contained documentation.
* **Tested** — its own test suite under `tests/`.
* **Replaceable** — future phases depend on Phase 1's **public contract**
  (SPECIFICATION §2 and `src/index.ts`), never its internal files.

Per BLUEPRINT §7.4, later phases may communicate with Phase 1 only through its
defined interfaces. Internal implementation details are private.

---

## 7. Repository Layout (Phase 1 scope)

```text
phase-01-foundation/
├── README.md
├── ARCHITECTURE.md
├── SPECIFICATION.md
├── TASKS.md
├── DECISIONS.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.build.json
├── eslint.config.js
├── prettier.config.mjs
├── vitest.config.ts
├── .gitignore
├── .editorconfig
├── .node-version
├── .env.example
├── src/
│   ├── index.ts
│   ├── version.ts
│   ├── cli/
│   ├── config/
│   ├── env/
│   ├── logging/
│   ├── errors/
│   ├── result/
│   └── paths/
├── tests/
└── examples/
```

`bin` (`package.json`) → `dist/cli/main.js`; no source-level `bin/` directory.

`../.github/workflows/ci.yml` (repository root) runs the Phase 1 pipeline
(install → typecheck → lint → format:check → test:coverage → build → audit).

See ARCHITECTURE §4–§5 for details and rationale.

---

## 8. Quick Start

The standard contributor workflow:

```text
npm install
npm run check        # typecheck + lint + format-check + test (single gate)
npm run build
npm run demo         # run examples against src/ via tsx
node dist/cli/main.js --help
```

Exact scripts are defined in ARCHITECTURE §7 and TASKS.md.

---

## 9. How to Review This Phase

1. Read `BLUEPRINT.md` (§7, §9, §10, §11) to refresh the phase contract.
2. Read `DECISIONS.md` first (motivations), then `ARCHITECTURE.md` (shape),
   then `SPECIFICATION.md` (contracts), then `TASKS.md` (work).
3. Verify the consistency checklist under TASKS → Completeness Checks.

---

## 10. License

Licensed under the Apache License, Version 2.0. See `../LICENSE`.
