// Deterministic activity content generators — dependency-free, testable.
// Worksheet-inspired, Learnzzy-native (never copy worksheet art/text).
// Every generator: (seed, complexity) → validated ActivityContent with a
// stable contentId, rotated answer positions, rotated visuals, hints that
// teach thinking (never just reveal), and exactly-one-correct options.
// Arithmetic is plain JS math — no LLM, no AI scoring, ever.

import type { AgeBand, ComplexityProfile } from "./complexity";

export interface ActivityContent {
  contentId: string;
  templateId: string;
  skill: string;
  ageBand: AgeBand;
  difficulty: number;
  kind: "single-choice" | "trace-write";
  prompt: string;
  instruction: string;
  /** Visual items rendered big (emoji / numbers / words). */
  visual: string[];
  visualLabel: string;
  options: string[];
  answer: string;
  answerIndex: number;
  hints: string[];
  explanation: string;
  voiceLine: string;
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

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uniqueOptions(correct: string, distractors: string[], rng: () => number): { options: string[]; answerIndex: number } {
  const set = new Set<string>([correct]);
  const rest: string[] = [];
  for (const d of shuffle(rng, distractors)) {
    if (!set.has(d) && rest.length < 3) {
      set.add(d);
      rest.push(d);
    }
  }
  const options = shuffle(rng, [correct, ...rest]);
  return { options, answerIndex: options.indexOf(correct) };
}

const COUNT_OBJECTS = ["🍎", "🧸", "⭐", "🎈", "🐟", "🦋", "🚗", "🌸", "🚀", "🦕", "🍪", "🐦"] as const;const COUNT_NAMES: Record<string, string> = {
  "🍎": "apples", "🧸": "teddy bears", "⭐": "stars", "🎈": "balloons", "🐟": "fish",
  "🦋": "butterflies", "🚗": "cars", "🌸": "flowers", "🚀": "rockets", "🦕": "dinosaurs",
  "🍪": "cookies", "🐦": "birds",
};

const SHAPES = [
  { emoji: "⭕", name: "circles" },
  { emoji: "🔺", name: "triangles" },
  { emoji: "🟥", name: "squares" },
  { emoji: "🟧", name: "rectangles" },
  { emoji: "⭐", name: "stars" },
] as const;

export const WORD_FAMILIES: Record<string, Array<{ word: string; emoji: string; name: string }>> = {
  AN: [
    { word: "van", emoji: "🚐", name: "van" },
    { word: "fan", emoji: "🌀", name: "fan" },
    { word: "pan", emoji: "🍳", name: "pan" },
    { word: "can", emoji: "🥫", name: "can" },
    { word: "man", emoji: "🧑", name: "man" },
  ],
  EN: [
    { word: "hen", emoji: "🐔", name: "hen" },
    { word: "pen", emoji: "🖊️", name: "pen" },
    { word: "men", emoji: "👨‍👨‍👦", name: "men" },
    { word: "ten", emoji: "🔟", name: "ten" },
  ],
  AT: [
    { word: "cat", emoji: "🐱", name: "cat" },
    { word: "hat", emoji: "🎩", name: "hat" },
    { word: "bat", emoji: "🦇", name: "bat" },
    { word: "mat", emoji: "🧺", name: "mat" },
  ],
  AP: [
    { word: "cap", emoji: "🧢", name: "cap" },
    { word: "map", emoji: "🗺️", name: "map" },
    { word: "tap", emoji: "🚰", name: "tap" },
  ],
  OG: [
    { word: "dog", emoji: "🐶", name: "dog" },
    { word: "frog", emoji: "🐸", name: "frog" },
    { word: "log", emoji: "🪵", name: "log" },
  ],
  IT: [
    { word: "sit", emoji: "🪑", name: "sit" },
    { word: "hit", emoji: "🥎", name: "hit" },
    { word: "kit", emoji: "🧰", name: "kit" },
  ],
};

function genCount(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`count:${seed}`));
  const emoji = pick(rng, COUNT_OBJECTS);
  const n = 1 + Math.floor(rng() * Math.min(c.numberRange, c.ageBand === "4-5" ? 10 : c.numberRange));
  const visual = Array.from({ length: n }, () => emoji);
  const name = COUNT_NAMES[emoji] ?? "things";
  const near = new Set([n - 2, n - 1, n + 1, n + 2].filter((x) => x >= 0 && x !== n && x <= c.numberRange + 2));
  const { options, answerIndex } = uniqueOptions(String(n), [...near].map(String), rng);
  return {
    contentId: `count-${seed}-${n}-${emoji.codePointAt(0)}`,
    templateId: "number-count", skill: "counting", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "single-choice", prompt: `How many ${name}?`, instruction: "Count each one slowly, then tap the number.",
    visual, visualLabel: `${n} ${name}`,
    options, answer: String(n), answerIndex,
    hints: [`Point at each ${name.slice(0, 20)} and count: 1, 2, 3…`, `There are ${n <= 5 ? "only a few" : "quite a few"} — count again slowly.`],
    explanation: `Yes! There are ${n} ${name}.`,
    voiceLine: `How many ${name}? Count with me!`,
  };
}

