// Activity Variety Engine — deterministic, no LLM, no gameplay block.
// Tracks recent fingerprints (type/game/mechanic/theme/world/contentId/reward/difficulty)
// and penalizes repetition. Reuses existing gameProgress + lastResult signals;
// no second personalization system.

export interface ActivityFingerprint {
  activityId: string;
  type: string; // LearningActivityType
  gameId?: string; // href game or id
  mechanic: string;
  theme: string;
  world: string;
  contentId?: string;
  rewardCategory?: string;
  difficulty: number;
}

export interface VarietySignals {
  recentFingerprints: ActivityFingerprint[]; // last 6–10, most recent first
  recentWorlds: string[];
  recentMechanics: string[];
  recentThemes: string[];
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Deterministic penalty 0..3 based on how recently this fingerprint was seen. */
export function repetitionPenalty(candidate: ActivityFingerprint, signals: VarietySignals): number {
  let penalty = 0;
  const recent = signals.recentFingerprints.slice(0, 8);
  for (let i = 0; i < recent.length; i++) {
    const r = recent[i]!;
    const recencyWeight = 1 - i * 0.12; // most recent hurts most
    if (r.activityId === candidate.activityId) penalty += 2.2 * recencyWeight;
    if (r.mechanic === candidate.mechanic) penalty += 0.9 * recencyWeight;
    if (r.theme === candidate.theme) penalty += 0.35 * recencyWeight;
    if (r.world === candidate.world) penalty += 0.45 * recencyWeight;
    if (r.contentId && candidate.contentId && r.contentId === candidate.contentId) penalty += 2.0 * recencyWeight;
    if (r.gameId && candidate.gameId && r.gameId === candidate.gameId) penalty += 0.6 * recencyWeight;
  }
  // Hard cap so learning need can still win
  return Math.min(3.0, penalty);
}

/** Checks if candidate would repeat the same type/world 3 times in a row. */
export function isBoringRepeat(candidate: ActivityFingerprint, signals: VarietySignals): boolean {
  const lastTwo = signals.recentFingerprints.slice(0, 2);
  if (lastTwo.length < 2) return false;
  return lastTwo.every((r) => r.world === candidate.world || r.mechanic === candidate.mechanic);
}

/** Tiny jitter for deterministic variety after personalization (±0.025). */
export function varietyJitter(learnerId: string, activityId: string, globalLevel: number): number {
  let h = 2166136261;
  const s = `${learnerId}:${activityId}:${globalLevel}`;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000 * 0.05 - 0.025;
}

export function buildVarietySignalsFromLearner(learner: { gameProgress?: Record<string, unknown>; lastResult?: { gameId?: string } } | null, recentActivities: LearningAdventureActivityRef[]): VarietySignals {
  // Minimal signals from learner + explicit recent activity refs (from analytics)
  return {
    recentFingerprints: recentActivities.map((a) => a.fingerprint).slice(0, 8),
    recentWorlds: recentActivities.map((a) => a.fingerprint.world).slice(0, 8),
    recentMechanics: recentActivities.map((a) => a.fingerprint.mechanic).slice(0, 8),
    recentThemes: recentActivities.map((a) => a.fingerprint.theme).slice(0, 8),
  };
}

export interface LearningAdventureActivityRef {
  fingerprint: ActivityFingerprint;
  completedAt: string;
}

// For testing: BAD sequence is all same world/mechanic
export function isGoodVariety(sequence: ActivityFingerprint[]): boolean {
  // No 3 in a row same world or mechanic
  for (let i = 2; i < sequence.length; i++) {
    if (sequence[i]!.world === sequence[i - 1]!.world && sequence[i]!.world === sequence[i - 2]!.world) return false;
    if (sequence[i]!.mechanic === sequence[i - 1]!.mechanic && sequence[i]!.mechanic === sequence[i - 2]!.mechanic) return false;
  }
  return true;
}
