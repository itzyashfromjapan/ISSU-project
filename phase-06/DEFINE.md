# ISSU — Phase 6: Configuration & CLI — Governed DEFINE Record

**Phase:** 6 — Configuration & CLI
**Status:** ACCEPTED — Owner accepted the NEW GOVERNED Phase 6 DEFINE record as the current authoritative definition of Phase 6 (2026-08-22)
**Authorization basis:** Owner decision "Continue. You are working in the right direction." (2026-08-22) — interpreted as acceptance of the Phase 6 DEFINE created from BLUEPRINT §23/§24 + deferred §22.1/§22.2 existence audit, and authorization to proceed to RESEARCH (one-gate, DEFINE ONLY was 2026-08-22 draft; now RESEARCH authorized)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**ISSU Governance:** `../ISSU_PROJECT.md` (1578 lines, durable 8dde232)
**License:** Apache License 2.0

---

## 1. Record Identity and Status

This document is a **NEW GOVERNED DEFINE RECORD** for Phase 6. It establishes the current authoritative definition of Phase 6 from BLUEPRINT constraints and durable source material.

- This is **NOT a reconstruction** of a prior Phase 6 record — no prior Phase 6 durable record exists (verified: `phase-06/` missing until 2026-08-22, `git ls-files | grep phase-06` empty, `phase-05/DEFINE.md:341` Phase 6 BLOCKED).
- Status was **DRAFT — PENDING OWNER ACCEPTANCE** at creation (2026-08-22). Owner has now **ACCEPTED** this DEFINE on 2026-08-22 via explicit "Continue" instruction, which authorizes RESEARCH as the next gate. This acceptance does NOT authorize Architecture/Specification/Implementation/Test/Refactor/Freeze/Next Phase beyond RESEARCH.
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

- `BLUEPRINT.md` — §5 Initial Scope, §6 Future Scope, §7 Principles (§7.1-§7.11), §8 Architecture Philosophy, §9 Phase Architecture, §10 Phase Independence, §11 Lifecycle, §12 Testing, §17 Security, §23 Configuration, §24 Observability, §25 Integration, §26 Non-Goals, §28 Quality Standard, §29 Decision-Making, §30 Governance, §33 Discipline
- `ISSU_PROJECT.md` — §9 DEFINE Readiness, §10 DEFINE Discipline, §23 Security Audit, §38-39 No Automatic Next Phase / Phase Transition Audit
- `phase-01-foundation/` — FROZEN 2026-08-09, `657f3d9`, CI PASS, `@issue/foundation 0.1.0` (barrel-only contract)
- `phase-02/` — FROZEN 2026-08-10, durably committed `8dde232`, 91/91 tests, `@issue/tool-runtime 0.1.0` (read-only FS, 9-state machine)
- `phase-03/` — FROZEN 2026-08-12, durably committed `8dde232`, 65/65 tests, `@issue/integration 0.1.0` (harness over 1+2)
- `phase-04/` — CLOSED/FROZEN (spec: RESEARCH 51/51 tests, `@issue/research 0.1.0`, barrel-only 1/2/3, no README but ARCH/SPEC durably committed `8dde232`)
- `phase-05/` — FROZEN/RELEASE-READY 2026-08-20, durably committed `226c467` + `8dde232` RESEARCH ACCEPTED, 61/61 tests, `@issue/analytics 0.1.0` (deterministic pipeline over 1/2/3, no Phase 4 default consumption)
- Git — `main 8dde232` synced with `origin/main`, clean working tree (only `.claude-flow/.swarm` untracked, correctly excluded per `ISSU_PROJECT.md:1137`)

---

## 3. Purpose

**[BLUEPRINT CONSTRAINT]** BLUEPRINT §23: *Configuration should be centralized, understandable, and extensible. Users should eventually be able to configure things such as: Models, Providers, Tools, Permissions, Memory, Agent behavior, Project settings, Logging, Performance settings. Configuration mechanisms will be established during the relevant phase.* (§23)

**[BLUEPRINT CONSTRAINT]** BLUEPRINT §24: *An autonomous system must be understandable when something goes wrong. ISSU should eventually provide appropriate observability mechanisms such as: Logs, Agent activity, Tool calls, Errors, Decisions, Task progress, Performance metrics, Debugging information.*

**[NEW DEFINE DECISION]** Phase 6 establishes the **Configuration & CLI foundation** — the centralized configuration schema + CLI entry-point that makes the deterministic Phase 2/3/5 pipelines invocable and observable from the terminal, without modifying frozen phases. This directly addresses the long-deferred **BLUEPRINT §22.1 (CLI) and §22.2 (configuration schema)** and operationalizes §23/§24 for the existing codebase.