function genOrder(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`order:${seed}`));
  const count = c.itemCount;
  const nums = new Set<number>();
  while (nums.size < count) nums.add(1 + Math.floor(rng() * c.numberRange));
  const list = [...nums];
  const bigFirst = rng() < 0.5;
  const correct = [...list].sort((a, b) => (bigFirst ? b - a : a - b));
  const correctStr = correct.join(" → ");
  const shown = shuffle(rng, list).join(",  ");
  const dSet = new Set<string>();
  while (dSet.size < 3) {
    const s = shuffle(rng, correct).join(" → ");
    if (s !== correctStr) dSet.add(s);
  }
  const { options, answerIndex } = uniqueOptions(correctStr, [...dSet], rng);
  const dir = bigFirst ? "biggest first" : "smallest first";
  return {
    contentId: `order-${seed}-${correct.join("-")}-${bigFirst ? "desc" : "asc"}`,
    templateId: "number-order", skill: "number-ordering", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "single-choice", prompt: `Put the ${bigFirst ? "biggest" : "smallest"} number first!`,
    instruction: `Numbers: ${shown}. Which order goes ${dir}?`,
    visual: list.map(String), visualLabel: `Order these: ${shown}`,
    options, answer: correctStr, answerIndex,
    hints: ["Which number has the greatest value?", `Look at ${bigFirst ? Math.max(...list) : Math.min(...list)} — where does it go?`],
    explanation: `Yes! ${correctStr}.`,
    voiceLine: `Put the ${bigFirst ? "biggest" : "smallest"} number first!`,
  };
}

function genBeforeAfter(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`ba:${seed}`));
  const mode = pick(rng, ["after", "before", "middle"] as const);
  const base = 1 + Math.floor(rng() * Math.max(3, c.numberRange - 3));
  let prompt = "", answer = "", shown: string[], hints: string[];
  if (mode === "after") {
    answer = String(base + 1); shown = [`${base}`, "?"];
    prompt = `${base} comes… what comes next?`;
    hints = [`Count forward: ${base}… what is next?`, `It is one more than ${base}.`];
  } else if (mode === "before") {
    const b = Math.max(2, base); answer = String(b - 1); shown = ["?", `${b}`];
    prompt = `What comes just before ${b}?`;
    hints = [`Count backward from ${b}…`, `It is one less than ${b}.`];
  } else {
    answer = String(base + 1); shown = [`${base}`, "?", `${base + 2}`];
    prompt = `${base}, ?, ${base + 2} — what is missing?`;
    hints = [`Count slowly: ${base}… ? … ${base + 2}.`, `The middle number is one more than ${base}.`];
  }
  const near = [Number(answer) - 2, Number(answer) - 1, Number(answer) + 1, Number(answer) + 2]
    .filter((x) => x >= 0 && String(x) !== answer);
  const { options, answerIndex } = uniqueOptions(answer, near.map(String), rng);
  return {
    contentId: `before-after-${seed}-${mode}-${answer}`,
    templateId: "number-before-after", skill: "number-sequencing", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "single-choice", prompt, instruction: "Look at the neighbours, then tap the missing number.",
    visual: shown, visualLabel: shown.join(" "),
    options, answer, answerIndex, hints,
    explanation: `Yes! The answer is ${answer}.`,
    voiceLine: prompt,
  };
}

