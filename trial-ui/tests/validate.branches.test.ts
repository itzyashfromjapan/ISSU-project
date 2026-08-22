import { describe, it, expect } from "vitest";
import { parseRunInput } from "../src/internal/validate.js";

describe("validate — remaining branches", () => {
  const base = { domain: "business", objective: "ok" };

  it("rejects non-object entries inside inputs", () => {
    const r = parseRunInput({ ...base, inputs: [null] });
    expect(!r.ok && r.error.message).toContain("each input must be an object");
  });

  it("rejects non-array inputs", () => {
    const r = parseRunInput({ ...base, inputs: "nope" });
    expect(!r.ok && r.error.message).toContain("inputs must be an array");
  });

  it("treats null correlationId as absent", () => {
    const r = parseRunInput({ ...base, correlationId: null });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.correlationId).toBeUndefined();
  });

  it("rejects empty domain string", () => {
    const r = parseRunInput({ ...base, domain: "" });
    expect(!r.ok && r.error.message).toContain("domain is required");
  });
});
