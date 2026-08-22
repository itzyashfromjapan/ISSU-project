# ISSU — Phase 7: Write & Execution Tooling — Architecture

**Phase:** 7 — Write & Execution Tooling
**Stage:** ARCHITECTURE (owner-authorized 2026-08-22)
**Status:** ACCEPTED — Owner accepted the Phase 7 Architecture (owner, 2026-08-22)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative inputs:** Accepted Phase 7 DEFINE (`./DEFINE.md`, ACCEPTED 2026-08-22); completed Phase 7 Research (`./RESEARCH.md`, R7.1-12, ACCEPTED 2026-08-22); frozen Phase 1,2,3,5,6 contracts; Phase 4 CLOSED/FROZEN
**License:** Apache License 2.0

---

## 1. Purpose & Position

This document records the **architecture** of the Phase 7 Write & Execution Tooling Module. It follows BLUEPRINT §11 lifecycle position: after **Research** (R7.1-12 accepted) and before **Specify**.

- The domain is **Write & Execution Tooling** (accepted DEFINE, 2026-08-22), a permission-bound, sandboxed, auditable tooling for file writes/edits/deletes, process execution, Git operations, and network fetch, making the autonomous agent capable of acting, not merely reading.
- Accepted DEFINE + completed RESEARCH are the governing inputs.
- This document determines **what the module is**, **what it consumes**, **how it is decomposed**, and **which decisions remain open** for Specification and Owner approval.
- It does NOT finalize public API, exact schemas, thresholds, scoring, implementation technology, or model/provider choices. Those are **SPECIFICATION INPUT / UNRESOLVED** (Specification firewall).
- It does NOT resolve any §22.4/§22.5/Q4.22 unless stated otherwise.

---

## 2. How to Read This Document

Every decision is labeled with one of:

| Label | Meaning |
| --- | --- |
| **FACT** | Verified repository/contract fact (frozen Phase 1/2/3/5/6, BLUEPRINT, DEFINE, RESEARCH) |
| **PRECEDENT** | Established project/governance precedent from prior accepted stage (Phase 2/3/6) |
| **INFERENCE** | Reasoned conclusion from facts; not directly stated |
| **ARCHITECTURE DECISION** | A decision this Architecture stage makes within its authority |
| **UNRESOLVED** | Not decidable here; requires Specification and/or Owner approval |

Each architecture question (Q7.1-7.12) records: problem, research evidence, alternatives (≥2 where meaningful), chosen approach, rationale, consequences, rejected alternatives, and unresolved implications.

**Specification firewall:** exact public API, exports, data schemas, test/acceptance/benchmark thresholds, pass/fail formulas, scoring formulas, implementation dependencies, and implementation technology are NOT finalized here. They are recorded as **SPECIFICATION INPUT / UNRESOLVED**.

---

## 3. Consumed Contracts (frozen)

**[FACT]** Phase 7 consumes the following frozen public surfaces, **barrel-only** (no deep imports), consistent with Phase 6 precedent and P7-2 boundary audit:

### 3.1 Phase 1 — `@issue/foundation` (frozen)

**[FACT]** Public barrel (`phase-01-foundation/src/index.ts`): `VERSION`, `AppError`/`AppErrorJson`/`AppErrorParams`, `isAppError`/`toError`, `Result`/`ok`/`err`/`isOk`/`isErr`/`match`, `LogLevel`, `IssueConfig`/`LoadConfigOptions`/`loadConfig`/`mergeConfigLayers`, `EnvSource`/`EnvSnapshot`/`readEnv`/`getSecret`/`redactionList`, `Logger`/`LoggerOptions`/`createLogger`, `assertContained`/`isContained`, `runCli`.

### 3.2 Phase 2 — `@issue/tool-runtime` (frozen)

**[FACT]** Public barrel (`phase-02/src/index.ts`): `TaskStatus`, `ToolOperation`, `ActionRef`, `ReadOptions`, `ListOptions`, `OutcomeClass`, `CorrectionDirection`, `FileContent`, `DirectoryEntry`, `DirectoryListing`, `ToolResult`, `TaskRefs`, `ResourceBounds`, `TaskOptions`, `TaskState`, `AvailableAction`, `DecisionProvider`, `Assessment`, `TaskResult`, `ToolRuntime`; functions `runTask`, `createToolRuntime`, `deriveAvailableActions`.

### 3.3 Phase 3 — `@issue/integration` (frozen, CLOSED)

**[FACT]** Public barrel (`phase-03/src/index.ts`): `runIntegrationTask`, `IntegrationTaskResult`, harness + stub types.

### 3.4 Phase 5 — `@issue/analytics` (frozen)

