# ISSU v0.2 — Production Readiness Track — Governance Record

**Track:** v0.2 Production Readiness (controlled-trial foundation)
**Status:** ACTIVE — Owner-authorized 2026-08-22 ("ISSU v0.2 PRODUCTION READINESS TRACK")
**Baseline:** v0.1 closure `9d4e6c8` (== origin/main; Phases 01–17 frozen)
**Blueprint:** `BLUEPRINT.md` v0.1 (§17 Security, §18 Model Independence, §23 Configuration, §24 Observability)
**Governance:** `ISSU_PROJECT.md`
**Version target:** v0.2.0 (semver minor: additive production capabilities over v0.1)

---

## 1. Scope

v0.2 adds the missing production capabilities for a **controlled real-world trial**:

1. **Real provider integration** behind the existing Phase 8 seams:
   - OpenAI-compatible and Anthropic-compatible adapters already exist in Phase 8
     (`createOpenAIProvider`, `createAnthropicProvider` via guarded `httpFetch`);
     v0.2 adds a **resilient execution layer** composed *over* the frozen
     `ModelProvider` seam: bounded retries with exponential backoff, rate-limit
     handling, structured attempt metadata, transparent error propagation.
   - The deterministic stub provider remains available and untouched.
2. **Production configuration:** fail-closed, validated environment schema
   (`ISSU_*` variables). API-key **values** are never read into config — only
   key **names**, resolved at call time by Phase 1 `getSecret`.
3. **Security hardening:** preflight checks that fail closed; validation of all
   platform inputs; secret redaction in all logs; no new write/exec/network
   surfaces beyond what frozen phases already bound.
4. **Observability:** structured `platform.audit` events (provider, attempt,
   delay, outcome codes, latency) with content-free contexts.
5. **Verification & release evidence:** offline-only tests at ≥80% coverage;
   CI jobs for the new workspace plus repository-level release gates
   (secret scan, threshold audit, boundary audit); production-readiness report.

### 1.1 Structural decision (frozen-integrity preserving)

All v0.2 code lives in a **new non-phase workspace `platform/`**
(`@issue/platform`), which composes frozen public barrels only:

| Frozen contract | Reused for |
| --- | --- |
| `@issue/foundation` | `AppError`, `Result`, `Logger`, `createLogger`, `redactionList`, `getSecret`, `isContained` |
| `@issue/model-provider` | `ModelProvider` seam + provider factories + `callModel` |
| `@issue/workspace` | `verifyWorkspaces` preflight |

**Zero files inside `phase-01/…/phase-17` are modified by v0.2.** This is why
no Phase 18+ is required: every capability composes existing contracts, per
BLUEPRINT §7.4 (interface-based integration) and §10 (phase independence).
Frozen phases remain consumable exactly as closed in v0.1.

## 2. Non-goals

- No public launch; controlled trial readiness only.
- No live network calls in tests (mocks/stubs exclusively).
- No secrets committed anywhere; `.env.example` contains variable names only.
- No compliance certification claims (SOC2/HIPAA/etc.).
- No UI/product design work.
- No modification of frozen phase source/tests/configs/docs.
- No Phase 18+ (this record documents why none is needed: composition suffices).
- No removal of deterministic stubs.

## 3. Security requirements

- Fail-closed: invalid/missing required env → hard error before any external call.
- Unknown `ISSU_*` environment keys are rejected (typo/confusion defense).
- Credentials: values only via `getSecret(name)` at call time; never logged,
  persisted, or placed in config objects; `redactionList()` applied to every logger.
- Network egress remains bounded by Phase 7 `httpFetch` (https-only allowlist,
  timeouts, byte caps) and Phase 8 adapters.
- Retries are bounded (`maxAttempts ≤ 5`) with capped delay (`≤ 5s`) to prevent
  retry storms.
- Error propagation is transparent: after exhausting retries the **last
  underlying `AppError` is returned unchanged** (no information loss, no
  fail-open fallback to stubs in production mode).

## 4. Provider integration requirements

- Adapter selection via `ISSU_PROVIDER` (`anthropic|openai|local`; default
  `local` so development/tests never require credentials).
