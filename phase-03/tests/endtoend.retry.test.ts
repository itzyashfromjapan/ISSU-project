import type { DecisionProvider, ToolResult } from "@issue/tool-runtime";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createDeterministicProviderStub,
  runIntegrationTask,
} from "../src/index.js";
import {
  makeRoot,
  removeRoot,
  scriptedProvider,
  writeFixture,
} from "./helpers.js";

describe("E2E V9 — executionError retry behavior (§35.6)", () => {
  it("persistent arm: forced executionError retries to maxRetries, then EXHAUST ends terminal FAILED", async () => {
    const root = await makeRoot();
    try {
      const file = join(root, "a.txt");
      await writeFixture(root, "a.txt", "a");
      const stub = createDeterministicProviderStub({
        table: { assessments: new Map([[file, "executionError"]]) },
      });
      const res = await runIntegrationTask({
        root,
        provider: stub,
        refs: { files: [file], directories: [] },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const state = res.value.run.state;
      expect(state.status).toBe("FAILED");
      expect(state.attempts.retries).toBe(2);
      expect(state.lastCorrection).toBe("EXHAUST");
      expect(state.completed.files).not.toContain(file);
    } finally {
      await removeRoot(root);
    }
  });

  it("transient arm: a scripted provider recovers after k retries and the run completes", async () => {
    const root = await makeRoot();
    try {
      const file = join(root, "a.txt");
      await writeFixture(root, "a.txt", "a");
      const scripted = scriptedProvider([
        { assess: "executionError" },
        { assess: "executionError" },
        { assess: "success" },
      ]);
      const res = await runIntegrationTask({
        root,
        provider: scripted.provider,
        refs: { files: [file], directories: [] },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const state = res.value.run.state;
      expect(state.status).toBe("COMPLETED");
      expect(state.attempts.retries).toBe(2);
      expect(state.completed.files).toEqual([file]);
    } finally {
      await removeRoot(root);
    }
  });
});

describe("E2E V10 — same reference retry bound (§35.3)", () => {
  it("the unchanged ActionRef executes exactly maxRetries + 1 times and attempts.retries equals maxRetries", async () => {
    const root = await makeRoot();
    try {
      const file = join(root, "a.txt");
      await writeFixture(root, "a.txt", "a");
      const stub = createDeterministicProviderStub({
        table: { assessments: new Map([[file, "executionError"]]) },
      });
      let executions = 0;
      const counting: DecisionProvider = {
        async selectAction(available, state) {
          return stub.selectAction(available, state);
        },
        async assess(result: ToolResult, state) {
          executions += 1;
          return stub.assess(result, state);
        },
      };
      const res = await runIntegrationTask({
        root,
        provider: counting,
        refs: { files: [file], directories: [] },
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const state = res.value.run.state;
      expect(state.status).toBe("FAILED");
      expect(state.attempts.retries).toBe(2);
      expect(executions).toBe(3);
      expect(state.lastAction?.target).toBe(file);
      expect(state.completed.files).not.toContain(file);
    } finally {
      await removeRoot(root);
    }
  });
});
