import { describe, expect, it } from "vitest";
import { runResearchTask } from "../src/index.js";
import { makeRoot, removeRoot, writeFixture } from "./helpers.js";

describe("Phase 4 cancellation (§13)", () => {
  it("pre-aborted signal → CANCELLED terminal", async () => {
    const controller = new AbortController();
    controller.abort();
    const result = await runResearchTask(
      { prompt: "Research.", refs: { files: [], directories: [] } },
      { signal: controller.signal },
    );
    expect(result.state).toBe("CANCELLED");
    expect(result.report).toBeUndefined();
    expect(result.claims).toEqual([]);
  });
});

describe("Phase 4 sentence splitting (§12.5)", () => {
  it("splits sentences and skips abbreviations", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(
        root,
        "doc.txt",
        "Dr. Smith said it works. E.g., the system is fast. It is correct.",
      );
      const result = await runResearchTask({
        prompt: "Summarize.",
        refs: { files: [root + "\\doc.txt"], directories: [] },
      });
      expect(result.state).toBe("COMPLETED");
      expect(result.claims.length).toBe(3);
      expect(result.claims[0]?.text).toBe("Dr. Smith said it works.");
    } finally {
      await removeRoot(root);
    }
  });

  it("empty content yields no claims → abstention", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "doc.txt", "   ");
      const result = await runResearchTask({
        prompt: "Summarize.",
        refs: { files: [root + "\\doc.txt"], directories: [] },
      });
      expect(result.state).toBe("PARTIAL");
      expect(result.abstained).toBe(true);
      expect(result.claims).toEqual([]);
    } finally {
      await removeRoot(root);
    }
  });
});

describe("Phase 4 evaluation record (§8.8, §12.11)", () => {
  it("scores all fixed dimensions in [0,1]", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(
        root,
        "doc.txt",
        "The system is reliable. It scales horizontally.",
      );
      const result = await runResearchTask({
        prompt: "Summarize.",
        refs: { files: [root + "\\doc.txt"], directories: [] },
      });
      const dims = result.evaluation.dimensions;
      expect(Object.keys(dims).length).toBe(18);
      for (const [key, value] of Object.entries(dims)) {
        expect(Number(value), key).toBeGreaterThanOrEqual(0);
        expect(Number(value), key).toBeLessThanOrEqual(1);
      }
      expect(dims.humanAssessment).toBe(0);
      expect(result.evaluation.method).toBe("automated");
    } finally {
      await removeRoot(root);
    }
  });
});
