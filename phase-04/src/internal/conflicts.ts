/**
 * ISSU Phase 4 — Research: deterministic cross-document conflict detection
 * (§8.7, §12.7). Contradictions are surfaced as `ConflictRecord`s, never
 * silently flattened (§10.4, Q4.13).
 *
 * Deterministic signals (§12.7):
 * - `contradiction`: two claims from different sources with directly opposing
 *   polarity (one negated, one not, over the same normalized word set).
 * - `weak-signal`: a claim grounded in exactly one source (no corroboration).
 * - `gap`: a claim whose support is not `SUPPORTED` (insufficient evidence,
 *   §12.9 — surfaced as a gap rather than silent completion).
 */

import type { Claim, ConflictRecord } from "./model.js";

const NEGATION_WORDS: ReadonlySet<string> = new Set(["not", "never", "no"]);

function normalizedWords(text: string): readonly string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
}

function stripNegation(words: readonly string[]): string {
  return words.filter((word) => !NEGATION_WORDS.has(word)).join(" ");
}

function isContradictionPair(a: string, b: string): boolean {
  const wa = normalizedWords(a);
  const wb = normalizedWords(b);
  const negA = wa.some((word) => NEGATION_WORDS.has(word));
  const negB = wb.some((word) => NEGATION_WORDS.has(word));
  if (negA === negB) return false;
  return stripNegation(wa) === stripNegation(wb);
}

function distinctSourceIds(claims: readonly Claim[]): readonly string[] {
  const ids = new Set<string>();
  for (const claim of claims) {
    for (const source of claim.sources) ids.add(source.id);
  }
  return [...ids];
}

/**
 * Detect deterministic conflicts across claims/evidence. All records reference
 * existing claims and sources (§8.7). Returns an empty array when none are
 * detected (§8.6).
 */
export function detectConflicts(
  claims: readonly Claim[],
): readonly ConflictRecord[] {
  const records: ConflictRecord[] = [];
  let seq = 0;

  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i] as Claim;

    if (claim.support !== "SUPPORTED") {
      seq += 1;
      records.push({
        id: `conflict-${seq}`,
        kind: "gap",
        claimIds: [claim.id],
        sourceIds: distinctSourceIds([claim]),
        description: `Claim "${claim.text}" lacks sufficient supporting evidence and is classified ${claim.support}; the gap is surfaced rather than silently completed.`,
      });
    }

    if (claim.sources.length === 1) {
      seq += 1;
      records.push({
        id: `conflict-${seq}`,
        kind: "weak-signal",
        claimIds: [claim.id],
        sourceIds: distinctSourceIds([claim]),
        description: `Claim "${claim.text}" is grounded in a single source (${claim.sources[0]?.id ?? "unknown"}); no corroboration is available.`,
      });
    }
  }

  for (let i = 0; i < claims.length; i++) {
    const a = claims[i] as Claim;
    for (let j = i + 1; j < claims.length; j++) {
      const b = claims[j] as Claim;
      const sourcesA = new Set(a.sources.map((source) => source.id));
      const sourcesB = new Set(b.sources.map((source) => source.id));
      const sharesSource = [...sourcesA].some((id) => sourcesB.has(id));
      if (sharesSource) continue;
      if (!isContradictionPair(a.text, b.text)) continue;
      seq += 1;
      records.push({
        id: `conflict-${seq}`,
        kind: "contradiction",
        claimIds: [a.id, b.id],
        sourceIds: distinctSourceIds([a, b]),
        description: `Claims "${a.text}" and "${b.text}" from different sources contradict one another; both are surfaced.`,
      });
    }
  }

  return records;
}
