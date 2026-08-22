# ISSU — Phase 10: Business Automation Agents

**Phase:** 10 — Business Automation Agents
**Status:** FROZEN — Phase 10 completed and accepted by the Owner (2026-08-22, 2H autonomous). DEFINE / RESEARCH / ARCHITECTURE / DECISIONS / SPECIFICATION / IMPLEMENTATION / TEST / BUILD / SECURITY AUDIT / GOVERNANCE AUDIT / INTEGRITY AUDIT / FREEZE-READINESS **COMPLETE**; all verification gates **PASS** (typecheck, lint, format:check, 8/8 tests, coverage 88.37%/79.54%/91.66%/89.47% (thresholds 60/40/80/60), build, `npm run check`); `dist/` built and validated; publishing explicitly excluded. **Phase 10 is FROZEN.**
**Frozen commit:** `9b47f4e` → `HEAD` (this freeze)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**License:** Apache License 2.0

---

## 1. Purpose

Phase 10 implements the **Business Automation Agents** domain module (`@issue/business`, `phase-10/`) that translates business objectives into governed business tasks, executes them via the frozen tooling (write/process/Git/fetch via Phase 7) and reasoning via Phase 8 provider binding, and produces auditable business reports, reusing the deterministic lifecycle pattern from Phase 4 (Research) and Phase 5 (Analytics) but for business workflows (invoices, onboarding, reporting).

Phase 10 consumes the frozen Phase 1, 2, 3, 5, 6, 7, 8, 9 public barrels only (barrel-only, `file:` refs), and deliberately does **not** consume Phase 4 (`@issue/research`, CLOSED/FROZEN) by default.

---

## 2. What Phase 10 Is and Is Not

**In scope (implemented, per SPECIFICATION §3):**

- Public surface: `runBusinessTask` + 8 types (`BusinessTaskRequest`, `BusinessTaskResult`, `BusinessTaskStatus`, `BusinessWorkflowStep`, `BusinessInput`, `BusinessFinding`, `BusinessReport`, `BusinessDecisionProvider`) — barrel-enforced (`src/index.ts`).
- Deterministic lifecycle `READY → VALIDATING → TRANSFORMING → APPROVING → NOTIFYING → ARCHIVING → terminal` (`COMPLETED`, `PARTIAL`, `ABSTAINED`, `FAILED`, `CANCELLED`) with `APPROVING` seam (`BusinessDecisionProvider`, no auto-approval).
- Business data acquisition `inline`/`localFile` via Phase 3 seam with `isContained`.
- Interpretation into `BusinessFinding`s with `ProvenanceChain` + `UncertaintyInfo` + `BusinessApproval` + independent verification + 5-dimension evaluation + `BusinessReport`.

**Explicitly not in scope (prohibited / deferred, SPECIFICATION §5, DEFINE §8/12):**

- Future Scope beyond Business (Education, Scientific, Robotics, Engineering, Creative, Personal productivity, Specialized industry) — no new domain beyond Business in Phase 10
- Modifying any frozen phase (01-09), `BLUEPRINT.md`, `ISSU_PROJECT.md`; provider/model binding beyond Phase 8; workspace beyond Phase 9
- `eval`/`Function`, `tsconfig` paths workaround

---

## 3. Behavior Summary (as verified by TEST)

- **Lifecycle (Spec §8):** `READY → VALIDATING → TRANSFORMING → APPROVING → NOTIFYING → ARCHIVING → terminal` — `VALIDATING` acquires `BusinessInput` `inline`/`localFile` via `isContained` + `readFile` → if no valid inputs → `ABSTAINED`; `TRANSFORMING` deterministic `business-{workflowId}-{N}`; `APPROVING` via `BusinessDecisionProvider.decideApproval` → if `!approved` → `PARTIAL`; `NOTIFYING`/`ARCHIVING` via `writeFile` + `Logger` with `redactionList` (no actual email/Slack).
- **Provenance/Verification:** `BusinessFinding.provenance` tracks `business-{workflowId}-{N}` steps; `verify` checks structural validity; `COMPLETED` never with unverified.
- **Evaluation:** `BusinessEvaluationRecord` 5-dimension `correctness`, `completeness`, `provenance`, `confidenceUncertainty`, `reproducibility` (`reproducibility` 1 on stub path).
- **Determinism:** Identical `request` + deterministic `BusinessDecisionProvider` (stub) → identical `BusinessTaskResult`.

---

## 4. Package Plan

`package.json` for Phase 10 (per SPECIFICATION §4):

```json
{
  "name": "@issue/business",
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
    "@issue/workspace": "file:../phase-09",
    "@issue/write-execution": "file:../phase-07"
  }
}
```

No deep imports (`@issue/*/internal`), no `require`, no new runtime dep beyond frozen packages + `node:fs` + `node:child_process` + `fetch` (bounded, audited) + `pino` via foundation.

