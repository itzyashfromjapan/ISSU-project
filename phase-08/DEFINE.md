# ISSU — Phase 8: Model Provider Binding — Governed DEFINE Record

**Phase:** 8 — Model Provider Binding
**Status:** ACCEPTED — Owner accepted the NEW GOVERNED Phase 8 DEFINE record as the current authoritative definition of Phase 8 (2026-08-22)
**Authorization basis:** Owner decision "continue" (2026-08-22) — interpreted as acceptance of the Phase 8 DEFINE created from BLUEPRINT §22.4 + §18 Model Independence existence audit, and authorization to proceed to RESEARCH (one-gate, DEFINE ONLY was 2026-08-22 draft; now RESEARCH authorized)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**ISSU Governance:** `../ISSU_PROJECT.md` (1578 lines, durable 0066055)
**License:** Apache License 2.0

---

## 1. Record Identity and Status

This document is a **NEW GOVERNED DEFINE RECORD** for Phase 8. It establishes the current authoritative definition of Phase 8 from BLUEPRINT constraints and durable source material.

- This is **NOT a reconstruction** of a prior Phase 8 record — no prior Phase 8 durable record exists (verified: `phase-08/` missing until 2026-08-22, `git ls-files | grep phase-08` empty, `phase-07/DEFINE.md:12` leaves §22.4 deferred).
- Status was **DRAFT — PENDING OWNER ACCEPTANCE** at creation (2026-08-22). Owner has now **ACCEPTED** this DEFINE on 2026-08-22 via explicit "continue" instruction, which authorizes RESEARCH as the next gate. This acceptance does NOT authorize Architecture/Specification/Implementation/Test/Refactor/Freeze/Next Phase beyond RESEARCH.
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
- `phase-01-foundation/` — FROZEN 2026-08-09, `657f3d9`, `@issue/foundation 0.1.0` (barrel: AppError, Result, Logger, loadConfig, readEnv, getSecret, assertContained, isContained)
- `phase-02/` — FROZEN 2026-08-10, `8dde232`, `@issue/tool-runtime 0.1.0` (91/91)
- `phase-03/` — FROZEN 2026-08-12, `8dde232`, `@issue/integration 0.1.0` (65/65)
- `phase-04/` — CLOSED/FROZEN, `8dde232`, `@issue/research 0.1.0` (51/51)
- `phase-05/` — FROZEN/RELEASE-READY 2026-08-20, `226c467+8dde232`, `@issue/analytics 0.1.0` (61/61)
- `phase-06/` — FROZEN 2026-08-22, `b72a78b+59590d0`, `@issue/config-cli 0.1.0` (66/66, config schema + CLI)
- `phase-07/` — FROZEN 2026-08-22, `0066055`, `@issue/write-execution 0.1.0` (38/38, write/edit/delete, process, Git, fetch)
- Git — `main 0066055` synced with `origin/main`, clean (only `.claude-flow/.swarm` untracked, correctly excluded per `ISSU_PROJECT.md:1137`)

---

## 3. Purpose

**[BLUEPRINT CONSTRAINT]** BLUEPRINT §18 Model Independence: *ISSU should avoid unnecessary dependence on a single AI model provider. Where practical, the architecture should support multiple model backends. Potential model categories may include: Cloud models, Local models, Open-source models, Specialized models, Future model architectures. The exact providers and APIs will be decided during implementation.*

**[BLUEPRINT CONSTRAINT]** BLUEPRINT §22.4 (deferred via `phase-07/DEFINE.md:12`): *model-provider binding* — explicitly out-of-scope for Phase 7 and preserved as deferred. `Q4.22` provider/model binding decision is the same deferred item, recorded in `phase-07/RESEARCH.md:10` and `phase-06/DEFINE.md:12`.

**[NEW DEFINE DECISION]** Phase 8 establishes the **Model Provider Binding** foundation — the provider abstraction, credential-bound binding, and model routing that makes the deterministic Phase 7 tooling capable of *reasoning* via models, without locking the architecture to a single provider. This directly resolves **BLUEPRINT §22.4 / Q4.22** and operationalizes **§18 Model Independence** + **§17 Security** (credential protection) for the existing codebase.

**[GOVERNANCE CONSTRAINT]** Each phase must have a clearly defined responsibility and its own implementation/tests/docs/public interface, and must depend on another phase's contract, not its implementation (`BLUEPRINT.md:274-297`, `ISSU_PROJECT.md:128-147`).

