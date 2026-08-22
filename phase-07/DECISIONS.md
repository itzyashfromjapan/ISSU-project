# ISSU — Phase 7: Write & Execution Tooling — Architecture Decisions

**Phase:** 7 — Write & Execution Tooling
**Stage:** ARCHITECTURE (owner-authorized 2026-08-22)
**Status:** Draft — records the architectural decisions made in `./ARCHITECTURE.md`; decisions become **Approved** at Architecture acceptance and **Frozen** at the Phase 7 phase freeze
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative specification:** `./ARCHITECTURE.md`
**License:** Apache License 2.0

This file records the **genuinely non-obvious architectural decisions** made by the Phase 7 ARCHITECTURE stage. Per BLUEPRINT §7.11 and §30, each decision includes Decision, Context, Evidence, Alternatives, Rationale, Consequences, and Status. Decision IDs are stable references used across the Phase 7 documents.

No decision here contradicts the frozen Phase 1,2,3,5,6 contracts, which remain authoritative. No decision resolves a deferred §22.4/§22.5 or Q4.22 without separate Owner authorization beyond DEFINE's §22.3.

---

## AD-7.1 — Phase 7 consumes frozen contracts barrel-only

- **Decision:** Phase 7 consumes Phase 1 (`@issue/foundation`), Phase 2 (`@issue/tool-runtime`), Phase 3 (`@issue/integration`), Phase 5 (`@issue/analytics`), and Phase 6 (`@issue/config-cli`) **only through their public package barrels**, with zero deep imports.
- **Context:** Phase 6 AD-6.1 established barrel-only consumption for five consumers (1/2/3/5) — Phase 7 now consumes six. `isContained` + `Result` + `Logger` are the shared contracts.
- **Evidence:** FACT — Phase 6 `ARCHITECTURE.md:3.1-3.5`; PRECEDENT — Phase 6 AD-6.1 (`phase-06/DECISIONS.md:AD-6.1`); R7.1.
- **Alternatives:** (1) deep imports of internal modules; (2) reimplementing frozen behavior in Phase 7.
- **Rationale:** Preserves phase isolation, contract stability, and frozen-phase integrity. Deep imports would expose private modules not part of public surface.
- **Consequences:** Any behavior needed from frozen phase must be reachable via public exports; internal modules inaccessible.
- **Status:** Draft (awaiting Architecture acceptance).

---

## AD-7.2 — writeFile with isContained + permission + audit

- **Decision:** `writeFile(target, content, options?) → Promise<Result<{bytesWritten: number}, AppError>>` checks `isContained(cwd, target)` → if not → `issue.write.not-contained`; checks `permission.allowWrite` (default false) → if false → `issue.write.permission-denied`; then `fs.writeFile` with `utf8`, `bytesWritten` capped by `maxBytesPerWrite` (default 1 MiB), audit `write.audit` via `Logger` with `redactionList()`.
- **Context:** BLUEPRINT §17 `Filesystem permissions` + `Audit logs`, `ISSU_PROJECT.md:23` `filesystem access` + `local-file access` + `write/edit/delete capabilities`.
- **Evidence:** FACT — `phase-02/src/internal/runtime.ts:48,53` `isContained` enforcement on `readFile`; R7.2.
- **Alternatives:** (1) Unbounded `fs.writeFile` (rejected: path traversal, no permission, no audit).
- **Rationale:** Secure by default, auditable, reuse `isContained` precedent from Phase 2 read path.
- **Consequences:** All writes are permission-bound and logged; `maxBytesPerWrite` prevents unbounded writes.
- **Status:** Draft.

---

## AD-7.3 — editFile exact oldString replacement (no sed/awk)

