# ISSU — Phase 9: Workspace & Monorepo Migration — Architecture Decisions

**Phase:** 9 — Workspace & Monorepo Migration
**Stage:** ARCHITECTURE (owner-authorized 2026-08-22)
**Status:** Draft — records the architectural decisions made in `./ARCHITECTURE.md`; decisions become **Approved** at Architecture acceptance and **Frozen** at the Phase 9 phase freeze
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative specification:** `./ARCHITECTURE.md`
**License:** Apache License 2.0

This file records the **genuinely non-obvious architectural decisions** made by the Phase 9 ARCHITECTURE stage. Per BLUEPRINT §7.11 and §30, each decision includes Decision, Context, Evidence, Alternatives, Rationale, Consequences, and Status. Decision IDs are stable references used across the Phase 9 documents.

No decision here contradicts the frozen Phase 1,2,3,5,6,7,8 contracts, which remain authoritative. No decision resolves a Future Scope domain without separate Owner authorization beyond DEFINE's §22.5.

---

## AD-9.1 — Phase 9 consumes frozen contracts barrel-only

- **Decision:** Phase 9 consumes Phase 1 (`@issue/foundation`), Phase 2 (`@issue/tool-runtime`), Phase 3 (`@issue/integration`), Phase 5 (`@issue/analytics`), Phase 6 (`@issue/config-cli`), Phase 7 (`@issue/write-execution`), and Phase 8 (`@issue/model-provider`) **only through their public package barrels**, with zero deep imports.
- **Context:** Phase 8 AD-8.1 established barrel-only consumption for seven consumers (1/2/3/5/6/7) — Phase 9 now consumes eight.
- **Evidence:** FACT — Phase 8 `ARCHITECTURE.md:3.1-3.7`; PRECEDENT — Phase 8 AD-8.1 (`phase-08/DECISIONS.md:AD-8.1`); R9.1.
- **Alternatives:** (1) deep imports of internal modules; (2) reimplementing frozen behavior in Phase 9.
- **Rationale:** Preserves phase isolation, contract stability, and frozen-phase integrity.
- **Consequences:** Any behavior needed from frozen phase must be reachable via public exports.
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-9.2 — npm workspaces ["phase-*"] + private:true + packageManager npm@10

- **Decision:** Root `package.json` with `private:true`, `workspaces: ["phase-*", "phase-01-foundation", "phase-02", "phase-03", "phase-04", "phase-05", "phase-06", "phase-07", "phase-08", "phase-09"]` (explicit, not `"phase-*" `glob with dash), `packageManager: "npm@10"`, `engines.node >=22.9.0`, `scripts: { "check:all": "npm --workspaces run check", "build:all": "npm --workspaces run build", "test:all": "npm --workspaces run test" }`.
- **Context:** No root `workspaces` exists in frozen phases — all phases `01-08` are phase-scoped (`phase-0X/package.json` with `file:../phase-0Y` refs), no monorepo. `npm` is the precedent (`phase-01-foundation` `package-lock.json`).
- **Evidence:** FACT — `phase-01-foundation/package.json` (no workspaces), `phase-08/package.json` (`file:../phase-07`); R9.2.
- **Alternatives:** (1) `pnpm` `workspaces: ["phase-*"]` + `pnpm-lock.yaml` (rejected: `phase-01` uses `npm`).
- **Rationale:** `npm` is the default for `phase-01-foundation`, `save-exact=true` is `npm` precedent, minimal `workspaces: ["phase-*"]`, no `turbo`/`pnpm` without separate decision.
- **Consequences:** `npm install` at root via workspaces, `npm --workspaces` runs `check` in each workspace, `package-lock.json` at root.
- **Status:** Draft.

---

## AD-9.3 — Root tsconfig.base.json additional, not replacement, no frozen modification

- **Decision:** Root `tsconfig.base.json` (`target ES2022`, `lib ES2022`, `module NodeNext`, `strict true`, etc.) + `eslint.config.js` (flat config) + `prettier.config.mjs` are *additional* files at repo root, not *replacements*; per-phase `tsconfig.json` remains unchanged; `migrate.ts` verifies that per-phase `tsconfig.json` still passes `tsc --noEmit` without extending root base.
- **Context:** `phase-01-foundation/tsconfig.json` is per-phase, `ISSU_PROJECT.md:17` No-Workaround Rule prohibits `tsconfig` paths workaround, `DEFINE.md:8` says SHALL NOT modify frozen `phase-0X/tsconfig.json` to extend root base.
- **Evidence:** FACT — `phase-01-foundation/tsconfig.json` per-phase, `DEFINE.md:8`; R9.3.
- **Alternatives:** (1) Modify `phase-0X/tsconfig.json` to `extends: "../tsconfig.base.json"` (rejected: modifies frozen).
- **Rationale:** No frozen modification, `tsconfig.base.json` is available for Phase 10+ but not required, `migrate.ts` verifies per-phase `tsconfig.json` still passes.
- **Consequences:** No frozen modification, root base is available for future.
- **Status:** Draft.

