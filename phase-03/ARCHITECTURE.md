# ISSU — Phase 3: Integration — Architecture

**Phase:** 3 — Integration
**Status:** IMPLEMENTED & VERIFIED THROUGH P5 — P5 signed off and formally
CLOSED (2026-08-12); descriptive companion to the Phase 3 specification;
reconciled with the implemented state at P6
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Authoritative specifications:** Phase 1 `../phase-01-foundation/SPECIFICATION.md` (frozen) · Phase 2 `../phase-02/SPECIFICATION.md` (frozen) · Phase 3 `./SPECIFICATION.md`
**License:** Apache License 2.0

---

## 0. How to Read This Document

**`SPECIFICATION.md` is the sole normative behavioral authority for Phase 3.**
Where this document conflicts with it, the specification SHALL prevail. Frozen
Phase 1 and Phase 2 specifications SHALL always prevail over both.

Tags:

| Tag | Meaning |
| --- | --- |
| **NORMATIVE** | Inherited from BLUEPRINT or a frozen contract (cited). Must not be weakened or re-interpreted. |
| **INTERPRETATION** | A reading needed to plan Phase 3; adds no new requirement. |
| **IMPLEMENTATION** | Descriptive only — how Phase 3 intends to realize the architecture. Never normative. |
| **DEFERRED** | Carried forward from Phase 2 §22; not decided here. |
| **NON-GOAL** | Phase 3 SHALL NOT implement. |
| **EXTENSION** | Reserved for future phases; not Phase 3 architecture. |

---

## 1. Purpose & Position

**[NORMATIVE]** Phase 3 is the integration stage described by BLUEPRINT §25:
connect the frozen Phase 1 Foundation and the frozen Phase 2 ToolRuntime through
their public contracts and validate the combined system.

**[INTERPRETATION]** BLUEPRINT §25 states integration "will occur only after
individual components have reached sufficient stability." Phase 1 and Phase 2 are
both frozen and signed off, so the precondition is met.

---

## 2. Consumed Contracts (frozen)

**[NORMATIVE]** Phase 3 consumes, through public barrels only:

* **Phase 1 — `@issue/foundation`:** the frozen §2 surface — **28 symbols**:
  18 runtime exports + 10 type-only exports (see the complete P3-1 inventory in
  §21), including `Logger` / `createLogger`, `redactionList`,
  `assertContained` / `isContained`, and `Result` / `AppError`-compatible data.
* **Phase 2 — `@issue/tool-runtime`:** the frozen §17.2 surface — exactly **20
  types + 3 functions** (`runTask`, `createToolRuntime`,
  `deriveAvailableActions`).

**[IMPLEMENTATION]** Consumption is expected via package-name imports resolved
through each phase's `exports` map (`.` only), matching the Phase 2 `README.md`
§4 LINK mechanics (D3-style `file:` dependencies).

---

## 3. Component Architecture

Phase 3 is an integration layer, not a platform layer. Its components are
planned as:

| Component | Obligation | Maps to BLUEPRINT §25 step |
| --- | --- | --- |
| **Interface Inventory** | Document both frozen public surfaces and Phase 3's consumption of each symbol. | Step 1 |
| **Adapter layer** | Bridge contracts where needed (e.g., supply a `DecisionProvider`, adapt Phase 1 `Result`/`Logger` data for Phase 2 usage). | Step 2 |
| **Connection harness** | Drive `@issue/tool-runtime` using `@issue/foundation` primitives; honor Phase 2 §16 determinism. | Step 3 |
| **Deterministic provider stubs** | Provide fixed `DecisionProvider` implementations for tests and harness; never a model. | Steps 2–3 |
| **Integration/E2E test suite** | Exercise connected components and complete task runs. | Steps 4–5 |
| **Validation & release preparation** | Conflicts, refactor-in-layer, validation, artifact build. | Steps 6–9 |

**[INTERPRETATION]** These components are the minimal realization of §25's nine
steps. No additional components are proposed.

---

## 4. Adapter & Harness Design Principles

**[NORMATIVE]**

* Adapters and harness SHALL reference only public barrel symbols.
* The `DecisionProvider` seam is consumed as-is (Phase 2 §7); stubs SHALL be
  deterministic and SHALL NOT involve a model (Phase 2 §19.1, §22.4).
* No frozen type, function, machine, transition, classification, or correction
  ordering may be altered, wrapped into a changed contract, or extended.

**[IMPLEMENTATION]** Concrete adapter signatures and stub decision tables are a
P3/P4 concern and will be specified at those milestones.

---

## 5. Deferred Decisions

**[DEFERRED]** Carried forward unchanged from Phase 2 §22 (see Phase 3
`SPECIFICATION.md` §6):

* §22.1 CLI — deferred.
* §22.2 configuration schema — deferred.
* §22.3 write/execute/Git/network tooling — deferred.
* §22.4 model-provider binding — deferred.
* §22.5 workspace/monorepo adoption — deferred.

**[NORMATIVE]** None is resolved by Phase 3; resolving any requires separate
owner authorization and a Phase 3 `DECISIONS.md` entry.

---

## 6. Non-Goals

**[NON-GOAL]** Phase 3 has no CLI, no config schema, no write/execute/Git/network
capability, no model binding, no memory, no multi-agent behavior, no planning
engine, no plugins, no codegen, no benchmarking, and no publishing (Phase 3
`SPECIFICATION.md` §5).

---

## 7. Future Extension Points

**[EXTENSION]** Reserved for later phases, not Phase 3:

* CLI / end-user entry point (§22.1).
* Write/execute/Git/network tooling (§22.3).
* Model/provider binding behind the `DecisionProvider` seam (§22.4).
* Workspace/monorepo adoption (§22.5).

---

## 8. Conformance & Validation

**[NORMATIVE]** Phase 3 validates by:

* Demonstrating each BLUEPRINT §25 step (1–9) with a deliverable or record.
* Zero deep imports of either frozen phase.
* Byte-unchanged frozen Phase 1 / Phase 2 files.
* Green quality gates (check, coverage ≥ 80%, build, audit, `git diff --check`).
* Passing integration and end-to-end tests.
* A built and validated first-release artifact, with publishing excluded.

---

## 21. P3-1 Interface Inventory — Phase 1 Public Contract

**[P3-1]** This section is the `TASKS.md` P3-1 interface inventory for the
frozen **Phase 1 public barrel** (`phase-01-foundation/src/index.ts`, frozen
Phase 1 `SPECIFICATION.md` §2). It inventories **every** symbol of that barrel
exactly as it exists. Phase 1 is FROZEN and unmodified by Phase 3.

**[P3-1 — counting note]** The barrel exposes **28 symbols total**:
**18 runtime exports** (values checkable at runtime; exactly the set asserted
by the frozen Phase 1 `tests/contract.test.ts`) and **10 type-only exports**
(interfaces / type aliases with no runtime value). The "18-symbol §2 surface"
wording used in earlier frozen-phase records refers to the runtime exports;
the full inventory below includes both groups.

**[P3-1]** No symbol below is invented. Every entry is verified against
`phase-01-foundation/src/index.ts` and the frozen Phase 1 specification.

### 21.1 Full inventory (28 symbols)

