# ISSU — Phase 2: Architecture

**Phase:** 2 — ToolRuntime (deterministic read-only filesystem task execution)
**Status:** DRAFTED AT P6 — descriptive companion to the authoritative specification
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative specification:** `./SPECIFICATION.md` (normative; this document SHALL NOT contradict it)
**License:** Apache License 2.0

## 0. How to Read This Document

This document describes the Phase 2 architecture. **`SPECIFICATION.md` is the
sole normative behavioral authority**; where this document conflicts with it,
the specification SHALL prevail.

Every section below tags each statement so the reader can tell inherited law
from interpretation and from implementation detail:

| Tag | Meaning |
| --- | --- |
| **NORMATIVE** | Inherited directly from `SPECIFICATION.md` (cited section). Must not be weakened or re-interpreted. |
| **INTERPRETATION** | A reading of a normative requirement that was necessary to implement it; does not add a new requirement. |
| **IMPLEMENTATION** | Descriptive only — how the P4 implementation realizes the architecture. Never normative. |
| **DEFERRED** | Explicitly deferred by `SPECIFICATION.md` §22; not decided here. |
| **NON-GOAL** | `SPECIFICATION.md` §19; Phase 2 SHALL NOT implement. |
| **EXTENSION** | A capability intentionally reserved for future phases; not part of Phase 2 architecture. |

Implementation details such as internal module filenames, log event strings,
redaction tokens, the concrete logger library, and test mechanics are recorded
as **IMPLEMENTATION** notes only and SHALL NOT be treated as normative.

---

## 1. Purpose & Status

**[NORMATIVE]** Phase 2 delivers the **ToolRuntime**: a deterministic task
runner over a read-only filesystem, driven by the frozen nine-state machine
(`SPECIFICATION.md` §1, §2.1).

**[IMPLEMENTATION]** At P4 the phase was implemented; at P5 it was fully tested
(91/91 tests, coverage ≥ 80%). This document is authored at P6 to describe that
implementation against the frozen specification. **It adds no architecture and
changes no behavior.**

---

## 2. Normative Foundation

The frozen architecture is defined by `SPECIFICATION.md` §3:

- **Frozen status:** any change to the §3 architecture requires a `DECISIONS.md`
  entry and is a breaking change to the public contract (§3.1, §17). **[NORMATIVE]**
- **Exactly five architectural components**, with no additional components
  invented: `TaskMachine`, `ToolRuntime`, `DecisionProvider`, `Filesystem
  capability`, `Correction/Verification engine` (§3.2). **[NORMATIVE]**
- **Deterministic execution:** identical `TaskOptions` + identical
  `DecisionProvider` decisions + identical filesystem state ⇒ identical
  transition sequence and terminal state (§3.3). **[NORMATIVE]**
- **No new architecture:** no memory subsystem, generalized planning engine,
  plugin framework, model routing, multi-agent system, or write/execute tooling
  (§3.4). **[NORMATIVE]**

---

## 3. Component Architecture

The five frozen components and their Phase 2 realization:

| Component | Obligation (§3.2) | Nondeterminism? | Implementation (§9 = ToolRuntime, §5 = TaskMachine) |
| --- | --- | --- | --- |
| **TaskMachine** | Drives the nine-state machine; deterministic control flow; available-action derivation; classification handling; correction direction; verification. | No | `src/internal/machine.ts` — `runTask` |
| **ToolRuntime** | Exclusive `EXECUTING` dispatch seam; executes the two filesystem operations; returns `ToolResult`. | No | `src/internal/runtime.ts` — `createToolRuntime` |
| **DecisionProvider** | Injected interface; exactly two obligations (`selectAction`, `assess`); the only component permitted to involve a model. | Yes (bounded to its two methods) | `DecisionProvider` interface (§17.2), injected by the caller |
| **Filesystem capability** | `readFile`, `listDirectory`; read-only; deny-by-default. | No | `src/internal/runtime.ts` |
| **Correction/Verification engine** | Deterministic correction direction and verification. | No | `src/internal/machine.ts` |

