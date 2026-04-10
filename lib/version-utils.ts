export function parseVersion(version: string): number[] {
  return version
    .trim()
    .split('.')
    .map((part) => Number(part))
    .map((part) => (Number.isFinite(part) && part >= 0 ? Math.trunc(part) : 0));
}

export function compareVersions(a: string, b: string): number {
  const aParts = parseVersion(a);
  const bParts = parseVersion(b);
  const maxLen = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < maxLen; i += 1) {
    const aValue = aParts[i] ?? 0;
    const bValue = bParts[i] ?? 0;
    if (aValue > bValue) return 1;
    if (aValue < bValue) return -1;
  }

  return 0;
}

export function isValidVersionString(value: string): boolean {
  return /^\d+(\.\d+){1,3}$/.test(value.trim());
}
