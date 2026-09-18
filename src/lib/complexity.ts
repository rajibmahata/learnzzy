// Complexity model — deterministic, dependency-free (spec §5/§27).
// NEVER hard-code complexity inside React components: callers resolve a
// ComplexityProfile from (ageBand, skillLevel) and pass it to generators.
// Baseline matrix is the spec §27 table; performance moves ±1 level inside
// the age-appropriate range via skillLevels (never a developmental jump).

export type AgeBand = "4-5" | "6-7" | "8-9";

export interface ComplexityProfile {
  ageBand: AgeBand;
  /** Effective skill level 1..5 (per-skill, from skillLevels). */
  difficulty: number;
  cognitiveLoad: number;
  visualComplexity: number;
  numberRange: number;
  optionCount: number;
  distractorCount: number;
  steps: number;
  hintLevel: number;
  /** Always 0 for Learnzzy (calm, no time pressure). */
  timePressure: number;
  readingRequirement: number;
  writingRequirement: number;
  /** Concrete visual objects accompany the problem (emoji scenes, groups). */
  visualSupport: boolean;
  itemCount: number;
}

interface Baseline {
  numberRange: number;
  optionCount: number;
  itemCount: number;
  steps: number;
  readingRequirement: number;
  writingRequirement: number;
  visualComplexity: number;
}

/** Spec §27 baseline per skill family × age band. */
const BASELINES: Record<string, Record<AgeBand, Baseline>> = {
  counting: {
    "4-5": { numberRange: 10, optionCount: 3, itemCount: 3, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 1 },
    "6-7": { numberRange: 50, optionCount: 4, itemCount: 5, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 2 },
    "8-9": { numberRange: 100, optionCount: 4, itemCount: 6, steps: 2, readingRequirement: 1, writingRequirement: 0, visualComplexity: 2 },
  },
  ordering: {
    "4-5": { numberRange: 10, optionCount: 3, itemCount: 3, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 1 },
    "6-7": { numberRange: 25, optionCount: 4, itemCount: 4, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 2 },
    "8-9": { numberRange: 100, optionCount: 4, itemCount: 6, steps: 2, readingRequirement: 1, writingRequirement: 0, visualComplexity: 2 },
  },
  addition: {
    "4-5": { numberRange: 10, optionCount: 3, itemCount: 3, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 1 },
    "6-7": { numberRange: 50, optionCount: 4, itemCount: 4, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 2 },
    "8-9": { numberRange: 100, optionCount: 4, itemCount: 4, steps: 2, readingRequirement: 1, writingRequirement: 0, visualComplexity: 2 },
  },
  subtraction: {
    "4-5": { numberRange: 10, optionCount: 3, itemCount: 3, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 1 },
    "6-7": { numberRange: 50, optionCount: 4, itemCount: 4, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 2 },
    "8-9": { numberRange: 100, optionCount: 4, itemCount: 4, steps: 2, readingRequirement: 1, writingRequirement: 0, visualComplexity: 2 },
  },
  shapes: {
    "4-5": { numberRange: 5, optionCount: 3, itemCount: 4, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 1 },
    "6-7": { numberRange: 15, optionCount: 4, itemCount: 8, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 2 },
    "8-9": { numberRange: 20, optionCount: 4, itemCount: 12, steps: 2, readingRequirement: 1, writingRequirement: 0, visualComplexity: 3 },
  },
  sorting: {
    "4-5": { numberRange: 10, optionCount: 2, itemCount: 4, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 1 },
    "6-7": { numberRange: 20, optionCount: 3, itemCount: 6, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 2 },
    "8-9": { numberRange: 50, optionCount: 4, itemCount: 8, steps: 2, readingRequirement: 1, writingRequirement: 0, visualComplexity: 2 },
  },
  phonics: {
    "4-5": { numberRange: 3, optionCount: 3, itemCount: 3, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 1 },
    "6-7": { numberRange: 4, optionCount: 4, itemCount: 4, steps: 1, readingRequirement: 1, writingRequirement: 1, visualComplexity: 2 },
    "8-9": { numberRange: 6, optionCount: 4, itemCount: 5, steps: 2, readingRequirement: 2, writingRequirement: 1, visualComplexity: 2 },
  },
  writing: {
    "4-5": { numberRange: 3, optionCount: 3, itemCount: 1, steps: 1, readingRequirement: 0, writingRequirement: 1, visualComplexity: 1 },
    "6-7": { numberRange: 4, optionCount: 4, itemCount: 1, steps: 1, readingRequirement: 1, writingRequirement: 2, visualComplexity: 2 },
    "8-9": { numberRange: 6, optionCount: 4, itemCount: 1, steps: 2, readingRequirement: 2, writingRequirement: 2, visualComplexity: 2 },
  },
  tracing: {
    "4-5": { numberRange: 3, optionCount: 3, itemCount: 1, steps: 1, readingRequirement: 0, writingRequirement: 1, visualComplexity: 1 },
    "6-7": { numberRange: 6, optionCount: 4, itemCount: 1, steps: 1, readingRequirement: 0, writingRequirement: 1, visualComplexity: 2 },
    "8-9": { numberRange: 9, optionCount: 4, itemCount: 1, steps: 2, readingRequirement: 1, writingRequirement: 2, visualComplexity: 2 },
  },
  puzzles: {
    "4-5": { numberRange: 4, optionCount: 4, itemCount: 4, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 1 },
    "6-7": { numberRange: 9, optionCount: 4, itemCount: 9, steps: 2, readingRequirement: 0, writingRequirement: 0, visualComplexity: 2 },
    "8-9": { numberRange: 20, optionCount: 4, itemCount: 16, steps: 2, readingRequirement: 1, writingRequirement: 0, visualComplexity: 3 },
  },
  names: {
    "4-5": { numberRange: 10, optionCount: 3, itemCount: 3, steps: 1, readingRequirement: 0, writingRequirement: 1, visualComplexity: 1 },
    "6-7": { numberRange: 50, optionCount: 4, itemCount: 4, steps: 1, readingRequirement: 1, writingRequirement: 1, visualComplexity: 2 },
    "8-9": { numberRange: 100, optionCount: 4, itemCount: 4, steps: 2, readingRequirement: 1, writingRequirement: 2, visualComplexity: 2 },
  },
  patterns: {
    "4-5": { numberRange: 10, optionCount: 3, itemCount: 4, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 1 },
    "6-7": { numberRange: 20, optionCount: 4, itemCount: 6, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 2 },
    "8-9": { numberRange: 50, optionCount: 4, itemCount: 8, steps: 2, readingRequirement: 1, writingRequirement: 0, visualComplexity: 2 },
  },
  finding: {
    "4-5": { numberRange: 10, optionCount: 3, itemCount: 3, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 1 },
    "6-7": { numberRange: 20, optionCount: 4, itemCount: 5, steps: 1, readingRequirement: 0, writingRequirement: 0, visualComplexity: 2 },
    "8-9": { numberRange: 50, optionCount: 4, itemCount: 6, steps: 2, readingRequirement: 1, writingRequirement: 0, visualComplexity: 2 },
  },
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.floor(n) || lo));
}

