// Learning Adventure Engine — the most important part (spec §16).
// Deterministic, failure-isolated, reuses PersonalizationService + VarietyEngine.
// Do NOT use LLM for scoring/correctness/progression; AI only enriches via gateway.

import { getLearner } from "@/repositories/learners";
import { LEARNING_ACTIVITY_REGISTRY, type LearningActivity } from "./learningActivities.ts";
import { LEARNING_WORLDS } from "./learningWorlds.ts";
import { repetitionPenalty, isBoringRepeat, varietyJitter, type ActivityFingerprint, type VarietySignals } from "./activityVarietyEngine.ts";
import { resolveComplexity, type AgeBand } from "./complexity.ts";
import { evaluateSkill, type SkillHistory } from "./skillLevels.ts";
import { WORLD_EVENT_CONFIGS } from "./worldRewards.ts";

// Inputs — all from existing learner signals, never invented.
export interface AdventureEngineInput {
  learnerId: string;
  ageBand: AgeBand;
  globalLevel: number;
  skill: string;
  recentPerformance: { accuracy: number; attempts: number; responseTimeMs: number; hints: number } | null;
  recentMistakes: string[];
  completedActivityIds: string[];
  abandonedActivityIds: string[];
  recentFingerprints: ActivityFingerprint[]; // last 6–8 from analytics
  recentGameTypes: string[];
  recentMechanics: string[];
  recentThemes: string[];
  interests: Record<string, number>;
  unlockedRewardIds: string[];
  contentAvailability: Record<string, boolean>; // activityId → pool has content
  recentCognitiveLoad: number; // 0..1, avg time/hints
}

export interface NextLearningActivity {
  activity: LearningActivity;
  reason: string; // parent-safe, short, deterministic
  priority: number;
  explainability: { skill: string; difficulty: number; theme: string; reason: string };
  href: string;
}

