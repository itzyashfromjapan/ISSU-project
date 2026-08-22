import { describe, it, expect } from "vitest";
import { parseRunInput } from "../src/internal/validate.js";

const valid = {
  domain: "business",
  objective: "Process invoices",
  inputs: [{ id: "doc1", content: "total: 1200" }],
};

describe("parseRunInput — fail-closed UI validation", () => {
  it("accepts a minimal valid request and injects the default workflow", () => {
    const r = parseRunInput(valid);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.domain).toBe("business");
      const wf = r.value.workflow as Array<{ op: string }>;
      expect(wf.map((w) => w.op)).toEqual(["validate", "approve"]);
    }
  });

  it("rejects non-object bodies", () => {
    expect(parseRunInput("x").ok).toBe(false);
    expect(parseRunInput(null).ok).toBe(false);
    expect(parseRunInput([1]).ok).toBe(false);
  });

  it("requires domain", () => {
    const r = parseRunInput({ objective: "x" });
    expect(!r.ok && r.error.message).toContain("domain is required");
  });

  it("rejects empty / oversized / control-char objectives", () => {
    expect(parseRunInput({ ...valid, objective: "   " }).ok).toBe(false);
    expect(parseRunInput({ ...valid, objective: "a".repeat(201) }).ok).toBe(
      false,
    );
    const ctrl = JSON.parse(JSON.stringify(valid));
    ctrl.objective = "bad\u0007objective";
    const r = parseRunInput(ctrl);
    expect(!r.ok && r.error.message).toContain("control characters");
  });

  it("caps inputs at 10 and rejects non-inline kinds", () => {
    const many = {
      ...valid,
      inputs: Array.from({ length: 11 }, (_, i) => ({
        id: `i${i}`,
        content: "c",
      })),
    };
    expect(parseRunInput(many).ok).toBe(false);

    const lf = {
      ...valid,
      inputs: [{ id: "f", kind: "localFile", path: "./x" }],
    };
    const r = parseRunInput(lf);
    expect(!r.ok && r.error.message).toContain(
      "only inline inputs are allowed",
    );
  });

  it("enforces id shape and content bounds", () => {
    const badId = { ...valid, inputs: [{ id: "bad id!", content: "c" }] };
    expect(parseRunInput(badId).ok).toBe(false);

    const emptyContent = { ...valid, inputs: [{ id: "i1", content: "  " }] };
    expect(parseRunInput(emptyContent).ok).toBe(false);

    const longContent = {
      ...valid,
      inputs: [{ id: "i1", content: "x".repeat(4001) }],
    };
    expect(parseRunInput(longContent).ok).toBe(false);
  });

  it("enforces correlationId shape when present", () => {
    const bad = parseRunInput({ ...valid, correlationId: "has space" });
    expect(bad.ok).toBe(false);
    const good = parseRunInput({ ...valid, correlationId: "trial-001" });
    expect(good.ok && good.value.correlationId).toBe("trial-001");
  });
});
