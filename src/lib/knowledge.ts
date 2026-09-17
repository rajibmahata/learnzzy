// Learn & Discover knowledge system — deterministic, dependency-free so unit
// tests import the real code. Emoji visuals keep every activity offline,
// license-clean, and consistent (no external images, no CORS, no storage).
// Localized names are locale-ready with English complete + en-fallback;
// translation of the full catalog is content-pipeline work, not architecture.

export type Locale = "en" | "hi" | "bn" | "ta" | "te";

export interface KnowledgeConcept {
  id: string;
  category: string;
  /** Display names by locale; `en` is always present, others fall back to it. */
  names: Partial<Record<Locale, string>> & { en: string };
  emoji: string;
  fact: string;
  /** 1 = first words, 2 = broadening, 3 = less-common / deeper. */
  level: 1 | 2 | 3;
  tags: string[];
}

export interface KnowledgeCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
}

export const CATEGORIES: KnowledgeCategory[] = [
  { id: "animals", title: "Animal Land", icon: "🦁", description: "Meet friendly animals." },
  { id: "birds", title: "Bird Valley", icon: "🐦", description: "Discover beautiful birds." },
  { id: "insects", title: "Bug Meadow", icon: "🦋", description: "Tiny crawling friends." },
  { id: "fruits", title: "Fruit Garden", icon: "🍎", description: "Yummy colorful fruits." },
  { id: "vegetables", title: "Veggie Patch", icon: "🥕", description: "Fresh garden vegetables." },
  { id: "colors", title: "Color Town", icon: "🎨", description: "Play with colors." },
  { id: "shapes", title: "Shape Mountain", icon: "🔺", description: "Circles, squares and more." },
  { id: "vehicles", title: "Vehicle World", icon: "🚗", description: "Things that go!" },
  { id: "nature", title: "Nature Forest", icon: "🌳", description: "Sun, trees and rivers." },
  { id: "body", title: "My Body", icon: "👀", description: "Eyes, ears and more." },
  { id: "objects", title: "Everyday Things", icon: "📕", description: "Things around you." },
];

type C = [id: string, en: string, emoji: string, fact: string, level: 1 | 2 | 3];

function entries(category: string, rows: C[]): KnowledgeConcept[] {
  return rows.map(([id, en, emoji, fact, level]) => ({
    id: `${category}.${id}`,
    category,
    names: { en },
    emoji,
    fact,
    level,
    tags: [category],
  }));
}

