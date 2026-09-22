// Per-skill adaptive levels — deterministic, dependency-free so unit tests
// import the real code (same convention as pool-client). One skill NEVER
// changes another: every function below evaluates exactly one game's history.
//
// Rules (BR-083/084, preserved baseline: 3+ completions at 80%+):
// - promote: sample >= 3 completions AND rolling avg (last 5) >= 0.80 → +1 (max 5)
// - reduce: sample >= 5 AND rolling avg < 0.50 → -1 (min 1), never a punishment:
//   the child sees extra practice first (stabilize), reduction only after
//   repeated weak results
// - otherwise stabilize (stay, practice message)
// - decisions use rolling history, never a single result

export const SKILL_GAMES = ["addition", "subtraction", "clean-up", "puzzle", "sketch", "discover"] as const;
export type SkillGameId = (typeof SKILL_GAMES)[number];

export const SKILL_DISPLAY: Record<string, string> = {
  addition: "Addition",
  subtraction: "Subtraction",
  "clean-up": "Finding",
  puzzle: "Finding",
  sketch: "Drawing",
  discover: "Discover",
};

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 100;
const PROMOTE_COMPLETIONS = 3;
const PROMOTE_ACCURACY = 0.8;
const REDUCE_SAMPLES = 5;
const REDUCE_ACCURACY = 0.5;
const WINDOW = 5;

export interface SkillHistory {
  completions: number;
  /** Rolling accuracies, oldest → newest, capped at 10 by the repository. */
  recentAccuracy: number[];
  hintsUsed?: number;
  /** Adaptive: rolling response times / attempts (additive, optional). */
  recentResponseTime?: number[];
  recentAttempts?: number[];
}

export interface SkillEvaluation {
  sampleSize: number;
  avgAccuracy: number;
  trend: "improving" | "steady" | "needs_practice" | "strong";
  masteryPct: number;
}

export type SkillAction = "promote" | "stabilize" | "reduce";

export interface SkillDecision {
  action: SkillAction;
  newLevel: number;
  reason: string;
  /** Child-safe message — encouragement, never judgment. */
  message: string;
}

function clampLevel(n: number): number {
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, Math.floor(n) || MIN_LEVEL));
}

/**
 * Effective skill level. Explicit per-game override wins; otherwise the skill
 * starts at foundation level 1. The global journey level NEVER lifts a skill
 * by itself — otherwise one result would promote twice (global + skill) in a
 * single step, and strength in one game would leak into unrelated games.
 * Pre-skill profiles re-climb quickly (3 strong rounds to leave L1).
 */
export function skillLevelFor(
  learner: { level?: number; gameLevels?: Record<string, number> },
  gameId: string
): number {
  const override = learner.gameLevels?.[gameId];
  if (typeof override === "number") return clampLevel(override);
  return MIN_LEVEL;
}

function rollingAvg(recent: number[]): number {
  const w = recent.slice(-WINDOW).filter((a) => Number.isFinite(a));
  if (w.length === 0) return 0;
  return w.reduce((s, a) => s + a, 0) / w.length;
}

export function evaluateSkill(history: SkillHistory): SkillEvaluation {
  const recent = (history.recentAccuracy ?? []).filter((a) => Number.isFinite(a)).slice(-10);
  const sampleSize = Math.min(history.completions, recent.length);
  const avgAccuracy = rollingAvg(recent);
  const prev = rollingAvg(recent.slice(0, -3));
  const last = rollingAvg(recent.slice(-3));
  let trend: SkillEvaluation["trend"] = "steady";
  if (sampleSize >= PROMOTE_COMPLETIONS && avgAccuracy >= PROMOTE_ACCURACY) {
    trend = avgAccuracy >= 0.9 ? "strong" : "improving";
  } else if (sampleSize >= 2 && avgAccuracy < 0.6) {
    trend = "needs_practice";
  } else if (last - prev >= 0.1 && sampleSize >= 4) {
    trend = "improving";
  }
  return {
    sampleSize,
    avgAccuracy: Math.max(0, Math.min(1, avgAccuracy)),
    trend,
    masteryPct: Math.round(Math.max(0, Math.min(1, avgAccuracy)) * 100),
  };
}

export function decideSkillLevel(currentLevel: number, history: SkillHistory): SkillDecision {
  const cur = clampLevel(currentLevel);
  const evaluation = evaluateSkill(history);
  const { sampleSize, avgAccuracy } = evaluation;
  // Adaptive: hints and responseTime make promotion a bit more conservative when present
  const hintRate = history.hintsUsed ? history.hintsUsed / Math.max(1, history.completions) : 0;
  const avgResponseTime = history.recentResponseTime?.length ? history.recentResponseTime.reduce((a, b) => a + b, 0) / history.recentResponseTime.length : 0;
  const needsMorePractice = hintRate > 0.8 || avgResponseTime > 8000;
  if (sampleSize >= PROMOTE_COMPLETIONS && avgAccuracy >= PROMOTE_ACCURACY && cur < MAX_LEVEL) {
    if (needsMorePractice && sampleSize < PROMOTE_COMPLETIONS + 1) {
      return {
        action: "stabilize",
        newLevel: cur,
        reason: `avg ${Math.round(avgAccuracy * 100)}% but high hints/slow response — one more practice`,
        message: "Let's practice a little more!",
      };
    }
    return {
      action: "promote",
      newLevel: cur + 1,
      reason: `avg ${Math.round(avgAccuracy * 100)}% over last ${Math.min(sampleSize, WINDOW)} activities (${history.completions} completions)`,
      message: "Great! Ready for a new challenge?",
    };
  }
  if (sampleSize >= REDUCE_SAMPLES && avgAccuracy < REDUCE_ACCURACY && cur > MIN_LEVEL) {
    return {
      action: "reduce",
      newLevel: cur - 1,
      reason: `avg ${Math.round(avgAccuracy * 100)}% over last ${Math.min(sampleSize, WINDOW)} activities — easing back one level`,
      message: "Let's practice a little more!",
    };
  }
  return {
    action: "stabilize",
    newLevel: cur,
    reason:
      sampleSize < PROMOTE_COMPLETIONS
        ? `need ${PROMOTE_COMPLETIONS} completions, have ${sampleSize}`
        : `avg ${Math.round(avgAccuracy * 100)}% — practicing at this level`,
    message: "Let's practice a little more!",
  };
}

/** Parent-facing one-liners generated from real evaluation data (no AI prose). */
export function skillSummaryLine(gameId: string, level: number, evaluation: SkillEvaluation): string {
  const name = SKILL_DISPLAY[gameId] ?? gameId;
  if (evaluation.trend === "strong") return `Strong recent performance in ${name.toLowerCase()}.`;
  if (evaluation.trend === "needs_practice") return `${name} needs more practice (Level ${level}).`;
  return `${name} is practicing at Level ${level}.`;
}
