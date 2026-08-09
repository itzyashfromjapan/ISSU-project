import type { EnvSource } from "../index.js";

const SECRET_NAME_TOKENS: ReadonlySet<string> = new Set([
  "token",
  "key",
  "secret",
  "password",
  "pass",
  "passwd",
  "credential",
  "credentials",
  "auth",
  "authorization",
  "apikey",
  "api_key",
]);

export function isSecretName(name: string): boolean {
  const tokens = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter((token) => token.length > 0);
  return tokens.some((token) => SECRET_NAME_TOKENS.has(token.toLowerCase()));
}

export function getSecret(
  name: string,
  source?: EnvSource,
): string | undefined {
  return (source ?? process.env)[name];
}

export function redactionList(source?: EnvSource): string[] {
  const env = source ?? process.env;
  const values: string[] = [];
  const seen = new Set<string>();
  for (const [name, value] of Object.entries(env)) {
    if (value === undefined || value === "") continue;
    if (!isSecretName(name)) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    values.push(value);
  }
  return values;
}
