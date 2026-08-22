import { describe, it, expect } from "vitest";
import { resolveConfig, getDefaultConfig } from "../src/internal/config.js";

describe("determinism (Spec §16)", () => {
  it("identical layers → identical resolved config (including provenance order)", () => {
    const defaults = getDefaultConfig();
    const layers = {
      defaults,
      fileContent: `{"version": "1.0.0", "project": {"name": "demo"}, "logging": {"level": "debug"}}`,
    };
    const a = resolveConfig(layers);
    const b = resolveConfig(layers);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.value).toEqual(b.value);
      expect(a.value.provenance).toEqual(b.value.provenance);
    }
  });

  it("repeated parseArgs is deterministic", async () => {
    const { parseArgs } = await import("../src/internal/cli.js");
    const a = parseArgs(["run", "--analytics", "--config", "./a.jsonc"]);
    const b = parseArgs(["run", "--analytics", "--config", "./a.jsonc"]);
    expect(a).toEqual(b);
  });
});