**[IMPLEMENTATION]** Internal module filenames (`src/internal/*`) are an
implementation layout detail. `SPECIFICATION.md` §17.3 requires only that
internal modules never be imported by consumers; the `exports` map exposes only
`.`.

---

## 4. State Machine & Transitions

**[NORMATIVE]** (§5.1, §5.2)

- Exactly nine states: `READY, SELECTING, EXECUTING, EVALUATING, CORRECTING,
  VERIFYING, COMPLETED, FAILED, CANCELLED` — frozen.
- Exactly 18 legal transitions (the full table in §5.2). Any other transition is
  an `internalError`.
- Terminal closure (§5.3): `COMPLETED`/`FAILED`/`CANCELLED` have no outgoing
  transitions; after a terminal state the machine SHALL NOT transition, execute
  an action, or consult the provider again.
- Cancellation (§5.4): via `AbortSignal`; observed at the next legal point
  (transitions 4, 6, 10, 14, 18); a run already aborted at start ends
  `CANCELLED` without executing anything.

**[IMPLEMENTATION]** `machine.ts` encodes the 18-transition table and the
terminal set. Transition **reason strings** (e.g., `run-begin`,
`action-selected`, `correction-exhausted`, `no-actions-available`) are
implementation-provided values carried in the `reason` field required by §15.1;
the values themselves are not normative.

---

## 5. Deterministic Execution Model

**[NORMATIVE]** (§3.3, §5.5)

- The TaskMachine consults no model, clock, randomness, or process identity in
  its control flow.
- Nondeterminism is confined to the `DecisionProvider`'s `selectAction` and
  `assess`.
- The machine SHALL NOT skip, reorder, or invent transitions; it SHALL NOT make
  planning, correction, or goal judgments itself.
- `runTask` SHALL NOT be re-entrant per run; each invocation runs one isolated
  task with no state persisting between runs (§17.3, §19.2). **[NORMATIVE]**

**[IMPLEMENTATION]** `machine.ts` builds a fresh `InternalState` per `runTask`
invocation and exposes it only as an immutable `TaskState` snapshot.

---

## 6. Plan-as-Data & Available-Action Derivation

**[NORMATIVE]** (§4.1, §4.2)

- A task run is created from a single `TaskOptions`: authorized `root`, fixed
  `refs`, `bounds`, optional `includeHidden`, advisory `objective`.
- The plan (the `refs`) is **fixed input**; Phase 2 SHALL NOT generate, extend,
  shrink, or re-plan refs at runtime. The `objective` is advisory and SHALL
  NEVER be used to derive new refs or actions.
- There is no generalized planning engine.

**[NORMATIVE]** (§4.3) An action is available iff ALL of:

1. its `operation` is one of the two operations (§8);
2. its target is a member of `refs` and not yet satisfied for this run;
3. its target passes authorization/containment (§11) — a denied target is never
   offered;
4. its invocation would not exceed the resource bounds (§12).

**[NORMATIVE]** (§17.2, §17.3) Derivation is performed by the **pure**
`deriveAvailableActions(state, options)` function — no I/O, no model, no state
mutation.

**[IMPLEMENTATION]** `actions.ts` implements deduplication of duplicate refs,
exclusion of completed refs, a resolved-path containment check, positive-integer
bounds checks, `chunkSize ≤ maxBytesPerRead`, and `includeHidden` defaulting to
`false`.

---

## 7. DecisionProvider Contract

**[NORMATIVE]** (§7.1–§7.3, §17.2)

- `DecisionProvider` is an **injected interface** — the only Phase 2 component
  permitted to involve a model. Phase 2 SHALL NOT import, call, or depend on any
  LLM/model provider or SDK; a provider that never consults a model is fully
  supported.
