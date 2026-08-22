# ISSU — Phase 9: Workspace & Monorepo Migration — Architecture

**Phase:** 9 — Workspace & Monorepo Migration
**Stage:** ARCHITECTURE (owner-authorized 2026-08-22)
**Status:** ACCEPTED — Owner accepted the Phase 9 Architecture (owner, 2026-08-22)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative inputs:** Accepted Phase 9 DEFINE (`./DEFINE.md`, ACCEPTED 2026-08-22); completed Phase 9 Research (`./RESEARCH.md`, R9.1-12, ACCEPTED 2026-08-22); frozen Phase 1,2,3,5,6,7,8 contracts; Phase 4 CLOSED/FROZEN
**License:** Apache License 2.0

---

## 1. Purpose & Position

This document records the **architecture** of the Phase 9 Workspace & Monorepo Migration Module. It follows BLUEPRINT §11 lifecycle position: after **Research** (R9.1-12 accepted) and before **Specify**.

- The domain is **Workspace & Monorepo Migration** (accepted DEFINE, 2026-08-22), a migration from 8 phase-scoped `file:../phase-0X` packages to a single `npm` workspaces monorepo with root `package.json` `workspaces: ["phase-*"]`, shared `tsconfig.base.json`, `eslint`/`prettier`/`vitest` configs, and unified `npm run check:all` via `npm --workspaces`, while preserving phase independence via barrel-only contracts.
- Accepted DEFINE + completed RESEARCH are the governing inputs.
- This document determines **what the module is**, **what it consumes**, **how it is decomposed**, and **which decisions remain open** for Specification and Owner approval.
- It does NOT finalize public API, exact schemas, thresholds, scoring, implementation technology, or model/provider choices. Those are **SPECIFICATION INPUT / UNRESOLVED** (Specification firewall).
- It does NOT resolve Future Scope domains unless stated otherwise.

---

## 2. How to Read This Document

Every decision is labeled with one of:

| Label | Meaning |
| --- | --- |
| **FACT** | Verified repository/contract fact (frozen Phase 1/2/3/5/6/7/8, BLUEPRINT, DEFINE, RESEARCH) |
| **PRECEDENT** | Established project/governance precedent from prior accepted stage (Phase 6/7/8) |
| **INFERENCE** | Reasoned conclusion from facts; not directly stated |
| **ARCHITECTURE DECISION** | A decision this Architecture stage makes within its authority |
| **UNRESOLVED** | Not decidable here; requires Specification and/or Owner approval |

Each architecture question (Q9.1-9.12) records: problem, research evidence, alternatives (≥2 where meaningful), chosen approach, rationale, consequences, rejected alternatives, and unresolved implications.

**Specification firewall:** exact public API, exports, data schemas, test/acceptance/benchmark thresholds, pass/fail formulas, scoring formulas, implementation dependencies, and implementation technology are NOT finalized here. They are recorded as **SPECIFICATION INPUT / UNRESOLVED**.

---

## 3. Consumed Contracts (frozen)

**[FACT]** Phase 9 consumes the following frozen public surfaces, **barrel-only** (no deep imports), consistent with Phase 8 precedent:

### 3.1 Phase 1 — `@issue/foundation` (frozen)

**[FACT]** Public barrel (`phase-01-foundation/src/index.ts`): `VERSION`, `AppError`, `Result`, `LogLevel`, `IssueConfig`, `LoadConfigOptions`, `loadConfig`, `mergeConfigLayers`, `EnvSnapshot`, `readEnv`, `getSecret`, `redactionList`, `Logger`, `createLogger`, `assertContained`, `isContained`.

### 3.2 Phase 2 — `@issue/tool-runtime` (frozen)

**[FACT]** Public barrel (`phase-02/src/index.ts`): `TaskStatus`, `ToolOperation`, `ActionRef`, `ReadOptions`, `ListOptions`, `OutcomeClass`, `CorrectionDirection`, `FileContent`, `DirectoryEntry`, `DirectoryListing`, `ToolResult`, `TaskRefs`, `ResourceBounds`, `TaskOptions`, `TaskState`, `AvailableAction`, `DecisionProvider`, `Assessment`, `TaskResult`, `ToolRuntime`; functions `runTask`, `createToolRuntime`, `deriveAvailableActions`.