---

## AD-9.4 — Unified verification via execProcess npm --workspaces run check

- **Decision:** `checkAll.ts` `runCheckAll(repoPath) → Promise<Result<{passed: string[], failed: string[]}, AppError>>` that `execProcess("npm", ["--workspaces", "run", "check"], {cwd: repoPath, allowExec: true})` with `isContained(cwd, repoPath)` check.
- **Context:** `phase-01-foundation/package.json:scripts` `check: "npm run typecheck && npm run lint && npm run format:check && npm test"`, R9.4.
- **Evidence:** FACT — `phase-01-foundation/package.json:scripts` `check`; R9.4.
- **Alternatives:** (1) `for p in phase-*; do (cd $p && npm run check); done` via `node:fs` (rejected: manual).
- **Rationale:** Unified verification, `ISSU_PROJECT.md:20` verification discipline, auditable, `shell: false`.
- **Consequences:** `check:all`, `build:all`, `test:coverage:all` via `npm --workspaces`, in CI `.github/workflows/ci.yml` as `workspaces` matrix.
- **Status:** Draft.

---

## AD-9.5 — Migration audit via verifyWorkspaces (exports map)

- **Decision:** `migrate.ts` `verifyWorkspaces(repoPath) → Promise<Result<true, AppError>>` that `execProcess("node", ["-e", "import('@issue/foundation')"], {cwd: repoPath})` and `execProcess("node", ["-e", "import('@issue/foundation/dist/index.js')"], {cwd: repoPath})` expecting second to throw `ERR_PACKAGE_PATH_NOT_EXPORTED` (verifies `exports` map still blocks deep imports).
- **Context:** `phase-02/src/internal/runtime.ts:48,53` `isContained` enforcement, R9.5.
- **Evidence:** FACT — `phase-02/src/internal/runtime.ts:48,53` `isContained`; R9.5.
- **Alternatives:** (1) No audit (rejected: not observable).
- **Rationale:** Migration is verifiable, `exports` map preserved, `workspaces` symlink exists at `node_modules/@issue/foundation`.
- **Consequences:** `verifyWorkspaces` with `Result` `issue.workspace.*`.
- **Status:** Draft.

---

## AD-9.6 — Phase independence preserved (per-phase package.json, tsconfig, tests)

- **Decision:** Every `phase-0X/src` still has its own `package.json`, `tsconfig.json`, `vitest.config.ts`, `tests/`; no phase depends on another's `src/` or `internal` — only on `file:` via workspaces symlink (which is an implementation of `file:`, not a deep import) — per `BLUEPRINT.md:10` and `ISSU_PROJECT.md:30`.
- **Context:** `BLUEPRINT.md:10` Phase independence is one of the most important goals; `ISSU_PROJECT.md:30` Frozen phases remain frozen.
- **Evidence:** FACT — `BLUEPRINT.md:10`, `ISSU_PROJECT.md:30`; R9.6.
- **Alternatives:** (1) Single `src/` at root (rejected: violates independence).
- **Rationale:** Preserves independence, `workspaces` is an implementation of `file:`, not a deep import.
- **Consequences:** Every phase remains independently testable, replaceable.
- **Status:** Draft.

---

## AD-9.7 — Future Scope domains remain DEFERRED

- **Decision:** No decision here resolves Future Scope domains (Research already Phase 4, Data and analytics already Phase 5, plus Education/Business/Scientific/Robotics/Engineering/Creative/Personal productivity/Specialized industry). They remain **DEFERRED** and appear as **UNRESOLVED** in Architecture Q9.6.
- **Context:** `phase-09/DEFINE.md:12` explicitly defers them.
- **Evidence:** FACT — `phase-09/DEFINE.md:12`; R9.10.
- **Alternatives:** (1) Resolve them now (rejected: requires separate Owner authorization).
- **Rationale:** Keeps Phase 9 scope disciplined.
- **Consequences:** Future phase can address domains without Phase 9 being blocked.
- **Status:** Draft.

---

## Status Summary

All 7 decisions are **Draft** — awaiting Architecture acceptance. At Architecture acceptance they become **Approved**; at Phase 9 freeze they become **Frozen**.
