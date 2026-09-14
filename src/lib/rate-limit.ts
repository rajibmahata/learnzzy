// In-memory token bucket (per-instance). Adequate for MVP single-instance;
// production multi-instance should move this to Redis (noted in DEPLOYMENT).
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

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
