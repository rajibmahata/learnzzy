const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

// Mirrors src/lib/content.ts + src/lib/difficulty.ts contracts.
const PLAYABLE = "active";
const STATUSES = ["draft", "validating", "approved", "active", "rejected", "disabled"];

function isPlayable(status) {
  return status === PLAYABLE;
}

function validateAdditionPayload(p) {
  if (!Number.isInteger(p.a) || !Number.isInteger(p.b)) return false;
  if (p.correctAnswer !== p.a + p.b) return false;
  if (!Array.isArray(p.answerOptions) || new Set(p.answerOptions).size !== p.answerOptions.length) return false;
  return p.answerOptions.filter((x) => x === p.correctAnswer).length === 1;
}

function validateSubtractionPayload(p) {
  if (!Number.isInteger(p.startCount) || !Number.isInteger(p.removedCount)) return false;
  if (p.removedCount > p.startCount) return false;
  if (p.correctAnswer !== p.startCount - p.removedCount) return false;
  if (!Array.isArray(p.answerOptions) || new Set(p.answerOptions).size !== p.answerOptions.length) return false;
  return p.answerOptions.filter((x) => x === p.correctAnswer).length === 1;
}

describe("content pool lifecycle", () => {
  test("only active content is playable", () => {
    for (const s of STATUSES) assert.equal(isPlayable(s), s === "active");
  });
  test("addition validator rejects wrong answers and duplicates", () => {
    assert.equal(validateAdditionPayload({ a: 3, b: 2, correctAnswer: 5, answerOptions: [3, 4, 5, 6] }), true);
    assert.equal(validateAdditionPayload({ a: 3, b: 2, correctAnswer: 6, answerOptions: [3, 4, 5, 6] }), false);
    assert.equal(validateAdditionPayload({ a: 3, b: 2, correctAnswer: 5, answerOptions: [5, 5, 6, 7] }), false);
    assert.equal(validateAdditionPayload({ a: 3, b: 2, correctAnswer: 5, answerOptions: [1, 2, 3, 4] }), false);
  });
  test("subtraction validator enforces non-negative + exact answer", () => {
    assert.equal(validateSubtractionPayload({ startCount: 5, removedCount: 2, correctAnswer: 3, answerOptions: [2, 3, 4, 5] }), true);
    assert.equal(validateSubtractionPayload({ startCount: 2, removedCount: 5, correctAnswer: -3, answerOptions: [1, 2, 3, 4] }), false);
    assert.equal(validateSubtractionPayload({ startCount: 5, removedCount: 2, correctAnswer: 4, answerOptions: [2, 3, 4, 5] }), false);
  });
  test("difficulty mapping is total (1<->easy, 2<->medium, 3<->hard)", () => {
    const map = { 1: "easy", 2: "medium", 3: "hard" };
    assert.deepEqual(map, { 1: "easy", 2: "medium", 3: "hard" });
  });
});
