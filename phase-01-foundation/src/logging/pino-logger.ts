import { pino } from "pino";
import type {
  DestinationStream,
  Logger as PinoLoggerInstance,
  LogFn,
} from "pino";
import { redactionList } from "../env/secrets.js";
import type { EnvSource, IssueConfig } from "../index.js";
import type { Logger, LoggerOptions, LogLevel } from "./logger.js";
import { redactRecord } from "./redaction.js";

export interface PinoLoggerOptions extends LoggerOptions {
  logPretty?: boolean;
  stream?: DestinationStream;
}

const DEFAULT_LEVEL: LogLevel = "info";

export function createLogger(options: LoggerOptions = {}): Logger {
  const opts: PinoLoggerOptions = {};
  if (options.level !== undefined) opts.level = options.level;
  if (options.redact !== undefined) opts.redact = options.redact;
  return createPinoLogger(opts);
}

export function createLoggerFromConfig(
  config: IssueConfig,
  source?: EnvSource,
  stream?: DestinationStream,
): Logger {
  const opts: PinoLoggerOptions = {
    level: config.logLevel,
    redact: [...new Set([...config.redact, ...redactionList(source)])],
    logPretty: config.logPretty,
  };
  if (stream !== undefined) opts.stream = stream;
  return createPinoLogger(opts);
}

export function createPinoLogger(options: PinoLoggerOptions = {}): Logger {
  const level = options.level ?? DEFAULT_LEVEL;
  const redact = options.redact ?? [];
  const logPretty = options.logPretty ?? false;
  const stream = options.stream ?? process.stdout;
  const sink = new RedactingSink(stream, redact, logPretty);
  const inner = pino(
    {
      level,
      base: {},
      formatters: {
        level: (label: string): object => ({ level: label }),
      },
    },
    sink,
  );
  return new LoggerFacade(inner);
}

class RedactingSink implements DestinationStream {
  private buffer = "";

  constructor(
    private readonly stream: DestinationStream,
    private readonly redact: readonly string[],
    private readonly logPretty: boolean,
  ) {}

  write(msg: string): void {
    this.buffer += msg;
    let end = this.buffer.indexOf("\n");
    while (end !== -1) {
      const line = this.buffer.slice(0, end);
      this.buffer = this.buffer.slice(end + 1);
      this.flushLine(line);
      end = this.buffer.indexOf("\n");
    }
  }

  private flushLine(line: string): void {
    if (line.trim() === "") return;
    if (this.redact.length === 0 && !this.logPretty) {
      this.stream.write(line + "\n");
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      this.stream.write(line + "\n");
      return;
    }
    const record = redactRecord(parsed, this.redact);
    const output = this.logPretty
      ? prettyFormat(record)
      : JSON.stringify(record);
    this.stream.write(output + "\n");
  }
}

function prettyFormat(record: unknown): string {
  if (record === null || typeof record !== "object" || Array.isArray(record)) {
    return String(record);
  }
  const rec = record as Record<string, unknown>;
  const level =
    typeof rec.level === "string" ? rec.level.toUpperCase() : "INFO";
  const message = typeof rec.msg === "string" ? rec.msg : "";
  const time =
    typeof rec.time === "number" ? new Date(rec.time).toISOString() : "";
  const extras: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rec)) {
    if (key === "level" || key === "time" || key === "msg") continue;
    extras[key] = value;
  }
  const suffix =
    Object.keys(extras).length > 0 ? ` ${JSON.stringify(extras)}` : "";
  return `[${time}] ${level}: ${message}${suffix}`;
}

class LoggerFacade implements Logger {
  constructor(private readonly inner: PinoLoggerInstance) {}

  trace(msg: string, ctx?: object): void {
    this.emit("trace", msg, ctx);
  }

  debug(msg: string, ctx?: object): void {
    this.emit("debug", msg, ctx);
  }

  info(msg: string, ctx?: object): void {
    this.emit("info", msg, ctx);
  }

  warn(msg: string, ctx?: object): void {
    this.emit("warn", msg, ctx);
  }

  error(msg: string, ctx?: object): void {
    this.emit("error", msg, ctx);
  }

  fatal(msg: string, ctx?: object): void {
    this.emit("fatal", msg, ctx);
  }

  child(bindings: object): Logger {
    return new LoggerFacade(this.inner.child(bindings));
  }

  private emit(level: LogLevel, msg: string, ctx?: object): void {
    const fn = (this.inner as unknown as Record<string, LogFn>)[level];
    if (typeof fn !== "function") return;
    if (ctx === undefined) fn.call(this.inner, msg);
    else fn.call(this.inner, { ctx }, msg);
  }
}