function genShapeCount(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`shape:${seed}`));
  const target = pick(rng, SHAPES);
  const total = Math.min(c.itemCount + 2, 14);
  const targetCount = 1 + Math.floor(rng() * Math.min(total - 1, c.ageBand === "4-5" ? 4 : 8));
  const visual: string[] = [];
  for (let i = 0; i < targetCount; i++) visual.push(target.emoji);
  while (visual.length < total) {
    const other = pick(rng, SHAPES.filter((s) => s.emoji !== target.emoji));
    visual.push(other.emoji);
  }
  const shown = shuffle(rng, visual);
  const { options, answerIndex } = uniqueOptions(
    String(targetCount),
    [targetCount - 1, targetCount + 1, targetCount + 2].filter((x) => x >= 0 && x !== targetCount).map(String),
    rng
  );
  return {
    contentId: `shape-${seed}-${target.name}-${targetCount}`,
    templateId: "shape-count", skill: "shape-counting", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "single-choice", prompt: `How many ${target.name} can you find?`,
    instruction: "Look carefully — some shapes are hiding among others!",
    visual: shown, visualLabel: `Find the ${target.name}`,
    options, answer: String(targetCount), answerIndex,
    hints: [`Point at each ${target.name.slice(0, 20)} and count only those.`, "Count again slowly — tricky ones hide at the edges."],
    explanation: `Yes! There are ${targetCount} ${target.name}.`,
    voiceLine: `How many ${target.name} can you find?`,
  };
}

function genBigSmall(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`bigsmall:${seed}`));
  const emoji = pick(rng, ["🍎", "🎈", "🧸", "🐟", "🌸", "🚗"] as const);
  const n = c.itemCount;
  const sizes = shuffle(rng, Array.from({ length: n }, (_, i) => i));
  const wantBiggest = rng() < 0.5;
  const targetPos = wantBiggest ? sizes.indexOf(n - 1) : sizes.indexOf(0);
  const answer = String(targetPos + 1);
  const { options, answerIndex } = uniqueOptions(
    answer, Array.from({ length: n }, (_, i) => String(i + 1)).filter((x) => x !== answer), rng
  );
  return {
    contentId: `bigsmall-${seed}-${emoji.codePointAt(0)}-${wantBiggest ? "big" : "small"}-${sizes.join("")}`,
    templateId: "big-small", skill: "size-comparison", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "single-choice",
    prompt: wantBiggest ? "Which one is the BIGGEST?" : "Which one is the SMALLEST?",
    instruction: "Sizes are shuffled — look carefully, then tap the position number (1 is left).",
    visual: sizes.map((s) => `${emoji}`), visualLabel: `sizes ${sizes.join(",")}`,
    options, answer, answerIndex,
    hints: ["Compare two at a time — keep the winner.", wantBiggest ? "Look for the one that towers over the rest." : "Look for the teeny-tiny one."],
    explanation: wantBiggest ? `Yes! Number ${answer} is the biggest.` : `Yes! Number ${answer} is the smallest.`,
    voiceLine: wantBiggest ? "Which one is the biggest?" : "Which one is the smallest?",
  };
}

function genWordFamily(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`wf:${seed}`));
  const rimes = Object.keys(WORD_FAMILIES);
  const rime = c.ageBand === "4-5" ? pick(rng, ["AN", "EN", "AT"]) : pick(rng, rimes);
  const words = WORD_FAMILIES[rime]!;
  const target = pick(rng, words);
  const missingFirst = rng() < 0.6;
  const prompt = missingFirst ? `_ ${target.word.slice(1)}` : `${target.word.slice(0, -1)} _`;
  const answer = missingFirst ? target.word[0] : target.word[target.word.length - 1];
  const letters = "abcdefghijklmnopqrstuvwxyz".split("").filter((l) => l !== answer);
  const { options, answerIndex } = uniqueOptions(answer, shuffle(rng, letters).slice(0, 5), rng);
  return {
    contentId: `wordfamily-${seed}-${target.word}`,
    templateId: "word-family", skill: "phonics", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "single-choice", prompt: `${target.emoji}  ${prompt}`,
    instruction: `The ${rime} family rhymes! Which letter completes “${target.word}”?`,
    visual: [target.emoji], visualLabel: target.name,
    options, answer, answerIndex,
    hints: [`It rhymes with the ${rime} family — say it slowly.`, `The word is “${target.word}” — listen to the first sound.`],
    explanation: `Yes! ${target.word} — the ${rime} family!`,
    voiceLine: `Which letter completes the word? It rhymes with ${rime}.`,
  };
}

function genWordMatch(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`wm:${seed}`));
  const all = Object.values(WORD_FAMILIES).flat();
  const target = pick(rng, all);
  const distract = shuffle(
    rng,
    all.filter((w) => w.word !== target.word).map((w) => w.word)
  ).slice(0, c.optionCount + 1);
  const { options, answerIndex } = uniqueOptions(target.word, distract, rng);
  return {
    contentId: `wordmatch-${seed}-${target.word}`,
    templateId: "word-match", skill: "word-recognition", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "single-choice", prompt: "Which word matches the picture?",
    instruction: "Look carefully. Sound it out, then tap the matching word.",
    visual: [target.emoji], visualLabel: target.name,
    options, answer: target.word, answerIndex,
    hints: ["Sound out each word slowly…", `The picture shows “${target.name}”. Which word looks right?`],
    explanation: `Yes! ${target.emoji} is “${target.word}”.`,
    voiceLine: "Look carefully. Which word matches the picture?",
  };
}

