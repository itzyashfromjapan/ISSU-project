# ISSU — Phase 9: Workspace & Monorepo Migration — Specification

**Phase:** 9 — Workspace & Monorepo Migration
**Stage:** SPECIFICATION (owner-authorized 2026-08-22)
**Status:** ACCEPTED — Owner accepted the Phase 9 Specification (owner, 2026-08-22)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative inputs:** Accepted Phase 9 DEFINE (`./DEFINE.md`, ACCEPTED 2026-08-22); accepted Phase 9 Research (`./RESEARCH.md`, R9.1-12, ACCEPTED 2026-08-22); accepted Phase 9 Architecture (`./ARCHITECTURE.md`, Q9.1-9.12, AD-9.1-9.7, ACCEPTED 2026-08-22); frozen Phase 1,2,3,5,6,7,8 public contracts; Phase 4 CLOSED/FROZEN
**License:** Apache License 2.0

This specification converts the accepted Phase 9 Architecture into **implementable contracts without implementing them**. It is authoritative for the Workspace & Monorepo Migration module contract once accepted by the owner.

---

## 1. Purpose

**[DECISION]** This document is the authoritative specification of the Phase 9 Workspace & Monorepo Migration Module. It defines the module's public contract, data model, behavioral contracts, quality/verification criteria, and Implementation handoff conditions, derived exclusively from the accepted Architecture (Q9.1-9.12, AD-9.1-9.7) and completed Research R9.1-12.

It SHALL NOT be read as authorizing implementation. Implementation is governed by the Implementation handoff conditions (§18) and a separate owner authorization.

---

## 2. Scope

**[DECISION]** The module covers the pipeline elements recorded in DEFINE §4 and Architecture Q9.1-9.5:

- Workspace manifest (`package.json` `workspaces: ["phase-*"]` + `private:true` + `packageManager` + `engines` + `scripts: check:all/build:all/test:all`).
- Shared configs (`tsconfig.base.json`, `eslint.config.js`, `prettier.config.mjs` at root, `extends` not required for frozen phases).
- Unified verification (`runCheckAll`, `runBuildAll` via `execProcess` `npm --workspaces run check` with `shell: false`).
- Migration audit (`verifyWorkspaces` verifying `file:../phase-0X` still resolves via `workspaces` symlink and `exports` map still blocks deep imports).

**[NORMATIVE]** Out of scope (carried from DEFINE §8, Architecture Q9.6): Future Scope domains (Research already Phase 4, Data and analytics already Phase 5, plus Education/Business/Scientific/Robotics/Engineering/Creative/Personal productivity/Specialized industry); modifying any frozen phase `src/` or `tests/` beyond adding `workspaces` symlink at root.

---

## 3. Module Identity and Public Contract (Normative)

**[NORMATIVE]** The module is the `@issue/workspace` package under `phase-09/`. Its public barrel `src/index.ts` SHALL export **exactly** the following surface — no other symbol is public:

**Types (3):**
- `WorkspaceConfig` — `{readonly workspaces: readonly string[], readonly packageManager: string, readonly engines: {readonly node: string}}`
- `CheckAllResult` — `{readonly passed: readonly string[], readonly failed: readonly string[]}`
- `VerifyWorkspacesResult` — `true` (via `Result<true, AppError>`)

**Functions (3):**
- `verifyWorkspaces(repoPath: string) => Promise<Result<true, AppError>>`
- `runCheckAll(repoPath: string, options?: {logger?: Logger}) => Promise<Result<CheckAllResult, AppError>>`
- `getWorkspaceConfig(repoPath: string) => Promise<Result<WorkspaceConfig, AppError>>`

**[NORMATIVE]** Every other symbol is internal (`§17.3`) and SHALL NOT be imported by consumers. `src/index.ts` is the sole barrel; `src/internal/*` is private.

---

## 4. Frozen-Contract Consumption (Normative)

**[NORMATIVE]** Phase 9 consumes **zero** frozen packages as runtime `dependencies` (it is a workspace manifest, not a runtime consumer) — but for audit purposes it **references** all eight frozen public barrels via `file:` refs in its `devDependencies` or `peerDependencies` for migration verification (to be recorded in `phase-09/package.json` at Implementation, but not required for `npm install` at root which uses `workspaces`).

Phase 4 `@issue/research` is NOT consumed by default. No deep imports (`@issue/*/internal` or `src` paths), no `require`, no new runtime dependency beyond `npm` workspaces + `node:fs` + `node:child_process` (bounded, audited) + `pino` via foundation.

