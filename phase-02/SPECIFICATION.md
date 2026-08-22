# ISSU — Phase 2: Specification

**Phase:** 2 — ToolRuntime (deterministic read-only filesystem task execution)
**Status:** AUTHORITATIVE — accepted Phase 2 specification, formalized at P0
**Blueprint:** `../BLUEPRINT.md` (v0.1)
**Phase 1:** `../phase-01-foundation/` (frozen; consumed only through its public barrel)
**License:** Apache License 2.0

This document formalizes the accepted Phase 2 specification that was
established and owner-reviewed before TASKS generation, including all subsequent
specification clarifications. It is the **authoritative** Phase 2 specification.
It is normative.

> Where this specification conflicts with any other Phase 2 document
> (`README.md`, `TASKS.md`, or future `ARCHITECTURE.md`/`DECISIONS.md`), this
> specification SHALL prevail.

Normative language: **SHALL / SHALL NOT** state absolute requirements;
**MUST / MUST NOT** state absolute constraints on behavior or data; **MAY**
states permitted options. Every requirement in this specification is mandatory
for Phase 2 unless marked otherwise.

---

## 1. Phase Objective

> Establish the deterministic, read-only filesystem task-execution capability
> (the **ToolRuntime**) on top of the Phase 1 foundation.

Phase 2 SHALL deliver:

1. A **nine-state deterministic task machine** with explicitly defined legal
   transitions and terminal closure.
2. A **read-only filesystem capability** exposing exactly two operations:
   `readFile` and `listDirectory`.
3. A **deny-by-default authorization and containment** boundary built on the
   Phase 1 `assertContained`/`isContained` primitives.
4. A **model-independent `DecisionProvider` contract** with exactly two
   obligations: `selectAction` and `assess`.
5. **Bounded correction / verification / retry semantics** with deterministic
   correction ownership (`RETRY` → `ADVANCE` → `EXHAUST`).
6. **Structured observability** with secret/content redaction.
7. A **complete public API** (barrel) and a **Phase 1 integration** through the
   approved D3 LINK mechanism.

---

## 2. Scope

### 2.1 Responsibility

Phase 2's responsibility is the **ToolRuntime**: a deterministic task runner
over a read-only filesystem, driven by the frozen nine-state machine. Its sole
capability is reading files and listing directories. (SHALL)

### 2.2 Phase Boundary

* Phase 2 SHALL be a distinct package under `phase-02/`, independent of Phase
  1's internals (BLUEPRINT §10).
* Phase 2 SHALL depend on Phase 1 only through the approved public barrel via
  the D3 LINK mechanism (§18).
* Phase 2 SHALL NOT consume Phase 1 `tests/`, `examples/`, internal module
  files, or toolchain configuration.
* Phase 2's responsibility SHALL remain distinct from Phase 1 (engineering
  substrate) and from any later phase (write-capable tooling, execute tooling,
  Git, network, memory, generalized planning). (SHALL NOT)

### 2.3 Scope Envelope

Phase 2 SHALL implement only what this specification defines. Any capability
not defined here SHALL be treated as out of scope. In particular, the full
non-goal list in §19 is normative and MUST NOT be violated.

---

## 3. Frozen Architecture

### 3.1 Frozen Status

The Phase 2 architecture described in this section is **FROZEN**. Any change to
it SHALL require a `DECISIONS.md` entry before implementation and SHALL be
treated as a breaking change to the public contract (§17). (SHALL)

### 3.2 Architectural Components

Phase 2 SHALL be composed of exactly these architectural components, with no
additional components invented:

| Component | Obligation | Source of nondeterminism? |
| --- | --- | --- |
| **TaskMachine** | Drives the nine-state machine (§5); deterministic control flow; performs available-action derivation (§4.3), classification handling (§13.3), correction direction (§6), and verification (§6.4). | No |
| **ToolRuntime** | The **exclusive** `EXECUTING` dispatch seam (§9). Executes the two authorized filesystem operations (§10) and returns `ToolResult`. | No |
| **DecisionProvider** | Injected interface (§7) with exactly two obligations: `selectAction` and `assess`. The **only** component permitted to involve a model. | Yes (bounded to its two methods) |
| **Filesystem capability** | `readFile` and `listDirectory` (§10), read-only, deny-by-default. | No |
| **Correction/Verification engine** | Deterministic correction direction and verification (§6). | No |

### 3.3 Deterministic Execution

* The TaskMachine SHALL be deterministic: given identical `TaskOptions`,
  identical `DecisionProvider` decisions, and an identical filesystem state, the
  machine SHALL produce an identical transition sequence and an identical
  terminal state.
* Nondeterminism SHALL be confined to the `DecisionProvider`'s `selectAction`
  and `assess` methods. No other component SHALL consult a model, a clock,
  randomness, or process identity in its control flow.
* The TaskMachine SHALL NOT skip, reorder, or invent transitions. Only the legal
  transitions in §5.2 MAY be taken.
* The TaskMachine SHALL NOT make planning decisions, correction decisions, or
  goal judgments; those are deterministic (§4, §6) or delegated to
  `DecisionProvider` (§7).

### 3.4 No New Architecture

This specification does not introduce, and Phase 2 SHALL NOT implement, any
architecture beyond §3.2: no memory subsystem, no generalized planning engine,
no plugin framework, no model routing, no multi-agent system, no write/execute
tooling.

---

## 4. Task / Plan Model

