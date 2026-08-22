import { describe, expect, it } from "vitest";
import { runResearchTask } from "../src/index.js";
import { makeRoot, removeRoot, writeFixture } from "./helpers.js";

describe("Phase 4 deterministic core — determinism (§15)", () => {
  it("identical inputs produce identical results", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(
        root,
        "doc.txt",
        "The system processes files atomically. It never stores state between runs.",
      );
      const request = {
        prompt: "Summarize the document.",
        refs: { files: [root + "\\doc.txt"], directories: [] },
      } as const;

      const a = await runResearchTask({ ...request });
      const b = await runResearchTask({ ...request });

      expect(a.state).toBe("COMPLETED");
      expect(b.state).toBe("COMPLETED");
      expect(a).toEqual(b);
      expect(a.report).toBe(b.report);
      expect(a.claims).toEqual(b.claims);
      expect(a.evaluation).toEqual(b.evaluation);
      expect(a.evaluation.dimensions.reproducibility).toBe(1);
    } finally {
      await removeRoot(root);
    }
  });
});
