/**
 * ISSU Phase 7 — Network fetch tooling.
 * Spec §13, Architecture Q7.5.
 * Guarded fetch per Ruflo http_fetch §5.1.8.
 */

import type { Result } from "@issue/foundation";
import { AppError } from "@issue/foundation";
import { err, ok } from "@issue/foundation";
import type { FetchOptions } from "./audit.js";
import { createToolLogger } from "./audit.js";

const DEFAULT_TIMEOUT = 30000;
const MAX_TIMEOUT = 60000;
const DEFAULT_MAX_BYTES = 262144; // 256KB
const MAX_BYTES_CAP = 1048576; // 1MB

function isPrivateHost(host: string): boolean {
  // RFC1918, loopback, link-local
  if (host === "localhost" || host === "127.0.0.1" || host === "::1")
    return true;
  if (host.startsWith("10.")) return true;
  if (host.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(host)) return true;
  if (host.startsWith("169.254.")) return true;
  if (host.startsWith("0.")) return true;
  return false;
}

function sanitizeHeaders(
  headers: Record<string, string>,
  allowAuth: boolean,
): Result<Record<string, string>, AppError> {
  if (allowAuth) return ok(headers);
  for (const k of Object.keys(headers)) {
    const lk = k.toLowerCase();
    if (lk === "authorization" || lk === "cookie" || lk.startsWith("x-auth-")) {
      return err(
        new AppError({
          code: "issue.network.not-allowed",
          message: `header not allowed without allowAuth: ${k}`,
        }),
      );
    }
  }
  return ok(headers);
}

export async function httpFetch(
  url: string,
  options?: FetchOptions,
): Promise<
  Result<
    { status: number; body: string; headers: Record<string, string> },
    AppError
  >
> {
  const logger = options?.logger ?? createToolLogger("info");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (e) {
    return err(
      new AppError({
        code: "issue.network.not-allowed",
        message: `invalid url: ${url}`,
        cause: e,
      }),
    );
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return err(
      new AppError({
        code: "issue.network.not-allowed",
        message: `protocol not allowed: ${parsed.protocol}`,
      }),
    );
  }
  if (!options?.allowPrivate && isPrivateHost(parsed.hostname)) {
    return err(
      new AppError({
        code: "issue.network.not-allowed",
        message: `private host not allowed: ${parsed.hostname}`,
      }),
    );
  }
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT;
  if (timeoutMs > MAX_TIMEOUT) {
    return err(
      new AppError({
        code: "issue.network.not-allowed",
        message: `timeoutMs max ${MAX_TIMEOUT}`,
      }),
    );
  }
  const maxBytes = options?.maxResponseBytes ?? DEFAULT_MAX_BYTES;
  if (maxBytes > MAX_BYTES_CAP) {
    return err(
      new AppError({
        code: "issue.network.not-allowed",
        message: `maxResponseBytes max ${MAX_BYTES_CAP}`,
      }),
    );
  }
  const headers = options?.headers ?? {};
  const sanitized = sanitizeHeaders(headers, options?.allowAuth ?? false);
  if (!sanitized.ok)
    return sanitized as unknown as Result<
      { status: number; body: string; headers: Record<string, string> },
      AppError
    >;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ruflo-http-fetch/1.0",
        ...sanitized.value,
      },
    });
    clearTimeout(timer);
    const bodyText = await res.text();
    const truncated = bodyText.slice(0, maxBytes);
    const resHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      resHeaders[k] = v;
    });
    logger.info("fetch.audit", { tool: "httpFetch", url, status: res.status });
    return ok({ status: res.status, body: truncated, headers: resHeaders });
  } catch (e) {
    const msg =
      (e as Error).name === "AbortError" ? "timeout" : (e as Error).message;
    if (msg === "timeout") {
      return err(
        new AppError({
          code: "issue.network.timeout",
          message: `fetch timeout: ${url}`,
          cause: e,
        }),
      );
    }
    return err(
      new AppError({
        code: "issue.network.not-allowed",
        message: `fetch failed: ${(e as Error).message}`,
        cause: e,
      }),
    );
  }
}