| # | Exported name | Category | Purpose (frozen §) | Consumed by Phase 3 | Where / how consumed | Translation / adaptation |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `VERSION` | const `string` | Package version constant (`--version` source). | **No** | Not consumed; Phase 3 has no CLI (§22.1). MAY appear in harness run context if desired. | n/a |
| 2 | `AppError` | class | Structured, serializable error: `code`, `recoverable`, `cause`, `details`, `toJSON()` (§6). | **Yes** | Harness surfaces harness-level failures as `AppError`; optional AD-1 translation of structural tool errors into `AppError`. | Optional AD-1 (§23.2) |
| 3 | `AppErrorJson` | type | Serialized `AppError.toJSON()` shape. | **Yes** | Typing serialized `AppError` output in harness error records. | No |
| 4 | `AppErrorParams` | type | `AppError` constructor parameters. | **Yes** | Typing `AppError` construction in the harness. | No |
| 5 | `isAppError` | function (guard) | Runtime `AppError` type guard. | **Yes** | Guard in harness error normalization. | No |
| 6 | `toError` | function | Normalize unknown → `Error`. | **Yes** | Boundary normalization of unexpected harness errors. | No |
| 7 | `Result` | type | Discriminated union `{ ok: true; value }` \| `{ ok: false; error }` (§6). | **Yes** | Harness's own fallible steps (e.g., input validation) return `Result`. | No |
| 8 | `ok` | function | `Result` success constructor. | **Yes** | Constructing harness success results. | No |
| 9 | `err` | function | `Result` failure constructor. | **Yes** | Constructing harness failure results. | No |
| 10 | `isOk` | function (guard) | `Result` type guard. | **Yes** | Guarding harness `Result` values. | No |
| 11 | `isErr` | function (guard) | `Result` type guard. | **Yes** | Guarding harness `Result` values. | No |
| 12 | `match` | function | Exhaustive `Result` consumption. | **Yes** | Consuming harness `Result` values. | No |
| 13 | `LogLevel` | type | `'trace'` \| `'debug'` \| `'info'` \| `'warn'` \| `'error'` \| `'fatal'`. | **Yes** | Typing `createLogger({ level })` in the harness. | No |
| 14 | `IssueConfig` | interface | Frozen config shape (§3.4). | **No** | Config-file schema deferred (§22.2); Phase 3 defines no config schema. | n/a |
| 15 | `LoadConfigOptions` | type | `loadConfig` options. | **No** | See `IssueConfig` (§22.2). | n/a |
| 16 | `loadConfig` | function | Load/validate layered config file. | **No** | See `IssueConfig` (§22.2). | n/a |
| 17 | `mergeConfigLayers` | function | Merge config precedence layers. | **No** | See `IssueConfig` (§22.2). | n/a |
| 18 | `EnvSource` | interface | Env map type. | **No** | Phase 3 harness handles no environment variables. | n/a |
| 19 | `EnvSnapshot` | interface | `ISSU_*` snapshot type. | **No** | See `EnvSource`. | n/a |
| 20 | `readEnv` | function | Snapshot `ISSU_*` env. | **No** | See `EnvSource`. | n/a |
| 21 | `getSecret` | function | Secret lookup + redaction registration. | **No** | Phase 3 has no secrets (no model / network / provider binding). | n/a |
| 22 | `redactionList` | function | Canonical redaction list (secret names + values). | **No** (optional) | Not required. Phase 2 already performs redaction internally for its own records (§15.2). The harness MAY mirror it via `createLogger({ redact: redactionList() })` for logger parity. | No |
| 23 | `Logger` | interface | Logging contract: `trace…fatal`, `child` (§5). | **Yes** | Harness logger type (constructed via `createLogger`). | No |
| 24 | `LoggerOptions` | type | `createLogger` options. | **Yes** | Typing harness logger construction. | No |
| 25 | `createLogger` | function | Construct a `Logger` implementation. | **Yes** | Harness structured run records. | No |
| 26 | `assertContained` | function | Resolve a path within a root; throws on violation. | **Yes** | Harness pre-validates the authorized root and refs before `runTask`. | No (direct) |
| 27 | `isContained` | function | Containment predicate. | **Yes** | Harness containment predicate for root / refs. | No (direct) |
| 28 | `runCli` | function | CLI entry (`argv` → exit code). | **No** | CLI deferred (§22.1); Phase 3 has no CLI. | n/a |

**Summary:** 28 symbols total (18 runtime + 10 type-only). **17 consumed** by
Phase 3 (1 optionally: `redactionList`). **11 not consumed** (`VERSION`,
`IssueConfig`, `LoadConfigOptions`, `loadConfig`, `mergeConfigLayers`,
`EnvSource`, `EnvSnapshot`, `readEnv`, `getSecret`, `redactionList`,
`runCli`) — each is excluded by design (deferred §22.1/§22.2 or a Phase 3
non-goal), not by omission.

---

## 22. P3-1 Interface Inventory — Phase 2 Public Contract

**[P3-1]** This section is the `TASKS.md` P3-1 interface inventory for the
frozen **Phase 2 public barrel** (`phase-02/src/index.ts`, frozen Phase 2
`SPECIFICATION.md` §17.2). The surface is **exactly 20 types/interfaces + 3
functions = 23 symbols**, cross-checked against the actual barrel and the
frozen `tests/public-api.test.ts` (§17.3 exactness pins). Phase 2 is FROZEN and
unmodified by Phase 3.

### 22.1 Types / interfaces (20)

| # | Exported name | Category | Purpose (frozen §) | Consumed by Phase 3 | Where / how consumed | Translation / adaptation |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `TaskStatus` | type (9-state union) | The nine frozen machine states (§5.1). | **Yes** | Typing `TaskState.status` in harness result inspection. | No |
| 2 | `ToolOperation` | type (2-union) | The two operations `readFile` / `listDirectory` (§8). | **Yes** | Typing `ActionRef.operation` when constructing refs. | No |
| 3 | `ActionRef` | interface | Operation + target + options (§8). | **Yes** | Harness builds refs for `TaskRefs`; stub `selectAction` returns an `ActionRef`. | No |
| 4 | `ReadOptions` | interface | `readFile` options (§10.2). | **Yes** | Typing `ActionRef.read` for file refs. | No |
| 5 | `ListOptions` | interface | `listDirectory` options (§10.3). | **Yes** | Typing `ActionRef.list` for directory refs. | No |
| 6 | `OutcomeClass` | type (8-union) | Complete frozen classification set (§13.2). | **Yes** | Stub `assess` returns it; harness inspects `ToolResult.classification`. | No |
| 7 | `CorrectionDirection` | type (3-union) | Deterministic correction ordering `RETRY→ADVANCE→EXHAUST` (§6.2). | **Yes** | Typing `TaskState.lastCorrection`; harness observability. | No |
| 8 | `FileContent` | interface | `readFile` result: `text`, `bytesRead` (§17.2). | **Yes** | Typing `ToolResult.data` when the harness inspects a read outcome. | No |
| 9 | `DirectoryEntry` | interface | Listing entry: `name`, `isDirectory`, `isHidden` (§17.2). | **Yes** | Typing `DirectoryListing.entries`. | No |
| 10 | `DirectoryListing` | interface | `listDirectory` result (§17.2). | **Yes** | Typing `ToolResult.data` for directory listings. | No |
| 11 | `ToolResult` | interface | Classified tool outcome (§13.2). | **Yes** | Stub `assess` input; harness inspects results; optional AD-1 error translation. | Optional AD-1 (§23.2) |
| 12 | `TaskRefs` | interface | Fixed plan: `files` + `directories` (§4). | **Yes** | Building the plan in `TaskOptions.refs`. | No |
| 13 | `ResourceBounds` | interface | The five frozen bounds (§12). | **Yes** | Supplying `TaskOptions.bounds` (Phase 3 default bounds). | No |
| 14 | `TaskOptions` | interface | Single-run input: root, refs, bounds, `includeHidden?`, `objective?` (§4). | **Yes** | Primary harness → `runTask` input. | No |
| 15 | `TaskState` | interface | Immutable state snapshot (§5.1). | **Yes** | Inspecting the terminal state after the run. | No |
| 16 | `AvailableAction` | interface | An offered action (§17.2). | **Yes** | Stub `selectAction` input. | No |
| 17 | `DecisionProvider` | interface | Exactly two obligations: `selectAction`, `assess` (§7). | **Yes** | The deterministic stub implements it; harness passes it to `runTask`. | No — direct implementation (§24) |
| 18 | `Assessment` | interface | Neutral `OutcomeClass` classification only (§7). | **Yes** | Stub `assess` output. | No |
| 19 | `TaskResult` | interface | Final state wrapper; status SHALL be terminal (§17.2). | **Yes** | `runTask` output; harness returns it. | No |
| 20 | `ToolRuntime` | interface | Exclusive `EXECUTING` dispatch seam (§9). | **No** | Not consumed directly — `runTask` drives its internal ToolRuntime (§9.1); the harness never calls `execute`. | n/a |

