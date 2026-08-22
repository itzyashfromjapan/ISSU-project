import type {
  ActionRef,
  Assessment,
  AvailableAction,
  OutcomeClass,
  TaskState,
  ToolResult,
} from "@issue/tool-runtime";
import { describe, expect, it } from "vitest";
import { createDeterministicProviderStub } from "../src/index.js";

const readRef = (target: string, maxBytes = 64, chunkSize = 16): ActionRef => ({
  operation: "readFile",
  target,
  read: { maxBytes, chunkSize },
});

const listRef = (target: string): ActionRef => ({
  operation: "listDirectory",
  target,
  list: {},
});

const state: TaskState = {
  status: "SELECTING",
  attempts: { retries: 0, corrections: 0, verifications: 0 },
  completed: { files: [], directories: [] },
};

const available = (refs: readonly ActionRef[]): AvailableAction[] =>
  refs.map((ref) => ({ ref }));

function toolResult(
  action: ActionRef,
  classification: OutcomeClass,
): ToolResult {
  if (classification === "success") {
    return {
      ok: true,
      action,
      classification,
      data: { text: "x", bytesRead: 1 },
    };
  }
  return {
    ok: false,
    action,
    classification,
    error: { code: "issue.tool.x", message: "message" },
  };
}

describe("deterministic provider stub (§30)", () => {
  it("baseline selectAction returns the first available action", async () => {
    const stub = createDeterministicProviderStub();
    const refs = [readRef("/a"), readRef("/b")];
    const selected = await stub.selectAction(available(refs), state);
    expect(selected).toEqual(refs[0]);
  });

  it("baseline assess mirrors the result classification", async () => {
    const stub = createDeterministicProviderStub();
    const action = readRef("/a");
    const assessment: Assessment = await stub.assess(
      toolResult(action, "notFound"),
      state,
    );
    expect(assessment).toEqual({ classification: "notFound" });
    const okAssessment: Assessment = await stub.assess(
      toolResult(action, "success"),
      state,
    );
    expect(okAssessment).toEqual({ classification: "success" });
  });

  it("selectionOrder returns the first entry present in the available set", async () => {
    const stub = createDeterministicProviderStub({
      table: { selectionOrder: [readRef("/zzz"), readRef("/c")] },
    });
    const refs = [readRef("/a"), readRef("/c"), readRef("/b")];
    const selected = await stub.selectAction(available(refs), state);
    expect(selected.target).toBe("/c");
  });

  it("selectionOrder entries absent from the available set fall back to the first available action", async () => {
    const stub = createDeterministicProviderStub({
      table: { selectionOrder: [readRef("/zzz")] },
    });
    const refs = [readRef("/a"), readRef("/b")];
    const selected = await stub.selectAction(available(refs), state);
    expect(selected.target).toBe("/a");
  });

  it("selection distinguishes ActionRefs by read options for the same target", async () => {
    const stub = createDeterministicProviderStub({
      table: { selectionOrder: [readRef("/a", 128, 64)] },
    });
    const refs = [readRef("/a", 64, 16), readRef("/a", 128, 64)];
    const selected = await stub.selectAction(available(refs), state);
    expect(selected.read?.maxBytes).toBe(128);
  });

  it("assessments table forces a classification for a target", async () => {
    const stub = createDeterministicProviderStub({
      table: { assessments: new Map([["/a", "notFound"]]) },
    });
    const forced: Assessment = await stub.assess(
      toolResult(readRef("/a"), "success"),
      state,
    );
    expect(forced).toEqual({ classification: "notFound" });
  });

  it("an invalid forced assessment falls back to mirroring", async () => {
    const stub = createDeterministicProviderStub({
      table: { assessments: new Map([["/a", "bogus" as OutcomeClass]]) },
    });
    const assessment: Assessment = await stub.assess(
      toolResult(readRef("/a"), "tooLarge"),
      state,
    );
    expect(assessment).toEqual({ classification: "tooLarge" });
  });

  it("is deterministic: identical inputs yield identical selections and assessments", async () => {
    const stub = createDeterministicProviderStub({
      table: {
        selectionOrder: [readRef("/b")],
        assessments: new Map([["/b", "success"]]),
      },
    });
    const refs = [readRef("/a"), readRef("/b")];
    const firstSelection = await stub.selectAction(available(refs), state);
    const secondSelection = await stub.selectAction(available(refs), state);
    expect(firstSelection).toEqual(secondSelection);

    const action = readRef("/b");
    const firstAssessment = await stub.assess(
      toolResult(action, "success"),
      state,
    );
    const secondAssessment = await stub.assess(
      toolResult(action, "success"),
      state,
    );
    expect(firstAssessment).toEqual(secondAssessment);
  });

  it("selection distinguishes ActionRefs by list options for the same target", async () => {
    const includeHiddenRef: ActionRef = {
      ...listRef("/d"),
      list: { includeHidden: true },
    };
    const stub = createDeterministicProviderStub({
      table: { selectionOrder: [includeHiddenRef] },
    });
    const refs = [listRef("/d"), includeHiddenRef];
    const selected = await stub.selectAction(available(refs), state);
    expect(selected.list?.includeHidden).toBe(true);
  });

  it("selectAction throws defensively on an empty available set", async () => {
    const stub = createDeterministicProviderStub();
    await expect(stub.selectAction([], state)).rejects.toThrow(
      "requires a non-empty available set",
    );
  });
});