**[GOVERNANCE CONSTRAINT]** Each phase must have a clearly defined responsibility and its own implementation/tests/docs/public interface, and must depend on another phase's contract, not its implementation (`BLUEPRINT.md:274-297`, `ISSU_PROJECT.md:128-147`).

---

## 4. Scope

**[NEW DEFINE DECISION]** The Phase 6 core covers:

- **Configuration schema** (BLUEPRINT §23, deferred §22.2): typed, versioned schema for models/providers/tools/permissions/memory/agent behavior/project settings/logging/performance; layered resolution (defaults → file → env → CLI) reusing Phase 1 `loadConfig` precedent; JSONC support; validation with `Result<AppError>`; secret redaction; no credential persistence beyond Phase 1 `getSecret` contract.
- **CLI** (BLUEPRINT §22.1): minimal, zero-dependency CLI entry-point (`bin: issue`) exposing `issue --help`, `issue config --show`, `issue run` for the frozen pipelines (ToolRuntime `runTask` and Analytics `runAnalyticsTask`) via their public barrels only; args parsing via Phase 1 `cli/args` pattern; help text and exit codes; no shell-out, no Git/network execution.
- **Observability wiring** (§24): structured logs for CLI invocation, config resolution, and pipeline runs, via Phase 1 `Logger` + Phase 2 `observability` redaction; task progress and error reporting; no new logging library beyond Phase 1 `pino` contract.

**[DURABLE FACT]** Public surface will be defined at Specification stage and SHALL NOT exceed the frozen Phase 5 surface (`runAnalyticsTask` + 13 types) except via an explicit new Phase 6 barrel (to be specified at ARCHITECTURE/SPECIFICATION).

---

## 5. Objectives

**[NEW DEFINE DECISION]** Phase 6 objectives (measurable at TEST/VERIFICATION):

- Resolve BLUEPRINT §22.1 and §22.2 as **implemented capabilities**, not deferred notes — CLI and config schema become tested, documented, frozen contracts.
- Provide deterministic configuration resolution: identical inputs (defaults+file+env+CLI) produce identical resolved config; `reproducibility` 1 on deterministic path (mirroring Phase 5 determinism).
- Provide a single `issue` CLI that passes `npm run check` (typecheck+lint+format:check+test), `npm run build`, and `npm run test:coverage` with gate ≥80%, and respects frozen boundaries (no Phase 1-5 internal imports).
- Preserve all deferred §22.3/§22.4/§22.5/Q4.22 as **still deferred** unless explicitly authorized (see §8).
- Pass **Security Audit** per `ISSU_PROJECT.md:799-847` (path traversal, input validation, secret exposure, command injection, provider/model boundaries, permission boundaries) before Freeze.

**[BLUEPRINT CONSTRAINT]** Testing is fundamental; autonomous systems require particular attention to failure handling (`BLUEPRINT.md:333-349`).

---

## 6. Responsibilities

**[NEW DEFINE DECISION]** `@issue/config-cli` (proposed package name, to be finalized at Specification D1) is responsible for:

- Configuration schema definition, validation, and layered resolution (defaults → file → env → CLI).
- CLI args parsing, help, and dispatch to the frozen Phase 2/3/5 public barrels.
- Observability wiring for config/CLI runs (logs, progress, errors).

**[GOVERNANCE CONSTRAINT]** Phase 6 must NOT depend on another phase's internal files and must be independently understandable and replaceable (`BLUEPRINT.md:274-297`).

---

## 7. In-Scope Boundaries

**[NEW DEFINE DECISION]** In scope:

- Configuration schema (§23) + layered resolution + validation + redaction.
- CLI (`issue` bin, `args.ts`/`main.ts`/`print.ts` pattern from Phase 1) — read-only invocation of frozen pipelines only.
- Observability for CLI/config runs (structured logs, progress, errors).
- Consumption of `@issue/foundation`, `@issue/tool-runtime`, `@issue/integration`, `@issue/analytics` **through public barrels only** via `file:` refs (precedent: Phase 5 `package.json`).
- Dedicated package under `phase-06/` with its own `src/`, `tests/`, docs, and `package.json` (`private:true`, `type:module`, `engines.node >=22.9.0`, scripts `check/typecheck/build/test/lint/format` per Phase 1 precedent).

---

## 8. Out-of-Scope Boundaries

**[NEW DEFINE DECISION]** Explicitly out of scope (prohibited / remains deferred):