### 22.2 Functions (3)

| # | Exported name | Category | Purpose (frozen §) | Consumed by Phase 3 | Where / how consumed | Translation / adaptation |
| --- | --- | --- | --- | --- | --- | --- |
| 21 | `runTask` | function | Drives the frozen nine-state machine deterministically; dispatches exclusively through an internal ToolRuntime (§17.2). | **Yes** | Core harness invocation. | No |
| 22 | `createToolRuntime` | function | Constructs a ToolRuntime bound to root + bounds (§17.2). | **No** | Not consumed — `runTask` constructs/drives its internal runtime; calling `execute` outside `runTask` would violate the exclusive-seam invariant (§9.1). | n/a |
| 23 | `deriveAvailableActions` | function | Pure, deterministic available-action derivation (§4.3). | **Yes** (optional) | Harness MAY invoke it for deterministic plan observability (e.g., logging the available set); `runTask` performs the authoritative derivation internally. | No |

**Summary:** 23 symbols (20 types + 3 functions). **21 consumed** (2 optional:
`deriveAvailableActions`; `DecisionProvider` consumed as a direct stub
implementation). **2 not consumed** (`ToolRuntime`, `createToolRuntime`) — both
are intentionally unused to preserve the exclusive-seam invariant (§9.1);
`runTask` satisfies the ToolRuntime obligation internally.

---

## 23. P3-1 Integration Mapping

**[P3-1]** The two frozen contracts meet only inside the Phase 3 integration
layer. The mapping is:

```text
Phase 1 contract (@issue/foundation barrel)
        ↓
Phase 3 adapter / translation boundary   (minimal; see §23.1–§23.3)
        ↓
Phase 2 contract (@issue/tool-runtime barrel)
        ↓
connection harness (drives runTask using Phase 1 primitives; §25)
```

### 23.1 Direct contract consumption

**[P3-1]** Most of the surface is consumed **directly** — the Phase 3 adapter
/ translation boundary adds no wrapper for:

* **Containment:** `assertContained` / `isContained` consumed directly by the
  harness for root / ref pre-validation.
* **Observability:** `createLogger` / `Logger` / `LogLevel` / `LoggerOptions`
  consumed directly for harness structured records.
* **Failure substrate:** `Result` / `ok` / `err` / `isOk` / `isErr` / `match`,
  `AppError` / `AppErrorJson` / `AppErrorParams`, `isAppError` / `toError`
  consumed directly for harness-level fallible steps and error normalization.
* **Plan data:** `TaskOptions` / `TaskRefs` / `ResourceBounds` / `ActionRef` /
  `ToolOperation` / `ReadOptions` / `ListOptions` consumed directly as run
  inputs.
* **Machine invocation:** `runTask` consumed directly; its output
  (`TaskResult` / `TaskState` / `TaskStatus` / `CorrectionDirection` /
  `OutcomeClass` / `ToolResult` / `FileContent` / `DirectoryListing` /
  `DirectoryEntry`) is consumed directly as run output.
* **The seam:** `DecisionProvider` / `AvailableAction` / `Assessment` are
  consumed by implementing the `DecisionProvider` seam directly with a
  deterministic stub (no translation; §24).

### 23.2 The only genuine translation boundary — AD-1 (optional)

**[P3-1]** The single structural difference between the two contracts is that
Phase 2 `ToolResult.error` is **structural, `AppError`-compatible data**
(`{ code: string; message: string }`, Phase 2 §13.4; interpreted structurally
by Phase 2 `ARCHITECTURE.md` §9), not a Phase 1 `AppError` instance. This is
**not a contract mismatch**: Phase 2's structural interpretation fully
satisfies §13.4, and Phase 3 may consume the structural shape directly.

**[P3-1]** If Phase 3 elects to surface run failures as Phase 1 `AppError`
instances (unified harness error handling), one **optional** adapter is
defined. **Future contract only — NOT implemented at P3-1 (P4).**

* **Input:** a `ToolResult.error` value (`{ readonly code: string;
  readonly message: string }`) and its surrounding `ToolResult`
  (`ok`, `action`, `classification`).
* **Output:** a Phase 1 `AppError` built from `AppErrorParams`
  (`code`, `message`, `recoverable` derived from `classification`).
* **Responsibility:** translate structural tool error data into a Phase 1
  `AppError` for unified error handling; never invents codes or messages.
* **Ownership:** Phase 3 integration layer (implemented at P4).
* **Error / result behavior:** total for any structurally valid input; maps
  `code` verbatim (`issue.tool.*`), preserves `message` verbatim, sets
  `recoverable` per classification (fatal classifications → `false`).
* **Dependency boundary:** depends only on Phase 1 `AppError` / `AppErrorParams`
  and Phase 2 `ToolResult` / `OutcomeClass` via their public barrels. No
  behavior of either frozen contract is changed.

### 23.3 Where no adapter is required

**[P3-1]** Every other cross-contract path is **direct contract consumption**
(§23.1). The harness reconciles the two contracts' different failure
conventions (Phase 1 `Result`-based functions vs Phase 2 `Promise<TaskResult>`
direct output) by *orchestration*, not adaptation: Phase 1 `Result` is used for
Phase 3's own fallible steps; Phase 2 types represent run outcomes. Neither
frozen contract is altered, wrapped into a changed contract, or extended
(Phase 3 `SPECIFICATION.md` §4; Phase 2 §17.3).

---

## 24. P3-1 Provider Stub Boundary

**[P3-1]** The deterministic provider stub is a **Phase 3 component** (built at
P4) that satisfies the frozen Phase 2 `DecisionProvider` seam. Its boundary
contract, defined now, is:

* **Consumer-supplied:** the stub is supplied by the Phase 3 harness / test
  caller; it is *not* part of either frozen phase. Phase 2 §7/§22.4 explicitly
  leave provider supply to the consumer.
* **Deterministic:** identical `(available, state)` / `(result, state)` inputs
  produce identical outputs. No clock, randomness, or process identity
  anywhere in its control flow (Phase 2 §3.3 confines nondeterminism to the
  provider, and this provider eliminates it).
* **Does not invoke a real model:** it makes no LLM / model API call and
  contains no model logic (Phase 2 §19.1; Phase 3 §5.7).
* **Does not bind a model provider:** it introduces no provider configuration,
  routing, or `§22.4` resolution. `§22.4` remains deferred.
* **Does not introduce an SDK:** zero model SDK or provider dependency; the
  stub depends only on the two phase barrels.
* **Exists only to exercise the frozen seam:** its sole purpose is to drive
  `runTask` deterministically in the harness and integration/E2E tests
  (Phase 3 `SPECIFICATION.md` §4; `TASKS.md` P4-1/P5).

### 24.1 Future contract (definition only — NOT implemented at P3-1)

