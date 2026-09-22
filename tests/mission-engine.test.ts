import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  generateMission,
  missionFromId,
  MISSION_TEMPLATES,
  oneLetterVariants,
  validateMission,
  validateMissionResponse,
  type MissionStep,
} from "../src/lib/missionEngine.ts";
import { missionPlanner } from "../src/services/missionPlanner.ts";

describe("mini mission templates", () => {
  test("all approved templates generate valid three-step missions for every age band", () => {
    for (const template of MISSION_TEMPLATES) {
      for (const ageBand of ["4-5", "6-7", "8-9"] as const) {
        const mission = generateMission(template.templateId, ageBand, "test-learner:2026-09-19", 2);
        assert.ok(mission);
        assert.equal(mission!.steps.length, 3);
        assert.deepEqual(validateMission(mission!), []);
        assert.equal(new Set(mission!.steps.map((step) => step.stepId)).size, 3);
      }
    }
  });

  test("mission IDs regenerate the same difficulty and content", () => {
    const mission = generateMission("build-word", "8-9", "learner-a:today", 4)!;
    const regenerated = missionFromId(mission.missionId)!;
    assert.equal(regenerated.difficulty, 4);
    assert.deepEqual(regenerated.steps, mission.steps);
  });

  test("age and difficulty alter phonics content without changing the template contract", () => {
    const young = generateMission("build-word", "4-5", "same", 1)!;
    const older = generateMission("build-word", "8-9", "same", 4)!;
    assert.equal(young.primarySkill, "phonics");
    assert.notDeepEqual(young.steps.map((s) => s.content.answer), older.steps.map((s) => s.content.answer));
    assert.ok(young.steps.every((step) => step.content.letters?.length === String(step.content.answer).length));
  });

  test("change-one-thing accepts multiple valid word transformations", () => {
    const mission = generateMission("change-one-thing", "6-7", "valid", 2)!;
    const step = mission.steps[0]!;
    assert.equal(step.validationMode, "multiple_valid");
    for (const accepted of step.content.acceptedAnswers ?? []) assert.equal(validateMissionResponse(step, accepted), true);
    assert.equal(validateMissionResponse(step, "not-a-word"), false);
  });

  test("change-one-thing rounds derive from seeded word families", () => {
    assert.ok(oneLetterVariants("cat").includes("bat"), "cat->bat");
    assert.ok(oneLetterVariants("pig").includes("big"), "pig->big");
    assert.ok(!oneLetterVariants("cat").includes("sun"), "sun is not one change away");
    assert.ok(!oneLetterVariants("cat").includes("cat"), "base excluded");
    for (const seed of ["s1", "s2", "s3", "kid-9:2026-09-19", "another-learner"]) {
      const mission = generateMission("change-one-thing", "6-7", seed, 2)!;
      assert.deepEqual(validateMission(mission), []);
      for (const step of mission.steps) {
        const valid = step.content.acceptedAnswers?.map(String) ?? [];
        assert.ok(valid.length >= 2, "keeps alternatives");
        for (const option of step.content.options ?? []) {
          if (!valid.includes(option)) assert.equal(oneLetterVariants(String(step.content.visualLabel)).includes(option), false, `${option} is a true distractor`);
        }
        for (const accepted of valid) assert.equal(validateMissionResponse(step, accepted), true);
        assert.ok((step.content.strategyOptions ?? []).length >= 1, "offers a strategy");
      }
    }
    const a = generateMission("change-one-thing", "6-7", "seed-a", 2)!.steps.map((s) => s.content.visualLabel);
    const b = generateMission("change-one-thing", "6-7", "seed-b", 2)!.steps.map((s) => s.content.visualLabel);
    assert.notDeepEqual(a, b, "seeds vary the words");
    assert.deepEqual(a, generateMission("change-one-thing", "6-7", "seed-a", 2)!.steps.map((s) => s.content.visualLabel), "same seed deterministic");
  });

  test("find-the-difference rounds vary by seed", () => {
    const seen = new Set<string>();
    for (const seed of ["d1", "d2", "d3", "d4", "d5"]) {
      const mission = generateMission("find-difference", "6-7", seed, 2)!;
      assert.deepEqual(validateMission(mission), []);
      for (const step of mission.steps) seen.add((step.content.visual ?? []).join(""));
    }
    assert.ok(seen.size > 3, "pool larger than one mission");
  });

  test("sort uses order-independent set validation", () => {
    const step = generateMission("sort-group", "6-7", "sort", 2)!.steps[0]!;
    const answer = step.content.answer as string[];
    assert.equal(validateMissionResponse(step, [...answer].reverse()), true);
    assert.equal(validateMissionResponse(step, answer.slice(0, -1)), false);
  });

  test("open-ended and sequence validation never require an artistic exact answer", () => {
    const open: MissionStep = {
      stepId: "open", type: "create", prompt: "Make something", content: { contentId: "open" },
      validationMode: "open_ended", difficulty: 1, hints: ["Try anything"], assets: [], expectedInteraction: "create", metadata: { skill: "creativity" },
    };
    assert.equal(validateMissionResponse(open, "a blue house"), true);
    assert.equal(validateMissionResponse(open, ""), false);
    const sequence: MissionStep = {
      stepId: "sequence", type: "sequence", prompt: "Order", content: { contentId: "sequence", answer: ["one", "two", "three"] },
      validationMode: "sequence", difficulty: 1, hints: ["Start at one"], assets: [], expectedInteraction: "sequence", metadata: { skill: "planning" },
    };
    assert.equal(validateMissionResponse(sequence, ["one", "two", "three"]), true);
    assert.equal(validateMissionResponse(sequence, ["three", "two", "one"]), false);
  });
});

describe("deterministic mission planner", () => {
  test("same learner/date produces same varied adventure", () => {
    const input = { learnerId: "kid-1", ageBand: "6-7" as const, globalLevel: 2, dateKey: "2026-09-19", limit: 4 };
    const a = missionPlanner.recommend(input);
    const b = missionPlanner.recommend(input);
    assert.deepEqual(a.map((item) => item.mission.missionId), b.map((item) => item.mission.missionId));
    assert.equal(new Set(a.map((item) => item.mission.primarySkill)).size, a.length);
  });

  test("planner remains age-safe and uses practice evidence without an AI call", () => {
    const recommendations = missionPlanner.recommend({
      learnerId: "kid-2", ageBand: "4-5", globalLevel: 5, dateKey: "2026-09-19", limit: 5,
      gameProgress: { "word-family": { completions: 5, bestAccuracy: 0.3, lastLevel: 1, recentAccuracy: [0.2, 0.3], hintsUsed: 4 } },
    });
    assert.equal(recommendations.length, 5);
    assert.ok(recommendations.every((item) => item.mission.ageBands.includes("4-5")));
    assert.ok(recommendations.every((item) => item.mission.difficulty >= 1 && item.mission.difficulty <= 5));
  });

  test("planner penalizes recently practiced mission templates", () => {
    const input = { learnerId: "kid-3", ageBand: "6-7" as const, dateKey: "2026-09-19", limit: 5 };
    const fresh = missionPlanner.recommend(input).map((item) => item.mission.templateId);
    const recent = missionPlanner.recommend({ ...input, recentMissionIds: [`mission:${fresh[0]}:6-7:1:old-seed`] });
    assert.notEqual(recent[0]?.mission.templateId, fresh[0]);
  });
});
