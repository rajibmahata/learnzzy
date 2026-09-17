import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  toAdditionContent,
  toSubtractionContent,
  toCleanupContent,
  toPuzzleContent,
  toSketchContent,
  type PoolItem,
} from "../src/lib/pool-client.ts";

// These tests execute the REAL pool validators (node type-stripping) —
// pool output must be proven untrusted before reaching gameplay (DEC-071).

function addItem(over: Partial<PoolItem> = {}): PoolItem {
  return {
    contentId: "cnt_test",
    difficulty: 1,
    type: "visual_addition",
    question: { a: 3, b: 2 },
    answers: [3, 4, 5, 6],
    correctAnswer: 5,
    ...over,
  };
}

function subItem(over: Partial<PoolItem> = {}): PoolItem {
  return {
    contentId: "cnt_test",
    difficulty: 1,
    type: "subtraction_question",
    question: { start: 5, removed: 2 },
    answers: [2, 3, 4, 5],
    correctAnswer: 3,
    ...over,
  };
}

describe("pool validators (real code)", () => {
  test("accepts valid addition, recomputes answer", () => {
    const c = toAdditionContent(addItem());
    assert.deepEqual(c, { a: 3, b: 2, answers: [3, 4, 5, 6], correctAnswer: 5 });
  });
  test("rejects addition with wrong pool answer", () => {
    assert.equal(toAdditionContent(addItem({ correctAnswer: 6 })), null);
  });
  test("accepts addition without exposed answer (server recompute)", () => {
    const { correctAnswer: _omitted, ...rest } = addItem();
    const c = toAdditionContent(rest);
    assert.deepEqual(c, { a: 3, b: 2, answers: [3, 4, 5, 6], correctAnswer: 5 });
  });
  test("rejects addition with duplicate or missing-correct options", () => {
    assert.equal(toAdditionContent(addItem({ answers: [5, 5, 6, 7] })), null);
    assert.equal(toAdditionContent(addItem({ answers: [1, 2, 3, 4] })), null);
    assert.equal(toAdditionContent(addItem({ answers: [5, 6] })), null);
  });
  test("rejects addition with non-integer/out-of-range operands", () => {
    assert.equal(toAdditionContent(addItem({ question: { a: 2.5, b: 1 } })), null);
    assert.equal(toAdditionContent(addItem({ question: { a: 21, b: 1 } })), null);
  });
  test("accepts valid subtraction", () => {
    const c = toSubtractionContent(subItem());
    assert.deepEqual(c, { start: 5, removed: 2, answers: [2, 3, 4, 5], correctAnswer: 3 });
  });
  test("rejects subtraction violating non-negativity or wrong answer", () => {
    assert.equal(toSubtractionContent(subItem({ question: { start: 2, removed: 5 } })), null);
    assert.equal(toSubtractionContent(subItem({ correctAnswer: 4 })), null);
    assert.equal(toSubtractionContent(subItem({ answers: [3, 3, 4, 5] })), null);
  });
  test("accepts subtraction without exposed answer (server recompute)", () => {
    const { correctAnswer: _omitted, ...rest } = subItem();
    const c = toSubtractionContent(rest);
    assert.deepEqual(c, { start: 5, removed: 2, answers: [2, 3, 4, 5], correctAnswer: 3 });
  });
  test("accepts valid clean-up scene, rejects dup ids and deco-as-target", () => {
    const scene = {
      theme: "garden",
      targets: [
        { targetId: "target_0", emoji: "🌸", x: 10, y: 20 },
        { targetId: "target_1", emoji: "🍂", x: 60, y: 50 },
      ],
      nonTargets: [{ id: "deco_0", emoji: "🌳", x: 80, y: 80 }],
    };
    const base: PoolItem = { contentId: "c", difficulty: 1, type: "clean_up_scene", question: scene };
    const c = toCleanupContent(base);
    assert.equal(c?.targets.length, 2);
    assert.equal(c?.nonTargets.length, 1);
    assert.equal(
      toCleanupContent({ ...base, question: { ...scene, targets: [scene.targets[0], scene.targets[0]] } }),
      null
    );
    assert.equal(toCleanupContent({ ...base, question: { ...scene, targets: [scene.targets[0]] } }), null);
  });
  test("accepts valid puzzle, rejects broken permutations", () => {
    const puzzle = {
      picture: ["🐱", "🐟", "🌸", "🦋"],
      rows: 2,
      columns: 2,
      pieces: [
        { pieceId: "piece_0", correctPosition: 2, emoji: "🌸" },
        { pieceId: "piece_1", correctPosition: 0, emoji: "🐱" },
        { pieceId: "piece_2", correctPosition: 3, emoji: "🦋" },
        { pieceId: "piece_3", correctPosition: 1, emoji: "🐟" },
      ],
    };
    const base: PoolItem = { contentId: "c", difficulty: 1, type: "picture_puzzle", question: puzzle };
    assert.equal(toPuzzleContent(base)?.pieces.length, 4);
    assert.equal(
      toPuzzleContent({ ...base, question: { ...puzzle, pieces: [...puzzle.pieces, puzzle.pieces[0]] } }),
      null
    );
    assert.equal(toPuzzleContent({ ...base, question: { ...puzzle, rows: 3, columns: 3 } }), null);
  });
  test("accepts valid sketch def, rejects bad tolerance/path", () => {
    const guide = Array.from({ length: 20 }, (_, i) => ({ x: i * 5, y: 50 }));
    const def = { shape: "circle", guidePath: guide, tolerance: 9, coverageThreshold: 0.6 };
    const base: PoolItem = { contentId: "c", difficulty: 1, type: "shadow_sketch", question: def };
    assert.equal(toSketchContent(base)?.shape, "circle");
    assert.equal(toSketchContent({ ...base, question: { ...def, tolerance: 99 } }), null);
    assert.equal(toSketchContent({ ...base, question: { ...def, guidePath: guide.slice(0, 3) } }), null);
  });
  test("passes through sketch task/instruction/hint, rejects bad copy", () => {
    const guide = Array.from({ length: 20 }, (_, i) => ({ x: i * 5, y: 50 }));
    const def = {
      shape: "house",
      guidePath: guide,
      tolerance: 10,
      coverageThreshold: 0.6,
      taskType: "trace",
      instruction: "Draw a house like the example.",
      hint: "Start with the square body.",
    };
    const base: PoolItem = { contentId: "c", difficulty: 1, type: "shadow_sketch", question: def };
    assert.deepEqual(toSketchContent(base), def);
    // Legacy items without copy still validate.
    const { taskType: _t, instruction: _i, hint: _h, ...legacy } = def;
    assert.equal(toSketchContent({ ...base, question: legacy })?.shape, "house");
    assert.equal(toSketchContent({ ...base, question: { ...def, taskType: "coloring" } }), null);
    assert.equal(toSketchContent({ ...base, question: { ...def, instruction: "" } }), null);
    assert.equal(toSketchContent({ ...base, question: { ...def, hint: "x".repeat(200) } }), null);
  });
});
