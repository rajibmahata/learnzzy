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

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("redis timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

let redisDownUntil = 0;
const REDIS_RETRY_COOLDOWN_MS = 10_000;

async function redisClient() {
  if (!process.env.REDIS_URL) return null;
  // Negative-result caching: instant memory fallback while Redis is down.
  if (Date.now() < redisDownUntil) return null;
  if (!redisInit) {
    let client: { disconnect(): void; on(e: string, h: () => void): void; ping(): Promise<string> } | null = null;
    redisInit = (async () => {
      try {
        const { default: IORedis } = await import("ioredis");
        // Fail fast when Redis is down: no retry storms, no unhandled error
        // events, no hung cache lookups. Memory tier covers the miss.
        client = new IORedis(process.env.REDIS_URL as string, {
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
          retryStrategy: () => null,
          reconnectOnError: () => false,
          lazyConnect: true,
        });
        client.on("error", () => null);
        await withTimeout(client.ping(), 500).catch(() => {
          throw new Error("redis unreachable");
        });
        const c = client as unknown as {
          get(k: string): Promise<string | null>;
          set(k: string, v: string, mode: string, ttl: number): Promise<unknown>;
        };
        redis = {
          get: (k) => withTimeout(c.get(k), 500),
          set: (k, v, mode, ttl) => withTimeout(c.set(k, v, mode, ttl), 500),
        };
      } catch {
        try {
          client?.disconnect();
        } catch { /* ignore */ }
        redis = null;
        redisInit = null; // allow a later retry (e.g. Redis came up)
        redisDownUntil = Date.now() + REDIS_RETRY_COOLDOWN_MS;
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