function genTraceWrite(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`tw:${seed}`));
  const pool = c.ageBand === "4-5"
    ? [{ word: "pen", emoji: "🖊️" }, { word: "cat", emoji: "🐱" }, { word: "dog", emoji: "🐶" }]
    : c.ageBand === "6-7"
      ? [{ word: "frog", emoji: "🐸" }, { word: "van", emoji: "🚐" }, { word: "hat", emoji: "🎩" }]
      : [{ word: "star", emoji: "⭐" }, { word: "plant", emoji: "🌱" }, { word: "smile", emoji: "😊" }];
  const target = pick(rng, pool);
  const missingIdx = Math.floor(rng() * target.word.length);
  const answer = target.word[missingIdx];
  const prompt = target.word.split("").map((ch, i) => (i === missingIdx ? "_" : ch)).join(" ");
  const options = shuffle(rng, [...new Set([answer, ...shuffle(rng, "abcdefghijklmnopqrstuvwxyz".split("")).slice(0, 3)])]);
  return {
    contentId: `tracewrite-${seed}-${target.word}-${missingIdx}`,
    templateId: "trace-write", skill: "writing", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "trace-write", prompt: `${target.emoji}  ${prompt}`,
    instruction: `Read “${target.word}”, trace it, then tap the missing letter.`,
    visual: [target.emoji], visualLabel: target.word,
    options, answer, answerIndex: options.indexOf(answer),
    hints: [`Say “${target.word}” slowly — hear the missing sound.`, `Trace each letter with your finger first.`],
    explanation: `Yes! ${target.word.split("").join(" ")} spells “${target.word}”.`,
    voiceLine: `Read, trace, then write the missing letter in ${target.word}.`,
  };
}

function genPattern(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`pat:${seed}`));
  const sets = [
    { unit: ["🟢", "🔴"], name: "AB" },
    { unit: ["🟡", "🟡", "🔵"], name: "AAB" },
    { unit: ["🍎", "🍌", "🍇"], name: "ABC" },
  ] as const;
  const set = c.ageBand === "4-5" ? sets[0] : pick(rng, sets);
  const len = Math.min(c.itemCount + 1, 8);
  const seq: string[] = Array.from({ length: len }, (_, i) => set.unit[i % set.unit.length]);
  const answer = set.unit[len % set.unit.length];
  const shown = [...seq, "?"];
  const distract = [...new Set(set.unit)].filter((x) => x !== answer);
  while (distract.length < 3) distract.push(pick(rng, ["🟢", "🔴", "🟡", "🔵", "🍎", "🍌", "🍇"]));
  const { options, answerIndex } = uniqueOptions(answer, distract, rng);
  return {
    contentId: `pattern-${seed}-${set.name}-${len}`,
    templateId: "pattern", skill: "patterns", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "single-choice", prompt: "What comes next in the pattern?",
    instruction: "Say the pattern out loud — then tap what comes next.",
    visual: shown, visualLabel: shown.join(" "),
    options, answer, answerIndex,
    hints: ["Clap the pattern: what repeats?", `The pattern unit is ${set.unit.join(" ")} — what follows?`],
    explanation: `Yes! The pattern repeats, so ${answer} comes next.`,
    voiceLine: "What comes next in the pattern?",
  };
}

function genFindObject(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`find:${seed}`));
  const pairs = [["🍎", "🍌"], ["🐶", "🐱"], ["⭐", "🌙"], ["🚗", "🚀"], ["🐟", "🐢"]] as const;
  const [common, odd] = pick(rng, pairs);
  const n = c.itemCount;
  const oddPos = Math.floor(rng() * n);
  const visual = Array.from({ length: n }, (_, i) => (i === oddPos ? odd : common));
  const answer = String(oddPos + 1);
  const { options, answerIndex } = uniqueOptions(
    answer, Array.from({ length: n }, (_, i) => String(i + 1)).filter((x) => x !== answer), rng
  );
  return {
    contentId: `find-${seed}-${odd.codePointAt(0)}-${oddPos}`,
    templateId: "find-object", skill: "visual-discrimination", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "single-choice", prompt: "Which one is different?",
    instruction: "Look at each one carefully — tap the position number of the different one.",
    visual, visualLabel: `find the different one`,
    options, answer, answerIndex,
    hints: ["Look at each one, one at a time.", "Monkey says: something is different — compare shapes and colors!"],
    explanation: `Yes! Number ${answer} is different.`,
    voiceLine: "Which one is different? Look carefully!",
  };
}

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** Standard English number name, 1–100. Plain deterministic code. */
export function numberName(n: number): string {
  if (n < 1 || n > 100) return String(n);
  if (n === 100) return "one hundred";
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const r = n % 10;
  return r === 0 ? TENS[t] : `${TENS[t]}-${ONES[r]}`;
}

