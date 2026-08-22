/**
 * ISSU Phase 8 — Model Provider Binding: public barrel (§3).
 * Exposes exactly the §3 public surface: 5 types + 5 functions.
 * Every other symbol is internal (§3 NORMATIVE) and SHALL NOT be imported.
 */

export type {
  ProviderConfig,
  ModelProvider,
  ModelRouter,
  ProviderResult,
  CallModelOptions,
} from "./internal/types.js";
export { createAnthropicProvider } from "./internal/anthropic.js";
export { createOpenAIProvider } from "./internal/openai.js";
export { createLocalProvider } from "./internal/local.js";
export { createModelRouter } from "./internal/router.js";
export { callModel } from "./internal/callModel.js";
export { getProviderAuth } from "./internal/auth.js";
export { VERSION } from "./version.js";