### 4.1 Task Definition

A **task run** SHALL be created from a single `TaskOptions` value (§17):

* an authorized `root` (absolute, canonical path);
* a fixed set of `refs` — the files to read and directories to list;
* bounded resource limits (`bounds`, §12);
* an optional default `includeHidden` and an advisory `objective`.

### 4.2 Fixed Plan — No Generalized Planning

* The plan (the set of `refs`) SHALL be **fixed input**. Phase 2 SHALL NOT
  generate, extend, shrink, or re-plan the refs at runtime. (SHALL NOT)
* Phase 2 SHALL NOT contain or expose a generalized planning engine. The
  `objective` is advisory (human-readable) and SHALL NEVER be used to derive
  new refs or new actions.
* The DecisionProvider SHALL NOT add new refs or modify the plan.

### 4.3 Available-Action Derivation

* Phase 2 SHALL derive the set of **available actions** deterministically from
  the current `TaskState` and `TaskOptions`.
* An action is available if and only if ALL of the following hold (SHALL):
  1. its `ActionRef.operation` is one of the two operations (§8);
  2. its target is a member of `TaskOptions.refs` and has not yet been
     satisfied (successfully completed) for this run;
  3. its target passes authorization and containment (§11) — a target that
     would be denied SHALL NOT be offered as available;
  4. its invocation would not exceed the resource bounds (§12).
* The available-action set SHALL be computed by a pure, deterministic function
  (`deriveAvailableActions`, §17). The `DecisionProvider` SHALL NOT derive the
  set itself and SHALL select only from the provided set. (§7)

---

## 5. State Machine and Transition Contract

### 5.1 States (FROZEN)

The nine-state machine is **frozen**. Phase 2 SHALL implement exactly these
states, no more and no fewer:

```text
READY, SELECTING, EXECUTING, EVALUATING, CORRECTING,
VERIFYING, COMPLETED, FAILED, CANCELLED
```

### 5.2 Legal Transitions (normative)

The following transitions SHALL be the only legal transitions. Any other
transition SHALL be an internal error (`internalError`):

| # | From | To | Condition / reason |
| --- | --- | --- | --- |
| 1 | READY | SELECTING | Run begins. Every run SHALL start in `READY`. |
| 2 | SELECTING | EXECUTING | An available action was selected (via `selectAction`). |
| 3 | SELECTING | VERIFYING | The available-action set is empty; nothing left to execute. |
| 4 | SELECTING | CANCELLED | Cancellation requested (§5.4). |
| 5 | EXECUTING | EVALUATING | `ToolRuntime.execute` returned a `ToolResult`. |
| 6 | EXECUTING | CANCELLED | Cancellation requested (§5.4). |
| 7 | EVALUATING | VERIFYING | Assessment classification is `success`. |
| 8 | EVALUATING | CORRECTING | Assessment classification is a failure and a correction decision is required (§13.3). |
| 9 | EVALUATING | FAILED | Assessment classification is fatal (`invalidInput`, `internalError`) or correction is already exhausted. |
| 10 | EVALUATING | CANCELLED | Cancellation requested (§5.4). |
| 11 | CORRECTING | EXECUTING | Correction direction is `RETRY` — re-dispatch the same `ActionRef` (§6.3). |
| 12 | CORRECTING | VERIFYING | Correction direction is `ADVANCE` (§6.3). |
| 13 | CORRECTING | FAILED | Correction direction is `EXHAUST` (§6.3). |
| 14 | CORRECTING | CANCELLED | Cancellation requested (§5.4). |
| 15 | VERIFYING | COMPLETED | Verification passed (§6.4). |
| 16 | VERIFYING | SELECTING | Verification not passed; available actions remain and the verification bound is not exhausted (§6.4). |
| 17 | VERIFYING | FAILED | Verification not passed and (a) the verification bound is exhausted or (b) no available actions remain. |
| 18 | VERIFYING | CANCELLED | Cancellation requested (§5.4). |

### 5.3 Terminal Closure

* The terminal states are **`COMPLETED`, `FAILED`, `CANCELLED`**. (SHALL)
* A terminal state SHALL have no outgoing transitions. Once a run enters a
  terminal state, the machine SHALL NOT transition again, SHALL NOT execute any
  further action, and SHALL NOT consult the `DecisionProvider` again. (SHALL)
* Every run SHALL end in a terminal state. `runTask` SHALL settle with a
  `TaskResult` whose `state.status` is terminal. (SHALL)
* `CANCELLED` SHALL be a terminal closure of its own; a cancelled run SHALL NOT
  be re-classified as `COMPLETED` or `FAILED`. (SHALL)

### 5.4 Cancellation

* Cancellation SHALL be requested externally via an optional `AbortSignal`
  (§17). (SHALL)
* When cancellation is observed, the machine SHALL transition to `CANCELLED` at
  the next legal point from any non-terminal state (transitions 4, 6, 10, 14,
  18).
* If the signal is already aborted when the run begins, the run SHALL end in
  `CANCELLED` without executing anything. (SHALL)
* After cancellation is observed, no new action SHALL be executed. (SHALL)

### 5.5 Deterministic Execution Guarantee

The machine SHALL be deterministic (§3.3). Duration and ordering of executions
MAY vary, but the sequence of states, decisions, and classifications SHALL be
deterministic given identical inputs.

---

## 6. Correction and Verification Semantics