export const CONCEPTS: KnowledgeConcept[] = [
  ...entries("animals", [
    ["dog", "Dog", "🐶", "Dogs bark and love to play.", 1],
    ["cat", "Cat", "🐱", "Cats purr when they are happy.", 1],
    ["cow", "Cow", "🐄", "Cows give us milk.", 1],
    ["horse", "Horse", "🐴", "Horses run very fast.", 2],
    ["elephant", "Elephant", "🐘", "Elephants have long trunks.", 2],
    ["lion", "Lion", "🦁", "Lions roar loudly.", 2],
    ["tiger", "Tiger", "🐯", "Tigers have stripes.", 3],
    ["monkey", "Monkey", "🐵", "Monkeys love bananas.", 2],
    ["rabbit", "Rabbit", "🐰", "Rabbits hop and have long ears.", 1],
    ["bear", "Bear", "🐻", "Bears love honey.", 3],
  ]),
  ...entries("birds", [
    ["parrot", "Parrot", "🦜", "Parrots are colorful birds.", 1],
    ["sparrow", "Sparrow", "🐦", "Sparrows are small and quick.", 1],
    ["peacock", "Peacock", "🦚", "Peacocks have beautiful feathers.", 3],
    ["crow", "Crow", "🐦‍⬛", "Crows are very smart.", 2],
    ["pigeon", "Pigeon", "🕊️", "Pigeons coo softly.", 2],
    ["eagle", "Eagle", "🦅", "Eagles fly very high.", 3],
    ["owl", "Owl", "🦉", "Owls see well at night.", 2],
    ["duck", "Duck", "🦆", "Ducks love to swim.", 1],
    ["hen", "Hen", "🐔", "Hens lay eggs.", 1],
    ["flamingo", "Flamingo", "🦩", "Flamingos are pink.", 3],
  ]),
  ...entries("insects", [
    ["butterfly", "Butterfly", "🦋", "Butterflies were caterpillars first.", 1],
    ["ant", "Ant", "🐜", "Ants work together in teams.", 1],
    ["bee", "Bee", "🐝", "Bees make sweet honey.", 2],
    ["ladybug", "Ladybug", "🐞", "Ladybugs have tiny spots.", 2],
    ["dragonfly", "Dragonfly", "🪰", "Dragonflies zoom over water.", 3],
    ["grasshopper", "Grasshopper", "🦗", "Grasshoppers jump high.", 3],
    ["beetle", "Beetle", "🪲", "Beetles have hard shells.", 3],
    ["mosquito", "Mosquito", "🦟", "Mosquitoes buzz around.", 2],
  ]),
  ...entries("fruits", [
    ["apple", "Apple", "🍎", "Apples are crunchy and sweet.", 1],
    ["banana", "Banana", "🍌", "Monkeys love bananas too!", 1],
    ["mango", "Mango", "🥭", "Mangoes are juicy and sweet.", 1],
    ["orange", "Orange", "🍊", "Oranges are full of juice.", 1],
    ["grapes", "Grapes", "🍇", "Grapes grow in bunches.", 2],
    ["watermelon", "Watermelon", "🍉", "Watermelons are big and green outside.", 2],
    ["pineapple", "Pineapple", "🍍", "Pineapples wear a spiky crown.", 3],
    ["papaya", "Papaya", "🍈", "Papayas are soft and orange inside.", 3],
    ["guava", "Guava", "🍐", "Guavas have tiny seeds.", 3],
    ["strawberry", "Strawberry", "🍓", "Strawberries have seeds outside.", 2],
  ]),
  ...entries("vegetables", [
    ["potato", "Potato", "🥔", "Potatoes grow under the ground.", 1],
    ["tomato", "Tomato", "🍅", "Tomatoes are red and juicy.", 1],
    ["carrot", "Carrot", "🥕", "Carrots are orange and crunchy.", 1],
    ["onion", "Onion", "🧅", "Onions can make eyes watery.", 2],
    ["brinjal", "Brinjal", "🍆", "Brinjals are shiny purple.", 3],
    ["cabbage", "Cabbage", "🥬", "Cabbages have many leaves.", 2],
    ["cauliflower", "Cauliflower", "🥦", "Cauliflowers look like little trees.", 3],
    ["peas", "Peas", "🫛", "Peas hide inside pods.", 2],
    ["spinach", "Spinach", "🥗", "Spinach makes you strong.", 3],
  ]),
  ...entries("colors", [
    ["red", "Red", "🔴", "Apples can be red.", 1],
    ["blue", "Blue", "🔵", "The sky is blue.", 1],
    ["green", "Green", "🟢", "Leaves are green.", 1],
    ["yellow", "Yellow", "🟡", "The sun is yellow.", 1],
    ["orange", "Orange", "🟠", "Oranges are orange!", 2],
    ["purple", "Purple", "🟣", "Grapes can be purple.", 2],
    ["pink", "Pink", "🩷", "Flamingos are pink.", 2],
    ["brown", "Brown", "🟤", "Tree trunks are brown.", 2],
    ["black", "Black", "⚫", "The night sky is black.", 3],
    ["white", "White", "⚪", "Clouds are white.", 3],
  ]),
  ...entries("shapes", [
    ["circle", "Circle", "⭕", "A circle is perfectly round.", 1],
    ["square", "Square", "🟧", "A square has four equal sides.", 1],
    ["triangle", "Triangle", "🔺", "A triangle has three sides.", 1],
    ["rectangle", "Rectangle", "▭", "A rectangle has long and short sides.", 2],
    ["oval", "Oval", "⬭", "An oval is a stretched circle.", 2],
    ["star", "Star", "⭐", "Stars twinkle in the sky.", 2],
    ["heart", "Heart", "❤️", "A heart shows love.", 2],
    ["diamond", "Diamond", "🔷", "A diamond shines bright.", 3],
  ]),
  ...entries("vehicles", [
    ["car", "Car", "🚗", "Cars drive on roads.", 1],
    ["bus", "Bus", "🚌", "Buses carry many people.", 1],
    ["train", "Train", "🚂", "Trains run on tracks.", 2],
    ["truck", "Truck", "🚚", "Trucks carry heavy things.", 2],
    ["bicycle", "Bicycle", "🚲", "Bicycles have two wheels.", 1],
    ["motorcycle", "Motorcycle", "🏍️", "Motorcycles go vroom!", 3],
    ["airplane", "Airplane", "✈️", "Airplanes fly in the sky.", 2],
    ["helicopter", "Helicopter", "🚁", "Helicopters hover in place.", 3],
    ["boat", "Boat", "⛵", "Boats float on water.", 2],
  ]),
  ...entries("nature", [
    ["sun", "Sun", "☀️", "The sun keeps us warm.", 1],
    ["moon", "Moon", "🌙", "The moon glows at night.", 1],
    ["cloud", "Cloud", "☁️", "Clouds bring rain.", 1],
    ["rain", "Rain", "🌧️", "Rain helps plants grow.", 2],
    ["tree", "Tree", "🌳", "Trees give us shade.", 1],
    ["flower", "Flower", "🌸", "Flowers smell sweet.", 1],
    ["mountain", "Mountain", "⛰️", "Mountains touch the clouds.", 3],
    ["river", "River", "🌊", "Rivers flow to the sea.", 3],
  ]),
  ...entries("body", [
    ["eyes", "Eyes", "👀", "We see with our eyes.", 1],
    ["ears", "Ears", "👂", "We hear with our ears.", 1],
    ["nose", "Nose", "👃", "We smell with our nose.", 1],
    ["mouth", "Mouth", "👄", "We smile with our mouth.", 1],
    ["hands", "Hands", "✋", "We clap with our hands.", 1],
    ["feet", "Feet", "🦶", "We walk with our feet.", 2],
    ["head", "Head", "🧑", "Our head holds our brain.", 2],
    ["hair", "Hair", "💇", "Hair grows on our head.", 3],
  ]),
  ...entries("objects", [
    ["book", "Book", "📕", "Books tell stories.", 1],
    ["chair", "Chair", "🪑", "We sit on chairs.", 1],
    ["table", "Table", "🍽️", "We eat at the table.", 2],
    ["cup", "Cup", "☕", "We drink from cups.", 1],
    ["ball", "Ball", "⚽", "Balls bounce high.", 1],
    ["bag", "Bag", "🎒", "Bags carry our things.", 2],
    ["pencil", "Pencil", "✏️", "Pencils help us draw.", 2],
    ["clock", "Clock", "🕐", "Clocks tell the time.", 3],
  ]),
];

