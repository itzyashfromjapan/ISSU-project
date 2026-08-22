/**
 * ISSU v0.2 Trial UI — localhost-only HTTP server.
 * Binds 127.0.0.1 exclusively; 16KB body cap; no CORS (same-origin only).
 * `--selftest` boots an ephemeral server, verifies / and /api/state, exits.
 */

import { createServer, get } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { handleRequest } from "./internal/handler.js";

const MAX_BODY = 16 * 1024;

function send(
  res: ServerResponse,
  status: number,
  contentType: string,
  body: string,
): void {
  res.writeHead(status, {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  });
  res.end(body);
}

async function readBody(req: IncomingMessage): Promise<string | undefined> {
  const len = Number(req.headers["content-length"] ?? 0);
  if (!Number.isNaN(len) && len > MAX_BODY) return undefined;
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    total += (chunk as Buffer).length;
    if (total > MAX_BODY) return undefined;
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function createTrialServer() {
  return createServer((req, res) => {
    void serve(req, res);
  });
}

async function serve(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const bodyText = req.method === "POST" ? await readBody(req) : undefined;
    if (req.method === "POST" && bodyText === undefined) {
      send(
        res,
        413,
        "application/json",
        JSON.stringify({ ok: false, message: "body too large" }),
      );
      return;
    }
    const out = await handleRequest(
      req.method ?? "GET",
      url.pathname,
      bodyText,
    );
    const isHtml =
      out.status === 200 &&
      typeof out.body === "object" &&
      out.body !== null &&
      "html" in (out.body as Record<string, unknown>);
    if (isHtml) {
      send(
        res,
        200,
        "text/html; charset=utf-8",
        String((out.body as { html: string }).html),
      );
      return;
    }
    send(res, out.status, "application/json", JSON.stringify(out.body));
  } catch (e) {
    send(
      res,
      500,
      "application/json",
      JSON.stringify({ ok: false, message: (e as Error).message }),
    );
  }
}

function getText(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    // Connection: close ensures the socket is torn down with the response,
    // avoiding keep-alive handles racing process exit on Windows.
    get(url, { headers: { Connection: "close" } }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    }).on("error", reject);
  });
}

function selftest(): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = createTrialServer();
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr !== null ? addr.port : 0;
      const base = `http://127.0.0.1:${port}`;
      void (async () => {
        try {
          const home = await getText(`${base}/`);
          if (home.status !== 200 || !home.body.includes("ISSU")) {
            throw new Error(`/ returned ${home.status}`);
          }
          const state = await getText(`${base}/api/state`);
          if (state.status !== 200 || !JSON.parse(state.body).ok) {
            throw new Error(`/api/state returned ${state.status}`);
          }
          console.log(`[trial-ui] selftest PASS at ${base}`);
          server.closeAllConnections?.();
          server.close(() => resolve());
        } catch (e) {
          server.closeAllConnections?.();
          server.close(() => reject(e));
        }
      })();
    });
    server.once("error", reject);
  });
}

// Direct-run detection: node dist/server.js
const here = fileURLToPath(import.meta.url);
const invoked = process.argv[1]
  ? fileURLToPath(`file:///${process.argv[1].replace(/\\/g, "/")}`)
  : "";
if (invoked !== "" && here === invoked) {
  if (process.argv.includes("--selftest")) {
    selftest().then(
      () => process.exit(0),
      (e) => {
        console.error(`[trial-ui] selftest FAIL: ${(e as Error).message}`);
        process.exit(1);
      },
    );
  } else {
    const port = Number(process.env.TRIAL_PORT ?? 4173);
    const server = createTrialServer();
    server.listen(port, "127.0.0.1", () => {
      console.log(
        `[trial-ui] ISSU Trial Workbench: http://127.0.0.1:${port} (Ctrl+C to stop)`,
      );
    });
  }
}