### 6.1 Correction Ownership (FROZEN)

Correction direction SHALL be deterministic loop logic owned by the TaskMachine.
The `DecisionProvider` SHALL NEVER control, suggest, or encode correction
direction. (SHALL / SHALL NOT — see §7)

### 6.2 Correction Direction Ordering

The deterministic correction ordering SHALL be:

```text
RETRY → ADVANCE → EXHAUST
```

A single deterministic decision SHALL select the first applicable direction:

| Direction | When it applies (normative) |
| --- | --- |
| `RETRY` | The failure classification is retryable AND the per-action retry bound is not exhausted. Retryable classifications SHALL be exactly `executionError` (§13.3). |
| `ADVANCE` | The failure classification is non-retryable but non-fatal (§13.3) AND the per-run correction bound is not exhausted. The outcome is acknowledged and the run proceeds. |
| `EXHAUST` | No other direction applies: the retry bound is exhausted, or the correction bound is exhausted, or the classification is fatal (`invalidInput`, `internalError`). |

### 6.3 Correction Effects

* `RETRY` SHALL re-dispatch the **same** `ActionRef` through `EXECUTING`
  (transition 11). A retry SHALL NOT ask the `DecisionProvider` to re-select the
  action. (SHALL)
* `ADVANCE` SHALL transition to `VERIFYING` (transition 12). (SHALL)
* `EXHAUST` SHALL transition to `FAILED` (transition 13). (SHALL)
* Every entry into `CORRECTING` SHALL consume one unit of the per-run correction
  bound; exceeding it SHALL force `EXHAUST`. (SHALL)

### 6.4 Verification Semantics

* `VERIFYING` SHALL be a **deterministic** goal check performed by the
  TaskMachine. It SHALL NOT consult the `DecisionProvider`. (SHALL)
* The verification predicate: the run SHALL be considered **verified** if and
  only if every file ref has a `success` classification and every directory ref
  has a `success` classification. (SHALL)
* Verification SHALL be bounded by the per-run verification bound. Each entry
  into `VERIFYING` SHALL consume one unit; exceeding the bound SHALL force
  `FAILED`. (SHALL)
* On verified → `COMPLETED` (transition 15). (SHALL)
* On not verified: if available actions remain and the verification bound is not
  exhausted → `SELECTING` (transition 16); otherwise → `FAILED` (transition 17).
  (SHALL)

### 6.5 Bounded Semantics Summary

* `maxRetries` — per-`ActionRef` retry bound (§12). `RETRY` SHALL NOT be taken
  more than `maxRetries` times for the same `ActionRef` in one run.
* `maxCorrections` — per-run correction bound (§12). `CORRECTING` SHALL be
  entered at most `maxCorrections` times per run.
* `maxVerifications` — per-run verification bound (§12). `VERIFYING` SHALL be
  entered at most `maxVerifications` times per run.
* All three bounds SHALL be finite and > 0, and SHALL be enforced
  deterministically.

---

## 7. DecisionProvider Contract

### 7.1 Role and Model Independence

* The `DecisionProvider` is an **injected interface** (§17) supplied by the
  caller. It is the ONLY Phase 2 component permitted to involve a model.
* Phase 2 SHALL NOT import, call, or depend on any LLM/model provider, model
  SDK, or model API. (SHALL NOT)
* Phase 2 SHALL make no assumption about how a `DecisionProvider` selects or
  assesses; it SHALL depend only on the interface. A provider that never
  consults a model SHALL be fully supported. (SHALL)

### 7.2 Obligations (exactly two)

The `DecisionProvider` SHALL have exactly two obligations, no more, no less:

1. **`selectAction(available, state) → ActionRef`** — choose the next action to
   execute.
   * SHALL return an `ActionRef` drawn from the provided `available` set. (SHALL)
   * SHALL NOT derive the available set itself (that is deterministic, §4.3).
     (SHALL NOT)
   * SHALL NOT add new refs or modify the plan. (SHALL NOT)
2. **`assess(result, state) → Assessment`** — classify the outcome of an
   executed action.
   * SHALL return a neutral `OutcomeClass` classification (§13.2). (SHALL)
   * SHALL NOT return a correction direction, retry/advance/exhaust instruction,
     or any control-flow instruction. (SHALL NOT)

### 7.3 Correction-Direction Prohibition

* The `DecisionProvider` MUST NOT encode correction direction. (MUST NOT)
* Its `assess` output SHALL be a classification only; the mapping from
  classification to `RETRY` / `ADVANCE` / `EXHAUST` SHALL be the TaskMachine's
  deterministic logic (§6.2). (SHALL)
* Phase 2 SHALL reject (treat as `internalError`) any provider that attempts to
  return control-flow directives, because doing so would violate the frozen
  architecture. (SHALL)

---

## 8. ActionRef

* An `ActionRef` SHALL identify exactly one of the two filesystem operations and
  bind it to a target path and options (§17).
* The two operations SHALL be exactly `readFile` and `listDirectory`. No other
  operation SHALL be expressible or executable. (SHALL)
* `ActionRef` fields (normative):
  * `operation` — `'readFile' | 'listDirectory'`;
  * `target` — the absolute target path; SHALL resolve inside the authorized
    root (§11);
  * `read` — `ReadOptions`, present if and only if `operation === 'readFile'`;
  * `list` — `ListOptions`, present if and only if
    `operation === 'listDirectory'`.
