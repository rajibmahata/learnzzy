import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  CHARACTERS,
  COMPANION_CHOICES,
  characterForGame,
  stateForMoment,
  lineForState,
  ariaLabelFor,
  asCharacterId,
  companionDefs,
  getCharacterDef,
} from "../src/lib/characters.ts";
import { themeById, themeNoun, pickVisualTheme, verifyThemeMath } from "../src/lib/visualThemes.ts";
import { toAdditionContent, toSubtractionContent } from "../src/lib/pool-client.ts";

// Cartoon character system: purposeful guides with interaction states.
describe("character roster (real code)", () => {
  test("twelve purposeful characters, unique ids and emoji", () => {
    assert.equal(CHARACTERS.length, 12);
    const ids = CHARACTERS.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const c of CHARACTERS) {
      assert.ok(c.emoji.length >= 1, `${c.id} needs a visual`);
      assert.ok(c.role.length >= 3, `${c.id} needs a purpose`);
      assert.ok(c.games.length >= 1, `${c.id} guides at least one game`);
    }
  });
  test("companion picker offers the ten onboarding friends", () => {
    assert.deepEqual(COMPANION_CHOICES, ["bunny", "teddy", "fox", "owl", "monkey", "panda", "elephant", "lion", "butterfly", "parrot"]);
    const defs = companionDefs();
    assert.equal(defs.length, 10);
    assert.ok(defs.every((d) => d.emoji.length >= 1 && d.games.length >= 1));
  });
  test("every game resolves to its purposeful guide", () => {
    assert.equal(characterForGame("addition"), "teddy");
    assert.equal(characterForGame("subtraction"), "teddy");
    assert.equal(characterForGame("clean-up"), "puppy");
    assert.equal(characterForGame("puzzle"), "dino");
    assert.equal(characterForGame("sketch"), "bunny");
    assert.equal(characterForGame("discover"), "parrot");
    assert.equal(characterForGame("unknown-game"), "teddy");
  });
  test("unknown ids coerce safely", () => {
    assert.equal(asCharacterId("parrot", "parrot"), "parrot");
    assert.equal(asCharacterId("nope", "parrot"), "parrot");
    assert.equal(asCharacterId(undefined), "teddy");
    assert.equal(getCharacterDef("nope").id, "teddy");
  });
});

describe("character states (real code)", () => {
  test("done always celebrates; correct is happy; miss is encouraging", () => {
    assert.equal(stateForMoment({ done: true, feedback: "retry" }), "celebrating");
    assert.equal(stateForMoment({ feedback: "correct" }), "happy");
    assert.equal(stateForMoment({ feedback: "good" }), "happy");
    assert.equal(stateForMoment({ feedback: "retry" }), "encouraging");
  });
  test("open question thinks; tracing is curious", () => {
    assert.equal(stateForMoment({ feedback: "idle" }), "thinking");
    assert.equal(stateForMoment({}), "thinking");
    assert.equal(stateForMoment({ tracing: true }), "curious");
  });
  test("lines are short and useful, labels name the guide", () => {
    for (const s of ["idle", "happy", "thinking", "curious", "encouraging", "celebrating", "explaining", "surprised"] as const) {
      const line = lineForState(s);
      assert.ok(line.length >= 3 && line.length <= 80, `${s} line length`);
    }
    const label = ariaLabelFor("puppy", "encouraging");
    assert.ok(label.includes("Puppy"));
    assert.ok(label.includes("encouraging"));
  });
});

describe("visual theme lookup (real code)", () => {
  test("themeById resolves all ten themes, unknown falls back", () => {
    for (const id of ["teddy", "apple", "mango", "star", "car", "fish", "balloon", "butterfly", "puppy", "rocket"]) {
      assert.equal(themeById(id).id, id);
      assert.ok(themeById(id).emoji.length >= 1);
    }
    assert.equal(themeById("banana").id, "teddy");
    assert.equal(themeById(undefined).id, "teddy");
  });
  test("singular/plural nouns for aria labels", () => {
    assert.equal(themeNoun("apple", 1), "apple");
    assert.equal(themeNoun("apple", 3), "apples");
    assert.equal(themeNoun("teddy", 2), "teddy bears");
    assert.equal(themeNoun("fish", 5), "fish");
  });
  test("fallback theme is deterministic per content id, math invariant", () => {
    const a = pickVisualTheme("seed-add-easy-001", "addition");
    const b = pickVisualTheme("seed-add-easy-001", "addition");
    assert.equal(a.id, b.id);
    assert.ok(verifyThemeMath(2, 3, a.id));
  });
});

describe("pool visual-theme passthrough (real code)", () => {
  function additionItem(objects: unknown) {
    return {
      contentId: "t1",
      difficulty: 1,
      type: "addition_question",
      question: { a: 2, b: 3 },
      objects: objects as Record<string, unknown>,
      answers: [5, 6, 4, 7],
    };
  }
  test("validated theme id passes through, math still recomputed", () => {
    const c = toAdditionContent(additionItem({ type: "mango", countA: 2, countB: 3 }));
    assert.ok(c);
    assert.equal(c?.objectType, "mango");
    assert.equal(c?.correctAnswer, 5);
  });
  test("unknown/legacy types yield no theme (caller falls back), item still valid", () => {
    const legacy = toAdditionContent(additionItem({ type: "banana" }));
    assert.ok(legacy);
    assert.equal(legacy?.objectType, undefined);
    const missing = toAdditionContent({ contentId: "t2", difficulty: 1, type: "addition_question", question: { a: 1, b: 1 }, answers: [2, 3, 4] });
    assert.ok(missing);
    assert.equal(missing?.objectType, undefined);
  });
  test("subtraction bird type is not a visual theme (falls back per round)", () => {
    const s = toSubtractionContent({
      contentId: "s1",
      difficulty: 1,
      type: "subtraction_question",
      question: { start: 5, removed: 2 },
      objects: { type: "bird", startCount: 5, removedCount: 2 },
      answers: [3, 4, 2, 5],
    });
    assert.ok(s);
    assert.equal(s?.correctAnswer, 3);
    assert.equal(s?.objectType, undefined);
  });
  test("invalid math still rejected with theme present", () => {
    const bad = toAdditionContent(additionItem({ type: "apple" }));
    assert.ok(bad);
    const wrong = toAdditionContent({
      contentId: "t3",
      difficulty: 1,
      type: "addition_question",
      question: { a: 2, b: 3 },
      objects: { type: "apple" },
      answers: [5, 6, 4, 7],
      correctAnswer: 6,
    });
    assert.equal(wrong, null);
  });
});
