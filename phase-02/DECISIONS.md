# ISSU — Phase 2: Engineering Decisions

**Phase:** 2 — ToolRuntime (deterministic read-only filesystem task execution)
**Status:** SIGNED OFF at P6 (2026-08-10) — decision record initiated at P0 with D1; full draft authored and accepted at P6
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative specification:** `./SPECIFICATION.md`

This file records the engineering decisions for Phase 2. Per BLUEPRINT §7.11
(Learn While Building) and §30 (major architectural decisions are documented),
every non-obvious choice includes context, rationale, alternatives considered,
and consequences. Decision IDs are stable references used across the other
Phase 2 documents.

At P0 this record contained only the decisions made and authorized at P0. The
full decision set was drafted at P6, when the implementation exists to document
(SPECIFICATION §22.6). This record SHALL NOT contradict `SPECIFICATION.md`,
which remains the authoritative Phase 2 specification.

---

## D1 — Phase 2 Package Name

* **Decision:** Phase 2's package name is `@issue/tool-runtime`.
* **Owner authorization (2026-08-09):** explicitly authorized by the Project
  Owner in response to the P0 Re-Acceptance Audit (blocking finding K). This
  resolves the sole blocking issue from that audit.
* **Context/Rationale:** the name follows the accepted Phase 2 naming convention
  `@issue/<phase-2-name>` (README §3) and reflects the frozen ToolRuntime
  architecture (SPECIFICATION §3.2, §9). It was selected during specification
  formalization (SPECIFICATION §20.1, README §3, TASKS P1-1) and is now
  owner-approved; it does not change the architecture, the state machine, the
  DecisionProvider boundary, ToolRuntime semantics, or D3.
* **Alternatives:** keeping the placeholder `@issue/<phase-2-name>` and deciding
  the final name at P1 (rejected: the authoritative specification requires a
  concrete package identity, and an unresolved name would block P1-1); other
  candidate names consistent with the architecture (rejected in favor of the
  architecture-derived term).
* **Consequences:** SPECIFICATION §20.1, README §3, and TASKS P1-1 reference
  `@issue/tool-runtime`; the name is fixed for the phase. Any future change is a
  package-identity change, not an architectural change, and SHALL require a new
  DECISIONS entry.

---

## D-BOUNDS — Phase 2 Default Resource Bounds

* **Decision:** Phase 2's default resource-bound values are recorded as:

  ```ts
  maxRetries: 2,
  maxCorrections: 5,
  maxVerifications: 10,
  maxBytesPerRead: 1024 * 1024, // 1 MiB
  chunkSize: 4096,
  ```

* **Status:** Documented at P6 (2026-08-10) as the Phase 2 implementation-time
  choice required by SPECIFICATION §22.7. **Signed off with the P6 milestone
  (2026-08-10).** The values were fixed during P4 implementation and are the
  defaults used by the Phase 2 test suite (`tests/helpers.ts` →
  `DEFAULT_BOUNDS`). **SPECIFICATION §12 semantics are unchanged.**
* **Context/Rationale:** SPECIFICATION §22.7 delegates the concrete default
  values to a Phase 2 implementation-time decision that "SHALL be documented in
  Phase 2's DECISIONS.md"; the semantics in §12 SHALL NOT change. The values
  reflect modest, read-only workloads: at most 2 retries per action, 5
  corrections and 10 verifications per run, 1 MiB maximum per read, and a 4 KiB
  read chunk. `TaskOptions.bounds` remains a required field (§17.2); callers may
  supply any finite positive bounds (§12), and these values are the documented
  defaults a caller MAY use.
* **Alternatives:** different magnitudes for the counters or the byte caps
  (rejected: the recorded values are the existing implementation choice and are
  adequate for the deterministic read-only scope; changing them would be a
  decision change with no §22.7 mandate); making `bounds` optional with implicit
  defaulting in `runTask` (rejected: §17.2 defines `bounds` as required and no
  production defaulting was implemented).
* **Consequences:** the concrete numbers are non-normative implementation
  choices (ARCHITECTURE §11); changing them does not require a spec change but
  SHALL be recorded as a decision update. §12 semantics (finite, positive,
  deterministic enforcement, `chunkSize ≤ maxBytesPerRead`) are frozen.

---

## Decision Log

| ID | Decision | Status |
| --- | --- | --- |
| D1 | Phase 2 package name: `@issue/tool-runtime` | Approved (2026-08-09) |
| D-BOUNDS | Phase 2 default resource-bound values (2 / 5 / 10 / 1 MiB / 4096) | Documented; signed off with P6 (2026-08-10) |

Status becomes **Approved** at P0-3 (plan approval) and **Frozen** at phase
freeze. Later phases may propose new decisions; changing a frozen decision
requires a documented revisit.

---

## Deferred Items Reviewed at P6 (informational — NOT decisions)

The following SPECIFICATION §22 items were reviewed at P6 and **remain
deferred**; none is resolved by Phase 2:

1. CLI / end-user entry point (§22.1).
2. Phase 2 configuration-file schema (§22.2).
3. Write / execute / Git / network tooling (§22.3).
4. Model/provider binding (§22.4).
5. Workspace / monorepo adoption (§22.5).

These are documented as non-goals and future extension points in
`ARCHITECTURE.md` (§18, §19) without being decided. Resolving any of them SHALL
require explicit owner authorization and a new DECISIONS entry. No implementation
detail (logger library, redaction token, module layout, transition reason
strings, test mechanics) is treated as a decision, and no such decision entry is
created here.

---

**P0-3 approval record (2026-08-09):** D1 is formally **Approved** via the
Phase 2 plan approval (TASKS.md → P0 sign-off record).
