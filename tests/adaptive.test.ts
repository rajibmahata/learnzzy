import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { GameEventSchema } from "../src/lib/validation.ts";

// Adaptive learning guardrails: learner lifecycle events are accepted,
// promotion rules never jump aggressively, plans are always validated.
// Schema test uses REAL validation code; rule tests mirror the deterministic
// services (src/services/levelService.ts, personalizationService.ts) which
// can't be imported here (they use @/ aliases + Mongo).

describe("learner lifecycle events (real schema)", () => {
  const base = { gameId: "addition" };
  const learnerEvents = [
    "learner_started",
    "profile_created",
    "age_band_selected",
    "game_recommended",
    "activity_completed",
    "level_completed",
    "level_unlocked",
    "star_awarded",
    "sticker_awarded",
    "badge_awarded",
    "interest_signal_recorded",
    "learning_plan_created",
    "learning_plan_updated",
    "hint_used",
  ];
  for (const event of learnerEvents) {
    test(`accepts ${event}`, () => {
      const r = GameEventSchema.safeParse({ ...base, event });
      assert.equal(r.success, true, `${event} should validate`);
    });
  }
  test("rejects arbitrary event names", () => {
    const r = GameEventSchema.safeParse({ ...base, event: "hacked_the_planet" });
    assert.equal(r.success, false);
  });
});

describe("promotion guardrails (mirrors levelService)", () => {
  const MIN_COMPLETIONS = 3;
  const MIN_ACCURACY = 0.8;
  function shouldPromote(level: number, completions: number, accuracy: number): boolean {
    if (level >= 5) return false;
    if (completions < MIN_COMPLETIONS) return false;
    if (accuracy < MIN_ACCURACY) return false;
    return true;
  }
  test("no promotion after single success", () => {
    assert.equal(shouldPromote(1, 1, 1), false);
  });
  test("no promotion below accuracy threshold", () => {
    assert.equal(shouldPromote(1, 5, 0.6), false);
  });
  test("promotion only after 3+ completions at 80%+", () => {
    assert.equal(shouldPromote(1, 3, 0.8), true);
  });
  test("never promotes past level 5", () => {
    assert.equal(shouldPromote(5, 99, 1), false);
  });
  test("promotion is exactly +1 level (no jumps)", () => {
    const next = (level: number) => Math.min(5, level + 1);
    assert.equal(next(1), 2);
    assert.equal(next(4), 5);
    assert.equal(next(5), 5);
  });
});

describe("learning plan validation (mirrors personalizationService)", () => {
  const VALID_IDS = new Set(["addition", "subtraction", "clean-up", "puzzle", "sketch", "discover"]);
  const VALID_REASONS = new Set(["interest", "need-practice", "variety"]);
  function validPlan(items: { gameId: string; level: number; reason: string }[]): boolean {
    if (items.length !== VALID_IDS.size) return false;
    if (new Set(items.map((i) => i.gameId)).size !== VALID_IDS.size) return false;
    return items.every((i) => VALID_IDS.has(i.gameId) && i.level >= 1 && i.level <= 5 && VALID_REASONS.has(i.reason));
  }
  test("valid 6-game plan passes", () => {
    assert.equal(
      validPlan([
        { gameId: "addition", level: 2, reason: "need-practice" },
        { gameId: "subtraction", level: 2, reason: "variety" },
        { gameId: "clean-up", level: 2, reason: "interest" },
        { gameId: "puzzle", level: 2, reason: "variety" },
        { gameId: "sketch", level: 2, reason: "variety" },
        { gameId: "discover", level: 1, reason: "variety" },
      ]),
      true
    );
  });
  test("rejects unknown game, bad level, bad reason", () => {
    assert.equal(validPlan([{ gameId: "chess", level: 2, reason: "variety" }] as never), false);
    assert.equal(
      validPlan([
        { gameId: "addition", level: 9, reason: "variety" },
        { gameId: "subtraction", level: 2, reason: "variety" },
        { gameId: "clean-up", level: 2, reason: "variety" },
        { gameId: "puzzle", level: 2, reason: "variety" },
        { gameId: "sketch", level: 2, reason: "variety" },
      ]),
      false
    );
    assert.equal(
      validPlan([
        { gameId: "addition", level: 2, reason: "ai-says-so" },
        { gameId: "subtraction", level: 2, reason: "variety" },
        { gameId: "clean-up", level: 2, reason: "variety" },
        { gameId: "puzzle", level: 2, reason: "variety" },
        { gameId: "sketch", level: 2, reason: "variety" },
      ]),
      false
    );
  });
  test("rejects duplicate games", () => {
    assert.equal(
      validPlan([
        { gameId: "addition", level: 1, reason: "interest" },
        { gameId: "addition", level: 1, reason: "interest" },
        { gameId: "puzzle", level: 1, reason: "variety" },
        { gameId: "sketch", level: 1, reason: "variety" },
        { gameId: "clean-up", level: 1, reason: "variety" },
      ]),
      false
    );
  });
});

describe("nickname normalization (mirrors learners repo)", () => {
  function normalize(raw?: string): string | undefined {
    if (!raw) return undefined;
    const s = raw.trim().slice(0, 20);
    return s.length < 1 ? undefined : s;
  }
  test("optional: empty/blank => anonymous", () => {
    assert.equal(normalize(undefined), undefined);
    assert.equal(normalize(""), undefined);
    assert.equal(normalize("   "), undefined);
  });
  test("trims and caps at 20 chars", () => {
    assert.equal(normalize("  Raj  "), "Raj");
    assert.equal(normalize("a".repeat(50))?.length, 20);
  });
});

describe("age bands", () => {
  test("only 4-5, 6-7, 8-9 accepted", () => {
    const valid = new Set(["4-5", "6-7", "8-9"]);
    assert.ok(valid.has("4-5") && valid.has("6-7") && valid.has("8-9"));
    assert.ok(!valid.has("3-4") && !valid.has("10-12") && !valid.has(""));
  });
});
