# ISSU — Phase 1: Specification

**Phase:** 1 — Foundation
**Status:** APPROVED (plan approved 2026-08-08)

This specification defines exactly what Phase 1 delivers, the contracts it
exposes, its non-goals, and how completion is judged. It is normative; the
documents in this folder agree with it.

---

## 1. Phase Objective

> Establish the professional engineering foundation required for future ISSU
> development.

Deliverable classes:

1. A working, tested, documented Node.js + TypeScript package.
2. Foundation primitives: configuration, environment/secrets, logging,
   error handling, `Result`, path containment, CLI shell.
3. A complete quality pipeline (build, lint, format, typecheck, tests, CI).
4. A documentation set that future phases can consume as contracts.

---

## 2. Public Contract (the phase's interface)

The public surface of Phase 1 is the package barrel `src/index.ts`. Future
phases import only from this surface. The surface exposes:

```ts
// Version
export const VERSION: string;

// Errors
export class AppError extends Error {
  readonly code: string;
  readonly recoverable: boolean;
  readonly details?: unknown;
  readonly cause?: unknown;
  constructor(params: AppErrorParams);
  toJSON(): AppErrorJson;
}
export function isAppError(value: unknown): value is AppError;
export function toError(value: unknown): Error;

// Result (expected-failure handling)
export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };
export function ok<T>(value: T): Result<T, never>;
export function err<E>(error: E): Result<never, E>;
export function isOk<T, E>(r: Result<T, E>): r is { ok: true; value: T };
export function isErr<T, E>(r: Result<T, E>): r is { ok: false; error: E };
export function match<T, E, A, B>(
  r: Result<T, E>,
  fns: { ok(v: T): A; err(e: E): B }
): A | B;

// Config
export interface IssueConfig { /* see §3 */ }
export type LoadConfigOptions = { cwd?: string; configPath?: string };
export function loadConfig(options?: LoadConfigOptions): Promise<Result<IssueConfig, AppError>>;
export function mergeConfigLayers(...layers: Partial<IssueConfig>[]): IssueConfig;

// Environment / secrets
export interface EnvSource { [name: string]: string | undefined }
export function readEnv(source?: EnvSource): EnvSnapshot;       // snapshot of ISSU_*
export function getSecret(name: string, source?: EnvSource): string | undefined;
export function redactionList(source?: EnvSource): string[];    // names+values to redact

// Logging
export interface Logger {
  trace(msg: string, ctx?: object): void;
  debug(msg: string, ctx?: object): void;
  info(msg: string, ctx?: object): void;
  warn(msg: string, ctx?: object): void;
  error(msg: string, ctx?: object): void;
  fatal(msg: string, ctx?: object): void;
  child(bindings: object): Logger;
}
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export function createLogger(options: { level?: LogLevel; redact?: string[] }): Logger;

// Path containment (security primitive)
export function assertContained(root: string, target: string): string; // returns normalized
export function isContained(root: string, target: string): boolean;

// CLI (invoked via bin `issue`, not part of the importable surface for consumers)
export function runCli(argv: string[]): Promise<number>; // returns process exit code
```

**Contract rules**

* This surface is versioned and **frozen** at phase end. Changes require a new
  DECISIONS entry and a major-version bump within the phase's versioning.
* Internal modules (`src/config/load.ts`, pino wiring, etc.) are private and
  must never be imported by consumers.
* `issue.*` is a reserved error-code namespace (see §6).

---

## 3. Configuration Strategy

### 3.1 Format

* A single optional developer-authored file: `issue.config.json` (JSONC —
  comments and trailing commas supported).
* Secrets are forbidden in the config file (validation error, see §4).

### 3.2 Precedence (low → high)

```text
built-in defaults < config file < ISSU_* env vars < CLI flags
```

Each layer must merge over the previous; no layer may silently drop a value.

### 3.3 Config file discovery

1. `--config <path>` flag, else
2. `ISSU_CONFIG` env var, else
3. `issue.config.json` in the current working directory, else
4. no file (defaults + env only).

### 3.4 Reserved top-level keys (Phase 1)

```ts
interface IssueConfig {
  logLevel: LogLevel;          // default 'info'
  logPretty: boolean;          // default false (JSON lines in non-TTY)
  redact: string[];            // additional redaction keys
}
```

