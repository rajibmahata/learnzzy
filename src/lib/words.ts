// Words & Phonics domain model — deterministic, dependency-free.
// Worksheet-inspired, Learnzzy-native (never copy worksheet art/text).
// One reusable engine: families + complexity config + validators + mix logic.
// Generators live in lib/activityContent and reuse ActivityContent;
// renderers live in ActivityPlayer (build-order / sort-choice / listen-choice).

import type { AgeBand } from "./complexity";

export interface FamilyWord {
  word: string;
  emoji: string;
  name: string;
}

export const WORD_FAMILY_DATA: Record<string, FamilyWord[]> = {
  AT: [
    { word: "cat", emoji: "🐱", name: "cat" },
    { word: "bat", emoji: "🦇", name: "bat" },
    { word: "hat", emoji: "🎩", name: "hat" },
    { word: "mat", emoji: "🧺", name: "mat" },
    { word: "rat", emoji: "🐀", name: "rat" },
    { word: "sat", emoji: "🪑", name: "sat" },
    { word: "fat", emoji: "🐽", name: "fat" },
  ],
  AP: [
    { word: "cap", emoji: "🧢", name: "cap" },
    { word: "map", emoji: "🗺️", name: "map" },
    { word: "tap", emoji: "🚰", name: "tap" },
    { word: "gap", emoji: "🕳️", name: "gap" },
    { word: "lap", emoji: "💤", name: "lap" },
    { word: "sap", emoji: "🌳", name: "sap" },
  ],
  IP: [
    { word: "dip", emoji: "🥣", name: "dip" },
    { word: "hip", emoji: "🦴", name: "hip" },
    { word: "lip", emoji: "👄", name: "lip" },
    { word: "rip", emoji: "📖", name: "rip" },
    { word: "sip", emoji: "🥤", name: "sip" },
  ],
  AN: [
    { word: "can", emoji: "🥫", name: "can" },
    { word: "fan", emoji: "🌀", name: "fan" },
    { word: "man", emoji: "🧑", name: "man" },
    { word: "pan", emoji: "🍳", name: "pan" },
    { word: "ran", emoji: "🏃", name: "ran" },
    { word: "van", emoji: "🚐", name: "van" },
    { word: "ban", emoji: "🚫", name: "ban" },
  ],
  AD: [
    { word: "sad", emoji: "😢", name: "sad" },
    { word: "dad", emoji: "👨", name: "dad" },
    { word: "pad", emoji: "📝", name: "pad" },
    { word: "lad", emoji: "🧒", name: "lad" },
    { word: "mad", emoji: "😠", name: "mad" },
    { word: "bad", emoji: "👎", name: "bad" },
  ],
  ED: [
    { word: "bed", emoji: "🛏️", name: "bed" },
    { word: "red", emoji: "🔴", name: "red" },
    { word: "fed", emoji: "🍼", name: "fed" },
    { word: "led", emoji: "💡", name: "led" },
    { word: "wed", emoji: "💒", name: "wed" },
  ],
  EN: [
    { word: "pen", emoji: "🖊️", name: "pen" },
    { word: "hen", emoji: "🐔", name: "hen" },
    { word: "men", emoji: "👨‍👨‍👦", name: "men" },
    { word: "den", emoji: "🦁", name: "den" },
    { word: "ten", emoji: "🔟", name: "ten" },
    { word: "ben", emoji: "🧑‍🦰", name: "ben" },
  ],
  EG: [
    { word: "leg", emoji: "🦵", name: "leg" },
    { word: "peg", emoji: "📎", name: "peg" },
    { word: "beg", emoji: "🙏", name: "beg" },
    { word: "keg", emoji: "🛢️", name: "keg" },
    { word: "egg", emoji: "🥚", name: "egg" },
  ],
  ET: [
    { word: "net", emoji: "🥅", name: "net" },
    { word: "jet", emoji: "✈️", name: "jet" },
    { word: "pet", emoji: "🐶", name: "pet" },
    { word: "vet", emoji: "🩺", name: "vet" },
    { word: "bet", emoji: "🎲", name: "bet" },
    { word: "set", emoji: "🧩", name: "set" },
  ],
  IN: [
    { word: "pin", emoji: "📌", name: "pin" },
    { word: "bin", emoji: "🗑️", name: "bin" },
    { word: "tin", emoji: "🥫", name: "tin" },
    { word: "fin", emoji: "🐬", name: "fin" },
    { word: "win", emoji: "🏆", name: "win" },
    { word: "sin", emoji: "🌧️", name: "sin" },
  ],
  IG: [
    { word: "pig", emoji: "🐷", name: "pig" },
    { word: "wig", emoji: "💇", name: "wig" },
    { word: "fig", emoji: "🫒", name: "fig" },
    { word: "dig", emoji: "⛏️", name: "dig" },
    { word: "big", emoji: "🐘", name: "big" },
    { word: "gig", emoji: "🎸", name: "gig" },
  ],
  IT: [
    { word: "pit", emoji: "🕳️", name: "pit" },
    { word: "kit", emoji: "🧰", name: "kit" },
    { word: "fit", emoji: "👟", name: "fit" },
    { word: "hit", emoji: "🥎", name: "hit" },
    { word: "sit", emoji: "🪑", name: "sit" },
    { word: "lit", emoji: "🕯️", name: "lit" },
    { word: "bit", emoji: "🔩", name: "bit" },
  ],
  UG: [
    { word: "bug", emoji: "🐞", name: "bug" },
    { word: "hug", emoji: "🤗", name: "hug" },
    { word: "jug", emoji: "🏺", name: "jug" },
    { word: "mug", emoji: "☕", name: "mug" },
    { word: "rug", emoji: "🧶", name: "rug" },
    { word: "tug", emoji: "🚢", name: "tug" },
  ],
  UN: [
    { word: "sun", emoji: "☀️", name: "sun" },
    { word: "run", emoji: "🏃", name: "run" },
    { word: "fun", emoji: "🎉", name: "fun" },
    { word: "bun", emoji: "🍞", name: "bun" },
    { word: "gun", emoji: "🔫", name: "gun" },
  ],
  OP: [
    { word: "top", emoji: "🔝", name: "top" },
    { word: "pop", emoji: "🎈", name: "pop" },
    { word: "mop", emoji: "🧹", name: "mop" },
    { word: "hop", emoji: "🐇", name: "hop" },
  ],
  OB: [
    { word: "gob", emoji: "😮", name: "gob" },
    { word: "job", emoji: "🧑‍🔧", name: "job" },
    { word: "lob", emoji: "🏀", name: "lob" },
    { word: "rob", emoji: "🤖", name: "rob" },
    { word: "sob", emoji: "😢", name: "sob" },
  ],
  OG: [
    { word: "bog", emoji: "🌿", name: "bog" },
    { word: "dog", emoji: "🐶", name: "dog" },
    { word: "fog", emoji: "🌫️", name: "fog" },
    { word: "log", emoji: "🪵", name: "log" },
  ],
  UB: [
    { word: "cub", emoji: "🐻", name: "cub" },
    { word: "dub", emoji: "🎙️", name: "dub" },
    { word: "rub", emoji: "🧽", name: "rub" },
    { word: "tub", emoji: "🛁", name: "tub" },
  ],
  OT: [
    { word: "hot", emoji: "🔥", name: "hot" },
    { word: "pot", emoji: "🍲", name: "pot" },
    { word: "dot", emoji: "⚫", name: "dot" },
    { word: "cot", emoji: "🛏️", name: "cot" },
  ],
};

