import { describe, it, expect } from "vitest";
import { runRoboticsTask } from "../src/internal/machine.js";
import { createStubProvider, stubProvider } from "../src/internal/provider.js";
import type { RoboticsDecisionProvider } from "../src/internal/model.js";

describe("coverage — input kinds and verification paths", () => {
  it("accepts localFile inputs (path present) deterministically", async () => {
    const res = await runRoboticsTask(
      {
        objective: "lf",
        workflow: [{ op: "validate", target: "t" }],
        inputs: [{ id: "f1", kind: "localFile", path: "./data.json" }],
      },
      { provider: createStubProvider(true) },
    );
    expect(res.state).toBe("COMPLETED");
    expect(res.findings[0]?.text).toContain("f1");
  });

  it("drops inputs of unknown kind", async () => {
    const res = await runRoboticsTask({
      objective: "u",
      workflow: [{ op: "validate", target: "t" }],
      inputs: [{ id: "x", kind: "unknown" as never }],
    });
    expect(res.state).toBe("ABSTAINED");
  });

  it("uses the default stubProvider when none is supplied", async () => {
    const res = await runRoboticsTask({
      objective: "default",
      workflow: [{ op: "approve", target: "t" }],
      inputs: [{ id: "d1", kind: "inline", content: "ok" }],
    });
    expect(res.state).toBe("COMPLETED");
    expect(res.findings[0]?.approval.approver).toBe("stub");
  });

  it("FAILED when a provider returns an approval without approver (verification gate)", async () => {
    const broken: RoboticsDecisionProvider = {
      async decideApproval() {
        return { approved: true } as never;
      },
    };
    const res = await runRoboticsTask(
      {
        objective: "v",
        workflow: [{ op: "approve", target: "t" }],
        inputs: [{ id: "1", kind: "inline", content: "x" }],
      },
      { provider: broken },
    );
    expect(res.state).toBe("FAILED");
    expect(res.report).toBeUndefined();
  });

  it("stubProvider direct call returns approved stub", async () => {
    const a = await stubProvider.decideApproval(
      { id: "s", kind: "inline", content: "c" },
      { status: "APPROVING" },
    );
    expect(a.approved).toBe(true);
    expect(a.approver).toBe("stub");
  });
});
