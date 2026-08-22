import { beforeAll, afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@issue/write-execution", () => ({ httpFetch: vi.fn() }));

import { httpFetch } from "@issue/write-execution";
import type { Mock } from "vitest";
import { AppError } from "@issue/foundation";
import { createAnthropicProvider } from "../src/internal/anthropic.js";
import { createOpenAIProvider } from "../src/internal/openai.js";

const http = httpFetch as unknown as Mock;

const KEY = "P8_MOCK_KEY";
const anthropic = createAnthropicProvider({
  provider: "anthropic",
  model: "claude-x",
  apiKeyEnvVar: KEY,
});
const openai = createOpenAIProvider({
  provider: "openai",
  model: "gpt-x",
  apiKeyEnvVar: KEY,
});

function ok(status: number, body: string) {
  return Promise.resolve({
    ok: true as const,
    value: { status, body, headers: {} },
  });
}
function netErr(code: string) {
  return Promise.resolve({
    ok: false as const,
    error: new AppError({ code, message: "net" }),
  });
}

beforeAll(() => {
  process.env[KEY] = "secret";
});
afterEach(() => {
  http.mockReset();
});

describe("anthropic via mocked httpFetch", () => {
  it("success extracts content[0].text", async () => {
    http.mockReturnValue(
      ok(200, JSON.stringify({ content: [{ text: "hi" }] })),
    );
    const r = await anthropic.generateText("p");
    expect(r.ok && r.value).toBe("hi");
  });
  it("success falls back to completion field", async () => {
    http.mockReturnValue(ok(200, JSON.stringify({ completion: "alt" })));
    const r = await anthropic.generateText("p");
    expect(r.ok && r.value).toBe("alt");
  });
  it("maps network timeout to provider.timeout", async () => {
    http.mockReturnValue(netErr("issue.network.timeout"));
    const r = await anthropic.generateText("p");
    expect(!r.ok && r.error.code).toBe("issue.provider.timeout");
  });
  it("maps other network errors to provider.not-allowed", async () => {
    http.mockReturnValue(netErr("issue.network.not-allowed"));
    const r = await anthropic.generateText("p");
    expect(!r.ok && r.error.code).toBe("issue.provider.not-allowed");
  });
  it("maps 429 to rate-limited", async () => {
    http.mockReturnValue(ok(429, ""));
    const r = await anthropic.generateText("p");
    expect(!r.ok && r.error.code).toBe("issue.provider.rate-limited");
  });
  it("maps other statuses to validation", async () => {
    http.mockReturnValue(ok(500, "boom"));
    const r = await anthropic.generateText("p");
    expect(!r.ok && r.error.code).toBe("issue.provider.validation");
  });
  it("invalid JSON maps to validation", async () => {
    http.mockReturnValue(ok(200, "{nope"));
    const r = await anthropic.generateText("p");
    expect(!r.ok && r.error.code).toBe("issue.provider.validation");
  });
  it("missing apiKey maps to auth", async () => {
    delete process.env[KEY];
    const r = await anthropic.generateText("p");
    process.env[KEY] = "secret";
    expect(!r.ok && r.error.code).toBe("issue.provider.auth");
  });
  it("empty prompt and empty model map to validation", async () => {
    const a = await anthropic.generateText("");
    expect(!a.ok && a.error.code).toBe("issue.provider.validation");
    const bad = createAnthropicProvider({
      provider: "anthropic",
      model: "",
      apiKeyEnvVar: KEY,
    });
    const b = await bad.generateText("p");
    expect(!b.ok && b.error.code).toBe("issue.provider.validation");
  });
  it("non-https baseUrl maps to validation", async () => {
    const bad = createAnthropicProvider({
      provider: "anthropic",
      model: "m",
      apiKeyEnvVar: KEY,
      baseUrl: "http://x",
    });
    const r = await bad.generateText("p");
    expect(!r.ok && r.error.code).toBe("issue.provider.validation");
  });
  it("countTokens returns length", async () => {
    const r = await anthropic.countTokens("abcd");
    expect(r.ok && r.value).toBe(4);
  });
});

describe("openai via mocked httpFetch", () => {
  it("success extracts choices.message.content", async () => {
    http.mockReturnValue(
      ok(200, JSON.stringify({ choices: [{ message: { content: "yo" } }] })),
    );
    const r = await openai.generateText("p");
    expect(r.ok && r.value).toBe("yo");
  });
  it("success falls back to text field", async () => {
    http.mockReturnValue(ok(200, JSON.stringify({ text: "legacy" })));
    const r = await openai.generateText("p");
    expect(r.ok && r.value).toBe("legacy");
  });
  it("maps timeout / 429 / 500 / bad json", async () => {
    http.mockReturnValue(netErr("issue.network.timeout"));
    expect(!(await openai.generateText("p")).ok).toBe(true);
    const t = await openai.generateText("p");
    expect(!t.ok && t.error.code).toBe("issue.provider.timeout");

    http.mockReturnValue(ok(429, ""));
    const rl = await openai.generateText("p");
    expect(!rl.ok && rl.error.code).toBe("issue.provider.rate-limited");

    http.mockReturnValue(ok(500, ""));
    const v = await openai.generateText("p");
    expect(!v.ok && v.error.code).toBe("issue.provider.validation");

    http.mockReturnValue(ok(200, "{{"));
    const j = await openai.generateText("p");
    expect(!j.ok && j.error.code).toBe("issue.provider.validation");
  });
  it("empty prompt maps to validation", async () => {
    const r = await openai.generateText("");
    expect(!r.ok && r.error.code).toBe("issue.provider.validation");
  });
  it("countTokens returns length", async () => {
    const r = await openai.countTokens("xyz");
    expect(r.ok && r.value).toBe(3);
  });
});