const byId = new Map(CONCEPTS.map((c) => [c.id, c]));
const byCategory = new Map<string, KnowledgeConcept[]>();
for (const c of CONCEPTS) {
  const arr = byCategory.get(c.category) ?? [];
  arr.push(c);
  byCategory.set(c.category, arr);
}

export function getConcept(id: string): KnowledgeConcept | null {
  return byId.get(id) ?? null;
}

export function conceptsInCategory(category: string): KnowledgeConcept[] {
  return byCategory.get(category) ?? [];
}

/** Localized display name with English fallback (never empty, never throws). */
export function conceptName(c: KnowledgeConcept, locale: Locale = "en"): string {
  return c.names[locale] ?? c.names.en;
}

// --- Tiny deterministic PRNG (local: zero imports, same FNV+mulberry family)
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  const rand = mulberry(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Deterministic discovery set: prefer unseen, then least-exposed, shuffled by
 * seed. Never Math.random — same (seed, history) always yields the same set.
 */
export function pickDiscoverSet(
  seed: number,
  count: number,
  recentIds: string[] = [],
  maxLevel: 1 | 2 | 3 = 3
): KnowledgeConcept[] {
  const recent = new Set(recentIds);
  const eligible = CONCEPTS.filter((c) => c.level <= maxLevel);
  const fresh = eligible.filter((c) => !recent.has(c.id));
  const base = fresh.length >= count ? fresh : eligible;
  return shuffled(base, seed).slice(0, Math.max(1, count));
}

/** Deterministic quiz options: same-category distractors first, target always included. */
export function buildQuizOptions(
  target: KnowledgeConcept,
  n: number,
  seed: number
): KnowledgeConcept[] {
  const sameCat = conceptsInCategory(target.category).filter((c) => c.id !== target.id);
  const others = CONCEPTS.filter((c) => c.id !== target.id && c.category !== target.category);
  const picks = [...shuffled(sameCat, seed ^ 0x9e37).slice(0, Math.max(0, n - 1))];
  if (picks.length < n - 1) picks.push(...shuffled(others, seed ^ 0x51f7).slice(0, n - 1 - picks.length));
  return shuffled([target, ...picks.slice(0, n - 1)], seed);
}

// --- Concept mastery (per-learner, persisted on the learner doc) ---

export type MasteryStatus = "new" | "learning" | "practicing" | "mastered" | "needs_review";
export type MasterySignal = "exposed" | "recognized" | "recalled";

export interface ConceptMastery {
  exposures: number;
  attempts: number;
  correct: number;
  status: MasteryStatus;
  firstSeenAt?: string;
  lastSeenAt?: string;
  nextReviewAt?: string;
}

const DAY_MS = 86400000;

export function nextMastery(
  prev: ConceptMastery | undefined,
  signal: MasterySignal,
  correct = true,
  nowIso?: string
): ConceptMastery {
  const now = nowIso ?? new Date().toISOString();
  const cur: ConceptMastery = prev ?? { exposures: 0, attempts: 0, correct: 0, status: "new" };
  if (signal === "exposed") {
    const exposures = cur.exposures + 1;
    return {
      ...cur,
      exposures,
      status: cur.status === "new" ? "learning" : cur.status,
      firstSeenAt: cur.firstSeenAt ?? now,
      lastSeenAt: now,
      nextReviewAt: new Date(Date.parse(now) + 3 * DAY_MS).toISOString(),
    };
  }
  const attempts = cur.attempts + 1;
  const correctCount = cur.correct + (correct ? 1 : 0);
  const acc = correctCount / attempts;
  let status: MasteryStatus = "practicing";
  if (attempts >= 3 && acc >= 0.8) status = "mastered";
  else if (cur.status === "mastered" && !correct) status = "needs_review";
  else if (attempts >= 3 && acc < 0.6) status = "needs_review";
  return {
    ...cur,
    attempts,
    correct: correctCount,
    status,
    firstSeenAt: cur.firstSeenAt ?? now,
    lastSeenAt: now,
    nextReviewAt: new Date(
      Date.parse(now) + (status === "mastered" ? 14 : status === "needs_review" ? 1 : 3) * DAY_MS
    ).toISOString(),
  };
}

/**
 * Flatten one legacy nesting level (`{birds:{parrot:{...}}}` →
 * `{"birds.parrot":{...}}`). Concept ids contain dots, which must never sit
 * in dotted Mongo paths — this heals any such rows on read.
 */
export function flattenMasteryMap(raw: unknown): Record<string, ConceptMastery> {
  const out: Record<string, ConceptMastery> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== "object" || Array.isArray(v)) continue;
    const rec = v as Record<string, unknown>;
    if (typeof rec.status === "string" || typeof rec.attempts === "number") {
      out[k] = rec as unknown as ConceptMastery;
    } else {
      for (const [sk, sv] of Object.entries(rec)) {
        if (sv && typeof sv === "object") out[`${k}.${sk}`] = sv as unknown as ConceptMastery;
      }
    }
  }
  return out;
}

