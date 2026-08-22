# ISSU — Phase 3: Integration — Specification

**Phase:** 3 — Integration
**Status:** DEFINED AT P0 — planning documents only; no implementation
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative dependencies:** `../phase-01-foundation/SPECIFICATION.md` (frozen) · `../phase-02/SPECIFICATION.md` (frozen)
**License:** Apache License 2.0

---

## 1. Scope

Phase 3 integrates the frozen Phase 1 Foundation (`@issue/foundation`) and the
frozen Phase 2 ToolRuntime (`@issue/tool-runtime`) through their public package
barrels, executes the BLUEPRINT §25 integration process, validates the combined
system, and prepares (not publishes) a first-release artifact.

### 1.1 Phase 3 is an integration/verification phase

**[NORMATIVE]** Phase 3 SHALL add no capability to either frozen phase. It SHALL
NOT modify Phase 1 or Phase 2 source, tests, specifications, package
configuration, or CI. It SHALL consume both phases only through their public
barrels. (BLUEPRINT §7.4, §10; Phase 1 `SPECIFICATION.md` §2 / `ARCHITECTURE.md`
§11; Phase 2 §18.2)

### 1.2 Authority

**[NORMATIVE]** This phase is governed by BLUEPRINT §25 (integration process),
supported by BLUEPRINT §§7.4 (interface-based integration), 9 (phase
architecture), 10 (phase independence), and 11 (lifecycle). (BLUEPRINT)

**[INTERPRETATION]** Phase 3 is the "later integration phase" referenced by
Phase 2 `SPECIFICATION.md` §22.1 as the deferred home for the CLI entry point.
The owner has authorized Phase 3 as the integration phase while keeping §22.1
itself deferred (see §6).

---

## 2. Integration Boundaries

**[NORMATIVE]**

* Phase 1 SHALL be consumed only via `import { ... } from "@issue/foundation"`.
  Deep imports (`@issue/foundation/dist/...`, internal module paths) SHALL NOT
  be used. (Phase 1 frozen contract; BLUEPRINT §10)
* Phase 2 SHALL be consumed only via `import { ... } from "@issue/tool-runtime"`.
  Deep imports (`@issue/tool-runtime/src/...`, internal module paths) SHALL NOT
  be used. (Phase 2 frozen §17.1/§17.3; BLUEPRINT §10)
* Phase 3 SHALL NOT import Phase 1 or Phase 2 `tests/`, `examples/`, or
  toolchain configuration. (Phase 1 `SPECIFICATION.md` §2 / `ARCHITECTURE.md`
  §11; Phase 2 §18.2)
* No modification of either frozen phase is permitted at any Phase 3 milestone.
  (BLUEPRINT §7.4, §10)

---

## 3. Phase 2 Contract (inherited, frozen)

**[NORMATIVE]** Phase 3 SHALL treat the following as frozen and unchangeable
(Phase 2 `SPECIFICATION.md` §17, §20.2):

* The public surface is **exactly 20 types/interfaces + 3 functions**
  (`runTask`, `createToolRuntime`, `deriveAvailableActions`).
* The nine-state machine (§5.1), the 18 legal transitions (§5.2), the
  `OutcomeClass` set (§13.2), the correction ordering `RETRY → ADVANCE →
  EXHAUST` (§6.2), the resource bounds (§12), `D-BOUNDS`, and the Phase 2
  `SPECIFICATION.md` itself are frozen.

Phase 3 consumes these through the barrel and SHALL NOT redefine, extend, or
weaken them.

---

## 4. Phase 3 Scope

**[NORMATIVE]** Phase 3 SHALL perform, in order, the BLUEPRINT §25 steps:

1. **Interface inventory** — document the complete frozen public surfaces of
   Phase 1 (§2) and Phase 2 (§17.2) and map how Phase 3 will consume each
   symbol.
2. **Adapter design** — where a connection between the two contracts requires
   adaptation (e.g., supplying a `DecisionProvider`, wiring Phase 1
   `Logger`/`Result` data into Phase 2 usage), design and record the adapter
   contracts.
3. **Connection harness** — a Phase 3 module that drives `@issue/tool-runtime`
   using `@issue/foundation` primitives, honoring the §16 deterministic
   validation semantics.
