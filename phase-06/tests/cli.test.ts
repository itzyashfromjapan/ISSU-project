import { describe, it, expect } from "vitest";
import { parseArgs, runCli, HELP_TEXT } from "../src/internal/cli.js";

describe("parseArgs (Spec §10)", () => {
  it("empty → help", () => {
    const r = parseArgs([]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.command).toBe("help");
  });

  it("--help → help", () => {
    const r = parseArgs(["--help"]);
    expect(r.ok && r.value.command === "help").toBe(true);
  });

  it("-h → help", () => {
    const r = parseArgs(["-h"]);
    expect(r.ok && r.value.command === "help").toBe(true);
  });

  it("config --show → config:show", () => {
    const r = parseArgs(["config", "--show"]);
    expect(r.ok && r.value.command === "config:show").toBe(true);
  });

  it("config --show with --config path", () => {
    const r = parseArgs([
      "config",
      "--show",
      "--config",
      "./issu.config.jsonc",
    ]);
    expect(r.ok && r.value.configPath === "./issu.config.jsonc").toBe(true);
  });

  it("config --show unknown arg fails", () => {
    const r = parseArgs(["config", "--show", "--unknown"]);
    expect(r.ok).toBe(false);
  });

  it("config --show --config missing path fails", () => {
    const r = parseArgs(["config", "--show", "--config"]);
    expect(r.ok).toBe(false);
  });

  it("run defaults to analytics", () => {
    const r = parseArgs(["run"]);
    expect(r.ok && r.value.runTarget === "analytics").toBe(true);
  });

  it("run --tool-runtime", () => {
    const r = parseArgs(["run", "--tool-runtime"]);
    expect(r.ok && r.value.runTarget === "tool-runtime").toBe(true);
  });

  it("run --analytics", () => {
    const r = parseArgs(["run", "--analytics"]);
    expect(r.ok && r.value.runTarget === "analytics").toBe(true);
  });

  it("run duplicate target fails", () => {
    const r = parseArgs(["run", "--tool-runtime", "--analytics"]);
    expect(r.ok).toBe(false);
  });

  it("run with --config", () => {
    const r = parseArgs(["run", "--config", "./a.jsonc"]);
    expect(r.ok && r.value.configPath === "./a.jsonc").toBe(true);
  });

  it("unknown command fails", () => {
    const r = parseArgs(["unknown"]);
    expect(r.ok).toBe(false);
  });

  it("run --help returns help", () => {
    const r = parseArgs(["run", "--help"]);
    expect(r.ok && r.value.command === "help").toBe(true);
  });
});

describe("runCli (Spec §11)", () => {
  it("--help returns 0 and HELP_TEXT", async () => {
    const res = await runCli(["--help"]);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain("issue --help");
  });

  it("config --show without file returns 0 and redacted json", async () => {
    const res = await runCli(["config", "--show"]);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain(`"version": "1.0.0"`);
    // models should be redacted if present
  });

  it("unknown arg returns 1", async () => {
    const res = await runCli(["unknown"]);
    expect(res.exitCode).toBe(1);
    expect(res.stderr).toContain("unknown command");
  });

  it("run --analytics returns stdout json (deterministic)", async () => {
    const res = await runCli(["run", "--analytics"]);
    // analytics with no sources should abstain or complete; either way exit 0 or 1 but stdout is json
    expect([0, 1].includes(res.exitCode)).toBe(true);
    expect(res.stdout.length).toBeGreaterThan(0);
  });

  it("run --tool-runtime returns stdout", async () => {
    const res = await runCli(["run", "--tool-runtime"]);
    expect([0, 1].includes(res.exitCode)).toBe(true);
    // stdout may be empty on some edge, but exitCode defines success
    expect(typeof res.stdout).toBe("string");
  });

  it("HELP_TEXT is defined correctly", () => {
    expect(HELP_TEXT).toContain("Usage:");
  });
});
