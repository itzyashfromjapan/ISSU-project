/**
 * ISSU v0.2 Trial UI — public barrel.
 * Exposes the pure pieces (registry, validation, mode resolution, handler)
 * so tooling and tests can compose them without sockets.
 */

export { DOMAINS, getDomain, loadRunner } from "./internal/registry.js";
export type { DomainId, DomainMeta } from "./internal/registry.js";

export { parseRunInput } from "./internal/validate.js";
export type { TrialRequest, TrialInput } from "./internal/validate.js";

export { resolveMode, buildProvider } from "./internal/mode.js";
export type { ProviderMode, ResolvedMode } from "./internal/mode.js";

export { ArrayLogger } from "./internal/audit.js";
export type { AuditEvent } from "./internal/audit.js";

export { handleRequest } from "./internal/handler.js";
export type { JsonResponse } from "./internal/handler.js";

export { createTrialServer } from "./server.js";
export { VERSION } from "./version.js";
