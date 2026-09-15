// Fixed-window rate limiter. Redis-backed when REDIS_URL is set (shared
// across instances for multi-instance prod); otherwise a per-instance
// in-memory bucket. Failures always fall back to memory — limiting must
// never break gameplay or auth flows.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function take(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (b.count < limit) {
    b.count++;
    return { allowed: true, retryAfterMs: 0 };
  }
  return { allowed: false, retryAfterMs: b.resetAt - now };
}

type RedisClient = {
  incr(key: string): Promise<number>;
  pexpire(key: string, ms: number): Promise<unknown>;
  pttl(key: string): Promise<number>;
};

let redis: RedisClient | null = null;
let redisInit: Promise<RedisClient | null> | null = null;

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

async function redisClient(): Promise<RedisClient | null> {
  if (!process.env.REDIS_URL) return null;
  // Negative-result caching: when Redis is down, don't pay a ping timeout
  // on every request — fall back to memory instantly until cooldown ends.
  if (Date.now() < redisDownUntil) return null;
  if (!redisInit) {
    let client: { disconnect(): void; on(e: string, h: () => void): void; ping(): Promise<string>; incr(k: string): Promise<number>; pexpire(k: string, ms: number): Promise<unknown>; pttl(k: string): Promise<number> } | null = null;
    redisInit = (async () => {
      try {
        const { default: IORedis } = await import("ioredis");
        client = new IORedis(process.env.REDIS_URL as string, {
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
          // Fail fast: a limiter must never hold requests hostage or
          // spam reconnects when Redis is down. Memory fallback covers it.
          retryStrategy: () => null,
          reconnectOnError: () => false,
          lazyConnect: true,
        });
        // Swallow unhandled error events (all callers handle rejections).
        client.on("error", () => null);
        await withTimeout(client.ping(), 500).catch(() => {
          throw new Error("redis unreachable");
        });
        redis = {
          incr: (k) => (client as NonNullable<typeof client>).incr(k),
          pexpire: (k, ms) => (client as NonNullable<typeof client>).pexpire(k, ms),
          pttl: (k) => (client as NonNullable<typeof client>).pttl(k),
        };
        return redis;
      } catch {
        try {
          client?.disconnect();
        } catch { /* ignore */ }
        redisInit = null; // allow a later retry (e.g. Redis came up)
        redisDownUntil = Date.now() + REDIS_RETRY_COOLDOWN_MS;
        return null;
      }
    })();
  }
  return redisInit;
}

export async function takeAsync(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterMs: number; backend: "redis" | "memory" }> {
  const client = await redisClient().catch(() => null);
  if (!client) return { ...take(key, limit, windowMs), backend: "memory" as const };
  const rkey = `rl:${key}`;
  try {
    const count = await withTimeout(client.incr(rkey), 500);
    if (count === 1) await withTimeout(client.pexpire(rkey, Math.max(1000, Math.floor(windowMs))), 500).catch(() => null);
    if (count <= limit) return { allowed: true, retryAfterMs: 0, backend: "redis" as const };
    const ttl = await withTimeout(client.pttl(rkey), 500).catch(() => windowMs);
    return { allowed: false, retryAfterMs: Math.max(0, ttl), backend: "redis" as const };
  } catch {
    return { ...take(key, limit, windowMs), backend: "memory" as const };
  }
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