---

## 4. Scope

**[NEW DEFINE DECISION]** The Phase 8 core covers:

- **Provider abstraction** (deferred §22.4): `ModelProvider` interface (`generateText`, `generateStructured`, `countTokens`) + `ProviderConfig` (provider name, model id, apiKey via `getSecret`, baseUrl, timeout, maxRetries) + `ProviderResult` (`Result<T, AppError>`) + `ProviderError` mapping.
- **Model routing** (deferred Q4.22): `ModelRouter` (`route(task) → ModelProvider`) with deterministic, cost-aware, capability-aware routing (no hard-coded provider; `file:../phase-06` `ResolvedConfig` `providers` section is the source of truth).
- **Credential protection** (§17): `getSecret` + `redactionList` + `ProviderAuth` (apiKey never logged, never persisted, `issue.provider.auth` error if missing, `issue.provider.not-configured` if provider not in `ResolvedConfig`).
- **Execution integration** (§7.4): `callModel` seam that the Phase 7 `execProcess`/`writeFile` tooling can invoke via provider, with `Result` + audit logging via Phase 7 `createToolLogger`.

**[DURABLE FACT]** Public surface will be defined at Specification stage and SHALL NOT exceed frozen Phase 7 surface except via explicit new Phase 8 barrel (to be specified at ARCHITECTURE/SPECIFICATION).

---

## 5. Objectives

**[NEW DEFINE DECISION]** Phase 8 objectives (measurable at TEST/VERIFICATION):

- Resolve BLUEPRINT §22.4 / Q4.22 as **implemented capability**, not deferred note — provider binding becomes tested, documented, frozen contract with multiple-backend support (at least two providers, e.g., `anthropic` and `openai` via `fetch`).
- Provide provider binding that is **model-independent**: identical `ProviderConfig` + task → identical `Provider` selection (deterministic routing where possible, documented non-determinism for load-based routing).
- Provide a provider API that passes `npm run check` (`typecheck+lint+format:check+test`), `npm run build`, and `npm run test:coverage` with gate **≥80%**, and respects frozen boundaries (no Phase 1-7 internal imports).
- Preserve `§22.5` workspace/monorepo as **still deferred** unless explicitly authorized (see §8).
- Pass **Security Audit** per `ISSU_PROJECT.md:799-847` (credential protection, secret exposure, provider/model boundaries, permission boundaries, network access via `httpFetch` allowlist) before Freeze.

**[BLUEPRINT CONSTRAINT]** Testing is fundamental; autonomous systems require particular attention to failure handling (`BLUEPRINT.md:333-349`).

---

## 6. Responsibilities

**[NEW DEFINE DECISION]** `@issue/model-provider` (proposed package name, to be finalized at Specification D1) is responsible for:

- Provider abstraction (`ModelProvider` interface + `ProviderConfig` + `ProviderResult`).
- Model routing (`ModelRouter` with deterministic, cost-aware, capability-aware `route`).
- Credential protection (`getSecret` + `redactionList` + `ProviderAuth`).
- Execution integration (`callModel` seam for Phase 7 tooling).

**[GOVERNANCE CONSTRAINT]** Phase 8 must NOT depend on another phase's internal files and must be independently understandable and replaceable (`BLUEPRINT.md:274-297`).

---

## 7. In-Scope Boundaries

**[NEW DEFINE DECISION]** In scope:

- Provider abstraction (`ModelProvider`, `ProviderConfig`, `ProviderResult`, `ProviderError`).
- Model routing (`ModelRouter` with `route(task) → ModelProvider`).
- Credential protection (`getSecret` + `redactionList` + `ProviderAuth`).
- Execution integration (`callModel` via `httpFetch` with allowlist, timeout, size cap).
- Consumption of `@issue/foundation`, `@issue/tool-runtime`, `@issue/integration`, `@issue/analytics`, `@issue/config-cli`, `@issue/write-execution` **through public barrels only** via `file:` refs (precedent: Phase 7 `package.json`).
- Dedicated package under `phase-08/` with its own `src/`, `tests/`, docs, and `package.json` (`private:true`, `type:module`, `engines.node >=22.9.0`, scripts `check/typecheck/build/test/lint/format` per Phase 1 precedent).

