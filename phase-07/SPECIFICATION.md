# ISSU — Phase 7: Write & Execution Tooling — Specification

**Phase:** 7 — Write & Execution Tooling
**Stage:** SPECIFICATION (owner-authorized 2026-08-22)
**Status:** ACCEPTED — Owner accepted the Phase 7 Specification (owner, 2026-08-22)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative inputs:** Accepted Phase 7 DEFINE (`./DEFINE.md`, ACCEPTED 2026-08-22); accepted Phase 7 Research (`./RESEARCH.md`, R7.1-12, ACCEPTED 2026-08-22); accepted Phase 7 Architecture (`./ARCHITECTURE.md`, Q7.1-7.12, AD-7.1-7.9, ACCEPTED 2026-08-22); frozen Phase 1,2,3,5,6 public contracts; Phase 4 CLOSED/FROZEN
**License:** Apache License 2.0

This specification converts the accepted Phase 7 Architecture into **implementable contracts without implementing them**. It is authoritative for the Write & Execution Tooling module contract once accepted by the owner.

---

## 1. Purpose

**[DECISION]** This document is the authoritative specification of the Phase 7 Write & Execution Tooling Module. It defines the module's public contract, data model, behavioral contracts, quality/verification criteria, and Implementation handoff conditions, derived exclusively from the accepted Architecture (Q7.1-7.12, AD-7.1-7.9) and completed Research R7.1-12.

It SHALL NOT be read as authorizing implementation. Implementation is governed by the Implementation handoff conditions (§18) and a separate owner authorization.

---

## 2. Scope

**[DECISION]** The module covers the pipeline elements recorded in DEFINE §4 and Architecture Q7.1-7.5:

- File write/edit/delete with `isContained` + permission + audit (`writeFile`, `editFile`, `deleteFile`).
- Process execution with `spawn` no-shell + timeout + maxBytes (`execProcess`).
- Git with scoped staging (`gitStatus`, `gitDiff`, `gitCommit`, `gitBranch`, no `push` in this phase).
- Network fetch with allowlist + timeout + size cap + header sanitization (`httpFetch`).
- Permission & audit wiring via `Logger` + `redactionList` + `getSecret`.

**[NORMATIVE]** Out of scope (carried from DEFINE §8, Architecture Q7.9): `§22.4/Q4.22` provider/model binding; `§22.5` workspace/monorepo; persistence beyond tool operations; Phase 4 default consumption.

---

## 3. Module Identity and Public Contract (Normative)

**[NORMATIVE]** The module is the `@issue/write-execution` package under `phase-07/`. Its public barrel `src/index.ts` SHALL export **exactly** the following surface — no other symbol is public:

**Types (8):**
- `WriteOptions` — `{readonly allowWrite?: boolean, readonly maxBytesPerWrite?: number, readonly logger?: Logger}`
- `EditOptions` — `{readonly allowWrite?: boolean, readonly logger?: Logger}`
- `DeleteOptions` — `{readonly allowWrite?: boolean, readonly logger?: Logger}`
- `ProcessOptions` — `{readonly cwd?: string, readonly timeoutMs?: number, readonly maxBytes?: number, readonly allowExec?: boolean, readonly logger?: Logger}`
- `ProcessResult` — `{readonly exitCode: number, readonly stdout: string, readonly stderr: string, readonly timedOut: boolean}`
- `GitOptions` — `{readonly repoPath?: string, readonly logger?: Logger}`
- `GitStatus` — `{readonly branch: string, readonly ahead: number, readonly behind: number, readonly staged: readonly string[], readonly unstaged: readonly string[], readonly untracked: readonly string[]}`
- `FetchOptions` — `{readonly timeoutMs?: number, readonly maxResponseBytes?: number, readonly allowPrivate?: boolean, readonly allowAuth?: boolean, readonly logger?: Logger}`