function genMoreLess(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`moreless:${seed}`));
  const emoji = pick(rng, ["🧁", "🍎", "⭐", "🐟", "🌸", "🚗"] as const);
  // 4–5: small groups, obvious gaps. 6–7: closer quantities. 8–9: larger
  // groups that need real counting, not glancing.
  const max = c.ageBand === "4-5" ? 5 : c.ageBand === "6-7" ? 12 : 30;
  const minGap = 1;
  const maxGap = c.ageBand === "4-5" ? 3 : c.ageBand === "6-7" ? 3 : 4;
  let a = 1 + Math.floor(rng() * max);
  let b = 1 + Math.floor(rng() * max);
  let guard = 0;
  while ((a === b || Math.abs(a - b) < minGap || Math.abs(a - b) > maxGap) && guard++ < 50) {
    b = 1 + Math.floor(rng() * max);
  }
  if (a === b) b = a === max ? a - 2 : a + 2;
  const askMore = rng() < 0.5;
  const firstWins = askMore ? a > b : a < b;
  const answer = firstWins ? "1" : "2";
  const groupA = emoji.repeat(a);
  const groupB = emoji.repeat(b);
  const { options, answerIndex } = uniqueOptions(answer, answer === "1" ? ["2"] : ["1"], rng);
  return {
    contentId: `moreless-${seed}-${a}-${b}-${askMore ? "more" : "less"}`,
    templateId: "more-less", skill: "more-less", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "single-choice",
    prompt: askMore ? "Which group has MORE?" : "Which group has LESS?",
    instruction: "Count both groups, then tap 1 for the FIRST group or 2 for the SECOND group.",
    visual: [groupA, "VS", groupB], visualLabel: `Group 1 has ${a}, group 2 has ${b}`,
    options, answer, answerIndex,
    hints: ["Count each group slowly — 1, 2, 3…", `Point at both groups. ${askMore ? "Which pile looks bigger?" : "Which pile looks smaller?"}`],
    explanation: `Yes! Group ${answer} has ${askMore ? "more" : "less"} (${firstWins ? a : b} vs ${firstWins ? b : a}).`,
    voiceLine: askMore ? "Which group has more?" : "Which group has less?",
  };
}

function genNumberNames(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`numnames:${seed}`));
  const max = Math.min(c.numberRange, 100);
  const n = 1 + Math.floor(rng() * max);
  const toWord = rng() < 0.5;
  const answer = toWord ? numberName(n) : String(n);
  const near = new Set<number>();
  for (const d of [1, 2, 3, 10, -1, -2]) {
    const m = n + d;
    // Distractors stay inside the age band's range (a 4–5 child never
    // sees 16 as a choice when learning 1–10).
    if (m >= 1 && m <= max && m !== n) near.add(m);
  }
  const distract = [...near].slice(0, 5).map((m) => (toWord ? numberName(m) : String(m)));
  const { options, answerIndex } = uniqueOptions(answer, distract, rng);
  return {
    contentId: `numnames-${seed}-${n}-${toWord ? "toword" : "tonum"}`,
    templateId: "number-names", skill: "number-names", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "single-choice",
    prompt: toWord ? `What is ${n} called?` : `Which number is “${numberName(n)}”?`,
    instruction: "Say it slowly, then tap the match.",
    visual: [toWord ? String(n) : "🔢"], visualLabel: toWord ? `number ${n}` : numberName(n),
    options, answer, answerIndex,
    hints: [`Sound it out: “${numberName(n)}”…`, toWord ? "The name starts with “" + numberName(n)[0] + "”." : `Count up to it: …${Math.max(1, n - 2)}, …`],
    explanation: `Yes! ${n} is “${numberName(n)}”.`,
    voiceLine: toWord ? `What is ${n} called?` : `Which number is ${numberName(n)}?`,
  };
}

