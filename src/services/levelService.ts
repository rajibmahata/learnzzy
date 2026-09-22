import { getLearner, setLearnerLevel, setGameLevel } from "@/repositories/learners";
import { getLevelConfig } from "@/repositories/levels";
import type { AgeBand } from "@/repositories/learners";
import { decideSkillLevel, evaluateSkill, skillLevelFor, type SkillAction } from "@/lib/skillLevels";

// Level promotion is deterministic + configurable (admin can tune via levels collection).
// DO NOT promote aggressively after single success (BR-084).

export interface PromotionCheck {
  shouldPromote: boolean;
  newLevel: number;
  reason: string;
}

// Configurable thresholds (could be stored in systemSettings; using defaults here for determinism)
const PROMOTION = {
  minCompletions: 3, // need at least 3 completions at current level
  minAccuracy: 0.8, // 80% accuracy
  minSampleForAuto: 50, // for server-side aggregate (like DifficultyAgent)
};

export async function checkPromotion(learnerId: string, _gameId: string, accuracy: number): Promise<PromotionCheck> {
  const learner = await getLearner(learnerId);
  if (!learner) return { shouldPromote: false, newLevel: 1, reason: "learner not found" };
  const cur = learner.level;
  if (cur >= 6) return { shouldPromote: false, newLevel: cur, reason: "max level" };
  // Global promotion: consider overall progress across all games, not single game
  const allProgress = Object.values(learner.gameProgress ?? {});
  const totalCompletions = allProgress.reduce((sum, p) => sum + (p.completions ?? 0), 0);
  const allRecent = allProgress.flatMap((p) => p.recentAccuracy ?? []);
  const recentAvg = allRecent.length ? allRecent.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, allRecent.length) : accuracy;
  if (totalCompletions < PROMOTION.minCompletions) return { shouldPromote: false, newLevel: cur, reason: `need ${PROMOTION.minCompletions} total completions, have ${totalCompletions}` };
  if (recentAvg < PROMOTION.minAccuracy) return { shouldPromote: false, newLevel: cur, reason: `recent avg ${recentAvg.toFixed(2)} < ${PROMOTION.minAccuracy}` };
  // Also require at least 2 different games played for global journey
  const distinctGames = Object.keys(learner.gameProgress ?? {}).length;
  if (distinctGames < 2 && totalCompletions < 6) return { shouldPromote: false, newLevel: cur, reason: `need variety: ${distinctGames} games played` };
  // Also check age-band level config exists for next level
  const nextConfig = await getLevelConfig(cur + 1, learner.ageBand as AgeBand);
  if (!nextConfig) {
    // Allow up to level 6 even if config missing (fallback)
    if (cur + 1 > 5) return { shouldPromote: true, newLevel: cur + 1, reason: `overall avg ${recentAvg.toFixed(2)} over ${totalCompletions} completions` };
    return { shouldPromote: false, newLevel: cur, reason: "next level config missing" };
  }
  return { shouldPromote: true, newLevel: cur + 1, reason: `overall avg ${recentAvg.toFixed(2)} over ${totalCompletions} completions` };
}

export async function maybePromote(learnerId: string, gameId: string, accuracy: number): Promise<{ promoted: boolean; level: number; reason: string }> {
  const check = await checkPromotion(learnerId, gameId, accuracy);
  if (!check.shouldPromote) return { promoted: false, level: check.newLevel, reason: check.reason };
  const updated = await setLearnerLevel(learnerId, check.newLevel);
  return { promoted: true, level: updated?.level ?? check.newLevel, reason: check.reason };
}

export interface SkillAdjustment {
  action: SkillAction;
  level: number;
  reason: string;
  message: string;
  evaluation: { sampleSize: number; avgAccuracy: number; trend: string; masteryPct: number };
}

/**
 * Per-skill adaptive step (one game only — sibling skills untouched).
 * Reads that game's rolling history, decides promote/stabilize/reduce, and
 * persists the per-game level. Deterministic and testable; the global
 * journey level (maybePromote) remains a separate authority.
 */
export async function maybeAdjustSkill(learnerId: string, gameId: string): Promise<SkillAdjustment> {
  const learner = await getLearner(learnerId);
  const fallback = { action: "stabilize" as const, level: 1, reason: "learner not found", message: "Let's practice a little more!", evaluation: { sampleSize: 0, avgAccuracy: 0, trend: "steady", masteryPct: 0 } };
  if (!learner) return fallback;
  const current = skillLevelFor(learner, gameId);
  const prog = learner.gameProgress?.[gameId];
  const history = {
    completions: prog?.completions ?? 0,
    recentAccuracy: prog?.recentAccuracy ?? [],
    hintsUsed: prog?.hintsUsed ?? 0,
    recentResponseTime: (prog as unknown as { recentResponseTime?: number[] })?.recentResponseTime ?? [],
    recentAttempts: (prog as unknown as { recentAttempts?: number[] })?.recentAttempts ?? [],
  };
  const evaluation = evaluateSkill(history);
  const decision = decideSkillLevel(current, history);
  if (decision.newLevel !== current) {
    await setGameLevel(learnerId, gameId, decision.newLevel);
  }
  return { action: decision.action, level: decision.newLevel, reason: decision.reason, message: decision.message, evaluation };
}