// Lightweight mastery from gameProgress (reuses evaluateSkill)
function masteryForSkill(learner: Awaited<ReturnType<typeof getLearner>>, skill: string): number {
  const prog = (learner?.gameProgress as Record<string, { recentAccuracy?: number[] }> | undefined)?.[skill];
  const recent = prog?.recentAccuracy ?? [];
  if (recent.length === 0) return 0.5;
  const history: SkillHistory = { completions: recent.length, recentAccuracy: recent.slice(-5), hintsUsed: 0 };
  return evaluateSkill(history).avgAccuracy;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export async function recommendNextActivity(input: AdventureEngineInput): Promise<NextLearningActivity | null> {
  const learner = await getLearner(input.learnerId).catch(() => null);
  const ageBand = input.ageBand ?? (learner?.ageBand as AgeBand) ?? "6-7";
  const globalLevel = input.globalLevel ?? (learner?.level ?? 1);

  // Eligible by age, status, and pool availability
  let eligible = LEARNING_ACTIVITY_REGISTRY.filter(
    (a) => a.status === "active" && (a.ageBands as string[]).includes(ageBand) && (input.contentAvailability[a.id] ?? true)
  );
  // Fallback to any active if none available for this age
  if (eligible.length === 0) eligible = LEARNING_ACTIVITY_REGISTRY.filter((a) => a.status === "active");

  const ownedWorldEvents = input.unlockedRewardIds.map((id) => WORLD_EVENT_CONFIGS[id]).filter(Boolean);
  const ownedThemes = new Set(ownedWorldEvents.flatMap((e) => e.learningThemes));
  const ownedGameAffinity = new Set(ownedWorldEvents.flatMap((e) => e.gameAffinity));

  const signals: VarietySignals = {
    recentFingerprints: input.recentFingerprints.slice(0, 8),
    recentWorlds: input.recentThemes,
    recentMechanics: input.recentMechanics,
    recentThemes: input.recentThemes,
  };

  const scored = eligible.map((a) => {
    const skillMastery = masteryForSkill(learner, a.skill);
    const interest = input.interests[a.id] ?? input.interests[a.skill] ?? input.interests[a.world] ?? 0;
    const completions = input.completedActivityIds.filter((id) => id === a.id).length;
    const abandonedPenalty = input.abandonedActivityIds.includes(a.id) ? 0.8 : 0;

    let need = 0;
    if (completions === 0) need = 2.5;
    else if (skillMastery < 0.5) need = 3;
    else if (skillMastery < 0.7) need = 2;
    else if (skillMastery < 0.85) need = 1;
    else need = 0.3;

    // If same skill but different mechanic, keep need but variety will boost
    const sameSkillPenalty = input.recentGameTypes.includes(a.skill) ? 0.4 : 0;

    const fingerprint: ActivityFingerprint = {
      activityId: a.id,
      type: a.type,
      gameId: a.href?.split("/").pop() ?? a.id,
      mechanic: a.mechanics[0] ?? a.category,
      theme: a.theme,
      world: a.world,
      difficulty: a.difficulty,
    };
    const varietyPenalty = repetitionPenalty(fingerprint, signals);
    const boringExtra = isBoringRepeat(fingerprint, signals) ? 1.2 : 0;
    const cognitivePenalty = input.recentCognitiveLoad > 0.7 && a.estimatedDuration > 6 ? 0.5 : 0;

    const interestBoost = interest * 0.45;
    const masteryGap = (0.8 - skillMastery) * 1.0;
    let worldBoost = 0;
    if (ownedGameAffinity.has(a.skill) || ownedGameAffinity.has(a.world)) worldBoost += 0.25;
    if (ownedThemes.has(a.theme) || ownedThemes.has(a.world)) worldBoost += 0.1;
    worldBoost = Math.min(0.35, worldBoost);

    const recentMistakeBoost = input.recentMistakes.includes(a.skill) ? 0.6 : 0;
    // Recent performance: if struggling, prefer lower cognitive load + same skill different mechanic
    const struggleBoost = input.recentPerformance && input.recentPerformance.accuracy < 0.5 && a.skill === input.skill ? 0.5 : 0;

    const jitter = varietyJitter(input.learnerId, a.id, globalLevel);
    const priority = interestBoost + need * 1.25 + masteryGap * 1.1 - varietyPenalty - boringExtra - cognitivePenalty - abandonedPenalty - sameSkillPenalty + worldBoost + recentMistakeBoost + struggleBoost + jitter;

    let reason = "variety";
    if (need >= 2.5) reason = "discovery";
    else if (skillMastery < 0.5) reason = "needs_practice";
    else if (interest > 2) reason = "interest";
    else if (varietyPenalty > 1) reason = "variety";
    else if (a.skill === input.skill && input.recentPerformance && input.recentPerformance.accuracy < 0.6) reason = "same-skill-different-way";

    return { activity: a, fingerprint, priority, reason, mastery: skillMastery };
  });

  scored.sort((x, y) => y.priority - x.priority);

  // Safety: never recommend rejected/external without approval
  const safe = scored.filter((s) => s.activity.safetyStatus === "approved" && s.activity.type !== "EXTERNAL_STORY");
  // If only external remains, include but flag parentApprovalRequired downstream
  const pool = safe.length > 0 ? safe : scored.slice(0, 1);
  const top = pool[0];
  if (!top) return null;

  const effectiveLevel = Math.max(1, Math.min(5, globalLevel + (top.mastery >= 0.85 ? 1 : top.mastery < 0.4 ? -1 : 0)));
  const complexity = resolveComplexity(top.activity.skill, ageBand, effectiveLevel);

  // Determine href: reuse existing game route or generic player
  const href = top.activity.href ?? `/learn/${top.activity.category}/${top.activity.id}`;

  return {
    activity: top.activity,
    reason: top.reason,
    priority: top.priority,
    explainability: { skill: top.activity.skill, difficulty: effectiveLevel, theme: top.activity.world, reason: top.reason },
    href,
  };
}

// Fallback when gateway/MCP unavailable — deterministic local scoring already above,
// so this is just a safe null → caller falls back to buildPersonalizedSessionPlan.
export async function recommendNextActivitySafe(input: AdventureEngineInput): Promise<NextLearningActivity | null> {
  try {
    return await recommendNextActivity(input);
  } catch {
    return null;
  }
}
