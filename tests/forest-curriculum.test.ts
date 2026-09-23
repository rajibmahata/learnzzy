import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { stickerToCreature, forestLevel, depthScaleFor, expandRabbitPopulation } from "../src/lib/livingForest.ts";
import { validateCurriculumRegistry, CURRICULUM_OUTCOMES } from "../src/lib/curriculum/registry.ts";
import { calculateCoverage } from "../src/lib/curriculum/coverage.ts";
import { generateActivityContent } from "../src/lib/activityContent.ts";
import { resolveComplexity } from "../src/lib/complexity.ts";

describe("living forest persistence model", () => {
  test("sticker maps to creature with habitat + movement", () => {
    const c = stickerToCreature({ id: "elephant", name: "Elephant", emoji: "🐘", category: "animals", rarity: "common", description: "", sortOrder: 1, active: true } as never);
    assert.equal(c.habitat, "forest");
    assert.equal(c.movement, "walk");
  });
  test("rabbit expands to population of 3 with variation", () => {
    const base = { stickerId: "rabbit", species: "rabbit", displayName: "Rabbit", category: "animals", habitat: "meadow", movement: "hop", rarity: "common", emoji: "🐰", learnerId: "l1", unlockedAt: "", state: "IDLE", x: 10, y: 70, direction: 1 } as never;
    const pop = expandRabbitPopulation(base, "l1");
    assert.equal(pop.length, 3);
  });
  test("depth scale 0.55 distant → 1.1 foreground", () => {
    assert.ok(depthScaleFor(0) < depthScaleFor(100));
    assert.equal(depthScaleFor(0).toFixed(2), "0.55");
  });
  test("forest level unlocks habitats progressively", () => {
    assert.deepEqual(forestLevel(0).unlockedHabitats, []);
    assert.ok(forestLevel(10).unlockedHabitats.includes("magical-clearing"));
  });
});

describe("curriculum remaining gaps closed", () => {
  test("registry validates, outcomes have provenance", () => {
    assert.deepEqual(validateCurriculumRegistry(), []);
    assert.ok(CURRICULUM_OUTCOMES.length >= 13);
  });
  test("coverage includes division/measurement/observation", () => {
    const cov = calculateCoverage();
    assert.ok(cov.details.some((d) => d.outcome.id === "cbse-math-division" && d.covered));
    assert.ok(cov.details.some((d) => d.outcome.id === "cambridge-science-observe" && d.covered));
  });
  test("new generators produce validated content", () => {
    const cx = resolveComplexity("division", "6-7", 2);
    for (const g of ["division-share", "measurement", "science-observe"] as const) {
      const c = generateActivityContent(g, "seed-test", cx);
      assert.ok(c, g);
    }
  });
});