### 3.3 Phase 3 — `@issue/integration` (frozen, CLOSED)

**[FACT]** Public barrel (`phase-03/src/index.ts`): `runIntegrationTask`.

### 3.4 Phase 5 — `@issue/analytics` (frozen)

**[FACT]** Public barrel (`phase-05/src/index.ts`): `runAnalyticsTask` + 13 types.

### 3.5 Phase 6 — `@issue/config-cli` (frozen)

**[FACT]** Public barrel (`phase-06/src/index.ts`): `ConfigSchema`, `ResolvedConfig`, `ConfigProvenance`, `CliArgs`, `CliResult`, `resolveConfig`, `verifyConfig`, `getDefaultConfig`, `parseArgs`, `runCli`, `HELP_TEXT`, `createCliLogger`.

### 3.6 Phase 7 — `@issue/write-execution` (frozen)

**[FACT]** Public barrel (`phase-07/src/index.ts`): `writeFile`, `editFile`, `deleteFile`, `execProcess`, `gitStatus`, `gitDiff`, `gitCommit`, `gitBranch`, `httpFetch`, `createToolLogger`.

### 3.7 Phase 8 — `@issue/model-provider` (frozen)

**[FACT]** Public barrel (`phase-08/src/index.ts`): `ProviderConfig`, `ModelProvider`, `ModelRouter`, `createAnthropicProvider`, `createOpenAIProvider`, `createLocalProvider`, `createModelRouter`, `callModel`, `getProviderAuth`.

### 3.8 Phase 4 — `@issue/research` (CLOSED/FROZEN, NOT consumed)

**[FACT]** Phase 4 (`@issue/research`) is NOT consumed by default per `phase-09/DEFINE.md:11`.

---

## 4. Module Decomposition

**[ARCHITECTURE DECISION]** Phase 9 is decomposed into exactly three internal modules, plus the public barrel:

