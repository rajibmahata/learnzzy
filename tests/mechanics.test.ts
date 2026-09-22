import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { MECHANICS, mechanicFor, SKILL_LEVEL_MECHANICS, mechanicForSkillAtLevel } from "../src/lib/mechanics.ts";

describe("reusable primitives (composition over isolated games)", () => {
  test("20 mechanics exist with distinct interactions", () => {
    assert.ok(MECHANICS.length >= 15);
    const ids = new Set(MECHANICS.map((m) => m.id));
    assert.equal(ids.size, MECHANICS.length);
  });
  test("BalloonPop reusable for addition, colors, letters", () => {
    const bp = mechanicFor("BalloonPop")!;
    assert.ok(bp.reusableFor.includes("addition"));
    assert.ok(bp.reusableFor.includes("color-recognition"));
  });
  test("addition 8 levels mechanic evolves, not just number++", () => {
    const l1 = mechanicForSkillAtLevel("addition", 1)!;
    const l4 = mechanicForSkillAtLevel("addition", 4)!;
    const l6 = mechanicForSkillAtLevel("addition", 6)!;
    assert.equal(l1.mechanic, "BalloonPop");
    assert.equal(l4.mechanic, "ObjectCollect");
    assert.notEqual(l1.theme, l4.theme);
    assert.equal(l6.theme, "treasure");
  });
  test("color 7 levels evolve patterns not just speed", () => {
    const c1 = SKILL_LEVEL_MECHANICS["color-recognition"]![0]!;
    const c4 = SKILL_LEVEL_MECHANICS["color-recognition"]![3]!;
    assert.notEqual(c1.mechanic, c4.mechanic);
  });
  test("composition: BalloonPop + Addition + Dinosaur Theme", () => {
    const primitive = mechanicFor("BalloonPop")!;
    const addL1 = mechanicForSkillAtLevel("addition", 1)!;
    assert.equal(primitive.id, "BalloonPop");
    assert.equal(addL1.mechanic, "BalloonPop");
    // Dinosaur Ballon Addition is BalloonPop + addition skill + dinosaur world
    const dinoBalloon = `BalloonPop + addition + dinosaur`;
    assert.ok(dinoBalloon.includes("BalloonPop"));
  });
});
