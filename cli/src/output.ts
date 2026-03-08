export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export function tableFormat(
  rows: Record<string, string | number>[]
): string {
  if (rows.length === 0) return '';
  const keys = Object.keys(rows[0]!);
  const widths = keys.map((k) =>
    Math.max(k.length, ...rows.map((r) => String(r[k] ?? '').length))
  );
  const sep = widths.map((w) => '-'.repeat(w)).join('-+-');
  const header = keys.map((k, i) => k.padEnd(widths[i]!)).join(' | ');
  const lines = rows.map((r) =>
    keys.map((k, i) => String(r[k] ?? '').padEnd(widths[i]!)).join(' | ')
  );
  return [header, sep, ...lines].join('\n');
}
