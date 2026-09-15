import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { take, takeAsync, clientIp } from "../src/lib/rate-limit.ts";

// Real limiter code. Memory path always; Redis path only with REDIS_URL
// (absent in unit tests) — so takeAsync must report backend "memory" here.

describe("memory token bucket (real code)", () => {
  test("allows up to the limit, then blocks", () => {
    const key = `t-${Date.now()}-a`;
    assert.equal(take(key, 2, 60_000).allowed, true);
    assert.equal(take(key, 2, 60_000).allowed, true);
    const third = take(key, 2, 60_000);
    assert.equal(third.allowed, false);
    assert.ok(third.retryAfterMs > 0);
  });
  test("different keys are isolated", () => {
    const a = `t-${Date.now()}-b1`;
    const b = `t-${Date.now()}-b2`;
    take(a, 1, 60_000);
    assert.equal(take(a, 1, 60_000).allowed, false);
    assert.equal(take(b, 1, 60_000).allowed, true);
  });
});

describe("async limiter fallback (real code)", () => {
  test("falls back to memory without REDIS_URL", async () => {
    const saved = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    try {
      const key = `t-${Date.now()}-c`;
      const first = await takeAsync(key, 1, 60_000);
      assert.equal(first.allowed, true);
      assert.equal(first.backend, "memory");
      const second = await takeAsync(key, 1, 60_000);
      assert.equal(second.allowed, false);
      assert.ok(second.retryAfterMs > 0);
    } finally {
      if (saved !== undefined) process.env.REDIS_URL = saved;
    }
  });
});

describe("redis-down fallback (real code)", () => {
  test("unreachable Redis still enforces limits via memory", async () => {
    const saved = process.env.REDIS_URL;
    process.env.REDIS_URL = "redis://127.0.0.1:6390"; // closed port: fast refuse
    try {
      const key = `t-${Date.now()}-d`;
      const first = await takeAsync(key, 1, 60_000);
      assert.equal(first.allowed, true);
      assert.equal(first.backend, "memory");
      const second = await takeAsync(key, 1, 60_000);
      assert.equal(second.allowed, false);
    } finally {
      if (saved !== undefined) process.env.REDIS_URL = saved;
      else delete process.env.REDIS_URL;
    }
  });
});

describe("clientIp (real code)", () => {
  test("prefers x-forwarded-for, falls back to unknown", () => {
    const withHeader = new Request("http://x/", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    assert.equal(clientIp(withHeader), "1.2.3.4");
    assert.equal(clientIp(new Request("http://x/")), "unknown");
  });
});
