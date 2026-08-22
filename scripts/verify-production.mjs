#!/usr/bin/env node
/**
 * ISSU v0.2 release gates (repository-level production verification).
 * Stdlib-only. Exit 0 = all gates pass; exit 1 = any gate fails.
 *
 * Gates:
 *   1. secret-scan    — credential/private-key patterns across tracked files
 *   2. thresholds     — every workspace config enforces >=80 on all four dims
 *   3. boundaries     — no deep imports (@issue/x/dist, @issue/x/internal), no require() in src
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`[release-gates] FAIL: ${msg}`);
};
const pass = (msg) => console.log(`[release-gates] PASS: ${msg}`);

function trackedFiles() {
  return execSync("git ls-files", { encoding: "utf8", cwd: root })
    .split("\n")
    .filter(Boolean);
}

// ---- Gate 1: secret scan -------------------------------------------------
const SECRET_PATTERNS = [
  [/sk-[a-zA-Z0-9]{20}/, "OpenAI-style key"],
  [/ghp_[a-zA-Z0-9]{20}/, "GitHub PAT"],
  [/AKIA[0-9A-Z]{16}/, "AWS access key id"],
  [/-----BEGIN [A-Z]+ PRIVATE KEY-----/, "private key block"],
];
const secretHits = [];
for (const f of trackedFiles()) {
  let content;
  try {
    content = readFileSync(join(root, f), "utf8");
  } catch {
    continue;
  }
  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(content)) secretHits.push(`${f} (${label})`);
  }
}
if (secretHits.length > 0) {
  for (const h of secretHits) fail(`secret-scan hit: ${h}`);
} else {
  pass(`secret-scan clean across ${trackedFiles().length} tracked files`);
}

// ---- Gate 2: coverage thresholds ----------------------------------------
const vitestConfigs = trackedFiles().filter(
  (f) => /^phase-[^/]+\/vitest\.config\.ts$/.test(f) || f === "platform/vitest.config.ts",
);
if (vitestConfigs.length === 0) fail("no vitest configs found");
for (const f of vitestConfigs) {
  const text = readFileSync(join(root, f), "utf8");
  const grab = (key) => {
    const m = text.match(new RegExp(`${key}:\\s*(\\d+)`));
    return m ? Number(m[1]) : -1;
  };
  for (const dim of ["lines", "statements", "functions", "branches"]) {
    const v = grab(dim);
    if (v < 80) fail(`${f}: ${dim} threshold ${v} < 80`);
  }
}
if (failures === 0) pass(`thresholds >= 80 in ${vitestConfigs.length} workspace configs`);

// ---- Gate 3: import boundaries ------------------------------------------
// Flags REAL module-graph edges only. String literals used by Phase 09's
// deep-import rejection probe (node -e "import('@issue/x/dist/…')") are
// intentionally permitted — they verify the block, they are not imports.
const srcFiles = trackedFiles().filter((f) => /^phase-[^/]+\/src\/.*\.ts$/.test(f) || /^platform\/src\/.*\.ts$/.test(f));
const DEEP_IMPORT_RE = /(?:^|\n)\s*(?:import|export)[^;\n]*from\s*["']@issue\/[a-z0-9-]+\/(?:dist|internal)/;
const REQUIRE_DEEP_RE = /require\(\s*["']@issue\/[a-z0-9-]+\/(?:dist|internal)/;
const REQUIRE_ANY_RE = /\brequire\(\s*["']/;
const boundaryHits = [];
for (const f of srcFiles) {
  const content = readFileSync(join(root, f), "utf8");
  if (DEEP_IMPORT_RE.test(content)) boundaryHits.push(`${f}: static dist/internal import`);
  if (/@issue\/[a-z0-9-]+\/internal/.test(content)) boundaryHits.push(`${f}: internal path reference`);
  if (REQUIRE_DEEP_RE.test(content)) boundaryHits.push(`${f}: require() of dist/internal`);
  if (REQUIRE_ANY_RE.test(content)) boundaryHits.push(`${f}: require() usage`);
}
if (boundaryHits.length > 0) {
  for (const h of boundaryHits) fail(`boundary violation: ${h}`);
} else {
  pass(`boundary audit clean across ${srcFiles.length} src files`);
}

// ---- Summary -------------------------------------------------------------
console.log("");
if (failures > 0) {
  console.error(`[release-gates] RESULT: FAIL (${failures} finding(s))`);
  process.exit(1);
}
console.log("[release-gates] RESULT: PASS");