**Functions (9):**
- `writeFile(target: string, content: string, options?: WriteOptions) => Promise<Result<{bytesWritten: number}, AppError>>`
- `editFile(target: string, oldString: string, newString: string, options?: EditOptions) => Promise<Result<{replaced: boolean}, AppError>>`
- `deleteFile(target: string, options?: DeleteOptions) => Promise<Result<{deleted: boolean}, AppError>>`
- `execProcess(command: string, args: readonly string[], options?: ProcessOptions) => Promise<Result<ProcessResult, AppError>>`
- `gitStatus(options?: GitOptions) => Promise<Result<GitStatus, AppError>>`
- `gitDiff(options?: GitOptions) => Promise<Result<{stat: string, nameStatus: string}, AppError>>`
- `gitCommit(message: string, files: readonly string[], options?: GitOptions) => Promise<Result<{commit: string}, AppError>>`
- `gitBranch(options?: GitOptions) => Promise<Result<{branch: string, tracking: string}, AppError>>`
- `httpFetch(url: string, options?: FetchOptions) => Promise<Result<{status: number, body: string, headers: Record<string,string>}, AppError>>`

**[NORMATIVE]** Every other symbol is internal (`§17.3`) and SHALL NOT be imported by consumers. `src/index.ts` is the sole barrel; `src/internal/*` is private.

---

## 4. Frozen-Contract Consumption (Normative)

**[NORMATIVE]** Phase 7 consumes exactly five frozen packages **through public barrels only** via `file:` refs (to be recorded in `package.json`):

- `@issue/foundation: "file:../phase-01-foundation"` — `AppError`, `Result`, `Logger`, `createLogger`, `redactionList`, `readEnv`, `getSecret`, `assertContained`, `isContained`
- `@issue/tool-runtime: "file:../phase-02"` — `ResourceBounds` precedent (for `maxBytesPerWrite` etc.)
- `@issue/integration: "file:../phase-03"` — harness precedent
- `@issue/analytics: "file:../phase-05"` — no direct consumption in Phase 7 minimal, but barrel available
- `@issue/config-cli: "file:../phase-06"` — `ResolvedConfig` precedent (not consumed in Phase 7 minimal, but barrel available)

Phase 4 `@issue/research` is NOT consumed by default. No deep imports (`@issue/*/internal` or `src` paths), no `require`, no new runtime dep beyond frozen packages and `node:fs` + `node:child_process` + `fetch` (Node 22) — all bounded, audited.

---

## 5. Module Boundary and Non-Goals

**[NORMATIVE]** Boundary per Architecture §4: `write/` (writeFile, editFile, deleteFile), `process/` (execProcess), `git/` (gitStatus, gitDiff, gitCommit, gitBranch), `fetch/` (httpFetch), `audit/` (permission, logger). No other top-level internal directory.

**[NORMATIVE]** Non-goals (prohibited): provider/model binding (§22.4/Q4.22), workspace/monorepo (§22.5), persistence beyond tool operations, Phase 4 default consumption, `@issue/foundation` `main/types/exports` modification, `eval`/`Function`, `tsconfig` paths workaround.

---

## 6. Data Model — WriteOptions / EditOptions / DeleteOptions

**[NORMATIVE]** All file operations SHALL use `isContained(cwd, target)` where `cwd` is `process.cwd()` or `options.cwd` if provided (not in Phase 7 minimal, but `isContained(cwd, target)` is mandatory). `allowWrite` defaults to `false` — deny-by-default per `BLUEPRINT.md:17`. `maxBytesPerWrite` defaults to `1024*1024` (1 MiB), capped at `5*1024*1024`.

---

## 7. Data Model — ProcessResult

**[NORMATIVE]** `ProcessResult` is the output of `execProcess`:

```ts
type ProcessResult = {
  readonly exitCode: number;
  readonly stdout: string; // truncated to maxBytes, utf8
  readonly stderr: string; // truncated to maxBytes, utf8
  readonly timedOut: boolean;
};
```

