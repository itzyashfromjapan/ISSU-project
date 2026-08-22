import { createLogger } from "@issue/foundation";
import { describe, expect, it } from "vitest";
import { runResearchTask } from "../src/index.js";
import {
  makeRoot,
  mkdirFixture,
  recordingResearchProvider,
  removeRoot,
  writeFixture,
} from "./helpers.js";
import type { ResearchDecisionProvider } from "../src/index.js";

describe("Phase 4 lifecycle (§11, §12.9)", () => {
  it("no refs → abstention, terminal PARTIAL, abstained=true", async () => {
    const result = await runResearchTask({ prompt: "Research this." });
    expect(result.state).toBe("PARTIAL");
    expect(result.abstained).toBe(true);
    expect(result.claims).toEqual([]);
    expect(result.sources).toEqual([]);
    expect(result.conflicts).toEqual([]);
    expect(result.report).toContain("abstained");
    expect(result.evaluation.method).toBe("automated");
    expect(result.evaluation.dimensions.abstention).toBe(1);
  });

  it("empty directory → abstention, terminal PARTIAL", async () => {
    const root = await makeRoot();
    try {
      await mkdirFixture(root, "empty");
      const result = await runResearchTask({
        prompt: "Research this.",
        refs: { files: [], directories: [root + "\\empty"] },
      });
      expect(result.state).toBe("PARTIAL");
      expect(result.abstained).toBe(true);
      expect(result.claims).toEqual([]);
    } finally {
      await removeRoot(root);
    }
  });

  it("valid file → COMPLETED with claims, evidence, and report", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(
        root,
        "doc.txt",
        "The system processes files atomically. It never stores state between runs.",
      );
      const result = await runResearchTask({
        prompt: "Summarize the document.",
        refs: { files: [root + "\\doc.txt"], directories: [] },
      });
      expect(result.state).toBe("COMPLETED");
      expect(result.abstained).toBeUndefined();
      expect(result.claims.length).toBe(2);
      expect(result.claims[0]).toMatchObject({
        support: "SUPPORTED",
      });
      expect(result.evidence.length).toBe(2);
      expect(result.evidence[0]).toMatchObject({
        kind: "direct",
        strength: "SUPPORTED",
      });
      expect(result.sources.length).toBe(1);
      expect(result.sources[0]).toMatchObject({
        role: "primary",
        freshness: "unknown",
      });
      expect(result.report).toContain("[1]");
      expect(result.report).toContain("doc.txt");
    } finally {
      await removeRoot(root);
    }
  });

  it("custom provider seam is consulted during the run", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "doc.txt", "The sky is blue.");
      const provider = recordingResearchProvider({
        async selectSource(available) {
          const first = available[0];
          if (first === undefined) throw new Error("no sources");
          return first;
        },
        async selectClaimToVerify(claims) {
          const first = claims[0];
          if (first === undefined) throw new Error("no claims");
          return first;
        },
        async assess(claim) {
          return {
            support: claim.sources.length > 0 ? "SUPPORTED" : "UNCERTAIN",
          };
        },
      } satisfies ResearchDecisionProvider);
      const result = await runResearchTask(
        {
          prompt: "Research.",
          refs: { files: [root + "\\doc.txt"], directories: [] },
        },
        { provider: provider.provider },
      );
      expect(result.state).toBe("COMPLETED");
      expect(provider.calls.assess).toBeGreaterThanOrEqual(1);
    } finally {
      await removeRoot(root);
    }
  });

  it("invalid request → FAILED terminal", async () => {
    const result = await runResearchTask({ prompt: "" });
    expect(result.state).toBe("FAILED");
    expect(result.report).toBeUndefined();
    expect(result.claims).toEqual([]);
  });

  it("logger is accepted as an option", async () => {
    const root = await makeRoot();
    try {
      await writeFixture(root, "doc.txt", "Hello world.");
      const logger = createLogger({ level: "error" });
      const result = await runResearchTask(
        {
          prompt: "Research.",
          refs: { files: [root + "\\doc.txt"], directories: [] },
        },
        { logger },
      );
      expect(result.state).toBe("COMPLETED");
    } finally {
      await removeRoot(root);
    }
  });
});
