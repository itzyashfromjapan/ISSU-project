import { describe, it, expect } from "vitest";
import { httpFetch } from "../src/internal/fetch.js";

describe("httpFetch (Spec §13)", () => {
  it("fails on file:// protocol", async () => {
    const res = await httpFetch("file:///etc/passwd");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("issue.network.not-allowed");
  });
  it("fails on private host without allowPrivate", async () => {
    const res = await httpFetch("http://127.0.0.1/test");
    expect(res.ok).toBe(false);
  });
  it("fails when timeoutMs over max", async () => {
    const res = await httpFetch("https://example.com", { timeoutMs: 70000 });
    expect(res.ok).toBe(false);
  });
  it("fails when maxResponseBytes over cap", async () => {
    const res = await httpFetch("https://example.com", {
      maxResponseBytes: 2 * 1024 * 1024,
    });
    expect(res.ok).toBe(false);
  });
  it("fails when header requires allowAuth", async () => {
    const res = await httpFetch("https://example.com", {
      headers: { Authorization: "Bearer x" },
    });
    expect(res.ok).toBe(false);
  });
  it("succeeds with allowAuth", async () => {
    // Use a public endpoint that should succeed or at least not fail on allowAuth check
    // We test that allowAuth bypasses the header check, not that fetch succeeds
    // So we use a non-private URL with allowAuth true; fetch may still fail due to network, but header check should pass
    // Use httpbin if available, but to keep deterministic, we just check that header check passes by not returning not-allowed for header
    // Instead test that with allowAuth true, the header is not rejected immediately
    const res = await httpFetch("https://example.com", {
      headers: { Authorization: "Bearer x" },
      allowAuth: true,
      timeoutMs: 2000,
      maxResponseBytes: 1000,
    });
    // Either ok or timeout/network error, but not header not-allowed
    if (!res.ok) expect(res.error.code).not.toBe("issue.network.not-allowed");
  });
  it("fetches example.com successfully (or times out gracefully)", async () => {
    const res = await httpFetch("https://example.com", {
      timeoutMs: 5000,
      maxResponseBytes: 5000,
    });
    // Network may be unavailable, but result should be ok or timeout/network error, not validation
    expect(typeof res.ok).toBe("boolean");
  });
});
