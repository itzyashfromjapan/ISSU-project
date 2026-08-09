// quickstart.ts - minimal walkthrough of the Phase 1 public contract (SPECIFICATION §2).
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  VERSION,
  AppError,
  assertContained,
  createLogger,
  err,
  getSecret,
  isAppError,
  isContained,
  isErr,
  isOk,
  loadConfig,
  match,
  ok,
  readEnv,
  redactionList,
  toError,
} from "../src/index.js";

async function main(): Promise<void> {
  const cwd = mkdtempSync(join(tmpdir(), "issue-quickstart-"));

  console.log(`ISSU foundation v${VERSION}`);

  // Config: file discovery + layered precedence, returned as Result<T, E>.
  writeFileSync(
    join(cwd, "issue.config.json"),
    '{ "logLevel": "warn" }\n',
    "utf8",
  );
  const config = await loadConfig({ cwd });
  if (isErr(config)) throw config.error;
  console.log("resolved config:", JSON.stringify(config.value));

  const missing = await loadConfig({ cwd, configPath: "missing.json" });
  const outcome = match(missing, {
    ok: (value) => `loaded: ${JSON.stringify(value)}`,
    err: (error) => `rejected: ${error.code}`,
  });
  console.log("expected failure handled:", outcome);

  // Logging: level thresholds + JSON-lines output to stdout.
  const logger = createLogger({ level: config.value.logLevel });
  logger.info("hello from quickstart");

  // Environment + secrets: ISSU_* snapshot, secret access, redaction list.
  const env = readEnv({ ISSU_LOG_LEVEL: "debug", PATH: "/usr/bin" });
  console.log("env snapshot:", JSON.stringify(env));

  const secret = "synthetic-example-key";
  const present = getSecret("API_KEY", { API_KEY: secret }) === secret;
  console.log("secret value retrieved:", present);
  console.log(
    "redaction list:",
    JSON.stringify(redactionList({ API_KEY: secret })),
  );

  const guarded = createLogger({
    level: "info",
    redact: redactionList({ API_KEY: secret }),
  });
  guarded.info("connecting", {
    endpoint: "https://api.example.test",
    token: secret,
  });

  // Errors: AppError shape, guards, normalization.
  const problem = new AppError({
    code: "issue.usage",
    message: "something is misconfigured",
    recoverable: false,
  });
  console.log("isAppError:", isAppError(problem), "| code:", problem.code);
  console.log("toError passthrough:", toError(problem) === problem);
  console.log("toJSON:", JSON.stringify(problem.toJSON()));

  // Result: ok/err/isOk/isErr/match.
  const value = match(ok(41), { ok: (n) => n + 1, err: () => 0 });
  console.log("result match (ok):", value);
  console.log("isOk(err(...)):", isOk(err(new Error("boom"))));

  // Path containment: anti-traversal primitive.
  console.log("contained:", isContained(cwd, join(cwd, "file.txt")));
  console.log("escaped:", isContained(cwd, join(cwd, "..", "outside")));
  console.log(
    "normalized:",
    assertContained(cwd, join(cwd, "sub", "..", "file.txt")),
  );
}

main().catch((error: unknown) => {
  console.error(toError(error).message);
  process.exitCode = 1;
});
