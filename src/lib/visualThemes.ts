// Dynamic game visuals — deterministic, dependency-free, testable.
// The visual theme NEVER changes mathematical correctness: theme selection is
// a pure function of (seed, activityType) while the Difficulty Engine owns
// numbers. Same seed → same theme; different seed → variety without any
// change to the answer.

export interface VisualTheme {
  id: string;
  emoji: string;
  label: string;
  kinds: string[];
}

export const VISUAL_THEMES: VisualTheme[] = [
  { id: "teddy", emoji: "🧸", label: "Teddy bears", kinds: ["addition", "counting"] },
  { id: "apple", emoji: "🍎", label: "Apples", kinds: ["addition", "counting", "sorting"] },
  { id: "mango", emoji: "🥭", label: "Mangoes", kinds: ["addition", "counting"] },
  { id: "star", emoji: "⭐", label: "Stars", kinds: ["addition", "counting"] },
  { id: "car", emoji: "🚗", label: "Cars", kinds: ["addition", "counting", "sorting"] },
  { id: "fish", emoji: "🐟", label: "Fish", kinds: ["addition", "counting"] },
  { id: "balloon", emoji: "🎈", label: "Balloons", kinds: ["addition", "counting"] },
  { id: "butterfly", emoji: "🦋", label: "Butterflies", kinds: ["counting", "sorting"] },
  { id: "puppy", emoji: "🐶", label: "Puppies", kinds: ["counting", "classification"] },
  { id: "rocket", emoji: "🚀", label: "Rockets", kinds: ["addition", "counting"] },
];

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Lookup by theme id (content-agent OBJECTS ids). Unknown → teddy default. */
export function themeById(id: string | undefined | null): VisualTheme {
  const found = VISUAL_THEMES.find((t) => t.id === id);
  return found ?? VISUAL_THEMES[0];
}

/** Singular display noun for aria labels ("3 apples", "1 teddy bear"). */
export function themeNoun(id: string | undefined | null, count: number): string {
  const nouns: Record<string, [string, string]> = {
    teddy: ["teddy bear", "teddy bears"],
    apple: ["apple", "apples"],
    mango: ["mango", "mangoes"],
    star: ["star", "stars"],
    car: ["car", "cars"],
    fish: ["fish", "fish"],
    balloon: ["balloon", "balloons"],
    butterfly: ["butterfly", "butterflies"],
    puppy: ["puppy", "puppies"],
    rocket: ["rocket", "rockets"],
  };
  const pair = nouns[String(id)] ?? ["item", "items"];
  return count === 1 ? pair[0] : pair[1];
}

/** Deterministic theme pick. Math inputs (a, b) are never consulted. */
export function pickVisualTheme(seedKey: string, activityType = "addition"): VisualTheme {
  const eligible = VISUAL_THEMES.filter((t) => t.kinds.includes(activityType));
  const pool = eligible.length > 0 ? eligible : VISUAL_THEMES;
  return pool[hashSeed(`theme:${seedKey}:${activityType}`) % pool.length];
}

/** Render a math row with the theme emoji. Answer is always a + b. */
export function renderMathWithTheme(a: number, b: number, theme: VisualTheme): { display: string; answer: number } {
  const left = theme.emoji.repeat(Math.max(0, Math.min(20, a)));
  const right = theme.emoji.repeat(Math.max(0, Math.min(20, b)));
  return { display: `${left} + ${right} = ?`, answer: a + b };
}

/** Guard: theme change must never alter correctness. */
export function verifyThemeMath(a: number, b: number, themeId: string): boolean {
  const theme = VISUAL_THEMES.find((t) => t.id === themeId) ?? VISUAL_THEMES[0];
  return renderMathWithTheme(a, b, theme).answer === a + b;
}

export type CrossDomainCombo =
  | "fruit_addition"
  | "animal_counting"
  | "color_sorting"
  | "shape_counting"
  | "bird_classification";

export interface CrossDomainActivity {
  combo: CrossDomainCombo;
  prompt: string;
  conceptIds: string[];
  gameId: string;
}

/** Academic + game combinations (§12): cross-domain prompts from validated concepts. */
export function buildCrossDomainActivity(combo: CrossDomainCombo, seedKey: string): CrossDomainActivity {
  const theme = pickVisualTheme(seedKey, combo === "color_sorting" ? "sorting" : "counting");
  switch (combo) {
    case "fruit_addition":
      return { combo, prompt: `What is 2 + 3? Count the ${theme.label}!`, conceptIds: ["math.addition.within5", "knowledge.world-discovery"], gameId: "addition" };
    case "animal_counting":
      return { combo, prompt: "How many dogs? Count them!", conceptIds: ["math.counting.objects", "knowledge.world-discovery"], gameId: "addition" };
    case "color_sorting":
      return { combo, prompt: "Find the red apples!", conceptIds: ["cognition.sorting", "knowledge.world-discovery"], gameId: "clean-up" };
    case "shape_counting":
      return { combo, prompt: "Find 3 circles!", conceptIds: ["geometry.shapes", "math.counting.objects"], gameId: "puzzle" };
    case "bird_classification":
      return { combo, prompt: "Which one is a bird?", conceptIds: ["knowledge.world-discovery", "cognition.visual-discrimination"], gameId: "discover" };
  }
}