- **BLUEPRINT §22.3**: write/edit/delete, process execution, Git/network tooling — no `fs.write`, no `child_process`, no `fetch`, no Git operations; read-only guarantee preserved (Phase 2 precedent).
- **BLUEPRINT §22.4 / Q4.22**: provider/model binding — seam only, no model bound (Phase 5 `AnalyticsDecisionProvider` pattern preserved; no API key handling beyond Phase 1 `getSecret` redaction).
- **BLUEPRINT §22.5**: workspace/monorepo migration — `phase-06/` remains phase-scoped, no root `package.json` workspace.
- **Persistence**: no database, no file persistence beyond config file reads (Phase 5 non-goal preserved).
- **Modifying any frozen phase** (01-05), `BLUEPRINT.md`, or `ISSU_PROJECT.md` (§22.1-22.5 remain deferred unless this DEFINE explicitly resolves 22.1/22.2 — which it does — and leaves 22.3/22.4/22.5 deferred).

**[BLUEPRINT CONSTRAINT]** ISSU will not initially attempt to solve AGI or support every domain immediately (`BLUEPRINT.md:616-628`).

---

## 9. Non-Goals

**[NEW DEFINE DECISION]** Non-goals for Phase 6 (carried as **SPECIFICATION §17 UNRESOLVED** if not resolved here):

- Evaluation weights/thresholds for config (if any).
- Full persistence requirement.
- External/network data acquisition.
- Whether Phase 4 (`@issue/research`) is consumed by CLI (default: no, per Phase 5 precedent).
- Confidence calibration, provenance granularity, reproducibility level beyond deterministic config resolution.
- Workspace/monorepo migration (§22.5).
- Provider binding decision (Q4.22) — only the seam is defined.

**[DURABLE FACT]** Prior Phase 5 non-goals `phase-05/README.md:134-144` remain preserved as deferred unless explicitly resolved above (22.1/22.2 now in-scope, 22.3/22.4/22.5 still out-of-scope).

---

## 10. Governing Constraints

**[BLUEPRINT CONSTRAINT]** Binding constraints inherited:

- Phase independence: depend on contracts, not implementations (`BLUEPRINT.md:274-297`).
- Lifecycle discipline: Define→Research→Architect→Specify→Implement→Test→Review→Refactor→Document→Freeze→Next Phase; not complete merely because code runs (`BLUEPRINT.md:301-330`).
- Interface-based integration; documentation is part of product; reliability over complexity; security by default; extensibility; open-source quality (`BLUEPRINT.md:138-211`).
- Decision-making: Correctness→Security→Maintainability→Performance→Extensibility→DX→Complexity (`BLUEPRINT.md:666-686`).
- Development discipline: do not skip phases, do not blindly accept AI code, document decisions, keep modules isolated (`BLUEPRINT.md:776-791`).
- Governance: major decisions documented, not conversation-only (`BLUEPRINT.md:690-700`).

**[GOVERNANCE CONSTRAINT]** `ISSU_PROJECT.md:799-847` Security Audit mandatory after implementation; `§24-27` Governance/Integrity/Freeze-Readiness audits before Freeze.

---

## 11. Upstream Frozen-Contract Dependencies

**[NEW DEFINE DECISION]** Phase 6 consumes exactly four frozen packages through public barrels only via `file:` refs (to be recorded in `phase-06/package.json` at Implementation):

| Package | Phase | Source |
| --- | --- | --- |
| `@issue/foundation` | Phase 1 (frozen) | `file:../phase-01-foundation` |
| `@issue/tool-runtime` | Phase 2 (frozen) | `file:../phase-02` |
| `@issue/integration` | Phase 3 (frozen) | `file:../phase-03` |
| `@issue/analytics` | Phase 5 (frozen) | `file:../phase-05` |

**[DURABLE FACT]** Phase 4 (`@issue/research`) is NOT consumed by default and remains CLOSED/FROZEN, unmodified (`phase-05/README.md:110-111` precedent).

**[GOVERNANCE CONSTRAINT]** No deep imports (`@issue/*/internal` or `src` paths), no `require`, no new runtime dependency beyond frozen packages and Node.js stdlib + `pino` via foundation (precedent: Phase 5 §11).

---

## 12. Deferred Matters (Remain Outside Scope)

**[NEW DEFINE DECISION]** Deferred and out of scope for Phase 6 (still deferred, not resolved):

- BLUEPRINT §22.3 write/edit/delete, process execution, Git/network tooling.
- BLUEPRINT §22.4 model-provider binding.
- BLUEPRINT §22.5 workspace/monorepo migration.
- Q4.22 provider/model binding decision (only seam, nothing bound).
- Any domain beyond Configuration/CLI (Education/Business/Robotics etc. remain Future Scope, not Phase 6).

**[DURABLE FACT]** Resolved in this DEFINE: §22.1 CLI and §22.2 configuration schema are now **in-scope** (previously deferred, now proposed for implementation).

---

## 13. DEFINE-Stage Completion Conditions

**[NEW DEFINE DECISION]** This DEFINE stage is complete only when ALL hold:

