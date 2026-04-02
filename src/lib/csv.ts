export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value);
  // Prevent CSV formula injection: prefix dangerous leading characters
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("'")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(
  headers: string[],
  rows: Record<string, unknown>[]
): string {
  const headerLine = headers.map(csvEscape).join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => csvEscape(row[h])).join(",")
  );
  return [headerLine, ...dataLines].join("\n");
}
