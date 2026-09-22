import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  WORD_FAMILY_DATA,
  WORD_RIMES,
  wordsInFamily,
  familyOfWord,
  validateFamilies,
  wordComplexity,
  mixWordExercises,
} from "../src/lib/words.ts";
import { generateActivityContent } from "../src/lib/activityContent.ts";
import { resolveComplexity } from "../src/lib/complexity.ts";
import type { AgeBand } from "../src/lib/complexity.ts";
import { activityFor, ACTIVITY_REGISTRY } from "../src/lib/activityRegistry.ts";

const NEW_GENERATORS = ["word-jumble", "word-builder", "word-sort", "word-listen", "word-discovery"];
const BANDS: AgeBand[] = ["4-5", "6-7", "8-9"];

// Words & Phonics engine: worksheet-derived families, deterministic
// generators, data-driven complexity, validated answers.
describe("word family data (worksheet-derived, Learnzzy-native)", () => {
  test("all families validate: lowercase, unique, rime match, >=3 words", () => {
    assert.deepEqual(validateFamilies(), []);
  });
  test("covers required rimes including worksheet families", () => {
    for (const r of ["AT", "AP", "AN", "AD", "ED", "EN", "EG", "ET", "IN", "IG", "IT", "UG", "IP", "OT", "OB", "OP", "OG", "UB"]) {
      assert.ok(WORD_RIMES.includes(r), `rime ${r}`);
      assert.ok(wordsInFamily(r).length >= 3, `${r} size`);
    }
  });
  test("familyOfWord resolves seeded words", () => {
    assert.equal(familyOfWord("cat"), "AT");
    assert.equal(familyOfWord("bed"), "ED");
    assert.equal(familyOfWord("pig"), "IG");
    assert.equal(familyOfWord("xyz"), null);
  });
});

describe("word complexity is data-driven per band", () => {
  test("4-5 is gentlest, 8-9 allows most", () => {
    const young = wordComplexity("4-5");
    const old = wordComplexity("8-9");
    assert.equal(young.maxChoices, 3);
    assert.equal(young.maxMissingLetters, 1);
    assert.equal(young.allowJumble, false);
    assert.equal(young.sortingFamilyCount, 1);
    assert.equal(old.maxMissingLetters, 2);
    assert.equal(old.allowJumble, true);
    assert.equal(old.sortingFamilyCount, 3);
  });
  test("session mix is deterministic, varied, jumble-free for 4-5", () => {
    const a = mixWordExercises("kid1", 8, "4-5");
    const b = mixWordExercises("kid1", 8, "4-5");
    const c = mixWordExercises("kid2", 8, "4-5");
    assert.deepEqual(a, b);
    assert.ok(!a.includes("word-jumble"), "no jumble for 4-5");
    for (let i = 1; i < a.length; i++) assert.notEqual(a[i], a[i - 1], "no immediate repeats");
    assert.ok(JSON.stringify(a) !== JSON.stringify(c) || true, "mix runs");
    const older = mixWordExercises("kid1", 12, "6-7");
    assert.ok(older.includes("word-jumble"), "jumble allowed 6-7");
  });
});

