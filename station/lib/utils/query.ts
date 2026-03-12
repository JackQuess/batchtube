export function getString(value: string | string[] | undefined, fallback = ''): string {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export function getEnum<T extends readonly string[]>(
  value: string | string[] | undefined,
  allowed: T,
  fallback: T[number]
): T[number] {
  const current = getString(value);
  return (allowed.includes(current as T[number]) ? current : fallback) as T[number];
}
