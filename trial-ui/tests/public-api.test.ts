import { describe, it, expect } from "vitest";
import * as barrel from "../src/index.js";
import { VERSION } from "../src/version.js";

describe("public API surface", () => {
  it("exposes the trial-ui surface", () => {
    expect(barrel.DOMAINS).toBeDefined();
    expect(barrel.getDomain).toBeDefined();
    expect(barrel.loadRunner).toBeDefined();
    expect(barrel.parseRunInput).toBeDefined();
    expect(barrel.resolveMode).toBeDefined();
    expect(barrel.buildProvider).toBeDefined();
    expect(barrel.handleRequest).toBeDefined();
    expect(barrel.createTrialServer).toBeDefined();
    expect(barrel.ArrayLogger).toBeDefined();
    expect(barrel.VERSION).toBe(VERSION);
  });

  it("getDomain resolves every whitelisted id and rejects unknown", () => {
    for (const d of barrel.DOMAINS) {
      expect(barrel.getDomain(d.id)?.id).toBe(d.id);
    }
    expect(barrel.getDomain("nope")).toBeUndefined();
  });
});

describe("version module coverage", () => {
  it("VERSION is a semver string", () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
