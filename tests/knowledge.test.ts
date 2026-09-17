import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  CATEGORIES,
  CONCEPTS,
  buildDailyAdventure,
  buildQuizOptions,
  categoryProgress,
  conceptName,
  conceptsInCategory,
  flattenMasteryMap,
  getConcept,
  nextMastery,
  pickDiscoverSet,
} from "../src/lib/knowledge.ts";

// Learn & Discover knowledge system (real code): taxonomy integrity,
// deterministic rotation, mastery machine, i18n fallback, daily adventure.
describe("knowledge taxonomy (real code)", () => {
  test("categories and concepts are well-formed and unique", () => {
    assert.ok(CATEGORIES.length >= 10, "world areas required");
    assert.ok(CONCEPTS.length >= 60, `library depth required (got ${CONCEPTS.length})`);
    const ids = CONCEPTS.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length, "concept ids unique");
    for (const c of CONCEPTS) {
      assert.ok(c.names.en.length >= 1, `${c.id} needs an English name`);
      assert.ok(c.emoji.length >= 1, `${c.id} needs a visual`);
      assert.ok(c.fact.length >= 8, `${c.id} needs a fact`);
      assert.ok([1, 2, 3].includes(c.level), `${c.id} level band`);
      assert.ok(CATEGORIES.some((cat) => cat.id === c.category), `${c.id} category exists`);
    }
  });
  test("every category has learnable concepts", () => {
    for (const cat of CATEGORIES) {
      assert.ok(conceptsInCategory(cat.id).length >= 5, `${cat.id} depth`);
    }
  });
  test("locale names use prepared translations, fall back to English", () => {
    const parrot = getConcept("birds.parrot");
    assert.ok(parrot);
    assert.equal(conceptName(parrot!, "en"), "Parrot");
    assert.equal(conceptName(parrot!, "hi"), "तोता");
    assert.equal(conceptName(parrot!, "bn"), "টিয়া পাখি");
    // Untranslated concepts still fall back to English, never empty.
    const crow = getConcept("birds.crow");
    assert.ok(crow);
    assert.equal(conceptName(crow!, "hi"), crow!.names.en);
    assert.equal(getConcept("nope.nothing"), null);
  });
});

describe("discover selection (real code)", () => {
  test("deterministic per seed and avoids recent concepts", () => {
    const a = pickDiscoverSet(42, 3, []);
    const b = pickDiscoverSet(42, 3, []);
    assert.deepEqual(a.map((c) => c.id), b.map((c) => c.id));
    const recent = a.map((c) => c.id);
    const c = pickDiscoverSet(42, 3, recent);
    assert.ok(c.every((x) => !recent.includes(x.id)), "recent ids avoided while fresh content exists");
  });
  test("quiz options always include target with deterministic distractors", () => {
    const target = getConcept("birds.parrot")!;
    const opts = buildQuizOptions(target, 3, 7);
    assert.equal(opts.length, 3);
    assert.ok(opts.some((o) => o.id === target.id));
    assert.equal(new Set(opts.map((o) => o.id)).size, 3);
    const again = buildQuizOptions(target, 3, 7);
    assert.deepEqual(opts.map((o) => o.id), again.map((o) => o.id));
  });
});

describe("concept mastery machine (real code)", () => {
  test("exposure moves new to learning", () => {
    const m = nextMastery(undefined, "exposed", true, "2026-09-16T00:00:00.000Z");
    assert.equal(m.status, "learning");
    assert.equal(m.exposures, 1);
    assert.ok(m.nextReviewAt);
  });
  test("sustained recognition masters; weakness flags review", () => {
    let m = nextMastery(undefined, "recognized", true, "2026-09-16T00:00:00.000Z");
    m = { ...m, attempts: 2, correct: 2 };
    const mastered = nextMastery(m, "recognized", true, "2026-09-16T00:00:00.000Z");
    assert.equal(mastered.status, "mastered");
    const weak = nextMastery(
      { exposures: 2, attempts: 2, correct: 1, status: "practicing" },
      "recognized",
      false,
      "2026-09-16T00:00:00.000Z"
    );
    assert.equal(weak.status, "needs_review");
  });
  test("category rollup counts learned/mastered/review", () => {
    const rows = categoryProgress({
      "birds.parrot": { exposures: 2, attempts: 3, correct: 3, status: "mastered" },
      "birds.duck": { exposures: 1, attempts: 0, correct: 0, status: "learning" },
    });
    const birds = rows.find((r) => r.category === "birds")!;
    assert.equal(birds.learned, 2);
    assert.equal(birds.mastered, 1);
    const animals = rows.find((r) => r.category === "animals")!;
    assert.equal(animals.learned, 0);
  });
});

describe("daily adventure (real code)", () => {
  test("builds themed warmup/discover/challenge/create/reward slots", () => {
    const adv = buildDailyAdventure(
      [
        { gameId: "addition", level: 1, reason: "variety" },
        { gameId: "sketch", level: 3, reason: "interest" },
      ],
      99
    );
    assert.deepEqual(adv.slots.map((s) => s.slot), ["warmup", "discover", "challenge", "create", "reward"]);
    assert.equal(adv.slots[0].gameId, "addition");
    assert.equal(adv.slots[2].gameId, "sketch");
    assert.equal(adv.slots[1].conceptIds?.length, 2);
    assert.match(adv.date, /^\d{4}-\d{2}-\d{2}$/);
  });
});
