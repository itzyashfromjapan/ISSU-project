export const REDACTED = "[REDACTED]";

export function redactValues(text: string, values: readonly string[]): string {
  const ordered = values
    .filter((value) => value.length > 0)
    .sort((a, b) => b.length - a.length);
  let result = text;
  for (const value of ordered) {
    result = result.split(value).join(REDACTED);
  }
  return result;
}

export function redactRecord(
  record: unknown,
  list: readonly string[],
): unknown {
  if (typeof record === "string") {
    return redactValues(record, list);
  }
  if (Array.isArray(record)) {
    return record.map((item) => redactRecord(item, list));
  }
  if (record !== null && typeof record === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (list.includes(key)) {
        out[key] = REDACTED;
      } else {
        out[key] = redactRecord(value, list);
      }
    }
    return out;
  }
  return record;
}
