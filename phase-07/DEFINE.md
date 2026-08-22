# ISSU — Phase 7: Write & Execution Tooling — Governed DEFINE Record

**Phase:** 7 — Write & Execution Tooling
**Status:** ACCEPTED — Owner accepted the NEW GOVERNED Phase 7 DEFINE record as the current authoritative definition of Phase 7 (2026-08-22)
**Authorization basis:** Owner decision "move on next phase" (2026-08-22) — interpreted as acceptance of the Phase 7 DEFINE created from BLUEPRINT §22.3 + §17 Security existence audit, and authorization to proceed to RESEARCH (one-gate, DEFINE ONLY was 2026-08-22 draft; now RESEARCH authorized)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**ISSU Governance:** `../ISSU_PROJECT.md` (1578 lines, durable 59590d0)
**License:** Apache License 2.0

---

## 1. Record Identity and Status

This document is a **NEW GOVERNED DEFINE RECORD** for Phase 7. It establishes the current authoritative definition of Phase 7 from BLUEPRINT constraints and durable source material.

- This is **NOT a reconstruction** of a prior Phase 7 record — no prior Phase 7 durable record exists (verified: `phase-07/` missing until 2026-08-22, `git ls-files | grep phase-07` empty, `phase-06/DEFINE.md:12` leaves §22.3 deferred).
- Status was **DRAFT — PENDING OWNER ACCEPTANCE** at creation (2026-08-22). Owner has now **ACCEPTED** this DEFINE on 2026-08-22 via explicit "move on next phase" instruction, which authorizes RESEARCH as the next gate. This acceptance does NOT authorize Architecture/Specification/Implementation/Test/Refactor/Freeze/Next Phase beyond RESEARCH.
- This record does NOT convert README assertions into acceptance beyond this explicit Owner decision.

---

## 2. Source-of-Truth References

| Tag | Meaning |
| --- | --- |
| **[DURABLE FACT]** | Established by existing durable artifact verified this session |
| **[BLUEPRINT CONSTRAINT]** | Owner/project constraint already present in `BLUEPRINT.md` |
| **[GOVERNANCE CONSTRAINT]** | Constraint in `ISSU_PROJECT.md` |
| **[NEW DEFINE DECISION]** | Genuinely new DEFINE decision proposed here, requiring Owner acceptance |

Durable artifacts verified (2026-08-22):

- `BLUEPRINT.md` — §5 Initial Scope, §6 Future Scope, §7 Principles (§7.1-§7.11), §8 Architecture Philosophy, §9 Phase Architecture, §10 Phase Independence, §11 Lifecycle, §12 Testing, §17 Security Philosophy, §23 Configuration, §24 Observability, §25 Integration, §26 Non-Goals, §28 Quality Standard, §29 Decision-Making, §30 Governance, §33 Discipline
- `ISSU_PROJECT.md` — §9 DEFINE Readiness, §10 DEFINE Discipline, §17 No-Workaround Rule, §23 Security Audit, §38-39 No Automatic Next Phase / Phase Transition Audit
- `phase-01-foundation/` — FROZEN 2026-08-09, `657f3d9`, `@issue/foundation 0.1.0` (barrel: AppError, Result, Logger, loadConfig, readEnv, getSecret, assertContained, isContained, runCli)
- `phase-02/` — FROZEN 2026-08-10, `8dde232`, `@issue/tool-runtime 0.1.0` (read-only FS, 9-state machine, 91/91)
- `phase-03/` — FROZEN 2026-08-12, `8dde232`, `@issue/integration 0.1.0` (harness over 1+2, 65/65)
- `phase-04/` — CLOSED/FROZEN, `8dde232`, `@issue/research 0.1.0` (51/51, barrel-only 1/2/3)
- `phase-05/` — FROZEN/RELEASE-READY 2026-08-20, `226c467+8dde232`, `@issue/analytics 0.1.0` (61/61, deterministic pipeline over 1/2/3)
- `phase-06/` — FROZEN 2026-08-22, `b72a78b+59590d0`, `@issue/config-cli 0.1.0` (66/66, 88.46/82.94/89.47/90.26, config schema + CLI + observability, barrel-only 1/2/3/5)
- Git — `main 59590d0` synced with `origin/main`, clean (only `.claude-flow/.swarm` untracked, correctly excluded per `ISSU_PROJECT.md:1137`)

