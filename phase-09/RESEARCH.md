# ISSU — Phase 9: Workspace & Monorepo Migration — Research Record

**Phase:** 9 — Workspace & Monorepo Migration
**Stage:** RESEARCH (owner-authorized; accepted DEFINE → Research)
**Status:** ACCEPTED — Owner accepted the Phase 9 Research record (owner, 2026-08-22)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Accepted DEFINE:** `./DEFINE.md` (ACCEPTED, owner, 2026-08-22)
**ISSU Governance:** `../ISSU_PROJECT.md` (1578 lines, durable 64923b0)
**License:** Apache License 2.0

This is a **NEW GOVERNED RESEARCH STAGE**. It is NOT a reconstruction of a missing Phase 9 Research record — no prior Phase 9 durable record exists (verified: `phase-09/` missing until 2026-08-22).

---

## 1. Research Status

DRAFT — evidence gathered and recorded for Owner review. Research does NOT decide Architecture, public APIs, schemas, algorithms, technology, provider binding, or acceptance criteria; those remain UNRESOLVED unless stated otherwise here.

---

## 2. Research Authorization

Owner decision: **ACCEPT the NEW GOVERNED Phase 9 DEFINE record and AUTHORIZE Phase 9 RESEARCH** (2026-08-22, "continue on next autonomous gate per our blue print"). Authorized work: evidence-gathering and analysis for the later Architecture and Specification stages, within the mandatory boundaries (no modification of Phase 1/2/3/4/5/6/7/8, BLUEPRINT, `ISSU_PROJECT.md`, no TS2307 fix or paths workaround, no Future Scope domain beyond workspace, no Phase 10 work). Research does NOT authorize Architecture, Specification, Design decisions, or Implementation.

---

## 3. Accepted DEFINE Reference

Accepted as the current authoritative definition of Phase 9 (`phase-09/DEFINE.md`, ACCEPTED 2026-08-22):

- **Domain:** Workspace & Monorepo Migration — migration from 8 phase-scoped `file:../phase-0X` packages to a single `npm` workspaces monorepo with root `package.json` `workspaces: ["phase-*"]`, shared `tsconfig.base.json`, `eslint`/`prettier`/`vitest` configs, and unified `npm run check:all` via `npm --workspaces`, while preserving phase independence via barrel-only contracts.
- **Public surface:** to be defined at Specification (new Phase 9 barrel, likely `verifyWorkspaces` + `migrateWorkspace` helpers).
- **Scope:** root `package.json` `workspaces` + `packageManager` + `engines` + `scripts: check:all, build:all, test:all`, root `tsconfig.base.json`, `eslint.config.js`, `prettier.config.mjs`, migration audit `migrate.ts` verifying `file:../phase-0X` still resolves via workspaces symlink, `exports` map still blocks deep imports.
- **Boundaries:** no Future Scope domain, no modifying any frozen phase `src/` or `tests/` beyond adding `workspaces` symlink at root and `extends` in per-phase configs if needed — but even that `extends` is out-of-scope for this DEFINE if it requires modifying frozen `tsconfig.json`; Phase 9 SHALL NOT modify frozen `phase-0X/tsconfig.json`.
- **Dependencies:** zero frozen packages as runtime `dependencies` (workspace manifest, not runtime consumer) — but references all eight frozen public barrels via `file:` for verification.
- **Deferred:** Future Scope domains (Research already Phase 4, Data and analytics already Phase 5, plus Education/Business/Scientific/Robotics/Engineering/Creative/Personal productivity/Specialized industry) — all remain Future Scope, not Phase 9.
- **Objectives:** `npm install` at root via workspaces, `check:all`/`build:all`/`test:coverage:all` passing for every frozen phase, `Security Audit` PASS.

---

## 4. Research Questions