* An `ActionRef` with a mismatched or absent options field, an unknown
  `operation`, or an invalid `target` SHALL be classified `invalidInput`
  (§13.2). (SHALL)

---

## 9. ToolRuntime

### 9.1 Exclusive Dispatch Seam

* `ToolRuntime` SHALL be the **exclusive** `EXECUTING` dispatch seam. (SHALL)
* In `EXECUTING`, the TaskMachine SHALL dispatch the selected `ActionRef` to
  `ToolRuntime.execute` and SHALL NOT execute filesystem operations by any other
  means. (SHALL)
* No other component SHALL execute filesystem operations. (SHALL NOT)

### 9.2 ToolRuntime Obligations

`ToolRuntime.execute(ref)` SHALL:

1. enforce deny-by-default authorization and containment (§11);
2. enforce resource bounds (§12);
3. perform strict UTF-8 validation for `readFile` (§10.2);
4. produce a complete `ToolResult` with a classification (§13.2);
5. never modify the filesystem (§14);
6. never consult the `DecisionProvider` and never make planning or correction
   decisions (§3.3).

The `ToolRuntime` SHALL be deterministic: identical `ActionRef` + identical
filesystem state ⇒ identical `ToolResult` (filesystem state is the only
external input). (SHALL)

---

## 10. Filesystem Capability

### 10.1 Operations (exactly two)

Phase 2 SHALL expose exactly two filesystem operations:

| Operation | Returns | Behavior |
| --- | --- | --- |
| `readFile` | `FileContent` | Read the file's text under bounded/chunked and strict-UTF-8 rules (§10.2). |
| `listDirectory` | `DirectoryListing` | List directory entries with unambiguous `includeHidden` behavior (§10.3). |

No other operation SHALL be implemented. In particular, Phase 2 SHALL NOT
implement any create, write, edit, delete, rename, move, execute, permission, or
metadata-mutation operation. (SHALL NOT)

### 10.2 `readFile` — Bounded/Chunked, Strict UTF-8

* `readFile` SHALL read a file in bounded chunks: each read SHALL not exceed
  `bounds.chunkSize` bytes, and the total SHALL not exceed
  `bounds.maxBytesPerRead`. (SHALL)
* If the file's content exceeds `bounds.maxBytesPerRead`, the read SHALL stop at
  the bound and SHALL be classified `tooLarge`. It MUST NOT silently truncate
  and return `success`. (SHALL / MUST NOT)
* `readFile` SHALL validate that the assembled content is **strictly valid
  UTF-8**. (SHALL)
* Invalid UTF-8 SHALL be classified `invalidContent`; no malformed byte SHALL be
  substituted, replaced, or silently accepted. (SHALL)
* A multi-byte UTF-8 sequence MAY straddle a chunk boundary; that SHALL NOT by
  itself cause `invalidContent`. Validation SHALL be performed on the assembled
  content. (SHALL)

### 10.3 `listDirectory` — Unambiguous `includeHidden`

The `includeHidden` behavior SHALL be unambiguous and platform-independent:

* A directory entry is **hidden** if and only if its basename begins with `"."`
  (U+002E). (SHALL)
* `.` and `..` SHALL NEVER be returned as entries. (SHALL)
* `includeHidden` defaults to `false`:
  * `false` (default) — hidden entries SHALL be omitted.
  * `true` — hidden entries SHALL be included.
* The behavior SHALL be identical across platforms and filesystems; the result
  of listing the same directory with the same `includeHidden` value SHALL be
  deterministic. (SHALL)

---

## 11. Filesystem Security / Containment

### 11.1 Deny-by-Default Authorization

* Filesystem access SHALL be **deny-by-default**. (SHALL)
* An action SHALL be authorized if and only if BOTH hold:
  1. its `target` is a member of the run's `refs` (explicitly requested work);
  2. its resolved path is contained within the authorized `root` (§11.2).
* Any target that fails authorization SHALL be refused with classification
  `accessDenied`; no path SHALL be accessed implicitly or by default. (SHALL)

### 11.2 Containment (Phase 1 `assertContained` / `isContained`)

* Phase 2 SHALL enforce containment using the Phase 1 primitives
  `assertContained` and `isContained`, consumed only through the approved public
  barrel (§18). (SHALL)
* Before ANY read or list, the target's **resolved** path SHALL be contained
  within the authorized `root`. Resolution SHALL follow symbolic links so that a
  symlink escaping the root SHALL be refused (`accessDenied`). (SHALL)
* Path-traversal inputs (e.g., `..`) that escape the root SHALL be refused. No
  path SHALL be normalized into the root against its own intent. (SHALL)

### 11.3 Read-Only Enforcement

* The capability is read-only by construction (§10.1, §14). Authorization SHALL
  grant read access only; it SHALL NEVER grant mutation. (SHALL)

---

## 12. Resource Bounds

The following bounds SHALL be finite, positive, and enforced deterministically:

| Bound | Scope | Enforcement |
| --- | --- | --- |
| `maxBytesPerRead` | per `readFile` | Total bytes read for one file SHALL NOT exceed this. Exceeding → `tooLarge` (§10.2). |
| `chunkSize` | per read chunk | Each chunk SHALL NOT exceed this. (`chunkSize ≤ maxBytesPerRead`) |
| `maxRetries` | per `ActionRef` | `RETRY` SHALL NOT exceed this for the same `ActionRef` in one run (§6.5). |
| `maxCorrections` | per run | `CORRECTING` SHALL NOT be entered more than this (§6.5). |
| `maxVerifications` | per run | `VERIFYING` SHALL NOT be entered more than this (§6.5). |