---

## 8. Out-of-Scope Boundaries

**[NEW DEFINE DECISION]** Explicitly out of scope (prohibited / remains deferred):

- **BLUEPRINT §22.5**: workspace/monorepo migration — `phase-08/` remains phase-scoped, no root `package.json` workspace.
- **Persistence beyond provider config**: no database, no long-term file persistence beyond provider config reads.
- **Modifying any frozen phase** (01-07), `BLUEPRINT.md`, or `ISSU_PROJECT.md` (§22.4 resolved here via this DEFINE; §22.5 remains deferred unless explicitly authorized).
- **Unbounded model execution** (no `eval`, no `Function`, no unbounded `fetch` without allowlist/timeout).

**[BLUEPRINT CONSTRAINT]** ISSU will not initially attempt to solve AGI or support every domain immediately (`BLUEPRINT.md:616-628`).

---

## 9. Non-Goals

**[NEW DEFINE DECISION]** Non-goals for Phase 8 (carried as **SPECIFICATION §17 UNRESOLVED** if not resolved here):

- Workspace/monorepo migration (§22.5).
- Full persistence requirement.
- Whether Phase 4 (`@issue/research`) is consumed by default (still no, per Phase 7 precedent).
- Confidence calibration beyond provider `Result` (no `AGI`).
- Any domain beyond Model Provider Binding (Education/Business/Robotics etc. remain Future Scope, not Phase 8).

**[DURABLE FACT]** Prior Phase 7 non-goals `phase-07/README.md:7` remain preserved as deferred unless explicitly resolved above (§22.4 now in-scope, §22.5 still out-of-scope).

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

**[NEW DEFINE DECISION]** Phase 8 consumes exactly six frozen packages through public barrels only via `file:` refs (to be recorded in `phase-08/package.json` at Implementation):

| Package | Phase | Source |
| --- | --- | --- |
| `@issue/foundation` | Phase 1 (frozen) | `file:../phase-01-foundation` |
| `@issue/tool-runtime` | Phase 2 (frozen) | `file:../phase-02` |
| `@issue/integration` | Phase 3 (frozen) | `file:../phase-03` |
| `@issue/analytics` | Phase 5 (frozen) | `file:../phase-05` |
| `@issue/config-cli` | Phase 6 (frozen) | `file:../phase-06` |
| `@issue/write-execution` | Phase 7 (frozen) | `file:../phase-07` |

**[DURABLE FACT]** Phase 4 (`@issue/research`) is NOT consumed by default and remains CLOSED/FROZEN, unmodified (`phase-07/DEFINE.md:11` precedent).

**[GOVERNANCE CONSTRAINT]** No deep imports (`@issue/*/internal` or `src` paths), no `require`, no new runtime dependency beyond frozen packages and `node:fetch` via `httpFetch` (bounded, audited) + `pino` via foundation.

---

## 12. Deferred Matters (Remain Outside Scope)

**[NEW DEFINE DECISION]** Deferred and out of scope for Phase 8 (still deferred, not resolved):

- BLUEPRINT §22.5 workspace/monorepo migration.
- Any domain beyond Model Provider Binding (Education/Business/Robotics etc. remain Future Scope, not Phase 8).

**[DURABLE FACT]** Resolved in this DEFINE: §22.4 / Q4.22 model-provider binding are now **in-scope** (previously deferred, now proposed for implementation).

---

## 13. DEFINE-Stage Completion Conditions

**[NEW DEFINE DECISION]** This DEFINE stage is complete only when ALL hold:

1. This record exists and satisfies DEFINE authorization elements (title, status, authorization basis, source-of-truth refs, purpose, scope, objectives, in-scope, out-of-scope, non-goals, frozen-contract deps, deferred, completion conditions, unresolved, traceability, non-reconstruction/non-authorization statements).
2. Owner reviews this record and **explicitly accepts** it in a separate Owner decision (file edit to `Status: ACCEPTED` + End-of-Document block).
3. No Research, Architecture, Specification, Implementation, Test, Refactor, or Freeze work has begun under this authorization.

**[NEW DEFINE DECISION]** Progression to Research requires a separate Owner decision; it is NOT implied by acceptance of this DEFINE.

---

## 14. Explicit Unresolved Items