- Exactly two obligations:
  1. `selectAction(available, state) → ActionRef` — returns a ref drawn from the
     provided `available` set; SHALL NOT derive the set itself; SHALL NOT add or
     modify refs.
  2. `assess(result, state) → Assessment` — returns a neutral `OutcomeClass`;
     SHALL NOT return control-flow directives.
- Correction direction is the TaskMachine's deterministic logic; the provider
  MUST NOT encode it. A provider returning control-flow directives is rejected
  as `internalError`.

**[IMPLEMENTATION]** `validate.ts#validateProvider` enforces the two-obligation
shape at run start; `parseAssessment` accepts only a plain
`{ classification }` whose value is one of the eight `OutcomeClass` values and
rejects any extra keys or unknown classifications (treated as
`provider-contract-violation` → `internalError`).

---

## 8. ToolRuntime & Filesystem Capability

**[NORMATIVE]** (§9, §10)

- `ToolRuntime` is the **exclusive** `EXECUTING` dispatch seam; the TaskMachine
  dispatches the selected `ActionRef` to `ToolRuntime.execute` and executes
  filesystem operations by no other means (§9.1).
- `execute(ref)` SHALL: enforce deny-by-default authorization/containment (§11);
  enforce resource bounds (§12); perform strict UTF-8 validation for `readFile`
  (§10.2); produce a complete classified `ToolResult` (§13.2); never modify the
  filesystem (§14); never consult the provider or make planning/correction
  decisions (§3.3).
- `ToolRuntime` is deterministic: identical `ActionRef` + identical filesystem
  state ⇒ identical `ToolResult` (§9.2).

**[NORMATIVE]** (§10.1) Exactly two operations — `readFile`, `listDirectory`.
No create/write/edit/delete/rename/move/execute/permission/metadata-mutation
operation exists.

**[NORMATIVE]** `readFile` (§10.2): bounded chunks (`chunkSize`), total cap
(`maxBytesPerRead`); exceeding the cap → `tooLarge` (never a silent truncated
success); assembled content must be **strictly valid UTF-8** — invalid bytes →
`invalidContent`; a multi-byte sequence may straddle a chunk boundary without
causing `invalidContent`.

**[NORMATIVE]** `listDirectory` (§10.3): a hidden entry is one whose basename
begins with `.`; `.` and `..` are never returned; `includeHidden` defaults to
`false`; identical inputs ⇒ identical, platform-independent listings.

**[IMPLEMENTATION]** `runtime.ts` implements reads via an opened file handle,
stat-based size check, chunked reads, and a fatal (`{ fatal: true }`)
`TextDecoder("utf-8")` for strict validation. Listings use `readdir` with
`withFileTypes`, filter `.`/`..` and (by default) dot-entries, mark
`isHidden = name.startsWith(".")`, and sort by name.

---

## 9. Containment & Security

**[NORMATIVE]** (§11)

- **Deny-by-default:** an action is authorized iff its `target` is a member of
  the run's `refs` AND its resolved path is contained within the authorized
  `root`. Any denied target → `accessDenied`; no path is accessed implicitly.
- **Containment** uses the Phase 1 primitives `assertContained` and
  `isContained`, consumed only through the approved public barrel (§11.2, §18).
- Resolution follows symbolic links, so a symlink escaping the root is refused
  (`accessDenied`). Path-traversal inputs escaping the root are refused.
- The capability is read-only by construction; authorization grants read access
  only, never mutation (§11.3, §14).

**[IMPLEMENTATION]** `runtime.ts` first rejects refs that fail
`isContained(root, target)` and then resolves with `assertContained`, mapping any
violation to `accessDenied`. `actions.ts` refuses to offer a target outside the
resolved root, so denied work is never offered (V5/V6).

