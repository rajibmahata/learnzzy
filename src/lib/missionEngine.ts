import type { AgeBand } from "./complexity";
import { familyOfWord, WORD_FAMILY_DATA, WORD_RIMES } from "./words.ts";

export type MissionPrimitive =
  | "remember" | "find" | "match" | "sort" | "sequence" | "choose"
  | "build_word" | "change_word" | "trace" | "draw" | "count"
  | "compare" | "solve" | "create";

export type MissionValidationMode = "exact" | "set" | "sequence" | "multiple_valid" | "open_ended";
export type MissionStatus = "approved" | "active" | "archived";
export type MissionResponse = string | string[];
export type MissionSkill =
  | "memory" | "observation" | "problemSolving" | "flexibility"
  | "creativity" | "planning" | "phonics" | "language" | "math";

export interface MissionStepContent {
  contentId: string;
  visual?: string[];
  visualLabel?: string;
  options?: string[];
  answer?: string | string[];
  acceptedAnswers?: MissionResponse[];
  letters?: string[];
  memoryItems?: string[];
  groups?: string[];
  groupItems?: Record<string, string>;
  strategyOptions?: string[];
  minElements?: number;
  [key: string]: unknown;
}

export interface MissionStep {
  stepId: string;
  type: MissionPrimitive;
  prompt: string;
  content: MissionStepContent;
  validationMode: MissionValidationMode;
  difficulty: number;
  hints: string[];
  assets: string[];
  expectedInteraction: string;
  metadata: {
    skill: MissionSkill;
    secondarySkills?: MissionSkill[];
    strategyTracking?: boolean;
    creative?: boolean;
    activityId?: string;
    [key: string]: unknown;
  };
}

export interface Mission {
  missionId: string;
  templateId: string;
  title: string;
  description: string;
  ageBands: AgeBand[];
  primarySkill: MissionSkill;
  secondarySkills: MissionSkill[];
  difficulty: number;
  estimatedMinutes: number;
  steps: MissionStep[];
  gameType: string;
  status: MissionStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MissionTemplate {
  templateId: string;
  title: string;
  description: string;
  ageBands: AgeBand[];
  primarySkill: MissionSkill;
  secondarySkills: MissionSkill[];
  estimatedMinutes: number;
  gameType: string;
  status: MissionStatus;
}

export interface MissionEvidence {
  learnerId: string;
  missionId: string;
  stepId: string;
  skill: MissionSkill;
  difficulty: number;
  correct: boolean;
  attempts: number;
  responseTimeMs: number;
  hintsUsed: number;
  completed: boolean;
  contentId: string;
  timestamp: string;
  strategyUsed?: string;
  interactionEvidence?: Record<string, unknown>;
}

export interface LearnerMissionProgress {
  learnerId: string;
  missionId: string;
  startedAt?: string;
  completedAt?: string;
  completedSteps: number;
  totalSteps: number;
  attempts: number;
  correctSteps: number;
  hintsUsed: number;
  evidence: MissionEvidence[];
  rewardGranted: boolean;
  updatedAt: string;
}

const AGE_BANDS: AgeBand[] = ["4-5", "6-7", "8-9"];

export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    templateId: "remember-find",
    title: "Remember & Find",
    description: "Look closely, remember the clues, and find them again.",
    ageBands: AGE_BANDS,
    primarySkill: "memory",
    secondarySkills: ["observation", "planning"],
    estimatedMinutes: 4,
    gameType: "mission-memory",
    status: "approved",
  },
  {
    templateId: "sort-group",
    title: "Sort & Group",
    description: "Notice what belongs together and make tidy groups.",
    ageBands: AGE_BANDS,
    primarySkill: "flexibility",
    secondarySkills: ["observation", "problemSolving"],
    estimatedMinutes: 5,
    gameType: "mission-sort",
    status: "approved",
  },
  {
    templateId: "build-word",
    title: "Build the Word",
    description: "Hear the sounds, then build a word one tile at a time.",
    ageBands: AGE_BANDS,
    primarySkill: "phonics",
    secondarySkills: ["language", "planning"],
    estimatedMinutes: 4,
    gameType: "mission-phonics",
    status: "approved",
  },
  {
    templateId: "change-one-thing",
    title: "Change One Thing",
    description: "Try a small change and see how the word transforms.",
    ageBands: AGE_BANDS,
    primarySkill: "flexibility",
    secondarySkills: ["phonics", "language"],
    estimatedMinutes: 5,
    gameType: "mission-word-change",
    status: "approved",
  },
  {
    templateId: "find-difference",
    title: "Find the Difference",
    description: "Compare carefully and spot the one that changed.",
    ageBands: AGE_BANDS,
    primarySkill: "observation",
    secondarySkills: ["problemSolving", "memory"],
    estimatedMinutes: 4,
    gameType: "mission-observation",
    status: "approved",
  },
];

