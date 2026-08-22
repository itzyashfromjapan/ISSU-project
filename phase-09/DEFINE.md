# ISSU — Phase 9: Workspace & Monorepo Migration — Governed DEFINE Record

**Phase:** 9 — Workspace & Monorepo Migration
**Status:** ACCEPTED — Owner accepted the NEW GOVERNED Phase 9 DEFINE record as the current authoritative definition of Phase 9 (2026-08-22)
**Authorization basis:** Owner decision "continue on next autonomous gate per our blue print" (2026-08-22) — interpreted as acceptance of the Phase 9 DEFINE created from BLUEPRINT §22.5 + §10 Phase Independence existence audit, and authorization to proceed to RESEARCH (one-gate, DEFINE ONLY was 2026-08-22 draft; now RESEARCH authorized)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**ISSU Governance:** `../ISSU_PROJECT.md` (1578 lines, durable 64923b0)
**License:** Apache License 2.0

---

## 1. Record Identity and Status

This document is a **NEW GOVERNED DEFINE RECORD** for Phase 9. It establishes the current authoritative definition of Phase 9 from BLUEPRINT constraints and durable source material.

- This is **NOT a reconstruction** of a prior Phase 9 record — no prior Phase 9 durable record exists (verified: `phase-09/` missing until 2026-08-22, `git ls-files | grep phase-09` empty, `phase-08/DEFINE.md:12` leaves §22.5 deferred).
- Status was **DRAFT — PENDING OWNER ACCEPTANCE** at creation (2026-08-22). Owner has now **ACCEPTED** this DEFINE on 2026-08-22 via explicit "continue on next autonomous gate per our blue print" instruction, which authorizes RESEARCH as the next gate. This acceptance does NOT authorize Architecture/Specification/Implementation/Test/Refactor/Freeze/Next Phase beyond RESEARCH.
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

- `BLUEPRINT.md` — §5 Initial Scope, §6 Future Scope, §7 Principles (§7.1-§7.11), §8 Architecture Philosophy, §9 Phase Architecture, §10 Phase Independence, §11 Lifecycle, §12 Testing, §17 Security, §18 Model Independence, §23 Configuration, §24 Observability, §25 Integration, §26 Non-Goals, §28 Quality Standard, §29 Decision-Making, §30 Governance, §33 Discipline
- `ISSU_PROJECT.md` — §9 DEFINE Readiness, §10 DEFINE Discipline, §17 No-Workaround Rule, §23 Security Audit, §38-39 No Automatic Next Phase / Phase Transition Audit
- `phase-01-foundation/` — FROZEN 2026-08-09, `657f3d9`, `@issue/foundation 0.1.0` (barrel)
- `phase-02/` — FROZEN 2026-08-10, `8dde232`, `@issue/tool-runtime 0.1.0` (91/91)
- `phase-03/` — FROZEN 2026-08-12, `8dde232`, `@issue/integration 0.1.0` (65/65)
- `phase-04/` — CLOSED/FROZEN, `8dde232`, `@issue/research 0.1.0` (51/51)
- `phase-05/` — FROZEN/RELEASE-READY 2026-08-20, `226c467+8dde232`, `@issue/analytics 0.1.0` (61/61)
- `phase-06/` — FROZEN 2026-08-22, `b72a78b+59590d0`, `@issue/config-cli 0.1.0` (66/66, config+CLI)
- `phase-07/` — FROZEN 2026-08-22, `0066055`, `@issue/write-execution 0.1.0` (38/38, write/process/Git/fetch)
- `phase-08/` — FROZEN 2026-08-22, `64923b0`, `@issue/model-provider 0.1.0` (19/19, provider binding)
- Git — `main 64923b0` synced with `origin/main`, clean (only `.claude-flow/.swarm` untracked, correctly excluded per `ISSU_PROJECT.md:1137`)

---

## 3. Purpose

**[BLUEPRINT CONSTRAINT]** BLUEPRINT §22.5 (deferred via `phase-08/DEFINE.md:12`): *workspace/monorepo migration* — explicitly out-of-scope for Phase 8 and preserved as deferred. `BLUEPRINT.md:9` Phase Architecture: *Each phase will have its own dedicated folder and development lifecycle* — but long-term *Integration Philosophy* §25 requires *Identify completed phase interfaces, Build adapters, Connect modules, Run integration tests, Validate complete system, Prepare first complete release* — which is now possible after 8 frozen phases.

