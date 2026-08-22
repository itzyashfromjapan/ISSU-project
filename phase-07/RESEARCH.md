# ISSU — Phase 7: Write & Execution Tooling — Research Record

**Phase:** 7 — Write & Execution Tooling
**Stage:** RESEARCH (owner-authorized; accepted DEFINE → Research)
**Status:** ACCEPTED — Owner accepted the Phase 7 Research record (owner, 2026-08-22)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Accepted DEFINE:** `./DEFINE.md` (ACCEPTED, owner, 2026-08-22)
**ISSU Governance:** `../ISSU_PROJECT.md` (1578 lines, durable 59590d0)
**License:** Apache License 2.0

This is a **NEW GOVERNED RESEARCH STAGE**. It is NOT a reconstruction of a missing Phase 7 Research record — no prior Phase 7 durable record exists (verified: `phase-07/` missing until 2026-08-22).

---

## 1. Research Status

DRAFT — evidence gathered and recorded for Owner review. Research does NOT decide Architecture, public APIs, schemas, algorithms, technology, provider binding, or acceptance criteria; those remain UNRESOLVED unless stated otherwise here.

---

## 2. Research Authorization

Owner decision: **ACCEPT the NEW GOVERNED Phase 7 DEFINE record and AUTHORIZE Phase 7 RESEARCH** (2026-08-22, "move on next phase" + prior "Continue. You are working in the right direction."). Authorized work: evidence-gathering and analysis for the later Architecture and Specification stages, within the mandatory boundaries (no modification of Phase 1/2/3/4/5/6, BLUEPRINT, `ISSU_PROJECT.md`, no TS2307 fix or paths workaround, no §22.4/§22.5/Q4.22 resolution beyond DEFINE's §22.3, no Phase 8 work). Research does NOT authorize Architecture, Specification, Design decisions, or Implementation.

---

## 3. Accepted DEFINE Reference

Accepted as the current authoritative definition of Phase 7 (`phase-07/DEFINE.md`, ACCEPTED 2026-08-22):

- **Domain:** Write & Execution Tooling — permission-bound, sandboxed, auditable file writes, edits, deletes, process execution, Git operations, and network fetch, resolving BLUEPRINT §22.3 and operationalizing §17 Security.
- **Public surface:** to be defined at Specification (new Phase 7 barrel, not exceeding frozen Phase 6 surface except via explicit new barrel).
- **Scope:** `writeFile/editFile/deleteFile` with `isContained` + permission + audit; `execProcess` with `spawn` (no shell), timeout, `ResourceBounds`; `gitStatus/gitDiff/gitCommit/gitBranch` via `execProcess`; `httpFetch` with allowlist, timeout, size cap, header sanitization; permission & audit via `Logger` + `redactionList`.
- **Boundaries:** no provider/model binding (§22.4/Q4.22), no workspace migration (§22.5), no persistence beyond tool operations, no frozen-phase modification, no unbounded `exec` or `eval`.
- **Dependencies:** Phase 1/2/3/5/6 public barrels only via `file:` refs (Phase 4 not consumed by default).
- **Deferred:** §22.4, §22.5, Q4.22, domains beyond write/execution remain out-of-scope; §22.3 now in-scope.
- **Objectives:** permission-bound sandboxed tooling, deterministic where applicable, `npm run check` + `build` + `test:coverage ≥80%`, `Security Audit` PASS per `ISSU_PROJECT.md:799-847`.

---

## 4. Research Questions

| ID | Question |
| --- | --- |
| R7.1 | What frozen-contract surface may Phase 7 legitimately consume, and through which seams? |
| R7.2 | What deterministic write/edit/delete precedent exists and how should it be bounded? |
| R7.3 | How should process execution be bounded (no shell, timeout, ResourceBounds, safe failure)? |
| R7.4 | How should Git operations be scoped (status/diff/commit/branch, no push without auth, no add -A)? |
| R7.5 | How should network fetch be guarded (allowlist, timeout, size cap, header sanitization)? |
| R7.6 | How should permission boundaries and sandboxing be modeled (deny-by-default, isContained, user confirmation)? |
| R7.7 | How should audit logging and credential protection be wired (Logger, redactionList, getSecret)? |
| R7.8 | How should determinism be preserved where applicable and non-determinism documented where not? |
| R7.9 | What is the provider/model seam precedent and what remains deferred (Q4.22)? |
| R7.10 | Which deferred items (§22.4/§22.5, Q4.22) remain outside scope and how are they handled? |
| R7.11 | What security implications follow from write/process/Git/network boundaries (§17 11 vectors + ISSU_PROJECT 22 vectors)? |
| R7.12 | What engineering trade-offs attend the permission-bound sandboxed tooling approach? |

---

## 5. Evidence / Source Inventory

Source-of-truth order per authorization; every item read/verified this session:

- `BLUEPRINT.md` — §5 Initial Scope, §6 Future Scope, §7 Principles, §8 Architecture, §9 Phase Architecture, §10 Independence, §11 Lifecycle, §12 Testing, §17 Security (11 vectors), §23 Configuration, §24 Observability, §25 Integration, §26 Non-Goals, §28 Quality, §29 Decision-Making, §30 Governance, §33 Discipline
- `ISSU_PROJECT.md` — §9-§10 DEFINE, §17 No-Workaround, §23 Security Audit (22 vectors), §38-39 Next Phase
- `phase-01-foundation/src/index.ts` — frozen public barrel (AppError, Result, Logger, loadConfig, readEnv, getSecret, assertContained, isContained, redactionList, runCli)
- `phase-01-foundation/src/config/load.ts`, `paths/contain.ts`, `logging/pino-logger.ts`, `errors/app-error.ts`, `result/result.ts`
- `phase-02/src/index.ts` — frozen `@issue/tool-runtime` barrel (20 types + 3 funcs, read-only FS, 91/91)
- `phase-02/src/internal/runtime.ts` — `isContained` enforcement on every `readFile`/`listDirectory`, `ResourceBounds` precedent
- `phase-03/src/index.ts` — frozen `@issue/integration` barrel (harness, 65/65)
- `phase-05/src/index.ts` — frozen `@issue/analytics` barrel (61/61)
- `phase-06/src/index.ts` — frozen `@issue/config-cli` barrel (66/66, 88.46/82.94, `resolveConfig`/`parseArgs`/`runCli`)
- `phase-06/src/internal/config.ts` — pure `resolveConfig` precedent, `ConfigProvenance` + `verifyConfig`
- `phase-06/src/internal/cli.ts` — `parseArgs` pure, `runCli` with `isContained` before `readFile`
- Git — `main 59590d0` synced, `phase-07/` missing until 2026-08-22

---

## 6. Research Findings

### R7.1 — Frozen-contract consumption

**[FACT]** Phase 7 may consume: `@issue/foundation` (AppError, Result, Logger, createLogger, redactionList, readEnv, getSecret, assertContained, isContained, loadConfig), `@issue/tool-runtime` (ToolOperation, FileContent, DirectoryEntry, ResourceBounds, runTask), `@issue/integration` (harness), `@issue/analytics` (runAnalyticsTask), `@issue/config-cli` (resolveConfig, ResolvedConfig) — all via **public barrels only**, no deep imports (`@issue/*/internal`), no `require`, verified in `phase-06/package.json` precedent.

**[PRECEDENT]** Phase 6 AD-6.1 established barrel-only consumption for five consumers (1/2/3/5) — Phase 7 follows same for six consumers (1/2/3/5/6).

**[INFERENCE]** Any write/process/Git/network behavior needed from frozen phases must be reachable via public exports; internal modules are inaccessible — preserves frozen-phase integrity.

**[UNRESOLVED]** Exact Phase 7 barrel exports — Specification firewall.

---

### R7.2 — Deterministic write/edit/delete precedent

**[FACT]** Phase 2 `phase-02/src/internal/runtime.ts:48,53` enforces `isContained(root, target)` before every `readFile`; Phase 6 `phase-06/src/internal/cli.ts:200` enforces `isContained(cwd, configPath)` before `readFile`. No write precedent exists — Phase 6 is read-only by design (`DEFINE.md:8` no `fs.write`).

**[PRECEDENT]** Phase 2 `phase-02/SPECIFICATION.md` defines `ResourceBounds` (maxRetries, maxCorrections, maxVerifications, maxBytesPerRead, chunkSize) — Phase 7 should extend this to `maxBytesPerWrite` and `maxFileOps`.

**[INFERENCE]** Phase 7 write/edit/delete should mirror read precedent: `isContained(cwd, target)` + `assertContained` + permission check + `Result<AppError>` + audit log, with `editFile` requiring exact `oldString` match (no `sed`/`awk` via `ISSU_PROJECT.md` file-operations rule) and `deleteFile` requiring explicit flag for recursive.

---

### R7.3 — Process execution bounding

**[FACT]** `ISSU_PROJECT.md:17` No-Workaround Rule prohibits `tsconfig` paths, fake packages, `monkey patches`; §23 lists `process execution` and `command injection` as vectors. `phase-01-foundation/src/config/load.ts` uses `spawnSync` only in tests, not in src.

**[PRECEDENT]** No `child_process` in any `phase-06/src` (grep 0 hits) — Phase 7 will be the first to use it.

**[INFERENCE]** Phase 7 `execProcess` should use `node:child_process.spawn` (not `exec` with shell), with `spawn('cmd', args, {shell: false})`, timeout, `maxBytes` cap, `cwd` is `isContained`, no shell interpolation, no `eval`, `ProcessResult` with `stdout/stderr` truncated to `maxBytes`, `exitCode`, `timedOut`.

---

### R7.4 — Git operations scoping

**[FACT]** `ISSU_PROJECT.md:32-33` Commit-scope and Push audits require `git status`, `git diff`, `git diff --cached`, `git log`, `git branch -vv`, scoped staging (no `git add -A`), and separate Owner authorization for commit/push.

**[PRECEDENT]** Phase 6 `phase-06/FREEZE_REPORT.md:12-13` demonstrated scoped staging `git add phase-06/...` + `git commit` + `git push` with explicit messages.

**[INFERENCE]** Phase 7 `gitStatus`, `gitDiff`, `gitCommit`, `gitBranch` should delegate to `execProcess` with `git` binary, validate `repoPath` via `isContained`, enforce scoped staging (no `-A`), and require `auditLog` before commit.

---

### R7.5 — Network fetch guarding

**[FACT]** `ISSU_PROJECT.md:799-847` lists `network access`, `external data acquisition` as vectors; `BLUEPRINT.md:17` lists `Network access`. Phase 5 explicitly excluded external/network acquisition (`phase-05/DEFINE.md:8`).

**[INFERENCE]** Phase 7 `httpFetch` should use `fetch` (Node 22), with `allowlist` (default `https:` only, no `file://`/`ftp://`/RFC1918/loopback unless `ALLOW_PRIVATE=1`), `timeoutMs` (default 30000, max 60000), `maxResponseBytes` (256KB default, 1MB max), header sanitization (block `Authorization`/`Cookie`/`X-Auth-*` unless `ALLOW_AUTH=1`), truncated response, `Result` with `issue.network.*` codes.

---

### R7.6 — Permission boundaries and sandboxing

**[FACT]** `phase-01-foundation/src/paths/contain.ts` exports `isContained`/`assertContained`; `BLUEPRINT.md:17` requires `Permission boundaries` and `Sandboxing`.

**[PRECEDENT]** Phase 2 `runtime.ts` denies by default (`!isContained` → `issue.tool.not-contained`).

**[INFERENCE]** Phase 7 should be deny-by-default: every file target, `cwd`, `repoPath`, `url` host must pass `isContained` or allowlist; `writeFile` checks `isContained(cwd, target)` + `permission: {allowWrite: true}` (default false); `execProcess` checks `isContained(cwd, commandCwd)`; `httpFetch` checks URL allowlist.

---

### R7.7 — Audit logging and credential protection

**[FACT]** `phase-01-foundation/src/env/secrets.ts` `getSecret` + `phase-01-foundation/src/logging/redaction.ts` `redactionList` + `phase-06/src/internal/observability.ts` `createCliLogger({redact: redactionList()})`.

**[PRECEDENT]** Phase 6 `phase-06/src/internal/cli.ts:272` logs `run.dispatched` with `redactionList`.

**[INFERENCE]** Phase 7 should log every write/edit/delete/exec/commit/fetch via `createLogger({redact: redactionList()})` with `ctx` (`tool`, `target`, `result`, `permission`) and redact secrets/content; credential protection via `getSecret` (no file persistence).

---

### R7.8 — Determinism preservation

**[FACT]** Phase 6 `phase-06/tests/determinism.test.ts` asserts identical inputs → identical `ResolvedConfig`.

**[INFERENCE]** Phase 7 writes are **not deterministic** (filesystem state, process timing, network), so determinism is **documented as not applicable** for `execProcess`/`httpFetch` (timeout, network), but `writeFile` with identical `target`+`content`+`permission` is deterministic where filesystem is mocked; tests should assert determinism for mocked FS and explicitly mark non-deterministic for real process/network (time-dependent, environment-dependent).

---

### R7.9 — Provider/model seam precedent

**[FACT]** Phase 4 `phase-04/src/internal/provider.ts` + Phase 5 `phase-05/src/internal/provider.ts` + Phase 6 `phase-06/src/internal/config.ts` (no provider) define seams with deterministic stub, no binding. `phase-06/README.md:100-103` confirms "No model/provider is bound (Q4.22 DEFERRED)."

**[INFERENCE]** Phase 7 may define `WriteDecisionProvider` seam for future model-based write suggestions, but default stub must be deterministic (no model). Q4.22 remains deferred — no `provider` bound in `package.json`.

---

### R7.10 — Deferred items remaining outside scope

**[DURABLE FACT]** Deferred per `phase-06/DEFINE.md:12` and `phase-06/FREEZE_REPORT.md:10`: §22.4 model-provider binding, §22.5 workspace/monorepo, Q4.22.

**[NEW DEFINE DECISION]** Phase 7 resolves §22.3 only; §22.4/§22.5/Q4.22 remain deferred (see `phase-07/DEFINE.md:12`).

---

### R7.11 — Security implications (§17 11 vectors + ISSU_PROJECT 22 vectors)

**[FACT]** `BLUEPRINT.md:17` 11 vectors + `ISSU_PROJECT.md:799-847` 22 vectors: trust boundaries, input validation, path traversal, filesystem access, external data, network, process exec, Git, write/edit/delete, command injection, deserialization, secret exposure, permission boundaries, deny-by-default, etc.

**[INFERENCE]** Phase 7 introduces new vectors: file writes (path traversal via `isContained`, permission), process exec (command injection via no-shell, timeout, maxBytes), Git (scoped staging, no `-A`), network (allowlist, header sanitization). Security Audit must verify each before Freeze.

---

### R7.12 — Engineering trade-offs (permission-bound sandboxed tooling)

**[FACT]** Phase 1 `phase-01-foundation/DECISIONS.md:D4` evaluated config layering; Phase 6 `phase-06/ARCHITECTURE.md:Q6.12` chose minimal CLI over rich CLI.

**[INFERENCE]** Phase 7 trade-off: **permission-bound sandboxed tooling** (pros: secure by default, auditable, reuse `isContained` + `Result` + `Logger`, small surface) vs **rich tooling with shell interpolation and `git add -A`** (cons: command injection, scope creep, violates `ISSU_PROJECT.md:17` No-Workaround). Choose minimal: explicit `writeFile(content)`, `editFile(oldString,newString)`, `deleteFile` with flag, `execProcess` with `spawn` no shell, `gitCommit` with scoped staging, `httpFetch` with allowlist — extensions via future phase.

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

All deferred items per `phase-07/DEFINE.md:12` are preserved as **UNRESOLVED** and will be carried forward to Architecture/Specification as `SPECIFICATION INPUT / UNRESOLVED` (Specification firewall). No deferred item is silently resolved by this Research.

---

## 9. Research Completion Audit

**[NEW RESEARCH DECISION — REQUIRES OWNER ACCEPTANCE]** This Research stage is complete only when:

1. This record exists and satisfies Research authorization elements (questions R7.1-12 addressed, evidence traceable, FACT/PRECEDENT/INFERENCE/UNRESOLVED preserved, conflicts preserved, deferred preserved, no architecture decisions smuggled, frozen boundaries untouched, no implementation started).
2. Owner reviews this record and **explicitly accepts** it in a separate Owner decision (file edit to `Status: ACCEPTED` + End-of-Document block).
3. No Architecture, Specification, Implementation, Test, Refactor, or Freeze work has begun under this authorization.

Progression to Architecture requires a separate Owner decision; it is NOT implied by acceptance of this Research.

---

## 10. Unresolved Items Carried Forward

- Historical Phase 7 records: NONE (verified none exists).
- Exact public API (write/edit/delete/process/Git/fetch signatures), permission confirmation flow, audit log schema, ResourceBounds for writes, allowlist for fetch — UNRESOLVED (Architecture/Specification).
- Whether Phase 4 (`@issue/research`) is consumed — default no, remains UNRESOLVED until Specification.
- Q4.22 provider binding: still DEFERRED.
- TS2307 defect: out-of-scope, carried as UNRESOLVED.

---

## 11. Traceability

| Element | Source |
| --- | --- |
| R7.1 frozen contracts | `phase-01-foundation/src/index.ts`, `phase-02/src/index.ts`, `phase-03/src/index.ts`, `phase-05/src/index.ts`, `phase-06/src/index.ts` |
| R7.2 write precedent | `phase-02/src/internal/runtime.ts`, `phase-06/src/internal/cli.ts` |
| R7.3 process bounding | `ISSU_PROJECT.md:17`, `phase-01-foundation/src/config/load.ts` (no child_process in src) |
| R7.4 Git scoping | `ISSU_PROJECT.md:32-33`, `phase-06/FREEZE_REPORT.md:12-13` |
| R7.5 network guarding | `ISSU_PROJECT.md:799-847`, `BLUEPRINT.md:17`, `phase-05/DEFINE.md:8` |
| R7.6 permission/sandboxing | `phase-01-foundation/src/paths/contain.ts`, `BLUEPRINT.md:17` |
| R7.7 audit/credential | `phase-01-foundation/src/env/secrets.ts`, `phase-06/src/internal/observability.ts` |
| R7.8 determinism | `phase-06/tests/determinism.test.ts` |
| R7.9 provider seam | `phase-04/src/internal/provider.ts`, `phase-05/src/internal/provider.ts` |
| R7.10 deferred | `phase-06/DEFINE.md:12`, `phase-07/DEFINE.md:12` |
| R7.11 security vectors | `ISSU_PROJECT.md:799-847`, `BLUEPRINT.md:17` |
| R7.12 trade-offs | `phase-01-foundation/DECISIONS.md:D4`, `phase-06/ARCHITECTURE.md:Q6.12` |

---

## 12. Non-Authorization Statement

This Research authorizes **RESEARCH ONLY**. The following are NOT authorized and must not begin without a separate Owner decision:

- **Architecture** (no `ARCHITECTURE.md`/`DECISIONS.md` creation).
- **Specification** (no `SPECIFICATION.md`).
- **Implementation** (no `phase-07/src/**`, `phase-07/tests/**`, `phase-07/package.json`, tsconfigs, dependencies).
- **Test**, **Refactor**, **Freeze**, **Next Phase**, TS2307 fix, frozen-phase modification, §22.4/§22.5/Q4.22 resolution beyond DEFINE's §22.3, Phase 8 work.

---

## 13. End-of-Document Block

```
PHASE 7 RESEARCH RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 7 RESEARCH STAGE: ACCEPTED — ARCHITECTURE AUTHORIZED (owner, 2026-08-22)
HISTORICAL RESEARCH RECOVERED: NO (none exists; not reconstructed)
ARCHITECTURE AUTHORIZED: YES (owner, 2026-08-22)
SPECIFICATION AUTHORIZED: NO
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 8 WORK STARTED: NO
COMMIT/PUSH: NO
```