function hashSeed(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rngFor(seed: string): () => number {
  let a = hashSeed(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(rng: () => number, values: readonly T[]): T[] {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function pick<T>(rng: () => number, values: readonly T[]): T {
  return values[Math.floor(rng() * values.length)] ?? values[0]!;
}

function wordPool(family: string): string[] {
  return (WORD_FAMILY_DATA[family] ?? []).map((x) => x.word);
}

function stepId(missionId: string, index: number): string {
  return `${missionId}:step-${index + 1}`;
}

function baseStep(
  missionId: string,
  index: number,
  type: MissionPrimitive,
  prompt: string,
  content: MissionStepContent,
  validationMode: MissionValidationMode,
  difficulty: number,
  skill: MissionSkill,
  hints: string[],
  expectedInteraction: string,
  metadata: Omit<MissionStep["metadata"], "skill"> = {}
): MissionStep {
  return {
    stepId: stepId(missionId, index), type, prompt, content, validationMode,
    difficulty, hints, assets: [], expectedInteraction,
    metadata: { skill, ...metadata },
  };
}

function generateRememberSteps(missionId: string, seed: string, difficulty: number): MissionStep[] {
  const rng = rngFor(`remember:${seed}`);
  const pool = ["🍎", "⭐", "🐶", "🚗", "🌈", "🦋", "🍀", "🎈"];
  const memoryItems = shuffle(rng, pool).slice(0, difficulty >= 3 ? 5 : 4);
  const target = memoryItems[Math.floor(rng() * memoryItems.length)]!;
  const targetIndex = String(memoryItems.indexOf(target) + 1);
  return [
    baseStep(missionId, 0, "remember", "Look carefully. Remember the picture clues!", {
      contentId: `${missionId}:remember`, memoryItems, visual: memoryItems,
      visualLabel: "memory clues", options: ["I remember"], answer: "I remember",
    }, "exact", difficulty, "memory", ["Say each clue softly.", "Look from left to right."], "look-and-remember"),
    baseStep(missionId, 1, "find", `Where was ${target}?`, {
      contentId: `${missionId}:find`, visual: memoryItems, visualLabel: "find the remembered clue",
      options: memoryItems.map((_, i) => String(i + 1)), answer: targetIndex,
    }, "exact", difficulty, "observation", ["Use the order you remembered.", "Count the positions from the left."], "choose-position"),
    baseStep(missionId, 2, "match", "Which clue did you remember?", {
      contentId: `${missionId}:match`, visual: [target], visualLabel: "remembered clue",
      options: shuffle(rng, memoryItems), answer: target,
    }, "exact", difficulty, "memory", ["Compare each picture with the clue.", "There is one matching picture."], "choose-picture"),
  ];
}

function generateSortSteps(missionId: string, seed: string, difficulty: number): MissionStep[] {
  const rng = rngFor(`sort:${seed}`);
  const rounds: Array<{ groups: string[]; items: Record<string, string> }> = [
    { groups: ["animals", "food"], items: { "🐱": "animals", "🍎": "food", "🐶": "animals", "🍌": "food" } },
    { groups: ["things that fly", "things that roll"], items: { "🦋": "things that fly", "🚗": "things that roll", "🐦": "things that fly", "🛞": "things that roll" } },
    { groups: ["hot", "cold"], items: { "🔥": "hot", "❄️": "cold", "☀️": "hot", "🧊": "cold" } },
  ];
  return rounds.map((round, index) => {
    const entries = Object.entries(round.items);
    const itemOrder = shuffle(rng, entries.map(([item]) => item));
    const answer = itemOrder.map((item) => `${item}:${round.items[item as keyof typeof round.items]}`);
    return baseStep(missionId, index, "sort", "Put each picture in the group where it belongs.", {
      contentId: `${missionId}:sort-${index + 1}`, visual: itemOrder, visualLabel: "items to sort",
      options: round.groups, groups: round.groups, groupItems: round.items, answer,
    }, "set", Math.min(3, difficulty), "flexibility", ["Look for what each picture has in common.", `Use the ${round.groups.join(" or ")} baskets.`], "sort-items", { strategyTracking: true });
  });
}

function generateBuildSteps(missionId: string, seed: string, difficulty: number): MissionStep[] {
  const rng = rngFor(`build:${seed}`);
  const families = difficulty >= 3 ? ["IG", "IP", "IN", "UG"] : ["IG", "IN", "UG"];
  return families.slice(0, 3).map((family, index) => {
    const word = pick(rng, wordPool(family));
    return baseStep(missionId, index, "build_word", `Build the ${family.toLowerCase()} word.`, {
      contentId: `${missionId}:build-${word}`, visual: [WORD_FAMILY_DATA[family]?.find((x) => x.word === word)?.emoji ?? "🔤"],
      visualLabel: word, letters: shuffle(rng, word.split("")), answer: word,
      options: [word],
    }, "exact", difficulty, "phonics", [`Say the first sound: ${word[0]}.`, `This word is in the -${family.toLowerCase()} family.`], "build-letter-tiles", { secondarySkills: ["language"] });
  });
}

function allFamilyWords(): string[] {
  return [...new Set(Object.values(WORD_FAMILY_DATA).flatMap((words) => words.map((x) => x.word)))].sort();
}

/** Seeded words that differ from `word` by exactly one letter (same length). */
export function oneLetterVariants(word: string): string[] {
  const out = new Set<string>();
  for (const candidate of allFamilyWords()) {
    if (candidate.length !== word.length || candidate === word) continue;
    let diff = 0;
    for (let i = 0; i < word.length; i++) {
      if (word[i] !== candidate[i]) {
        diff++;
        if (diff > 1) break;
      }
    }
    if (diff === 1) out.add(candidate);
  }
  return [...out].sort();
}

function changeStrategies(base: string, valid: string[]): string[] {
  const out: string[] = [];
  if (valid.some((w) => w[0] !== base[0])) out.push("changed first sound");
  if (valid.some((w) => w[w.length - 1] !== base[base.length - 1])) out.push("changed last sound");
  return out.length ? out : ["changed one sound"];
}

function generateChangeSteps(missionId: string, seed: string, difficulty: number): MissionStep[] {
  const rng = rngFor(`change:${seed}`);
  const pool = allFamilyWords();
  const eligible = pool.filter((word) => oneLetterVariants(word).length >= 3);
  const shuffled = shuffle(rng, eligible.length ? eligible : pool);
  const bases = [0, 1, 2].map((i) => shuffled[i % shuffled.length]!);
  return bases.map((base, index) => {
    const valid = oneLetterVariants(base);
    const distractors = shuffle(rng, pool.filter((word) => word.length === base.length && word !== base && !valid.includes(word))).slice(0, 2);
    const options = shuffle(rng, [...valid.slice(0, 3), ...distractors]).slice(0, difficulty >= 3 ? 5 : 4);
    const family = familyForWord(base);
    return baseStep(missionId, index, "change_word", `Change one letter in “${base}” to make a new word.`, {
      contentId: `${missionId}:change-${base}`,
      visual: [family ? (WORD_FAMILY_DATA[family]?.find((x) => x.word === base)?.emoji ?? "🔤") : "🔤"],
      visualLabel: base,
      options, answer: valid[0], acceptedAnswers: valid,
      strategyOptions: changeStrategies(base, valid),
    }, "multiple_valid", difficulty, "flexibility", ["Keep two letters the same.", "Try changing one sound at a time."], "choose-transformation", { strategyTracking: true, acceptedCount: valid.length });
  });
}

const DIFFERENCE_ROUNDS: string[][] = [
  ["🍎", "🍎", "🍐", "🍎"],
  ["🐟", "🐟", "🐠", "🐟"],
  ["⭐", "🌟", "⭐", "⭐"],
  ["🐶", "🐶", "🐱", "🐶"],
  ["🌻", "🌻", "🌷", "🌻"],
  ["🚗", "🚗", "🚙", "🚗"],
  ["🍪", "🍪", "🍩", "🍪"],
  ["🐝", "🐝", "🐞", "🐝"],
  ["🎈", "🎈", "🎀", "🎈"],
];

function generateDifferenceSteps(missionId: string, seed: string, difficulty: number): MissionStep[] {
  const rng = rngFor(`difference:${seed}`);
  const rounds = shuffle(rng, DIFFERENCE_ROUNDS).slice(0, 3);
  return rounds.map((items, index) => {
    const visual = shuffle(rng, items);
    const normal = items[0];
    const actual = visual.findIndex((item) => item !== normal) + 1;
    return baseStep(missionId, index, "find", "Which one is different?", {
      contentId: `${missionId}:difference-${index + 1}`, visual, visualLabel: "spot the different picture",
      options: items.map((_, i) => String(i + 1)), answer: String(actual),
    }, "exact", difficulty, "observation", ["Compare each picture with its neighbors.", "Look for the one with a different shape or color."], "choose-position", { strategyTracking: true });
  });
}

function templateById(templateId: string): MissionTemplate | null {
  return MISSION_TEMPLATES.find((template) => template.templateId === templateId) ?? null;
}

export function missionIdFor(templateId: string, ageBand: AgeBand, seed: string, difficulty = 1): string {
  return `mission:${templateId}:${ageBand}:${Math.max(1, Math.min(5, Math.floor(difficulty)))}:${seed}`;
}

export function parseMissionId(missionId: string): { templateId: string; ageBand: AgeBand; difficulty: number; seed: string } | null {
  const parts = missionId.split(":");
  const difficulty = Number(parts[3]);
  if (parts[0] !== "mission" || parts.length < 5 || !AGE_BANDS.includes(parts[2] as AgeBand) || !Number.isInteger(difficulty)) return null;
  return { templateId: parts[1]!, ageBand: parts[2] as AgeBand, difficulty: Math.max(1, Math.min(5, difficulty)), seed: parts.slice(4).join(":") };
}

export function generateMission(templateId: string, ageBand: AgeBand, seed: string, difficulty = 1): Mission | null {
  const template = templateById(templateId);
  if (!template || !template.ageBands.includes(ageBand)) return null;
  const safeDifficulty = Math.max(1, Math.min(5, Math.floor(difficulty)));
  const missionId = missionIdFor(templateId, ageBand, seed, safeDifficulty);
  const steps = templateId === "remember-find"
    ? generateRememberSteps(missionId, seed, safeDifficulty)
    : templateId === "sort-group"
      ? generateSortSteps(missionId, seed, safeDifficulty)
      : templateId === "build-word"
        ? generateBuildSteps(missionId, seed, safeDifficulty)
        : templateId === "change-one-thing"
          ? generateChangeSteps(missionId, seed, safeDifficulty)
          : generateDifferenceSteps(missionId, seed, safeDifficulty);
  const now = new Date().toISOString();
  return {
    missionId, templateId, title: template.title, description: template.description,
    ageBands: template.ageBands, primarySkill: template.primarySkill,
    secondarySkills: template.secondarySkills, difficulty: safeDifficulty,
    estimatedMinutes: template.estimatedMinutes, steps, gameType: template.gameType,
    status: template.status, metadata: { deterministic: true, source: "learnzzy-native", version: 1 },
    createdAt: now, updatedAt: now,
  };
}

export function missionFromId(missionId: string, difficulty = 1): Mission | null {
  const parsed = parseMissionId(missionId);
  return parsed ? generateMission(parsed.templateId, parsed.ageBand, parsed.seed, parsed.difficulty || difficulty) : null;
}

function tokens(response: MissionResponse | undefined): string[] {
  return Array.isArray(response) ? response.map((x) => String(x).trim().toLowerCase()) : [String(response ?? "").trim().toLowerCase()];
}

function sameArray(a: string[], b: string[], ordered: boolean): boolean {
  if (a.length !== b.length) return false;
  if (!ordered) return [...a].sort().every((value, i) => value === [...b].sort()[i]);
  return a.every((value, i) => value === b[i]);
}

export function validateMissionResponse(step: MissionStep, response: MissionResponse | undefined): boolean {
  if (step.validationMode === "open_ended") return tokens(response).some((value) => value.length >= 1);
  const received = tokens(response);
  if (step.validationMode === "multiple_valid") {
    const accepted = step.content.acceptedAnswers ?? [];
    return accepted.some((candidate) => sameArray(received, tokens(candidate), false));
  }
  const expected = tokens(step.content.answer);
  if (step.validationMode === "set") return sameArray(received, expected, false);
  if (step.validationMode === "sequence") return sameArray(received, expected, true);
  return received.length === 1 && received[0] === expected[0];
}

export function validateMission(mission: Mission): string[] {
  const errors: string[] = [];
  if (!mission.missionId || !mission.title || mission.steps.length < 1) errors.push("mission metadata incomplete");
  if (!AGE_BANDS.some((band) => mission.ageBands.includes(band))) errors.push("age bands missing");
  const ids = new Set<string>();
  for (const step of mission.steps) {
    if (ids.has(step.stepId)) errors.push(`duplicate step ${step.stepId}`);
    ids.add(step.stepId);
    if (!step.content.contentId || step.hints.length < 1) errors.push(`step ${step.stepId} content incomplete`);
    if (step.validationMode !== "open_ended" && step.content.answer === undefined && !(step.content.acceptedAnswers?.length)) errors.push(`step ${step.stepId} answer missing`);
    if (step.validationMode === "multiple_valid" && (step.content.acceptedAnswers?.length ?? 0) < 2) errors.push(`step ${step.stepId} needs alternatives`);
  }
  return errors;
}

export function missionSkills(): MissionSkill[] {
  return ["memory", "observation", "problemSolving", "flexibility", "creativity", "planning", "phonics", "language", "math"];
}

export function familyForWord(word: string): string | null {
  return familyOfWord(word) ?? WORD_RIMES.find((family) => wordPool(family).includes(word.toLowerCase())) ?? null;
}
