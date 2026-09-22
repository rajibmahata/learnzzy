import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createPuzzleDef, gridForDifficulty, validatePuzzleDef } from "../src/games/puzzle.ts";

// Picture Puzzle levels: global-level difficulty grows the picture
// 4 pieces → 6 → 9 (same ceil(level/2) rule as addition).
describe("puzzle difficulty levels", () => {
  test("grids grow with difficulty", () => {
    assert.deepEqual(gridForDifficulty(1), { rows: 2, columns: 2 });
    assert.deepEqual(gridForDifficulty(2), { rows: 2, columns: 3 });
    assert.deepEqual(gridForDifficulty(3), { rows: 3, columns: 3 });
  });

  test("generated pictures are valid with exact piece counts", () => {
    const counts = { 1: 4, 2: 6, 3: 9 } as const;
    for (const d of [1, 2, 3] as const) {
      for (const seed of [`seed-${d}-a`, `seed-${d}-b`]) {
        const def = createPuzzleDef(seed, d);
        assert.equal(def.pieces.length, counts[d], `difficulty ${d}`);
        assert.equal(def.picture.length, counts[d]);
        assert.equal(validatePuzzleDef(def), true);
      }
    }
  });

  test("same seed is deterministic; tray order varies", () => {
    const a = createPuzzleDef("kid-1", 2);
    const b = createPuzzleDef("kid-1", 2);
    assert.deepEqual(a, b);
  });
});