`stdout`/`stderr` are truncated to `maxBytes` (default `256*1024`, max `1024*1024`) via `slice(0, maxBytes)`.

---

## 8. Behavioral Contract — writeFile

**[NORMATIVE]** `writeFile(target, content, options?) → Promise<Result<{bytesWritten: number}, AppError>>` SHALL:

1. Check `isContained(process.cwd(), target)` → if not → `err(AppError{issue.write.not-contained})`.
2. Check `options.allowWrite === true` → if not → `err(AppError{issue.write.permission-denied})`.
3. Check `content` length `bytesWritten = Buffer.byteLength(content, "utf8")` → if `> maxBytesPerWrite` → `err(AppError{issue.write.too-large})`.
4. `await fs.writeFile(target, content, "utf8")` (via `node:fs/promises`, no `fs` outside this module).
5. Audit `logger.info("write.audit", {tool: "writeFile", target, bytesWritten, permission: options.allowWrite})` with `redact: redactionList()`.
6. Return `ok({bytesWritten})`.

**[NORMATIVE]** No shell, no `eval`, no `Function`.

---

## 9. Behavioral Contract — editFile

**[NORMATIVE]** `editFile(target, oldString, newString, options?) → Promise<Result<{replaced: boolean}, AppError>>` SHALL:

1. Check `isContained` + `allowWrite` as in `writeFile`.
2. `content = await fs.readFile(target, "utf8")` → if `ENOENT` → `err(AppError{issue.edit.not-found})`.
3. If `!content.includes(oldString)` → `err(AppError{issue.edit.not-found, message: "oldString not found"})`.
4. If `oldString === newString` → `err(AppError{issue.edit.noop, message: "oldString and newString are identical"})`.
5. Check `count = content.split(oldString).length -1` → if `>1` → `err(AppError{issue.edit.multiple-matches, message: "multiple matches, provide more context"})` (per `ISSU_PROJECT.md:17` edit rule).
6. `newContent = content.replace(oldString, newString)`.
7. `await writeFile(target, newContent, options)` (reuse write semantics, but without double `allowWrite` check — already checked).
8. Audit `edit.audit`.

---

## 10. Behavioral Contract — deleteFile

**[NORMATIVE]** `deleteFile(target, options?) → Promise<Result<{deleted: boolean}, AppError>>` SHALL:

1. Check `isContained` + `allowWrite`.
2. `await fs.unlink(target)` → if `ENOENT` → `err(AppError{issue.delete.not-found})`.
3. Audit `delete.audit`.

No recursive delete without explicit `recursive: true` (not in Phase 7 minimal — deferred).

---

## 11. Behavioral Contract — execProcess

**[NORMATIVE]** `execProcess(command, args, options?) → Promise<Result<ProcessResult, AppError>>` SHALL:

1. Check `options.allowExec === true` → if not → `err(AppError{issue.process.permission-denied})` (default false).
2. If `options.cwd` provided → check `isContained(process.cwd(), options.cwd)` → if not → `err(AppError{issue.process.not-contained})`.
3. `timeoutMs = options.timeoutMs ?? 30000` → if `>60000` → `err(AppError{issue.process.validation, message: "timeoutMs max 60000"})`.
4. `maxBytes = options.maxBytes ?? 256*1024` → if `>1024*1024` → `err(AppError{issue.process.validation})`.
5. `spawn(command, args, {shell: false, cwd: options.cwd ?? process.cwd()})` with `stdout`/`stderr` collectors, timeout via `setTimeout` → `kill("SIGTERM")` → `timedOut = true`.
6. Truncate `stdout`/`stderr` to `maxBytes`, audit `process.audit` with `redactionList()`.
7. Return `ok({exitCode: proc.exitCode ?? 0, stdout: truncatedStdout, stderr: truncatedStderr, timedOut})`.

No `eval`, no `Function`, no shell interpolation.

---

