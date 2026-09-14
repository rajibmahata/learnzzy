import { getLearner, setLearnerLevel } from "@/repositories/learners";
import { getLevelConfig } from "@/repositories/levels";
import type { AgeBand } from "@/repositories/learners";

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

export async function checkPromotion(learnerId: string, gameId: string, accuracy: number): Promise<PromotionCheck> {
  const learner = await getLearner(learnerId);
  if (!learner) return { shouldPromote: false, newLevel: 1, reason: "learner not found" };
  const cur = learner.level;
  if (cur >= 5) return { shouldPromote: false, newLevel: cur, reason: "max level" };
  const prog = learner.gameProgress?.[gameId];
  const completions = prog?.completions ?? 0;
  // Need sufficient practice before promotion
  if (completions < PROMOTION.minCompletions) return { shouldPromote: false, newLevel: cur, reason: `need ${PROMOTION.minCompletions} completions, have ${completions}` };
  if (accuracy < PROMOTION.minAccuracy) return { shouldPromote: false, newLevel: cur, reason: `accuracy ${accuracy} < ${PROMOTION.minAccuracy}` };
  // Also check age-band level config exists for next level
  const nextConfig = await getLevelConfig(cur + 1, learner.ageBand as AgeBand);
  if (!nextConfig) return { shouldPromote: false, newLevel: cur, reason: "next level config missing" };
  return { shouldPromote: true, newLevel: cur + 1, reason: `accuracy ${accuracy} over ${completions} completions` };
}

export async function maybePromote(learnerId: string, gameId: string, accuracy: number): Promise<{ promoted: boolean; level: number; reason: string }> {
  const check = await checkPromotion(learnerId, gameId, accuracy);
  if (!check.shouldPromote) return { promoted: false, level: check.newLevel, reason: check.reason };
  const updated = await setLearnerLevel(learnerId, check.newLevel);
  return { promoted: true, level: updated?.level ?? check.newLevel, reason: check.reason };
}