Defaults are normative constants defined by Phase 2 and documented in its
`README`/`DECISIONS`; the values SHALL NOT change the semantics defined in this
specification.

---

## 13. Failure Model

### 13.1 Error-Code Namespace

Phase 2 error codes SHALL live exclusively under the Phase 1-reserved
`issue.tool.*` namespace (Phase 1 `SPECIFICATION.md` §6.3). Phase 2 SHALL NOT
allocate codes under any other `issue.*` namespace, and SHALL NOT reuse Phase 1
codes. (SHALL / SHALL NOT)

### 13.2 Complete Outcome Classifications (FROZEN)

The complete set of outcome classifications is exactly:

| `OutcomeClass` | Error code (`issue.tool.*`) | Meaning |
| --- | --- | --- |
| `success` | — | The operation produced a valid result. |
| `invalidContent` | `issue.tool.read.invalidcontent` | `readFile` bytes are not strictly valid UTF-8. |
| `notFound` | `issue.tool.read.notfound` / `issue.tool.list.notfound` | The target path does not exist. |
| `accessDenied` | `issue.tool.accessdenied` | Target outside the root or not explicitly authorized (deny-by-default). |
| `tooLarge` | `issue.tool.read.toolarge` | File content exceeds `maxBytesPerRead`. |
| `invalidInput` | `issue.tool.invalid` | Malformed `ActionRef`/options. |
| `executionError` | `issue.tool.execution` | Unexpected, possibly transient filesystem error during execution. |
| `internalError` | `issue.tool.internal` | Engine invariant violation (unexpected). |

No other classification SHALL be produced. (SHALL)

### 13.3 Classification → Correction Mapping (deterministic)

| `OutcomeClass` | Correction handling (normative) |
| --- | --- |
| `success` | → `VERIFYING` (transition 7). |
| `executionError` | Retryable → `RETRY` while retries remain; otherwise `EXHAUST`. |
| `invalidContent` / `notFound` / `accessDenied` / `tooLarge` | Non-retryable, non-fatal → `ADVANCE` (while corrections remain); otherwise `EXHAUST`. |
| `invalidInput` / `internalError` | Fatal → `EXHAUST` (→ `FAILED`) with no retry and no advance. |

The mapping SHALL be implemented in the TaskMachine; the `DecisionProvider`
SHALL NOT influence it (§6.1, §7.3). (SHALL / SHALL NOT)

### 13.4 Result and Error Content Rules

* A `ToolResult.error.code` SHALL be an `issue.tool.*` code. (SHALL)
* A `ToolResult.error.message` SHALL be actionable and SHALL NOT embed file
  content, file contents of failed reads, or secret values (§15). (SHALL NOT)
* Failures SHALL be representable as Phase 1 `AppError`-compatible data via the
  public barrel when surfaced to consumers. (SHALL)

---

## 14. Read-only Guarantee

* Phase 2 SHALL NOT create, write, edit, delete, rename, move, or modify any
  file or directory. (SHALL NOT)
* Phase 2 SHALL NOT execute any program or command. (SHALL NOT)
* Phase 2 SHALL NOT change permissions, ownership, or timestamps. (SHALL NOT)
* Access-time updates performed by the operating system as a side effect of a
  read are not initiated by Phase 2 and do not constitute a violation. (SHALL)
* The read-only guarantee SHALL be verified deterministically (validation
  scenario V14, §16): after any run, the filesystem SHALL be byte-for-byte
  unchanged. (SHALL)

---

## 15. Observability

### 15.1 Structured Records

Phase 2 SHALL emit structured observability records for the following events
(SHALL):

| Event | Structured fields (normative) |
| --- | --- |
| State transition | `from`, `to`, `reason`/`decision`, `runId` |
| Action selection | `action.operation`, `action.target` (path, not content) |
| Tool execution | `action`, `ok`, `classification`, `bytesRead`, `durationMs` |
| Assessment | `classification` |
| Correction decision | `direction` (`RETRY`/`ADVANCE`/`EXHAUST`), `retries`, `corrections` |
| Bound exhaustion | `kind` (`retry`/`correction`/`verification`/`bytes`) |
| Run completion | terminal `status`, final attempts counters |

* Records SHALL be structured (key/value), not free-form strings. (SHALL)
* Records SHALL be emitted through the Phase 1 `Logger` contract
  (`createLogger`/`Logger`) consumed via the public barrel (§18); the logging
  implementation remains Phase 2's choice but the emitted shape SHALL satisfy
  the Phase 1 contract. (SHALL)

### 15.2 Secret and Content Redaction

* Raw file **content** SHALL NEVER be logged, including the content of failed
  reads. (SHALL NOT)
* Logged paths MAY appear, but the file bytes and directory entry bodies SHALL
  NOT. (SHALL NOT)
* Secret values and secret-named values SHALL NEVER appear in logs or in error
  messages. (SHALL NOT)
* Phase 2 SHALL register content/secret redaction using the Phase 1 redaction
  primitives (`redactionList`, `Logger` redaction) via the public barrel. (SHALL)
* A redaction failure is a release blocker. (SHALL)

---

## 16. Deterministic Validation Scenarios

