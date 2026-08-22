/**
 * ISSU Phase 4 — Research: claim / evidence production (§12.5) and support
 * classification (§10.2). Deterministic atomic-fact decomposition: each source
 * content is split into atomic sentences; each sentence becomes an atomic
 * claim grounded directly in its source with a direct evidence link.
 */

import type { Claim, EvidenceLink, SourceReference } from "./model.js";

const ABBREVIATIONS: ReadonlySet<string> = new Set([
  "dr",
  "mr",
  "mrs",
  "ms",
  "prof",
  "sr",
  "jr",
  "etc",
  "e.g",
  "i.e",
  "vs",
  "no",
  "fig",
  "vol",
  "p",
  "pp",
  "approx",
  "inc",
  "ltd",
  "co",
  "st",
  "mt",
  "gen",
  "col",
  "capt",
  "rev",
  "hon",
  "corp",
  "dept",
  "est",
  "misc",
]);

function isAbbreviation(text: string, index: number): boolean {
  let start = index - 1;
  while (start >= 0 && /[A-Za-z]/.test(text[start] as string)) {
    start -= 1;
  }
  const token = text.slice(start + 1, index).toLowerCase();
  return ABBREVIATIONS.has(token);
}

/**
 * Deterministic sentence splitter. Splits on `.`/`!`/`?` when followed by
 * whitespace or end-of-string, skipping known abbreviations and decimal
 * numbers.
 */
export function splitSentences(text: string): readonly string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) return [];
  const parts: string[] = [];
  let start = 0;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i] as string;
    if (ch === "." || ch === "!" || ch === "?") {
      if (isAbbreviation(normalized, i)) continue;
      const prev = normalized[i - 1];
      const isDecimal = ch === "." && prev !== undefined && /[0-9]/.test(prev);
      if (isDecimal) continue;
      const next = normalized[i + 1];
      if (next === undefined || /\s/.test(next)) {
        const sentence = normalized.slice(start, i + 1).trim();
        if (sentence.length > 0) parts.push(sentence);
        start = i + 1;
      }
    }
  }
  const tail = normalized.slice(start).trim();
  if (tail.length > 0) parts.push(tail);
  return parts;
}

function normalizeClaimText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/, "")
    .trim();
}

export interface ClaimProduction {
  readonly claims: readonly Claim[];
  readonly evidence: readonly EvidenceLink[];
}

/**
 * Produce atomic claims + evidence links from retrieved sources.
 *
 * - Every sentence of a source becomes one atomic claim (idempotent).
 * - Identical normalized claim text across multiple sources is merged into a
 *   single multi-source claim (multi-source attribution, §8.3).
 * - Support is `SUPPORTED` because the claim is quoted directly from its
 *   source (evidence-grounded by construction). `confidence` is intentionally
 *   omitted: the confidence scoring formula is §20 #5 UNRESOLVED.
 */
export function produceClaimsAndEvidence(
  sources: readonly SourceReference[],
  contents: ReadonlyMap<string, string>,
): ClaimProduction {
  interface Accumulator {
    readonly text: string;
    readonly sourceIds: readonly string[];
    readonly locations: readonly string[];
  }
  const byNormalized = new Map<string, Accumulator>();
  const order: string[] = [];

  for (const source of sources) {
    const content = contents.get(source.id) ?? "";
    const sentences = splitSentences(content);
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i] as string;
      const key = normalizeClaimText(sentence);
      if (key.length === 0) continue;

      const existing = byNormalized.get(key);
      const location = `sentence:${i + 1}`;
      if (existing === undefined) {
        byNormalized.set(key, {
          text: sentence,
          sourceIds: [source.id],
          locations: [location],
        });
        order.push(key);
      } else if (!existing.sourceIds.includes(source.id)) {
        byNormalized.set(key, {
          text: existing.text,
          sourceIds: [...existing.sourceIds, source.id],
          locations: [...existing.locations, location],
        });
      } else {
        byNormalized.set(key, {
          text: existing.text,
          sourceIds: existing.sourceIds,
          locations: [...existing.locations, location],
        });
      }
    }
  }

  const claims: Claim[] = [];
  const evidence: EvidenceLink[] = [];
  for (let i = 0; i < order.length; i++) {
    const key = order[i] as string;
    const acc = byNormalized.get(key);
    if (acc === undefined) continue;
    const claimId = `claim-${i + 1}`;
    const claimSources = acc.sourceIds
      .map((id) => sources.find((source) => source.id === id))
      .filter((source): source is SourceReference => source !== undefined);
    claims.push({
      id: claimId,
      text: acc.text,
      support: "SUPPORTED",
      sources: claimSources,
    });
    for (let j = 0; j < acc.sourceIds.length; j++) {
      const location = acc.locations[j];
      evidence.push({
        claimId,
        sourceId: acc.sourceIds[j] as string,
        ...(location !== undefined ? { location } : {}),
        kind: "direct",
        strength: "SUPPORTED",
      });
    }
  }

  return { claims, evidence };
}

/**
 * Deterministic claim verification (§12.5). Verifies that every claim has at
 * least one evidence link and that every link resolves to an existing claim
 * and source. Claims without any evidence link are reclassified
 * `UNSUPPORTED`; claims whose evidence is only secondary are `UNCERTAIN`.
 */
export function verifyClaims(
  claims: readonly Claim[],
  evidence: readonly EvidenceLink[],
  sourceIds: ReadonlySet<string>,
): readonly Claim[] {
  const claimIds = new Set(claims.map((claim) => claim.id));
  return claims.map((claim) => {
    const links = evidence.filter((link) => link.claimId === claim.id);
    const resolved = links.filter(
      (link) => sourceIds.has(link.sourceId) && claimIds.has(link.claimId),
    );
    if (resolved.length === 0) {
      return { ...claim, support: "UNSUPPORTED" };
    }
    if (resolved.every((link) => link.kind === "secondary")) {
      return { ...claim, support: "UNCERTAIN" };
    }
    return claim;
  });
}
