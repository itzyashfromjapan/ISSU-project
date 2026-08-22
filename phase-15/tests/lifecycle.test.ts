import { describe, it, expect } from "vitest";
import { runCreativeTask } from "../src/internal/machine.js";
import { createStubProvider } from "../src/internal/provider.js";

describe("runCreativeTask lifecycle (Spec §8)", () => {
  it("FAILED when objective empty", async () => {
    const res = await runCreativeTask({
      objective: "",
      workflow: [{ op: "validate", target: "t" }],
      inputs: [{ id: "1", kind: "inline", content: "x" }],
    });
    expect(res.state).toBe("FAILED");
  });
  it("FAILED when workflow empty", async () => {
    const res = await runCreativeTask({
      objective: "test",
      workflow: [],
      inputs: [{ id: "1", kind: "inline", content: "x" }],
    });
    expect(res.state).toBe("FAILED");
  });
  it("CANCELLED when signal aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const res = await runCreativeTask(
      {
        objective: "test",
        workflow: [{ op: "validate", target: "t" }],
        inputs: [{ id: "1", kind: "inline", content: "x" }],
      },
      { signal: controller.signal },
    );
    expect(res.state).toBe("CANCELLED");
  });
  it("ABSTAINED when no valid inputs", async () => {
    const res = await runCreativeTask({
      objective: "test",
      workflow: [{ op: "validate", target: "t" }],
      inputs: [],
    });
    expect(res.state).toBe("ABSTAINED");
  });
  it("COMPLETED when all approved", async () => {
    const res = await runCreativeTask(
      {
        objective: "test",
        workflow: [{ op: "validate", target: "t" }],
        inputs: [{ id: "1", kind: "inline", content: "x" }],
      },
      { provider: createStubProvider(true) },
    );
    expect(res.state).toBe("COMPLETED");
    expect(res.findings.length).toBe(1);
    expect(res.report).toBeDefined();
  });
  it("PARTIAL when not all approved", async () => {
    const res = await runCreativeTask(
      {
        objective: "test",
        workflow: [{ op: "approve", target: "t" }],
        inputs: [{ id: "1", kind: "inline", content: "x" }],
      },
      { provider: createStubProvider(false) },
    );
    expect(res.state).toBe("PARTIAL");
  });
});
