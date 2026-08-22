# ISSU — Phase 4: Research Agent Module

**Phase:** 4 — Research Agent Module
**Status:** CLOSED/FROZEN (as durably referenced by the accepted Phase 05–17 records; see §8 note on stage headers)
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**License:** Apache License 2.0

---

## 1. Purpose

Phase 4 implements the **Research Agent Module** (`@issue/research`, `phase-04/`): a deterministic research pipeline over the frozen Phase 1/2/3 public barrels, exposed as a model-independent module with an injected decision seam.

Phase 4 consumes the frozen Phase 1/2/3 public barrels only (barrel-only, `file:` refs).

## 2. Documentation Index

| Document | Purpose |
| --- | --- |
| `ARCHITECTURE.md` | Architecture Q4.1–Q4.26 with FACT/INFERENCE/UNRESOLVED labels. |
| `SPECIFICATION.md` | Normative contracts: public API §3–§4, data model, lifecycle §11, quality gates §18–§19. |
| `DECISIONS.md` | Architecture decisions AD-4.1–AD-4.x (barrel-only consumption, isolation, deterministic stubs). |
| This `README.md` | Created 2026-08-22 under Owner authorization D4 — this file was historically absent. |

## 3. Public Surface (per SPECIFICATION §3–§4)

`runResearchTask` + supporting types (`ResearchTaskRequest`, `ResearchTaskResult`, `ResearchTaskStatus`, `ResearchDecisionProvider`, provenance/uncertainty/evaluation records). Authoritative detail lives in `SPECIFICATION.md`.

## 4. Verification Evidence (re-run 2026-08-22)

| Gate | Result |
| --- | --- |
| `npm run check` (typecheck + lint + format:check + test) | **PASS** — 51/51 tests |
| `npm run build` | **PASS** |
| Barrel-only boundary (no deep imports) | **PASS** (grep + eslint restricted-imports) |

## 5. Status Note (truthful record, D4)

- No original README or FREEZE_REPORT was ever created for this phase.
- Its `ARCHITECTURE.md` and `SPECIFICATION.md` stage headers read "**Draft — awaiting acceptance**" to this day and were left untouched here (frozen-record preservation).
- Later accepted phases (05–17) uniformly cite Phase 4 as CLOSED/FROZEN and consume it as a frozen contract; that durable cross-reference is the basis for the CLOSED/FROZEN status shown above.
- A post-hoc verification FREEZE_REPORT was added 2026-08-22 under Owner authorization D4; it documents verification performed in 2026, not a historical owner acceptance event.

## 6. License

Licensed under the Apache License, Version 2.0. See `../LICENSE`.