**[INTERPRETATION]** `SPECIFICATION.md` §13.4 requires failures to be
"representable as Phase 1 `AppError`-compatible data." Phase 2 interprets this
**structurally**: the `ToolResult.error` shape `{ code, message }` carries the
same information as a Phase 1 `AppError` and can be surfaced through the barrel
without importing the Phase 1 `AppError` type. This is an interpretation of
"compatible," not a new requirement.

---

## 10. Correction & Verification Loops

**[NORMATIVE]** (§6)

- **Correction ownership** is the TaskMachine's; the provider never controls it
  (§6.1). The deterministic ordering is `RETRY → ADVANCE → EXHAUST` (§6.2):
  - `RETRY` — retryable failure (`executionError`) and retry bound not
    exhausted; re-dispatches the **same** `ActionRef` without re-selection (§6.3).
  - `ADVANCE` — non-retryable, non-fatal failure (`invalidContent`, `notFound`,
    `accessDenied`, `tooLarge`) and correction bound not exhausted (§13.3).
  - `EXHAUST` — no other direction applies (bounds exhausted or fatal
    `invalidInput`/`internalError`) → `FAILED`.
- **Verification** is a deterministic goal check by the TaskMachine (§6.4): the
  run is verified iff every file and directory ref has a `success`
  classification. `VERIFYING` consumes one unit of the verification bound.
- Bounds: `maxRetries` per `ActionRef`, `maxCorrections` and `maxVerifications`
  per run; all finite, positive, deterministically enforced (§6.5, §12).

**[IMPLEMENTATION]** `machine.ts` owns the correction decision table and the
verification predicate; `correction.decision` records carry `direction`,
`retries`, and `corrections` (§15.1).

---

## 11. Resource Bounds

**[NORMATIVE]** (§12) Five bounds — `maxRetries`, `maxCorrections`,
`maxVerifications`, `maxBytesPerRead`, `chunkSize` — finite, positive, and
enforced deterministically; `chunkSize ≤ maxBytesPerRead`. The **semantics** are
frozen.

**[NORMATIVE]** (§22.7) The **concrete default values** are a Phase 2
implementation-time decision, documented in `DECISIONS.md` (D-BOUNDS); the §12
semantics SHALL NOT change.

**[INTERPRETATION]** `TaskOptions.bounds` is **required** (§17.2); `runTask`
performs no implicit defaulting. The Phase 2 default bounds documented as
D-BOUNDS are the recommended values a caller MAY use.

**[IMPLEMENTATION]** The canonical default-bounds constant used by the test
suite is `DEFAULT_BOUNDS` in `tests/helpers.ts`:

```ts
maxRetries: 2,
maxCorrections: 5,
maxVerifications: 10,
maxBytesPerRead: 1024 * 1024, // 1 MiB
chunkSize: 4096,
```

---

## 12. Failure Model & Classifications

**[NORMATIVE]** (§13)

- Error codes live exclusively under the Phase 1-reserved `issue.tool.*`
  namespace (§13.1).
- Exactly eight outcome classifications — `success`, `invalidContent`,
  `notFound`, `accessDenied`, `tooLarge`, `invalidInput`, `executionError`,
  `internalError` — with their `issue.tool.*` codes (§13.2). No other
  classification is produced.
- Classification → correction mapping is deterministic and owned by the
  TaskMachine (§13.3).
- `ToolResult.error.code` is an `issue.tool.*` code; `error.message` is
  actionable and SHALL NOT embed file content, failed-read content, or secrets
  (§13.4).

**[IMPLEMENTATION]** `constants.ts` defines `ERROR_CODES` and the standard
message strings; `results.ts` builds `okResult`/`errorResult` with the
`{ code, message }` error shape (AppError-compatible; §9 interpretation).
`runtime.ts` classifies filesystem errors (`ENOENT`/`ENOTDIR` → `notFound`;
other I/O → `executionError`; unknown → `internalError`).

---

## 13. Observability & Redaction

**[NORMATIVE]** (§15)