| ID | Question |
| --- | --- |
| R9.1 | What frozen-contract surface may Phase 9 legitimately reference, and through which seams (workspaces symlink vs file:)? |
| R9.2 | What workspace manifest precedent exists (npm workspaces vs pnpm vs yarn) and how is it validated? |
| R9.3 | How should shared configs be structured (tsconfig.base.json, eslint, prettier) without modifying frozen phases? |
| R9.4 | How should unified verification be wired (npm --workspaces run check/build/test) and how is it audited? |
| R9.5 | How should migration audit verify that file:../phase-0X still resolves and exports map still blocks deep imports? |
| R9.6 | How should phase independence be preserved after migration (barrel-only, no src/internal imports)? |
| R9.7 | How should determinism be handled for workspace installs (lockfile, deterministic symlink)? |
| R9.8 | How should security be handled for workspace (no new fs.write beyond audit, no child_process beyond npm --workspaces)? |
| R9.9 | What is the pnpm vs npm vs yarn precedent and what remains deferred (turbo, lerna, nx, changesets)? |
| R9.10 | Which deferred items (Future Scope domains) remain outside scope and how are they handled? |
| R9.11 | What security implications follow from workspace migration (supply chain, lockfile, script execution)? |
| R9.12 | What engineering trade-offs attend the npm workspaces minimal approach? |

---

## 5. Evidence / Source Inventory

Source-of-truth order per authorization; every item read/verified this session:

- `BLUEPRINT.md` — §5 Initial Scope, §6 Future Scope, §7 Principles, §8 Architecture, §9 Phase Architecture, §10 Independence, §11 Lifecycle, §12 Testing, §17 Security, §18 Model Independence, §23 Configuration, §24 Observability, §25 Integration, §26 Non-Goals, §28 Quality, §29 Decision-Making, §30 Governance, §33 Discipline
- `ISSU_PROJECT.md` — §9-§10 DEFINE, §17 No-Workaround, §23 Security Audit (22 vectors), §38-39 Next Phase
- `phase-01-foundation/package.json` — `private:true`, `workspaces` not yet present, `file:../phase-0X` precedent not yet for Phase 9 (Phase 9 is the first to define workspaces)
- `phase-06/package.json` — `file:../phase-01-foundation` etc. (barrel-only precedent)
- `phase-07/package.json` — `file:../phase-06` etc.
- `phase-08/package.json` — `file:../phase-07` etc.
- Root `package.json` not yet exists (verified: `Test-Path "package.json"` at repo root returns false)
- `phase-01-foundation/tsconfig.json` — per-phase `tsconfig.json` with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- `phase-01-foundation/eslint.config.js` — flat config `tseslint.configs.recommended` + `no-unused-vars`
- Git — `main 64923b0` synced, `phase-09/` missing until 2026-08-22

---

## 6. Research Findings

### R9.1 — Frozen-contract surface

**[FACT]** Phase 9 may reference all eight frozen public barrels via `file:` refs for verification: `@issue/foundation`, `@issue/tool-runtime`, `@issue/integration`, `@issue/research`, `@issue/analytics`, `@issue/config-cli`, `@issue/write-execution`, `@issue/model-provider` — all via **public barrels only**, no deep imports, verified in `phase-08/package.json` precedent.

**[PRECEDENT]** Phase 8 AD-8.1 established barrel-only consumption for seven consumers (1/2/3/5/6/7) — Phase 9 follows same, but as a workspace manifest, not a runtime consumer, it references via `devDependencies` or `workspaces` symlink, not `dependencies`.

**[INFERENCE]** Any workspace behavior needed from frozen phases must be reachable via public exports or `workspaces` symlink; internal modules are inaccessible.

**[UNRESOLVED]** Exact Phase 9 barrel exports — Specification firewall.

---

### R9.2 — Workspace manifest precedent

**[FACT]** No root `package.json` `workspaces` exists in frozen phases — all phases `01-08` are phase-scoped (`phase-0X/package.json` with `file:../phase-0Y` refs), no monorepo. `npm` workspaces (`workspaces: ["phase-*"]`) is the minimal `§22.5` migration per `BLUEPRINT.md:9` Phase Architecture.

**[PRECEDENT]** `npm` workspaces vs `pnpm` vs `yarn`: `npm` is the default for `phase-01-foundation` (`package.json` uses `npm` `package-lock.json`, not `pnpm-lock.yaml`), so `npm` workspaces is the precedent.

