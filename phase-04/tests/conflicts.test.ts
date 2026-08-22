import { describe, expect, it } from "vitest";
import { runResearchTask } from "../src/index.js";
import { makeRoot, removeRoot, writeFixture } from "./helpers.js";

describe("Phase 4 conflict detection (§12.7, §10.4)", () => {
  it("detects a cross-document contradiction and surfaces it", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "The sky is blue.");
      await writeFixture(root, "b.txt", "The sky is not blue.");
      const result = await runResearchTask({
        prompt: "Compare claims.",
        refs: { files: [root + "\\a.txt", root + "\\b.txt"], directories: [] },
      });
      const contradictions = result.conflicts.filter(
        (conflict) => conflict.kind === "contradiction",
      );
      expect(contradictions.length).toBe(1);
      expect(contradictions[0]?.claimIds.length).toBe(2);
      expect(contradictions[0]?.sourceIds.length).toBe(2);
      expect(result.evaluation.dimensions.contradictionHandling).toBe(1);
    } finally {
      await removeRoot(root);
    }
  });

  it("same claim corroborated across sources is not a contradiction", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "The earth is round.");
      await writeFixture(root, "b.txt", "The earth is round.");
      const result = await runResearchTask({
        prompt: "Compare claims.",
        refs: { files: [root + "\\a.txt", root + "\\b.txt"], directories: [] },
      });
      const contradictions = result.conflicts.filter(
        (conflict) => conflict.kind === "contradiction",
      );
      expect(contradictions.length).toBe(0);
    } finally {
      await removeRoot(root);
    }
  });

  it("single-source claims produce weak-signal records", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "The sky is blue.");
      await writeFixture(root, "b.txt", "Rocks are heavy.");
      const result = await runResearchTask({
        prompt: "Compare claims.",
        refs: { files: [root + "\\a.txt", root + "\\b.txt"], directories: [] },
      });
      const weak = result.conflicts.filter(
        (conflict) => conflict.kind === "weak-signal",
      );
      expect(weak.length).toBe(2);
      expect(weak[0]?.sourceIds.length).toBe(1);
    } finally {
      await removeRoot(root);
    }
  });

  it("claims without direct evidence are not silently dropped", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "a.txt", "The sky is blue.");
      await writeFixture(root, "b.txt", "Rocks are heavy.");
      const result = await runResearchTask({
        prompt: "Compare claims.",
        refs: { files: [root + "\\a.txt", root + "\\b.txt"], directories: [] },
      });
      expect(result.claims.length).toBe(2);
      for (const claim of result.claims) {
        expect(claim.support).toBe("SUPPORTED");
        expect(claim.sources.length).toBe(1);
      }
      expect(result.evidence.length).toBe(2);
    } finally {
      await removeRoot(root);
    }
  });
});
