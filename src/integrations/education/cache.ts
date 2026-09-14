import { createHash } from "crypto";

// Two-tier cache: Redis when REDIS_URL is set, otherwise an in-process
// bounded Map with TTL. Same semantics either way; gameplay never depends
// on it (miss => provider call or deterministic fallback).
interface Entry {
  value: string;
  expiresAt: number;
}

const memory = new Map<string, Entry>();
const MEMORY_MAX = 500;
let hits = 0;
let misses = 0;

let redis: { get(k: string): Promise<string | null>; set(k: string, v: string, mode: string, ttl: number): Promise<unknown> } | null = null;
let redisInit: Promise<void> | null = null;

async function redisClient() {
  if (!process.env.REDIS_URL) return null;
  if (!redisInit) {
    redisInit = (async () => {
      try {
        const { default: IORedis } = await import("ioredis");
        const client = new IORedis(process.env.REDIS_URL as string, { maxRetriesPerRequest: 1, enableReadyCheck: false });
        redis = {
          get: (k) => client.get(k),
          set: (k, v, mode, ttl) => client.set(k, v, mode as never, ttl as never),
        };
      } catch {
        redis = null;
      }
    })();
  }
  await redisInit;
  return redis;
}

function memGet(key: string): string | null {
  const e = memory.get(key);
  if (!e) return null;
  if (e.expiresAt <= Date.now()) {
    memory.delete(key);
    return null;
  }
  return e.value;
}

function memSet(key: string, value: string, ttlSeconds: number): void {
  if (memory.size >= MEMORY_MAX) {
    const oldest = memory.keys().next().value;
    if (oldest) memory.delete(oldest);
  }
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function cacheKey(...parts: string[]): string {
  const h = createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
  return `edu:${h}`;
}

export async function cacheGet(key: string): Promise<{ hit: boolean; value: string | null }> {
  const r = await redisClient().catch(() => null);
  if (r) {
    try {
      const v = await r.get(key);
      if (v !== null) {
        hits++;
        return { hit: true, value: v };
      }
    } catch { /* fall through to miss */ }
  } else {
    const v = memGet(key);
    if (v !== null) {
      hits++;
      return { hit: true, value: v };
    }
  }
  misses++;
  return { hit: false, value: null };
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  const r = await redisClient().catch(() => null);
  if (r) {
    try {
      await r.set(key, value, "EX", Math.max(60, Math.floor(ttlSeconds)));
      return;
    } catch { /* fall through to memory */ }
  }
  memSet(key, value, ttlSeconds);
}

export function cacheStats(): { hits: number; misses: number; hitRate: number | null; backend: "redis" | "memory" } {
  const total = hits + misses;
  return { hits, misses, hitRate: total === 0 ? null : hits / total, backend: process.env.REDIS_URL ? "redis" : "memory" };
}

export function resetCacheStats(): void {
  hits = 0;
  misses = 0;
}