**[BLUEPRINT CONSTRAINT]** BLUEPRINT §10 Phase Independence: *Phase independence is one of the project's most important architectural goals. Each phase must: Have clearly defined responsibility, Have its own implementation, Have its own tests, Have its own documentation, Define its public interface, Avoid depending on another phase's internal files, Be understandable independently, Be replaceable where practical. The final system will combine the phases through defined integration boundaries.* **Independence does not mean that phases can never communicate. It means: A phase depends on another phase's contract, not its implementation.**

**[NEW DEFINE DECISION]** Phase 9 establishes the **Workspace & Monorepo Migration** foundation — the migration from 8 phase-scoped `file:../phase-0X` packages to a single `pnpm`/`npm` workspaces monorepo with a root `package.json` `workspaces: ["phase-*"]`, shared `tsconfig.json` base, shared `eslint`/`prettier`/`vitest` configs, and a unified `npm run check` at root that validates all frozen phases through their public barrels, **without modifying any frozen phase's public contract or internal implementation**.

**[GOVERNANCE CONSTRAINT]** Each phase must have a clearly defined responsibility and its own implementation/tests/docs/public interface, and must depend on another phase's contract, not its implementation (`BLUEPRINT.md:274-297`, `ISSU_PROJECT.md:128-147`).

---

## 4. Scope

**[NEW DEFINE DECISION]** The Phase 9 core covers:

- **Workspace manifest** (deferred §22.5): root `package.json` with `private:true`, `workspaces: ["phase-01-foundation","phase-02","phase-03","phase-04","phase-05","phase-06","phase-07","phase-08"]` (and `phase-09` itself as member, not yet published), `packageManager: "npm@10"` or `pnpm@9`, `engines.node >=22.9.0`.
- **Shared configs** (inferred from `phase-06` precedent): root `tsconfig.base.json` (extends per-phase `tsconfig.json`), `eslint.config.js` (flat config, `tseslint.configs.recommended` + `no-restricted-imports` for `from "@issue/*/internal"`), `prettier.config.mjs`, `.editorconfig` — all via `extends` without modifying frozen phase `src/` or `tests/`.
- **Unified verification** (§25 Integration steps 4-5): root `npm run check:all` = `npm run check` in each workspace via `npm --workspaces run check` or `pnpm -r run check`, plus `npm run build:all` and `npm run test:coverage:all` with aggregated `coverage` thresholds, run in CI `.github/workflows/ci.yml` (update to `workspaces` matrix, not per-phase job duplication).
- **Migration audit** (§10 independence preserved): `phase-09/src/migrate.ts` (check that `file:../phase-0X` still resolves via `workspaces` symlink, no `require`, no deep imports, `exports` map still blocks `from "@issue/foundation/dist/*"`).

**[DURABLE FACT]** Public surface will be defined at Specification stage and SHALL NOT exceed frozen Phase 8 surface except via explicit new Phase 9 barrel (to be specified at ARCHITECTURE/SPECIFICATION) — likely `phase-09/src/index.ts` will export `migrateWorkspace` + `verifyWorkspaces` helpers, not domain logic.

---

## 5. Objectives

**[NEW DEFINE DECISION]** Phase 9 objectives (measurable at TEST/VERIFICATION):

- Resolve BLUEPRINT §22.5 as **implemented capability**, not deferred note — workspace/monorepo becomes tested, documented, frozen contract.
- Provide a single root `package.json` workspaces manifest that makes `npm install` at root install all 9 phases via `workspaces` symlinks, with `npm run check:all` passing `typecheck+lint+format:check+test` for every frozen phase, and `npm run build:all` building every `dist/` via `tsc -p tsconfig.build.json` in each workspace, without modifying any frozen phase's `src/` or `tests/` or public barrel.
- Preserve phase independence: every `phase-0X/src` still has its own `package.json`, `tsconfig.json`, `vitest.config.ts`, `tests/`; no phase depends on another's `src/` or `internal` — only on `file:` via workspaces symlink (which is an implementation of `file:`, not a deep import).
- Pass **Security Audit** per `ISSU_PROJECT.md:799-847` (no new `fs.write` beyond migration audit, no `child_process` beyond `npm --workspaces`, no `fetch`, no credential exposure) before Freeze.

