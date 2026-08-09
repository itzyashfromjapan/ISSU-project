import type { EnvSnapshot, EnvSource } from "../index.js";

export function readEnv(source?: EnvSource): EnvSnapshot {
  const env = source ?? process.env;
  const snapshot: EnvSnapshot = {};
  for (const key of Object.keys(env)) {
    if (key.startsWith("ISSU_")) snapshot[key] = env[key];
  }
  return snapshot;
}
