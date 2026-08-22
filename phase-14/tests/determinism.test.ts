import { describe, it, expect } from "vitest";
import { runEngineeringTask } from "../src/internal/machine.js";
import { createStubProvider } from "../src/internal/provider.js";

describe("determinism (Spec §13)", () => {
  it("identical inputs → identical result with stub provider", async () => {
    const req = {
      objective: "test",
      workflow: [{ op: "validate" as const, target: "t" }],
      inputs: [{ id: "1", kind: "inline" as const, content: "x" }],
    };
    const provider = createStubProvider(true);
    const a = await runEngineeringTask(req, { provider });
    const b = await runEngineeringTask(req, { provider });
    expect(a.state).toBe(b.state);
    expect(a.findings.length).toBe(b.findings.length);
    expect(JSON.stringify(a.findings)).toBe(JSON.stringify(b.findings));
  });
});