* Typed via a `ConfigSchema` with validation on load; invalid values produce
  `issue.config.invalid` errors with actionable messages.
* The `issue` top-level namespace is **reserved** for future platform settings
  but is intentionally unmodeled in Phase 1.
* Future-phase keys (`models`, `tools`, `permissions`, `memory`, `agent`,
  `issue.workspace`) are **reserved by convention** and must not be invented
  here (SPECIFICATION §9).

---

## 4. Environment Variables and Secrets

### 4.1 Conventions

* Public namespace: `ISSU_` prefix (e.g., `ISSU_LOG_LEVEL`, `ISSU_CONFIG`).
* Unknown `ISSU_*` variables are accepted and accessible via the typed env
  snapshot; they are not validated in Phase 1.
* Real secret values come **only** from the process environment (or, in
  development, Node's built-in `--env-file-if-exists`). No `.env` runtime
  dependency is required (DECISIONS §D5).

### 4.2 Secret policy

* `.env.example` documents the required/named secret variables; real `.env`
  files are gitignored.
* A variable is considered secret if its name matches the convention
  (`TOKEN`, `KEY`, `SECRET`, `PASSWORD`, `PASS`, `API_KEY`, `CREDENTIAL`,
  `AUTH`) or if it is listed in `redact` config.
* Secret **values** are added to the global redaction list (see §5.3).
* Phase 1 declares no *required* secrets, so `getSecret` returns `undefined`
  for an absent variable (tested at `tests/env/secrets.test.ts`). The
  `issue.env.missing` code (§6.3) is defined and reserved for future phases
  that declare required secrets; the phase never fabricates placeholder
  secrets.

### 4.3 Anti-patterns (enforced)

* No secret value is ever written to logs, error messages, or config files.
* No `console.log` of env contents in library code.

---

## 5. Logging Foundation

### 5.1 Levels

`trace < debug < info < warn < error < fatal`; threshold from config/env, default
`info`. In non-TTY output, the default emitter writes **JSON lines**; in TTY,
pretty output is available via `logPretty`.

### 5.2 Structured record (JSON lines)

```json
{ "level": "info", "time": 1730000000000, "msg": "...", "ctx": {}, "err": {} }
```

### 5.3 Redaction

* The logger facade is constructed with the current redaction list
  (config `redact` + auto-detected secret names/values, §4.2).
* Redaction is applied at the sink: keys matching the list are replaced with
  `[REDACTED]` in *every* output mode.
* Redaction is unit-tested; a redaction failure is a release blocker.

### 5.4 Replaceability

Consumers depend on the `Logger` interface (§2). The pino implementation is a
private detail (DECISIONS §D6). No consumer code may import pino directly.

---

## 6. Error-Handling Foundation

### 6.1 Model

Two complementary mechanisms:

* **Expected failures** → `Result<T, E>` returned from fallible functions
  (e.g., `loadConfig`). Callers must handle `err` explicitly. This matches
  BLUEPRINT §12: "successful execution cannot be assumed."
* **Unexpected/exceptional failures** → throw `AppError` with full context
  (`code`, `message`, `cause`, `recoverable`, `details`).
* **Top level** → `main.ts` catches everything, normalizes with `toError`,
  logs once, and maps to a stable exit code. No raw stack traces to users;
  stack traces go to logs at `debug`.

### 6.2 AppError shape

```ts
interface AppErrorParams {
  code: string;
  message: string;
  cause?: unknown;
  recoverable?: boolean;   // default true
  details?: unknown;
}
```

`AppError` is structured (`toJSON()`), safe to log, and stable to serialize.

### 6.3 Error codes (normative)

| Code | Meaning |
| --- | --- |
| `issue.internal` | Unexpected internal failure (recoverable=false) |
| `issue.usage` | CLI misuse (recoverable=false) |
| `issue.config.notfound` | Config file path does not exist |
| `issue.config.parse` | Config file unparseable |
| `issue.config.invalid` | Config fails validation |
| `issue.env.missing` | Required secret/env not set |
| `issue.path.escape` | Path containment violation (recoverable=false) |
| `issue.cli.unknownflag` | Unknown CLI flag |

**Reserved namespaces** (for future phases, must not be allocated here):
`issue.tool.*`, `issue.agent.*`, `issue.model.*`, `issue.memory.*`,
`issue.network.*`. Allocating a code outside Phase 1 scope is a boundary
violation.

### 6.4 Exit codes (CLI)

| Code | Meaning |
| --- | --- |
| 0 | Success |
| 1 | Unexpected failure (`issue.internal`) |
| 2 | Usage / configuration error |

Future phases may extend the map; Phase 1 freezes 0/1/2.

---

## 7. TypeScript / Compiler Configuration

* `tsconfig.json` (editor + tests): `strict: true`, `module/moduleResolution:
  NodeNext`, `target: ES2022`, `noUncheckedIndexedAccess: true`,
  `exactOptionalPropertyTypes: true`, `verbatimModuleSyntax: true`,
  `isolatedModules: true`, `forceConsistentCasingInFileNames: true`,
  `skipLibCheck: true`, `esModuleInterop: true`, `declaration: true`,
  `sourceMap: true`.
* `tsconfig.build.json`: `rootDir: src`, `outDir: dist`, excludes `tests/`,
  `examples/`, `vitest.config.ts`.
* Dev runs via `tsx`; builds via `tsc` (DECISIONS §D10).
* Engines: Node `>=22.9.0`; development on current LTS (`24`), pinned by
  `.node-version`.

---

## 8. Testing Specification

* Framework: Vitest (DECISIONS §D8). Coverage gate ≥ 80% overall lines.
* **Required suites:**
  1. `config/` — layer precedence, JSONC parsing, validation, discovery.
  2. `env/` — secret detection, missing-secret behavior, snapshot typing.
  3. `logging/` — levels, JSON shape, redaction (must assert no secret value
     appears in any output).
  4. `errors/` — AppError shape, serialization, guards, normalization.
  5. `result/` — ok/err/match semantics.
  6. `paths/` — containment, traversal rejection, symlink edge cases.
  7. `cli/` — spawn the **built** binary; assert `--help`, `--version`,
     `--log-level`, unknown-flag exit 2, `--config` bad path exit 2.
* Every public contract in §2 must have at least one test.
* No test depends on anything outside `phase-01-foundation/`.

---

## 9. Explicit Non-Goals (Phase 1 Must NOT Implement)

Verbatim from the phase mandate, plus Phase 1-specific exclusions:

1. Agent loops / autonomous planning / autonomous decision loops.
2. Memory systems (any form).
3. Multi-agent systems / agent roles.
4. Tool orchestration.
5. Codebase intelligence / code understanding.
6. Autonomous coding / code modification / code generation.
7. Web research / web fetching / browser.
8. Model routing / model providers / any LLM or model API call / model SDKs.
9. Git integration or any VCS operations.
10. Filesystem tools, terminal/process tools, network tools.
11. Config **schemas** for `models`, `tools`, `permissions`, `memory`, or
    `agent` (the loader *mechanism* is in scope; the schemas are not).
12. Distribution/packaging/publishing (`private: true`).
13. Production deployment, daemons, or services.
14. Performance benchmarking infrastructure beyond what the toolchain provides.

Any implementation under `src/` that violates §9 fails the phase review.

---

## 10. Definition of Done (Phase 1 Complete)

Phase 1 is complete when **all** of the following hold:

1. Every task in `TASKS.md` is done and its acceptance criteria pass.
2. `npm run check` passes (typecheck + lint + format-check + all tests).
3. Coverage ≥ 80%; redaction tests green.
4. `npm run build` succeeds; `node dist/cli/main.js --help` and `--version`
   behave per §6.4.
5. `npm audit` reports no known vulnerabilities.
6. Public contract (§2) is implemented, tested, documented, and **frozen**;
   no internal modules are exported.
7. SPECIFICATION §9 audit passes: a review confirms no future-phase code or
   reserved namespace exists in `src/`.
8. Documentation set (README/ARCHITECTURE/SPECIFICATION/TASKS/DECISIONS) is
   internally consistent and consistent with `../BLUEPRINT.md`.
9. CI pipeline runs the full gate and is green.
10. Phase review sign-off (lead/architect roles) records acceptance; phase is
    marked **FROZEN** in the README.

---

## 11. Versioning

* SemVer per BLUEPRINT §22. Phase 1 starts at `0.1.0`.
* Pre-1.0: breaking changes to the §2 contract require a DECISIONS entry and a
  minor-version bump. Post-1.0: contract changes require a major bump.
