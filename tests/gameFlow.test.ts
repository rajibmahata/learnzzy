import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildResult, createRoundTransition } from "../src/lib/gameFlow.ts";

const BASE = { gameId: "addition", roundIndex: 0, totalRounds: 5 } as const;

describe("shared game completion contract", () => {
  test("correct mid-game round reports CORRECT without game completion", () => {
    const r = buildResult({ ...BASE, correct: true });
    assert.equal(r.status, "CORRECT");
    assert.equal(r.isCorrect, true);
    assert.equal(r.isRoundComplete, true);
    assert.equal(r.isGameComplete, false);
    assert.equal(r.feedbackEvent, "answer_correct");
    assert.ok(r.completedAt.length > 0);
  });

  test("correct final round reports COMPLETED with game completion", () => {
    const r = buildResult({ ...BASE, roundIndex: 4, correct: true, accuracy: 0.8 });
    assert.equal(r.status, "COMPLETED");
    assert.equal(r.isGameComplete, true);
    assert.equal(r.accuracy, 0.8);
  });

  test("incorrect round never completes the game", () => {
    const r = buildResult({ ...BASE, roundIndex: 4, correct: false });
    assert.equal(r.status, "INCORRECT");
    assert.equal(r.isGameComplete, false);
    assert.equal(r.feedbackEvent, "answer_incorrect");
  });
});

describe("round transition guard", () => {
  test("full lifecycle accepts each step exactly once", () => {
    const t = createRoundTransition(BASE);
    assert.equal(t.phase, "idle");
    const first = t.begin(true);
    assert.equal(first.accepted, true);
    assert.equal(first.result?.status, "CORRECT");
    assert.equal(t.phase, "feedback");
    // Re-entrant answer/dupe timer: rejected.
    assert.deepEqual(t.begin(true), { accepted: false, result: null });
    assert.equal(t.advance(), true);
    assert.equal(t.advance(), false);
    assert.equal(t.phase, "advancing");
    assert.equal(t.finish(), true);
    assert.equal(t.finish(), false);
    assert.equal(t.phase, "done");
    t.reset();
    assert.equal(t.phase, "idle");
  });

  test("out-of-order transitions are rejected (Next before success)", () => {
    const t = createRoundTransition(BASE);
    assert.equal(t.advance(), false);
    assert.equal(t.finish(), false);
    assert.equal(t.phase, "idle");
  });

  test("incorrect feedback still builds a result for signals", () => {
    const t = createRoundTransition({ ...BASE, contentId: "c1" });
    const r = t.begin(false);
    assert.equal(r.accepted, true);
    assert.equal(r.result?.status, "INCORRECT");
    assert.equal(r.result?.contentId, "c1");
  });
});
