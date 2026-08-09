export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface Logger {
  trace(msg: string, ctx?: object): void;
  debug(msg: string, ctx?: object): void;
  info(msg: string, ctx?: object): void;
  warn(msg: string, ctx?: object): void;
  error(msg: string, ctx?: object): void;
  fatal(msg: string, ctx?: object): void;
  child(bindings: object): Logger;
}

export interface LoggerOptions {
  level?: LogLevel;
  redact?: string[];
}