The following scenarios SHALL be deterministic (no model involvement) and SHALL
be covered by Phase 2's own test suite at P5. They are normative acceptance
inputs.

| # | Scenario | Expected deterministic result |
| --- | --- | --- |
| V1 | All refs succeed (valid file, existing dir). | Run ends `COMPLETED`. |
| V2 | Read a nonexistent file. | `notFound`; run ends `FAILED` (goal unsatisfiable). |
| V3 | Read a file containing invalid UTF-8. | `invalidContent`; never returned as text; run ends `FAILED`. |
| V4 | List a directory that does not exist. | `notFound`; run ends `FAILED`. |
| V5 | Target outside the authorized root. | `accessDenied`; never executed; run ends `FAILED`. |
| V6 | Symlink escaping the root. | `accessDenied` (resolved path refused). |
| V7 | Hidden entries. | Excluded by default; included with `includeHidden: true`; identical on repeat. |
| V8 | File larger than `maxBytesPerRead`. | `tooLarge`; no truncated-success result. |
| V9 | Transient `executionError`. | `RETRY` exactly up to `maxRetries`; persistent failure → `EXHAUST` → `FAILED`. |
| V10 | Retry bound respected. | Same `ActionRef` retried at most `maxRetries` times. |
| V11 | Correction bound respected. | `CORRECTING` entered at most `maxCorrections` times. |
| V12 | Verification bound respected. | `VERIFYING` entered at most `maxVerifications` times. |
| V13 | Cancellation during `EXECUTING`. | Run ends `CANCELLED`; no further actions execute. |
| V14 | Read-only guarantee. | After any run, the filesystem is unchanged. |
| V15 | Terminal closure. | `COMPLETED`/`FAILED`/`CANCELLED` emit no further transitions. |
| V16 | Determinism. | Identical inputs ⇒ identical transition sequence and terminal state. |
| V17 | Available-action derivation. | Only authorized, pending refs are offered as available. |
| V18 | Redaction. | No secret value or file content appears in any log or error output. |

---

## 17. Public API

### 17.1 Barrel

* Phase 2's public interface SHALL be its package barrel (`src/index.ts` →
  `dist/index.js`, `dist/index.d.ts`). (SHALL)
* The barrel SHALL export exactly the surface defined in this section and SHALL
  NOT export internal modules. (SHALL / SHALL NOT)
* The surface below is **frozen at phase end**; changes SHALL require a
  `DECISIONS` entry (§20.2). (SHALL)

### 17.2 Type and Function Definitions (normative)

```ts
// States — FROZEN nine-state machine (§5.1)
export type TaskStatus =
  | 'READY'
  | 'SELECTING'
  | 'EXECUTING'
  | 'EVALUATING'
  | 'CORRECTING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

// The two filesystem operations — the ONLY operations Phase 2 may execute (§8, §10.1)
export type ToolOperation = 'readFile' | 'listDirectory';

// §8
export interface ActionRef {
  readonly operation: ToolOperation;
  readonly target: string;              // absolute path; MUST resolve inside the authorized root
  readonly read?: ReadOptions;          // present iff operation === 'readFile'
  readonly list?: ListOptions;          // present iff operation === 'listDirectory'
}

// §10.2
export interface ReadOptions {
  readonly maxBytes?: number;           // total cap for this read; default = bounds.maxBytesPerRead
  readonly chunkSize?: number;          // chunk size; default = bounds.chunkSize
}

// §10.3
export interface ListOptions {
  readonly includeHidden?: boolean;     // default false
}

// §13.2 — complete, frozen classification set
export type OutcomeClass =
  | 'success'
  | 'invalidContent'
  | 'notFound'
  | 'accessDenied'
  | 'tooLarge'
  | 'invalidInput'
  | 'executionError'
  | 'internalError';

// §6.2 — deterministic correction direction; NEVER produced by DecisionProvider
export type CorrectionDirection = 'RETRY' | 'ADVANCE' | 'EXHAUST';

export interface FileContent {
  readonly text: string;                // strictly valid UTF-8; never contains invalid bytes
  readonly bytesRead: number;
}

export interface DirectoryEntry {
  readonly name: string;
  readonly isDirectory: boolean;
  readonly isHidden: boolean;
}

export interface DirectoryListing {
  readonly entries: readonly DirectoryEntry[];
}

export interface ToolResult {
  readonly ok: boolean;
  readonly action: ActionRef;
  readonly classification: OutcomeClass;
  readonly data?: FileContent | DirectoryListing;   // present iff ok
  readonly error?: { readonly code: string; readonly message: string }; // code = issue.tool.*; message never embeds content/secrets
  readonly bytesRead?: number;
}

export interface TaskRefs {
  readonly files: readonly string[];
  readonly directories: readonly string[];
}

// §12
export interface ResourceBounds {
  readonly maxRetries: number;          // per-ActionRef, ≥ 1
  readonly maxCorrections: number;      // per-run, ≥ 1
  readonly maxVerifications: number;    // per-run, ≥ 1
  readonly maxBytesPerRead: number;     // per-read, > 0
  readonly chunkSize: number;           // > 0 and ≤ maxBytesPerRead
}

// §4
export interface TaskOptions {
  readonly root: string;                // authorized root; absolute canonical path
  readonly objective?: string;          // advisory; never used to derive actions
  readonly refs: TaskRefs;              // fixed plan — the ONLY work items
  readonly includeHidden?: boolean;     // default for listDirectory
  readonly bounds: ResourceBounds;
}

// §5.1
export interface TaskState {
  readonly status: TaskStatus;
  readonly attempts: {
    readonly retries: number;
    readonly corrections: number;
    readonly verifications: number;
  };
  readonly completed: { readonly files: readonly string[]; readonly directories: readonly string[] };
  readonly lastAction?: ActionRef;
  readonly lastResult?: ToolResult;
  readonly lastCorrection?: CorrectionDirection;
}

export interface AvailableAction {
  readonly ref: ActionRef;
}

// §7 — the ONLY model-permitted contract; Phase 2 never talks to a model itself
export interface DecisionProvider {
  selectAction(available: readonly AvailableAction[], state: TaskState): Promise<ActionRef>;
  assess(result: ToolResult, state: TaskState): Promise<Assessment>;
}

export interface Assessment {
  readonly classification: OutcomeClass; // neutral classification only; never a control-flow directive
}

export interface TaskResult {
  readonly state: TaskState;             // final state; status SHALL be terminal
}

// §9 — exclusive EXECUTING dispatch seam
export interface ToolRuntime {
  execute(ref: ActionRef): Promise<ToolResult>;
}

// Public functions
// Drives the frozen nine-state machine deterministically; dispatches exclusively
// through an internal ToolRuntime; consults the provider only at SELECTING/EVALUATING.
export function runTask(
  options: TaskOptions,
  provider: DecisionProvider,
  opts?: { signal?: AbortSignal }
): Promise<TaskResult>;

// Constructs the Phase 2 ToolRuntime bound to the authorized root and bounds.
export function createToolRuntime(options: {
  root: string;
  bounds: ResourceBounds;
}): ToolRuntime;

// §4.3 — pure, deterministic available-action derivation.
export function deriveAvailableActions(
  state: TaskState,
  options: TaskOptions
): AvailableAction[];
```