- **workspace/** — `manifest.ts` (`verifyWorkspaces` + `migrateWorkspace` helpers, checks `workspaces: ["phase-*"]` + `packageManager` + `engines` + `scripts: check:all/build:all`), `audit.ts` (`auditWorkspaces` verifying `file:../phase-0X` still resolves via `workspaces` symlink, `exports` map still blocks `from "@issue/foundation/dist/*"`)
- **config/** — `base.ts` (`tsconfig.base.json` content as `TsConfigBase`, `eslint.base.js` content as `EslintBase`, `prettier.base.js` content)
- **verify/** — `checkAll.ts` (`runCheckAll` via `execProcess` `npm --workspaces run check` with `shell: false`, `timeout`, `maxBytes`)

**[PRECEDENT]** Phase 8 decomposed into 4 modules (provider, router, auth, call) — Phase 9 is 3, per `BLUEPRINT.md:178-183`.

---

## 5. Architecture Questions

### Q9.1 — What is the Workspace Manifest Shape?

**Problem:** No root `workspaces` exists; need `package.json` `workspaces: ["phase-*"]` + `packageManager` + `engines`.

**Research evidence:** `phase-01-foundation/package.json` (no workspaces), `phase-08/package.json` (`file:../phase-07`), R9.2.

**Alternatives:** (1) `pnpm` `workspaces: ["phase-*"]` + `pnpm-lock.yaml` (rejected: `phase-01` uses `npm` `package-lock.json`). (2) `npm` `workspaces: ["phase-*"]` + `private:true` + `packageManager: "npm@10"` (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** Root `package.json` with `private:true`, `workspaces: ["phase-*", "phase-01-foundation", "phase-02", "phase-03", "phase-04", "phase-05", "phase-06", "phase-07", "phase-08", "phase-09"]` (explicit, not `"phase-*" `glob with dash), `packageManager: "npm@10"`, `engines.node >=22.9.0`, `scripts: { "check:all": "npm --workspaces run check", "build:all": "npm --workspaces run build", "test:all": "npm --workspaces run test" }`.

**Consequences:** `npm install` at root via workspaces, `npm --workspaces` runs `check` in each workspace, `package-lock.json` at root (not per-phase deletion).

**Rejected:** `pnpm`.

**Unresolved:** `workspaces` explicit list vs `phase-*` glob, `packageManager` exact version.

---

### Q9.2 — How are Shared Configs Structured Without Modifying Frozen Phases?

**Problem:** `ISSU_PROJECT.md:17` No-Workaround Rule prohibits `tsconfig` paths, fake packages; `DEFINE.md:8` says SHALL NOT modify frozen `phase-0X/tsconfig.json` to extend root base.

**Research evidence:** `phase-01-foundation/tsconfig.json` per-phase, R9.3, `DEFINE.md:8`.

**Alternatives:** (1) Modify `phase-0X/tsconfig.json` to `extends: "../tsconfig.base.json"` (rejected: modifies frozen). (2) Root `tsconfig.base.json` *additional*, per-phase `tsconfig.json` remains authoritative, root `tsconfig.base.json` is *available* but not *required* (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** Root `tsconfig.base.json` (`target ES2022`, `lib ES2022`, `module NodeNext`, `strict true`, etc.) + `eslint.config.js` (flat config) + `prettier.config.mjs` are *additional* files at repo root, not *replacements*; per-phase `tsconfig.json` remains unchanged; `migrate.ts` verifies that per-phase `tsconfig.json` still passes `tsc --noEmit` without extending root base.

**Consequences:** No frozen modification, `tsconfig.base.json` is available for Phase 10+ but not required.

**Rejected:** Modify frozen.

**Unresolved:** Root `tsconfig.base.json` location, `eslint` flat config extends.

---

### Q9.3 — How is Unified Verification Wired?

**Problem:** No `check:all` exists; need `npm --workspaces run check` via `execProcess`.

**Research evidence:** `phase-01-foundation/package.json:scripts` `check: "npm run typecheck && npm run lint && npm run format:check && npm test"`, R9.4.

**Alternatives:** (1) `for p in phase-*; do (cd $p && npm run check); done` via `node:fs` (rejected: manual). (2) `execProcess("npm", ["--workspaces", "run", "check"], {allowExec: true, cwd: repoRoot})` with `shell: false`, `timeout`, `maxBytes` (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `checkAll.ts` `runCheckAll(repoPath) → Promise<Result<{passed: string[], failed: string[]}, AppError>>` that `execProcess("npm", ["--workspaces", "run", "check"], {cwd: repoPath, allowExec: true})` with `isContained(cwd, repoPath)` check.

**Consequences:** Unified verification, `ISSU_PROJECT.md:20` verification discipline, auditable.

**Rejected:** Manual.

**Unresolved:** `check:all` vs `test:coverage:all` threshold aggregation.

---

### Q9.4 — How is Migration Audit Verified?

**Problem:** Need to verify `file:../phase-0X` still resolves via workspaces symlink and `exports` map still blocks deep imports.

**Research evidence:** `phase-02/src/internal/runtime.ts:48,53` `isContained`, `phase-06/src/internal/cli.ts:200` `isContained`, R9.5.

**Alternatives:** (1) No audit (rejected: not observable). (2) `migrate.ts` `verifyWorkspaces(repoPath) → Promise<Result<true, AppError>>` that `execProcess("node", ["-e", "import('@issue/foundation')"], {cwd: repoPath})` and `execProcess("node", ["-e", "import('@issue/foundation/dist/index.js')"], {cwd: repoPath})` expecting second to throw `ERR_PACKAGE_PATH_NOT_EXPORTED` (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `verifyWorkspaces` as above, `Result` with `issue.workspace.*` codes.

**Consequences:** Migration is verifiable, `exports` map preserved.

**Rejected:** No audit.

**Unresolved:** `verifyWorkspaces` exact command, `node` version.

---

### Q9.5 — How is Phase Independence Preserved?

**[ARCHITECTURE DECISION]** Every `phase-0X/src` still has its own `package.json`, `tsconfig.json`, `vitest.config.ts`, `tests/`; no phase depends on another's `src/` or `internal` — only on `file:` via workspaces symlink (which is an implementation of `file:`, not a deep import) — per `BLUEPRINT.md:10` and `ISSU_PROJECT.md:30`.

---

### Q9.6 — What Remains Deferred?

Per DEFINE §12, **[ARCHITECTURE DECISION]** Future Scope domains (Research already Phase 4, Data and analytics already Phase 5, plus Education/Business/Scientific/Robotics/Engineering/Creative/Personal productivity/Specialized industry) remain **DEFERRED** and appear here as **UNRESOLVED**: no domain beyond workspace.

---

### Q9.7 — What is the Public Barrel?

**[UNRESOLVED]** Exact exports are Specification firewall: proposed `export { verifyWorkspaces, migrateWorkspace }` + `export { runCheckAll, runBuildAll }` — but final list is SPECIFICATION INPUT, not decided here. Only constraint: barrel exports NOTHING from frozen phases' internals.

---

### Q9.8 — How is Failure Handled?

**[ARCHITECTURE DECISION]** Every fallible operation returns `Result<T, AppError>` with `issue.workspace.*` codes: `issue.workspace.not-contained`, `issue.workspace.validation`, `issue.workspace.not-found`, `issue.workspace.exec-failed`.

---

### Q9.9 — How is Testing Structured?

**[ARCHITECTURE DECISION]** Tests under `phase-09/tests/`: `workspace.test.ts` (manifest `workspaces: ["phase-*"]` + `private:true`), `migrate.test.ts` (`verifyWorkspaces` with real `node --workspaces` via `execProcess` mocked), `public-api.test.ts`, `determinism.test.ts` ( `verifyWorkspaces` deterministic where `package-lock.json` is committed), `seam.integration.test.ts` (real `npm --workspaces` with `tmp` repo). Coverage gate **≥80%** (Vitest v8, `include: ["src/**/*.ts"]`).