| Aspect | Definition |
| --- | --- |
| Input | `selectAction(available: readonly AvailableAction[], state: TaskState)` and `assess(result: ToolResult, state: TaskState)` — the frozen Phase 2 signatures, unchanged. |
| Output | `selectAction` → an `ActionRef` drawn **from** the provided `available` set; `assess` → an `Assessment` carrying a **neutral** `OutcomeClass`. |
| Responsibility | Deterministic selection and neutral classification per a fixed decision table/strategy supplied by Phase 3; never derives the available set; never returns control-flow directives. |
| Ownership | Phase 3 integration layer (implemented at P4). |
| Error / result behavior | Total for structurally valid inputs (never throws); any contract violation (action outside `available`, unknown classification, extra keys) is rejected by Phase 2's own validation as `internalError` (Phase 2 `ARCHITECTURE.md` §7) — the stub SHALL NOT trigger that path. |
| Dependency boundary | Implements the Phase 2 barrel `DecisionProvider`; depends only on Phase 2 barrel types (`AvailableAction`, `ActionRef`, `TaskState`, `ToolResult`, `Assessment`, `OutcomeClass`) and, where the policy needs it, Phase 1 barrel primitives (`Result` / `ok` / `err`). No model SDK, no new dependencies. |

**[P3-1]** The concrete decision-table design and default stub strategy are a
P3-2 (design) / P4 (implementation) concern and are deliberately not specified
here.

---

## 25. P3-1 Connection Harness Contract

**[P3-1]** The connection harness is the Phase 3 module (designed at P3-2,
implemented at P4) that drives `@issue/tool-runtime` using
`@issue/foundation` primitives through their **public barrels only**. Its
contract, defined now:

* **What enters the harness:**
  * a validated `TaskOptions`-shaped input — authorized `root`, fixed `refs`
    (files + directories), `ResourceBounds` (Phase 3 supplies explicit bounds;
    defaults mirror Phase 2 D-BOUNDS values), optional `includeHidden`,
    advisory `objective`;
  * a consumer-supplied `DecisionProvider` (the deterministic stub, §24);
  * an optional `AbortSignal` (passed through to `runTask`);
  * an optional logger configuration (Phase 1 `LoggerOptions`).
* **What it invokes:**
  * `runTask(options, provider, { signal })` — the core invocation;
  * Phase 1 `createLogger` / `Logger` for structured records;
  * Phase 1 `assertContained` / `isContained` for root / ref pre-validation;
  * Phase 1 `Result` / `ok` / `err` / `isOk` / `isErr` / `match` and
    `AppError` / `isAppError` / `toError` for its own fallible steps;
  * optionally Phase 2 `deriveAvailableActions` for deterministic plan
    observability.
* **What comes out:** a run outcome represented by Phase 2 `TaskResult`
  (terminal `TaskState`; status `COMPLETED` / `FAILED` / `CANCELLED`),
  plus harness-level results/errors (see below).
* **How results / errors are represented:**
  * run outcomes — Phase 2 types, consumed directly (`TaskResult.state`;
    tool outcomes via `ToolResult` / `OutcomeClass`);
  * harness-level failures (invalid input, containment violation, unexpected
    harness error) — Phase 1 `Result` / `AppError` (thrown or returned);
  * tool-level errors — structural `ToolResult.error` consumed as-is;
    optionally translated by AD-1 (§23.2).
* **How Foundation primitives participate:** as the observability,
  containment, and failure substrate of the harness (§23.1). No Phase 1
  config, env, secret, or CLI surface is used (deferred / non-goal).
* **How ToolRuntime is driven:** **indirectly.** `runTask` drives the
  TaskMachine, which dispatches exclusively through its internal ToolRuntime
  (§9.1). The harness never calls `ToolRuntime.execute` directly, preserving
  the exclusive-seam invariant and the `§16` deterministic semantics.
* **How deterministic decisions enter the system:** the consumer-supplied
  deterministic stub (§24) is passed to `runTask`; the stub is the only
  decision source, and it is deterministic. The harness itself adds no
  decisions.

**[P3-1]** Concrete harness signatures, module layout, and the adapter/stub
wiring are **P3-2 design / P4 implementation** work and are deliberately not
specified here. This section defines only the boundary contract.

---

## 26. P3-1 Conflict Register

**[P3-1]** A comparison of the frozen Phase 1 §2 and Phase 2 §17.2 contracts
against each other and against the Phase 3 consumption defined in §21–§25 was
performed. **No contract mismatch requiring adaptation was identified.**

The following were examined and dispositioned as **non-conflicts**:

| # | Contracts involved | Observation | Disposition |
| --- | --- | --- | --- |
| 1 | Phase 2 §13.4 (`AppError`-compatible data) ↔ Phase 1 `AppError` | Phase 2 surfaces failures structurally (`{ code, message }`), interpreted structurally by Phase 2 §9. | Not a mismatch; Phase 3 consumes the structural shape directly. Optional AD-1 translation exists only if unified `AppError` handling is wanted (§23.2). No adaptation required. |
| 2 | Phase 1 "18-symbol §2 surface" count ↔ actual barrel | The barrel exposes 28 symbols (18 runtime + 10 type-only); the count wording refers to runtime exports. | Counting convention, not a contract mismatch. Phase 3 clarifies the count in its own docs (§21); frozen phases unmodified. |
| 3 | Phase 2 `ToolRuntime` / `createToolRuntime` ↔ harness consumption | Exported by the barrel but intentionally not consumed by the harness. | Not a mismatch; deliberate preservation of the exclusive-seam invariant (§9.1). `runTask` drives the internal runtime. |
| 4 | Phase 1 `runCli` / config / env / secrets surface ↔ Phase 3 scope | Inventoried but not consumed. | By design: CLI (§22.1) and config schema (§22.2) are deferred; env/secrets are Phase 3 non-goals (Phase 3 §5). Not a mismatch. |
| 5 | Phase 1 `Result`-based functions ↔ Phase 2 `Promise<TaskResult>` direct output | Different failure conventions between the two contracts. | Not a mismatch; each contract is internally consistent. The harness reconciles by orchestration (§23.3), never by altering either contract. |
| 6 | Phase 2 `ResourceBounds` required (no implicit defaulting) ↔ D-BOUNDS recommended values | `TaskOptions.bounds` is mandatory; D-BOUNDS are recommended defaults. | Not a mismatch; the Phase 3 harness supplies explicit bounds. |
| 7 | Phase 2 `runTask` `opts.signal` ↔ harness cancellation | `AbortSignal` is passed through. | Not a mismatch; direct pass-through. |

---

## 27. P3-1 Boundary Assertions

**[P3-1]** The P3-1 deliverable preserves, and Phase 3 continues to preserve:

* **Barrel-only consumption** — `@issue/foundation` and `@issue/tool-runtime`
  are consumed only through their package-name public barrels.
* **No deep imports** — `@issue/foundation/dist/...`,
  `@issue/tool-runtime/src/...`, or internal module paths are never used
  (Phase 3 §2; both `exports` maps expose only `.`).
* **No Phase 1 / Phase 2 modifications** — neither frozen phase is changed in
  any way at any Phase 3 milestone.
* **No implementation at P3-1** — this deliverable is definition-only:
  no adapters, no harness, no provider stub, no integration logic, no tests.
* **§22.1–§22.5 remain deferred** — nothing is resolved; the CLI (§22.1),
  config schema (§22.2), write/execute/Git/network (§22.3), model-provider
  binding (§22.4), and workspace/monorepo (§22.5) stay deferred.
* **All Phase 3 `SPECIFICATION.md` §5 prohibitions remain intact** — none of
  the 15 prohibited capabilities is implemented, depended upon, or introduced.
* **Provider-independent design** — the `DecisionProvider` seam is consumed
  as-is (Phase 2 §7); deterministic stubs involve no model, provider, or SDK
  (Phase 2 §19.1, §22.4).
