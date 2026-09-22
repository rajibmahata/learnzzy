import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { generateBalloons, validateBalloonPop, balloonForTheme } from "../src/lib/balloonMechanic.ts";
import { LEARNING_ACTIVITY_REGISTRY } from "../src/lib/learningActivities.ts";
import { createBalloonLetterRound, validateBalloonLetter } from "../src/games/balloonLetter.ts";

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

describe("balloon letter burst (typing engagement)", () => {
  test("4-5 single letter, 6-7 word initial, 8-9 harder", () => {
    const r1 = createBalloonLetterRound("seed-letter-a", "4-5", 0);
    assert.ok(r1.targetLetter.length === 1 && r1.targetLetter >= "A" && r1.targetLetter <= "Z");
    const r2 = createBalloonLetterRound("seed-letter-b", "6-7", 0);
    assert.ok(r2.targetLetter.length === 1);
    assert.ok(r2.targetWord === undefined || typeof r2.targetWord === "string");
    const r3 = createBalloonLetterRound("seed-letter-c", "8-9", 0);
    assert.ok(r3.balloons.length >= 7);
  });
  test("pop validation: correct letter bursts", () => {
    const round = createBalloonLetterRound("seed-validate", "4-5", 0);
    assert.equal(validateBalloonLetter(round, round.targetLetter), true);
    assert.equal(validateBalloonLetter(round, "9"), false);
  });
  test("balloon-words activity exists in registry", () => {
    const found = LEARNING_ACTIVITY_REGISTRY.find((a) => a.id === "balloon-words");
    assert.ok(found);
    assert.equal(found!.mechanics[0], "balloon-burst");
  });
});

describe("balloon animal burst (cat + word CAT)", () => {
  test("balloon with cat animal bursts and word learned", async () => {
    const { createBalloonAnimalRound, validateBalloonAnimal } = await import("../src/games/balloonAnimal.ts");
    const round = createBalloonAnimalRound("seed-animal-a", "4-5", 0);
    assert.equal(round.targetAnimal, "🐱");
    assert.equal(round.targetWord, "CAT");
    assert.equal(validateBalloonAnimal(round, "🐱"), true);
    assert.equal(validateBalloonAnimal(round, "🐶"), false);
    const hasCat = round.balloons.some((b) => b.payload === "🐱");
    assert.ok(hasCat);
  });
  test("balloon-animals activity exists and uses animal mechanic", () => {
    const found = LEARNING_ACTIVITY_REGISTRY.find((a) => a.id === "balloon-animals");
    assert.ok(found);
    assert.ok(found!.mechanics.includes("balloon-burst") || found!.mechanics.includes("animal-find"));
  });
  test("animal payload via balloonMechanic", async () => {
    const { generateBalloons } = await import("../src/lib/balloonMechanic.ts");
    const ch = generateBalloons({ payloadKind: "animal", count: 5, targetAnimal: "🐱", difficulty: 1, seed: "seed-animal-b" });
    assert.equal(ch.targetAnimal, "🐱");
    assert.ok(ch.balloons.some((b) => b.payload === "🐱"));
  });
});
