let counter = 0;

/**
 * Deterministic-enough, dependency-free id generator. Falls back to a
 * counter when `crypto.randomUUID` is unavailable (e.g. older test
 * environments), which keeps this usable both in the browser and in
 * Vitest/jsdom.
 */
export function createId(prefix = 'id'): string {
  const globalCrypto = typeof crypto !== 'undefined' ? crypto : undefined;

  if (globalCrypto && typeof globalCrypto.randomUUID === 'function') {
    return `${prefix}_${globalCrypto.randomUUID()}`;
  }

  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}
