#!/usr/bin/env node
/**
 * ISSU Phase 6 — CLI entry-point (bin: issue).
 * Minimal, zero-dependency, uses runCli.
 */

import { runCli } from "../internal/cli.js";

const argv = process.argv.slice(2);
const result = await runCli(argv);
if (result.stdout) process.stdout.write(result.stdout + "\n");
if (result.stderr) process.stderr.write(result.stderr + "\n");
process.exit(result.exitCode);
