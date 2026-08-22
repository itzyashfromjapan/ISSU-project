# ISSU — Phase 3: Integration

**Phase:** 3 — Integration
**Status:** FROZEN — Phase 3 completed and accepted at P7 (2026-08-12). All
P7-1/P7-2/P7-3/P7-4 milestones ACCEPTED/CLOSED. The first-release artifact was
built and validated (`npm run build` → `dist/`); publishing was explicitly
excluded. **Phase 3 is FROZEN.**
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**License:** Apache License 2.0

---

## 1. Purpose

Phase 3 connects the two frozen, stable components — **Phase 1 Foundation**
(`@issue/foundation`) and **Phase 2 ToolRuntime** (`@issue/tool-runtime`) —
through their public package barrels only, and validates the combined system.
It executes the nine-step integration process defined by **BLUEPRINT §25**:

1. Identify completed phase interfaces.
2. Build adapters where necessary.
3. Connect modules.
4. Run integration tests.
5. Run end-to-end tests.
6. Identify architectural conflicts.
7. Refactor where necessary.
8. Validate the complete system.
9. Prepare the first complete release.

Phase 3 is an **integration/verification phase**, not a feature-building phase.
It adds no capability to either frozen phase.

## 2. What Phase 3 Is and Is Not

**In scope:**

* Interface inventory of the two frozen public surfaces (Phase 1 §2; Phase 2 §17.2).
* Adapter design and implementation where a connection between the two contracts
  is needed.
* A connection harness that drives `@issue/tool-runtime` through
  `@issue/foundation` primitives.
* Deterministic provider stubs (never a real model) used by the harness and tests.
* Integration tests and end-to-end tests (§25 steps 4–5).
* Conflict identification, resolution **only within Phase 3's own integration
  layer**, and validation (§25 steps 6–8).
* First-release artifact preparation — **built and validated, not published**
  (§25 step 9).

**Explicitly not in scope (prohibited):**

* CLI implementation/resolution (§22.1 remains deferred).
* Configuration schema (§22.2 remains deferred).
* Write/edit/delete, process execution, Git tooling, network tooling (§22.3
  remains deferred).
* Model-provider binding (§22.4 remains deferred).
* Workspace/monorepo migration (§22.5 remains deferred).
* Memory, multi-agent systems, generalized planning, plugins, code generation,
  benchmarking, publishing.

**Implemented (through P5, 2026-08-12):**

* **P4-1** — the AD-1 translation adapter (`translateToolError`,
  `isFailedToolResult`), the connection harness (`runIntegrationTask`), the
  deterministic provider stub (`createDeterministicProviderStub`), and
  `DEFAULT_BOUNDS`, all exported through the Phase 3 public barrel (exactly five
  public values plus their supporting types), implemented in `src/`.
* **P5-1 / P5-2** — integration and end-to-end test suites under `tests/`:
  10 files (the shared fixture helper plus nine suites) exercising the connected
  components and the frozen Phase 2 §16 V1–V18 outcomes; both suites are
  ACCEPTED/CLOSED and P5 was formally CLOSED by owner sign-off.
* **Not yet done:** P7 (conflict identification/resolution, combined-system
  validation, first-release artifact, phase acceptance) and any FROZEN claim.

## 3. Integration Boundaries

* Phase 1 is consumed **only** through the `@issue/foundation` public barrel.
* Phase 2 is consumed **only** through the `@issue/tool-runtime` public barrel.
* No deep imports (`@issue/foundation/dist/...`, `@issue/tool-runtime/src/...`,
  or internal module paths) are permitted.
* Neither frozen phase may be modified: no changes to Phase 1 or Phase 2 source,
  tests, specifications, or configuration.

## 4. Phase 2 Contract (frozen, inherited)

* The §17.2 surface remains exactly **20 public types + 3 public functions**
  (`runTask`, `createToolRuntime`, `deriveAvailableActions`).
* The Phase 2 nine-state machine, its 18 legal transitions, the `OutcomeClass`
  set, the correction ordering (`RETRY → ADVANCE → EXHAUST`), the resource
  bounds, `D-BOUNDS`, and `SPECIFICATION.md` all remain frozen.

## 5. Documentation Index

| Document | Purpose |
| --- | --- |
| `README.md` | This file — phase overview, scope, integration record. |
| `SPECIFICATION.md` | Authoritative Phase 3 specification (normative; sole normative authority for Phase 3). |
| `ARCHITECTURE.md` | Phase 3 architecture — descriptive companion, never overrides the specification. |
| `DECISIONS.md` | Phase 3 decision record. |
| `TASKS.md` | Phase 3 milestones and acceptance criteria (P0–P7). |

## 6. How to Review This Phase

1. Read `../BLUEPRINT.md` §§7.4, 9, 10, 11, 25.
2. Read `phase-01-foundation/README.md` + `phase-01-foundation/SPECIFICATION.md` §2 (frozen surface).
3. Read `phase-02/README.md` + `phase-02/SPECIFICATION.md` §17 (frozen surface).
4. Read `phase-03/TASKS.md` — the milestone plan.

## 7. License

Licensed under the Apache License, Version 2.0. See `../LICENSE`.