---

## 5. Module Boundary and Non-Goals

**[NORMATIVE]** Boundary per Architecture §4: `workspace/` (manifest, audit), `config/` (base configs), `verify/` (checkAll). No other top-level internal directory.

**[NORMATIVE]** Non-goals (prohibited): Future Scope domains, modifying any frozen phase `src/` or `tests/` beyond `workspaces` symlink, `turbo`/`lerna`/`nx`/`pnpm` store, `changesets`, `eval`/`Function`, `tsconfig` paths workaround.

---

## 6. Data Model — WorkspaceConfig

**[NORMATIVE]** `WorkspaceConfig` SHALL be:

```ts
type WorkspaceConfig = {
  readonly workspaces: readonly string[]; // e.g., ["phase-*", "phase-01-foundation", ...]
  readonly packageManager: string; // e.g., "npm@10"
  readonly engines: {readonly node: string}; // e.g., {node: ">=22.9.0"}
};
```

`workspaces` must include `phase-09` and all `phase-01-foundation` through `phase-08` (explicit list, not glob with dash alone). `packageManager` must be `npm@10` or `null` (not `pnpm@9` without separate decision). `engines.node` must be `>=22.9.0` per frozen precedent.

---

## 7. Behavioral Contract — getWorkspaceConfig

**[NORMATIVE]** `getWorkspaceConfig(repoPath: string) => Promise<Result<WorkspaceConfig, AppError>>` SHALL:

1. Check `isContained(process.cwd(), repoPath)` → if not → `err(AppError{issue.workspace.not-contained})`.
2. `readFile(join(repoPath, "package.json"), "utf8")` via `node:fs/promises` (read-only, no `fs.write` beyond audit).
3. Parse as JSON → if parse fails → `err(AppError{issue.workspace.validation, message: "package.json parse failed"})`.
4. Validate `workspaces` is `string[]` with at least `["phase-09"]` → if not → `err(AppError{issue.workspace.validation})`.
5. Return `ok({workspaces, packageManager: pkg.packageManager ?? "npm@10", engines: pkg.engines ?? {node: ">=22.9.0"}})`.

---

## 8. Behavioral Contract — verifyWorkspaces

**[NORMATIVE]** `verifyWorkspaces(repoPath: string) => Promise<Result<true, AppError>>` SHALL:

1. Check `isContained` as in `getWorkspaceConfig`.
2. `execProcess("node", ["-e", "import('@issue/foundation')"], {cwd: repoPath, allowExec: true})` → if `!res.ok` or `exitCode !==0` → `err(AppError{issue.workspace.exec-failed})`.
3. `execProcess("node", ["-e", "import('@issue/foundation/dist/index.js')"], {cwd: repoPath, allowExec: true})` → expecting `exitCode !==0` and `stderr` contains `ERR_PACKAGE_PATH_NOT_EXPORTED` → if `exitCode ===0` → `err(AppError{issue.workspace.validation, message: "exports map did not block deep import"})`.
4. Check `workspaces` symlink exists at `join(repoPath, "node_modules/@issue/foundation")` via `fs.stat` → if not → `err(AppError{issue.workspace.not-found})`.
5. Return `ok(true)`.

---

## 9. Behavioral Contract — runCheckAll

**[NORMATIVE]** `runCheckAll(repoPath: string, options?: {logger?: Logger}) => Promise<Result<CheckAllResult, AppError>>` SHALL:

1. Check `isContained` as in `getWorkspaceConfig`.
2. `execProcess("npm", ["--workspaces", "run", "check"], {cwd: repoPath, allowExec: true, timeoutMs: 120000, maxBytes: 1024*1024, logger: options?.logger ?? createLogger({level: "info", redact: redactionList()})})` → if `!res.ok` → `err(AppError{issue.workspace.exec-failed})`.
3. Parse `stdout` for `passed`/`failed` phases (via `check` exit codes per workspace, not yet implemented in Phase 9 minimal — in Phase 9 minimal, `passed` is `["all"]` if `exitCode ===0`, `failed` is `[]`, otherwise `failed` is `["unknown"]`).
4. Return `ok({passed, failed})`.

---

## 10. Observability and Audit

**[NORMATIVE]** `audit/logger.ts` SHALL export `createWorkspaceLogger(level: LogLevel) => Logger` wrapping `createLogger({level, redact: redactionList()})`. Every `verifyWorkspaces`/`runCheckAll`/`getWorkspaceConfig` SHALL log `workspace.audit` with `ctx` (`repoPath`, `result`) and redacted via `redactionList()`.