**[BLUEPRINT CONSTRAINT]** Testing is fundamental; autonomous systems require particular attention to failure handling (`BLUEPRINT.md:333-349`).

---

## 6. Responsibilities

**[NEW DEFINE DECISION]** `@issue/workspace` (proposed package name, to be finalized at Specification D1) or root manifest itself is responsible for:

- Workspace manifest (`package.json:workspaces`, `packageManager`, `engines`).
- Shared configs (`tsconfig.base.json`, `eslint.config.js`, `prettier.config.mjs` at root, with per-phase `extends`).
- Unified verification (`check:all`, `build:all`, `test:coverage:all` via `npm --workspaces`).
- Migration audit (`migrate.ts` verifying `file:../phase-0X` still resolves, `exports` map still blocks deep imports, no `require`).

**[GOVERNANCE CONSTRAINT]** Phase 9 must NOT depend on another phase's internal files and must be independently understandable and replaceable (`BLUEPRINT.md:274-297`).

---

## 7. In-Scope Boundaries

**[NEW DEFINE DECISION]** In scope:

- Root `package.json` `workspaces` + `packageManager` + `engines` + `scripts: check:all, build:all, test:all, test:coverage:all`.
- Root `tsconfig.base.json`, `eslint.config.js`, `prettier.config.mjs`, `.editorconfig` (shared, with per-phase `extends`).
- `phase-09/src/migrate.ts` (`verifyWorkspaces`, `migrateWorkspace` helpers) + `phase-09/src/index.ts` barrel (exports `verifyWorkspaces` + `migrateWorkspace`).
- Consumption of `@issue/foundation`, `@issue/tool-runtime`, `@issue/integration`, `@issue/analytics`, `@issue/config-cli`, `@issue/write-execution`, `@issue/model-provider` **through public barrels only** via `file:` refs (precedent: Phase 8 `package.json`) — but Phase 9 minimal may consume none beyond `foundation` `assertContained` for migration audit.
- Dedicated package under `phase-09/` with its own `src/`, `tests/`, docs, and `package.json` (`private:true`, `type:module`, `engines.node >=22.9.0`, scripts `check/typecheck/build/test/lint/format` per Phase 1 precedent).

---

## 8. Out-of-Scope Boundaries

**[NEW DEFINE DECISION]** Explicitly out of scope (prohibited / remains deferred):

- **Future Scope domains** (BLUEPRINT §6): Research, Education, Business, Scientific, Robotics, Data and analytics (already Phase 5), Engineering, Creative, Personal productivity, Specialized industry — no new domain module in Phase 9; Phase 9 is infrastructure, not domain.
- **Modifying any frozen phase** (01-08), `BLUEPRINT.md`, or `ISSU_PROJECT.md` (§22.5 resolved here via this DEFINE, but no `src/` or `tests/` change in frozen phases beyond adding `workspaces` symlink at root and `extends` in per-phase configs if needed — but even that `extends` is **out-of-scope** for this DEFINE if it requires modifying frozen `tsconfig.json`; Phase 9 SHALL NOT modify frozen `phase-0X/tsconfig.json` to extend root base — instead root base is *additional*, not replacement).
- **Publishing** any workspace package (no `npm publish` without separate authorization, all `private:true`).
- **Unbounded workspace features** (no `turbo`/`lerna`/`nx` without separate decision, no `pnpm` store migration without separate authorization — Phase 9 minimal uses `npm` workspaces, not `pnpm`).

**[BLUEPRINT CONSTRAINT]** ISSU will not initially attempt to solve AGI or support every domain immediately (`BLUEPRINT.md:616-628`).

---

## 9. Non-Goals

**[NEW DEFINE DECISION]** Non-goals for Phase 9 (carried as **SPECIFICATION §17 UNRESOLVED** if not resolved here):