## 12. Behavioral Contract — Git

**[NORMATIVE]** `gitStatus`, `gitDiff`, `gitCommit`, `gitBranch` SHALL delegate to `execProcess` with `git` binary, `cwd: options.repoPath ?? process.cwd()`, `isContained(cwd, repoPath)` if `repoPath` provided, `allowExec: true` required (inherited via `options.allowExec`).

- `gitStatus` → `execProcess("git", ["status","--porcelain","-b"], options)` → parse `## main...origin/main [ahead 1]` + ` M file` → `GitStatus`
- `gitDiff` → `execProcess("git", ["diff","--stat"], options)` + `execProcess("git", ["diff","--cached","--stat"], options)` → `stat` + `nameStatus`
- `gitCommit(message, files, options)` → check `files.length >0` → if 0 → `err(AppError{issue.git.validation})`; check `!files.includes("-A")` → if includes → `err(AppError{issue.git.validation, message: "git add -A not allowed"})`; `execProcess("git", ["add", ...files], options)` → `execProcess("git", ["diff","--cached","--stat"], options)` audit → `execProcess("git", ["commit","-m", message], options)` → return `commit` hash from `git log -1 --pretty=%H`
- `gitBranch` → `execProcess("git", ["branch","-vv"], options)` → parse

No `push` in Phase 7 — `gitPush` is **DEFERRED** to Phase 8 (`ISSU_PROJECT.md:33` separate auth).

---

## 13. Behavioral Contract — httpFetch

**[NORMATIVE]** `httpFetch(url, options?) → Promise<Result<{status: number, body: string, headers: Record<string,string>}, AppError>>` SHALL:

1. `url` must be `http://` or `https://` → if `file://`/`ftp://` → `err(AppError{issue.network.not-allowed})`.
2. Host must not be `RFC1918`/`loopback`/`link-local` unless `options.allowPrivate === true` → if private and not allowed → `err(AppError{issue.network.not-allowed})`.
3. Headers `Authorization`/`Cookie`/`X-Auth-*` blocked unless `options.allowAuth === true` → if blocked and present in `options.headers` → `err(AppError{issue.network.not-allowed})`.
4. `timeoutMs = options.timeoutMs ?? 30000` (max 60000), `maxResponseBytes = options.maxResponseBytes ?? 262144` (256KB, max 1048576).
5. `fetch(url, {signal: AbortSignal.timeout(timeoutMs)})` with `User-Agent: ruflo-http-fetch/1.0` default, truncated `body` to `maxResponseBytes`, audit `fetch.audit`.

---

## 14. Observability and Audit

**[NORMATIVE]** `audit/logger.ts` SHALL export `createToolLogger(level: LogLevel) => Logger` wrapping `createLogger({level, redact: redactionList()})`. Every `writeFile`/`editFile`/`deleteFile`/`execProcess`/`git*`/`httpFetch` SHALL log `tool.audit` with `ctx` (`tool`, `target`, `result`, `permission`) and redacted via `redactionList()`.

---

## 15. Error Handling

**[NORMATIVE]** Every fallible public function returns `Result<T, AppError>` with `issue.*` codes:

- `issue.write.not-contained`, `issue.write.permission-denied`, `issue.write.too-large`
- `issue.edit.not-found`, `issue.edit.multiple-matches`, `issue.edit.noop`
- `issue.delete.not-found`, `issue.delete.permission-denied`
- `issue.process.permission-denied`, `issue.process.not-contained`, `issue.process.validation`, `issue.process.timeout`
- `issue.git.validation`, `issue.git.not-contained`, `issue.git.not-found`
- `issue.network.not-allowed`, `issue.network.timeout`, `issue.network.too-large`

`AppError` fields: `code`, `message`, `details?`, `cause?`, `recoverable?`. No `throw` of raw `Error` beyond `AppError`.

---

## 16. Security Requirements

