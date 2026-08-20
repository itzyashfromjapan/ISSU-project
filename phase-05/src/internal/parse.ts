/**
 * ISSU Phase 5 — Data and Analytics Agents: deterministic content parsing
 * (§5 Preparation / normalization). Documented input convention: CSV-style
 * text where the first non-empty line is the header row and subsequent
 * non-empty lines are records; cells are comma-separated with surrounding
 * whitespace trimmed; values are parsed as number when fully numeric, boolean
 * for `true`/`false`, else string; empty cells parse to `null`. A file with no
 * data rows produces an empty dataset.
 */

import type { DatasetRecord, FieldValue } from "./model.js";

const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;
const TRUE_PATTERN = /^true$/i;
const FALSE_PATTERN = /^false$/i;

export function parseCell(raw: string): FieldValue {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (TRUE_PATTERN.test(trimmed)) return true;
  if (FALSE_PATTERN.test(trimmed)) return false;
  if (NUMBER_PATTERN.test(trimmed)) {
    const value = Number(trimmed);
    if (Number.isFinite(value)) return value;
  }
  return trimmed;
}

function splitCells(line: string): readonly string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

/**
 * Parse CSV-style content into records. Deterministic and idempotent.
 * Record ids are `r1`, `r2`, ... in line order.
 */
export function parseContent(content: string): readonly DatasetRecord[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return [];
  const rows = lines.map(splitCells);
  const header = rows[0] as readonly string[] | undefined;
  if (header === undefined) return [];

  const records: DatasetRecord[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as readonly string[] | undefined;
    if (row === undefined) continue;
    const fields: Record<string, FieldValue> = {};
    for (let j = 0; j < header.length; j++) {
      const name = header[j];
      if (name === undefined || name === "") continue;
      fields[name] = parseCell(row[j] ?? "");
    }
    records.push({ id: `r${i}`, fields });
  }
  return records;
}