**[FACT]** Public barrel (`phase-05/src/index.ts`): `runAnalyticsTask` + 13 types.

### 3.5 Phase 6 — `@issue/config-cli` (frozen)

**[FACT]** Public barrel (`phase-06/src/index.ts`): `ConfigSchema`, `ResolvedConfig`, `ConfigProvenance`, `CliArgs`, `CliResult`, `resolveConfig`, `verifyConfig`, `getDefaultConfig`, `parseArgs`, `runCli`, `HELP_TEXT`, `createCliLogger`, `logProgress`, `VERSION`.

### 3.6 Phase 4 — `@issue/research` (CLOSED/FROZEN, NOT consumed)

**[FACT]** Phase 4 (`@issue/research`) is NOT consumed by default per `phase-07/DEFINE.md:11` and Phase 6 precedent.

---

## 4. Module Decomposition

**[ARCHITECTURE DECISION]** Phase 7 is decomposed into exactly five internal modules, plus the public barrel:

- **write/** — `writeFile.ts` (create/overwrite with `isContained` + permission + audit), `editFile.ts` (exact `oldString`→`newString` replacement, `ISSU_PROJECT.md` file-operations rule, no `sed`/`awk`), `deleteFile.ts` (delete with flag, no recursive without explicit)
- **process/** — `execProcess.ts` (`spawn` with `shell: false`, timeout, maxBytes, `ProcessResult`, no `eval`/`Function`)
- **git/** — `gitStatus.ts`, `gitDiff.ts`, `gitCommit.ts` (scoped staging, pre-commit `git diff --cached --stat` audit), `gitBranch.ts` (branch verification, no `push` without separate auth, no `add -A`)
- **fetch/** — `httpFetch.ts` (guarded `fetch` with allowlist, timeout, size cap, header sanitization per `RUflo http_fetch` §5.1.8)
- **audit/** — `permission.ts` (deny-by-default, `allowWrite` flag), `logger.ts` (wraps `createLogger({redact: redactionList()})`)

**[PRECEDENT]** Phase 6 decomposed into 3 modules (config, cli, observability) — Phase 7 is larger (5) per `BLUEPRINT.md:17` security vectors, but remains minimal per `BLUEPRINT.md:178-183`.

---

## 5. Architecture Questions

### Q7.1 — How is File Write Bounded?

**Problem:** §22.3 write must be permission-bound and auditable, not unbounded `fs.write`.

**Research evidence:** `phase-02/runtime.ts` `isContained` enforcement, `phase-06/cli.ts` `isContained` before `readFile`, R7.2.

**Alternatives:** (1) Unbounded `fs.writeFile` (rejected: path traversal). (2) `writeFile` with `isContained(cwd, target)` + `permission.allowWrite` + `Result` + audit log (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `writeFile(target, content, options?: {permission?: {allowWrite: boolean}, logger?: Logger}) → Promise<Result<{bytesWritten: number}, AppError>>` checks `isContained(cwd, target)` → if not → `issue.write.not-contained`; checks `permission.allowWrite` (default false) → if false → `issue.write.permission-denied`; then `fs.writeFile` with `utf8`, `bytesWritten` capped by `maxBytesPerWrite` (default 1 MiB), audit `write.audit` via `Logger`.

**Consequences:** Secure by default, auditable, reuse `isContained`.

**Rejected:** Unbounded.

**Unresolved:** `maxBytesPerWrite` value, `allowWrite` default, `cwd` vs `repoPath`.

---

### Q7.2 — How is File Edit Bounded (no sed/awk)?

**Problem:** `ISSU_PROJECT.md` file-operations rule: use exact string replacement, not `sed`/`awk`.

**Research evidence:** `ISSU_PROJECT.md` Tool Use — File Operations `edit` requires `oldString` exact match.

**Alternatives:** (1) `sed`/`awk` (rejected: non-exact, comment-stripping risk). (2) `editFile(target, oldString, newString, options?) → Promise<Result<{replaced: boolean}, AppError>>` with exact `oldString` match (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `editFile` reads `target` via `isContained` + `readFile`, checks `content.includes(oldString)` → if not → `issue.edit.not-found`; otherwise `content.replace(oldString, newString)` (exact, not regex), writes via `writeFile` semantics, audit `edit.audit`.

**Consequences:** Exact, deterministic, preserves indentation per `edit` tool rule.

**Rejected:** `sed`.

**Unresolved:** `replaceAll` flag, `oldString` not found handling.

---

### Q7.3 — How is Process Execution Bounded (no shell)?

**Problem:** `ISSU_PROJECT.md:23` command injection, `BLUEPRINT.md:17` `Command restrictions` + `Process execution`.

**Research evidence:** `ISSU_PROJECT.md:17` No-Workaround Rule, R7.3.

**Alternatives:** (1) `child_process.exec` with shell interpolation (rejected: injection). (2) `child_process.spawn` with `shell: false`, timeout, maxBytes (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `execProcess(command: string, args: readonly string[], options?: {cwd?: string, timeoutMs?: number, maxBytes?: number, logger?: Logger}) → Promise<Result<ProcessResult, AppError>>` where `ProcessResult = {exitCode: number, stdout: string, stderr: string, timedOut: boolean}`. Checks `isContained(cwd, options.cwd)` if `cwd` provided; `spawn(command, args, {shell: false, cwd})` with `timeoutMs` default 30000 (max 60000), `maxBytes` 256KB default (1MB max), truncated, `Result` with `issue.process.*`.

**Consequences:** No shell interpolation, bounded, auditable.

**Rejected:** `exec` with shell.

**Unresolved:** `maxBytes` value, `timeoutMs` max, `cwd` default.

---

### Q7.4 — How are Git Operations Scoped (no add -A, no push without auth)?

**Problem:** `ISSU_PROJECT.md:32-33` commit-scope and push audits require scoped staging and separate authorization.

**Research evidence:** `ISSU_PROJECT.md:32-33`, `phase-06/FREEZE_REPORT.md:12-13` scoped staging precedent, R7.4.

**Alternatives:** (1) `git add -A` + `git commit -m` + `git push` (rejected: scope, auth). (2) `gitStatus` (via `execProcess` `git status --porcelain -b`), `gitDiff` (`git diff --stat` + `git diff --cached --stat`), `gitCommit` (scoped `git add <file>` + `git commit -m` with pre-commit `git diff --cached --stat` audit), `gitBranch` (`git branch -vv`) — each via `execProcess`, `isContained(repoPath, ...)` (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** Git tooling delegates to `execProcess` with `git` binary, `cwd: repoPath`, `isContained` on `repoPath`, no `add -A`, no `push` without separate Owner authorization (Phase 7 provides `gitPush` as **DEFERRED** — not in this phase, to preserve separate auth). `gitCommit` performs `git diff --cached --stat` audit before commit and returns `Result`.

**Consequences:** Traceable, scoped, `ISSU_PROJECT.md:32-33` compliant.

**Rejected:** `add -A`.

**Unresolved:** `gitPush` deferral (Phase 8), `repoPath` default.

---

### Q7.5 — How is Network Fetch Guarded?

**Problem:** `BLUEPRINT.md:17` `Network access`, `ISSU_PROJECT.md:23` `network access` + `external data acquisition`.

**Research evidence:** `Ruflo http_fetch` §5.1.8 (guarded fetch with allowlist, timeout, size cap, header sanitization), R7.5.

**Alternatives:** (1) Unbounded `fetch` (rejected: SSRF, credential leakage). (2) Guarded `httpFetch(url, options?) → Promise<Result<{status: number, body: string, headers: Record<string,string>}, AppError>>` with `https:` only, no `file://`/`ftp://`/RFC1918/loopback unless `ALLOW_PRIVATE=1`, `timeoutMs` 30000 (60000 max), `maxResponseBytes` 256KB (1MB max), header sanitization (block `Authorization`/`Cookie`/`X-Auth-*` unless `ALLOW_AUTH=1`) (chosen).

**Chosen approach:** **[ARCHITECTURE DECISION]** `httpFetch` as above, via `fetch` (Node 22), `Result` with `issue.network.*`, audit `fetch.audit`.

**Consequences:** Secure by default, `ADR-164 §5.1.8` compliant.

**Rejected:** Unbounded.

**Unresolved:** `ALLOW_PRIVATE`/`ALLOW_AUTH` env handling, `maxResponseBytes` max.

---

### Q7.6 — How are Permission Boundaries and Sandboxing Modeled?

**[ARCHITECTURE DECISION]** Deny-by-default: every `target`, `cwd`, `repoPath`, `url` host must pass `isContained` or allowlist; `writeFile` checks `permission.allowWrite` (default false, per `BLUEPRINT.md:17` `User confirmation`), `execProcess` checks `permission.allowExec` (default false). Sandboxing via `isContained` + `ResourceBounds` (maxBytes, timeout, maxProcesses) — no `tsconfig` paths workaround `ISSU_PROJECT.md:17`.

---

### Q7.7 — How is Audit Logging and Credential Protection Wired?

**[ARCHITECTURE DECISION]** `audit/logger.ts` wraps `createLogger({level: "info", redact: redactionList()})` + `getSecret` for credential protection; every `writeFile`/`editFile`/`deleteFile`/`execProcess`/`git*`/`httpFetch` logs `tool.audit` with `ctx` (`tool`, `target`, `result`, `permission`, `audit`) and redacts via `redactionList`.

---

### Q7.8 — How is Determinism Handled?

**[ARCHITECTURE DECISION]** Writes with identical `target`+`content`+`permission` are deterministic where FS is mocked (tests use `tmpdir` + `mkdtemp`); `execProcess`/`httpFetch` are **documented as non-deterministic** (timing, network, external data) per `BLUEPRINT.md:41` non-goals, tests assert determinism for mocked FS and explicitly mark non-determinism for real process/network (time-dependent, environment-dependent, external-data dependence) per `ISSU_PROJECT.md:21` Determinism Audit (do not claim beyond evidence).

---

### Q7.9 — What Remains Deferred?

Per DEFINE §12, **[ARCHITECTURE DECISION]** `§22.4` model-provider binding, `§22.5` workspace/monorepo migration, `Q4.22` remain **DEFERRED** and appear here as **UNRESOLVED**: provider binding, workspace, persistence beyond tool operations, confidence calibration.

---

### Q7.10 — What is the Public Barrel?

**[UNRESOLVED]** Exact exports are Specification firewall: proposed `export { writeFile, editFile, deleteFile, execProcess, gitStatus, gitDiff, gitCommit, gitBranch, httpFetch }` + types `WriteOptions`, `EditOptions`, `ProcessResult`, `GitStatus`, `GitCommitResult` — but final list is SPECIFICATION INPUT, not decided here. Only constraint: barrel exports NOTHING from frozen phases' internals.

---

### Q7.11 — How is Failure Handled?

**[ARCHITECTURE DECISION]** Every fallible operation returns `Result<T, AppError>` with `issue.write.*`, `issue.process.*`, `issue.git.*`, `issue.network.*` codes: `issue.write.not-contained`, `issue.write.permission-denied`, `issue.edit.not-found`, `issue.process.timeout`, `issue.git.not-contained`, `issue.network.not-allowed`, etc. `AppError` with `recoverable` flag; no `throw` of raw `Error` beyond `AppError` creation.

---

### Q7.12 — How is Testing Structured?

**[ARCHITECTURE DECISION]** Tests under `phase-07/tests/`: `write.test.ts` (isContained, permission, audit), `edit.test.ts` (exact replacement, not-found), `process.test.ts` (spawn no shell, timeout, maxBytes), `git.test.ts` (scoped staging, pre-commit audit, no add -A), `fetch.test.ts` (allowlist, timeout, header sanitization), `public-api.test.ts`, `determinism.test.ts` (mocked FS), `seam.integration.test.ts` (real tmpdir + real git). Coverage gate **≥80%** (Vitest v8, `include: ["src/**/*.ts"]`).

