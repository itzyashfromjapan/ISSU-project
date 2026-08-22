/**
 * ISSU Phase 4 — Research: deterministic evidence-grounded synthesis (§12.10).
 * The report quotes validated claims with inline numbered citation markers `[n]`
 * resolved against the task result's `sources` array (§10.1). Synthesis never
 * introduces claims beyond the evidence set (§12.10); the deterministic core
 * assembles grounded statements, so it cannot fabricate.
 */

import type { Claim, SourceReference } from "./model.js";

function citationMarkers(
  claim: Claim,
  sources: readonly SourceReference[],
): string {
  const ids = new Map<string, number>();
  for (let i = 0; i < sources.length; i++) {
    ids.set((sources[i] as SourceReference).id, i + 1);
  }
  const markers = claim.sources
    .map((source) => ids.get(source.id))
    .filter((index): index is number => index !== undefined)
    .sort((x, y) => x - y)
    .map((index) => `[${index}]`)
    .join("");
  return markers;
}

/**
 * Assemble the deterministic evidence-grounded report. When the task abstained
 * (§12.9), the report explains the abstention instead of synthesizing claims
 * from insufficient evidence.
 */
export function synthesizeReport(
  claims: readonly Claim[],
  sources: readonly SourceReference[],
  abstained: boolean,
): string {
  const lines: string[] = [];
  lines.push("Evidence-grounded research report (deterministic core).");

  if (abstained) {
    lines.push("");
    lines.push(
      "The task abstained: evidence was insufficient to support any claim. " +
        "No claims were synthesized rather than fabricating from insufficient evidence.",
    );
    return lines.join("\n");
  }

  if (sources.length > 0) {
    lines.push("");
    lines.push("Sources:");
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i] as SourceReference;
      lines.push(`${i + 1}. ${source.title} (${source.id})`);
    }
  }

  if (claims.length === 0) {
    lines.push("");
    lines.push("No claims were produced from the retrieved evidence.");
    return lines.join("\n");
  }

  lines.push("");
  lines.push("Claims:");
  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i] as Claim;
    const markers = citationMarkers(claim, sources);
    lines.push(`${i + 1}. ${claim.text}${markers}`);
  }

  return lines.join("\n");
}