**[INFERENCE]** Phase 9 `workspaces` should be `npm` `workspaces: ["phase-*"]` with `private:true`, `packageManager: "npm@10"` or `null` (not `pnpm@9` without separate decision), `engines.node >=22.9.0`.

---

### R9.3 — Shared configs without modifying frozen phases

**[FACT]** `phase-01-foundation/tsconfig.json` is per-phase (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), `eslint.config.js` is per-phase, `prettier.config.mjs` is per-phase. `BLUEPRINT.md:10` requires each phase to have its own implementation, but `ISSU_PROJECT.md:17` prohibits `tsconfig` paths workaround.

**[INFERENCE]** Phase 9 shared configs should be **additional** root files (`tsconfig.base.json`, `eslint.config.js` at root, `prettier.config.mjs` at root) that per-phase configs can `extends` **only if** Owner authorizes modifying frozen `phase-0X/tsconfig.json` to add `extends: "../tsconfig.base.json"` — but `DEFINE.md:8` says Phase 9 SHALL NOT modify frozen `phase-0X/tsconfig.json` to extend root base. Therefore Phase 9 minimal should **not** require modifying frozen `tsconfig.json`; root base is *additional*, not replacement, and per-phase `tsconfig.json` remains authoritative. Shared configs are *available* but not *required* for frozen phases.

---

### R9.4 — Unified verification wiring

**[FACT]** `phase-01-foundation/package.json:scripts` `check: "npm run typecheck && npm run lint && npm run format:check && npm test"`, `typecheck: "tsc --noEmit"`, `build: "tsc -p tsconfig.build.json"`, `test: "vitest run"`, `test:coverage: "vitest run --coverage"`.

**[PRECEDENT]** No `check:all` exists — Phase 9 will be the first to define it.

**[INFERENCE]** Phase 9 `check:all` should be `npm --workspaces run check` or `for p in phase-*; do (cd $p && npm run check); done` via `node` script, with `build:all` and `test:coverage:all` similarly, run in CI `.github/workflows/ci.yml` as `workspaces` matrix.

---

### R9.5 — Migration audit verification

**[FACT]** `phase-02/src/internal/runtime.ts:48,53` `isContained` enforcement on `readFile`, `phase-06/src/internal/cli.ts:200` `isContained` before `readFile`, `phase-01-foundation/src/paths/contain.ts` `assertContained`.

**[INFERENCE]** Phase 9 `migrate.ts` should verify: `file:../phase-0X` still resolves via `workspaces` symlink (`require.resolve("@issue/foundation")` from root), `exports` map still blocks `from "@issue/foundation/dist/*"` (`ERR_PACKAGE_PATH_NOT_EXPORTED`), no `require`, no deep imports, `workspaces` symlink exists at `node_modules/@issue/foundation`.

---

### R9.6 — Phase independence preservation

**[FACT]** `BLUEPRINT.md:10` Phase independence is one of the most important goals; `ISSU_PROJECT.md:30` Frozen phases remain frozen.

**[INFERENCE]** Phase 9 migration must preserve independence: every `phase-0X/src` still has its own `package.json`, `tsconfig.json`, `vitest.config.ts`, `tests/`; no phase depends on another's `src/` or `internal` — only on `file:` via workspaces symlink (which is an implementation of `file:`, not a deep import).

---

### R9.7 — Determinism for workspace installs

**[FACT]** `phase-01-foundation/package-lock.json` is the lockfile for `npm` installs; `npm ci` is deterministic where `package-lock.json` is committed.

**[INFERENCE]** Phase 9 workspace installs are deterministic where `package-lock.json` is committed at root and per-phase `package-lock.json` are preserved (not deleted). `npm install` at root with `workspaces` is deterministic if `package-lock.json` is present and `save-exact=true` (already `phase-01-foundation/.npmrc` `save-exact=true`).

---

### R9.8 — Security for workspace

**[FACT]** `ISSU_PROJECT.md:23` lists `process execution` and `command injection` as vectors; `BLUEPRINT.md:17` lists `Network access`, `Process execution`.

