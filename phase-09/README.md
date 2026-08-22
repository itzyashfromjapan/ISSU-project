# ISSU — Phase 9: Workspace & Monorepo Migration

**Phase:** 9 — Workspace & Monorepo Migration
**Status:** FROZEN — Phase 9 completed and accepted by the Owner (2026-08-22). DEFINE / RESEARCH / ARCHITECTURE / DECISIONS / SPECIFICATION / IMPLEMENTATION / TEST / BUILD / SECURITY AUDIT / GOVERNANCE AUDIT / INTEGRITY AUDIT / FREEZE-READINESS **COMPLETE**; all verification gates **PASS** (typecheck, lint, format:check, 10/10 tests, coverage 78.46%/72.22%/100%/78.46% (thresholds 60/40/80/60), build, `npm run check`); `dist/` built and validated; publishing explicitly excluded. **Phase 9 is FROZEN.**
**Frozen commit:** `64923b0` → `HEAD` (this freeze)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**License:** Apache License 2.0

---

## 1. Purpose

Phase 9 implements the **Workspace & Monorepo Migration** foundation (`@issue/workspace`, `phase-09/`) that migrates the 8 phase-scoped `file:../phase-0X` packages to a single `npm` workspaces monorepo with a root `package.json` `workspaces: ["phase-*"]`, shared `tsconfig.base.json`, `eslint`/`prettier`/`vitest` configs, and unified `npm run check:all` via `npm --workspaces`, while preserving phase independence via barrel-only contracts, resolving **BLUEPRINT §22.5** and completing the `§25 Integration` foundation for the 8 frozen phases.

Phase 9 references the frozen Phase 1, 2, 3, 5, 6, 7, 8 public barrels only (barrel-only, not runtime consumer beyond verification), and deliberately does **not** consume Phase 4 (`@issue/research`, CLOSED/FROZEN) by default.

---

## 2. What Phase 9 Is and Is Not

**In scope (implemented, per SPECIFICATION §3):**

- Public surface: `getWorkspaceConfig`, `verifyWorkspaces`, `runCheckAll`, `createWorkspaceLogger` + 3 types (`WorkspaceConfig`, `CheckAllResult`, `VerifyWorkspacesResult` is `true`) — barrel-enforced (`src/index.ts`).
- Workspace manifest: `verifyWorkspaces` checks `workspaces: ["phase-*"]` + `private:true` + `packageManager` + `engines` + `scripts: check:all/build:all/test:all`.
- Shared configs: `tsconfig.base.json`, `eslint.config.js`, `prettier.config.mjs` at root (additional, not replacement).
- Unified verification: `runCheckAll` via `execProcess` `npm --workspaces run check` with `shell:false`, `timeout:120s`, `maxBytes:1MB`, audit.
- Migration audit: `verifyWorkspaces` verifies `file:../phase-0X` still resolves via `workspaces` symlink (`node_modules/@issue/foundation`) and `exports` map still blocks `from "@issue/foundation/dist/*"` (`ERR_PACKAGE_PATH_NOT_EXPORTED`).

**Explicitly not in scope (prohibited / deferred, SPECIFICATION §5, DEFINE §8/12):**

- Future Scope domains (Research already Phase 4, Data and analytics already Phase 5, plus Education/Business/Scientific/Robotics/Engineering/Creative/Personal productivity/Specialized industry) — no new domain module in Phase 9
- Modifying any frozen phase `src/` or `tests/` beyond adding `workspaces` symlink at root
- `turbo`/`lerna`/`nx`/`pnpm` store/`changesets`, `eval`/`Function`, `tsconfig` paths workaround

---

## 3. Behavior Summary (as verified by TEST)

- **WorkspaceConfig (§7):** `getWorkspaceConfig(repoPath)` checks `isContained(cwd, repoPath)` → `issue.workspace.not-contained`, reads `package.json` → `issue.workspace.not-found` if `ENOENT`, parses JSON → `issue.workspace.validation` if parse fails or `workspaces` not `string[]` with `phase-09` or `phase-*`, returns `WorkspaceConfig` with `workspaces`, `packageManager`, `engines`.
- **verifyWorkspaces (§8):** checks `isContained` → `execProcess("node", ["-e", "import('@issue/foundation')"])` → `issue.workspace.exec-failed` if non-zero, `execProcess("node", ["-e", "import('@issue/foundation/dist/index.js')"])` expecting `exitCode !==0` and `stderr` `ERR_PACKAGE_PATH_NOT_EXPORTED` → `issue.workspace.validation` if `0`, checks `node_modules/@issue/foundation` via `stat` → `issue.workspace.not-found` if missing → `ok(true)` with `workspace.audit`.
- **runCheckAll (§9):** checks `isContained` → `execProcess("npm", ["--workspaces", "run", "check"], {cwd: repoPath, allowExec:true, timeoutMs:120000, maxBytes:1MB})` → `issue.workspace.exec-failed` if `!res.ok`, returns `CheckAllResult` (`passed: ["all"]` if `exitCode===0` else `failed: ["unknown"]`).

---

## 4. Package Plan

`package.json` for Phase 9 (per SPECIFICATION §4):

```json
{
  "name": "@issue/workspace",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "dependencies": {
    "@issue/config-cli": "file:../phase-06",
    "@issue/foundation": "file:../phase-01-foundation",
    "@issue/analytics": "file:../phase-05",
    "@issue/integration": "file:../phase-03",
    "@issue/model-provider": "file:../phase-08",
    "@issue/tool-runtime": "file:../phase-02",
    "@issue/write-execution": "file:../phase-07"
  }
}
```

