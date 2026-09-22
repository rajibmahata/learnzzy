import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  companionCallName,
  companionEmoji,
  greetingName,
  normalizeDisplayName,
  normalizeNickname,
  sanitizeCompanion,
} from "../src/lib/identity.ts";

describe("display identity (never authentication)", () => {
  test("displayName is sanitized: no HTML, safe length", () => {
    assert.equal(normalizeDisplayName("Aarvi"), "Aarvi");
    assert.equal(normalizeDisplayName("<b>Avi</b>"), "bAvi/b");
    assert.equal(normalizeDisplayName("   "), undefined);
    assert.equal(normalizeDisplayName(undefined), undefined);
    assert.equal(normalizeDisplayName("x".repeat(50))?.length, 20);
  });

  test("greeting falls back nickname -> displayName -> Explorer", () => {
    assert.equal(greetingName({ nickname: "Avi", displayName: "Aarvi" }), "Avi");
    assert.equal(greetingName({ displayName: "Aarvi" }), "Aarvi");
    assert.equal(greetingName({ nickname: "  " }), "Explorer");
    assert.equal(greetingName(null), "Explorer");
    assert.equal(greetingName(undefined), "Explorer");
  });

  test("nickname stays short and optional", () => {
    assert.equal(normalizeNickname("Super Learner"), "Super Learner");
    assert.equal(normalizeNickname(""), undefined);
  });
});

describe("companion validation", () => {
  test("accepts roster characters with optional custom name", () => {
    assert.deepEqual(sanitizeCompanion({ characterId: "bunny", displayName: "Coco" }), { characterId: "bunny", displayName: "Coco" });
    assert.deepEqual(sanitizeCompanion({ characterId: "parrot" }), { characterId: "parrot" });
    assert.deepEqual(sanitizeCompanion({ characterId: "fox", displayName: "" }), { characterId: "fox" });
  });

  test("rejects unknown characters instead of substituting", () => {
    assert.equal(sanitizeCompanion({ characterId: "dragon" }), null);
    assert.equal(sanitizeCompanion({ characterId: "" }), null);
    assert.equal(sanitizeCompanion(null), null);
    assert.equal(sanitizeCompanion(undefined), null);
  });

  test("emoji and call-name resolve with legacy fallbacks", () => {
    assert.equal(companionEmoji({ companion: { characterId: "bunny", displayName: "Coco" } }), "🐰");
    assert.equal(companionCallName({ companion: { characterId: "bunny", displayName: "Coco" } }), "Coco");
    assert.equal(companionCallName({ companion: { characterId: "owl" } }), "Owl");
    assert.equal(companionEmoji({ avatar: "🦁" }), "🦁");
    assert.equal(companionEmoji(null), "🌟");
    assert.equal(companionCallName(null), "Buddy");
  });
});