function familyForSkill(skill: string): string {
  const s = skill.toLowerCase();
  if (s.includes("count")) return "counting";
  if (s.includes("order") || s.includes("before") || s.includes("after") || s.includes("sequenc")) return "ordering";
  if (s.includes("add")) return "addition";
  if (s.includes("subtract")) return "subtraction";
  if (s.includes("shape")) return "shapes";
  if (s.includes("sort") || s.includes("classif")) return "sorting";
  if (s.includes("names") || s.includes("tens") || s.includes("number-name")) return "names";
  if (s.includes("more") || s.includes("less")) return "counting";
  if (s.includes("phonics") || s.includes("word") || s.includes("read") || s.includes("letter")) return "phonics";
  if (s.includes("writ") || s.includes("trace")) return "writing";
  if (s.includes("draw") || s.includes("sketch") || s.includes("symmetr")) return "tracing";
  if (s.includes("puzzle")) return "puzzles";
  if (s.includes("memory") || s.includes("odd-one") || s.includes("matching")) return "patterns";
  if (s.includes("pattern") || s.includes("logic") || s.includes("memory") || s.includes("match")) return "patterns";
  return "finding";
}

/**
 * Resolve a reusable complexity profile. Skill level nudges item counts and
 * option counts ±1 inside the age baseline — it NEVER changes the age band's
 * number range by more than one step, so personalization stays
 * developmentally appropriate.
 */
export function resolveComplexity(
  skill: string,
  ageBand: AgeBand,
  skillLevel: number
): ComplexityProfile {
  const band: AgeBand = ageBand === "4-5" || ageBand === "6-7" || ageBand === "8-9" ? ageBand : "6-7";
  const level = clamp(skillLevel, 1, 5);
  const base = (BASELINES[familyForSkill(skill)] ?? BASELINES.finding)[band];
  // Skill level gently widens/narrows the problem inside the age baseline:
  // +1 item at level 4+; option counts stay at the age baseline (2–4).
  const itemCount = clamp(base.itemCount + (level >= 4 ? 1 : 0), 2, 12);
  const optionCount = clamp(base.optionCount, 2, 4);
  return {
    ageBand: band,
    difficulty: level,
    cognitiveLoad: clamp(level, 1, 3),
    visualComplexity: base.visualComplexity,
    numberRange: base.numberRange,
    optionCount,
    distractorCount: Math.max(1, optionCount - 1),
    steps: level >= 4 ? Math.min(3, base.steps + 1) : base.steps,
    hintLevel: band === "4-5" ? 2 : 1,
    timePressure: 0,
    readingRequirement: base.readingRequirement,
    writingRequirement: base.writingRequirement,
    // Young learners always get concrete visuals; older learners at higher
    // skill levels graduate to abstract (number-only) presentations.
    visualSupport: band !== "8-9" || level < 3,
    itemCount,
  };
}

export function normalizeAgeBand(v: unknown): AgeBand {
  return v === "4-5" || v === "6-7" || v === "8-9" ? v : "6-7";
}