No deep imports (`@issue/*/internal`), no `require`, no new runtime dep beyond `npm` workspaces + `node:fs` + `node:child_process` (bounded, audited) + `pino` via foundation.

---

## 5. Dependency Boundaries

Phase 9 references zero frozen packages as runtime `dependencies` (it is a workspace manifest, not a runtime consumer) — but for audit purposes it references all eight frozen public barrels via `file:` refs in its `devDependencies` for migration verification (to be recorded in `phase-09/package.json` at Implementation, but not required for `npm install` at root which uses `workspaces`).

Phase 4 (`@issue/research`) is **not** consumed by default and remains CLOSED/FROZEN, unmodified.

---

## 6. Verification Gates (as run this session)

- `npm run typecheck` — **PASS**
- `npm run lint` — **PASS** (0 errors)
- `npm run format:check` — **PASS**
- `npm test` — **PASS** `10/10` tests (5 files: public-api 1, workspace 4, verify 2, check 2, determinism 1)
- `npm run test:coverage` — **PASS** `78.46% stmts / 72.22% branches / 100% funcs / 78.46% lines` (thresholds `60/40/80/60`; branches 72.22% documented gap, not blocking)
- `npm run build` — **PASS** (`dist/` generated, `dist/index.d.ts` matches barrel)
- `npm audit --audit-level=high` — 0 vulnerabilities

---

## 7. Non-Goals and Deferred Items

- **Resolved in this phase (now implemented):** `§22.5` workspace/monorepo migration is no longer deferred.
- **Still deferred (not in Phase 9):** Future Scope domains (Research already Phase 4, Data and analytics already Phase 5, plus Education/Business/Scientific/Robotics/Engineering/Creative/Personal productivity/Specialized industry) — all remain Future Scope, not Phase 9.
- **Carried as UNRESOLVED (§17):** exact `workspaces` explicit list vs `phase-*` glob, `packageManager` exact version, `tsconfig.base.json` location, `migrateWorkspace` signature.

---

## 8. Final Pre-Freeze State

- `DEFINE.md` **ACCEPTED 2026-08-22**
- `RESEARCH.md` **ACCEPTED 2026-08-22** (R9.1-12)
- `ARCHITECTURE.md` **ACCEPTED 2026-08-22** (Q9.1-9.12, AD-9.1-9.7)
- `SPECIFICATION.md` **ACCEPTED 2026-08-22** (3 types + 3 funcs, contracts §6-§14)
- `src/` **IMPLEMENTED** (manifest, verify, check, audit)
- `tests/` **10/10 PASS**
- `dist/` **built**
- `package.json` **barrel-only** deps (actually zero runtime, but references via `file:` for verification)

Governance: `ISSU_PROJECT.md` §23 Security Audit PASS, §24 Governance Audit PASS, §25 Integrity Audit PASS, §27 Freeze-Readiness pending Owner Freeze acceptance.

---

## 9. Traceability

| Element | Source |
| --- | --- |
| Purpose (workspace) | `BLUEPRINT.md:9` Phase Architecture (`Each phase will have its own dedicated folder`); `BLUEPRINT.md:25` Integration (Identify interfaces, Build adapters, Connect modules, Validate complete system, Prepare first complete release); `phase-09/DEFINE.md:3` |
| Scope (workspaces) | `BLUEPRINT.md:22.5`; `ISSU_PROJECT.md:799-847` Security (no `fs.write` beyond migration audit) |
| Public surface | `src/index.ts` (3 types + 3 funcs) |
| Dependencies / boundaries | `package.json:dependencies` (`file:` refs); `phase-09/DEFINE.md:11` |
| Non-goals / deferred | `BLUEPRINT.md:616-628`; `phase-09/DEFINE.md:12` |
| Lifecycle / governance | `BLUEPRINT.md:301-330` (§11); `ISSU_PROJECT.md:9,10` |
| Security vectors | `ISSU_PROJECT.md:799-847`; `BLUEPRINT.md:17` |
| Deferred §22.5 resolved | `BLUEPRINT.md:22.5` + `phase-08/DEFINE.md:12` |

---

## 10. Documentation Index

| Document | Purpose |
| --- | --- |
| `README.md` | This file — phase overview and topic index. |
| `DEFINE.md` | Phase 9 governed DEFINE (ACCEPTED 2026-08-22). |
| `RESEARCH.md` | Research R9.1-12 (ACCEPTED 2026-08-22). |
| `ARCHITECTURE.md` | Architecture Q9.1-9.12 + AD-9.1-9.7 (ACCEPTED 2026-08-22). |
| `DECISIONS.md` | Architecture decisions AD-9.1-9.7 (Draft). |
| `SPECIFICATION.md` | Normative contracts §3-§18 (ACCEPTED 2026-08-22). |
| `src/index.ts` | Public barrel (3 types + 3 funcs). |
| `src/internal/manifest.ts` | getWorkspaceConfig. |
| `src/internal/verify.ts` | verifyWorkspaces. |
| `src/internal/check.ts` | runCheckAll. |
| `src/internal/audit.ts` | createWorkspaceLogger. |
| `tests/` | 10 tests (public-api, workspace, verify, check, determinism). |

---

## 11. License

Licensed under the Apache License, Version 2.0. See `../LICENSE`.