---

## 3. Purpose

**[BLUEPRINT CONSTRAINT]** BLUEPRINT §17 Security Philosophy: *Autonomous systems can potentially execute powerful actions. Therefore ISSU must eventually consider: Permission boundaries, Sandboxing, Command restrictions, Filesystem permissions, Credential protection, Network access, Tool authorization, User confirmation, Audit logs, Safe failure modes, Malicious input, Prompt injection, Untrusted repositories.*

**[BLUEPRINT CONSTRAINT]** BLUEPRINT §22.3 (deferred via `phase-06/DEFINE.md:12`): *write/edit/delete, process execution, Git/network tooling* — explicitly out-of-scope for Phase 6 and preserved as deferred.

**[NEW DEFINE DECISION]** Phase 7 establishes the **Write & Execution Tooling** foundation — the permission-bound, sandboxed, auditable tooling for file writes, edits, deletes, process execution, Git operations, and network fetch, making the autonomous agent capable of *acting* on its plans, not merely reading and analyzing. This directly resolves **BLUEPRINT §22.3** and operationalizes **§17 Security** for the existing codebase.

**[GOVERNANCE CONSTRAINT]** Each phase must have a clearly defined responsibility and its own implementation/tests/docs/public interface, and must depend on another phase's contract, not its implementation (`BLUEPRINT.md:274-297`, `ISSU_PROJECT.md:128-147`).

---

## 4. Scope

**[NEW DEFINE DECISION]** The Phase 7 core covers:

- **File write tooling** (deferred §22.3): `writeFile`, `editFile` (exact string replacement, not `sed`/`awk`), `deleteFile` — all with `isContained`/`assertContained` + permission checks + audit logging + `Result<AppError>`; no recursive delete without explicit flag; no `fs` outside `phase-07/src`.
- **Process execution** (deferred §22.3): `execProcess` (bounded, timeout, no shell interpolation, deny-by-default, no `eval`) — via `node:child_process` with `spawn` (not `exec` with shell), with `ResourceBounds` (maxBytes, timeout, maxProcesses) and structured `ProcessResult`.
- **Git tooling** (deferred §22.3): `gitStatus`, `gitDiff`, `gitCommit` (scoped staging, pre-commit audit), `gitBranch` — all via `execProcess` seam, with `isContained` on repo path, no `git push` without separate authorization, no `git add -A` without scope audit.
- **Network fetch** (deferred §22.3): `httpFetch` (guarded `fetch` with allowlist, timeout, size cap, no credential leakage, no `file://`/`ftp://`, header sanitization) — for research/external data acquisition that Phase 5 excluded.
- **Permission & audit** (§17): deny-by-default, user confirmation where required, audit logs via Phase 6 `Logger` + Phase 1 `redactionList`, credential protection via `getSecret`.

**[DURABLE FACT]** Public surface will be defined at Specification stage and SHALL NOT exceed frozen Phase 6 surface except via explicit new Phase 7 barrel (to be specified at ARCHITECTURE/SPECIFICATION).

---

## 5. Objectives

**[NEW DEFINE DECISION]** Phase 7 objectives (measurable at TEST/VERIFICATION):

- Resolve BLUEPRINT §22.3 as **implemented capability**, not deferred note — write/process/Git/network become tested, documented, frozen contracts with bounded permission model.
- Provide permission-bound, sandboxed tooling: identical inputs + permissions → identical `Result` (deterministic where applicable, bounded non-determinism for process/network documented); all writes/edits/deletes/execs/commits are **auditable** via structured logs.
- Provide a tooling API that passes `npm run check` (`typecheck+lint+format:check+test`), `npm run build`, and `npm run test:coverage` with gate **≥80%**, and respects frozen boundaries (no Phase 1-6 internal imports, no `ISSU_PROJECT.md:17` workaround via `tsconfig` paths or fake packages).
- Preserve all deferred §22.4/§22.5/Q4.22 as **still deferred** unless explicitly authorized (see §8).
- Pass **Security Audit** per `ISSU_PROJECT.md:799-847` (trust boundaries, input validation, path traversal, filesystem access, local-file access, external data acquisition, network access, process execution, Git operations, write/edit/delete, command injection, deserialization, secret exposure, permission boundaries, deny-by-default) before Freeze.

