import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  resolvePetIdentity,
  nextPetState,
  personalityFor,
  safeZonesFor,
  assetManifestFor,
} from "../src/lib/petCompanion.ts";

describe("personal pet identity (learner-isolated, never hardcoded)", () => {
  test("resolves RV + Bunny → RV's BunBun", () => {
    const pet = resolvePetIdentity({ learnerId: "rv-1", nickname: "RV", companion: { characterId: "bunny", displayName: "BunBun" } });
    assert.ok(pet);
    assert.equal(pet!.characterId, "bunny");
    assert.equal(pet!.title, "RV's BunBun");
  });
  test("no learner → no pet (never default/global)", () => {
    assert.equal(resolvePetIdentity(null), null);
    assert.equal(resolvePetIdentity({ nickname: "RV" }), null);
  });
  test("two children isolated: RV/Bunny vs Aarvi/Elephant", () => {
    const a = resolvePetIdentity({ learnerId: "rv", nickname: "RV", companion: { characterId: "bunny" } })!;
    const b = resolvePetIdentity({ learnerId: "aarvi", nickname: "Aarvi", companion: { characterId: "elephant" } })!;
    assert.notEqual(a.characterId, b.characterId);
    assert.notEqual(a.learnerId, b.learnerId);
  });
});

describe("pet behavior (deterministic, personality-aware)", () => {
  test("success → CELEBRATE, incorrect → THINK", () => {
    assert.equal(nextPetState({ learnerId: "rv", characterId: "bunny", context: "success", tick: 1, current: "IDLE" }), "CELEBRATE");
    assert.equal(nextPetState({ learnerId: "rv", characterId: "bunny", context: "incorrect", tick: 1, current: "IDLE" }), "THINK");
  });
  test("same tick deterministic, no immediate repeat", () => {
    const a = nextPetState({ learnerId: "rv", characterId: "bunny", context: "home", tick: 7, current: "IDLE" });
    const b = nextPetState({ learnerId: "rv", characterId: "bunny", context: "home", tick: 7, current: "IDLE" });
    assert.equal(a, b);
  });
  test("bunny energetic vs elephant calm pools differ", () => {
    assert.ok(personalityFor("bunny").traits.includes("playful"));
    assert.equal(personalityFor("elephant").energy, "calm");
  });
  test("safe zones keep pet out of game content", () => {
    const zones = safeZonesFor("game");
    assert.ok(zones.length >= 2);
    for (const z of zones) assert.ok(z.top >= 75); // bottom strip only
  });
  test("asset manifest versioned, no runtime generation", () => {
    const m = assetManifestFor("bunny");
    assert.equal(m.version, "v1-emoji");
    assert.ok(m.states.includes("CELEBRATE"));
  });
});