### 17.3 Contract Rules

* Every public function and type in §17.2 SHALL have at least one test at P5.
  (SHALL)
* Internal modules (e.g., the state machine driver, the runtime implementation)
  are private and SHALL never be imported by consumers. (SHALL NOT)
* `deriveAvailableActions` SHALL be pure (no I/O, no model, no state mutation).
  (SHALL)
* `runTask` SHALL NOT be re-entrant per run; each invocation SHALL run one
  isolated task. No state SHALL persist between runs (no memory, §19). (SHALL)

---

## 18. Phase 1 Integration / D3

### 18.1 D3 — Approved LINK Mechanism

* D3 remains the **approved** integration mechanism: Phase 2 consumes Phase 1
  through a **reproducible local path dependency**: (SHALL)

```json
"@issue/foundation": "file:../phase-01-foundation"
```

* Recorded in `phase-01-foundation/DECISIONS.md` → D3 resolution (2026-08-09).
* Global `npm link` is an optional developer convenience only, never the
  canonical mechanism. (SHALL NOT be the canonical mechanism)
* D3 MAY be revisited only if a future phase creates a genuine need for a
  workspace or published distribution, and only via a documented DECISIONS
  entry. (SHALL NOT be revisited silently)

### 18.2 Barrel-Only Consumption

* Phase 2 SHALL import Phase 1 exclusively through the package name
  (`import { ... } from "@issue/foundation"`). (SHALL)
* Deep imports (`@issue/foundation/dist/...` or internal module paths) SHALL NOT
  be used; Phase 1's `exports` map exposes only `.`, which blocks them at the
  resolver. (SHALL NOT)
* Phase 2 SHALL NOT import Phase 1 `tests/`, `examples/`, or toolchain
  configuration. (SHALL NOT)

### 18.3 Consumed Phase 1 Surface

Phase 2 SHALL consume, through the barrel, at minimum:

* `assertContained`, `isContained` — containment enforcement (§11.2);
* the `Logger` contract and `createLogger` — observability (§15.1);
* the redaction primitives (`redactionList`, Logger redaction) — redaction
  (§15.2);
* `Result` / `AppError`-compatible data — failure surfacing (§13.4).

Phase 2 SHALL consume nothing outside the frozen §2 surface of Phase 1. (SHALL)

---

## 19. Non-Goals (Phase 2 SHALL NOT)

The following SHALL NOT be implemented, depended upon, or introduced by
Phase 2:

1. **No LLM/model dependency** — no model provider, model SDK, model routing,
   or model API call. The `DecisionProvider` is injected; Phase 2 never talks to
   a model. (SHALL NOT)
2. **No memory** — no memory subsystem, no persistence, no cross-run context.
   (SHALL NOT)
3. **No write/edit/delete** — no file or directory mutation of any kind (§14).
   (SHALL NOT)
4. **No execute** — no command, process, terminal, or child-process execution.
   (SHALL NOT)
5. **No Git / VCS** — no Git or other version-control operations. (SHALL NOT)
6. **No network / web / browser** — no network access, HTTP, web research, or
   browser. (SHALL NOT)
7. **No codegen** — no code generation, code modification, or code
   understanding. (SHALL NOT)
8. **No plugin framework** — no dynamic module loading or plugin registry.
   (SHALL NOT)
9. **No generalized planning** — the plan is fixed input (§4.2); no autonomous
   planning engine. (SHALL NOT)
