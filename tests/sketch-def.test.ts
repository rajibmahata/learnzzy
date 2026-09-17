import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  createSketchDef,
  createSketchActivity,
  guideForShape,
  SKETCH_ACTIVITIES,
  SketchDefSchema,
  SketchActivitySchema,
} from "../src/games/sketch.ts";

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
  test("every catalog shape produces a valid in-bounds guide", () => {
    const seen = new Set<string>();
    for (const entry of SKETCH_ACTIVITIES) {
      const pts = guideForShape(entry.shape);
      assert.ok(pts.length >= 8 && pts.length <= 200, `${entry.shape} guide length ${pts.length}`);
      for (const p of pts) {
        assert.ok(p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100, `${entry.shape} out of bounds`);
      }
      seen.add(entry.shape);
    }
    assert.ok(seen.size >= 15, `library must hold many distinct diagrams (got ${seen.size})`);
  });
  test("activities carry task, instruction, and hint per level", () => {
    for (let level = 1; level <= 5; level++) {
      const def = createSketchActivity(`level-${level}`, level);
      assert.equal(SketchActivitySchema.safeParse(def).success, true);
      assert.ok(["trace", "dots", "pattern"].includes(def.taskType ?? ""), "task type required");
      assert.ok((def.instruction ?? "").length >= 4, "instruction required");
      assert.ok((def.hint ?? "").length >= 4, "hint required");
    }
  });
  test("activities are deterministic and vary across seeds and levels", () => {
    const a = createSketchActivity("same", 3);
    const b = createSketchActivity("same", 3);
    assert.deepEqual(a, b);
    const shapes = new Set(Array.from({ length: 30 }, (_, i) => createSketchActivity(`v-${i}`, 3).shape));
    assert.ok(shapes.size > 1, "level band must offer multiple diagrams");
    const l1 = createSketchActivity("band", 1);
    const l5 = createSketchActivity("band", 5);
    assert.ok(l1.tolerance >= l5.tolerance, "higher levels tolerate less");
  });
  test("invalid activity copy rejected", () => {
    const base = createSketchActivity("copy-check", 2);
    assert.equal(SketchActivitySchema.safeParse({ ...base, taskType: "coloring" }).success, false);
    assert.equal(SketchActivitySchema.safeParse({ ...base, instruction: "" }).success, false);
    assert.equal(SketchActivitySchema.safeParse({ ...base, hint: "x".repeat(200) }).success, false);
  });
});