- **Decision:** `editFile(target, oldString, newString, options?) → Promise<Result<{replaced: boolean}, AppError>>` reads `target` via `isContained` + `readFile`, checks `content.includes(oldString)` → if not → `issue.edit.not-found`; otherwise `content.replace(oldString, newString)` (exact, not regex), writes via `writeFile` semantics, audit `edit.audit`.
- **Context:** `ISSU_PROJECT.md` Tool Use — File Operations `edit` requires `oldString` exact match, not `sed`/`awk`.
- **Evidence:** FACT — `ISSU_PROJECT.md` file-operations rule; R7.2.
- **Alternatives:** (1) `sed`/`awk` (rejected: non-exact, comment-stripping risk).
- **Rationale:** Exact, deterministic, preserves indentation per `edit` tool rule.
- **Consequences:** `replaceAll` flag not in Phase 7 (Phase 8).
- **Status:** Draft.

---

## AD-7.4 — execProcess with spawn shell:false + timeout + maxBytes

- **Decision:** `execProcess(command, args, options?) → Promise<Result<ProcessResult, AppError>>` uses `node:child_process.spawn(command, args, {shell: false, cwd})` with `timeoutMs` default 30000 (max 60000), `maxBytes` 256KB default (1MB max), truncated `stdout`/`stderr`, `Result` with `issue.process.*`, `isContained(cwd, options.cwd)` if `cwd` provided, no shell interpolation, no `eval`/`Function`.
- **Context:** `ISSU_PROJECT.md:23` `process execution` + `command injection`, `BLUEPRINT.md:17` `Command restrictions`.
- **Evidence:** FACT — `ISSU_PROJECT.md:17` No-Workaround Rule; R7.3; no `child_process` in any `phase-06/src` (grep 0 hits).
- **Alternatives:** (1) `child_process.exec` with shell interpolation (rejected: injection).
- **Rationale:** No shell interpolation, bounded, auditable, `spawn` is the secure primitive.
- **Consequences:** `ProcessResult` with `exitCode`, `stdout`, `stderr`, `timedOut`; `issue.process.timeout` on timeout.
- **Status:** Draft.

---

## AD-7.5 — Git via execProcess with scoped staging, no push

- **Decision:** `gitStatus`, `gitDiff`, `gitCommit`, `gitBranch` delegate to `execProcess` with `git` binary, `cwd: repoPath`, `isContained` on `repoPath`, no `git add -A`, no `push` without separate Owner authorization (Phase 7 provides `gitPush` as **DEFERRED**).
- **Context:** `ISSU_PROJECT.md:32-33` commit-scope and push audits require `git status`, `git diff`, `git diff --cached`, `git log`, `git branch -vv`, scoped staging (no `-A`), separate Owner authorization.
- **Evidence:** FACT — `ISSU_PROJECT.md:32-33`, `phase-06/FREEZE_REPORT.md:12-13` scoped staging precedent; R7.4.
- **Alternatives:** (1) `git add -A` + `git commit -m` + `git push` (rejected: scope, auth).
- **Rationale:** Traceable, scoped, `ISSU_PROJECT.md:32-33` compliant.
- **Consequences:** `gitCommit` performs `git diff --cached --stat` audit before commit and returns `Result`; `gitPush` is deferred to Phase 8.
- **Status:** Draft.

---

## AD-7.6 — httpFetch with allowlist + timeout + header sanitization

- **Decision:** `httpFetch(url, options?) → Promise<Result<{status: number, body: string, headers: Record<string,string>}, AppError>>` uses `fetch` (Node 22), with `https:` only, no `file://`/`ftp://`/RFC1918/loopback unless `ALLOW_PRIVATE=1`, `timeoutMs` 30000 (60000 max), `maxResponseBytes` 256KB (1MB max), header sanitization (block `Authorization`/`Cookie`/`X-Auth-*` unless `ALLOW_AUTH=1`), `Result` with `issue.network.*`, audit `fetch.audit`.
- **Context:** `ISSU_PROJECT.md:799-847` `network access` + `external data acquisition`, `BLUEPRINT.md:17` `Network access`.
- **Evidence:** FACT — `Ruflo http_fetch` §5.1.8 (guarded fetch with allowlist, timeout, size cap, header sanitization); R7.5; Phase 5 excluded external/network acquisition.
- **Alternatives:** (1) Unbounded `fetch` (rejected: SSRF, credential leakage).
- **Rationale:** Secure by default, `ADR-164 §5.1.8` compliant, `ISSU_PROJECT.md:17` No-Workaround.
- **Consequences:** `httpFetch` is the only network seam; all other phases remain offline.
- **Status:** Draft.

