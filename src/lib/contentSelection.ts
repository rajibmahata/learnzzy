// Dependency-free deterministic selection helpers shared by server content
// reads and tests. Selection is controlled by a caller-provided seed; it is
// never based on Math.random().

export function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const result = [...items];
  const random = seededRandom(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function selectWithRecentExclusion<T extends { contentId: string }>(
  items: T[],
  limit: number,
  seed: number,
  recentIds: string[] = [],
  uniquenessKey: (item: T) => string = (item) => item.contentId
): T[] {
  const recent = new Set(recentIds);
  const fresh = items.filter((item) => !recent.has(item.contentId));
  const candidates = fresh.length >= limit ? fresh : items;
  const selected: T[] = [];
  const used = new Set<string>();
  for (const item of shuffleWithSeed(candidates, seed)) {
    const key = uniquenessKey(item);
    if (used.has(key)) continue;
    used.add(key);
    selected.push(item);
    if (selected.length >= limit) break;
  }
  return selected;
}
