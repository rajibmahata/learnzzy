import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { evaluateTracing } from "../src/games/sketch-eval.ts";

// Executes the REAL tracing evaluator (BR-071/072).

const guide = Array.from({ length: 40 }, (_, i) => ({ x: i * 2.5, y: 50 }));

describe("sketch evaluation (real code)", () => {
  test("full trace completes", () => {
    const strokes = [guide.map((p) => ({ ...p }))];
    const r = evaluateTracing(guide, strokes, { tolerance: 9 });
    assert.equal(r.coverage, 1);
    assert.equal(r.completed, true);
  });
  test("empty drawing never completes (no single-dot cheat)", () => {
    const r = evaluateTracing(guide, [], { tolerance: 9 });
    assert.equal(r.completed, false);
    const dot = evaluateTracing(guide, [[{ x: 0, y: 50 }]], { tolerance: 9 });
    assert.equal(dot.completed, false);
  });
  test("partial trace below threshold retries", () => {
    const strokes = [guide.slice(0, 10).map((p) => ({ ...p }))];
    const r = evaluateTracing(guide, strokes, { tolerance: 9, coverageThreshold: 0.6 });
    assert.ok(r.coverage < 0.6);
    assert.equal(r.completed, false);
  });
  test("forgiving tolerance passes near-miss tracing (BR-072)", () => {
    const strokes = [guide.map((p) => ({ x: p.x, y: p.y + 5 }))];
    const strict = evaluateTracing(guide, strokes, { tolerance: 2 });
    const kind = evaluateTracing(guide, strokes, { tolerance: 9 });
    assert.equal(strict.completed, false);
    assert.equal(kind.completed, true);
  });
});
