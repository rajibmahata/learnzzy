import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  addReward,
  adoptServerSticker,
  getRewards,
  hydrateFromServer,
  reconcileSticker,
} from "../src/lib/rewards.ts";
import { listDeviceLearners } from "../src/lib/learner.ts";

// Client cache: server is authoritative. These run in Node (no window), which
// exercises the guarded fallbacks — real browser behavior is covered by e2e.
describe("client reward cache", () => {
  test("optimistic award returns a pending placeholder", () => {
    const r = addReward("addition", 3);
    assert.equal(r.stars, 3);
    assert.ok(r.sticker.id.startsWith("pending_"), "placeholder id");
    assert.equal(r.sticker.pending, true);
  });

  test("reconcile swaps the placeholder for the canonical sticker", () => {
    const r = addReward("puzzle", 3);
    const canonical = reconcileSticker(r.sticker.id, { id: "fox", emoji: "🦊", name: "Fox Friend" }, "puzzle");
    assert.equal(canonical?.id, "fox");
    assert.equal(canonical?.pending, undefined);
  });

  test("reconcile with no server sticker keeps the placeholder", () => {
    const r = addReward("sketch", 3);
    assert.equal(reconcileSticker(r.sticker.id, null, "sketch"), null);
  });

  test("adopt inserts server stickers without duplicating", () => {
    const first = adoptServerSticker({ id: "lion", emoji: "🦁", name: "Lion Friend" }, "addition");
    const second = adoptServerSticker({ id: "lion", emoji: "🦁", name: "Lion Friend" }, "addition");
    assert.equal(first.id, "lion");
    assert.equal(second.id, "lion");
  });

  test("hydrate merges server truth", () => {
    const state = hydrateFromServer({ totalStars: 9, stickerIds: ["fox", "lion"] });
    assert.equal(state.totalStars, 9);
    assert.ok(state.stickers.some((s) => s.id === "fox"));
  });

  test("device learner list is empty without a window", () => {
    assert.deepEqual(listDeviceLearners(), []);
    assert.deepEqual(getRewards().stickers, []);
  });
});