- Full domain beyond workspace (no new agent capability).
- Provider/model binding beyond Phase 8 (already Phase 8).
- Workspace features beyond `npm` workspaces (no `turbo`, no `pnpm` store, no `changesets`).
- Whether Phase 4 (`@issue/research`) is consumed by workspace (still no).

**[DURABLE FACT]** Prior Phase 8 non-goals `phase-08/README.md:7` remain preserved as deferred unless explicitly resolved above (§22.5 now in-scope, Future Scope still out-of-scope).

---

## 10. Governing Constraints

**[BLUEPRINT CONSTRAINT]** Binding constraints inherited:

- Phase independence: depend on contracts, not implementations (`BLUEPRINT.md:274-297`).
- Lifecycle discipline: Define→Research→Architect→Specify→Implement→Test→Review→Refactor→Document→Freeze→Next Phase; not complete merely because code runs (`BLUEPRINT.md:301-330`).
- Interface-based integration; documentation is part of product; reliability over complexity; security by default; extensibility; open-source quality (`BLUEPRINT.md:138-211`).
- Decision-making: Correctness→Security→Maintainability→Performance→Extensibility→DX→Complexity (`BLUEPRINT.md:666-686`).
- Development discipline: do not skip phases, do not blindly accept AI code, document decisions, keep modules isolated (`BLUEPRINT.md:776-791`).
- Governance: major decisions documented, not conversation-only (`BLUEPRINT.md:690-700`).

**[GOVERNANCE CONSTRAINT]** `ISSU_PROJECT.md:799-847` Security Audit mandatory after implementation; `§24-27` Governance/Integrity/Freeze-Readiness audits before Freeze; `§17` No-Workaround Rule.

---

## 11. Upstream Frozen-Contract Dependencies

**[NEW DEFINE DECISION]** Phase 9 consumes **zero** frozen packages as runtime `dependencies` (it is a workspace manifest, not a runtime consumer) — but for audit purposes it **references** all eight frozen public barrels via `file:` refs in its `devDependencies` or `peerDependencies` for migration verification (to be recorded in `phase-09/package.json` at Implementation, but not required for `npm install` at root which uses `workspaces`).

**[DURABLE FACT]** Phase 4 (`@issue/research`) is NOT consumed by default and remains CLOSED/FROZEN, unmodified (`phase-08/DEFINE.md:11` precedent).

**[GOVERNANCE CONSTRAINT]** No deep imports (`@issue/*/internal` or `src` paths), no `require`, no new runtime dependency beyond `npm` workspaces + `pino` via foundation (precedent: Phase 8 §11).

---

## 12. Deferred Matters (Remain Outside Scope)

**[NEW DEFINE DECISION]** Deferred and out of scope for Phase 9 (still deferred, not resolved):

- Future Scope domains (Research already Phase 4, Data and analytics already Phase 5, plus Education/Business/Scientific/Robotics/Engineering/Creative/Personal productivity/Specialized industry) — all remain Future Scope, not Phase 9.
- Any domain beyond Workspace & Monorepo Migration.

**[DURABLE FACT]** Resolved in this DEFINE: §22.5 workspace/monorepo migration is now **in-scope** (previously deferred, now proposed for implementation).

---

## 13. DEFINE-Stage Completion Conditions

**[NEW DEFINE DECISION]** This DEFINE stage is complete only when ALL hold:

1. This record exists and satisfies DEFINE authorization elements (title, status, authorization basis, source-of-truth refs, purpose, scope, objectives, in-scope, out-of-scope, non-goals, frozen-contract deps, deferred, completion conditions, unresolved, traceability, non-reconstruction/non-authorization statements).
2. Owner reviews this record and **explicitly accepts** it in a separate Owner decision (file edit to `Status: ACCEPTED` + End-of-Document block).
3. No Research, Architecture, Specification, Implementation, Test, Refactor, or Freeze work has begun under this authorization.

**[NEW DEFINE DECISION]** Progression to Research requires a separate Owner decision; it is NOT implied by acceptance of this DEFINE.

---

## 14. Explicit Unresolved Items

