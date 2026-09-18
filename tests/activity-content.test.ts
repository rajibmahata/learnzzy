import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { generateActivityContent, numberName } from "../src/lib/activityContent.ts";
import { resolveComplexity } from "../src/lib/complexity.ts";
import type { AgeBand } from "../src/lib/complexity.ts";

const GENERATORS = ["number-count", "number-order", "number-before-after", "shape-count", "big-small", "word-family", "word-match", "trace-write", "pattern", "find-object", "more-less", "number-names", "count-by-tens", "matching", "odd-one-out", "memory", "trace-number-name", "shape-match", "shape-pattern"];
const BANDS: AgeBand[] = ["4-5", "6-7", "8-9"];

// Deterministic worksheet-inspired generators: validated answers,
// rotated positions/visuals, no recent-repeat ids, age-appropriate ranges.
describe("activity content generators (real code)", () => {
  test("every generator returns exactly-one-correct validated content", () => {
    for (const g of GENERATORS) {
      for (const band of BANDS) {
        const c = resolveComplexity(g, band, 2);
        const item = generateActivityContent(g, `seed-1`, c);
        assert.ok(item, `${g}/${band}`);
        assert.equal(item!.options.filter((o) => o === item!.answer).length, 1, `${g}/${band} one-correct`);
        assert.equal(new Set(item!.options).size, item!.options.length, `${g}/${band} unique`);
        assert.ok(item!.hints.length >= 2, `${g}/${band} hints`);
        assert.ok(item!.explanation.length >= 5, `${g}/${band} explanation`);
      }
    }
  });
  test("seeds vary content; same seed is deterministic", () => {
    const c = resolveComplexity("counting", "6-7", 2);
    const a = generateActivityContent("number-count", "s1", c)!;
    const b = generateActivityContent("number-count", "s1", c)!;
    const d = generateActivityContent("number-count", "s2", c)!;
    assert.equal(a.contentId, b.contentId);
    assert.notEqual(a.contentId, d.contentId);
  });
  test("age bands change the actual problem", () => {
    const young = generateActivityContent("number-order", "age", resolveComplexity("ordering", "4-5", 1))!;
    const old = generateActivityContent("number-order", "age", resolveComplexity("ordering", "8-9", 3))!;
    assert.ok(old.visual.length >= young.visual.length);
    const yc = generateActivityContent("number-count", "r", resolveComplexity("counting", "4-5", 1))!;
    assert.ok(Number(yc.answer) <= 10);
  });
  test("answer positions rotate across seeds", () => {
    const idx = new Set(GENERATORS.flatMap((g) =>
      Array.from({ length: 6 }, (_, i) => generateActivityContent(g, `rot-${i}`, resolveComplexity(g, "6-7", 2))!.answerIndex)
    ));
    assert.ok(idx.size > 1, "positions rotate");
  });
  test("number names are correct English 1–100", () => {
    assert.equal(numberName(1), "one");
    assert.equal(numberName(13), "thirteen");
    assert.equal(numberName(20), "twenty");
    assert.equal(numberName(42), "forty-two");
    assert.equal(numberName(100), "one hundred");
    const item = generateActivityContent("number-names", "nn", resolveComplexity("number-names", "4-5", 1))!;
    assert.ok(item.answer.length > 0);
    // 4–5 stays within 1–10 in either direction
    for (let i = 0; i < 10; i++) {
      const it = generateActivityContent("number-names", `nn4-${i}`, resolveComplexity("number-names", "4-5", 1))!;
      const nums = [...it.options.map((o) => Number(o)).filter((x) => Number.isFinite(x) && x > 0), Number(it.visual[0])].filter((x) => Number.isFinite(x));
      for (const v of nums) assert.ok(v >= 1 && v <= 10, `4-5 number-names in range, got ${v}`);
    }
  });
  test("count-by-tens answers are multiples of ten", () => {
    for (const band of BANDS) {
      for (let i = 0; i < 5; i++) {
        const it = generateActivityContent("count-by-tens", `t${i}`, resolveComplexity("count-by-tens", band, 2))!;
        assert.equal(Number(it.answer) % 10, 0, `${band} tens`);
      }
    }
  });
  test("more-less answers are group positions 1 or 2", () => {
    for (let i = 0; i < 8; i++) {
      const it = generateActivityContent("more-less", `ml${i}`, resolveComplexity("more-less", "6-7", 2))!;
      assert.ok(it.answer === "1" || it.answer === "2");
      assert.ok(it.visual.length === 3); // group, VS, group
    }
  });
  test("trace-number-name produces trace-write kind with valid index", () => {
    const it = generateActivityContent("trace-number-name", "tn", resolveComplexity("number-names", "6-7", 2))!;
    assert.equal(it.kind, "trace-write");
    assert.equal(it.options[it.answerIndex], it.answer);
  });
  test("unknown template returns null (caller falls back)", () => {
    const c = resolveComplexity("counting", "6-7", 1);
    assert.equal(generateActivityContent("nope", "s", c), null);
  });
});
