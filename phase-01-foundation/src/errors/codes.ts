export const ERROR_CODES = [
  "issue.internal",
  "issue.usage",
  "issue.config.notfound",
  "issue.config.parse",
  "issue.config.invalid",
  "issue.env.missing",
  "issue.path.escape",
  "issue.cli.unknownflag",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export const RESERVED_ERROR_CODE_NAMESPACES = [
  "issue.tool",
  "issue.agent",
  "issue.model",
  "issue.memory",
  "issue.network",
] as const;

export type ReservedErrorCodeNamespace =
  (typeof RESERVED_ERROR_CODE_NAMESPACES)[number];
