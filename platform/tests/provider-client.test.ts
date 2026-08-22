import { describe, it, expect, vi } from "vitest";
import { createResilientProvider } from "../src/internal/provider-client.js";
import type { ModelProvider } from "@issue/model-provider";
import { AppError } from "@issue/foundation";

const noSleep = async () => {};

function scriptedProvider(
  name: "anthropic" | "openai" | "local",
  results: Array<{ ok: true; value: string } | { ok: false; error: AppError }>,
): ModelProvider {
  let i = 0;
  return {
    name,
    async generateText() {
      const r = results[Math.min(i, results.length - 1)];
      i++;
      return r as Awaited<ReturnType<ModelProvider["generateText"]>>;
    },
    async countTokens(text: string) {
      return { ok: true, value: text.length };
    },
  };
}

const rateLimited = () =>
  ({
    ok: false,
    error: new AppError({ code: "issue.provider.rate-limited", message: "rl" }),
  }) as const;
const authErr = () =>
  ({
    ok: false,
    error: new AppError({ code: "issue.provider.auth", message: "auth" }),
  }) as const;

describe("createResilientProvider — bounded retry semantics", () => {
  it("succeeds immediately without sleeping", async () => {
    const sleep = vi.fn(async () => {});
    const p = createResilientProvider(
      scriptedProvider("local", [{ ok: true, value: "hello" }]),
      { sleep },
    );
    const r = await p.generateText("prompt");
    expect(r.ok && r.value).toBe("hello");
    expect(sleep).not.toHaveBeenCalled();
  });

  it("retries a retryable failure then succeeds", async () => {
    const sleep = vi.fn(async () => {});
    const p = createResilientProvider(
      scriptedProvider("openai", [
        rateLimited(),
        { ok: true, value: "recovered" },
      ]),
      { sleep, policy: { maxAttempts: 3, jitter: false } },
    );
    const r = await p.generateText("p");
    expect(r.ok && r.value).toBe("recovered");
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it("exhausts attempts and returns the LAST underlying error unchanged", async () => {
    const sleep = vi.fn(async () => {});
    const last = rateLimited();
    const p = createResilientProvider(
      scriptedProvider("anthropic", [rateLimited(), rateLimited(), last]),
      { sleep, policy: { maxAttempts: 3, jitter: false } },
    );
    const r = await p.generateText("p");
    expect(!r.ok && r.error.code).toBe("issue.provider.rate-limited");
    expect(r.ok === false && (r.error as AppError)).toBe(last.error);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry non-retryable auth failures", async () => {
    const sleep = vi.fn(async () => {});
    const p = createResilientProvider(scriptedProvider("openai", [authErr()]), {
      sleep,
      policy: { maxAttempts: 5 },
    });
    const r = await p.generateText("p");
    expect(!r.ok && r.error.code).toBe("issue.provider.auth");
    expect(sleep).not.toHaveBeenCalled();
  });

  it("respects maxAttempts=1 (no retry even on retryable)", async () => {
    const sleep = vi.fn(async () => {});
    const p = createResilientProvider(
      scriptedProvider("local", [rateLimited()]),
      {
        sleep,
        policy: { maxAttempts: 1 },
      },
    );
    const r = await p.generateText("p");
    expect(!r.ok && r.error.code).toBe("issue.provider.rate-limited");
    expect(sleep).not.toHaveBeenCalled();
  });

  it("validates empty successful generations as provider.empty-result", async () => {
    const p = createResilientProvider(
      scriptedProvider("local", [{ ok: true, value: "   " }]),
      {
        sleep: noSleep,
      },
    );
    const r = await p.generateText("p");
    expect(!r.ok && (r.error as AppError).message).toContain("empty result");
  });

  it("propagates correlationId-free audit shape and countTokens passthrough", async () => {
    const inner = scriptedProvider("local", [{ ok: true, value: "x" }]);
    const p = createResilientProvider(inner, { sleep: noSleep });
    const c = await p.countTokens("abcd");
    expect(c.ok && c.value).toBe(4);
    expect(p.name).toBe("local");
  });
});
