import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { selectWithRecentExclusion } from "../src/lib/contentSelection.ts";
import { buildLearningJourney, isLevelUnlocked, TRACKS } from "../src/lib/learningJourney.ts";

describe("server content selection", () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ contentId: `item-${i}` }));

  test("selects a different deterministic window when the seed changes", () => {
    const first = selectWithRecentExclusion(items, 5, 11).map((item) => item.contentId);
    const second = selectWithRecentExclusion(items, 5, 12).map((item) => item.contentId);
    assert.notDeepEqual(first, second);
  });

  test("excludes recent content while enough fresh items exist", () => {
    const recent = ["item-0", "item-1", "item-2", "item-3", "item-4"];
    const selected = selectWithRecentExclusion(items, 5, 7, recent);
    assert.equal(selected.some((item) => recent.includes(item.contentId)), false);
  });

  test("falls back to the complete pool when the exclusion window is too large", () => {
    const selected = selectWithRecentExclusion(items.slice(0, 3), 5, 7, ["item-0"]);
    assert.equal(selected.length, 3);
  });

  test("can enforce uniqueness by problem identity, not only content ID", () => {
    const duplicateQuestions = [
      { contentId: "a", question: "1+1" },
      { contentId: "b", question: "1+1" },
      { contentId: "c", question: "2+1" },
    ];
    const selected = selectWithRecentExclusion(duplicateQuestions, 2, 3, [], (item) => item.question);
    assert.equal(new Set(selected.map((item) => item.question)).size, selected.length);
  });
});

describe("learning journey", () => {
  test("exposes numbers, creative, and visual tracks", () => {
    assert.deepEqual(TRACKS.map((track) => track.id), ["numbers", "creative", "visual"]);
    assert.deepEqual(TRACKS.flatMap((track) => track.gameIds).sort(), ["addition", "clean-up", "discover", "puzzle", "sketch", "subtraction"]);
  });

  test("marks earlier levels complete, current level playable, and future levels locked", () => {
    const journey = buildLearningJourney({ learnerId: "learner-1", ageBand: "6-7", level: 3 });
    const states = journey.tracks[0].levels.map((level) => level.status);
    assert.deepEqual(states, ["completed", "completed", "current", "locked", "locked"]);
    assert.equal(journey.nextLevel, 4);
  });

  test("unlock authority never permits a future level", () => {
    assert.equal(isLevelUnlocked(3, 3), true);
    assert.equal(isLevelUnlocked(3, 4), false);
    assert.equal(isLevelUnlocked(5, 5), true);
  });
});
