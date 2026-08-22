# ISSU — Phase 3: Integration — Engineering Decisions

**Phase:** 3 — Integration
**Status:** APPROVED at P0 (2026-08-10) — full Phase 3 decision record reconciled
through P6 (2026-08-12); decisions remain **Approved** until **Frozen** at the
Phase 3 phase freeze (P7)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative specification:** `./SPECIFICATION.md`
**License:** Apache License 2.0

This file records the engineering decisions for Phase 3. Per BLUEPRINT §7.11
(Learn While Building) and §30 (major architectural decisions are documented),
every non-obvious choice includes context, rationale, alternatives, and
consequences. Decision IDs are stable references used across the Phase 3
documents.

At P0 this record contained only the decisions authorized at P0. Through P6
the record reflects the full Phase 3 decision state, consistent with the
Phase 2 precedent that the decision set is finalized when the implementation
exists to document it; decisions retain **Approved** status until **Frozen** at
the Phase 3 phase freeze (P7). This record
SHALL NOT contradict the frozen Phase 1 or Phase 2 specifications, which remain
authoritative for their respective phases.

---

## D3.1 — Phase 3 Identity (Name / Number / Package / Folder)

* **Decision:** The next development phase is **Phase 3 — Integration**, located
  in `phase-03/`, with package name `@issue/integration`.
* **Owner authorization (2026-08-10):** explicitly authorized by the Project
  Owner following the Phase 2 freeze and the blueprint recovery audit.
* **Context/Rationale:** BLUEPRINT §25 describes the integration stage that
  follows component stability; Phase 1 and Phase 2 are both frozen and signed
  off. Phase 2 `SPECIFICATION.md` §22.1 references "a later integration phase"
  as the deferred home for the CLI — confirming an integration phase is the
  intended successor. The name `@issue/integration` follows the established
  `@issue/<phase-name>` convention (Phase 1 DECISIONS §D2; Phase 2 DECISIONS
  §D1).
* **Alternatives:** a Phase 3 named after a specific capability (rejected: the
  blueprint's next stage is integration, not a new feature); a workspace/monorepo
  phase (rejected: §22.5 remains deferred); no phase (rejected: BLUEPRINT §25
  mandates the integration stage).
* **Consequences:** Phase 3 consumes Phase 1 and Phase 2 through their public
  barrels only; both phases remain frozen and MUST NOT be modified. Publishing
  remains unauthorized; Phase 3 may only prepare and validate a release
  artifact. The name is fixed for the phase; any change requires a new DECISIONS
  entry.

---

## D3.2 — §22.1–§22.5 Remain Deferred During Phase 3

* **Decision:** The Phase 2 `SPECIFICATION.md` §22 deferred items are carried
  forward unchanged. Phase 3 SHALL NOT resolve any of them.
* **Owner authorization (2026-08-10):** the owner explicitly directed that
  §22.1 (CLI), §22.2 (config schema), §22.3 (write/execute/Git/network),
  §22.4 (model-provider binding), and §22.5 (workspace/monorepo) remain
  deferred. In particular, the CLI SHALL NOT be implemented, resolved, or bound
  in Phase 3 unless separately authorized later.
* **Context/Rationale:** Phase 3 is an integration/verification phase. Resolving
  a deferred decision would expand its scope beyond BLUEPRINT §25 and would
  violate the Phase 2 frozen contract (Phase 2 §22: "SHALL NOT be resolved by
  Phase 2"; carried forward).
* **Alternatives:** resolving the CLI inside Phase 3 (rejected: owner-directed
  deferral); resolving the config schema (rejected: §22.2 remains deferred).
* **Consequences:** No deferred decision is resolved during Phase 3. Any future
  resolution requires explicit owner authorization and a new DECISIONS entry.

---

## Decision Log

| ID | Decision | Status |
| --- | --- | --- |
| D3.1 | Phase 3 identity: Phase 3 — Integration, `phase-03/`, package `@issue/integration` | Approved (2026-08-10) |
| D3.2 | §22.1–§22.5 remain deferred during Phase 3 | Approved (2026-08-10) |

### P6 reconciliation note (2026-08-12)

The P6-1 documentation reconciliation recorded **no new decision entry**: no
genuinely non-obvious implementation-time decision was found that was not
already covered by the frozen contracts or by the existing decisions. In
particular, Phase 3 `DEFAULT_BOUNDS` mirror the frozen Phase 2 **D-BOUNDS**
semantics (`phase-02/DECISIONS.md`), so no new decision was created for them;
and the Phase 3 public API shape (`runIntegrationTask`, `translateToolError`,
`isFailedToolResult`, `createDeterministicProviderStub`, `DEFAULT_BOUNDS`) was
predetermined and owner-authorized at P3-2/P4 (`ARCHITECTURE.md` §§28–31). No
deferred §22 item (§22.1–§22.5, D3.2) has been resolved. An independent audit
of this reconciliation remains a separate step before P6-1 owner acceptance.

Status becomes **Approved** at plan approval and **Frozen** at phase freeze.
Later phases may propose new decisions; changing a frozen decision requires a
documented revisit.
