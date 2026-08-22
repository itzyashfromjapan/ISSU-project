import { afterEach, describe, expect, it, vi } from "vitest";
import { httpFetch } from "../src/internal/fetch.js";

describe("httpFetch — error and header branches (stubbed global fetch)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps AbortError rejection to issue.network.timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error("abort"), { name: "AbortError" }),
        ),
    );
    const r = await httpFetch("https://example.com", { timeoutMs: 1000 });
    expect(!r.ok && r.error.code).toBe("issue.network.timeout");
  });

  it("maps generic fetch rejection to issue.network.not-allowed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("dns fail")));
    const r = await httpFetch("https://example.com", { timeoutMs: 1000 });
    expect(!r.ok && r.error.code).toBe("issue.network.not-allowed");
  });

  it("blocks X-Auth-* headers without allowAuth", async () => {
    const r = await httpFetch("https://example.com", {
      headers: { "X-Auth-Token": "t" },
    });
    expect(!r.ok && r.error.code).toBe("issue.network.not-allowed");
  });

  it("forwards Authorization header when allowAuth is true", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const r = await httpFetch("https://example.com", {
      headers: { Authorization: "Bearer t" },
      allowAuth: true,
    });
    expect(
      r.ok && (r.value.headers as Record<string, string>)["content-type"],
    ).toContain("json");
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = init?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer t");
  });
});
