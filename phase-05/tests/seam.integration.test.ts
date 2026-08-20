import { describe, expect, it } from "vitest";
import { runAnalyticsTask } from "../src/index.js";
import { makeRoot, mkdirFixture, removeRoot, writeFixture } from "./helpers.js";

describe("Phase 5 seam integration (§5 Acquisition via Phase 2/3)", () => {
  it("reads a localFile CSV and computes over it", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "data.csv", "name,score\na,1\nb,2\nc,3");
      const result = await runAnalyticsTask({
        objective: "Analyze the file.",
        sources: [
          {
            id: "f1",
            name: "data.csv",
            kind: "localFile",
            path: root + "\\data.csv",
          },
        ],
        plan: [
          { op: "count", dataset: "f1" },
          { op: "mean", dataset: "f1", field: "score" },
        ],
      });
      expect(result.state).toBe("COMPLETED");
      expect(result.findings.length).toBe(2);
      const texts = result.findings.map((f) => f.text);
      expect(texts).toContain('Count of records in dataset "f1" = 3');
      expect(texts).toContain('Mean of "score" across dataset "f1" = 2');
      expect(result.findings[0]?.provenance.sourceIds).toEqual(["f1"]);
    } finally {
      await removeRoot(root);
    }
  });

  it("reads a localFile in a nested directory", async () => {
    const root = await makeRoot();
    try {
      await mkdirFixture(root, "a\\b");
      await writeFixture(root, "a\\b\\nested.csv", "value\n10\n20\n30");
      const result = await runAnalyticsTask({
        objective: "Analyze the nested file.",
        sources: [
          {
            id: "f2",
            name: "nested.csv",
            kind: "localFile",
            path: root + "\\a\\b\\nested.csv",
          },
        ],
        plan: [{ op: "sum", dataset: "f2", field: "value" }],
      });
      expect(result.state).toBe("COMPLETED");
      expect(result.findings[0]?.text).toContain("= 60");
    } finally {
      await removeRoot(root);
    }
  });

  it("handles CRLF line endings", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "crlf.csv", "name,score\r\na,4\r\nb,6\r\n");
      const result = await runAnalyticsTask({
        objective: "Analyze.",
        sources: [
          {
            id: "f3",
            name: "crlf.csv",
            kind: "localFile",
            path: root + "\\crlf.csv",
          },
        ],
        plan: [{ op: "mean", dataset: "f3", field: "score" }],
      });
      expect(result.state).toBe("COMPLETED");
      expect(result.findings[0]?.text).toContain("= 5");
    } finally {
      await removeRoot(root);
    }
  });
});