**[BLUEPRINT CONSTRAINT]** Testing is fundamental; autonomous systems require particular attention to failure handling (`BLUEPRINT.md:333-349`).

---

## 6. Responsibilities

**[NEW DEFINE DECISION]** `@issue/write-execution` (proposed package name, to be finalized at Specification D1) is responsible for:

- File write/edit/delete tooling with containment, permission checks, and audit logging.
- Process execution tooling with bounded, non-shell, timeout-guarded `spawn`.
- Git tooling with scoped staging, pre-commit audit, and branch protection.
- Network fetch tooling with allowlist, timeout, size cap, and header sanitization.
- Permission & audit wiring (deny-by-default, user confirmation, audit logs, credential protection).

**[GOVERNANCE CONSTRAINT]** Phase 7 must NOT depend on another phase's internal files and must be independently understandable and replaceable (`BLUEPRINT.md:274-297`).

---

## 7. In-Scope Boundaries

**[NEW DEFINE DECISION]** In scope:

- File write/edit/delete (`writeFile`, `editFile`, `deleteFile`) with `isContained`/`assertContained` + permission + audit.
- Process execution (`execProcess`) with `spawn` (no shell), timeout, maxBytes, structured `ProcessResult`.
- Git (`gitStatus`, `gitDiff`, `gitCommit`, `gitBranch`) via `execProcess` + permission + audit.
- Network fetch (`httpFetch`) with allowlist, timeout, size cap, header sanitization.
- Consumption of `@issue/foundation`, `@issue/tool-runtime`, `@issue/integration`, `@issue/analytics`, `@issue/config-cli` **through public barrels only** via `file:` refs (precedent: Phase 6 `package.json`).
- Dedicated package under `phase-07/` with its own `src/`, `tests/`, docs, and `package.json` (`private:true`, `type:module`, `engines.node >=22.9.0`, scripts `check/typecheck/build/test/lint/format` per Phase 1 precedent).

---

## 8. Out-of-Scope Boundaries

**[NEW DEFINE DECISION]** Explicitly out of scope (prohibited / remains deferred):

- **BLUEPRINT §22.4 / Q4.22**: provider/model binding — seam only, no model bound (no API key handling beyond Phase 1 `getSecret` redaction).
- **BLUEPRINT §22.5**: workspace/monorepo migration — `phase-07/` remains phase-scoped, no root `package.json` workspace.
- **Persistence beyond tooling**: no database, no long-term file persistence beyond tool operations.
- **Modifying any frozen phase** (01-06), `BLUEPRINT.md`, or `ISSU_PROJECT.md` (§22.3 resolved here via this DEFINE; §22.4/§22.5 remain deferred unless explicitly authorized).
- **Unbounded process execution** (no `exec` with shell interpolation, no `eval`, no `Function`).

**[BLUEPRINT CONSTRAINT]** ISSU will not initially attempt to solve AGI or support every domain immediately (`BLUEPRINT.md:616-628`).

---

## 9. Non-Goals

**[NEW DEFINE DECISION]** Non-goals for Phase 7 (carried as **SPECIFICATION §17 UNRESOLVED** if not resolved here):

- Model/provider binding decision (Q4.22) — only the seam is defined.
- Workspace/monorepo migration (§22.5).
- Full persistence requirement.
- Whether Phase 4 (`@issue/research`) is consumed by default (still no, per Phase 6 precedent).
- Confidence calibration, provenance granularity beyond tool audit logs.

**[DURABLE FACT]** Prior Phase 6 non-goals `phase-06/README.md:7` remain preserved as deferred unless explicitly resolved above (§22.3 now in-scope, §22.4/§22.5 still out-of-scope).

