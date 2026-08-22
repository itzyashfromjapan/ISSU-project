import { describe, expect, it } from "vitest";
import { runResearchTask } from "../src/index.js";
import { makeRoot, mkdirFixture, removeRoot, writeFixture } from "./helpers.js";

describe("Phase 4 seam integration (§12.2)", () => {
  it("retrieves a single file through the Phase 3 seam", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "Alpha is true. Beta is false.");
      const result = await runResearchTask({
        prompt: "Report on a.txt.",
        refs: { files: [root + "\\a.txt"], directories: [] },
      });
      expect(result.state).toBe("COMPLETED");
      expect(result.sources.length).toBe(1);
      expect(result.claims.length).toBe(2);
    } finally {
      await removeRoot(root);
    }
  });

  it("retrieves all files in a directory (non-recursive)", async () => {
    const root = await makeRoot();
    try {
      await mkdirFixture(root, "docs");
      await mkdirFixture(root, "docs\\nested");
      await writeFixture(root, "docs\\one.txt", "One sentence here.");
      await writeFixture(root, "docs\\two.txt", "Another sentence here.");
      await writeFixture(root, "docs\\nested\\three.txt", "Nested ignored.");
      const result = await runResearchTask({
        prompt: "Read docs.",
        refs: { files: [], directories: [root + "\\docs"] },
      });
      expect(result.state).toBe("COMPLETED");
      expect(result.sources.length).toBe(2);
      expect(result.sources.map((s) => s.title).sort()).toEqual([
        "one.txt",
        "two.txt",
      ]);
    } finally {
      await removeRoot(root);
    }
  });

  it("honors includeHidden when listing directories", async () => {
    const root = await makeRoot();
    try {
      await mkdirFixture(root, "docs");
      await writeFixture(root, "docs\\.hidden.txt", "Hidden content.");
      await writeFixture(root, "docs\\visible.txt", "Visible content.");
      const hidden = await runResearchTask({
        prompt: "Read docs.",
        refs: { files: [], directories: [root + "\\docs"] },
        includeHidden: true,
      });
      const notHidden = await runResearchTask({
        prompt: "Read docs.",
        refs: { files: [], directories: [root + "\\docs"] },
      });
      expect(hidden.sources.length).toBe(2);
      expect(notHidden.sources.length).toBe(1);
      expect(notHidden.sources[0]?.title).toBe("visible.txt");
    } finally {
      await removeRoot(root);
    }
  });

  it("multi-source attribution: identical sentence across two files becomes one claim", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "The earth is round.");
      await writeFixture(root, "b.txt", "The earth is round.");
      const result = await runResearchTask({
        prompt: "Compare sources.",
        refs: { files: [root + "\\a.txt", root + "\\b.txt"], directories: [] },
      });
      expect(result.state).toBe("COMPLETED");
      expect(result.claims.length).toBe(1);
      expect(result.claims[0]?.sources.length).toBe(2);
      expect(result.claims[0]?.support).toBe("SUPPORTED");
      expect(result.evidence.length).toBe(2);
    } finally {
      await removeRoot(root);
    }
  });

  it("missing file → non-recoverable → FAILED", async () => {
    const root = await makeRoot();
    try {
      const result = await runResearchTask({
        prompt: "Read missing.",
        refs: { files: [root + "\\missing.txt"], directories: [] },
      });
      expect(result.state).toBe("FAILED");
      expect(result.report).toBeUndefined();
      expect(result.claims).toEqual([]);
      expect(result.evaluation.dimensions.failureTolerance).toBe(0);
    } finally {
      await removeRoot(root);
    }
  });
});
