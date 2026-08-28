export type ClassValue =
  string | number | false | null | undefined | Record<string, boolean | undefined>;

/**
 * Tiny `classnames`-style helper so components don't pull in an extra
 * dependency for conditional class composition.
 */
export function classNames(...values: ClassValue[]): string {
  const parts: string[] = [];

  for (const value of values) {
    if (!value) continue;

    if (typeof value === 'string' || typeof value === 'number') {
      parts.push(String(value));
      continue;
    }

    for (const [key, enabled] of Object.entries(value)) {
      if (enabled) parts.push(key);
    }
  }

  return parts.join(' ');
}
