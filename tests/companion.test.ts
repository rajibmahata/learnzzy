import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { praiseFor, primaryCompanionId } from "../src/lib/companion.ts";

describe("companion reactions (deterministic, no LLM)", () => {
  test("same count gives the same reaction; no repeat within a pool cycle", () => {
    const cycles = { placement: 6, round: 6, celebration: 4 } as const;
    for (const moment of ["placement", "round", "celebration"] as const) {
      const a = praiseFor({ characterId: "dino", moment, count: 3, salt: "s" });
      const b = praiseFor({ characterId: "dino", moment, count: 3, salt: "s" });
      assert.deepEqual(a, b);
      const seen = new Set<string>();
      for (let i = 0; i < cycles[moment]; i++) {
        const line = praiseFor({ characterId: "dino", moment, count: i, salt: "s" }).line;
        assert.ok(!seen.has(line), `${moment} repeats at ${i}`);
        seen.add(line);
      }
    }
  });

  test("voice stays inside child-friendly bounds for every character and count", () => {
    for (const id of ["teddy", "bunny", "owl", "monkey", "parrot", "puppy", "dino", "elephant", "fox", "panda", "butterfly", "lion", "nope"]) {
      for (let i = 0; i < 8; i++) {
        const r = praiseFor({ characterId: id, moment: "round", count: i });
        assert.ok(r.rate >= 0.82 && r.rate <= 0.99, `${id}/${i} rate ${r.rate}`);
        assert.ok(r.pitch >= 1.05 && r.pitch <= 1.28, `${id}/${i} pitch ${r.pitch}`);
        assert.ok(r.line.length >= 2 && r.line.length <= 60, "short warm line");
      }
    }
  });

  test("states and effects follow the moment", () => {
    assert.equal(praiseFor({ characterId: "bunny", moment: "placement", count: 0 }).state, "happy");
    assert.equal(praiseFor({ characterId: "bunny", moment: "placement", count: 4 }).state, "surprised");
    assert.equal(praiseFor({ characterId: "bunny", moment: "round", count: 0 }).state, "celebrating");
    assert.equal(praiseFor({ characterId: "bunny", moment: "celebration", count: 0 }).effect, "balloons");
    assert.equal(praiseFor({ characterId: "bunny", moment: "placement", count: 0 }).effect, "none");
    assert.equal(praiseFor({ characterId: "bunny", moment: "placement", count: 3 }).effect, "balloons");
  });

  test("primary companion resolves with safe fallbacks", () => {
    assert.equal(primaryCompanionId({ companion: { characterId: "fox" } }), "fox");
    assert.equal(primaryCompanionId({ companion: { characterId: "dragon" } }), "teddy");
    assert.equal(primaryCompanionId(null, "parrot"), "parrot");
    assert.equal(primaryCompanionId(undefined), "teddy");
  });
});