**[NORMATIVE]** Per `ISSU_PROJECT.md:799-847` and `BLUEPRINT.md:17`:

- Path traversal: every `target`, `cwd`, `repoPath` validated via `isContained`/`assertContained` before `fs`/`spawn`/`git`.
- No `eval`, `Function`, `tsconfig` paths workaround, fake packages — `ISSU_PROJECT.md:17`.
- No `fs` outside `phase-07/src` (grep must be 0 hits for `node:fs` outside this module — but this module is the *allowed* `fs` owner).
- Secrets: `getSecret` + `redactionList()` before any log; no persistence.
- Provider/model: seam only, no binding, no API key handling.
- Permission boundaries: deny-by-default, explicit `allowWrite`/`allowExec` or `ALLOW_PRIVATE` flag.
- Network: allowlist, header sanitization, size cap, timeout.

---

## 17. Determinism and Reproducibility

**[NORMATIVE]** `writeFile` with identical `target`+`content`+`permission` is deterministic where FS is mocked (tests use `tmpdir` + `mkdtemp`); `execProcess`/`httpFetch` are **documented as non-deterministic** (timing, network, external data) per `BLUEPRINT.md:41` non-goals, tests assert determinism for mocked FS and explicitly mark non-determinism for real process/network (time-dependent, environment-dependent, external-data dependence) per `ISSU_PROJECT.md:21` (do not claim beyond evidence).

---

## 18. Implementation Handoff Conditions

Implementation is **NOT authorized** until:

1. This Specification is **accepted** by Owner (Status → ACCEPTED + End-block).
2. `ISSU_PROJECT.md:574-611` Implementation Readiness Audit passes (Blueprint, accepted DEFINE, RESEARCH, ARCHITECTURE, DECISIONS, SPECIFICATION read; scope inventory with AUTHORIZED/UNAUTHORIZED classification; frozen dependencies, public contract, test obligations, config/dependency restrictions, generated artifacts, security boundaries verified).
3. Separate Owner **implementation authorization** is given (DEFINE covers DEFINE ONLY; RESEARCH covers RESEARCH ONLY; ARCHITECTURE covers ARCHITECTURE ONLY; SPECIFICATION covers SPECIFICATION ONLY).

---

## 19. Quality and Verification Gates

**[NORMATIVE]** Implementation SHALL pass:

- `npm run typecheck` (no `TS2307` workaround)
- `npm run lint` (0 errors, `no-restricted-imports` for deep imports)
- `npm run format:check` (Prettier)
- `npm test` (Vitest, all tests PASS)
- `npm run test:coverage` (provider v8, `include: ["src/**/*.ts"]`, thresholds **≥80%** on lines, statements, functions, branches)
- `npm run build` (`tsc -p tsconfig.build.json`, `dist/` generated, `dist/index.d.ts` matches barrel)
- `npm audit --audit-level=high` (0 vulnerabilities)
- Security Audit per §16 (grep 0 hits for `child_process.exec` with shell, `eval`, `Function`)
- Public API audit per §3

---

## 20. Unresolved Items Carried Forward

All UNRESOLVED from Architecture Q7.10 remain UNRESOLVED here until Specification acceptance: exact help text, `maxBytesPerWrite` value, `allowWrite` default, `cwd` vs `repoPath`, `maxBytes`/`timeoutMs` max, `ALLOW_PRIVATE`/`ALLOW_AUTH` env handling, `recursive` flag for delete.

No UNRESOLVED is silently resolved as a requirement; it remains UNRESOLVED until explicitly decided at Specification acceptance.

---

## 21. End-of-Document Block

```
PHASE 7 SPECIFICATION RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 7 SPECIFICATION STAGE: ACCEPTED — IMPLEMENTATION AUTHORIZED (owner, 2026-08-22)
IMPLEMENTATION AUTHORIZED: YES (owner, 2026-08-22)
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 8 WORK STARTED: NO
COMMIT/PUSH: NO
```