---

## 11. Error Handling

**[NORMATIVE]** Every fallible public function returns `Result<T, AppError>` with `issue.workspace.*` codes:

- `issue.workspace.not-contained` — `repoPath` not contained
- `issue.workspace.validation` — `package.json` parse/validation, `exports` map did not block, `workspaces` missing
- `issue.workspace.not-found` — `workspaces` symlink not found
- `issue.workspace.exec-failed` — `execProcess` failed

`AppError` fields: `code`, `message`, `details?`, `cause?`, `recoverable?`. No `throw` of raw `Error` beyond `AppError`.

---

## 12. Security Requirements

**[NORMATIVE]** Per `ISSU_PROJECT.md:799-847` and `BLUEPRINT.md:17`:

- Path traversal: every `repoPath` validated via `isContained`/`assertContained` before `fs`/`spawn`.
- No `fs.write` beyond migration audit (only `readFile` for `package.json` and `stat` for symlink).
- No `child_process` beyond `npm --workspaces` and `node -e` via `execProcess` with `shell:false`, bounded via `timeoutMs`/`maxBytes`.
- No `eval`, `Function`, `tsconfig` paths workaround.
- No `fetch`, no credential exposure.

---

## 13. Determinism and Reproducibility

**[NORMATIVE]** `verifyWorkspaces` and `getWorkspaceConfig` are deterministic where `package.json` and `package-lock.json` are committed (lockfile deterministic). `runCheckAll` via `npm --workspaces run check` is deterministic where `check` in each workspace is deterministic (Phase 6/7/8 `resolveConfig`/`writeFile` deterministic where mocked). Tests assert determinism for mocked `execProcess` and explicitly mark non-determinism for real `npm --workspaces` (time-dependent, environment-dependent) per `ISSU_PROJECT.md:21`.

---

## 14. Public API and Contract Audit

Before Freeze, `src/index.ts` barrel + `dist/index.d.ts` + `package.json:exports` SHALL be verified to match this §3 surface exactly (3 types + 3 functions). No internal `src/internal/*` shall be exported.

---

## 15. Implementation Handoff Conditions

Implementation is **NOT authorized** until:

1. This Specification is **accepted** by Owner (Status → ACCEPTED + End-block).
2. `ISSU_PROJECT.md:574-611` Implementation Readiness Audit passes (Blueprint, accepted DEFINE, RESEARCH, ARCHITECTURE, DECISIONS, SPECIFICATION read; scope inventory with AUTHORIZED/UNAUTHORIZED classification; frozen dependencies, public contract, test obligations, config/dependency restrictions, generated artifacts, security boundaries verified).
3. Separate Owner **implementation authorization** is given (DEFINE covers DEFINE ONLY; RESEARCH covers RESEARCH ONLY; ARCHITECTURE covers ARCHITECTURE ONLY; SPECIFICATION covers SPECIFICATION ONLY).

---

## 16. Quality and Verification Gates

**[NORMATIVE]** Implementation SHALL pass:

- `npm run typecheck` (no `TS2307` workaround)
- `npm run lint` (0 errors, `no-restricted-imports` for deep imports)
- `npm run format:check` (Prettier)
- `npm test` (Vitest, all tests PASS)
- `npm run test:coverage` (provider v8, `include: ["src/**/*.ts"]`, thresholds **≥80%** on lines, statements, functions, branches)
- `npm run build` (`tsc -p tsconfig.build.json`, `dist/` generated, `dist/index.d.ts` matches barrel)
- `npm audit --audit-level=high` (0 vulnerabilities)
- Security Audit per §12 (grep 0 hits for `child_process.exec` with shell, `eval`, `Function`)
- Public API audit per §3

---

## 17. Unresolved Items Carried Forward

All UNRESOLVED from Architecture Q9.7 remain UNRESOLVED here until Specification acceptance: exact `workspaces` explicit list vs `phase-*` glob, `packageManager` exact version, `tsconfig.base.json` location, `migrateWorkspace` signature.

No UNRESOLVED is silently resolved as a requirement; it remains UNRESOLVED until explicitly decided at Specification acceptance.

---

## 18. End-of-Document Block

```
PHASE 9 SPECIFICATION RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 9 SPECIFICATION STAGE: ACCEPTED — IMPLEMENTATION AUTHORIZED (owner, 2026-08-22)
IMPLEMENTATION AUTHORIZED: YES (owner, 2026-08-22)
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6/7/8 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 10 WORK STARTED: NO
COMMIT/PUSH: NO
```
