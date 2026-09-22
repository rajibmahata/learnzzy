import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { WORLD_EVENT_CONFIGS, selectWorldEvent, validateWorldEvent, stickerToWorldEventId } from "../src/lib/worldRewards.ts";

describe("Living Reward World", () => {
  test("dinosaur rex maps to jungle walk with dust", () => {
    const event = selectWorldEvent("rex");
    assert.equal(event.environment, "jungle");
    assert.equal(event.eventType, "CREATURE_ARRIVAL");
    assert.equal(event.animation, "walk");
    assert.equal(event.asset.emoji, "🦖");
    assert.ok(event.particleEffects.includes("dust"));
  });

  test("boat maps to ocean sail with waves", () => {
    const event = selectWorldEvent("boat");
    assert.equal(event.environment, "ocean");
    assert.equal(event.eventType, "WATER_ARRIVAL");
    assert.equal(event.animation, "sail");
    assert.equal(event.asset.emoji, "⛵");
    assert.ok(event.particleEffects.includes("waves"));
  });

  test("deterministic variant: same seed same duration, different seed may vary within bounds", () => {
    const a = selectWorldEvent("rex", "seed-a");
    const b = selectWorldEvent("rex", "seed-a");
    const c = selectWorldEvent("rex", "seed-b");
    assert.equal(a.durationMs, b.durationMs);
    assert.ok(a.durationMs >= 3000);
    assert.ok(c.durationMs >= 3000);
    assert.ok(c.durationMs <= 8000);
  });

  test("missing asset falls back to beautiful 2D default without crash", () => {
    const event = selectWorldEvent("unknown-sticker-xyz");
    assert.equal(event.rewardId, "default");
    assert.equal(event.asset.emoji, "⭐");
    assert.equal(validateWorldEvent(event).length, 0);
  });

  test("all configured events validate duration 3000-8000 and have asset", () => {
    for (const [id, ev] of Object.entries(WORLD_EVENT_CONFIGS)) {
      const problems = validateWorldEvent(ev);
      assert.deepEqual(problems, [], `problems for ${id}: ${problems.join(", ")}`);
      assert.ok(ev.asset.emoji);
      assert.ok(ev.durationMs >= 3000);
      assert.ok(ev.durationMs <= 8000);
    }
  });

  test("stickerToWorldEventId returns direct mapping when present", () => {
    assert.equal(stickerToWorldEventId("rex"), "rex");
    assert.equal(stickerToWorldEventId("boat"), "boat");
    assert.equal(stickerToWorldEventId("unknown"), "unknown");
  });
});