- **[DURABLE FACT]** Historical Phase 8 records do NOT exist (verified: `phase-08/` missing until 2026-08-22, `git ls-files | grep phase-08` empty). This record does not reconstruct history.
- **[NEW DEFINE DECISION]** Exact public API (ModelProvider, ProviderConfig, ModelRouter, callModel signatures), provider list (anthropic/openai/local), credential flow, routing algorithm, and test thresholds remain **UNRESOLVED** — to be decided at ARCHITECTURE/SPECIFICATION (Specification firewall per `BLUEPRINT.md:246-248`).
- **[DURABLE FACT]** `@issue/foundation` TS2307 `main/types/exports` defect remains unresolved and out-of-scope for Phase 8 DEFINE; Phase 1 is frozen and must not be modified.
- **[BLUEPRINT CONSTRAINT]** Phase 9 remains BLOCKED until its own source-of-truth problem is separately resolved.

---

## 15. Traceability to Source Artifacts

| Element | Source |
| --- | --- |
| Domain label, package identity | `BLUEPRINT.md:18` Model Independence; `BLUEPRINT.md:22.4` model-provider binding deferred; `phase-07/DEFINE.md:12` |
| Purpose (provider binding) | `BLUEPRINT.md:18` (18: Model Independence, 22.4, Q4.22); `phase-07/FREEZE_REPORT.md:10` deferred §22.4 |
| Scope (provider abstraction, routing, credential, execution) | `BLUEPRINT.md:17` Security (credential protection, network access); `ISSU_PROJECT.md:799-847` (22 vectors) |
| Dependencies / boundaries | `phase-07/package.json:dependencies` precedent (`file:` refs); `phase-03` barrel-only |
| Non-goals / deferred | `phase-07/README.md:7`; `BLUEPRINT.md:616-628`; `phase-07/DEFINE.md:12` |
| Lifecycle / governance | `BLUEPRINT.md:301-330` (§11); `BLUEPRINT.md:690-700` (§30); `ISSU_PROJECT.md:9,10,38,39` |
| Deferred §22.4/Q4.22 | `BLUEPRINT.md:22.4` (inferred from Phase 7 deferred lists); `phase-07/DEFINE.md:12` |

---

## 16. Non-Reconstruction Statement

This is a **NEW GOVERNED DEFINE RECORD**. It is **NOT** a reconstruction, recovery, backdating, or inference of a historical Phase 8 DEFINE. No historical Phase 8 record exists or is asserted. No README or conversation statement is converted into historical acceptance by this record.

---

## 17. Non-Authorization Statement

This command authorizes **DEFINE ONLY**. The following are **NOT authorized** by this command and must not begin without a separate Owner decision:

- **Research** (no Phase 8 Research, findings, or alternative selection).
- **Architecture** (no `ARCHITECTURE.md` creation beyond this DEFINE).
- **Specification** (no creation/modification of `SPECIFICATION.md`/`DECISIONS.md` beyond this DEFINE's references).
- **Implementation** (no `phase-08/src/**`, `phase-08/tests/**`, `phase-08/package.json`, tsconfigs, build/test config, dependencies, or generated artifacts).
- **Test**, **Refactor**, **Freeze**, or **Next Phase**.
- Any fix of the `@issue/foundation` TS2307 problem or any consumer-side workaround.
- Any modification of `phase-01-foundation`, Phase 2/3/4/5/6/7 (CLOSED/FROZEN), `BLUEPRINT.md`, §22.5, or Q4.22 beyond what this DEFINE explicitly resolves (§22.4).
- Any Phase 9 work.

---

## 18. End-of-Document Block

```
PHASE 8 DEFINE RECORD: ACCEPTED (owner, 2026-08-22)
PHASE 8 DEFINE STAGE: ACCEPTED — RESEARCH AUTHORIZED (owner, 2026-08-22)
HISTORICAL DEFINE RECOVERED: NO (none exists; not reconstructed)
RESEARCH AUTHORIZED: YES (owner, 2026-08-22)
ARCHITECTURE AUTHORIZED: NO
SPECIFICATION AUTHORIZED: NO
IMPLEMENTATION AUTHORIZED: NO
TEST/REFACTOR/FREEZE AUTHORIZED: NO
PHASE 1/2/3/4/5/6/7 MODIFIED: NO
BLUEPRINT MODIFIED: NO
PHASE 9 WORK STARTED: NO
COMMIT/PUSH: NO
```