---

## 6. Decisions Summary

| ID | Decision | Status |
| --- | --- | --- |
| AD-7.1 | Consume frozen contracts barrel-only (1/2/3/5/6) | Draft |
| AD-7.2 | writeFile with isContained + permission + audit | Draft |
| AD-7.3 | editFile exact oldString replacement | Draft |
| AD-7.4 | execProcess with spawn shell:false + timeout + maxBytes | Draft |
| AD-7.5 | Git via execProcess with scoped staging, no push | Draft |
| AD-7.6 | httpFetch with allowlist + timeout + header sanitization | Draft |
| AD-7.7 | Deny-by-default + isContained + ResourceBounds | Draft |
| AD-7.8 | Audit via Logger+redactionList, credential via getSecret | Draft |
| AD-7.9 | §22.4/§22.5/Q4.22 remain DEFERRED | Draft |

All decisions become **Approved** at Architecture acceptance and **Frozen** at Phase 7 freeze.

---

## 7. Specification Firewall

Exact public API, exports, data schemas, test/acceptance/benchmark thresholds, pass/fail formulas, scoring formulas, implementation dependencies, and implementation technology are **NOT finalized here**. They are recorded as **SPECIFICATION INPUT / UNRESOLVED** and will be decided at Specification with Owner approval.

---

## 8. Security Considerations

Architecture preserves `ISSU_PROJECT.md:799-847` vectors: path traversal via `isContained`, no shell interpolation, permission deny-by-default, audit logs, credential protection, network allowlist, Git scoped staging, header sanitization. Detailed verification at Security Audit (post-implementation).

---

## 9. End-of-Document Block

```
PHASE 7 ARCHITECTURE RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 7 ARCHITECTURE STAGE: ACCEPTED — SPECIFICATION AUTHORIZED (owner, 2026-08-22)
SPECIFICATION AUTHORIZED: YES (owner, 2026-08-22)
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 8 WORK STARTED: NO
COMMIT/PUSH: NO
```
