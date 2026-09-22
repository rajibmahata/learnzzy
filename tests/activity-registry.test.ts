import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, categoryFor } from "../src/lib/categories.ts";
import { ACTIVITY_REGISTRY, activityFor, activitiesForCategory } from "../src/lib/activityRegistry.ts";
import { resolveComplexity, normalizeAgeBand } from "../src/lib/complexity.ts";

// Category + registry structure (spec §3/§25/§29): categories are primary
// nav, activities live inside categories with full template metadata,
// shipped engines are reused not duplicated.
describe("learning categories + activity registry (real code)", () => {
  test("seven categories with guides and skill lines", () => {
    assert.equal(CATEGORIES.length, 7);
    const ids = CATEGORIES.map((c) => c.id).sort();
    assert.deepEqual(ids, ["discover", "numbers", "puzzles", "shapes", "think", "words", "write"]);
    for (const c of CATEGORIES) {
      assert.ok(c.name.length >= 3);
      assert.ok(c.skillsLine.includes("•"));
      assert.ok(["teddy", "owl", "bunny", "monkey", "parrot"].includes(c.characterId));
    }
    assert.equal(categoryFor("numbers")?.name, "Numbers & Math");
    assert.equal(categoryFor("shapes")?.name, "Shapes & Visual");
    assert.equal(categoryFor("write")?.name, "Write & Create");
    assert.equal(categoryFor("create")?.id, "write"); // renamed id, old URL alias
    assert.equal(categoryFor("nope"), null);
  });
  test("registry covers all worksheet families without duplicating engines", () => {
    const ids = ACTIVITY_REGISTRY.map((a) => a.id);
    for (const need of ["number-count", "number-order", "number-before-after", "more-less", "number-names", "count-by-tens", "addition", "subtraction", "shape-count", "shape-match", "shape-pattern", "big-small", "matching", "odd-one-out", "memory", "word-family", "word-match", "trace-write", "trace-number-name", "sorting", "picture-puzzle", "shadow-sketch", "pattern", "find-object", "discovery"]) {
      assert.ok(ids.includes(need), need);
    }
    // shipped engines link out, new activities generate
    assert.equal(activityFor("addition")?.href, "/play/addition");
    assert.equal(activityFor("sorting")?.href, "/play/clean-up");
    assert.ok((activityFor("number-count")?.generator ?? "").length > 0);
    assert.ok(activitiesForCategory("numbers").length >= 7);
    assert.ok(activitiesForCategory("think").length >= 5);
    assert.ok(activitiesForCategory("shapes").length >= 3);
    assert.ok(activitiesForCategory("write").length >= 3);
  });
  test("every template carries the §25 template model", () => {
    for (const a of ACTIVITY_REGISTRY) {
      assert.ok(a.activityType.length >= 3, `${a.id} activityType`);
      assert.ok(a.complexityDimensions.length >= 2, `${a.id} complexityDimensions`);
      assert.ok(a.renderer === "generic-player" || a.renderer === "game-route", `${a.id} renderer`);
      assert.ok(a.validator === "single-choice" || a.validator === "trace-write" || a.validator === "build-order" || a.validator === "sort-choice", `${a.id} validator`);
      if (a.renderer === "game-route") assert.ok((a.href ?? "").startsWith("/play/"), `${a.id} href`);
      else assert.ok((a.generator ?? "").length > 0, `${a.id} generator`);
    }
  });
  test("complexity: age changes the problem, never just the font", () => {
    const young = resolveComplexity("counting", "4-5", 1);
    const old = resolveComplexity("counting", "8-9", 1);
    assert.ok(old.numberRange > young.numberRange);
    assert.equal(young.timePressure, 0);
    assert.equal(old.timePressure, 0);
    assert.ok(old.itemCount >= young.itemCount);
    assert.equal(young.visualSupport, true);
    assert.equal(normalizeAgeBand("xx"), "6-7");
  });
  test("names family baseline grows 10 → 50 → 100", () => {
    assert.equal(resolveComplexity("number-names", "4-5", 1).numberRange, 10);
    assert.equal(resolveComplexity("number-names", "6-7", 1).numberRange, 50);
    assert.equal(resolveComplexity("number-names", "8-9", 1).numberRange, 100);
  });
});