- Phase 2 emits **structured** (key/value) records for: state transitions, action
  selection, tool execution, assessment, correction decision, bound exhaustion,
  and run completion — with the normative fields listed in §15.1.
- Records are emitted through the Phase 1 `Logger` contract
  (`createLogger`/`Logger`) consumed via the barrel (§15.1, §18.3).
- Raw file content (including failed reads) SHALL NEVER be logged; paths MAY
  appear but file bytes and entry bodies SHALL NOT; secret values and
  secret-named values SHALL NEVER appear in logs or error messages (§15.2).
  A redaction failure is a release blocker.

**[IMPLEMENTATION]** `observability.ts` creates the run logger with
`createLogger({ level: "info", redact: redactionList() })` and emits the event
records. Event message strings (`state.transition`, `action.selection`,
`tool.execution`, `assessment`, `correction.decision`, `bound.exhaustion`,
`run.completion`) are implementation values that satisfy the §15.1 event list;
the concrete logger is the Phase 1 `Logger` implementation, and any redaction
token (e.g., `[REDACTED]`) is produced by the Phase 1 redaction primitives —
none of these are normative.

**[IMPLEMENTATION]** A per-run `runId` (`run-<n>`) populates the normative
`runId` field; its format is not normative.

---

## 14. Phase 1 Integration & D3

**[NORMATIVE]** (§18)

- D3 is the approved mechanism: `"@issue/foundation": "file:../phase-01-foundation"` —
  a reproducible local path dependency. Global `npm link` is never canonical.
- Phase 2 imports Phase 1 **only through the package name** (the barrel); deep
  imports are blocked by Phase 1's `exports` map.
- Consumed Phase 1 surface (§18.3): `assertContained`, `isContained`;
  `Logger`/`createLogger`; the redaction primitives (`redactionList`, Logger
  redaction); `Result`/`AppError`-compatible data (structurally — §9).

**[IMPLEMENTATION]** `runtime.ts` imports `assertContained`/`isContained`;
`observability.ts` imports `createLogger`, `redactionList`, and the `Logger`
type — all via `@issue/foundation`. Phase 1 internals are not consumed; Phase 1
is not elevated into a Phase 2 architectural dependency.

---

## 15. Module / File Layout

**[IMPLEMENTATION]** — descriptive only; not normative.

```
phase-02/
├── src/
│   ├── index.ts               # §17 public barrel (23 symbols)
│   └── internal/
│       ├── machine.ts         # TaskMachine: runTask, state machine, correction/verification
│       ├── runtime.ts         # ToolRuntime: createToolRuntime, readFile/listDirectory
│       ├── actions.ts         # deriveAvailableActions (pure)
│       ├── observability.ts   # §15 structured records + redaction wiring
│       ├── results.ts         # okResult/errorResult, classification mapping
│       ├── validate.ts        # options/provider/action/assessment validation
│       └── constants.ts       # error codes, messages
├── tests/                     # P5 suite (91 tests, coverage ≥ 80%)
├── SPECIFICATION.md           # authoritative (frozen)
├── ARCHITECTURE.md            # this document (P6)
├── DECISIONS.md               # decision record (D1; full draft at P6)
├── TASKS.md                   # milestones P0–P7
└── README.md                  # overview, package plan, integration record
```

The `exports` map exposes only `.` (main/types), so the internal layout is not
reachable by consumers (§17.3).

---

## 16. Public API & Barrel

**[NORMATIVE]** (§17)

- The public interface is the barrel (`src/index.ts` → `dist/index.js`,
  `dist/index.d.ts`) exporting **exactly** the §17.2 surface: 20 types/interfaces
  and 3 functions (`runTask`, `createToolRuntime`, `deriveAvailableActions`).
- Internal modules are private and SHALL never be imported by consumers (§17.3).
- The surface is **frozen at phase end**; any change requires a `DECISIONS` entry
  (§20.2).