function genCountByTens(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`tens:${seed}`));
  const reverse = c.ageBand === "8-9" && rng() < 0.4;
  const len = c.ageBand === "4-5" ? 5 : c.ageBand === "6-7" ? 8 : 9;
  const full = reverse
    ? Array.from({ length: len }, (_, i) => 100 - i * 10)
    : Array.from({ length: len }, (_, i) => (i + 1) * 10);
  const missingIdx = 1 + Math.floor(rng() * (len - 1));
  const answer = String(full[missingIdx]);
  const shown = full.map((v, i) => (i === missingIdx ? "?" : String(v)));
  const distract = [full[missingIdx] - 10, full[missingIdx] + 10, full[missingIdx] - 20, full[missingIdx] + 20]
    .filter((x) => x >= 10 && x <= 100 && String(x) !== answer)
    .map(String);
  const { options, answerIndex } = uniqueOptions(answer, distract, rng);
  return {
    contentId: `tens-${seed}-${reverse ? "down" : "up"}-${answer}`,
    templateId: "count-by-tens", skill: "count-by-tens", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "single-choice",
    prompt: reverse ? "Counting down by tens — what is missing?" : "Counting by tens — what is missing?",
    instruction: "Jump ten each time, then tap the missing number.",
    visual: shown, visualLabel: shown.join(" "),
    options, answer, answerIndex,
    hints: ["Say it out loud: ten, twenty, thirty…", `It comes ${reverse ? "after" : "before"} ${reverse ? full[missingIdx - 1] : full[missingIdx + 1] ?? full[missingIdx - 1]} by tens.`],
    explanation: `Yes! ${answer} fits the tens pattern.`,
    voiceLine: "Count by tens. What is missing?",
  };
}

const MATCH_POOL = ["🐶", "🐱", "🐰", "🦁", "🍎", "🍌", "⭐", "🚗", "🐟", "🌸", "🧸", "🚀"] as const;
const SIMILAR: Record<string, string[]> = {
  "🐶": ["🐺", "🦊", "🐕"], "🐱": ["🦁", "🐯"], "🍎": ["🍏", "🍒", "🍓"],
  "⭐": ["🌟", "✨"], "🚗": ["🚙", "🚌"], "🐟": ["🐬", "🐢"],
  "🌸": ["🌺", "🌻"], "🧸": ["🐻", "🐼"], "🚀": ["✈️", "🛸"],
};

function genMatching(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`matching:${seed}`));
  const target = pick(rng, MATCH_POOL);
  // Older learners get look-alike distractors (similarity dimension).
  const similar = c.ageBand !== "4-5" ? (SIMILAR[target] ?? []) : [];
  const others = shuffle(rng, MATCH_POOL.filter((e) => e !== target && !similar.includes(e)));
  const distract = [...similar, ...others].slice(0, 5);
  const { options, answerIndex } = uniqueOptions(target, distract, rng);
  return {
    contentId: `matching-${seed}-${target.codePointAt(0)}`,
    templateId: "matching", skill: "matching", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "single-choice", prompt: "Find its twin!",
    instruction: "Look at each one carefully, then tap the exact match.",
    visual: [target], visualLabel: "find the match",
    options, answer: target, answerIndex,
    hints: ["Compare shapes, colors, faces…", "Monkey says: look carefully, twins match exactly!"],
    explanation: `Yes! ${target} matches ${target}.`,
    voiceLine: "Find its twin! Look carefully!",
  };
}

const ODD_FAMILIES: string[][] = [
  ["🍎", "🍌", "🍇", "🍊"],
  ["🐶", "🐱", "🐰", "🦁"],
  ["🚗", "🚙", "🚀", "✈️"],
  ["🍪", "🧁", "🍩", "🍕"],
  ["⭐", "🌟", "🌙", "✨"],
];

function genOddOneOut(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`odd:${seed}`));
  const famIdx = Math.floor(rng() * ODD_FAMILIES.length);
  const family = ODD_FAMILIES[famIdx];
  let otherFam = ODD_FAMILIES[Math.floor(rng() * ODD_FAMILIES.length)];
  if (otherFam === family) otherFam = ODD_FAMILIES[(famIdx + 1) % ODD_FAMILIES.length];
  const n = Math.min(c.itemCount, 6);
  const commons = shuffle(rng, family).slice(0, n - 1);
  const odd = pick(rng, otherFam);
  const oddPos = Math.floor(rng() * n);
  const visual = [...commons];
  visual.splice(oddPos, 0, odd);
  const answer = String(oddPos + 1);
  const { options, answerIndex } = uniqueOptions(
    answer, Array.from({ length: n }, (_, i) => String(i + 1)).filter((x) => x !== answer), rng
  );
  return {
    contentId: `odd-${seed}-${odd.codePointAt(0)}-${oddPos}`,
    templateId: "odd-one-out", skill: "odd-one-out", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "single-choice", prompt: "Which one does NOT belong?",
    instruction: "Most are family. Tap the position number of the odd one out.",
    visual, visualLabel: "find the odd one out",
    options, answer, answerIndex,
    hints: ["Ask: what family is this? Fruits? Animals?", "One of them comes from a different family!"],
    explanation: `Yes! Number ${answer} (${odd}) does not belong.`,
    voiceLine: "Which one does not belong?",
  };
}

