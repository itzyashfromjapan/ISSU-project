import { afterEach, describe, it, expect } from "vitest";
import { handleRequest } from "../src/internal/handler.js";

type Res = { status: number; body: Record<string, unknown> };
async function call(
  method: string,
  path: string,
  body?: unknown,
): Promise<Res> {
  const text = body === undefined ? undefined : JSON.stringify(body);
  const out = await handleRequest(method, path, text);
  return { status: out.status, body: out.body as Record<string, unknown> };
}

const KEYVAR = "TRIAL_HANDLER_KEY";
afterEach(() => {
  delete process.env[KEYVAR];
  delete process.env.ISSU_ENV;
  delete process.env.ISSU_PROVIDER;
  delete process.env.ISSU_PROVIDER_MODEL;
  delete process.env.ISSU_PROVIDER_API_KEY_VAR;
});

describe("routes", () => {
  it("GET / serves the workbench HTML", async () => {
    const r = await call("GET", "/");
    expect(r.status).toBe(200);
    expect(String(r.body.html)).toContain("ISSU");
    expect(String(r.body.html)).toContain("Controlled Trial Workbench");
  });

  it("GET /api/domains lists the whitelisted domains", async () => {
    const r = await call("GET", "/api/domains");
    expect(r.status).toBe(200);
    const domains = r.body.domains as Array<{ id: string }>;
    expect(domains.length).toBe(9);
    expect(domains.map((d) => d.id)).toContain("business");
    expect(domains.map((d) => d.id)).toContain("industry");
  });

  it("unknown route -> 404", async () => {
    const r = await call("GET", "/nope");
    expect(r.status).toBe(404);
  });

  it("/api/state reports stub mode by default with domain list", async () => {
    delete process.env.ISSU_PROVIDER;
    const r = await call("GET", "/api/state");
    expect(r.status).toBe(200);
    expect(r.body.mode).toBe("stub");
    expect(Array.isArray(r.body.domains)).toBe(true);
  });

  it("/api/state reports missing-credentials for remote provider without key", async () => {
    process.env.ISSU_ENV = "staging";
    process.env.ISSU_PROVIDER = "anthropic";
    process.env.ISSU_PROVIDER_MODEL = "claude-x";
    process.env.ISSU_PROVIDER_API_KEY_VAR = KEYVAR;
    const r = await call("GET", "/api/state");
    expect(r.status).toBe(200);
    expect(r.body.mode).toBe("missing-credentials");
  });

  it("/api/preflight passes in local mode", async () => {
    delete process.env.ISSU_PROVIDER;
    const r = await call("POST", "/api/preflight", {});
    expect(r.status).toBe(200);
    expect(r.body.passed).toBe(true);
  });
});

describe("POST /api/run — validation and safety", () => {
  it("bad JSON -> 400 issue.trial.bad-json", async () => {
    const out = await handleRequest("POST", "/api/run", "{ nope");
    expect(out.status).toBe(400);
    expect((out.body as { code: string }).code).toBe("issue.trial.bad-json");
  });

  it("empty objective -> 400 validation", async () => {
    const r = await call("POST", "/api/run", {
      domain: "business",
      objective: "   ",
    });
    expect(r.status).toBe(400);
    expect(String(r.body.message)).toContain("must not be empty");
  });

  it("localFile inputs are rejected outright", async () => {
    const r = await call("POST", "/api/run", {
      domain: "business",
      objective: "x",
      inputs: [{ id: "f", kind: "localFile", path: "./secrets.txt" }],
    });
    expect(r.status).toBe(400);
    expect(String(r.body.message)).toContain("only inline inputs are allowed");
  });

  it("unknown domain -> 400 issue.trial.unknown-domain", async () => {
    const r = await call("POST", "/api/run", {
      domain: "not-a-domain",
      objective: "x",
    });
    expect(r.status).toBe(400);
    expect((r.body as { code: string }).code).toBe(
      "issue.trial.unknown-domain",
    );
  });
});

describe("POST /api/run — deterministic execution (stub mode)", () => {
  it("business workflow completes and emits content-free audit events", async () => {
    delete process.env.ISSU_PROVIDER;
    const r = await call("POST", "/api/run", {
      domain: "business",
      objective: "Trial invoices",
      inputs: [{ id: "inv1", content: "total 1200" }],
      correlationId: "trial-001",
    });
    expect(r.status).toBe(200);
    expect(r.body.state).toBe("COMPLETED");
    expect(r.body.findingsCount).toBe(1);
    expect(r.body.providerMode).toBe("stub");
    expect(typeof r.body.aiSummary).toBe("string");

    // Audit events are present. Known frozen-contract characteristic: the
    // Phase 10 machine's own business.audit context includes the objective
    // (its SPEC observability contract) — displayed locally only. What MUST
    // NOT appear is input file CONTENT or any credential material.
    const audit = r.body.audit as Array<{
      msg: string;
      ctx: Record<string, unknown>;
    }>;
    expect(audit.length).toBeGreaterThan(0);
    const serialized = JSON.stringify(audit);
    expect(serialized).not.toContain("total 1200");
    const dispatch = audit.find((e) => e.msg === "trial.domain.dispatch");
    expect(dispatch?.ctx.domain).toBe("business");
  });

  it("analytics workflow executes through Phase 5 barrel", async () => {
    delete process.env.ISSU_PROVIDER;
    const r = await call("POST", "/api/run", {
      domain: "analytics",
      objective: "Count rows",
      inputs: [{ id: "rows1", content: "a,b\n1,2" }],
    });
    expect([200].includes(r.status)).toBe(true);
    expect(["COMPLETED", "ABSTAINED"].includes(String(r.body.state))).toBe(
      true,
    );
  });

  it("live mode without credentials -> 409 clear failure state", async () => {
    process.env.ISSU_ENV = "staging";
    process.env.ISSU_PROVIDER = "anthropic";
    process.env.ISSU_PROVIDER_MODEL = "claude-x";
    process.env.ISSU_PROVIDER_API_KEY_VAR = KEYVAR;
    // KEYVAR deliberately NOT set in environment
    const r = await call("POST", "/api/run", {
      domain: "business",
      objective: "x",
      inputs: [{ id: "i", content: "c" }],
    });
    expect(r.status).toBe(409);
    expect((r.body as { code: string }).code).toBe(
      "issue.trial.missing-credentials",
    );
  });
});

describe("secret redaction (security)", () => {
  it("responses never contain the credential VALUE even when set", async () => {
    const secretValue = "supersecretvalue1234567890";
    process.env[KEYVAR] = secretValue;
    process.env.ISSU_ENV = "staging";
    process.env.ISSU_PROVIDER = "anthropic";
    process.env.ISSU_PROVIDER_MODEL = "claude-x";
    process.env.ISSU_PROVIDER_API_KEY_VAR = KEYVAR;

    const state = await call("GET", "/api/state");
    expect(JSON.stringify(state.body)).not.toContain(secretValue);

    // NOTE: /api/run is intentionally NOT called in live mode here — that
    // would make a real network call to the provider endpoint, which is
    // forbidden in tests. State + preflight cover every response surface
    // reachable without credentials.
    const pf = await call("POST", "/api/preflight", {});
    expect(JSON.stringify(pf.body)).not.toContain(secretValue);
  });
});