- **[DURABLE FACT]** Historical Phase 9 records do NOT exist (verified: `phase-09/` missing until 2026-08-22, `git ls-files | grep phase-09` empty). This record does not reconstruct history.
- **[NEW DEFINE DECISION]** Exact public API (workspace manifest `workspaces` list, `packageManager` field, `scripts: check:all` implementation, `tsconfig.base.json` location, `migrateWorkspace` signature) remains **UNRESOLVED** — to be decided at ARCHITECTURE/SPECIFICATION (Specification firewall per `BLUEPRINT.md:246-248`).
- **[DURABLE FACT]** `@issue/foundation` TS2307 `main/types/exports` defect remains unresolved and out-of-scope for Phase 9 DEFINE; Phase 1 is frozen and must not be modified.
- **[BLUEPRINT CONSTRAINT]** Phase 10 remains BLOCKED until its own source-of-truth problem is separately resolved.

---

## 15. Traceability to Source Artifacts

| Element | Source |
| --- | --- |
| Domain label, package identity | `BLUEPRINT.md:9` Phase Architecture (`phase-09/`), `BLUEPRINT.md:22.5` workspace/monorepo deferred; `phase-08/DEFINE.md:12` |
| Purpose (workspace) | `BLUEPRINT.md:9` Phase Architecture (`Each phase will have its own dedicated folder`); `BLUEPRINT.md:25` Integration (Identify interfaces, Build adapters, Connect modules, Validate complete system, Prepare first complete release); `phase-08/FREEZE_REPORT.md:10` deferred §22.5 |
| Scope (workspaces) | `BLUEPRINT.md:22.5`; `ISSU_PROJECT.md:799-847` Security (no `fs.write` beyond migration audit) |
| Dependencies / boundaries | `phase-08/package.json:dependencies` precedent (`file:` refs); `phase-03` barrel-only |
| Non-goals / deferred | `phase-08/README.md:7`; `BLUEPRINT.md:616-628`; `phase-08/DEFINE.md:12` |
| Lifecycle / governance | `BLUEPRINT.md:301-330` (§11); `BLUEPRINT.md:690-700` (§30); `ISSU_PROJECT.md:9,10,38,39` |
| Deferred §22.5 | `BLUEPRINT.md:22.5` (inferred from Phase 8 deferred lists); `phase-08/DEFINE.md:12` |

---

## 16. Non-Reconstruction Statement

This is a **NEW GOVERNED DEFINE RECORD**. It is **NOT** a reconstruction, recovery, backdating, or inference of a historical Phase 9 DEFINE. No historical Phase 9 record exists or is asserted. No README or conversation statement is converted into historical acceptance by this record.

---

## 17. Non-Authorization Statement

This command authorizes **DEFINE ONLY**. The following are **NOT authorized** by this command and must not begin without a separate Owner decision:

- **Research** (no Phase 9 Research, findings, or alternative selection).
- **Architecture** (no `ARCHITECTURE.md` creation beyond this DEFINE).
- **Specification** (no creation/modification of `SPECIFICATION.md`/`DECISIONS.md` beyond this DEFINE's references).
- **Implementation** (no `phase-09/src/**`, `phase-09/tests/**`, `phase-09/package.json`, tsconfigs, build/test config, dependencies, or generated artifacts).
- **Test**, **Refactor**, **Freeze**, or **Next Phase**.
- Any fix of the `@issue/foundation` TS2307 problem or any consumer-side workaround.
- Any modification of `phase-01-foundation`, Phase 2/3/4/5/6/7/8 (CLOSED/FROZEN), `BLUEPRINT.md`, §22.5 beyond what this DEFINE explicitly resolves, or any Future Scope domain.
- Any Phase 10 work.

---

## 18. End-of-Document Block

```
PHASE 9 DEFINE RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 9 DEFINE STAGE: ACCEPTED — RESEARCH AUTHORIZED (owner, 2026-08-22)
HISTORICAL DEFINE RECOVERED: NO (none exists; not reconstructed)
RESEARCH AUTHORIZED: YES (owner, 2026-08-22)
ARCHITECTURE AUTHORIZED: NO
SPECIFICATION AUTHORIZED: NO
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6/7/8 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 10 WORK STARTED: NO
COMMIT/PUSH: NO
```