---

## 6. Decisions Summary

| ID | Decision | Status |
| --- | --- | --- |
| AD-9.1 | Consume frozen contracts barrel-only (1/2/3/5/6/7/8) | Draft |
| AD-9.2 | npm workspaces ["phase-*"] + private:true + packageManager npm@10 | Draft |
| AD-9.3 | Root tsconfig.base.json additional, not replacement, no frozen modification | Draft |
| AD-9.4 | Unified verification via execProcess npm --workspaces run check | Draft |
| AD-9.5 | Migration audit via verifyWorkspaces (exports map) | Draft |
| AD-9.6 | Phase independence preserved (per-phase package.json, tsconfig, tests) | Draft |
| AD-9.7 | Future Scope domains remain DEFERRED | Draft |

All decisions become **Approved** at Architecture acceptance and **Frozen** at Phase 9 freeze.

---

## 7. Specification Firewall

Exact public API, exports, data schemas, test/acceptance/benchmark thresholds, pass/fail formulas, scoring formulas, implementation dependencies, and implementation technology are **NOT finalized here**. They are recorded as **SPECIFICATION INPUT / UNRESOLVED** and will be decided at Specification with Owner approval.

---

## 8. Security Considerations

Architecture preserves `ISSU_PROJECT.md:799-847` vectors: no `fs.write` beyond migration audit (only `verifyWorkspaces` reads), no `child_process` beyond `npm --workspaces` via `execProcess` with `shell:false`, no `fetch`, no credential exposure. Detailed verification at Security Audit (post-implementation).

---

## 9. End-of-Document Block

```
PHASE 9 ARCHITECTURE RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 9 ARCHITECTURE STAGE: ACCEPTED — SPECIFICATION AUTHORIZED (owner, 2026-08-22)
SPECIFICATION AUTHORIZED: YES (owner, 2026-08-22)
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6/7/8 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 10 WORK STARTED: NO
COMMIT/PUSH: NO
```