* **Phase 3 owns only integration-layer definitions** — nothing in the
  inventory adds capability to either frozen phase.

---

## 28. P3-2 Adapter Contract — AD-1 (finalized)

**[P3-2]** This section finalizes the AD-1 translation boundary introduced at
P3-1 (§23.2). AD-1 remains the **only** identified translation boundary (§26
conflict register #1). Its contract is definition-only; implementation is P4-1.

### 28.1 Contract definition

| Aspect | Definition |
| --- | --- |
| **Name** | AD-1 — ToolResult → AppError structural translation adapter. |
| **Purpose** | Optionally translate a Phase 2 structural `ToolResult.error` (`{ code, message }`, Phase 2 §13.4) into a Phase 1 `AppError` instance so run failures can be surfaced through the unified Phase 1 error substrate. |
| **Triggering condition** | Invoked only when the harness elects unified `AppError` handling for a failed tool outcome (`ToolResult.ok === false`). Not invoked for `ok === true`. |
| **Input contract** | A `ToolResult` with `ok: false`: `error: { code, message }`, `action`, `classification`, optional `bytesRead`. |
| **Output contract** | A Phase 1 `AppError` constructed from `AppErrorParams` (`code`, `message`, `recoverable`), with `details` carrying the surrounding `ToolResult` context. |
| **Structural translation** | `error.code` → `AppError.code` (verbatim); `error.message` → `AppError.message` (verbatim); `classification` → `AppError.recoverable` (deterministic table, §28.2); `action`/`classification`/`bytesRead` → `details`. |
| **Ownership** | Phase 3 integration layer (`@issue/integration`), implemented at P4-1. |
| **Error / result behavior** | Total for any structurally valid `ToolResult.error`: always produces an `AppError`; never throws, never invents codes or messages, never returns `null`/`undefined`. |
| **Dependency boundary** | Depends only on Phase 1 `AppError` / `AppErrorParams` and Phase 2 `ToolResult` / `OutcomeClass` via their public barrels. |
| **Deterministic behavior** | Identical input → identical `AppError`; no clock, randomness, or process identity in its control flow. |
| **MUST NOT** | Add capability to either frozen phase; modify or re-interpret `code`/`message`/`classification`/`CorrectionDirection`; perform I/O; execute; resolve any §22 item; change the frozen phase semantics (§21–§27 preserved). |

### 28.2 `recoverable` mapping (deterministic)

| `OutcomeClass` | `AppError.recoverable` | Rationale (frozen source) |
| --- | --- | --- |
| `success` | n/a (not triggered; `ok === true`) | — |
| `executionError` | `true` | The only retryable classification (Phase 2 §13.3: "Retryable classifications SHALL be exactly `executionError`"). |
| `invalidContent` | `false` | Non-retryable, deterministic for a given target/state (§13.3). |
| `notFound` | `false` | Non-retryable (§13.3). |
| `accessDenied` | `false` | Non-retryable; deny-by-default (§13.3, §11). |
| `tooLarge` | `false` | Non-retryable; bounded (§13.3, §12). |
| `invalidInput` | `false` | Fatal (§13.3). |
| `internalError` | `false` | Fatal (§13.3). |

The mapping is a Phase 3 contract decision recorded in this architecture
document; it adds no behavior to either frozen phase.

---

## 29. P3-2 Connection Harness Contract (finalized)

**[P3-2]** This section finalizes the connection harness contract introduced at
P3-1 (§25). The harness is a Phase 3 module (implemented at P4-1) that drives
`@issue/tool-runtime` using `@issue/foundation` primitives through the public
barrels only.

### 29.1 Entry point concept

- A single exported library entry function in the Phase 3 barrel
  (`@issue/integration` `src/index.ts`) that accepts a validated run request and
  returns a Promise of the run result.
- **Not a CLI**: §22.1 remains deferred. The entry point is a function usable by
  P5 integration/E2E tests and future callers, not a command-line program.
- Exact function name/signature is a P4-1 implementation detail, constrained by
  the input/output contracts in §29.2–§29.9.

### 29.2 Accepted inputs

| Input | Type (frozen) | Requirement |
| --- | --- | --- |
| `root` | `string` | Absolute canonical path; the authorized root. Pre-validated with `assertContained`. |
| `refs` | `TaskRefs` | Fixed plan: `files` + `directories`. The only work items (Phase 2 §4.2). |
| `bounds` | `ResourceBounds` | **Required, explicit** (Phase 2 §17.2: mandatory field). Phase 3 default = D-BOUNDS values (§29.3). |
| `includeHidden?` | `boolean` | Optional; default `false`. Passed through to `TaskOptions`. |
| `objective?` | `string` | Advisory only; never used to derive actions (Phase 2 §4). |
| `provider` | `DecisionProvider` | Consumer-supplied; the deterministic stub (§30) for all Phase 3 runs. |
| `signal?` | `AbortSignal` | Optional; passed through to `runTask` `opts.signal` (Phase 2 §17.2). |
| `loggerConfig?` | `LoggerOptions` | Optional Phase 1 logging config for structured records. |

### 29.3 Required bounds

- `TaskOptions.bounds` is mandatory (Phase 2 §17.2). The harness SHALL supply
  explicit bounds on every invocation.
- Phase 3 **DEFAULT_BOUNDS** mirror Phase 2 **D-BOUNDS** (Phase 2 `DECISIONS.md`):
  `maxRetries: 2`, `maxCorrections: 5`, `maxVerifications: 10`,
  `maxBytesPerRead: 1024 * 1024`, `chunkSize: 4096`. (§26 #6 already disposes
  the required-vs-default tension.)

### 29.4 Task / plan information

- The plan is entirely `TaskRefs`; the harness builds `TaskOptions` from the
  validated inputs and passes them to `runTask` unchanged (§23.1). It adds,
  removes, or reorders no refs.

### 29.5 Decision-provider interaction

- The harness passes the consumer-supplied `DecisionProvider` to `runTask` as
  its second argument (§23.1). The harness itself makes **no** decisions;
  `runTask` consults the provider only at `SELECTING` / `EVALUATING`
  (Phase 2 §9.1, §3.3).

### 29.6 Foundation primitive participation

- `createLogger` / `Logger` / `LogLevel` / `LoggerOptions` — structured run
  records.
- `assertContained` / `isContained` — root / refs pre-validation.
- `Result` / `ok` / `err` / `isOk` / `isErr` / `match` — the harness's own
  fallible steps.
- `AppError` / `AppErrorJson` / `AppErrorParams` / `isAppError` / `toError` —
  harness-level error normalization; AD-1 output typing.
- No Phase 1 config / env / secret / CLI surface is used (§22.1/§22.2 deferred;
  non-goals).

### 29.7 Invocation of `runTask`

- The harness invokes `runTask(options, provider, { signal })` — the **core
  orchestration seam** (Phase 2 §17.2; §9.1).
- The harness SHALL NOT call `createToolRuntime` and SHALL NOT call
  `ToolRuntime.execute`; `runTask` drives the internal ToolRuntime exclusively
  (§9.1). This preserves the exclusive-seam invariant and Phase 2 §16
  determinism.

### 29.8 Output / result contract

- Run outcome: Phase 2 `TaskResult` — terminal `TaskState` (`COMPLETED` /
  `FAILED` / `CANCELLED`) consumed directly (§23.1).
- Tool outcomes: `ToolResult` / `OutcomeClass` inspected directly.
- Harness-level failures: Phase 1 `Result` / `AppError` (invalid input,
  containment violation, unexpected harness error).
- Optional: run failures surfaced as Phase 1 `AppError` via AD-1 (§28).

### 29.9 Error representation

- Two independent layers:
  1. **Harness-layer** errors — Phase 1 `Result` / `AppError`.
  2. **Run-layer** outcomes — Phase 2 `TaskResult` / `ToolResult`; structural
     `ToolResult.error` consumed as-is, optionally translated by AD-1.
- No error is re-interpreted or re-mapped except by AD-1 (§28), which preserves
  `code`/`message` verbatim.

### 29.10 Deterministic execution

- The harness SHALL be deterministic: identical validated inputs, provider, and
  filesystem state → identical run outcome and identical structured records.
- Nondeterminism is confined to the provider by Phase 2 §3.3; the deterministic
  stub (§30) eliminates it, so Phase 3 runs are fully deterministic.

### 29.11 Ownership

- Phase 3 integration layer (`@issue/integration`); implemented at P4-1.

### 29.12 Lifecycle

```text
validate root + refs (containment)
→ build TaskOptions (bounds explicit)
→ create logger (optional)
→ runTask(options, provider, { signal })
→ inspect terminal TaskState
→ optional AD-1 translation of failed tool outcomes
→ return run result + harness records
```

### 29.13 Boundary assertions

- barrel-only; no deep imports; no frozen-phase modification; no fs mutation; no
  process execution; no network; no Git; no model/provider SDK; `runTask` is the
  orchestration seam; ToolRuntime internals inaccessible (§31).

### 29.14 Prohibited behavior

- SHALL NOT call `ToolRuntime.execute` or `createToolRuntime`.
- SHALL NOT import Phase 2 internals or Phase 1 internals.
- SHALL NOT perform filesystem mutation, process execution, network, Git, or
  model/provider calls.
- SHALL NOT resolve any §22 item.
- SHALL NOT add capability to either frozen phase.

---

## 30. P3-2 Deterministic Provider Stub Contract (finalized)

**[P3-2]** This section finalizes the deterministic provider-stub boundary
introduced at P3-1 (§24). The stub is a Phase 3 component (implemented at P4-1)
that satisfies the frozen Phase 2 `DecisionProvider` seam (§7).

### 30.1 Contract definition

| Aspect | Definition |
| --- | --- |
| **Name** | Deterministic provider stub. |
| **Purpose** | Supply deterministic `DecisionProvider` decisions to `runTask` for the harness and P5 tests; exercise the frozen seam without a model. |
| **Seam** | Implements the frozen Phase 2 `DecisionProvider` (§7): exactly two obligations — `selectAction(available, state) → ActionRef` and `assess(result, state) → Assessment`. |
| **Consumer-supplied** | The stub is supplied by the Phase 3 harness / test caller (Phase 2 §7.1, §22.4). It is not part of either frozen phase. |
| **Deterministic** | Identical `(available, state)` / `(result, state)` inputs → identical outputs. No clock, randomness, or process identity (Phase 2 §3.3). |
| **Returns predefined decisions** | Selection and assessment follow fixed, documented policies (§30.2). |
| **No model / provider / SDK / network** | No LLM/model API, no provider configuration/routing, no SDK dependency, no network (Phase 2 §19.1, §22.4; Phase 3 §5.7). |
| **Resolves no §22.4** | Introduces no model-provider binding; §22.4 remains deferred. |
| **Dependency boundary** | Phase 2 barrel types only (`AvailableAction`, `ActionRef`, `TaskState`, `ToolResult`, `Assessment`, `OutcomeClass`); optionally Phase 1 barrel `Result` / `ok` / `err` for the policy. No new dependencies. |
| **Error / result behavior** | Total for structurally valid inputs (never throws). A violation (action outside `available`, unknown classification, extra keys) is rejected by Phase 2's own validation as `internalError` (Phase 2 `ARCHITECTURE.md` §7) — the stub SHALL NOT trigger that path. |
| **MUST NOT** | Derive the available set; add/modify refs; return correction directions; return control-flow directives (Phase 2 §7.3); resolve §22. |

### 30.2 Baseline deterministic policies (P3-2 design, implemented at P4-1)

Two baseline policies are specified for P5 determinism:

1. **Selection — "first-available" policy:** `selectAction` returns the first
   `ActionRef` in the provided `available` order. The available set is derived
   deterministically by Phase 2 (§4.3, §16 V17), so this is deterministic and
   never invents refs.
2. **Assessment — "mirror" policy:** `assess` returns an `Assessment` whose
   `classification` equals the `result.classification` produced by the runtime.
   This is deterministic and produces the §16 V-scenario outcomes through Phase
   2's own §13.3 mapping.

An optional **fixed-decision-table** variant allows a caller to supply a static
mapping; each entry is validated to be a valid `DecisionProvider` response
(action ∈ `available`, classification ∈ `OutcomeClass`). All variants remain
deterministic and model-free.

---

## 31. P3-2 Contract Assertions (P4-1 must satisfy)

**[P3-2]** Any P4-1 implementation of the §28–§30 contracts SHALL satisfy all of
the following assertions:

| # | Assertion | Frozen source |
| --- | --- | --- |
| 1 | Barrel-only imports — Phase 1/Phase 2 imported via package name only. | Phase 3 §2; Phase 1 §2; Phase 2 §18.2 |
| 2 | No deep imports — no `dist/...`, no `src/...` internal paths. | Phase 3 §2; Phase 2 §18.2 |
| 3 | No frozen-phase modification — Phase 1/Phase 2 files byte-unchanged. | BLUEPRINT §7.4/§10; Phase 3 §1.1 |
| 4 | No filesystem mutation outside any explicitly permitted future contract (none today). | Phase 2 §14; Phase 3 §5.3 |
| 5 | No process execution. | Phase 2 §19.4; Phase 3 §5.4 |
| 6 | No network. | Phase 2 §19.6; Phase 3 §5.6 |
| 7 | No Git. | Phase 2 §19.5; Phase 3 §5.5 |
| 8 | No model / provider SDK. | Phase 2 §19.1; Phase 3 §5.7 |
| 9 | Deterministic provider behavior (identical inputs → identical outputs). | Phase 2 §3.3/§16 V16 |
| 10 | `runTask` is the orchestration seam — the harness drives the machine only via `runTask`. | Phase 2 §9.1/§17.2 |
| 11 | ToolRuntime internals remain inaccessible — no `execute`, no `createToolRuntime` in harness. | Phase 2 §9.1 |
| 12 | Required bounds are supplied on every invocation. | Phase 2 §17.2 |
| 13 | Result/error semantics remain compatible — Phase 1 `Result`/`AppError` for harness steps; Phase 2 `TaskResult`/`ToolResult` for run outcomes; AD-1 translation total and deterministic. | Phase 1 §6; Phase 2 §13 |
| 14 | Phase 1 Foundation primitives consumed only through public exports. | Phase 1 §2; Phase 3 §2 |

---

## 32. P3-2 Integration Flow

**[P3-2]** The contract-level flow realized by the §28–§30 contracts is:

```text
Phase 3 input
  → deterministic DecisionProvider (stub, §30)
  → public Phase 2 runTask seam (§29.7)
  → frozen ToolRuntime behavior (internal, exclusive §9.1)
  → Result / ToolResult output (§29.8)
  → optional AD-1 structural translation (§28)
  → Phase 1 Result / AppError-compatible representation
  → Phase 3 integration result (§29.8)
```

This flow is implementation-neutral and definition-only. It is not realized
until P4-1.

---

## 33. P3-2 Contract Matrix

**[P3-2]** Summary matrix of the three Phase 3 integration components:

| Component | Input | Output | Owner | Dependency | Allowed behavior | Forbidden behavior | Implementation milestone |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **AD-1** (translation adapter) | `ToolResult` with `ok: false` (`error`, `action`, `classification`) | Phase 1 `AppError` (`code`, `message`, `recoverable`, `details`) | Phase 3 integration layer | Phase 1 `AppError`/`AppErrorParams`; Phase 2 `ToolResult`/`OutcomeClass` (barrels) | Deterministic structural translation; preserve `code`/`message` verbatim; set `recoverable` per §28.2 | Invent/remap codes or messages; modify frozen contracts; I/O or execution; resolve §22; change semantics | P4-1 |
| **Connection harness** | Validated run request (root, refs, bounds, includeHidden?, objective?, provider, signal?, loggerConfig?) | Phase 2 `TaskResult` (+ Phase 1 `Result`/`AppError` for harness-layer failures) | Phase 3 integration layer | Phase 1 barrel primitives; Phase 2 `runTask` + task types (barrels) | Validate containment; build `TaskOptions` with explicit bounds; invoke `runTask`; log records; inspect terminal state; optional AD-1 | Call `ToolRuntime.execute`/`createToolRuntime`; deep imports; fs mutation; process/network/Git; model/SDK; resolve §22; add capability | P4-1 |
| **Deterministic provider stub** | `selectAction(available, state)`, `assess(result, state)` | `ActionRef` (from `available`); `Assessment` (neutral `OutcomeClass`) | Phase 3 integration layer (consumer-supplied) | Phase 2 barrel types; optionally Phase 1 `Result`/`ok`/`err` | Deterministic selection/assessment per §30.2; honor the frozen seam | Derive available; modify plan; correction directions; control-flow directives; model/SDK/network; resolve §22.4 | P4-1 |

---

## 34. P3-2 → P4 Handoff

**[P3-2]**

### 34.1 What P4-1 will implement

P4-1 may implement **only** the contracts finalized by P3-2 (§28–§31):

- The **connection harness** entry point and lifecycle (§29).
- The **AD-1** translation adapter if unified `AppError` handling is elected
  (§28).
- The **deterministic provider stub** with the §30.2 baseline policies (§30).
- All **§31 assertions** must hold in the P4-1 implementation.

P4-1 consumes both frozen phases through their public barrels only.

### 34.2 What P3-2 does NOT implement

- No adapters.
- No harness.
- No provider stub.
- No integration logic.
- No tests.
- No `src/` changes (`src/index.ts` remains the P1 comment-only placeholder).
- No frozen-phase changes.
- No §22.1–§22.5 resolution.

P3-2 is **definition-only**.

---

## 35. P5 Definition — Integration / End-to-End Tests

**[P5]** This section bounds the P5 milestone (BLUEPRINT §25 steps 4–5; Phase 3
`SPECIFICATION.md` §4 items 4–5; `TASKS.md` P5-1/P5-2). It was originally
authored as a **definition** of the P5 test architecture only, recorded for owner
approval; as a definition it introduced no implementation, no `tests/`
directory, no `src/` change, no new runtime contract, and no sign-off, and P5-1/
P5-2 remained `[ ]` until owner approval (P5 Owner Approval Record, 2026-08-11)
and implementation (2026-08-11/12). That definition is now **implemented,
verified, and closed**: P5-1 and P5-2 are ACCEPTED/CLOSED and P5 was formally
CLOSED by owner sign-off on 2026-08-12 (`TASKS.md` P5 Closure Sign-off Record).
The implementation introduced no `src/` change, no new runtime contract, and no
frozen-phase change.

### 35.1 P5 scope

| Milestone | BLUEPRINT step | Definition |
| --- | --- | --- |
| P5-1 | §25 step 4 (integration tests) | Tests exercising the connected Phase 3 components (harness + AD-1 + deterministic stub + bounds) together through the Phase 3 public barrel, against a real ephemeral fixture tree. |
| P5-2 | §25 step 5 (end-to-end tests) | Tests running complete tasks through the default harness (default bounds + deterministic stub) against real fixtures, asserting the frozen Phase 2 §16 V1–V18 outcomes end-to-end. |

### 35.2 Test suite layout (created at P5 implementation)

The P5 test suite, created at P5 implementation (2026-08-11/12) under
`phase-03/tests/`, contains exactly the following 10 files (the shared fixture
helper plus nine suites), signed off with P5-1/P5-2 and verified by the P5
Final Closure Audit:

**P5-1 — integration:**

- `tests/helpers.ts` — shared deterministic fixtures: ephemeral root creation
  (`mkdtemp`), tree builders (`mkdir`/`writeFile`), recursive snapshot/compare,
  recording provider, scripted (call-count) provider, aborting provider,
  capturing logger.
- `tests/public-api.test.ts` — pins the Phase 3 barrel surface (§35.8).
- `tests/harness.integration.test.ts` — request validation, containment, record
  ordering, `toolErrors`/AD-1 wiring, options flow-through, abort-before-start.
- `tests/runtime.classifications.integration.test.ts` — real-runtime outcome
  classifications through the harness (V1–V4, V7, V8).
- `tests/stub.determinism.test.ts` — deterministic stub policies and
  determinism.
- `tests/ad1.integration.test.ts` — AD-1 structural translation of failed
  `ToolResult`s.

**P5-2 — end-to-end:**

- `tests/endtoend.vtable.test.ts` — V1 happy path; V2/V3/V4 terminal `FAILED`;
  V11/V12 bounds; V15/V16/V17 projections; V18 redaction repeat.
- `tests/endtoend.retry.test.ts` — V9 persistent and transient arms; V10 retry
  bound.
- `tests/endtoend.cancellation.test.ts` — V13 mid-run cancellation.
- `tests/endtoend.readonly.test.ts` — V14 read-only guarantee.

### 35.3 V1–V18 mapping to P5-1/P5-2

Grounding: frozen Phase 2 `SPECIFICATION.md` §16 (normative acceptance inputs),
the frozen nine-state machine (§5.1), and the frozen correction semantics
(`correctionDirection`: `executionError` → `RETRY` up to `maxRetries`;
non-retryable non-fatal → `ADVANCE` while `corrections ≤ maxCorrections`;
otherwise `EXHAUST`; `invalidInput`/`internalError` → immediate `FAILED`).

| V | Scenario (§16) | Expected result | P5-1 | P5-2 |
| --- | --- | --- | --- | --- |
| V1 | All refs succeed | `COMPLETED` | success classification; completed set == refs | full happy path |
| V2 | Read nonexistent file | `notFound`; `FAILED` | runtime `notFound` + AD-1 code | terminal `FAILED` |
| V3 | Invalid UTF-8 | `invalidContent`; `FAILED` | fixture with invalid UTF-8 bytes; no text returned | terminal `FAILED` |
| V4 | List nonexistent dir | `notFound`; `FAILED` | runtime `notFound` (list) + AD-1 | terminal `FAILED` |
| V5 | Target outside root | `accessDenied`; never executed; `FAILED` | harness pre-run containment rejection (`issue.path.escape`); never executed | N/A (pre-run rejection) |
| V6 | Symlink escaping root | `accessDenied` | harness containment via `realpath` (symlink fixture where OS permits; traversal path otherwise) | N/A (pre-run rejection) |
| V7 | Hidden entries | excluded default; included with `includeHidden: true`; identical on repeat | harness `includeHidden` flow-through; repeat run identical | — |
| V8 | File > `maxBytesPerRead` | `tooLarge`; no truncated success | real runtime bound via small `maxBytesPerRead` | — |
| V9 | Transient `executionError` | `RETRY` ≤ `maxRetries`; persistent → `EXHAUST` → `FAILED` | — | persistent arm (fixed table) + transient arm (scripted fixture) |
| V10 | Retry bound | same `ActionRef` ≤ `maxRetries` | — | recording-provider execution count == `maxRetries` + 1; `attempts.retries == maxRetries` |
| V11 | Correction bound | `CORRECTING` ≤ `maxCorrections` | — | forced `notFound` `ADVANCE` loop; `attempts.corrections ≤ maxCorrections`; `FAILED` |
| V12 | Verification bound | `VERIFYING` ≤ `maxVerifications` | — | `attempts.verifications ≤ maxVerifications` on a real run |
| V13 | Cancellation during `EXECUTING` | `CANCELLED`; no further actions | abort-before-start (`READY` check) | mid-run abort at a fixed decision index; completed set frozen; no action after abort |
| V14 | Read-only guarantee | filesystem unchanged | — | snapshot before/after; byte-identical |
| V15 | Terminal closure | no transitions after terminal | records == `[validate, run]` (+ `translate`); terminal status stable | terminal status asserted on E2E runs |
| V16 | Determinism | identical inputs ⇒ identical transitions + terminal | — | two identical runs → identical terminal + `attempts` + completed sets |
| V17 | Available-action derivation | only authorized pending refs offered | completed ⊆ authorized refs; no out-of-root ref processed | same projection on E2E runs |
| V18 | Redaction | no secret/content in logs or errors | capturing logger; secret absent from log lines; error message content-free | repeat assertion on E2E run |

**Note on V5/V6:** through the Phase 3 harness, out-of-root targets are refused
before `runTask` (containment validation, `issue.path.escape`). This is the
harness-observable projection of the §16 result; the guarantee "never executed"
is preserved. The Phase 2-internal `accessDenied` production is covered by the
frozen Phase 2 suite.

### 35.4 Fixture strategy

- Every test creates its own ephemeral root via `mkdtemp` under `os.tmpdir()`
  and removes it via `rm(root, { recursive: true, force: true })` (frozen Phase 2
  test convention — Phase 2 `tests/helpers.ts` uses the same pattern).
- Fixture creation/removal and V14 snapshotting occur **in the test process**
  with `node:fs/promises`. This is test scaffolding required by the normative
  §16 acceptance inputs (V1/V3/V7/V8/V14 need fixture files) and matches the
  frozen Phase 2 suite. It introduces NO filesystem-mutation capability into the
  Phase 3 implementation: the runtime capability set remains strictly read-only
  (Phase 2 §14; Phase 3 §5.3 governs the delivered `src/` layer).
- No fixture exists inside the repository, inside `src/`, or inside a frozen
  phase directory.

### 35.5 Coverage policy (joint)

`vitest.config.ts` (unchanged) declares a single project with
`include: ["tests/**/*.test.ts"]`, `coverage.include: ["src/**/*.ts"]`, and
per-metric thresholds `lines`/`functions`/`statements`/`branches` = 80.
`npm run test:coverage` runs the whole suite in one aggregate and fails if any
threshold is unmet. Therefore the acceptance criterion "coverage ≥ 80%" is
**joint** across P5-1 + P5-2: the single `npm run test:coverage` command must
pass all four per-metric thresholds over `src/**/*.ts`. No config change is
needed.

### 35.6 executionError / retry / correction / exhaustion strategy (V9–V12)

- The mechanism uses only the frozen `DecisionProvider.assess → Assessment
  { classification }` seam; the machine drives correction from that
  classification (§35.3 grounding).
- **Persistent arm (V9/V10):** deterministic stub fixed-decision-table
  `assessments: target → "executionError"`. The real runtime executes the read;
  the stub forces `executionError`; the machine `RETRY`s the same `ActionRef`
  (`state.retries += 1`), then `EXHAUST` → `FAILED`. Assertions: `FAILED`,
  `attempts.retries === maxRetries`, `lastCorrection === "EXHAUST"`, failing
  target absent from `completed`.
- **Transient arm (V9):** a test-side scripted deterministic `DecisionProvider`
  fixture returns `executionError` for the first `k` assessments of a target,
  then the mirrored success classification. Assertions: run `COMPLETED`,
  `attempts.retries === k`. The fixture is consumer-supplied (Phase 2 §7.1,
  §22.4), deterministic, and model-free — it is a `tests/` fixture, not a
  `src/` stub extension (`src/` is immutable).
- **Correction bound (V11):** forced non-retryable classification (e.g.,
  `notFound`) drives `ADVANCE` repeatedly to `EXHAUST`; assert
  `attempts.corrections ≤ maxCorrections`.
- **Verification bound (V12):** assert `attempts.verifications ≤
  maxVerifications` on a real run.
- No new runtime contract is required.

### 35.7 Cancellation strategy (V13)

- Frozen plumbing: the harness forwards `request.signal` to `runTask`; the
  machine checks `signal.aborted` at every state entry (`READY` via
  aborted-before-start, `SELECTING`, `EXECUTING`, `EVALUATING`, `CORRECTING`,
  `VERIFYING`).
- **Abort-before-start (P5-1):** pass an already-aborted signal; the `READY`
  check ends the run `CANCELLED` deterministically (no timing).
- **Mid-run (P5-2, V13 exact):** a test-side `abortingProvider` fixture wraps
  the deterministic stub and calls `controller.abort()` synchronously inside a
  fixed `selectAction` call. Because the machine `await`s `provider.selectAction`,
  the abort is observed at the next state-entry `cancelled()` check in the same
  turn — deterministic, no timers. Assertions: run ends `CANCELLED`; completed
  set is frozen at the abort point; a recording provider proves no action
  executes after the aborting call ("no further actions execute", §16 V13).
- No new contract is required.

### 35.8 Public API stability

`tests/public-api.test.ts` (P5-1) pins the Phase 3 barrel exactly: values
`runIntegrationTask`, `createDeterministicProviderStub`, `translateToolError`,
`isFailedToolResult`, `DEFAULT_BOUNDS`; types `IntegrationTaskRequest`,
`IntegrationTaskResult`, `HarnessRecord`, `DeterministicProviderStubConfig`,
`DeterministicStubTable`, `FailedToolResult`, `ToolErrorDetails` — matching
`src/index.ts`, with no internal path exported. This mirrors the frozen
Phase 1/Phase 2 `public-api.test.ts` convention. It requires no `src/` change.

### 35.9 Dependency and capability boundaries (P5 SHALL)

- P5 tests import only public barrels: the Phase 3 barrel (`../src/index.js`)
  and the frozen `@issue/tool-runtime` / `@issue/foundation` barrels (types for
  assertions). No deep imports.
- Runs are driven ONLY through `runIntegrationTask`. No `createToolRuntime`,
  no `ToolRuntime.execute`, no direct `runTask` calls in tests.
- The deterministic provider stub is used wherever a `DecisionProvider` is
  required (§4); the scripted and aborting providers are deterministic test
  fixtures within that seam.
- No model/provider SDK, no network, no Git, no CLI, no config schema, no
  workspace capability, no runtime filesystem mutation, no §22 resolution.
- `phase-03/src/**`, `package.json`, `vitest.config.ts`, and both frozen phases
  remain unchanged.

### 35.10 Definition status and implementation state

At definition time (before P5 implementation) this section was a **definition,
not a sign-off**: P5-1 and P5-2 remained `[ ]`, no `tests/` directory existed,
and no sign-off was introduced. The definition was then owner-approved,
implemented, and signed off: P5-1 and P5-2 are ACCEPTED/CLOSED and P5 is
formally CLOSED (2026-08-12); `phase-03/tests/` contains the 10 files listed in
§35.2.

No `DECISIONS.md` entry was added for §35: every gap resolved here is either
already authorized by an existing contract (frozen Phase 2 §16; Phase 3 §4/§5;
frozen test conventions) or is a definition detail recorded in this section.
The §35.4 fixture rationale was not disputed (the owner approved P5), so no
formal decision was required.

---

*This document is descriptive. Nothing in it changes the frozen Phase 1 or
Phase 2 specifications, their public APIs, or their behavior.*