10. **No multi-agent systems** and no agent roles. (SHALL NOT)
11. **No config schemas** for `models`, `tools` (general), `permissions`,
    `memory`, or `agent` (Phase 1-reserved namespaces); Phase 2 introduces no
    permission/policy framework beyond deny-by-default containment and bounds.
    (SHALL NOT)
12. **No distribution/publishing** — `private: true`; no registry publication.
    (SHALL NOT)
13. **No deployment/daemons/services.** (SHALL NOT)
14. **No CLI expansion** — Phase 2 SHALL NOT extend the Phase 1 CLI or add its
    own `bin`; it is a library phase. (SHALL NOT)
15. **No performance benchmarking infrastructure** beyond the shared toolchain.
    (SHALL NOT)

*Any implementation under `phase-02/` that violates §19 fails the phase review.*

---

## 20. Versioning and Package Notes

### 20.1 Package

* Package name: `@issue/tool-runtime` — owner-authorized (2026-08-09) and
  recorded as Phase 2 decision D1 in `DECISIONS.md`. (SHALL)
* `version`: `0.1.0`; `private: true`; `type: module`; `license: Apache-2.0`.
  (SHALL)
* `engines.node`: `>=22.9.0` (mirrors Phase 1, DECISIONS §D14). (SHALL)
* Build output: `dist/index.js` + `dist/index.d.ts`; `exports` map exposes only
  `.` (mirrors Phase 1). (SHALL)
* Dependency: `"@issue/foundation": "file:../phase-01-foundation"` (D3, §18.1).
  (SHALL)
* Toolchain (tsc build, tsx dev, Vitest ≥ 80% coverage gate, ESLint 9 flat
  config, Prettier) mirrors Phase 1 as **conventions, not coupling**.
  (SHALL/MAY)
* Folder layout mirrors Phase 1: `src/`, `tests/`, `examples/`, plus the
  documentation set. (SHALL)

### 20.2 Versioning Policy

* SemVer per BLUEPRINT §22; Phase 2 starts at `0.1.0`. (SHALL)
* Pre-1.0: a breaking change to the §17 surface SHALL require a DECISIONS entry
  and a minor-version bump. Post-1.0: contract changes require a major bump.
  (SHALL)
* The nine-state machine (§5.1), the classification set (§13.2), and the
  correction ordering (§6.2) are **frozen**; changing them SHALL require a
  documented DECISIONS entry. (SHALL)

---

## 21. Specification Acceptance Criteria

This specification is accepted when ALL of the following hold:

1. Every normative requirement in §1–§20 is unambiguous and internally
   consistent.
2. It contains no contradiction with `BLUEPRINT.md` or the Phase 1 documents.
3. It introduces no architecture beyond the frozen components (§3.2).
4. It preserves the accepted specification's normative SHALL/MUST/SHALL NOT/MAY
   language without weakening, reinterpreting, or omitting any requirement.
5. D3 remains exactly `"@issue/foundation": "file:../phase-01-foundation"` and
   barrel-only consumption (§18).
6. Every `TASKS.md` milestone (P1–P7) maps to at least one specification
   section; the spec adds no milestone requirement that TASKS.md omits.
7. Every explicit non-goal in the accepted specification appears in §19 without
   weakening.
8. Phase 2 remains implementation-free: no `package.json`, `src/`, `tests/`,
   build configuration, or implementation code exists for Phase 2 at
   acceptance time.
9. All remaining deferred decisions are recorded in §22, not resolved
   silently.

---

## 22. Explicitly Deferred Decisions

The following SHALL remain deferred and SHALL NOT be resolved by Phase 2:

1. **CLI / end-user entry point** — wiring the ToolRuntime into the Phase 1 CLI
   or any user-facing command is deferred to a later integration phase. Phase 2
   is a library.
2. **Phase 2 configuration schema** — a config-file schema (e.g., extending
   `issue.config.json`) is deferred; bounds are passed via `TaskOptions` with
   normative defaults (§12).
3. **Write/execute/Git/network tooling** — deferred to future phases (§19).
4. **Model provider binding** — Phase 2 defines the `DecisionProvider`
   interface only; which model/provider satisfies it is a consumer decision,
   deferred and out of scope.
5. **Workspace/monorepo adoption** — D3 (local path dependency) remains the
   mechanism until a documented need arises (§18.1).
6. **Phase 2 `ARCHITECTURE.md` and the full `DECISIONS.md` draft** — authored
   at P6, when the implementation exists to document (§5 of `README.md`).
   `DECISIONS.md` is initiated at P0 with the owner-authorized package-name
   decision (D1).
7. **Concrete default values for resource bounds** — exact numbers are a
   Phase 2 implementation-time decision and SHALL be documented in Phase 2's
   DECISIONS.md; the semantics in §12 SHALL NOT change.

---

## 23. Consistency Checklist

At P0 and at P7, Phase 2 SHALL verify:

- [ ] `SPECIFICATION.md` ↔ `TASKS.md` — every milestone maps to a spec section;
      no spec requirement is milestone-less.
- [ ] `SPECIFICATION.md` ↔ `README.md` — package plan, documentation index, and
      integration record agree with the spec.
- [ ] `SPECIFICATION.md` ↔ approved D3 decision — D3 is exactly the `file:`
      dependency; barrel-only; no other mechanism.
- [ ] `SPECIFICATION.md` ↔ Phase 1 public boundary — only the frozen barrel is
      consumed; reserved namespaces respected; `issue.tool.*` is the only
      Phase 2 allocation.