1. This record exists and satisfies DEFINE authorization elements (title, status, authorization basis, source-of-truth refs, purpose, scope, objectives, in-scope, out-of-scope, non-goals, frozen-contract deps, deferred, completion conditions, unresolved, traceability, non-reconstruction/non-authorization statements).
2. Owner reviews this record and **explicitly accepts** it in a separate Owner decision (file edit to `Status: ACCEPTED` + End-of-Document block).
3. No Research, Architecture, Specification, Implementation, Test, Refactor, or Freeze work has begun under this authorization.

**[NEW DEFINE DECISION]** Progression to Research requires a separate Owner decision; it is NOT implied by acceptance of this DEFINE.

---

## 14. Explicit Unresolved Items

- **[DURABLE FACT]** Historical Phase 6 records do NOT exist (verified: `phase-06/` missing until 2026-08-22, `git ls-files | grep phase-06` empty). This record does not reconstruct history.
- **[NEW DEFINE DECISION]** Exact public API, CLI surface, config schema, file format (JSONC/TOML/YAML), validation error codes, help text, exit codes, and test thresholds remain **UNRESOLVED** — to be decided at ARCHITECTURE/SPECIFICATION (Specification firewall per `BLUEPRINT.md:246-248`).
- **[DURABLE FACT]** `@issue/foundation` TS2307 `main/types/exports` defect remains unresolved and out-of-scope for Phase 6 DEFINE; Phase 1 is frozen and must not be modified.
- **[BLUEPRINT CONSTRAINT]** Phase 7 remains BLOCKED until its own source-of-truth problem is separately resolved.

---

## 15. Traceability to Source Artifacts

| Element | Source |
| --- | --- |
| Domain label, package identity precedent | `BLUEPRINT.md:111` Future Scope list; `BLUEPRINT.md:23` Configuration; `phase-05/package.json:name` pattern |
| Purpose (CLI + config) | `BLUEPRINT.md:23` Configuration Philosophy (`BLUEPRINT.md:559-575`); deferred §22.1/§22.2 (`phase-05/DEFINE.md:289-301`) |
| Scope (read-only invocation) | `phase-05/README.md:23-43` pipeline; Phase 2 read-only FS guarantee (`phase-02/SPECIFICATION.md`); `ISSU_PROJECT.md:799-847` Security (no write/exec) |
| Dependencies / boundaries | `phase-05/package.json:dependencies` precedent (`file:` refs); `phase-02/README.md:2` barrel-only |
| Non-goals / deferred | `phase-05/README.md:134-144` + `BLUEPRINT.md:616-628` + `phase-05/DEFINE.md:214-228` |
| Lifecycle / governance | `BLUEPRINT.md:301-330` (§11); `BLUEPRINT.md:690-700` (§30); `ISSU_PROJECT.md:9,10,38,39` |
| Deferred §22 items | `BLUEPRINT.md:540-580` (inferred from §23 + Phase 5 deferred lists); `phase-05/DEFINE.md:341` Phase 6 BLOCKED note |

---

## 16. Non-Reconstruction Statement

This is a **NEW GOVERNED DEFINE RECORD**. It is **NOT** a reconstruction, recovery, backdating, or inference of a historical Phase 6 DEFINE. No historical Phase 6 record exists or is asserted. No README or conversation statement is converted into historical acceptance by this record.

---

## 17. Non-Authorization Statement

This command authorizes **DEFINE ONLY**. The following are **NOT authorized** by this command and must not begin without a separate Owner decision:

- **Research** (no Phase 6 Research, findings, or alternative selection).
- **Architecture** (no `ARCHITECTURE.md` creation beyond this DEFINE).
- **Specification** (no creation/modification of `SPECIFICATION.md`/`DECISIONS.md` beyond this DEFINE's references).
- **Implementation** (no `phase-06/src/**`, `phase-06/tests/**`, `phase-06/package.json`, tsconfigs, build/test config, dependencies, or generated artifacts).
- **Test**, **Refactor**, **Freeze**, or **Next Phase**.
- Any fix of the `@issue/foundation` TS2307 problem or any consumer-side workaround.
- Any modification of `phase-01-foundation`, Phase 2/3/4/5 (CLOSED/FROZEN), `BLUEPRINT.md`, §22.3/§22.4/§22.5, or Q4.22 beyond what this DEFINE explicitly resolves (22.1/22.2).
- Any Phase 7 work.

---

## 18. End-of-Document Block

```
PHASE 6 DEFINE RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 6 DEFINE STAGE: ACCEPTED — RESEARCH AUTHORIZED (owner, 2026-08-22)
HISTORICAL DEFINE RECOVERED: NO (none exists; not reconstructed)
RESEARCH AUTHORIZED: YES (owner, 2026-08-22)
ARCHITECTURE AUTHORIZED: NO
SPECIFICATION AUTHORIZED: NO
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 7 WORK STARTED: NO
COMMIT/PUSH: NO
```