function genMemory(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`memory:${seed}`));
  const pool = ["🐶", "🍎", "⭐", "🚗", "🐟", "🌸", "🧸", "🚀", "🐱", "🍌", "🎈", "🦋"];
  const n = c.ageBand === "4-5" ? 3 : c.ageBand === "6-7" ? 4 : 5;
  const shown = shuffle(rng, pool).slice(0, n);
  const probeSeen = rng() < 0.5;
  let answer: string;
  let distract: string[];
  if (probeSeen) {
    answer = pick(rng, shown);
    distract = shuffle(rng, pool.filter((e) => !shown.includes(e))).slice(0, 5);
  } else {
    const absent = shuffle(rng, pool.filter((e) => !shown.includes(e)));
    answer = absent[0];
    distract = shuffle(rng, shown).slice(0, 5);
  }
  const { options, answerIndex } = uniqueOptions(answer, distract, rng);
  return {
    contentId: `memory-${seed}-${probeSeen ? "seen" : "missing"}-${answer.codePointAt(0)}`,
    templateId: "memory", skill: "memory", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "single-choice",
    prompt: probeSeen ? "Which one did you see in the group?" : "Which one was NOT in the group?",
    instruction: "Study the group… remember… then tap!",
    visual: shown, visualLabel: "remember this group",
    options, answer, answerIndex,
    hints: ["Say each one quietly to yourself.", "Picture the group in your mind — what was there?"],
    explanation: probeSeen ? `Yes! ${answer} was in the group.` : `Yes! ${answer} was not there.`,
    voiceLine: probeSeen ? "Which one did you see?" : "Which one was missing?",
  };
}

const NUMBER_WORDS: Record<string, string[]> = {
  "4-5": ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"],
  "6-7": ["eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"],
  "8-9": ["thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"],
};

function genTraceNumberName(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`tracenum:${seed}`));
  const pool = [...NUMBER_WORDS["4-5"], ...(c.ageBand !== "4-5" ? NUMBER_WORDS["6-7"] : []), ...(c.ageBand === "8-9" ? NUMBER_WORDS["8-9"] : [])];
  const word = pick(rng, pool);
  const missingIdx = Math.floor(rng() * word.length);
  const answer = word[missingIdx];
  const prompt = word.split("").map((ch, i) => (i === missingIdx ? "_" : ch)).join(" ");
  const letters = shuffle(rng, "abcdefghijklmnopqrstuvwxyz".split("").filter((l) => l !== answer)).slice(0, 3);
  const options = shuffle(rng, [answer, ...letters]);
  return {
    contentId: `tracenum-${seed}-${word}-${missingIdx}`,
    templateId: "trace-number-name", skill: "number-names", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "trace-write", prompt: `🔢  ${prompt}`,
    instruction: `This spells a number name (“${word}”). Trace it, then tap the missing letter.`,
    visual: ["🔢"], visualLabel: word,
    options, answer, answerIndex: options.indexOf(answer),
    hints: [`Say “${word}” slowly — hear the missing sound.`, "Trace each letter with your finger first."],
    explanation: `Yes! ${word.split("").join(" ")} spells “${word}”.`,
    voiceLine: `Trace the number name, then tap the missing letter.`,
  };
}

const SHAPE_DEFS = [
  { emoji: "⭕", name: "Circle" },
  { emoji: "🔺", name: "Triangle" },
  { emoji: "🟥", name: "Square" },
  { emoji: "🟧", name: "Rectangle" },
  { emoji: "⭐", name: "Star" },
  { emoji: "❤️", name: "Heart" },
] as const;

