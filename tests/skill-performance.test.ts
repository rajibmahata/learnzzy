import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  decideSkillLevel,
  evaluateSkill,
  skillLevelFor,
  SKILL_GAMES,
} from "../src/lib/skillLevels.ts";

// Per-skill adaptive engine (real code): rolling performance drives exactly
// one skill's level — promotion needs sustained evidence, reduction needs
// repeated weakness, and skills never leak into each other.
describe("skill performance evaluation (real code)", () => {
  test("promotes after 3+ completions at 80%+", () => {
    const d = decideSkillLevel(2, { completions: 3, recentAccuracy: [0.9, 0.85, 0.88] });
    assert.equal(d.action, "promote");
    assert.equal(d.newLevel, 3);
  });
  test("single strong result never promotes", () => {
    const d = decideSkillLevel(2, { completions: 1, recentAccuracy: [1] });
    assert.equal(d.action, "stabilize");
    assert.equal(d.newLevel, 2);
  });
  test("single spike cannot outweigh weak history (rolling window)", () => {
    const d = decideSkillLevel(2, { completions: 5, recentAccuracy: [0.5, 0.55, 0.6, 0.52, 1] });
    assert.notEqual(d.action, "promote");
  });
  test("promotion is exactly +1 and caps at 100", () => {
    const d = decideSkillLevel(4, { completions: 4, recentAccuracy: [0.95, 0.92, 0.96, 0.94] });
    assert.deepEqual([d.action, d.newLevel], ["promote", 5]);
    const maxed = decideSkillLevel(100, { completions: 9, recentAccuracy: [1, 1, 1, 1, 1] });
    assert.equal(maxed.newLevel, 100);
    assert.notEqual(maxed.action, "promote");
  });
  test("weak performance stabilizes first (no instant punishment)", () => {
    const d = decideSkillLevel(4, { completions: 3, recentAccuracy: [0.6, 0.65, 0.62] });
    assert.equal(d.action, "stabilize");
    assert.equal(d.newLevel, 4);
    assert.ok(d.message.length > 0, "child-safe message required");
  });
  test("repeated weak performance reduces exactly one level", () => {
    const d = decideSkillLevel(4, { completions: 6, recentAccuracy: [0.4, 0.45, 0.3, 0.5, 0.42, 0.38] });
    assert.equal(d.action, "reduce");
    assert.equal(d.newLevel, 3);
  });
  test("level 1 never reduces below floor", () => {
    const d = decideSkillLevel(1, { completions: 8, recentAccuracy: [0.2, 0.3, 0.25, 0.3, 0.2] });
    assert.equal(d.newLevel, 1);
  });
  test("skills decide independently (no cross-skill leakage)", () => {
    const add = decideSkillLevel(4, { completions: 4, recentAccuracy: [0.92, 0.88, 0.91, 0.9] });
    const sub = decideSkillLevel(2, { completions: 4, recentAccuracy: [0.65, 0.62, 0.68, 0.6] });
    assert.equal(add.newLevel, 5);
    assert.equal(sub.newLevel, 2);
    assert.equal(sub.action, "stabilize");
  });
  test("trend reflects real rolling data", () => {
    assert.equal(evaluateSkill({ completions: 4, recentAccuracy: [0.94, 0.92, 0.96, 0.95] }).trend, "strong");
    assert.equal(evaluateSkill({ completions: 3, recentAccuracy: [0.5, 0.55, 0.52] }).trend, "needs_practice");
    assert.equal(evaluateSkill({ completions: 0, recentAccuracy: [] }).trend, "steady");
  });
  test("skill baseline: override wins, otherwise foundation (never global)", () => {
    // Global level never lifts a skill — no double promotion, no leakage.
    assert.equal(skillLevelFor({ level: 4 }, "addition"), 1);
    assert.equal(skillLevelFor({ level: 5, gameLevels: { addition: 5 } }, "addition"), 5);
    assert.equal(skillLevelFor({ level: 5, gameLevels: { addition: 5 } }, "subtraction"), 1);
    assert.ok(SKILL_GAMES.includes("addition") && SKILL_GAMES.includes("sketch"));
  });
});
