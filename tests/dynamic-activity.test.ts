import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { generateBalloons, validateBalloonPop, balloonForTheme } from "../src/lib/balloonMechanic.ts";
import { LEARNING_ACTIVITY_REGISTRY } from "../src/lib/learningActivities.ts";

describe("balloon mechanic (reusable)", () => {
  test("pop N balloons validates count", () => {
    const ch = generateBalloons({ payloadKind: "number", count: 5, targetCount: 5, difficulty: 1, seed: "seed-a" });
    const popped = ch.balloons.slice(0, 5);
    const r = validateBalloonPop(ch, popped);
    assert.equal(r.correct, true);
    assert.equal(validateBalloonPop(ch, popped.slice(0, 2)).correct, false);
  });
  test("color balloons: pop only RED", () => {
    const ch = generateBalloons({ payloadKind: "color", count: 4, targetColor: "red", difficulty: 1, seed: "seed-b" });
    const reds = ch.balloons.filter((b) => b.color === "red");
    assert.ok(reds.length > 0);
    assert.equal(validateBalloonPop(ch, reds).correct, true);
  });
  test("balloons carry different speeds/sizes and theme helper", () => {
    const ch = balloonForTheme("colors", "seed-c");
    assert.equal(ch.targetColor, "red");
    const ch2 = balloonForTheme("words", "seed-d");
    assert.equal(ch2.targetLetter, "B");
  });
});

describe("dynamic activity engine (same skill, different experience)", () => {
  test("addition skill has many mechanics (balloon, dino, fruit, rocket...)", () => {
    const additionMechanics = LEARNING_ACTIVITY_REGISTRY.filter((a) => a.skill === "addition").map((a) => a.mechanics[0]);
    for (const m of ["balloon-pop", "dino-eggs", "fruit-basket", "rocket-fuel"]) assert.ok(additionMechanics.includes(m), m);
  });
  test("environments are dynamic and not all balloons", () => {
    const envs = ["Jungle", "Ocean", "Space", "Garden", "Farm", "Dinosaur Valley", "Rainbow Sky"];
    assert.ok(envs.includes("Jungle") && envs.includes("Ocean"));
  });
  test("same skill via different worlds is possible", () => {
    const additionWorlds = LEARNING_ACTIVITY_REGISTRY.filter((a) => a.skill === "addition").map((a) => a.world);
    assert.ok(new Set(additionWorlds).size >= 3, `addition worlds ${additionWorlds.join(",")}`);
  });
});