---

## AD-7.7 — Deny-by-default + isContained + ResourceBounds

- **Decision:** Deny-by-default: every `target`, `cwd`, `repoPath`, `url` host must pass `isContained` or allowlist; `writeFile` checks `permission.allowWrite` (default false), `execProcess` checks `permission.allowExec` (default false), `httpFetch` checks URL allowlist; `ResourceBounds` for writes (`maxBytesPerWrite`), process (`timeoutMs`, `maxBytes`), fetch (`maxResponseBytes`).
- **Context:** `BLUEPRINT.md:17` `Permission boundaries` + `Sandboxing` + `Deny-by-default`, `ISSU_PROJECT.md:23` `permission boundaries` + `deny-by-default behavior`.
- **Evidence:** FACT — `phase-01-foundation/src/paths/contain.ts` `isContained`/`assertContained`; R7.6.
- **Alternatives:** (1) Allow-by-default (rejected: insecure).
- **Rationale:** Secure by default, explicit permission required for powerful actions.
- **Consequences:** All powerful actions require explicit `allowWrite`/`allowExec` or `ALLOW_PRIVATE` flag.
- **Status:** Draft.

---

## AD-7.8 — Audit via Logger+redactionList, credential via getSecret

- **Decision:** `audit/logger.ts` wraps `createLogger({level: "info", redact: redactionList()})` + `getSecret` for credential protection; every `writeFile`/`editFile`/`deleteFile`/`execProcess`/`git*`/`httpFetch` logs `tool.audit` with `ctx` (`tool`, `target`, `result`, `permission`, `audit`) and redacts via `redactionList`.
- **Context:** `BLUEPRINT.md:17` `Audit logs` + `Credential protection`, `ISSU_PROJECT.md:23` `secret exposure` + `sensitive logging`.
- **Evidence:** FACT — `phase-01-foundation/src/env/secrets.ts` `getSecret`, `phase-01-foundation/src/logging/redaction.ts` `redactionList`, `phase-06/src/internal/observability.ts` `createCliLogger`; R7.7.
- **Alternatives:** (1) No audit logging (rejected: not observable).
- **Rationale:** Auditable, credential-protected, reuse `Logger` contract.
- **Consequences:** Every tool operation is logged and redacted; safe failure mode.
- **Status:** Draft.

---

## AD-7.9 — §22.4/§22.5/Q4.22 remain DEFERRED

- **Decision:** No decision here resolves §22.4 model-provider binding, §22.5 workspace/monorepo migration, or Q4.22 provider binding beyond the seam. They remain **DEFERRED** and appear as **UNRESOLVED** in Architecture Q7.9.
- **Context:** `phase-07/DEFINE.md:12` explicitly defers them; prior phases' deferred lists preserved.
- **Evidence:** FACT — `phase-07/DEFINE.md:12`; R7.10.
- **Alternatives:** (1) Resolve them now (rejected: requires separate Owner authorization, would expand scope).
- **Rationale:** Keeps Phase 7 scope disciplined; avoids scope creep and aligns with `BLUEPRINT.md:616-628` non-goals.
- **Consequences:** Future phases can address them without Phase 7 being blocked.
- **Status:** Draft.

---

## Status Summary

All 9 decisions are **Draft** — awaiting Architecture acceptance. At Architecture acceptance they become **Approved**; at Phase 7 freeze they become **Frozen**.