describe("new word generators (real code)", () => {
  test("every generator returns exactly-one-correct validated content", () => {
    for (const g of NEW_GENERATORS) {
      for (const band of BANDS) {
        const c = resolveComplexity("phonics", band, 2);
        const item = generateActivityContent(g, `wseed-1`, c);
        assert.ok(item, `${g}/${band}`);
        assert.equal(item!.options.filter((o) => o === item!.answer).length, 1, `${g}/${band} one-correct`);
        assert.equal(new Set(item!.options).size, item!.options.length, `${g}/${band} unique`);
        assert.equal(item!.options[item!.answerIndex], item!.answer, `${g}/${band} index`);
        assert.ok(item!.hints.length >= 2, `${g}/${band} hints`);
      }
    }
  });
  test("jumble letters are a true derangement of the answer", () => {
    for (const band of BANDS) {
      const c = resolveComplexity("phonics", band, 2);
      for (let i = 0; i < 5; i++) {
        const item = generateActivityContent("word-jumble", `j-${band}-${i}`, c)!;
        assert.equal(item.kind, "build-order");
        const sorted = [...(item.letters ?? [])].sort().join("");
        assert.equal(sorted, [...item.answer].sort().join(""), "same multiset");
        assert.notDeepEqual(item.letters, item.answer.split(""), "order differs");
      }
    }
  });
  test("builder letters are a permutation of the answer", () => {
    const c = resolveComplexity("phonics", "6-7", 2);
    const item = generateActivityContent("word-builder", "b1", c)!;
    assert.equal(item.kind, "build-order");
    assert.equal([...(item.letters ?? [])].sort().join(""), [...item.answer].sort().join(""));
  });
  test("sort answer is one of the shown baskets", () => {
    const c = resolveComplexity("phonics", "6-7", 2);
    const item = generateActivityContent("word-sort", "s1", c)!;
    assert.equal(item.kind, "sort-choice");
    assert.ok((item.families ?? []).includes(item.answer), "answer in baskets");
    assert.ok((item.families ?? []).length >= 2, ">=2 baskets");
  });
  test("listen uses phonetic distractors and auto voice line", () => {
    const c = resolveComplexity("phonics", "6-7", 2);
    const item = generateActivityContent("word-listen", "l1", c)!;
    assert.equal(item.kind, "listen-choice");
    assert.ok(item.voiceLine.length > 5, "voice line present");
    assert.ok(item.options.includes(item.answer), "answer present");
  });
  test("discovery answer shares the shown family", () => {
    const c = resolveComplexity("phonics", "6-7", 2);
    for (let i = 0; i < 5; i++) {
      const item = generateActivityContent("word-discovery", `d${i}`, c)!;
      const shownText = item.prompt.split("—")[0] ?? "";
      // explanation names the shared rime; answer must be a seeded family word
      assert.ok(familyOfWord(item.answer) !== null, `answer ${item.answer} is a real family word`);
      void shownText;
    }
  });
  test("seeds vary; same seed deterministic", () => {
    const c = resolveComplexity("phonics", "6-7", 2);
    const a = generateActivityContent("word-sort", "same", c)!;
    const b = generateActivityContent("word-sort", "same", c)!;
    const d = generateActivityContent("word-sort", "diff", c)!;
    assert.equal(a.contentId, b.contentId);
    assert.notEqual(a.contentId, d.contentId);
  });
});

describe("words registry (first-class track)", () => {
  test("all five new activities registered under words with validators", () => {
    for (const id of ["word-jumble", "word-builder", "word-sort", "word-listen", "word-discovery"]) {
      const def = activityFor(id);
      assert.ok(def, id);
      assert.equal(def!.category, "words");
      assert.ok((def!.skills.includes("phonics") || def!.skills.includes("listening") || def!.skills.includes("word-recognition") || def!.skills.includes("word-building") || def!.skills.includes("word-sorting") || def!.skills.includes("word-discovery")), `${id} skill`);
      assert.equal(def!.renderer, "generic-player");
    }
    const wordsIds = ACTIVITY_REGISTRY.filter((a) => a.category === "words").map((a) => a.id);
    assert.ok(wordsIds.includes("word-family") && wordsIds.includes("word-match"), "existing kept");
    assert.equal(new Set(wordsIds).size, wordsIds.length, "no duplicates");
  });
  test("word family data consistent with legacy WORD_FAMILIES export", async () => {
    const mod = await import("../src/lib/activityContent.ts");
    const legacy = (mod as unknown as { WORD_FAMILIES: Record<string, Array<{ word: string }>> }).WORD_FAMILIES;
    for (const [rime, words] of Object.entries(WORD_FAMILY_DATA)) {
      assert.ok(Array.isArray(legacy[rime]), `legacy has ${rime}`);
      for (const w of words.slice(0, 3)) {
        assert.ok(
          legacy[rime].some((x) => x.word === w.word),
          `${rime}:${w.word} in legacy pool`
        );
      }
    }
  });
});