4. **Integration tests** — tests exercising the connected components together.
5. **End-to-end tests** — tests running complete tasks through the harness.
6. **Conflict identification** — audit for architectural conflicts between the
   two phases' contracts and Phase 3's use of them.
7. **Conflict resolution (Phase 3 layer only)** — resolve any conflicts within
   Phase 3's own integration layer, never by changing a frozen phase.
8. **Validation** — validate the combined system against the Phase 1 and Phase 2
   contracts and the Phase 3 specification.
9. **First-release artifact preparation** — build and validate a release
   artifact. Publishing SHALL NOT occur.

**[NORMATIVE]** Deterministic provider stubs SHALL be used wherever a
`DecisionProvider` is required. No model, provider, or model SDK SHALL be
involved. (Phase 2 §19.1, §22.4; BLUEPRINT §18)

---

## 5. Explicitly Prohibited (Phase 3 SHALL NOT)

**[NORMATIVE]** Phase 3 SHALL NOT implement, depend upon, or introduce:

1. CLI / end-user entry point (Phase 2 §22.1 — deferred).
2. Configuration-file schema (Phase 2 §22.2 — deferred).
3. Write/edit/delete or any filesystem mutation (Phase 2 §19.3).
4. Process / child-process execution (Phase 2 §19.4).
5. Git / VCS operations (Phase 2 §19.5).
6. Network / web / browser access (Phase 2 §19.6).
7. Model-provider binding (Phase 2 §22.4 — deferred).
8. Workspace / monorepo migration (Phase 2 §22.5 — deferred; D3 `file:` deps
   remain the mechanism).
9. Memory subsystem or cross-run persistence (Phase 2 §19.2).
10. Multi-agent systems or agent roles (Phase 2 §19.10).
11. Generalized planning engine (Phase 2 §19.9).
12. Plugin framework / dynamic module loading (Phase 2 §19.8).
13. Code generation / modification (Phase 2 §19.7).
14. Performance benchmarking infrastructure (Phase 2 §19.15).
15. Publishing / distribution (Phase 2 §19.12; `private: true` preserved).

*Any Phase 3 implementation that violates this section fails the phase review.*

---

## 6. Deferred Decisions

**[DEFERRED]** The following SHALL remain deferred during Phase 3 and SHALL NOT
be resolved without separate owner authorization:

* §22.1 CLI / end-user entry point.
* §22.2 Phase 3 configuration-file schema.
* §22.3 Write/execute/Git/network tooling.
* §22.4 Model-provider binding.
* §22.5 Workspace/monorepo adoption.

**[NORMATIVE]** These items remain deferred from the frozen Phase 2
specification and are carried forward unchanged. Resolving any of them requires
an explicit owner authorization and a Phase 3 `DECISIONS.md` entry.

---

## 7. Non-Goals and Future Extension Points

**[NON-GOAL]** As a consequence of §5, Phase 3 has **no** CLI, no model binding,
no write/execute/Git/network capability, no memory, no multi-agent behavior, and
no planning engine.

**[EXTENSION]** The following are reserved for later phases and are **not**
Phase 3 architecture:

* A CLI / end-user entry point (Phase 2 §22.1).
* Write/execute/Git/network tooling (Phase 2 §22.3).
* A model/provider binding behind the `DecisionProvider` seam (Phase 2 §22.4).
* Workspace/monorepo adoption (Phase 2 §22.5).

Documenting these as extension points does not decide, authorize, or schedule
them.

---

## 8. Acceptance Criteria (phase-level)

**[NORMATIVE]** Phase 3 is accepted only when:

1. Every BLUEPRINT §25 step (1–9) is evidenced by a deliverable or record.
2. Phase 1 and Phase 2 are consumed through their public barrels only; zero
   deep/internal imports.
3. Frozen Phase 1 and Phase 2 files are byte-unchanged.
4. No §19 / §5 prohibited capability is introduced.
5. All quality gates pass (`npm run check`, `npm run test:coverage` ≥ 80%,
   `npm run build`, `npm audit --audit-level=high`, `git diff --check`).
6. Integration and end-to-end tests pass.
7. The first-release artifact is built and validated; publishing is explicitly
   excluded.

---

## 9. Consistency

**[NORMATIVE]** Phase 3 SHALL NOT contradict BLUEPRINT.md, the frozen Phase 1
specification, or the frozen Phase 2 specification. Where any Phase 3 document
conflicts with a frozen contract, the frozen contract SHALL prevail.
