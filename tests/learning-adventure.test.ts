import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { LEARNING_ACTIVITY_REGISTRY, validateLearningActivities } from "../src/lib/learningActivities.ts";
import { LEARNING_WORLDS, validateWorlds } from "../src/lib/learningWorlds.ts";
import { repetitionPenalty, isBoringRepeat, isGoodVariety, type ActivityFingerprint } from "../src/lib/activityVarietyEngine.ts";
import { worldForId } from "../src/lib/learningWorlds.ts";

describe("learning worlds (scalable, 15 worlds)", () => {
  test("15 worlds validate, unique ids, mechanics", () => {
    assert.deepEqual(validateWorlds(), []);
    assert.ok(LEARNING_WORLDS.length >= 15);
    for (const w of LEARNING_WORLDS) assert.ok(w.mechanics.length > 0);
  });
  test("each world maps to characters and categories", () => {
    for (const w of LEARNING_WORLDS) assert.ok(w.characterId);
    assert.ok(worldForId("colors")?.icon === "🌈");
    assert.equal(worldForId("nope"), null);
  });
});

describe("learning activities (world-scalable, Zod)", () => {
  test("registry validates, covers all worlds", () => {
    assert.deepEqual(validateLearningActivities(), []);
    const worlds = new Set(LEARNING_ACTIVITY_REGISTRY.map((a) => a.world));
    for (const wid of ["colors", "animals", "insects", "thinking", "creative", "robots", "fruits", "stories"]) assert.ok(worlds.has(wid), wid);
  });
  test("activity types include GAME/MISSION/DISCOVERY/STORY/CREATIVE/EXTERNAL_STORY", () => {
    const types = new Set(LEARNING_ACTIVITY_REGISTRY.map((a) => a.type));
    for (const t of ["GAME", "MISSION", "DISCOVERY", "STORY", "CREATIVE", "EXTERNAL_STORY"]) assert.ok(types.has(t as never), t);
  });
  test("external story is curated and distinguishable", () => {
    const ext = LEARNING_ACTIVITY_REGISTRY.find((a) => a.type === "EXTERNAL_STORY")!;
    assert.equal(ext.provenance?.source, "curated-external");
    assert.equal(ext.safetyStatus, "approved");
  });
  test("age bands filter deterministically", () => {
    const four = LEARNING_ACTIVITY_REGISTRY.filter((a) => (a.ageBands as string[]).includes("4-5"));
    const eight = LEARNING_ACTIVITY_REGISTRY.filter((a) => (a.ageBands as string[]).includes("8-9"));
    assert.ok(four.length > 0 && eight.length > 0);
  });
});

describe("variety engine (deterministic, no LLM)", () => {
  const fp = (world: string, mechanic: string, id: string): ActivityFingerprint => ({ activityId: id, type: "DISCOVERY", mechanic, theme: world, world, difficulty: 1 });
  test("penalizes recent repeats, rewards variety", () => {
    const signals = { recentFingerprints: [fp("colors", "find-color", "color-detective"), fp("colors", "find-color", "color-detective")], recentWorlds: ["colors"], recentMechanics: ["find-color"], recentThemes: ["colors"] };
    const same = repetitionPenalty(fp("colors", "find-color", "color-detective"), signals);
    const diff = repetitionPenalty(fp("animals", "safari", "animal-safari"), signals);
    assert.ok(same > diff, `same ${same} should be > diff ${diff}`);
  });
  test("detects boring 3-in-a-row", () => {
    const seq = [fp("colors", "find-color", "a"), fp("colors", "find-color", "a"), fp("colors", "find-color", "a")];
    assert.equal(isGoodVariety(seq), false);
    assert.equal(isGoodVariety([fp("colors", "find-color", "a"), fp("animals", "safari", "b"), fp("colors", "find-color", "a")]), true);
  });
  test("isBoringRepeat flags immediate repeat", () => {
    const signals = { recentFingerprints: [fp("robots", "robot-path", "robot-path"), fp("robots", "robot-path", "robot-path")], recentWorlds: [], recentMechanics: [], recentThemes: [] };
    assert.equal(isBoringRepeat(fp("robots", "robot-path", "robot-path"), signals), true);
    assert.equal(isBoringRepeat(fp("colors", "find-color", "color-detective"), signals), false);
  });
});
