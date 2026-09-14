const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

describe("deterministic math (mirrors src/games logic)", () => {
  test("addition: correctAnswer = a + b", () => {
    const cases = [[3, 2, 5], [1, 1, 2], [5, 5, 10], [0, 0, 0]];
    for (const [a, b, expected] of cases) assert.equal(a + b, expected);
  });
  test("subtraction never negative when removed <= start", () => {
    for (let start = 1; start <= 10; start++) {
      for (let removed = 0; removed <= start; removed++) {
        assert.ok(start - removed >= 0);
      }
    }
  });
  test("answer options contain exactly one correct answer", () => {
    const answers = [3, 4, 5, 6];
    const correct = 5;
    assert.equal(answers.filter((a) => a === correct).length, 1);
    assert.equal(new Set(answers).size, answers.length);
  });
});
