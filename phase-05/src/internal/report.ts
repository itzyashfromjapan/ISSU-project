/**
 * ISSU Phase 5 — Data and Analytics Agents: analytical reporting (§11). The
 * report references the verified findings; it never introduces claims beyond
 * the findings (§11) and is deliberately distinct from Phase 4 research-report
 * synthesis (ARCHITECTURE §4 Layer 7).
 */

import type { AnalyticalFinding, AnalyticalReport } from "./model.js";

/** Build the analytical report from the verified finding set. */
export function buildAnalyticalReport(
  findings: readonly AnalyticalFinding[],
  abstained: boolean,
): AnalyticalReport {
  const lines: string[] = [];
  lines.push("Analytical report (deterministic core).");

  if (abstained) {
    lines.push("");
    lines.push(
      "The analytics task abstained: no analyzable data was available after " +
        "acquisition and preparation. No findings were produced rather than " +
        "fabricating from insufficient data (§9).",
    );
    return { id: "report-1", text: lines.join("\n"), findingIds: [] };
  }

  if (findings.length === 0) {
    lines.push("");
    lines.push(
      "No analytical findings were produced from the prepared datasets.",
    );
    return { id: "report-1", text: lines.join("\n"), findingIds: [] };
  }

  lines.push("");
  lines.push("Findings:");
  for (const finding of findings) {
    lines.push(`${finding.id}: ${finding.text}`);
  }
  return {
    id: "report-1",
    text: lines.join("\n"),
    findingIds: findings.map((finding) => finding.id),
  };
}