export const WORD_RIMES = Object.keys(WORD_FAMILY_DATA);

export function wordsInFamily(rime: string): FamilyWord[] {
  return WORD_FAMILY_DATA[rime] ?? [];
}

export function familyOfWord(word: string): string | null {
  const w = word.toLowerCase();
  for (const [rime, words] of Object.entries(WORD_FAMILY_DATA)) {
    if (words.some((x) => x.word === w)) return rime;
  }
  return null;
}

/** Words grouped by sound, not spelling (e.g. egg sounds -eg but spells -gg). */
const SOUND_EXCEPTIONS: Record<string, string[]> = {
  EG: ["egg"],
};

/** Validate every seeded word: lowercase alpha, CVC-ish length, unique per family. */
export function validateFamilies(): string[] {
  const problems: string[] = [];
  for (const [rime, words] of Object.entries(WORD_FAMILY_DATA)) {
    const seen = new Set<string>();
    for (const w of words) {
      if (!/^[a-z]{2,4}$/.test(w.word)) problems.push(`${rime}:${w.word} not lowercase alpha 2-4`);
      if (seen.has(w.word)) problems.push(`${rime}:${w.word} duplicate`);
      seen.add(w.word);
      const spellingOk = w.word.slice(-2).toLowerCase() === rime.slice(-2).toLowerCase();
      const soundOk = (SOUND_EXCEPTIONS[rime] ?? []).includes(w.word);
      if (!spellingOk && !soundOk) problems.push(`${rime}:${w.word} rime mismatch`);
    }
    if (words.length < 3) problems.push(`${rime} needs >=3 words`);
  }
  return problems;
}

