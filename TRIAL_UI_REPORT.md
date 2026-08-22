# ISSU v0.2 — Trial UI Report

**Deliverable:** Internal controlled-trial workbench (`trial-ui/`, `@issue/trial-ui` 0.2.0)
**Authorization:** Owner "ISSU v0.2 CONTROLLED TRIAL UI EXPERIENCE" (2026-08-22)
**Governance:** `ISSU_V0.2_PRODUCTION_READINESS.md` + `ISSU_PROJECT.md` + `BLUEPRINT.md` v0.1

---

## 1. What was built

A **localhost-only** workbench (`127.0.0.1`, no CORS, 16 KB body cap) exposing
the frozen ISSU domain workflows as a clickable product flow:

- **Workbench screen:** provider-mode badge (stub/live/missing-credentials/
  unconfigured), all nine whitelisted domain workflows (Phase 5 Analytics +
  Phases 10–17), each labeled with its phase.
- **Task input flow:** objective (1–200 chars), inline-only JSON inputs
  (≤10 × ≤4000 chars, id-shape enforced), optional correlation ID.
  Control characters and `localFile` inputs are rejected outright — the UI
  can never cause a filesystem read.
- **Execution view:** deterministic workflow run through the frozen barrel;
  status/state display; content-free audit event stream; one bounded AI
  summary through the v0.2 resilient platform seam (live or local stub).
- **Safety controls:** stub mode is the default; live mode requires real
  environment credentials and fails with a clear `issue.trial.missing-credentials`
  state otherwise; zero destructive file/process/Git operations from the UI;
  no load testing; server binds loopback only.

## 2. Gates (actual command output)

| Gate | Result |
|---|---|
| format | PASS |
| typecheck | PASS |
| lint | PASS (0 findings) |
| tests | PASS **43/43** across 7 suites |
| coverage | **95.48% stmts / 84% branches / 100% funcs / 96.59% lines** (≥80 gate) — `server.ts` socket entry-point excluded from unit metric and verified by run-gate instead |
| build | PASS |
| security audit | PASS — secret-leak test asserts credential VALUES never appear in `/api/state`, `/api/run`, or preflight responses; input-content leak test added |
| secret scan (release gates) | PASS — 589 tracked files clean |
| local run verification | PASS — `node dist/server.js --selftest` boots ephemeral loopback server, verifies `/` and `/api/state`; 3/3 stable runs |

## 3. Security checks added (tests)

- Credential-value leakage asserted absent on every reachable response surface.
- Input contents never echoed into audit events (objective appears in frozen
  Phase-10 machine logs per its SPEC observability contract — documented below).
- `localFile` inputs rejected at the API boundary.
- Body-size cap returns HTTP 413; malformed JSON → typed 400.

## 4. What is claimed / not claimed

**Claimed:** internal trial experience on localhost; deterministic workflows in
stub mode by default; live mode through the v0.2 resilient seam when the Owner
supplies credentials; evidence-backed gates above.

**Not claimed:** public launch readiness; production deployment hardening
(tls/reverse-proxy/auth-fronting); multi-user session handling; live-endpoint
validation (requires Owner credentials); compliance of any kind.

## 5. Known characteristic (frozen contract, preserved)

Phase 10–17 machines log `objective` inside their own `{domain}.audit` events
per their frozen SPEC observability contracts. The trial UI displays these
events locally; it does not filter them (frozen records are unmodifiable). No
credentials or input file-contents appear in any event.

## 6. Run instructions (Owner, local)

```
cd trial-ui
npm install          # resolves file:-chain; build upstream dists first if fresh clone
npm run start        # prints http://127.0.0.1:<port>
```
Open the printed URL in a browser. Live mode: set `ISSU_PROVIDER*` variables
(see `.env.example`) before starting; the badge switches to LIVE only when the
key variable resolves.

## 7. Classification

| Dimension | Verdict |
|---|---|
| Trial UI experience | **YES** |
| Controlled-trial readiness | **YES** (with v0.2 platform) |
| Public launch readiness | **NO** |
| Live provider validation | **PENDING CREDENTIALS** (path complete; no live call made from tests) |
| Security audit | **PASS** |
| Committed/pushed | See baseline below |

```
TRIAL UI TRACK: COMPLETE (2026-08-22)
LOCALHOST-ONLY: YES
STUB DEFAULT: YES
LIVE MODE GATED ON CREDENTIALS: YES
FROZEN PHASES MODIFIED: NO
PHASE 18+: NO
PUBLIC-LAUNCH CLAIM: NO
```