export interface CategoryProgress {
  category: string;
  title: string;
  total: number;
  learned: number;
  mastered: number;
  needsReview: number;
  avgMasteryPct: number;
}

/** Category rollup from the learner's mastery map (derived display, not a competing level system). */
export function categoryProgress(
  mastery: Record<string, ConceptMastery>
): CategoryProgress[] {
  return CATEGORIES.map((cat) => {
    const concepts = conceptsInCategory(cat.id);
    let learned = 0;
    let mastered = 0;
    let needsReview = 0;
    let accSum = 0;
    for (const c of concepts) {
      const m = mastery[c.id];
      if (!m || m.status === "new") continue;
      learned++;
      if (m.status === "mastered") mastered++;
      if (m.status === "needs_review") needsReview++;
      accSum += m.attempts > 0 ? m.correct / m.attempts : 0.2;
    }
    return {
      category: cat.id,
      title: cat.title,
      total: concepts.length,
      learned,
      mastered,
      needsReview,
      avgMasteryPct: learned === 0 ? 0 : Math.round((accSum / learned) * 100),
    };
  });
}

// --- Daily adventure: themed sequence from plan + catalog (pure, tested) ---

export interface AdventureSlot {
  slot: "warmup" | "discover" | "challenge" | "create" | "reward";
  title: string;
  gameId?: string;
  conceptIds?: string[];
}

export function buildDailyAdventure(
  planItems: { gameId: string; level: number; reason: string }[],
  seed: number,
  maxLevel: 1 | 2 | 3 = 2
): { date: string; slots: AdventureSlot[] } {
  const items = planItems.length > 0 ? planItems : [{ gameId: "addition", level: 1, reason: "variety" }];
  const byLevel = [...items].sort((a, b) => a.level - b.level);
  const warmup = byLevel[0];
  const challenge = byLevel[byLevel.length - 1];
  const discoverSet = pickDiscoverSet(seed ^ 0xad, 2, [], maxLevel);
  const date = new Date().toISOString().slice(0, 10);
  return {
    date,
    slots: [
      { slot: "warmup", title: "Warm Up", gameId: warmup.gameId },
      { slot: "discover", title: "Discover", conceptIds: discoverSet.map((c) => c.id) },
      { slot: "challenge", title: "Challenge", gameId: challenge.gameId },
      { slot: "create", title: "Create", gameId: "sketch" },
      { slot: "reward", title: "Reward" },
    ],
  };
}
