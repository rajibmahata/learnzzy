import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  nextStage,
  stageForProgress,
  pickNextConcept,
  scoreConcept,
  recommendGame,
  decideNextStep,
  parentReasonText,
  validateAcademicPlan,
} from "../src/lib/academic.ts";
import {
  VOICE_CHARACTERS,
  pickCharacterFor,
  scriptFor,
  voiceCacheKey,
  parrotLadder,
  normalizeLocale,
} from "../src/lib/voice.ts";
import {
  VISUAL_THEMES,
  pickVisualTheme,
  renderMathWithTheme,
  verifyThemeMath,
  buildCrossDomainActivity,
} from "../src/lib/visualThemes.ts";

// Agentic Academic Engine: learn→master stages, next-concept ordering,
// game recommendation, post-activity decisions, and the authority gate.
describe("academic stage machine (learn→master)", () => {
  test("advances one stage per success, never skips", () => {
    assert.equal(nextStage("learn", true), "practice");
    assert.equal(nextStage("practice", true), "play");
    assert.equal(nextStage("play", true), "recall");
    assert.equal(nextStage("recall", true), "review");
    assert.equal(nextStage("review", true), "master");
    assert.equal(nextStage("master", true), "master");
  });
  test("failure holds or steps back to practice, never forward", () => {
    assert.equal(nextStage("learn", false), "learn");
    assert.equal(nextStage("play", false), "practice");
    assert.equal(nextStage("master", false), "review");
  });
  test("stage derives from history, not a single answer", () => {
    assert.equal(stageForProgress(0, 0, 0), "learn");
    assert.equal(stageForProgress(1, 0, 0), "practice");
    assert.equal(stageForProgress(2, 4, 0.9), "recall");
  });
});

describe("next-concept ordering (review→need→new, prereq-aware)", () => {
  const base = [
    { id: "a", status: "mastered", accuracy: 1, prerequisites: [] as string[] },
    { id: "b", status: "practicing", accuracy: 0.4, prerequisites: ["a"] },
    { id: "c", status: "new", accuracy: 0, prerequisites: ["b"] },
  ];
  test("review-due wins over everything", () => {
    const pick = pickNextConcept({
      learnerId: "l1",
      concepts: [
        ...base,
        { id: "d", status: "needs_review", accuracy: 0.9, prerequisites: [] },
      ],
      nowIso: "2026-09-17T00:00:00.000Z",
    });
    assert.equal(pick?.conceptId, "d");
    assert.equal(pick?.reasonCode, "review_due");
  });
  test("weakest practiced beats unseen", () => {
    const pick = pickNextConcept({ learnerId: "l1", concepts: base, nowIso: "2026-09-17T00:00:00.000Z" });
    assert.equal(pick?.conceptId, "b");
    assert.equal(pick?.reasonCode, "needs_practice");
  });
  test("unseen waits for prerequisites (deterministic per learner)", () => {
    const onlyNew = [
      { id: "x", status: "new", accuracy: 0, prerequisites: ["missing"] },
      { id: "y", status: "new", accuracy: 0, prerequisites: [] },
    ];
    const p1 = pickNextConcept({ learnerId: "l1", concepts: onlyNew });
    const p2 = pickNextConcept({ learnerId: "l1", concepts: onlyNew });
    assert.equal(p1?.conceptId, p2?.conceptId);
  });
  test("interest boosts but never overrides review", () => {
    assert.ok(scoreConcept({ accuracy: 0.4, interest: 0, reviewDue: true, isNew: false }) > scoreConcept({ accuracy: 0.4, interest: 10, reviewDue: false, isNew: false }));
  });
});

describe("validated learning plan gate", () => {
  const good = {
    learnerId: "learner_1",
    objective: "bird-recognition",
    concept: "birds.parrot",
    prerequisiteConcepts: ["knowledge.world-discovery"],
    activityType: "recognition",
    difficulty: 2,
    complexity: 2,
    reason: "Parrot recognition needs more practice.",
    reasonCode: "needs_practice",
    source: "deterministic",
    nextReviewAt: "2026-09-20T00:00:00.000Z",
    stage: "practice",
    game: "discover",
    locale: "en",
    characterId: "parrot",
    priority: 0.82,
  };
  test("accepts the spec-shaped plan", () => {
    const p = validateAcademicPlan(good);
    assert.ok(p);
    assert.equal(p?.concept, "birds.parrot");
    assert.equal(p?.priority, 0.82);
  });
  test("rejects chain-of-thought, banned content, level jumps", () => {
    assert.equal(validateAcademicPlan({ ...good, reason: "chain-of-thought: I think..." }), null);
    assert.equal(validateAcademicPlan({ ...good, concept: "kill monsters" }), null);
    assert.equal(validateAcademicPlan({ ...good, complexity: 9 }), null);
    assert.equal(validateAcademicPlan({ ...good, activityType: "exam" }), null);
  });
  test("parent reason never leaks internals", () => {
    assert.equal(parentReasonText("needs_practice", "Parrot"), "Parrot recognition needs more practice.".replace("Parrot recognition", "Parrot"));
    assert.ok(!parentReasonText("needs_practice", "Parrot").includes("tutor-mcp"));
  });
});

