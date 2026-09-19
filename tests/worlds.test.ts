import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { WORLDS, artForGame, worldForGame } from "../src/lib/worlds.ts";

// Living Wonder Worlds metadata: every game is a place with a banner,
// a host, and a spark badge (Stitch living-wonder-worlds screen).
describe("worlds metadata (real code)", () => {
  test("six worlds, one per game, unique ids", () => {
    assert.equal(WORLDS.length, 6);
    const ids = WORLDS.map((w) => w.gameId).sort();
    assert.deepEqual(ids, ["addition", "clean-up", "discover", "puzzle", "sketch", "subtraction"]);
  });
  test("every world has an inviting tagline + host + spark", () => {
    for (const w of WORLDS) {
      assert.ok(w.world.length >= 3, `${w.gameId} world name`);
      assert.ok(w.tagline.length >= 10, `${w.gameId} tagline`);
      assert.ok(w.host.length >= 3, `${w.gameId} host`);
      assert.ok(w.spark.length >= 3, `${w.gameId} spark`);
      assert.ok(w.gradient.length >= 3, `${w.gameId} gradient`);
    }
  });
  test("sketch is the only dark (night) world", () => {
    assert.equal(worldForGame("sketch")?.dark, true);
    for (const id of ["addition", "subtraction", "clean-up", "puzzle", "discover"]) {
      assert.equal(worldForGame(id)?.dark ?? false, false);
    }
  });
  test("scene art resolves for all worlds with 3D images (box-tile design)", () => {
    assert.ok((artForGame("clean-up") ?? "").endsWith("clean-up/scene.webp"));
    assert.ok((artForGame("puzzle") ?? "").endsWith("puzzle/scene.webp"));
    assert.ok((artForGame("sketch") ?? "").endsWith("sketch/scene.webp"));
    assert.ok((artForGame("addition") ?? "").includes("number-orchard"));
    assert.ok((artForGame("subtraction") ?? "").includes("breeze-valley"));
    assert.ok((artForGame("discover") ?? "").includes("level-"));
    assert.equal(artForGame("nope"), null);
  });
  test("unknown games resolve to null (caller falls back)", () => {
    assert.equal(worldForGame("nope"), null);
  });
});
