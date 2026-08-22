import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createLocalProvider } from "../src/internal/local.js";
import { createAnthropicProvider } from "../src/internal/anthropic.js";
import { createOpenAIProvider } from "../src/internal/openai.js";
import { getProviderAuth } from "../src/internal/auth.js";

describe("local provider (deterministic)", () => {
  it("generateText is deterministic stub", async () => {
    const p = createLocalProvider();
    const r1 = await p.generateText("hello");
    const r2 = await p.generateText("hello");
    expect(r1.ok && r2.ok && r1.value === r2.value).toBe(true);
    expect(r1.ok && r1.value).toBe("stub response for: hello");
  });
  it("countTokens returns length", async () => {
    const p = createLocalProvider();
    const r = await p.countTokens("hello");
    expect(r.ok && r.value === 5).toBe(true);
  });
});

describe("getProviderAuth", () => {
  const key = "P8_TEST_KEY_" + Math.random().toString(36).slice(2);
  beforeEach(() => {
    process.env[key] = "secret123";
  });
  afterEach(() => {
    delete process.env[key];
  });
  it("local returns ok without env", async () => {
    const r = getProviderAuth({
      provider: "local",
      model: "x",
      apiKeyEnvVar: "ANY",
    });
    expect(r.ok).toBe(true);
  });
  it("anthropic with env returns ok", async () => {
    const r = getProviderAuth({
      provider: "anthropic",
      model: "claude",
      apiKeyEnvVar: key,
    });
    expect(r.ok).toBe(true);
  });
  it("missing env returns auth error", async () => {
    const r = getProviderAuth({
      provider: "anthropic",
      model: "claude",
      apiKeyEnvVar: "MISSING_" + key,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("issue.provider.auth");
  });
});

describe("anthropic/openai validation", () => {
  it("anthropic: empty prompt → validation", async () => {
    const p = createAnthropicProvider({
      provider: "anthropic",
      model: "claude",
      apiKeyEnvVar: "ANY",
    });
    const r = await p.generateText("");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("issue.provider.validation");
  });
  it("anthropic: empty model → validation", async () => {
    const key = "P8_ANTH_" + Math.random().toString(36).slice(2);
    process.env[key] = "k";
    const p2 = createAnthropicProvider({
      provider: "anthropic",
      model: "",
      apiKeyEnvVar: key,
    });
    const r2 = await p2.generateText("hi");
    expect(r2.ok).toBe(false);
    delete process.env[key];
  });
  it("anthropic: invalid baseUrl → validation", async () => {
    const key = "P8_ANTH2_" + Math.random().toString(36).slice(2);
    process.env[key] = "k";
    const p = createAnthropicProvider({
      provider: "anthropic",
      model: "claude",
      apiKeyEnvVar: key,
      baseUrl: "http://not-https.com",
    });
    const r = await p.generateText("hi");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("issue.provider.validation");
    delete process.env[key];
  });
  it("openai: invalid baseUrl → validation", async () => {
    const key = "P8_OPEN_" + Math.random().toString(36).slice(2);
    process.env[key] = "k";
    const p = createOpenAIProvider({
      provider: "openai",
      model: "gpt-4o",
      apiKeyEnvVar: key,
      baseUrl: "ftp://bad",
    });
    const r = await p.generateText("hi");
    expect(r.ok).toBe(false);
    delete process.env[key];
  });
});