function genShapeMatch(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`shapematch:${seed}`));
  const target = pick(rng, SHAPE_DEFS);
  const toName = rng() < 0.5;
  const answer = toName ? target.name : target.emoji;
  const distractPool = SHAPE_DEFS.filter((s) => s.emoji !== target.emoji)
    .map((s) => (toName ? s.name : s.emoji));
  const { options, answerIndex } = uniqueOptions(answer, distractPool, rng);
  return {
    contentId: `shapematch-${seed}-${target.name}-${toName ? "toname" : "toshape"}`,
    templateId: "shape-match", skill: "shape-recognition", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "single-choice",
    prompt: toName ? "Which name belongs to this shape?" : `Which shape is the ${target.name}?`,
    instruction: "Look at the corners and sides, then tap.",
    visual: [toName ? target.emoji : "🔷"], visualLabel: toName ? target.name : `find the ${target.name}`,
    options, answer, answerIndex,
    hints: ["Count the corners — that is the secret clue.", `A ${target.name} has its own special outline.`],
    explanation: `Yes! ${target.emoji} is the ${target.name}.`,
    voiceLine: toName ? "Which name belongs to this shape?" : `Which shape is the ${target.name}?`,
  };
}

function genShapePattern(seed: string, c: ComplexityProfile): ActivityContent {
  const rng = mulberry32(hashSeed(`shapepat:${seed}`));
  const sets = [
    { unit: ["⭕", "🟥"], name: "AB" },
    { unit: ["🔺", "🔺", "⭕"], name: "AAB" },
    { unit: ["⭕", "🔺", "⭐"], name: "ABC" },
  ] as const;
  const set = c.ageBand === "4-5" ? sets[0] : pick(rng, sets);
  const len = Math.min(c.itemCount + 1, 8);
  const seq: string[] = Array.from({ length: len }, (_, i) => set.unit[i % set.unit.length]);
  const answer = set.unit[len % set.unit.length];
  const shown = [...seq, "?"];
  const distract: string[] = [...new Set<string>(set.unit)].filter((x) => x !== answer);
  while (distract.length < 3) distract.push(pick(rng, ["⭕", "🔺", "🟥", "⭐", "❤️", "🟧"]));
  const { options, answerIndex } = uniqueOptions(answer, distract, rng);
  return {
    contentId: `shapepat-${seed}-${set.name}-${len}`,
    templateId: "shape-pattern", skill: "shape-patterns", ageBand: c.ageBand, difficulty: c.difficulty,
    kind: "single-choice", prompt: "Which shape comes next?",
    instruction: "Say the shape pattern out loud — then tap what comes next.",
    visual: shown, visualLabel: shown.join(" "),
    options, answer, answerIndex,
    hints: ["Clap the pattern: what repeats?", `The unit is ${set.unit.join(" ")} — what follows?`],
    explanation: `Yes! The pattern repeats, so ${answer} comes next.`,
    voiceLine: "Which shape comes next in the pattern?",
  };
}

export type GeneratorId =
  | "number-count" | "number-order" | "number-before-after" | "shape-count"
  | "big-small" | "word-family" | "word-match" | "trace-write" | "pattern" | "find-object"
  | "more-less" | "number-names" | "count-by-tens" | "matching" | "odd-one-out"
  | "memory" | "trace-number-name" | "shape-match" | "shape-pattern";

const GENERATORS: Record<GeneratorId, (seed: string, c: ComplexityProfile) => ActivityContent> = {
  "number-count": genCount,
  "number-order": genOrder,
  "number-before-after": genBeforeAfter,
  "shape-count": genShapeCount,
  "big-small": genBigSmall,
  "word-family": genWordFamily,
  "word-match": genWordMatch,
  "trace-write": (seed, c) => {
    const base = genTraceWrite(seed, c);
    const idx = base.options.indexOf(base.answer);
    return { ...base, answerIndex: idx };
  },
  pattern: genPattern,
  "find-object": genFindObject,
  "more-less": genMoreLess,
  "number-names": genNumberNames,
  "count-by-tens": genCountByTens,
  matching: genMatching,
  "odd-one-out": genOddOneOut,
  memory: genMemory,
  "trace-number-name": (seed, c) => {
    const base = genTraceNumberName(seed, c);
    return { ...base, answerIndex: base.options.indexOf(base.answer) };
  },
  "shape-match": genShapeMatch,
  "shape-pattern": genShapePattern,
};

export function isGeneratorId(v: string): v is GeneratorId {
  return v in GENERATORS;
}

/** Deterministic entry point — pure, no I/O, safe to call on server or client. */
export function generateActivityContent(
  templateId: string, seed: string, complexity: ComplexityProfile
): ActivityContent | null {
  if (!isGeneratorId(templateId)) return null;
  const content = GENERATORS[templateId](seed, complexity);
  // Post-condition: exactly one correct answer, unique options, valid index.
  const matches = content.options.filter((o) => o === content.answer).length;
  if (matches !== 1) return null;
  if (new Set(content.options).size !== content.options.length) return null;
  if (content.answerIndex < 0 || content.answerIndex >= content.options.length) return null;
  return content;
}