---

## 10. Governing Constraints

**[BLUEPRINT CONSTRAINT]** Binding constraints inherited:

- Phase independence: depend on contracts, not implementations (`BLUEPRINT.md:274-297`).
- Lifecycle discipline: Define→Research→Architect→Specify→Implement→Test→Review→Refactor→Document→Freeze→Next Phase; not complete merely because code runs (`BLUEPRINT.md:301-330`).
- Interface-based integration; documentation is part of product; reliability over complexity; security by default; extensibility; open-source quality (`BLUEPRINT.md:138-211`).
- Decision-making: Correctness→Security→Maintainability→Performance→Extensibility→DX→Complexity (`BLUEPRINT.md:666-686`).
- Development discipline: do not skip phases, do not blindly accept AI code, document decisions, keep modules isolated (`BLUEPRINT.md:776-791`).
- Governance: major decisions documented, not conversation-only (`BLUEPRINT.md:690-700`).

**[GOVERNANCE CONSTRAINT]** `ISSU_PROJECT.md:799-847` Security Audit mandatory after implementation; `§24-27` Governance/Integrity/Freeze-Readiness audits before Freeze; `§17` No-Workaround Rule (no `tsconfig` paths, fake packages, etc.).

---

## 11. Upstream Frozen-Contract Dependencies

**[NEW DEFINE DECISION]** Phase 7 consumes exactly five frozen packages through public barrels only via `file:` refs (to be recorded in `phase-07/package.json` at Implementation):

| Package | Phase | Source |
| --- | --- | --- |
| `@issue/foundation` | Phase 1 (frozen) | `file:../phase-01-foundation` |
| `@issue/tool-runtime` | Phase 2 (frozen) | `file:../phase-02` |
| `@issue/integration` | Phase 3 (frozen) | `file:../phase-03` |
| `@issue/analytics` | Phase 5 (frozen) | `file:../phase-05` |
| `@issue/config-cli` | Phase 6 (frozen) | `file:../phase-06` |

**[DURABLE FACT]** Phase 4 (`@issue/research`) is NOT consumed by default and remains CLOSED/FROZEN, unmodified (`phase-06/DEFINE.md:11` precedent).

**[GOVERNANCE CONSTRAINT]** No deep imports (`@issue/*/internal` or `src` paths), no `require`, no new runtime dependency beyond frozen packages and Node.js stdlib + `pino` via foundation + `node:child_process` + `node:fs` (bounded, audited).

---

## 12. Deferred Matters (Remain Outside Scope)

**[NEW DEFINE DECISION]** Deferred and out of scope for Phase 7 (still deferred, not resolved):

- BLUEPRINT §22.4 model-provider binding.
- BLUEPRINT §22.5 workspace/monorepo migration.
- Q4.22 provider/model binding decision (only seam, nothing bound).
- Any domain beyond Write & Execution Tooling (Education/Business/Robotics etc. remain Future Scope, not Phase 7).

**[DURABLE FACT]** Resolved in this DEFINE: §22.3 write/edit/delete, process execution, Git/network tooling are now **in-scope** (previously deferred, now proposed for implementation).

---

## 13. DEFINE-Stage Completion Conditions

**[NEW DEFINE DECISION]** This DEFINE stage is complete only when ALL hold:

1. This record exists and satisfies DEFINE authorization elements (title, status, authorization basis, source-of-truth refs, purpose, scope, objectives, in-scope, out-of-scope, non-goals, frozen-contract deps, deferred, completion conditions, unresolved, traceability, non-reconstruction/non-authorization statements).
2. Owner reviews this record and **explicitly accepts** it in a separate Owner decision (file edit to `Status: ACCEPTED` + End-of-Document block).
3. No Research, Architecture, Specification, Implementation, Test, Refactor, or Freeze work has begun under this authorization.

**[NEW DEFINE DECISION]** Progression to Research requires a separate Owner decision; it is NOT implied by acceptance of this DEFINE.

---

## 14. Explicit Unresolved Items