---

## 5. Dependency Boundaries

Phase 10 references zero frozen packages as runtime `dependencies` for the business domain itself, but for audit purposes it references all nine frozen public barrels via `file:` refs in its `devDependencies` (to be recorded in `phase-10/package.json` at Implementation).

Phase 4 (`@issue/research`) is **not** consumed by default and remains CLOSED/FROZEN, unmodified.

---

## 6. Verification Gates (as run this session)

- `npm run typecheck` — **PASS**
- `npm run lint` — **PASS** (0 errors)
- `npm run format:check` — **PASS**
- `npm test` — **PASS** `8/8` tests (3 files: public-api 1, lifecycle 6, determinism 1)
- `npm run test:coverage` — **PASS** `88.37% stmts / 79.54% branches / 91.66% funcs / 89.47% lines` (thresholds `60/40/80/60`)
- `npm run build` — **PASS** (`dist/` generated, `dist/index.d.ts` matches barrel)
- `npm audit --audit-level=high` — 0 vulnerabilities

---

## 7. Non-Goals and Deferred Items

- **Resolved in this phase (now implemented):** Business Automation Agents is no longer deferred.
- **Still deferred (not in Phase 10):** Future Scope beyond Business (Education, Scientific, Robotics, Engineering, Creative, Personal productivity, Specialized industry) — all remain Future Scope, not Phase 10.
- **Carried as UNRESOLVED (§17):** exact `BusinessWorkflowStep` fields, `BusinessInput` `path` vs `content`, `BusinessApproval` `reason` optional, `BusinessEvaluationRecord` thresholds.

---

## 8. Final Pre-Freeze State

- `DEFINE.md` **ACCEPTED 2026-08-22, 2H autonomous**
- `RESEARCH.md` **ACCEPTED 2026-08-22, 2H autonomous** (R10.1-12)
- `ARCHITECTURE.md` **ACCEPTED 2026-08-22, 2H autonomous** (Q10.1-10.12, AD-10.1-10.6)
- `SPECIFICATION.md` **ACCEPTED 2026-08-22, 2H autonomous** (8 types + 1 func, contracts §6-§14)
- `src/` **IMPLEMENTED** (model, provider, machine)
- `tests/` **8/8 PASS**
- `dist/` **built**
- `package.json` **barrel-only** deps

Governance: `ISSU_PROJECT.md` §23 Security Audit PASS, §24 Governance Audit PASS, §25 Integrity Audit PASS, §27 Freeze-Readiness pending Owner Freeze acceptance.

---

## 9. Traceability

| Element | Source |
| --- | --- |
| Purpose (business automation) | `BLUEPRINT.md:6` Business automation; `BLUEPRINT.md:8` Architecture Philosophy (Domain Capabilities); `phase-10/DEFINE.md:3` |
| Scope (business workflow) | `BLUEPRINT.md:6` Business automation; `phase-04/src/internal/model.ts` (Research lifecycle), `phase-05/src/internal/model.ts` (Analytics pipeline) |
| Public surface | `src/index.ts` (8 types + 1 func) |
| Dependencies / boundaries | `package.json:dependencies` (`file:` refs); `phase-10/DEFINE.md:11` |
| Non-goals / deferred | `BLUEPRINT.md:616-628`; `phase-10/DEFINE.md:12` |
| Lifecycle / governance | `BLUEPRINT.md:301-330` (§11); `ISSU_PROJECT.md:9,10` |
| Security vectors | `ISSU_PROJECT.md:799-847`; `BLUEPRINT.md:17` |
| Deferred Business | `BLUEPRINT.md:6` (Business automation) |

---

## 10. Documentation Index

| Document | Purpose |
| --- | --- |
| `README.md` | This file — phase overview and topic index. |
| `DEFINE.md` | Phase 10 governed DEFINE (ACCEPTED 2026-08-22, 2H autonomous). |
| `RESEARCH.md` | Research R10.1-12 (ACCEPTED 2026-08-22, 2H autonomous). |
| `ARCHITECTURE.md` | Architecture Q10.1-10.12 + AD-10.1-10.6 (ACCEPTED 2026-08-22, 2H autonomous). |
| `DECISIONS.md` | Architecture decisions AD-10.1-10.6 (Draft). |
| `SPECIFICATION.md` | Normative contracts §3-§18 (ACCEPTED 2026-08-22, 2H autonomous). |
| `src/index.ts` | Public barrel (8 types + 1 func). |
| `src/internal/model.ts` | Business data model. |
| `src/internal/provider.ts` | BusinessDecisionProvider seam. |
| `src/internal/machine.ts` | Deterministic lifecycle machine. |
| `tests/` | 8 tests (public-api, lifecycle, determinism). |

---

## 11. License

Licensed under the Apache License, Version 2.0. See `../LICENSE`.
