/**
 * ISSU v0.2 Trial UI — pure request handler (no sockets; fully testable).
 * Routes:
 *   GET  /                -> workbench HTML
 *   GET  /api/state       -> provider mode + domain list
 *   POST /api/preflight   -> fail-closed preflight report
 *   POST /api/run         -> execute a whitelisted deterministic workflow
 * Anything else -> 404.
 */

import { createResilientProvider, loadPlatformEnv } from "@issue/platform";
import {
  createAnthropicProvider,
  createOpenAIProvider,
  createLocalProvider,
} from "@issue/model-provider";
import type { ModelProvider } from "@issue/model-provider";
import { ArrayLogger } from "./audit.js";
import { getDomain, loadRunner, DOMAINS } from "./registry.js";
import { resolveMode } from "./mode.js";
import { parseRunInput } from "./validate.js";
import { WORKBENCH_HTML } from "./page.js";

export type JsonResponse = {
  readonly status: number;
  readonly body: unknown;
};

function json(status: number, body: unknown): JsonResponse {
  return { status, body };
}

/** Resolves the execution ModelProvider per mode (stub/local or live remote). */
function resolveExecutionProvider():
  { provider: ModelProvider; mode: string } | { error: JsonResponse } {
  const mode = resolveMode();
  if (mode.mode === "unconfigured" || mode.mode === "missing-credentials") {
    return {
      error: json(409, {
        ok: false,
        code:
          mode.mode === "missing-credentials"
            ? "issue.trial.missing-credentials"
            : "issue.trial.unconfigured",
        message: mode.detail,
      }),
    };
  }
  const env = mode.env;
  if (!env) return { error: json(500, { ok: false, message: "no env" }) };

  if (env.provider === "local") {
    return { provider: createLocalProvider(), mode: "stub" };
  }
  // Live: build the frozen Phase 8 adapter via its public factory. The key
  // VALUE is resolved inside the adapter at call time via getSecret.
  const cfg = {
    provider: env.provider,
    model: env.model ?? "",
    apiKeyEnvVar: env.apiKeyVarName ?? "",
    timeoutMs: env.timeoutMs,
  };
  const adapter =
    env.provider === "anthropic"
      ? createAnthropicProvider(cfg)
      : createOpenAIProvider(cfg);
  return { provider: adapter, mode: "live" };
}

export async function handleRequest(
  method: string,
  path: string,
  bodyText: string | undefined,
): Promise<JsonResponse> {
  if (method === "GET" && (path === "/" || path === "/index.html")) {
    return json(200, { html: WORKBENCH_HTML });
  }

  if (method === "GET" && path === "/api/domains") {
    return json(200, { ok: true, domains: DOMAINS });
  }

  if (method === "GET" && path === "/api/state") {
    const mode = resolveMode();
    return json(200, {
      ok: true,
      mode: mode.mode,
      detail: mode.detail,
      provider: mode.env?.provider,
      model: mode.env?.model,
      error: mode.error,
      domains: DOMAINS.map((d) => ({
        id: d.id,
        label: d.label,
        phase: d.phase,
      })),
    });
  }

  if (method === "POST" && path === "/api/preflight") {
    const loaded = loadPlatformEnv();
    if (!loaded.ok) {
      return json(409, {
        ok: false,
        passed: false,
        error: loaded.error.message,
      });
    }
    const { runPreflight } = await import("@issue/platform");
    const pf = await runPreflight(loaded.value);
    if (!pf.ok) {
      return json(500, { ok: false, error: pf.error.message });
    }
    return json(200, { ok: true, ...pf.value });
  }

  if (method === "POST" && path === "/api/run") {
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(bodyText ?? "");
    } catch {
      return json(400, {
        ok: false,
        code: "issue.trial.bad-json",
        message: "body must be valid JSON",
      });
    }
    const input = parseRunInput(parsedBody);
    if (!input.ok) {
      return json(400, {
        ok: false,
        code: input.error.code ?? "issue.trial.validation",
        message: input.error.message,
      });
    }
    const meta = getDomain(input.value.domain);
    if (!meta) {
      return json(400, {
        ok: false,
        code: "issue.trial.unknown-domain",
        message: `unknown domain: ${input.value.domain}`,
      });
    }

    // Provider resolution — stub default, live only with credentials.
    const resolved = resolveExecutionProvider();
    if ("error" in resolved) return resolved.error;
    const { provider, mode } = resolved;

    const logger = new ArrayLogger("info", 100);
    const resilient = createResilientProvider(provider, {
      logger,
      ...(input.value.correlationId !== undefined
        ? { correlationId: input.value.correlationId }
        : {}),
    });

    // 1) Deterministic domain workflow through the frozen barrel runner.
    const runner = await loadRunner(meta);
    const request =
      meta.id === "analytics"
        ? {
            objective: input.value.objective,
            sources: input.value.inputs.map((i) => ({
              id: i.id,
              name: i.id,
              kind: "inline" as const,
              content: i.content,
            })),
          }
        : {
            objective: input.value.objective,
            workflow: input.value.workflow,
            inputs: input.value.inputs,
          };

    let result: unknown;
    try {
      logger.info("trial.domain.dispatch", {
        domain: meta.id,
        runner: meta.runner,
      });
      result = await runner(request, { logger });
    } catch (e) {
      return json(500, {
        ok: false,
        code: "issue.trial.runner-failed",
        message: (e as Error).message,
      });
    }
    const rec = (result ?? {}) as Record<string, unknown>;
    const state =
      typeof rec["state"] === "string" ? (rec["state"] as string) : "UNKNOWN";
    const findingsCount = Array.isArray(rec["findings"])
      ? rec["findings"].length
      : 0;

    // 2) One bounded model call through the v0.2 platform seam (live or local
    //    stub). Failure of this step never fails the deterministic outcome.
    let aiSummary: string | undefined;
    const ai = await resilient.generateText(
      `Provide a one-sentence executive summary for a ${meta.label} task titled "${input.value.objective}" that finished in state ${state} with ${findingsCount} finding(s).`,
    );
    if (ai.ok) aiSummary = ai.value;

    logger.info("trial.run.completed", {
      domain: meta.id,
      state,
      providerMode: mode,
    });

    return json(200, {
      ok: true,
      domain: meta.id,
      label: meta.label,
      state,
      findingsCount,
      providerMode: mode,
      providerName: provider.name,
      ...(aiSummary !== undefined ? { aiSummary } : {}),
      audit: logger.events,
    });
  }

  return json(404, { ok: false, message: "not found" });
}