- Required-if rules enforced: `ISSU_PROVIDER_MODEL` and
  `ISSU_PROVIDER_API_KEY_VAR` mandatory when provider ≠ `local`.
- Timeouts configurable (`ISSU_TIMEOUT_MS`, 1000–60000, default 30000) and
  forwarded into the frozen adapter configs.
- Retry policy: `maxAttempts` (default 3, max 5), exponential backoff
  (base 200ms, factor 2, cap 2000ms, optional jitter), retryable codes limited
  to `issue.provider.rate-limited`, `issue.provider.timeout`,
  `issue.network.timeout`. Auth/validation/not-configured errors are
  non-retryable by definition.
- Request/response validation remains owned by frozen Phase 8 adapters; the
  resilient layer validates only non-empty results before returning success.

## 5. External API policy

- All external calls flow through Phase 8 → Phase 7 `httpFetch` (allowlist,
  https-only, header sanitization, size caps). No new egress path is introduced.
- Tests MUST NOT make live calls; provider doubles/mocks only.

## 6. Configuration / secrets policy

- Single loader `loadPlatformEnv(env?)`: pure, injectable, deterministic.
- `.env.example` at repository root documents variable names with placeholder
  comments; contains no secrets.
- Key material resolution stays inside frozen `auth.ts` (`getSecret`) at call time.

## 7. Logging / error policy

- Event name: `platform.audit` (and `platform.preflight`).
- Context fields permitted: provider name, model id, attempt index, delay ms,
  elapsed ms, outcome/error **codes**, correlation id (caller-supplied).
- Prohibited in any context: prompt text, response text, key values, file contents.
- Every logger created with `redact: redactionList()` from Phase 1.

## 8. Testing requirements

- Offline only; deterministic; ≥80% lines/statements/functions/branches for the
  `platform/` workspace from day one (same gate as SPEC-driven phases).
- Retry behavior tested via injected `sleep` (no wall-clock waiting).
- Env loader tested for: valid minimal, full, missing-required, unknown-key
  rejection, bad enum/number rejection, local-provider defaults.

## 9. CI requirements

- New `platform` job mirroring phase gates (install/check/coverage/build).
- New `release-gates` job running `node scripts/verify-production.mjs`:
  secret-pattern scan over tracked files, coverage-threshold audit across all
  phase configs, deep-import boundary grep, and platform gates.

## 10. Release-readiness criteria (v0.2 exit)

1. All Phase 01–17 gates still pass (regression proof).
2. `platform/` gates pass at ≥80% on all four dimensions.
3. `scripts/verify-production.mjs` exits 0.
4. Security/governance/integrity audits documented in
   `ISSU_V0.2_PRODUCTION_READINESS_REPORT.md` with command evidence.
5. Controlled-trial instructions included in that report.

## 11. Rollback / failure behavior

- Preflight failure ⇒ CLI/tooling must abort before dispatching work.
- Provider exhaustion ⇒ caller receives the underlying typed error
  (`Result.err`); no silent stub substitution when `ISSU_ENV=production`.
- Rollback path: revert the v0.2 commits; frozen v0.1 phases are unaffected by
  construction (no shared mutable state).

## 12. Unresolved items (carried)

- Real credential issuance and vault placement for the controlled trial
  (Owner-operated; values never enter the repository).
- Trial tenant/target endpoint allowlisting (Owner decision at trial time).
- Deeper domain differentiation of Phases 10–17 (pre-existing future work).

---

## End-of-Document Block

```
ISSU V0.2 PRODUCTION READINESS TRACK: CREATED (2026-08-22, Owner-authorized)
FROZEN PHASES 01-17 MODIFIED BY THIS TRACK: NO (composition only via platform/)
PHASE 18+ CREATED: NO (not required — documented in section 1.1)
REAL PROVIDERS WIRED IN TESTS: NO (offline mocks only)
SECRETS COMMITTED: NO
CONTROLLED-TRIAL INTENT: YES
PUBLIC-LAUNCH CLAIM: NO
```
