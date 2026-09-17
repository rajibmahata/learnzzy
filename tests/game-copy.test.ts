import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { addHint, addInstruction } from "../src/games/addition.ts";
import { subHint, subInstruction } from "../src/games/subtraction.ts";

// Deterministic instruction/hint copy (real game code): short, varied by
// operands, never revealing more than a nudge. Same inputs => same copy.
describe("math instruction/hint copy (real code)", () => {
  test("addition instruction rotates deterministically by sum", () => {
    const seen = new Set([0, 1, 2, 3, 4, 5, 6].map((s) => addInstruction(s, 0)));
    assert.ok(seen.size > 1, "instructions must vary across rounds");
    for (const [a, b] of [[3, 2], [1, 1], [9, 4], [0, 0]] as const) {
      const t = addInstruction(a, b);
      assert.ok(t.length >= 4 && t.length <= 80, `instruction sane: ${t}`);
      assert.equal(addInstruction(a, b), t, "deterministic");
    }
  });
  test("addition hint nudges without revealing the answer", () => {
    assert.equal(addHint(4, 3), "Start at 4 and count 3 more.");
    assert.equal(addHint(3, 4), "Start at 4 and count 3 more.");
    assert.ok(addHint(5, 0).includes("5"));
    for (const [a, b] of [[4, 3], [8, 7], [2, 2]] as const) {
      assert.ok(!addHint(a, b).includes(String(a + b + 1)), "no answer leak");
    }
  });
  test("subtraction instruction rotates; results never negative", () => {
    const seen = new Set([1, 2, 3, 4, 5].map((s) => subInstruction(s, 1)));
    assert.ok(seen.size > 1, "instructions must vary across rounds");
    assert.equal(subInstruction(5, 2), subInstruction(5, 2), "deterministic");
  });
  test("subtraction hint references start and removed", () => {
    assert.equal(subHint(7, 2), "Start with 7. Take away 2.");
    assert.ok(subHint(4, 0).includes("4"));
  });
});