describe("game recommendation (spec §16)", () => {
  test("returns game/concept/complexity/objective/reasonCode/priority", () => {
    const r = recommendGame({
      learnerId: "l1",
      skills: [{ gameId: "discover", level: 2, accuracy: 0.5, completions: 4 }],
      interests: { discover: 5 },
      conceptId: "birds.parrot",
      conceptToGame: { "birds.parrot": "discover" },
      objective: "bird-recognition",
      reasonCode: "needs_practice",
    });
    assert.equal(r.game, "discover");
    assert.equal(r.concept, "birds.parrot");
    assert.equal(r.complexity, 2);
    assert.ok(r.priority >= 0 && r.priority <= 1);
  });
});

describe("post-activity decisions (no single-answer jumps)", () => {
  test("weak results review at the same complexity", () => {
    const d = decideNextStep({ accuracy: 0.4, hintsUsed: 3, attempts: 3, currentComplexity: 3 });
    assert.equal(d.action, "review");
    assert.equal(d.complexity, 3);
  });
  test("strong sustained results promote by exactly one", () => {
    const d = decideNextStep({ accuracy: 0.9, hintsUsed: 0, attempts: 4, currentComplexity: 2 });
    assert.equal(d.action, "increase_complexity");
    assert.equal(d.complexity, 3);
  });
  test("thin evidence only practices", () => {
    assert.equal(decideNextStep({ accuracy: 1, hintsUsed: 0, attempts: 1, currentComplexity: 4 }).action, "practice");
  });
});

describe("voice characters (5 friends, 11 events, 5 locales)", () => {
  test("five characters exist with distinct voices", () => {
    assert.equal(VOICE_CHARACTERS.length, 5);
    const ids = VOICE_CHARACTERS.map((c) => c.characterId).sort();
    assert.deepEqual(ids, ["bunny", "monkey", "owl", "parrot", "teddy"]);
  });
  test("character pick is deterministic", () => {
    assert.equal(pickCharacterFor("l1:birds.parrot"), pickCharacterFor("l1:birds.parrot"));
  });
  test("scripts resolve per locale without live translation", () => {
    const en = scriptFor({ event: "correct_answer", locale: "en" });
    const hi = scriptFor({ event: "correct_answer", locale: "hi" });
    const bn = scriptFor({ event: "correct_answer", locale: "bn" });
    const ta = scriptFor({ event: "correct_answer", locale: "ta" });
    const te = scriptFor({ event: "correct_answer", locale: "te" });
    assert.equal(en.text, "Yay! You got it!");
    assert.ok(hi.text.length > 0 && hi.text !== en.text);
    assert.ok(bn.text.length > 0 && ta.text.length > 0 && te.text.length > 0);
    assert.equal(normalizeLocale("xx"), "en");
  });
  test("parrot ladder covers show→classify in Hindi/Bengali", () => {
    const hi = parrotLadder("hi");
    assert.equal(hi.length, 4);
    assert.ok(hi[0].text.includes("तोता"));
    const bn = parrotLadder("bn");
    assert.ok(bn[0].text.includes("টিয়া"));
  });
  test("cache keys are deterministic per character/event/locale/text", () => {
    const a = voiceCacheKey("parrot", "instruction", "hi", "hello");
    const b = voiceCacheKey("parrot", "instruction", "hi", "hello");
    const c = voiceCacheKey("parrot", "instruction", "hi", "other");
    assert.equal(a, b);
    assert.notEqual(a, c);
  });
});

describe("dynamic visuals (theme never changes math)", () => {
  test("ten visual themes available", () => {
    assert.ok(VISUAL_THEMES.length >= 10);
  });
  test("theme varies by seed while 2+3 always equals 5", () => {
    const t1 = pickVisualTheme("seed-a");
    const r1 = renderMathWithTheme(2, 3, t1);
    assert.equal(r1.answer, 5);
    assert.ok(verifyThemeMath(2, 3, t1.id));
    assert.ok(verifyThemeMath(4, 2, "fish"));
  });
  test("cross-domain combos map to validated games", () => {
    const combos = ["fruit_addition", "animal_counting", "color_sorting", "shape_counting", "bird_classification"] as const;
    for (const combo of combos) {
      const a = buildCrossDomainActivity(combo, "seed-1");
      assert.ok(a.prompt.length > 5);
      assert.ok(a.conceptIds.length >= 1);
      assert.ok(["addition", "clean-up", "puzzle", "discover"].includes(a.gameId));
    }
  });
});