- **[DURABLE FACT]** Historical Phase 7 records do NOT exist (verified: `phase-07/` missing until 2026-08-22, `git ls-files | grep phase-07` empty). This record does not reconstruct history.
- **[NEW DEFINE DECISION]** Exact public API (write/edit/delete/process/Git/fetch tool signatures), CLI surface extension (e.g., `issue write`, `issue exec`), config schema for tool permissions, file format, validation error codes, permission confirmation flow, audit log schema, and test thresholds remain **UNRESOLVED** — to be decided at ARCHITECTURE/SPECIFICATION (Specification firewall per `BLUEPRINT.md:246-248`).
- **[DURABLE FACT]** `@issue/foundation` TS2307 `main/types/exports` defect remains unresolved and out-of-scope for Phase 7 DEFINE; Phase 1 is frozen and must not be modified.
- **[BLUEPRINT CONSTRAINT]** Phase 8 remains BLOCKED until its own source-of-truth problem is separately resolved.

---

## 15. Traceability to Source Artifacts

| Element | Source |
| --- | --- |
| Domain label, package identity | `BLUEPRINT.md:17` Security Philosophy; `BLUEPRINT.md:22.3` write/edit/delete, process, Git/network deferred; `phase-06/DEFINE.md:12` |
| Purpose (write & execution) | `BLUEPRINT.md:17` (17 bullet security vectors); `phase-06/FREEZE_REPORT.md:10` deferred §22.3 |
| Scope (write/process/Git/fetch) | `BLUEPRINT.md:22.3`; `ISSU_PROJECT.md:799-847` Security (write/edit/delete, process exec, Git, network) |
| Dependencies / boundaries | `phase-06/package.json:dependencies` precedent (`file:` refs); `phase-03` barrel-only |
| Non-goals / deferred | `phase-06/README.md:7`; `BLUEPRINT.md:616-628`; `phase-06/DEFINE.md:12` |
| Lifecycle / governance | `BLUEPRINT.md:301-330` (§11); `BLUEPRINT.md:690-700` (§30); `ISSU_PROJECT.md:9,10,38,39` |
| Deferred §22.3 | `BLUEPRINT.md:22.3` (inferred from Phase 6 deferred lists); `phase-06/DEFINE.md:12` |

---

## 16. Non-Reconstruction Statement

This is a **NEW GOVERNED DEFINE RECORD**. It is **NOT** a reconstruction, recovery, backdating, or inference of a historical Phase 7 DEFINE. No historical Phase 7 record exists or is asserted. No README or conversation statement is converted into historical acceptance by this record.

---

## 17. Non-Authorization Statement

This command authorizes **DEFINE ONLY**. The following are **NOT authorized** by this command and must not begin without a separate Owner decision:

- **Research** (no Phase 7 Research, findings, or alternative selection).
- **Architecture** (no `ARCHITECTURE.md` creation beyond this DEFINE).
- **Specification** (no creation/modification of `SPECIFICATION.md`/`DECISIONS.md` beyond this DEFINE's references).
- **Implementation** (no `phase-07/src/**`, `phase-07/tests/**`, `phase-07/package.json`, tsconfigs, build/test config, dependencies, or generated artifacts).
- **Test**, **Refactor**, **Freeze**, or **Next Phase**.
- Any fix of the `@issue/foundation` TS2307 problem or any consumer-side workaround.
- Any modification of `phase-01-foundation`, Phase 2/3/4/5/6 (CLOSED/FROZEN), `BLUEPRINT.md`, §22.4/§22.5, or Q4.22 beyond what this DEFINE explicitly resolves (§22.3).
- Any Phase 8 work.

---

## 18. End-of-Document Block

```
PHASE 7 DEFINE RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 7 DEFINE STAGE: ACCEPTED — RESEARCH AUTHORIZED (owner, 2026-08-22)
HISTORICAL DEFINE RECOVERED: NO (none exists; not reconstructed)
RESEARCH AUTHORIZED: YES (owner, 2026-08-22)
ARCHITECTURE AUTHORIZED: NO
SPECIFICATION AUTHORIZED: NO
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 8 WORK STARTED: NO
COMMIT/PUSH: NO
```