**[INFERENCE]** Phase 9 workspace introduces new vectors: `npm` script execution (`preinstall`/`postinstall` scripts in `package.json`), `workspaces` symlink, `lockfile` supply chain. `npm --workspaces run check` should be `spawn` with `shell: false`, no `eval`, `audit` via `Logger`, no new `fs.write` beyond migration audit.

---

### R9.9 — pnpm vs npm vs yarn precedent

**[FACT]** All phases `01-08` use `npm` `package-lock.json`, not `pnpm-lock.yaml` or `yarn.lock`; `phase-01-foundation/.npmrc` `save-exact=true` is `npm` precedent.

**[PRECEDENT]** No `turbo`/`lerna`/`nx`/`changesets` exists — Phase 9 will be the first to consider them, but `DEFINE.md:8` says no `turbo`/`lerna`/`nx` without separate decision.

**[INFERENCE]** Phase 9 minimal uses `npm` workspaces, not `pnpm` store, not `turbo` — extensions via future phase.

---

### R9.10 — Deferred items remaining outside scope

**[DURABLE FACT]** Deferred per `phase-08/DEFINE.md:12` and `phase-08/FREEZE_REPORT.md:10`: Future Scope domains (Research already Phase 4, Data and analytics already Phase 5, plus Education/Business/Scientific/Robotics/Engineering/Creative/Personal productivity/Specialized industry) — all remain Future Scope, not Phase 9.

**[NEW DEFINE DECISION]** Phase 9 resolves §22.5 only; Future Scope remains deferred (see `phase-09/DEFINE.md:12`).

---

### R9.11 — Security implications

**[FACT]** `BLUEPRINT.md:17` 11 vectors + `ISSU_PROJECT.md:799-847` 22 vectors: trust boundaries, input validation, path traversal, filesystem access, external data, network, process exec, Git, write/edit/delete, command injection, deserialization, secret exposure, permission boundaries, deny-by-default, etc.

**[INFERENCE]** Phase 9 introduces new vectors: `workspaces` symlink (path traversal via `isContained` on `workspaces` manifest), `lockfile` supply chain ( `npm audit` ), `script` execution (`preinstall`/`postinstall` in `package.json` should be `npm config ignore-scripts` or `audit`).

---

### R9.12 — Engineering trade-offs

**[FACT]** Phase 1 `phase-01-foundation/DECISIONS.md:D4` evaluated config layering; Phase 8 `phase-08/ARCHITECTURE.md:Q8.12` chose model-independent provider binding.

**[INFERENCE]** Phase 9 trade-off: **npm workspaces minimal** (pros: minimal `workspaces: ["phase-*"]`, no `turbo`/`pnpm`, preserve per-phase `tsconfig.json`, deterministic where `package-lock.json` is committed, no `tsconfig` paths workaround) vs **rich monorepo with turbo + pnpm + changesets** (cons: complexity, requires modifying frozen `tsconfig.json` to extend root base, violates `ISSU_PROJECT.md:17` No-Workaround if using paths). Choose minimal: `npm` workspaces, root `tsconfig.base.json` *additional*, not replacement, per-phase `tsconfig.json` remains authoritative.

---

## 7. Evidence Classification Legend

Every finding above is tagged:

- **FACT** — verified durable artifact or frozen contract
- **PRECEDENT** — established project governance precedent from prior accepted stage
- **INFERENCE** — reasoned conclusion from facts; not directly stated
- **UNRESOLVED** — requires Architecture/Specification + Owner approval

No inference is treated as fact; no implementation behavior is treated as requirement.

---

## 8. Deferred/Non-Goal Handling

All deferred items per `phase-09/DEFINE.md:12` are preserved as **UNRESOLVED** and will be carried forward to Architecture/Specification as `SPECIFICATION INPUT / UNRESOLVED` (Specification firewall). No deferred item is silently resolved by this Research.

---

## 9. Research Completion Audit

**[NEW RESEARCH DECISION — REQUIRES OWNER ACCEPTANCE]** This Research stage is complete only when:

1. This record exists and satisfies Research authorization elements (questions R9.1-12 addressed, evidence traceable, FACT/PRECEDENT/INFERENCE/UNRESOLVED preserved, conflicts preserved, deferred preserved, no architecture decisions smuggled, frozen boundaries untouched, no implementation started).
2. Owner reviews this record and **explicitly accepts** it in a separate Owner decision (file edit to `Status: ACCEPTED` + End-of-Document block).
3. No Architecture, Specification, Implementation, Test, Refactor, or Freeze work has begun under this authorization.

Progression to Architecture requires a separate Owner decision; it is NOT implied by acceptance of this Research.

---

## 10. Unresolved Items Carried Forward

- Historical Phase 9 records: NONE (verified none exists).
- Exact public API (workspace manifest `workspaces` list, `packageManager` field, `scripts: check:all` implementation, `tsconfig.base.json` location, `migrateWorkspace` signature) remains **UNRESOLVED** — to be decided at ARCHITECTURE/SPECIFICATION.
- Whether Phase 4 (`@issue/research`) is consumed by workspace — default no, remains UNRESOLVED until Specification.
- §22.5 workspace/monorepo: still DEFERRED until Architecture/Specification.
- TS2307 defect: out-of-scope, carried as UNRESOLVED.

---

## 11. Traceability

| Element | Source |
| --- | --- |
| R9.1 frozen contracts | `phase-01-foundation/src/index.ts`, `phase-02/src/index.ts`, `phase-03/src/index.ts`, `phase-05/src/index.ts`, `phase-06/src/index.ts`, `phase-07/src/index.ts`, `phase-08/src/index.ts` |
| R9.2 workspace manifest | `phase-01-foundation/package.json` (no workspaces), `phase-06/package.json` (file:../phase-0X) |
| R9.3 shared configs | `phase-01-foundation/tsconfig.json`, `phase-01-foundation/eslint.config.js` |
| R9.4 unified verification | `phase-01-foundation/package.json:scripts` `check`, `phase-06/FREEZE_REPORT.md:12-13` |
| R9.5 migration audit | `phase-02/src/internal/runtime.ts:48,53` `isContained`, `phase-01-foundation/src/paths/contain.ts` |
| R9.6 independence | `BLUEPRINT.md:10`, `ISSU_PROJECT.md:30` |
| R9.7 determinism | `phase-01-foundation/package-lock.json` |
| R9.8 security | `ISSU_PROJECT.md:23`, `BLUEPRINT.md:17` |
| R9.9 pnpm vs npm | `phase-01-foundation/.npmrc` `save-exact=true`, `phase-01-foundation/package-lock.json` |
| R9.10 deferred | `phase-08/DEFINE.md:12`, `phase-09/DEFINE.md:12` |
| R9.11 security vectors | `ISSU_PROJECT.md:799-847`, `BLUEPRINT.md:17` |
| R9.12 trade-offs | `phase-01-foundation/DECISIONS.md:D4`, `phase-08/ARCHITECTURE.md:Q8.12` |

---

## 12. Non-Authorization Statement

This Research authorizes **RESEARCH ONLY**. The following are NOT authorized and must not begin without a separate Owner decision:

- **Architecture** (no `ARCHITECTURE.md`/`DECISIONS.md` creation).
- **Specification** (no `SPECIFICATION.md`).
- **Implementation** (no `phase-09/src/**`, `phase-09/tests/**`, `phase-09/package.json`, tsconfigs, dependencies).
- **Test**, **Refactor**, **Freeze**, **Next Phase**, TS2307 fix, frozen-phase modification, Future Scope domain beyond workspace, Phase 10 work.

---

## 13. End-of-Document Block

```
PHASE 9 RESEARCH RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 9 RESEARCH STAGE: ACCEPTED — ARCHITECTURE AUTHORIZED (owner, 2026-08-22)
HISTORICAL RESEARCH RECOVERED: NO (none exists; not reconstructed)
ARCHITECTURE AUTHORIZED: YES (owner, 2026-08-22)
SPECIFICATION AUTHORIZED: NO
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6/7/8 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 10 WORK STARTED: NO
COMMIT/PUSH: NO
```