**[IMPLEMENTATION]** The barrel re-exports the three functions from internal
modules and declares all §17.2 types. Exactness is enforced by
`tests/public-api.test.ts` (§17.2/§17.3) and P5 V-scenario tests.

---

## 17. Deferred Decisions

**[DEFERRED]** — the following remain deferred per `SPECIFICATION.md` §22. They
are **not** decided by Phase 2 and are **not** resolved at P6:

1. CLI / end-user entry point (§22.1).
2. Phase 2 configuration-file schema (§22.2).
3. Write / execute / Git / network tooling (§22.3).
4. Model/provider binding (§22.4).
5. Workspace / monorepo adoption (§22.5).
6. `ARCHITECTURE.md` and the full `DECISIONS.md` draft — **authored at P6**
   (§22.6): this is the documentation work itself, not an architectural change.
7. Concrete default resource-bound values — **recorded** in `DECISIONS.md`
   (D-BOUNDS) as the implementation-time choice (§22.7); §12 semantics unchanged.

---

## 18. Non-Goals

**[NON-GOAL]** — `SPECIFICATION.md` §19 lists capabilities Phase 2 SHALL NOT
implement, depend upon, or introduce. Phase 2 in particular has **no**:

- LLM/model dependency or routing (§19.1);
- memory subsystem, persistence, or cross-run context (§19.2);
- write/edit/delete or any filesystem mutation (§19.3);
- command/process/child-process execution (§19.4);
- Git/VCS operations (§19.5);
- network/web/browser access (§19.6);
- code generation/modification (§19.7);
- plugin framework or dynamic module loading (§19.8);
- generalized planning engine (§19.9);
- multi-agent systems or agent roles (§19.10);
- config schemas for reserved namespaces, or a permission framework beyond
  deny-by-default containment and bounds (§19.11);
- distribution/publishing (§19.12);
- deployment/daemons/services (§19.13);
- CLI expansion or its own `bin` (§19.14);
- performance-benchmark infrastructure (§19.15).

The read-only guarantee (§14) is a design invariant, not a feature flag.

---

## 19. Future Extension Points

**[EXTENSION]** — the following are reserved for future phases and are **not**
Phase 2 architecture. Documenting them as extension points does not decide,
authorize, or schedule them:

- Write/execute/Git/network tooling (future phases; §2.2, §19.3–§19.6, §22.3).
- A CLI / end-user entry point (§19.14, §22.1).
- A Phase 2 configuration-file schema (§19.11, §22.2).
- A model/provider binding behind the `DecisionProvider` seam (§7.1, §22.4) —
  a consumer decision, out of scope.
- Workspace/monorepo adoption — revisitable only via a documented `DECISIONS`
  entry (§18.1, §22.5).

The `DecisionProvider` interface is the single, stable seam through which a
future model-bound provider MAY be supplied without changing Phase 2.

---

## 20. Conformance & Validation

**[NORMATIVE]** — `SPECIFICATION.md` §16 defines 18 deterministic validation
scenarios (V1–V18) as normative acceptance inputs. At P5 all V1–V18 scenarios
were mapped to tests and verified (see `TASKS.md` P5 sign-off record), including:
read success/failure (V1–V3), missing directories (V4), containment (V5–V6),
hidden entries (V7), size bounds (V8), retry/correction/verification bounds
(V9–V12), cancellation (V13), read-only guarantee (V14), terminal closure (V15),
determinism (V16), available-action derivation (V17), and redaction (V18).

**[IMPLEMENTATION]** The P5 suite (`tests/`) exercises every §17.2 symbol
(`public-api.test.ts`), every §16 scenario, and the Phase 1 integration through
the barrel. The coverage gate (≥ 80% on statements, branches, functions, and
lines) is enforced by `vitest.config.ts`.

---

*This document is descriptive. Nothing in it changes `SPECIFICATION.md`, the
public API, or the behavior of the implemented Phase 2 package.*