// ---- Complexity: data-driven, never hard-coded in components ----

export interface WordPhonicsComplexity {
  ageBand: AgeBand;
  maxChoices: number;
  maxMissingLetters: number;
  allowJumble: boolean;
  pictureSupport: boolean;
  mixedFamilies: boolean;
  maxWordLength: number;
  sortingFamilyCount: number;
  distractorSimilarity: "low" | "medium" | "high";
  listenChoices: number;
}

export const WORD_COMPLEXITY: Record<AgeBand, WordPhonicsComplexity> = {
  "4-5": {
    ageBand: "4-5",
    maxChoices: 3,
    maxMissingLetters: 1,
    allowJumble: false,
    pictureSupport: true,
    mixedFamilies: false,
    maxWordLength: 3,
    sortingFamilyCount: 1,
    distractorSimilarity: "low",
    listenChoices: 3,
  },
  "6-7": {
    ageBand: "6-7",
    maxChoices: 4,
    maxMissingLetters: 1,
    allowJumble: true,
    pictureSupport: true,
    mixedFamilies: true,
    maxWordLength: 3,
    sortingFamilyCount: 2,
    distractorSimilarity: "medium",
    listenChoices: 4,
  },
  "8-9": {
    ageBand: "8-9",
    maxChoices: 4,
    maxMissingLetters: 2,
    allowJumble: true,
    pictureSupport: false,
    mixedFamilies: true,
    maxWordLength: 4,
    sortingFamilyCount: 3,
    distractorSimilarity: "high",
    listenChoices: 4,
  },
};

export function wordComplexity(band: AgeBand): WordPhonicsComplexity {
  return WORD_COMPLEXITY[band] ?? WORD_COMPLEXITY["6-7"];
}

// ---- Session mix: deterministic per-learner rotation, no long repeats ----

export type WordExerciseKind =
  | "word-family"
  | "word-match"
  | "word-jumble"
  | "word-builder"
  | "word-sort"
  | "word-listen"
  | "word-discovery";

const MIX_POOL: WordExerciseKind[] = [
  "word-family",
  "word-match",
  "word-jumble",
  "word-builder",
  "word-sort",
  "word-listen",
  "word-discovery",
];

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic exercise mix for a session: varied order, no immediate repeats. */
export function mixWordExercises(seedKey: string, count: number, band: AgeBand): WordExerciseKind[] {
  const cfg = wordComplexity(band);
  let pool = [...MIX_POOL];
  if (!cfg.allowJumble) pool = pool.filter((k) => k !== "word-jumble");
  const rng = mulberry32(hashSeed(`wordmix:${seedKey}:${band}`));
  const out: WordExerciseKind[] = [];
  let prev = "";
  for (let i = 0; i < count; i++) {
    const choices = pool.filter((k) => k !== prev);
    const kind = choices[Math.floor(rng() * choices.length)] ?? pool[0];
    out.push(kind);
    prev = kind;
  }
  return out;
}
