import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVE_STICKERS,
  MILESTONES,
  STICKER_CATALOG,
  crossedMilestone,
  milestoneFor,
  resolveStickerIds,
  selectUnownedSticker,
  stickerById,
  validateCatalog,
} from "../src/lib/stickers.ts";

describe("sticker catalog", () => {
  test("catalog validates: unique ids, known categories, art + names", () => {
    assert.deepEqual(validateCatalog(), []);
    assert.ok(STICKER_CATALOG.length >= 40, "large extensible catalog");
    assert.ok(ACTIVE_STICKERS.length === STICKER_CATALOG.length);
  });

  test("every spec category is represented", () => {
    const cats = new Set(STICKER_CATALOG.map((s) => s.category));
    for (const c of ["animals", "flowers", "nature", "food", "space", "transport", "fantasy", "discovery"]) {
      assert.ok(cats.has(c as never), c);
    }
  });

  test("resolve + lookup helpers", () => {
    assert.equal(stickerById("fox")?.emoji, "🦊");
    assert.equal(stickerById("nope"), null);
    assert.deepEqual(resolveStickerIds(["fox", "nope", "lion"]).map((s) => s.id), ["fox", "lion"]);
  });
});

describe("unique sticker selection", () => {
  test("never returns an owned sticker", () => {
    for (let i = 0; i < 25; i++) {
      const owned = STICKER_CATALOG.slice(0, i).map((s) => s.id);
      const pick = selectUnownedSticker(owned, `learner-a:${owned.length}`);
      assert.ok(pick && !owned.includes(pick.id), `pick ${i} unowned`);
    }
  });

  test("deterministic per seed, spreads across categories", () => {
    const a = selectUnownedSticker([], "learner-a:0");
    const b = selectUnownedSticker([], "learner-a:0");
    assert.equal(a?.id, b?.id);
    const cats = new Set<string>();
    for (let i = 0; i < 12; i++) cats.add(selectUnownedSticker([], `seed-${i}`)!.category);
    assert.ok(cats.size >= 3, "spreads across categories");
  });

  test("null when the catalog is fully collected (never duplicate)", () => {
    const all = STICKER_CATALOG.map((s) => s.id);
    assert.equal(selectUnownedSticker(all, "any"), null);
  });
});

describe("milestones", () => {
  test("thresholds 5/10/25/50 with no screen-time rewards", () => {
    assert.deepEqual(MILESTONES.map((m) => m.count), [5, 10, 25, 50]);
    assert.equal(milestoneFor(0), null);
    assert.equal(milestoneFor(5)?.name, "Little Explorer");
    assert.equal(milestoneFor(12)?.name, "Rainbow Collector");
    assert.equal(milestoneFor(60)?.name, "Learnzzy Explorer");
    assert.equal(crossedMilestone(4, 5)?.name, "Little Explorer");
    assert.equal(crossedMilestone(5, 6), null);
    assert.equal(crossedMilestone(9, 11)?.name, "Rainbow Collector");
  });
});
