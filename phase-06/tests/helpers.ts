import { getDefaultConfig } from "../src/internal/config.js";
import type { ConfigSchema } from "../src/internal/config.js";

export function makeDefaults(): ConfigSchema {
  return getDefaultConfig();
}

export function makeValidSchema(
  overrides?: Partial<ConfigSchema>,
): ConfigSchema {
  return {
    version: "1.0.0",
    logging: { level: "info" },
    ...overrides,
  };
}

export const VALID_FILE_JSONC = `{
  // comment
  "version": "1.0.0",
  "logging": { "level": "debug" },
  "project": { "name": "test" }, // trailing comment
}`;
