import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createSketchDef, SketchDefSchema } from "../src/games/sketch.ts";

// Sketch content contract: every generated definition must validate, be
// deterministic per seed, and vary across seeds (dynamic diagram selection).
describe("sketch definitions (real code)", () => {
  test("defs validate for all difficulties", () => {
    for (const d of [1, 2, 3] as const) {
      const def = createSketchDef(`seed-${d}`, d);
      assert.equal(SketchDefSchema.safeParse(def).success, true, `difficulty ${d} must validate`);
    }
  });
  test("deterministic per seed", () => {
    const a = createSketchDef("same-seed", 2);
    const b = createSketchDef("same-seed", 2);
    assert.deepEqual(a, b);
  });
  test("different seeds give different diagrams", () => {
    const shapes = new Set([0, 1, 2, 3, 4].map((i) => createSketchDef(`seed-${i}`, 1).guidePath.length));
    assert.ok(shapes.size > 1, "guide paths must vary so rounds feel dynamic");
  });
  test("guide path bounds and thresholds sane", () => {
    const def = createSketchDef("bounds", 1);
    assert.ok(def.guidePath.length >= 8 && def.guidePath.length <= 200);
    for (const p of def.guidePath) {
      assert.ok(p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100);
    }
    assert.ok(def.tolerance > 0 && def.coverageThreshold > 0 && def.coverageThreshold < 1);
  });
  test("invalid defs rejected", () => {
    assert.equal(SketchDefSchema.safeParse({ shape: "", guidePath: [] }).success, false);
    assert.equal(SketchDefSchema.safeParse({ shape: "circle", guidePath: [{ x: 500, y: 0 }] }).success, false);
  });
});
